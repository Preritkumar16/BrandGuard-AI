import os
import uuid
from typing import List, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.source_version import SourceVersion, SourceStatus
from app.services.chunking import chunk_text

_embedding_model = None

def get_embedding_model():
    """Lazy load sentence transformer model to prevent module-import-time blocking."""
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model

qdrant_client = QdrantClient(host="localhost", port=6333)
COLLECTION_NAME = "brand_source_chunks"

def ensure_collection():
    collections = qdrant_client.get_collections().collections
    if not any(c.name == COLLECTION_NAME for c in collections):
        qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )

def index_source_version(organisation_id: str, source_version_id: str, extracted_text: str):
    ensure_collection()
    chunks = chunk_text(extracted_text)
    if not chunks:
        return 0

    model = get_embedding_model()
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False)

    points = []
    for chunk, vector in zip(chunks, embeddings):
        points.append(
            models.PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL,f"{source_version_id}:{chunk['passage_id']}")),
                vector=vector.tolist(),
                payload={
                    "organisation_id": organisation_id,
                    "source_version_id": source_version_id,
                    "passage_id": chunk["passage_id"],
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"],
                    "span_start": chunk["span_start"],
                    "span_end": chunk["span_end"]
                }
            )
        )

    qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)
    return len(points)

async def search_and_validate_guidelines(
    db: AsyncSession, 
    organisation_id: str, 
    query_text: str, 
    limit: int = 3
) -> List[dict]:
    """
    Performs tenant-filtered Qdrant search and verifies in PostgreSQL 
    that each candidate source version is APPROVED and applicable.
    """
    ensure_collection()
    model = get_embedding_model()
    query_vector = model.encode(query_text).tolist()

    # Use query_points for qdrant-client >= 1.10+
    search_result = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="organisation_id",
                    match=models.MatchValue(value=organisation_id)
                )
            ]
        ),
        limit=limit * 2
    ).points  # .points extracts the list of ScoredPoint from QueryResponse

    validated_passages = []
    for hit in search_result:
        version_id = hit.payload.get("source_version_id")
        if not version_id:
            continue

        result = await db.execute(
            select(SourceVersion).filter(
                SourceVersion.id == version_id,
                SourceVersion.organisation_id == organisation_id,
                SourceVersion.status == SourceStatus.APPROVED
            )
        )
        source_version = result.scalars().first()

        if source_version:
            validated_passages.append({
                "passage_id": hit.payload["passage_id"],
                "source_version_id": version_id,
                "text": hit.payload["text"],
                "span_start": hit.payload.get("span_start"),
                "span_end": hit.payload.get("span_end"),
                "score": hit.score
            })

        if len(validated_passages) >= limit:
            break

    return validated_passages
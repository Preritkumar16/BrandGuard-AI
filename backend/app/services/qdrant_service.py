
import uuid
import logging
from typing import Any

from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.models.source_chunk import SourceChunk
from app.models.source_version import SourceVersion
from app.services.chunking import chunk_text

logger = logging.getLogger(__name__)

_embedding_model = None

qdrant_client = AsyncQdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY or None,
)
COLLECTION_NAME = settings.QDRANT_COLLECTION
VECTOR_SIZE = 384


def get_embedding_model():
    """Load the embedding model only when it is first needed."""
    global _embedding_model

    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer

        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

    return _embedding_model


async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Run blocking model loading and embedding outside the event loop."""
    def encode():
        model = get_embedding_model()
        vectors = model.encode(texts, show_progress_bar=False)
        return [vector.tolist() for vector in vectors]

    return await run_in_threadpool(encode)


async def ensure_collection() -> None:
    collections = await qdrant_client.get_collections()

    exists = any(
        collection.name == COLLECTION_NAME
        for collection in collections.collections
    )

    if not exists:
        await qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
        )


async def index_source_version(
    db: AsyncSession,
    organisation_id: str,
    source_version_id: str,
    extracted_text: str,
) -> int:
    """
    Persist authoritative passages in PostgreSQL and index their vectors
    in Qdrant.

    The caller owns the PostgreSQL transaction and must commit after this
    function succeeds.
    """
    chunks = chunk_text(extracted_text)

    if not chunks:
        raise ValueError("Cannot index a source with no extractable text.")

    version_result = await db.execute(
        select(SourceVersion).where(
            SourceVersion.id == uuid.UUID(source_version_id),
            SourceVersion.organisation_id == uuid.UUID(organisation_id),
        )
    )
    source_version = version_result.scalar_one_or_none()

    if source_version is None:
        raise ValueError("Source version not found for this organisation.")

    existing_result = await db.execute(
        select(SourceChunk).where(
            SourceChunk.source_version_id == source_version.id,
            SourceChunk.organisation_id == source_version.organisation_id,
        )
    )
    existing_chunks = {
        chunk.passage_id: chunk
        for chunk in existing_result.scalars().all()
    }

    passages: list[SourceChunk] = []

    for chunk in chunks:
        passage = existing_chunks.get(chunk["passage_id"])

        if passage is None:
            passage = SourceChunk(
                organisation_id=source_version.organisation_id,
                source_version_id=source_version.id,
                chunk_index=chunk["chunk_index"],
                passage_id=chunk["passage_id"],
                text=chunk["text"],
                locator={
                    "span_start": chunk["span_start"],
                    "span_end": chunk["span_end"],
                },
                meta_data={},
            )
            db.add(passage)
        else:
            passage.chunk_index = chunk["chunk_index"]
            passage.text = chunk["text"]
            passage.locator = {
                "span_start": chunk["span_start"],
                "span_end": chunk["span_end"],
            }

        passages.append(passage)

    # Make PostgreSQL records available before creating Qdrant points.
    await db.flush()

    await ensure_collection()

    texts = [chunk["text"] for chunk in chunks]
    embeddings = await generate_embeddings(texts)

    points = []

    for chunk, passage, vector in zip(chunks, passages, embeddings):
        point_id = str(
            uuid.uuid5(
                uuid.NAMESPACE_URL,
                f"{source_version_id}:{chunk['passage_id']}",
            )
        )

        passage.qdrant_point_id = point_id

        points.append(
            models.PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "organisation_id": organisation_id,
                    "source_version_id": source_version_id,
                    "passage_id": chunk["passage_id"],
                },
            )
        )

    await qdrant_client.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
        wait=True,
    )

    logger.info(
        "Indexed %s passages for source version %s",
        len(points),
        source_version_id,
    )

    return len(points)


async def search_and_validate_guidelines(
    db: AsyncSession,
    organisation_id: str,
    query_text: str,
    limit: int = 3,
) -> list[dict[str, Any]]:
    """
    Retrieve candidate IDs from Qdrant, then fetch authoritative passage
    text and offsets from PostgreSQL.
    """
    if limit <= 0:
        return []

    await ensure_collection()

    query_vectors = await generate_embeddings([query_text])
    query_vector = query_vectors[0]

    search_result = await qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="organisation_id",
                    match=models.MatchValue(value=organisation_id),
                )
            ]
        ),
        limit=limit * 3,
        with_payload=True,
    )

    validated_passages = []

    for hit in search_result.points:
        payload = hit.payload or {}

        passage_id = payload.get("passage_id")
        version_id = payload.get("source_version_id")

        if not passage_id or not version_id:
            continue

        result = await db.execute(
            select(SourceChunk, SourceVersion)
            .join(
                SourceVersion,
                (SourceChunk.source_version_id == SourceVersion.id)
                & (SourceChunk.organisation_id == SourceVersion.organisation_id),
            )
            .where(
                SourceChunk.organisation_id == uuid.UUID(organisation_id),
                SourceChunk.source_version_id == uuid.UUID(version_id),
                SourceChunk.passage_id == passage_id,
                SourceVersion.organisation_id == uuid.UUID(organisation_id),
            )
        )

        record = result.first()

        if record is None:
            continue

        passage, version = record

        if version.status.value != "APPROVED":
            continue

        if version.effective_from and version.effective_from > __import__(
            "datetime"
        ).date.today():
            continue

        if version.effective_to and version.effective_to < __import__(
            "datetime"
        ).date.today():
            continue

        # Only use PostgreSQL content, never text or offsets from Qdrant.
        validated_passages.append(
            {
                "passage_id": passage.passage_id,
                "source_version_id": str(passage.source_version_id),
                "text": passage.text,
                "span_start": passage.locator.get("span_start"),
                "span_end": passage.locator.get("span_end"),
                "score": hit.score,
            }
        )

        if len(validated_passages) >= limit:
            break

    return validated_passages

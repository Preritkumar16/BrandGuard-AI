
import os
import uuid
import hashlib
from datetime import date
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pypdf import PdfReader
from docx import Document

from app.database.session import get_db
from app.models.user import User
from app.models.brand_source import BrandSource
from app.models.source_version import SourceVersion, SourceStatus
from app.schemas.brand_source import BrandSourceResponse
from app.api.deps import get_current_user
from app.services.qdrant_service import index_source_version

router = APIRouter(prefix="/sources", tags=["Brand Sources"])

UPLOAD_DIR = Path("storage/sources")
EXTRACTED_TEXT_DIR = Path("storage/extracted_text")
MAX_FILE_SIZE = 15 * 1024 * 1024

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}


def extract_text(file_path: Path, extension: str, file_content: bytes) -> str:
    """Extract text from supported document formats."""

    if extension == ".pdf":
        reader = PdfReader(str(file_path))
        text = "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        )

    elif extension == ".docx":
        document = Document(str(file_path))
        text = "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        )

    else:
        text = file_content.decode("utf-8")

    text = text.strip()

    if not text:
        raise ValueError("No extractable text found in the uploaded document.")

    return text


@router.post(
    "/",
    response_model=BrandSourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_brand_source(
    name: str = Form(...),
    source_type: str = Form("guideline_pdf"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, TXT, and DOCX files are supported.",
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 15MB limit.",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    EXTRACTED_TEXT_DIR.mkdir(parents=True, exist_ok=True)

    file_id = uuid.uuid4()
    file_location = UPLOAD_DIR / f"{file_id}{extension}"
    extracted_text_location = EXTRACTED_TEXT_DIR / f"{file_id}.txt"

    try:
        file_location.write_bytes(file_content)

        extracted_text = extract_text(
            file_location,
            extension,
            file_content,
        )

        extracted_text_location.write_text(
            extracted_text,
            encoding="utf-8",
        )

    except UnicodeDecodeError:
        file_location.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail="TXT file must contain valid UTF-8 text.",
        )

    except Exception as exc:
        file_location.unlink(missing_ok=True)
        extracted_text_location.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Document text extraction failed: {str(exc)}",
        )

    content_hash = hashlib.sha256(file_content).hexdigest()

    try:
        brand_source = BrandSource(
            organisation_id=current_user.organisation_id,
            name=name,
            source_type=source_type,
            owner_user_id=current_user.id,
        )

        db.add(brand_source)
        await db.flush()

        source_version = SourceVersion(
            organisation_id=current_user.organisation_id,
            source_id=brand_source.id,
            version_number=1,
            effective_from=date.today(),
            status=SourceStatus.DRAFT,
            file_object_key=str(file_location),
            content_hash=content_hash,
            extracted_text_ref=str(extracted_text_location),
            created_by=current_user.id,
        )

        db.add(source_version)
        await db.flush()

        brand_source.current_version_id = source_version.id

        await db.commit()
        await db.refresh(brand_source)

    except Exception:
        await db.rollback()
        file_location.unlink(missing_ok=True)
        extracted_text_location.unlink(missing_ok=True)
        raise

    return BrandSourceResponse(
        id=str(brand_source.id),
        organisation_id=str(brand_source.organisation_id),
        name=brand_source.name,
        source_type=brand_source.source_type,
        owner_user_id=str(brand_source.owner_user_id),
        current_version_id=str(brand_source.current_version_id),
        created_at=brand_source.created_at,
    )


@router.get("/", response_model=list[BrandSourceResponse])
async def list_brand_sources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BrandSource).where(
            BrandSource.organisation_id == current_user.organisation_id
        )
    )

    sources = result.scalars().all()

    return [
        BrandSourceResponse(
            id=str(source.id),
            organisation_id=str(source.organisation_id),
            name=source.name,
            source_type=source.source_type,
            owner_user_id=str(source.owner_user_id),
            current_version_id=(
                str(source.current_version_id)
                if source.current_version_id
                else None
            ),
            created_at=source.created_at,
        )
        for source in sources
    ]


@router.post("/{source_id}/versions/{version_id}/approve", response_model=dict)
async def approve_brand_source_version(
    source_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SourceVersion).where(
            SourceVersion.id == uuid.UUID(version_id),
            SourceVersion.source_id == uuid.UUID(source_id),
            SourceVersion.organisation_id == current_user.organisation_id,
        )
    )

    version = result.scalar_one_or_none()

    if version is None:
        raise HTTPException(
            status_code=404,
            detail="Source version not found.",
        )

    if version.status != SourceStatus.DRAFT:
        raise HTTPException(
            status_code=409,
            detail="Only draft source versions can be approved.",
        )

    if version.created_by == current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Author cannot approve their own brand source version.",
        )

    if not version.extracted_text_ref:
        raise HTTPException(
            status_code=422,
            detail="Extracted source text is unavailable.",
        )

    extracted_text_path = Path(version.extracted_text_ref)

    if not extracted_text_path.is_file():
        raise HTTPException(
            status_code=422,
            detail="Extracted source text file is missing.",
        )

    extracted_text = extracted_text_path.read_text(encoding="utf-8")

    try:
        indexed_count = await index_source_version(
            db=db,
            organisation_id=str(current_user.organisation_id),
            source_version_id=str(version.id),
            extracted_text=extracted_text,
        )

        version.status = SourceStatus.APPROVED
        version.approved_by = current_user.id

        await db.commit()

    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Source indexing or approval failed. The source remains unapproved; please retry.",
        )

    return {
        "message": "Source version approved and indexed successfully.",
        "version_id": str(version.id),
        "indexed_passages": indexed_count,
        "status": "APPROVED",
    }

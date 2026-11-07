import os
import uuid
import hashlib
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database.session import get_db
from app.models.user import User
from app.models.brand_source import BrandSource
from app.models.source_version import SourceVersion, SourceStatus
from app.schemas.brand_source import BrandSourceResponse
from app.api.deps import get_current_user
from pypdf import PdfReader

router = APIRouter(prefix="/sources", tags=["Brand Sources"])

UPLOAD_DIR = "storage/sources"
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB limit

@router.post("/", response_model=BrandSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_brand_source(
    name: str = Form(...),
    source_type: str = Form("guideline_pdf"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Validate file extension and size
    if not file.filename or not (file.filename.endswith(".pdf") or file.filename.endswith(".txt") or file.filename.endswith(".docx")):
        raise HTTPException(status_code=400, detail="Unsupported file format. Only PDF, TXT, and DOCX are allowed.")
    
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 15MB limit.")

    # 2. Save securely with a generated unique filename
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_location = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_location, "wb+") as file_object:
        file_object.write(file_content)

    # 3. Compute content hash & extract text
    content_hash = hashlib.sha256(file_content).hexdigest()
    
    extracted_text = ""
    if file.filename.endswith(".pdf"):
        try:
            reader = PdfReader(file_location)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        except Exception:
            extracted_text = "Failed to parse PDF text."
    else:
        try:
            extracted_text = file_content.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = ""

    # 4. Create Brand Source record (Tenant Isolated)
    brand_source = BrandSource(
        organisation_id=current_user.organisation_id,
        name=name,
        source_type=source_type,
        owner_user_id=current_user.id
    )
    db.add(brand_source)
    await db.commit()
    await db.refresh(brand_source)

    # 5. Create Initial Source Version (v1) in DRAFT status (Strict governance rule: no auto-self-approval)
    source_version = SourceVersion(
        organisation_id=current_user.organisation_id,
        source_id=brand_source.id,
        version_number=1,
        effective_from=date.today(),
        status=SourceStatus.DRAFT,
        file_object_key=file_location,
        content_hash=content_hash,
        extracted_text_ref=extracted_text,
        created_by=current_user.id
    )
    db.add(source_version)
    await db.commit()
    await db.refresh(source_version)

    # 6. Link current version pointer
    brand_source.current_version_id = source_version.id
    await db.commit()
    await db.refresh(brand_source)

    return BrandSourceResponse(
        id=str(brand_source.id),
        organisation_id=str(brand_source.organisation_id),
        name=brand_source.name,
        source_type=brand_source.source_type,
        owner_user_id=str(brand_source.owner_user_id),
        current_version_id=str(brand_source.current_version_id),
        created_at=brand_source.created_at
    )

@router.get("/", response_model=list[BrandSourceResponse])
async def list_brand_sources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(BrandSource).filter(BrandSource.organisation_id == current_user.organisation_id)
    )
    sources = result.scalars().all()
    return [
        BrandSourceResponse(
            id=str(s.id),
            organisation_id=str(s.organisation_id),
            name=s.name,
            source_type=s.source_type,
            owner_user_id=str(s.owner_user_id),
            current_version_id=str(s.current_version_id) if s.current_version_id else None,
            created_at=s.created_at
        )
        for s in sources
    ]
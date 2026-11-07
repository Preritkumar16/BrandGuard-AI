import os
import hashlib
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.brand_source import BrandSource
from app.models.source_version import SourceVersion, SourceStatus
from app.schemas.brand_source import BrandSourceResponse, SourceVersionResponse
from app.api.deps import get_current_user
from pypdf import PdfReader

router = APIRouter(prefix="/sources", tags=["Brand Sources"])

UPLOAD_DIR = "storage/sources"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=BrandSourceResponse, status_code=status.HTTP_201_CREATED)
def create_brand_source(
    name: str = Form(...),
    source_type: str = Form("guideline_pdf"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Save uploaded file locally
    file_location = os.path.join(UPLOAD_DIR, f"{current_user.organisation_id}_{file.filename}")
    with open(file_location, "wb+") as file_object:
        file_content = file.file.read()
        file_object.write(file_content)

    # 2. Compute content hash & extract text
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

    # 3. Create Brand Source record (Tenant Isolated)
    brand_source = BrandSource(
        organisation_id=current_user.organisation_id,
        name=name,
        source_type=source_type,
        owner_user_id=current_user.id
    )
    db.add(brand_source)
    db.commit()
    db.refresh(brand_source)

    # 4. Create Initial Source Version (v1)
    source_version = SourceVersion(
        organisation_id=current_user.organisation_id,
        source_id=brand_source.id,
        version_number=1,
        effective_from=date.today(),
        status=SourceStatus.APPROVED,  # Auto-approve for hackathon demo flow
        file_object_key=file_location,
        content_hash=content_hash,
        extracted_text_ref=extracted_text[:500], # Store preview or full ref
        created_by=current_user.id,
        approved_by=current_user.id
    )
    db.add(source_version)
    db.commit()
    db.refresh(source_version)

    # 5. Link current version pointer
    brand_source.current_version_id = source_version.id
    db.commit()
    db.refresh(brand_source)

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
def list_brand_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sources = db.query(BrandSource).filter(BrandSource.organisation_id == current_user.organisation_id).all()
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
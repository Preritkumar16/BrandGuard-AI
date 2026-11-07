from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.source_version import SourceStatus

class BrandSourceCreate(BaseModel):
    name: str
    source_type: str = "guideline_pdf"
    description: Optional[str] = None

class SourceVersionResponse(BaseModel):
    id: str
    source_id: str
    version_number: int
    effective_from: date
    status: SourceStatus
    file_object_key: str
    content_hash: str
    created_at: datetime

    class Config:
        from_attributes = True

class BrandSourceResponse(BaseModel):
    id: str
    organisation_id: str
    name: str
    source_type: str
    owner_user_id: str
    current_version_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.audit_service import evaluate_asset_compliance

router = APIRouter(prefix="/audit", tags=["Compliance Audit"])

class AuditRequest(BaseModel):
    asset_content: str

@router.post("/", response_model=dict)
async def run_compliance_audit(
    payload: AuditRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not payload.asset_content.strip():
        raise HTTPException(status_code=400, detail="Marketing asset content cannot be empty.")

    audit_result = await evaluate_asset_compliance(
        db=db,
        organisation_id=str(current_user.organisation_id),
        asset_content=payload.asset_content
    )
    return audit_result
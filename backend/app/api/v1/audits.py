import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.asset_version import AssetVersion
from app.models.finding import Finding, FindingCategory
from app.models.evidence_link import EvidenceLink
from app.services.audit_service import evaluate_asset_compliance


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/assets",
    tags=["Compliance Audit"],
)


class AuditResponse(BaseModel):
    data: dict
    error: str | None = None


@router.post(
    "/{asset_id}/versions/{version_id}/audit",
    response_model=AuditResponse,
)
async def run_compliance_audit(
    asset_id: UUID,
    version_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Load only a version belonging to this asset and organisation.
    query = select(AssetVersion).where(
        AssetVersion.id == version_id,
        AssetVersion.asset_id == asset_id,
        AssetVersion.organisation_id == current_user.organisation_id,
    )

    result = await db.execute(query)
    asset_version = result.scalar_one_or_none()

    if asset_version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset version not found.",
        )

    if not asset_version.content_text or not asset_version.content_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset version contains no content to audit.",
        )

    # 2. Run the existing audit evaluation.
    audit_result = await evaluate_asset_compliance(
        db=db,
        organisation_id=str(current_user.organisation_id),
        asset_content=asset_version.content_text,
    )

    # 3. Do not replace saved findings when the audit failed
    #    or guideline evidence was unavailable.
    persistable_statuses = {
        "COMPLIANT",
        "NON_COMPLIANT",
        "REVIEW_REQUIRED",
    }

    if (
        audit_result.get("status") not in persistable_statuses
        or not audit_result.get("model_name")
        or not audit_result.get("prompt_version")
    ):
        return AuditResponse(data=audit_result)

    try:
        organisation_id = current_user.organisation_id

        # 4. Build the exact evidence pairs retrieved by the backend.
        retrieved_evidence_pairs = {
            (
                str(item["source_version_id"]),
                item["passage_id"],
            )
            for item in audit_result.get("evidence_used", [])
        }

        # 5. Load previous findings for this asset version and tenant.
        existing_query = select(Finding).where(
            Finding.asset_version_id == asset_version.id,
            Finding.organisation_id == organisation_id,
        )

        existing_result = await db.execute(existing_query)
        existing_findings = existing_result.scalars().all()

        # ORM relationship cascade also deletes their evidence links.
        for existing_finding in existing_findings:
            await db.delete(existing_finding)

        await db.flush()

        # 6. Save the newly evaluated findings.
        for finding_data in audit_result.get("findings", []):
            span = finding_data["span"]

            finding = Finding(
                organisation_id=organisation_id,
                asset_version_id=asset_version.id,
                category=FindingCategory(finding_data["category"]),
                severity=finding_data["severity"],
                span_start=span["start"],
                span_end=span["end"],
                span_text=span["text"],
                explanation=finding_data["explanation"],
                suggested_action=finding_data["suggested_action"],
                suggested_replacement=finding_data.get(
                    "suggested_replacement"
                ),
                validation_status=finding_data["validation_status"],
                model_name=audit_result["model_name"],
                prompt_version=audit_result["prompt_version"],
            )

            db.add(finding)
            await db.flush()

            # 7. Persist evidence links only for VERIFIED findings.
            if finding.validation_status != "VERIFIED":
                continue

            for evidence in finding_data.get("evidence", []):
                evidence_pair = (
                    str(evidence["source_version_id"]),
                    evidence["passage_id"],
                )

                # Independently confirm the exact backend-retrieved pair.
                if evidence_pair not in retrieved_evidence_pairs:
                    continue

                evidence_link = EvidenceLink(
                    organisation_id=organisation_id,
                    finding_id=finding.id,
                    source_version_id=UUID(evidence_pair[0]),
                    passage_id=evidence_pair[1],
                )

                db.add(evidence_link)

        # 8. Commit findings and evidence links together.
        await db.commit()

    except Exception:
        await db.rollback()

        logger.exception(
            "Failed to persist audit findings for asset version %s",
            version_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Audit completed, but its results could not be saved.",
        )

    return AuditResponse(data=audit_result)

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.asset_version import AssetVersion
from app.models.audit_run import (
    AuditRun,
    AuditRunStatus,
    AuditComplianceStatus,
)
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


async def mark_audit_run_failed(
    db: AsyncSession,
    audit_run_id: UUID,
    organisation_id: UUID,
    error_code: str,
) -> None:
    """Record a failed audit without modifying previous audit runs."""
    await db.rollback()

    result = await db.execute(
        select(AuditRun).where(
            AuditRun.id == audit_run_id,
            AuditRun.organisation_id == organisation_id,
        )
    )
    audit_run = result.scalar_one_or_none()

    if audit_run is None:
        raise RuntimeError("Audit run could not be found.")

    audit_run.status = AuditRunStatus.FAILED
    audit_run.error_code = error_code
    audit_run.completed_at = datetime.now(timezone.utc)

    await db.commit()


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

    organisation_id = current_user.organisation_id

    # 2. Create and commit a RUNNING audit record before evaluation.
    audit_run = AuditRun(
        organisation_id=organisation_id,
        asset_version_id=asset_version.id,
        initiated_by=current_user.id,
        status=AuditRunStatus.RUNNING,
    )

    db.add(audit_run)

    try:
        await db.commit()
        await db.refresh(audit_run)
    except Exception:
        await db.rollback()

        logger.exception(
            "Failed to create audit run for asset version %s",
            version_id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not start the compliance audit.",
        )

    audit_run_id = audit_run.id

    # 3. Run the existing audit evaluation.
    try:
        audit_result = await evaluate_asset_compliance(
            db=db,
            organisation_id=str(organisation_id),
            asset_content=asset_version.content_text,
        )
    except Exception:
        logger.exception(
            "Audit evaluation failed for audit run %s",
            audit_run_id,
        )

        try:
            await mark_audit_run_failed(
                db,
                audit_run_id,
                organisation_id,
                "EVALUATION_FAILED",
            )
        except Exception:
            logger.exception(
                "Could not record evaluation failure for audit run %s",
                audit_run_id,
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Compliance audit evaluation failed.",
        )

    # 4. Validate whether the result can be persisted.
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
        try:
            await mark_audit_run_failed(
                db,
                audit_run_id,
                organisation_id,
                "AUDIT_RESULT_NOT_PERSISTABLE",
            )
        except Exception:
            logger.exception(
                "Could not record non-persistable audit run %s",
                audit_run_id,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not record the audit result.",
            )

        return AuditResponse(data=audit_result)

    try:
        # 5. Record the evaluation metadata on this audit run.
        audit_run_result = await db.execute(
            select(AuditRun).where(
                AuditRun.id == audit_run_id,
                AuditRun.organisation_id == organisation_id,
            )
        )
        audit_run = audit_run_result.scalar_one()

        compliance_status_map = {
            "COMPLIANT": AuditComplianceStatus.COMPLIANT,
            "NON_COMPLIANT": AuditComplianceStatus.NON_COMPLIANT,
            "REVIEW_REQUIRED": AuditComplianceStatus.REVIEW_REQUIRED,
        }

        audit_run.compliance_status = compliance_status_map[
            audit_result["status"]
        ]
        audit_run.summary = audit_result.get("summary")
        audit_run.model_name = audit_result["model_name"]
        audit_run.prompt_version = audit_result["prompt_version"]

        # 6. Build the exact evidence pairs retrieved by the backend.
        retrieved_evidence_pairs = {
            (
                str(item["source_version_id"]),
                item["passage_id"],
            )
            for item in audit_result.get("evidence_used", [])
        }

        # 7. Save findings linked to this specific audit run.
        # Previous findings are intentionally NOT deleted.
        for finding_data in audit_result.get("findings", []):
            span = finding_data["span"]

            finding = Finding(
                organisation_id=organisation_id,
                asset_version_id=asset_version.id,
                audit_run_id=audit_run_id,
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

            # 8. Persist evidence links only for VERIFIED findings.
            if finding.validation_status != "VERIFIED":
                continue

            for evidence in finding_data.get("evidence", []):
                evidence_pair = (
                    str(evidence["source_version_id"]),
                    evidence["passage_id"],
                )

                if evidence_pair not in retrieved_evidence_pairs:
                    continue

                evidence_link = EvidenceLink(
                    organisation_id=organisation_id,
                    finding_id=finding.id,
                    source_version_id=UUID(evidence_pair[0]),
                    passage_id=evidence_pair[1],
                )

                db.add(evidence_link)

        # 9. Mark COMPLETED in the same transaction as findings
        # and evidence links. A failed commit cannot leave a
        # partially completed audit.
        audit_run.status = AuditRunStatus.COMPLETED
        audit_run.error_code = None
        audit_run.completed_at = datetime.now(timezone.utc)

        await db.commit()

    except Exception:
        await db.rollback()

        logger.exception(
            "Failed to persist audit run %s for asset version %s",
            audit_run_id,
            version_id,
        )

        try:
            await mark_audit_run_failed(
                db,
                audit_run_id,
                organisation_id,
                "PERSISTENCE_FAILED",
            )
        except Exception:
            logger.exception(
                "Could not record persistence failure for audit run %s",
                audit_run_id,
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Audit results could not be saved.",
        )

    return AuditResponse(data=audit_result)

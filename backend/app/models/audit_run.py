import uuid
import enum
from datetime import datetime
from typing import Any, Dict, Optional, TYPE_CHECKING

from sqlalchemy import (
    String,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    ForeignKeyConstraint,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation
    from app.models.asset_version import AssetVersion
    from app.models.user import User
    from app.models.finding import Finding


class AuditRunStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AuditComplianceStatus(str, enum.Enum):
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class AuditRun(Base):
    __tablename__ = "audit_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    organisation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    asset_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    initiated_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    status: Mapped[AuditRunStatus] = mapped_column(
        SQLEnum(
            AuditRunStatus,
            native_enum=False,
            values_callable=lambda values: [item.value for item in values],
        ),
        nullable=False,
        default=AuditRunStatus.RUNNING,
    )

    compliance_status: Mapped[Optional[AuditComplianceStatus]] = mapped_column(
        SQLEnum(
            AuditComplianceStatus,
            native_enum=False,
            values_callable=lambda values: [item.value for item in values],
        ),
        nullable=True,
    )

    summary: Mapped[Optional[str]] = mapped_column(
        String,
        nullable=True,
    )

    model_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    prompt_version: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )

    validation_result: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
    )

    error_code: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    organisation: Mapped["Organisation"] = relationship(
        "Organisation",
    )

    asset_version: Mapped["AssetVersion"] = relationship(
        "AssetVersion",
        primaryjoin=(
            "and_("
            "AuditRun.asset_version_id == AssetVersion.id, "
            "AuditRun.organisation_id == AssetVersion.organisation_id"
            ")"
        ),
        foreign_keys=[asset_version_id, organisation_id],
        viewonly=True,
    )

    initiator: Mapped["User"] = relationship(
        "User",
        primaryjoin=(
            "and_("
            "AuditRun.initiated_by == User.id, "
            "AuditRun.organisation_id == User.organisation_id"
            ")"
        ),
        foreign_keys=[initiated_by, organisation_id],
        viewonly=True,
    )
    findings: Mapped[list["Finding"]] = relationship(
    "Finding",
    primaryjoin=(
        "and_("
        "AuditRun.id == Finding.audit_run_id, "
        "AuditRun.organisation_id == Finding.organisation_id"
        ")"
    ),
    foreign_keys="[Finding.audit_run_id, Finding.organisation_id]",
    viewonly=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "id",
            "organisation_id",
            name="uq_audit_run_id_organisation",
        ),
        ForeignKeyConstraint(
            ["asset_version_id", "organisation_id"],
            ["asset_versions.id", "asset_versions.organisation_id"],
            name="fk_audit_run_asset_version_tenant",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["initiated_by", "organisation_id"],
            ["users.id", "users.organisation_id"],
            name="fk_audit_run_initiator_tenant",
            ondelete="RESTRICT",
        ),
    )
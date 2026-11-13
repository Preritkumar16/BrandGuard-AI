
import uuid
from typing import Any, Dict, Optional, TYPE_CHECKING

from sqlalchemy import (
    String,
    ForeignKey,
    ForeignKeyConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.finding import Finding
    from app.models.source_version import SourceVersion


class EvidenceLink(Base):
    __tablename__ = "evidence_links"

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

    finding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    source_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    passage_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    locator: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
    )

    finding: Mapped["Finding"] = relationship(
        "Finding",
        back_populates="evidence_links",
        primaryjoin=(
            "and_("
            "EvidenceLink.finding_id == Finding.id, "
            "EvidenceLink.organisation_id == Finding.organisation_id"
            ")"
        ),
        foreign_keys=[finding_id, organisation_id],
    )

    source_version: Mapped["SourceVersion"] = relationship(
        "SourceVersion",
        primaryjoin=(
            "and_("
            "EvidenceLink.source_version_id == SourceVersion.id, "
            "EvidenceLink.organisation_id == SourceVersion.organisation_id"
            ")"
        ),
        foreign_keys=[source_version_id, organisation_id],
        viewonly=True,
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["finding_id", "organisation_id"],
            ["findings.id", "findings.organisation_id"],
            name="fk_evidence_link_finding_tenant",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["source_version_id", "organisation_id"],
            ["source_versions.id", "source_versions.organisation_id"],
            name="fk_evidence_link_source_version_tenant",
            ondelete="CASCADE",
        ),
    )

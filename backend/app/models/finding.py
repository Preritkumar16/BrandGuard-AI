import uuid
import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, DateTime, Enum as SQLEnum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation
    from app.models.asset_version import AssetVersion
    from app.models.evidence_link import EvidenceLink


class FindingCategory(str, enum.Enum):
    SUPPORTED = "SUPPORTED"
    UNSUPPORTED = "UNSUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    OUTDATED = "OUTDATED"
    AMBIGUOUS_RULE = "AMBIGUOUS_RULE"
    REVIEW_UNAVAILABLE = "REVIEW_UNAVAILABLE"


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organisation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("asset_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[FindingCategory] = mapped_column(
        SQLEnum(FindingCategory, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    severity: Mapped[str] = mapped_column(String(50), nullable=False)
    span_start: Mapped[int] = mapped_column(Integer, nullable=False)
    span_end: Mapped[int] = mapped_column(Integer, nullable=False)
    span_text: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_action: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_replacement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    validation_status: Mapped[str] = mapped_column(String(50), nullable=False, default="UNVERIFIED")
    model_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    prompt_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    organisation: Mapped["Organisation"] = relationship("Organisation")
    asset_version: Mapped["AssetVersion"] = relationship("AssetVersion")
    evidence_links: Mapped[List["EvidenceLink"]] = relationship(
        "EvidenceLink", back_populates="finding", cascade="all, delete-orphan"
    )
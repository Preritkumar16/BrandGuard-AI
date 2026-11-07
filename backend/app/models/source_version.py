import uuid
import enum
from datetime import date, datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Date, DateTime, Enum as SQLEnum, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation
    from app.models.brand_source import BrandSource
    from app.models.user import User
    from app.models.source_chunk import SourceChunk


class SourceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    SUPERSEDED = "SUPERSEDED"
    ARCHIVED = "ARCHIVED"


class SourceVersion(Base):
    __tablename__ = "source_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organisation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brand_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[SourceStatus] = mapped_column(
        SQLEnum(SourceStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=SourceStatus.DRAFT,
    )
    file_object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    extracted_text_ref: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
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
    brand_source: Mapped["BrandSource"] = relationship(
        "BrandSource",
        back_populates="versions",
        foreign_keys=[source_id],
    )
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    approver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by])
    chunks: Mapped[List["SourceChunk"]] = relationship(
        "SourceChunk",
        back_populates="source_version",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("source_id", "version_number", name="uq_source_version_number"),
    )
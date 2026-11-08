import uuid
from typing import Any, Dict, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, ForeignKey, ForeignKeyConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation
    from app.models.source_version import SourceVersion


class SourceChunk(Base):
    __tablename__ = "source_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organisation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    passage_id: Mapped[str] = mapped_column(String(255), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    locator: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    meta_data: Mapped[Dict[str, Any]] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    qdrant_point_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    organisation: Mapped["Organisation"] = relationship("Organisation", overlaps="chunks")
    source_version: Mapped["SourceVersion"] = relationship(
        "SourceVersion",
        back_populates="chunks",
        primaryjoin="and_(SourceChunk.source_version_id == SourceVersion.id, SourceChunk.organisation_id == SourceVersion.organisation_id)",
        foreign_keys=[source_version_id, organisation_id],
        overlaps="organisation",
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["source_version_id", "organisation_id"],
            ["source_versions.id", "source_versions.organisation_id"],
            name="fk_source_chunk_source_version_tenant",
            ondelete="CASCADE",
        ),
    )
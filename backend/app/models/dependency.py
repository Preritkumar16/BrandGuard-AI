import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, ForeignKeyConstraint, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation
    from app.models.asset_version import AssetVersion
    from app.models.source_version import SourceVersion


class Dependency(Base):
    __tablename__ = "dependencies"

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
        UUID(as_uuid=True), nullable=False, index=True
    )
    source_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    dependency_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="ACTIVE"
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

    organisation: Mapped["Organisation"] = relationship("Organisation")
    asset_version: Mapped["AssetVersion"] = relationship(
        "AssetVersion",
        primaryjoin="and_(Dependency.asset_version_id == AssetVersion.id, Dependency.organisation_id == AssetVersion.organisation_id)",
        foreign_keys=[asset_version_id, organisation_id],
        overlaps="organisation",
    )
    source_version: Mapped["SourceVersion"] = relationship(
        "SourceVersion",
        primaryjoin="and_(Dependency.source_version_id == SourceVersion.id, Dependency.organisation_id == SourceVersion.organisation_id)",
        foreign_keys=[source_version_id, organisation_id],
        overlaps="asset_version,organisation",
    )

    __table_args__ = (
        Index(
            "ix_dependencies_tenant_asset_source",
            "organisation_id",
            "asset_version_id",
            "source_version_id",
        ),
        ForeignKeyConstraint(
            ["asset_version_id", "organisation_id"],
            ["asset_versions.id", "asset_versions.organisation_id"],
            name="fk_dependency_asset_version_tenant",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["source_version_id", "organisation_id"],
            ["source_versions.id", "source_versions.organisation_id"],
            name="fk_dependency_source_version_tenant",
            ondelete="CASCADE",
        ),
    )
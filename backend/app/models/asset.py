import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, ForeignKeyConstraint, UniqueConstraint, and_, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation
    from app.models.user import User
    from app.models.asset_version import AssetVersion


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organisation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    current_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
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
    creator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[created_by],
        overlaps="organisation",
    )
    current_version: Mapped[Optional["AssetVersion"]] = relationship(
        "AssetVersion",
        primaryjoin="and_(Asset.current_version_id == AssetVersion.id, Asset.id == AssetVersion.asset_id, Asset.organisation_id == AssetVersion.organisation_id)",
        foreign_keys=[current_version_id],
        post_update=True,
        overlaps="versions",
    )
    versions: Mapped[List["AssetVersion"]] = relationship(
        "AssetVersion",
        back_populates="asset",
        foreign_keys="AssetVersion.asset_id",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("id", "organisation_id", name="uq_asset_id_organisation"),
        ForeignKeyConstraint(
            ["created_by", "organisation_id"],
            ["users.id", "users.organisation_id"],
            name="fk_asset_creator_tenant",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["current_version_id", "id", "organisation_id"],
            ["asset_versions.id", "asset_versions.asset_id", "asset_versions.organisation_id"],
            name="fk_assets_current_version_parent_tenant",
            ondelete="RESTRICT",
            use_alter=True,
        ),
    )
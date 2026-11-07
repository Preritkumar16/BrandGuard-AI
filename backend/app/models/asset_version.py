import uuid
import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, DateTime, Enum as SQLEnum, ForeignKey, ForeignKeyConstraint, UniqueConstraint, and_, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation
    from app.models.user import User
    from app.models.asset import Asset


class AssetVersionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class AssetVersion(Base):
    __tablename__ = "asset_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organisation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    file_object_key: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    status: Mapped[AssetVersionStatus] = mapped_column(
        SQLEnum(AssetVersionStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AssetVersionStatus.DRAFT,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
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
    asset: Mapped["Asset"] = relationship(
        "Asset",
        back_populates="versions",
        primaryjoin="and_(AssetVersion.asset_id == Asset.id, AssetVersion.organisation_id == Asset.organisation_id)",
        foreign_keys=[asset_id, organisation_id],
        overlaps="current_version,organisation,versions",
    )
    creator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[created_by],
        overlaps="organisation",
    )

    __table_args__ = (
        UniqueConstraint("asset_id", "version_number", name="uq_asset_version_number"),
        UniqueConstraint("id", "organisation_id", name="uq_asset_version_id_organisation"),
        UniqueConstraint("id", "asset_id", "organisation_id", name="uq_asset_version_composite_ptr"),
        ForeignKeyConstraint(
            ["asset_id", "organisation_id"],
            ["assets.id", "assets.organisation_id"],
            name="fk_asset_version_asset_tenant",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["created_by", "organisation_id"],
            ["users.id", "users.organisation_id"],
            name="fk_asset_version_creator_tenant",
            ondelete="RESTRICT",
        ),
    )
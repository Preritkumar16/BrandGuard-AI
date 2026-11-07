import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey, ForeignKeyConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation
    from app.models.asset_version import AssetVersion
    from app.models.user import User


class Approval(Base):
    __tablename__ = "approvals"

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
        UUID(as_uuid=True), nullable=False, unique=True
    )
    reviewer_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    decision: Mapped[str] = mapped_column(String(50), nullable=False)
    source_set_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    canonical_payload: Mapped[str] = mapped_column(Text, nullable=False)
    hmac_tag: Mapped[str] = mapped_column(String(128), nullable=False)
    key_version: Mapped[str] = mapped_column(String(50), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    organisation: Mapped["Organisation"] = relationship("Organisation")
    asset_version: Mapped["AssetVersion"] = relationship(
        "AssetVersion",
        primaryjoin="and_(Approval.asset_version_id == AssetVersion.id, Approval.organisation_id == AssetVersion.organisation_id)",
        foreign_keys=[asset_version_id, organisation_id],
        overlaps="organisation",
    )
    reviewer: Mapped["User"] = relationship(
        "User",
        primaryjoin="and_(Approval.reviewer_user_id == User.id, Approval.organisation_id == User.organisation_id)",
        foreign_keys=[reviewer_user_id, organisation_id],
        overlaps="asset_version,organisation",
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["asset_version_id", "organisation_id"],
            ["asset_versions.id", "asset_versions.organisation_id"],
            name="fk_approval_asset_version_tenant",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["reviewer_user_id", "organisation_id"],
            ["users.id", "users.organisation_id"],
            name="fk_approval_reviewer_tenant",
            ondelete="RESTRICT",
        ),
    )
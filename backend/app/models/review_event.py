import uuid
from datetime import datetime
from typing import Any, Dict, Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey, ForeignKeyConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation
    from app.models.asset_version import AssetVersion
    from app.models.user import User


class ReviewEvent(Base):
    __tablename__ = "review_events"

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
    actor_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meta_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        "metadata", JSONB, nullable=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    organisation: Mapped["Organisation"] = relationship("Organisation")
    asset_version: Mapped["AssetVersion"] = relationship(
        "AssetVersion",
        primaryjoin="and_(ReviewEvent.asset_version_id == AssetVersion.id, ReviewEvent.organisation_id == AssetVersion.organisation_id)",
        foreign_keys=[asset_version_id, organisation_id],
        overlaps="organisation",
    )
    actor: Mapped["User"] = relationship(
        "User",
        primaryjoin="and_(ReviewEvent.actor_user_id == User.id, ReviewEvent.organisation_id == User.organisation_id)",
        foreign_keys=[actor_user_id, organisation_id],
        overlaps="asset_version,organisation",
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["asset_version_id", "organisation_id"],
            ["asset_versions.id", "asset_versions.organisation_id"],
            name="fk_review_event_asset_version_tenant",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["actor_user_id", "organisation_id"],
            ["users.id", "users.organisation_id"],
            name="fk_review_event_actor_tenant",
            ondelete="RESTRICT",
        ),
    )
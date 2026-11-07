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
    from app.models.source_version import SourceVersion


class BrandSource(Base):
    __tablename__ = "brand_sources"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organisation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(100), nullable=False)
    owner_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
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
    owner: Mapped["User"] = relationship(
        "User",
        primaryjoin="and_(BrandSource.owner_user_id == User.id, BrandSource.organisation_id == User.organisation_id)",
        foreign_keys=[owner_user_id, organisation_id],
        overlaps="organisation",
    )
    current_version: Mapped[Optional["SourceVersion"]] = relationship(
        "SourceVersion",
        primaryjoin="and_(BrandSource.current_version_id == SourceVersion.id, BrandSource.id == SourceVersion.source_id, BrandSource.organisation_id == SourceVersion.organisation_id)",
        foreign_keys=[current_version_id],
        post_update=True,
        overlaps="versions",
    )
    versions: Mapped[List["SourceVersion"]] = relationship(
        "SourceVersion",
        back_populates="brand_source",
        foreign_keys="SourceVersion.source_id",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("id", "organisation_id", name="uq_brand_source_id_organisation"),
        ForeignKeyConstraint(
            ["owner_user_id", "organisation_id"],
            ["users.id", "users.organisation_id"],
            name="fk_brand_source_owner_tenant",
            ondelete="RESTRICT",
        ),
        ForeignKeyConstraint(
            ["current_version_id", "id", "organisation_id"],
            ["source_versions.id", "source_versions.source_id", "source_versions.organisation_id"],
            name="fk_brand_sources_current_version_parent_tenant",
            ondelete="RESTRICT",
            use_alter=True,
        ),
    )
import uuid
import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, Boolean, Enum as SQLEnum, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.organisation import Organisation

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SOURCE_OWNER = "SOURCE_OWNER"
    CREATOR = "CREATOR"
    REVIEWER = "REVIEWER"
    COMPLIANCE_REVIEWER = "COMPLIANCE_REVIEWER"

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    organisation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("organisations.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    name: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, native_enum=False, values_callable=lambda x: [e.value for e in x]), 
        nullable=False, 
        default=UserRole.CREATOR
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationship back to Organisation
    organisation: Mapped["Organisation"] = relationship(
        "Organisation", 
        back_populates="users"
    )

    __table_args__ = (
        UniqueConstraint("organisation_id", "email", name="uq_user_organisation_email"),
    )
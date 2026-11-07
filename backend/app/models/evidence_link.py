import uuid
from typing import Any, Dict, Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.finding import Finding
    from app.models.source_version import SourceVersion


class EvidenceLink(Base):
    __tablename__ = "evidence_links"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    finding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("findings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("source_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    passage_id: Mapped[str] = mapped_column(String(255), nullable=False)
    locator: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    finding: Mapped["Finding"] = relationship("Finding", back_populates="evidence_links")
    source_version: Mapped["SourceVersion"] = relationship("SourceVersion")
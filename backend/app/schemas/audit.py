from typing import List, Literal, Optional
from uuid import UUID

from pydantic import (BaseModel, ConfigDict, StrictInt, StrictStr, Field)


FindingCategoryValue = Literal[
    "SUPPORTED",
    "UNSUPPORTED",
    "CONTRADICTED",
    "OUTDATED",
    "AMBIGUOUS_RULE",
    "REVIEW_UNAVAILABLE",
]

FindingSeverity = Literal[
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
]

SemanticAssessment = Literal[
    "SUPPORTS_CLAIM",
    "CONTRADICTS_CLAIM",
    "INSUFFICIENT",
    "AMBIGUOUS",
]

class SemanticEvidenceAssessment(BaseModel):
    """Structured result of semantic evidence verification."""

    assessment: SemanticAssessment
    explanation: StrictStr = Field(min_length=1)

    model_config = ConfigDict(extra="forbid")


class AuditSpan(BaseModel):
    """Exact location of a finding within the submitted asset."""

    start: StrictInt = Field(ge=0)
    end: StrictInt = Field(gt=0)
    text: StrictStr = Field(min_length=1)

    model_config = ConfigDict(extra="forbid")


class AuditEvidenceReference(BaseModel):
    """Reference to an authoritative source passage."""

    source_version_id: UUID
    passage_id: StrictStr = Field(min_length=1)

    model_config = ConfigDict(extra="forbid")


class AIFinding(BaseModel):
    """Structured finding returned by the AI audit process."""

    category: FindingCategoryValue
    severity: FindingSeverity
    span: AuditSpan
    explanation: StrictStr = Field(min_length=1)
    evidence: List[AuditEvidenceReference]
    suggested_action: StrictStr = Field(min_length=1)
    suggested_replacement: Optional[StrictStr] = None

    model_config = ConfigDict(extra="forbid")


class AIAuditResponse(BaseModel):
    """Top-level structured response returned by the AI auditor."""

    summary: StrictStr = Field(min_length=1)
    findings: List[AIFinding]

    model_config = ConfigDict(extra="forbid")
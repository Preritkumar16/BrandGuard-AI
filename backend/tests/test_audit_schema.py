import pytest
from pydantic import ValidationError

from app.schemas.audit import AIAuditResponse


VALID_RESPONSE = {
    "summary": "One brand compliance issue was identified.",
    "findings": [
        {
            "category": "CONTRADICTED",
            "severity": "HIGH",
            "span": {
                "start": 0,
                "end": 4,
                "text": "₹999",
            },
            "explanation": "The approved price list states ₹1,499.",
            "evidence": [
                {
                    "source_version_id": "123e4567-e89b-12d3-a456-426614174000",
                    "passage_id": "paragraph_8",
                }
            ],
            "suggested_action": "Correct the price after reviewer confirmation.",
            "suggested_replacement": "₹1,499",
        }
    ],
}


def test_valid_audit_response():
    result = AIAuditResponse.model_validate(VALID_RESPONSE)

    assert result.findings[0].severity == "HIGH"
    assert result.findings[0].category == "CONTRADICTED"


@pytest.mark.parametrize(
    "severity",
    ["MINOR", "URGENT", "UNKNOWN", ""],
)
def test_rejects_invalid_severity(severity):
    payload = VALID_RESPONSE.copy()
    payload["findings"] = [VALID_RESPONSE["findings"][0].copy()]
    payload["findings"][0]["severity"] = severity

    with pytest.raises(ValidationError):
        AIAuditResponse.model_validate(payload)


def test_rejects_invalid_source_version_id():
    payload = VALID_RESPONSE.copy()
    payload["findings"] = [VALID_RESPONSE["findings"][0].copy()]
    payload["findings"][0]["evidence"] = [
        {
            "source_version_id": "not-a-uuid",
            "passage_id": "paragraph_8",
        }
    ]

    with pytest.raises(ValidationError):
        AIAuditResponse.model_validate(payload)


def test_rejects_boolean_span_offset():
    payload = VALID_RESPONSE.copy()
    payload["findings"] = [VALID_RESPONSE["findings"][0].copy()]
    payload["findings"][0]["span"] = {
        "start": True,
        "end": 4,
        "text": "₹999",
    }

    with pytest.raises(ValidationError):
        AIAuditResponse.model_validate(payload)


def test_rejects_unexpected_fields():
    payload = VALID_RESPONSE.copy()
    payload["unexpected_field"] = "COMPLIANT"

    with pytest.raises(ValidationError):
        AIAuditResponse.model_validate(payload)


def test_allows_empty_evidence_for_later_review_validation():
    payload = VALID_RESPONSE.copy()
    payload["findings"] = [VALID_RESPONSE["findings"][0].copy()]
    payload["findings"][0]["evidence"] = []

    result = AIAuditResponse.model_validate(payload)

    assert result.findings[0].evidence == []


def test_allows_empty_findings_at_schema_level():
    payload = {
        "summary": "No findings were returned.",
        "findings": [],
    }

    result = AIAuditResponse.model_validate(payload)

    assert result.findings == []
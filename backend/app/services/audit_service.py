import json
import logging
from typing import Dict, Any
from groq import Groq
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.services.qdrant_service import search_and_validate_guidelines

logger = logging.getLogger(__name__)

groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None

async def evaluate_asset_compliance(
    db: AsyncSession,
    organisation_id: str,
    asset_content: str
) -> Dict[str, Any]:
    # 1. Retrieve and independently verify passages from PostgreSQL via Qdrant candidate IDs
    retrieved_passages = await search_and_validate_guidelines(db, organisation_id, asset_content, limit=3)
    
    if not retrieved_passages:
        return {
            "status": "UNAVAILABLE",
            "findings": [],
            "summary": "No approved brand guidelines found or verified in PostgreSQL for this organisation."
        }

    evidence_text = "\n\n".join([
        f"[Passage ID: {p['passage_id']}]: {p['text']}" for p in retrieved_passages
    ])

    prompt = f"""You are BrandGuard AI, an expert brand compliance auditor.
Evaluate the Marketing Asset against the Verified Brand Guidelines Evidence below.

Verified Brand Guidelines Evidence:
{evidence_text}

Marketing Asset to Audit:
{asset_content}

Instructions:
1. Analyze the asset strictly against the provided evidence.
2. Return a valid JSON object with EXACTLY this structure:
{{
  "overall_status": "COMPLIANT" or "NON_COMPLIANT" or "REVIEW_REQUIRED",
  "summary": "Brief summary of compliance analysis",
  "findings": [
    {{
      "category": "SUPPORTED" or "CONTRADICTED" or "UNSUPPORTED",
      "submitted_span": "Exact substring from the marketing asset being evaluated",
      "span_start": 0,
      "span_end": 0,
      "evidence_passage_ids": ["passage_id_1"],
      "explanation": "Detailed explanation citing verified passage IDs"
    }}
  ]
}}
"""

    if not groq_client:
        logger.error("Groq API key is not configured.")
        return {
            "status": "FAILED_UNAVAILABLE",
            "findings": [],
            "summary": "Audit service is misconfigured. Failing safe."
        }

    try:
        response = groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        content = response.choices[0].message.content.strip()
        
        # Strip Markdown code blocks if present
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        audit_result = json.loads(content)
        
        # 2. Validate evidence passage IDs and exact character spans against PostgreSQL authority
        valid_passage_ids = {p["passage_id"] for p in retrieved_passages}
        validated_findings = []
        has_violations = False
        has_review_items = False
        
        for finding in audit_result.get("findings", []):
            matched_ids = [pid for pid in finding.get("evidence_passage_ids", []) if pid in valid_passage_ids]
            if matched_ids:
                finding["evidence_passage_ids"] = matched_ids
                span_text = finding.get("submitted_span", "")
                
                # Strict span boundary verification
                if span_text and span_text in asset_content:
                    start_idx = asset_content.find(span_text)
                    finding["span_start"] = start_idx
                    finding["span_end"] = start_idx + len(span_text)
                
                if finding.get("category") in ["CONTRADICTED", "UNSUPPORTED"]:
                    has_violations = True
                elif finding.get("category") == "UNVERIFIED":
                    has_review_items = True

                validated_findings.append(finding)

        audit_result["findings"] = validated_findings

        # 3. Backend-owned fail-safe status derivation
        if has_violations:
            audit_result["status"] = "NON_COMPLIANT"
        elif has_review_items or not validated_findings:
            audit_result["status"] = "REVIEW_REQUIRED"
        else:
            audit_result["status"] = "COMPLETED"

        audit_result["evidence_used"] = retrieved_passages
        return audit_result

    except Exception:
        logger.exception("Audit analysis failed.")
        return {
            "status": "FAILED_UNAVAILABLE",
            "findings": [],
            "summary": "AI audit processing error occurred. Failing safe."
        }
import uuid
import pytest
import json
import re
from types import SimpleNamespace
from unittest.mock import AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.services.audit_service import _determine_compliance_status

def make_groq_mock():
    async def fake_create(**kwargs):
        prompt = kwargs["messages"][1]["content"]
        source_match = re.search(
            r"\[Source Version ID: ([^\]]+)\]",
            prompt,
        )
        passage_match = re.search(
            r"\[Passage ID: ([^\]]+)\]",
            prompt,
        )
        assert source_match, "Source version ID missing from prompt"
        assert passage_match, "Passage ID missing from prompt"
        
        source_version_id = source_match.group(1)
        passage_id = passage_match.group(1)

        asset = "We love our official Navy Blue #000080 branding!"
        span_text = "official Navy Blue #000080"
        start = asset.index(span_text)
        
        ai_result = {
            "summary": "The branding claim matches the approved guideline.",
            "findings": [
                {
                    "category": "SUPPORTED",
                    "severity": "LOW",
                    "span": {
                        "start": start,
                        "end": start + len(span_text),
                        "text": span_text,
                    },
                    "explanation": (
                        "The submitted Navy Blue color matches "
                        "the approved brand guideline."
                    ),
                    "evidence": [
                        {
                            "source_version_id": source_version_id,
                            "passage_id": passage_id,
                        }
                    ],
                    "suggested_action": "No action required.",
                    "suggested_replacement": None,
                }
            ],
        }

        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content=json.dumps(ai_result)
                    )
                )
            ]
        )

    return fake_create


@pytest.mark.asyncio
async def test_end_to_end_compliance_audit_workflow(monkeypatch):
    from app.services import audit_service
    assert audit_service.groq_client is not None
    monkeypatch.setattr(
        audit_service.groq_client.chat.completions,
        "create",
        AsyncMock(side_effect=make_groq_mock()),
    )

    unique_suffix = uuid.uuid4().hex[:6]
    org_name = f"Governance Corp {unique_suffix}"
    admin_email = f"admin_{unique_suffix}@governance.com"
    reviewer_email = f"reviewer_{unique_suffix}@governance.com"
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register Admin User
        reg_admin = await ac.post("/api/v1/auth/register", json={
            "organisation_name": org_name,
            "name": "Admin Audit",
            "email": admin_email,
            "password": "securepassword123"
        })
        assert reg_admin.status_code == 201
        admin_user_data = reg_admin.json()
        organisation_id = admin_user_data["organisation_id"]

        # 2. Login as Admin
        login_admin = await ac.post("/api/v1/auth/login", json={
            "email": admin_email,
            "password": "securepassword123"
        })
        assert login_admin.status_code == 200
        admin_token = login_admin.json()["access_token"]

        # 3. Upload Brand Guideline (Creates version in DRAFT status)
        files = {"file": ("rules.txt", b"Brand Rule: Always use official Navy Blue #000080 for headers. Never use neon green.", "text/plain")}
        data_form = {"name": "Core Brand Rules", "source_type": "guideline_text"}
        
        upload_res = await ac.post(
            "/api/v1/sources/",
            data=data_form,
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert upload_res.status_code == 201
        source_data = upload_res.json()
        source_id = source_data["id"]
        version_id = source_data["current_version_id"]

        # 4. Audit before approval should return UNAVAILABLE (no approved guidelines indexed)
        audit_pre = await ac.post(
            "/api/v1/audit/",
            json={"asset_content": "Check out our new neon green header style!"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert audit_pre.status_code == 200
        assert audit_pre.json()["status"] == "UNAVAILABLE"

        # 5. Create Reviewer in the SAME organisation directly via DB (since public registration creates an initial ADMIN per tenant)
        reviewer = User(
            organisation_id=uuid.UUID(organisation_id),
            name="Reviewer Audit",
            email=reviewer_email,
            password_hash=get_password_hash("securepassword123"),
            role="REVIEWER",
            is_active=True,
        )
        async with AsyncSessionLocal() as db:
            db.add(reviewer)
            await db.commit()
        
        login_rev = await ac.post("/api/v1/auth/login", json={
            "email": reviewer_email,
            "password": "securepassword123"
        })
        assert login_rev.status_code == 200
        reviewer_token = login_rev.json()["access_token"]

        # 6. Test Four-Eyes Principle: Admin trying to approve their own version should fail (403)
        self_approve = await ac.post(
            f"/api/v1/sources/{source_id}/versions/{version_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert self_approve.status_code == 403

        # 7. Authorised Reviewer approves the version successfully (Triggers Qdrant indexing)
        approve_res = await ac.post(
            f"/api/v1/sources/{source_id}/versions/{version_id}/approve",
            headers={"Authorization": f"Bearer {reviewer_token}"}
        )
        assert approve_res.status_code == 200

        # 8. Run Compliance Audit after approval
        audit_post = await ac.post(
            "/api/v1/audit/",
            json={"asset_content": "We love our official Navy Blue #000080 branding!"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert audit_post.status_code == 200
        audit_data = audit_post.json()
        
        print("\n========== AUDIT DEBUG ==========")
        print("Status:", audit_data.get("status"))
        print("Summary:", audit_data.get("summary"))
        print("Findings:", audit_data.get("findings"))
        print("Validation:", audit_data.get("validation"))
        print("=================================\n")

        assert audit_data["status"] == "COMPLIANT"
        assert audit_data["validation"]["checks_completed"] is True
        assert audit_data["validation"]["citations_validated"] is True
        assert audit_data["validation"]["spans_validated"] is True
        assert "findings" in audit_data

@pytest.mark.parametrize(
    "all_valid, violations, review_items, expected",
    [
        (True, False, False, "COMPLIANT"),
        (True, True, False, "NON_COMPLIANT"),
        (True, False, True, "REVIEW_REQUIRED"),
        (False, False, False, "REVIEW_REQUIRED"),
        (False, True, True, "NON_COMPLIANT"),
    ],
)
def test_compliance_status_classification(
    all_valid,
    violations,
    review_items,
    expected,
):
    result = _determine_compliance_status(
        all_findings_valid=all_valid,
        has_violations=violations,
        has_review_items=review_items,
    )

    assert result == expected
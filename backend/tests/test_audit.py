import uuid
import pytest
import json
import re
import hashlib
from sqlalchemy import select

from types import SimpleNamespace
from unittest.mock import AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.services.audit_service import _determine_compliance_status
from app.models.asset import Asset
from app.models.asset_version import AssetVersion, AssetVersionStatus
from app.models.finding import Finding, FindingCategory
from app.models.evidence_link import EvidenceLink
from app.models.audit_run import AuditRun, AuditRunStatus

def make_groq_mock():
    async def fake_create(**kwargs):
        prompt = kwargs["messages"][1]["content"]

        # Second-stage semantic verification
        if "SEMANTIC EVIDENCE VERIFICATION" in prompt:
            semantic_result = {
                "assessment": "SUPPORTS_CLAIM",
                "explanation": (
                    "The cited guideline explicitly requires Navy Blue "
                    "#000080 for headers, matching the submitted claim."
                ),
            }

            return SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(
                            content=json.dumps(semantic_result)
                        )
                    )
                ]
            )

        # First-stage audit finding generation
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

        # Create a marketing asset and its first version
        asset_content = "We love our official Navy Blue #000080 branding!"
        async with AsyncSessionLocal() as db:
            asset = Asset(
                organisation_id=uuid.UUID(organisation_id),
                title="Brand Campaign",
                created_by=uuid.UUID(admin_user_data["id"]),
            )
            db.add(asset)
            await db.flush()
            asset_version = AssetVersion(
                organisation_id=uuid.UUID(organisation_id),
                asset_id=asset.id,
                version_number=1,
                content_hash=hashlib.sha256(
                    asset_content.encode("utf-8")
                ).hexdigest(),
                content_text=asset_content,
                status=AssetVersionStatus.DRAFT,
                created_by=uuid.UUID(admin_user_data["id"]),
            )
            db.add(asset_version)
            await db.commit()
            asset_id = str(asset.id)
            asset_version_id = str(asset_version.id)

        # 4. Audit before approval should return UNAVAILABLE (no approved guidelines indexed)
        audit_pre = await ac.post(
            f"/api/v1/assets/{asset_id}/versions/{asset_version_id}/audit",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert audit_pre.status_code == 200
        assert audit_pre.json()["data"]["status"] == "UNAVAILABLE"

        # 5. Create Reviewer in the SAME organisation directly via DB
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

        # 8. Run Compliance Audit after approval (First Audit Run)
        audit_post = await ac.post(
            f"/api/v1/assets/{asset_id}/versions/{asset_version_id}/audit",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert audit_post.status_code == 200
        audit_data = audit_post.json()["data"]

        assert audit_data["status"] == "COMPLIANT"
        assert audit_data["validation"]["checks_completed"] is True
        assert audit_data["validation"]["citations_validated"] is True
        assert audit_data["validation"]["spans_validated"] is True
        assert "findings" in audit_data

        # 9. Verify first audit findings were persisted in PostgreSQL.
        async with AsyncSessionLocal() as db:
            finding_query = select(Finding).where(
                Finding.asset_version_id == uuid.UUID(asset_version_id),
                Finding.organisation_id == uuid.UUID(organisation_id),
            )

            finding_result = await db.execute(finding_query)
            persisted_findings_run1 = finding_result.scalars().all()

            assert len(persisted_findings_run1) == len(audit_data["findings"])
            assert len(persisted_findings_run1) > 0

            assert all(
                finding.validation_status == "VERIFIED"
                for finding in persisted_findings_run1
            )

        # 10. Run the same audit again for the same asset version (Second Audit Run - Immutable History Test).
        second_response = await ac.post(
            f"/api/v1/assets/{asset_id}/versions/{asset_version_id}/audit",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert second_response.status_code == 200
        second_audit_data = second_response.json()["data"]
        assert second_audit_data["status"] == "COMPLIANT"

        # Verify that running a second audit creates a new immutable audit run and preserves history (total findings = run 1 + run 2).
        async with AsyncSessionLocal() as db:
            all_findings_after_second_audit = (
                await db.execute(
                    select(Finding).where(
                        Finding.asset_version_id == uuid.UUID(asset_version_id),
                        Finding.organisation_id == uuid.UUID(organisation_id),
                    )
                )
            ).scalars().all()

            # Immutable history preserves previous findings alongside new ones
            assert len(all_findings_after_second_audit) == len(persisted_findings_run1) * 2

            # Verify both audit runs exist in the database
            audit_runs_result = await db.execute(
                select(AuditRun).where(
                    AuditRun.asset_version_id == uuid.UUID(asset_version_id),
                    AuditRun.organisation_id == uuid.UUID(organisation_id),
                )
            )
            audit_runs = audit_runs_result.scalars().all()
            assert len(audit_runs) == 3
            completed_runs = [
                run for run in audit_runs
                if run.status == AuditRunStatus.COMPLETED
            ]
            assert len(completed_runs) == 2

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

def make_semantic_test_client(
    category="SUPPORTED",
    assessment="SUPPORTS_CLAIM",
    semantic_failure=None,
):
    """Create a mock Groq client for focused semantic verification tests."""

    async def fake_create(**kwargs):
        prompt = kwargs["messages"][1]["content"]

        # Second-stage semantic verification
        if "SEMANTIC EVIDENCE VERIFICATION" in prompt:

            if semantic_failure == "exception":
                raise RuntimeError("Simulated semantic API failure")

            if semantic_failure == "malformed":
                content = json.dumps({
                    "assessment": "INVALID_ASSESSMENT",
                    "explanation": "Invalid test response.",
                })
            else:
                content = json.dumps({
                    "assessment": assessment,
                    "explanation": "Test semantic assessment.",
                })

            return SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(content=content)
                    )
                ]
            )

        # First-stage audit finding generation
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

        asset = "Our official Navy Blue #000080 branding!"
        span_text = "official Navy Blue #000080"
        start = asset.index(span_text)

        ai_result = {
            "summary": "Test audit summary.",
            "findings": [
                {
                    "category": category,
                    "severity": "LOW",
                    "span": {
                        "start": start,
                        "end": start + len(span_text),
                        "text": span_text,
                    },
                    "explanation": "Test finding explanation.",
                    "evidence": [
                        {
                            "source_version_id": source_match.group(1),
                            "passage_id": passage_match.group(1),
                        }
                    ],
                    "suggested_action": "Review if required.",
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

    return SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(
                create=AsyncMock(side_effect=fake_create)
            )
        )
    )


async def run_semantic_audit_test(
    monkeypatch,
    category="SUPPORTED",
    assessment="SUPPORTS_CLAIM",
    semantic_failure=None,
):
    from app.services import audit_service

    source_version_id = uuid.uuid4()
    passage_id = "test-passage-001"

    retrieved_passage = {
        "source_version_id": source_version_id,
        "passage_id": passage_id,
        "text": "Always use official Navy Blue #000080 for headers.",
    }

    mock_client = make_semantic_test_client(
        category=category,
        assessment=assessment,
        semantic_failure=semantic_failure,
    )

    monkeypatch.setattr(
        audit_service,
        "search_and_validate_guidelines",
        AsyncMock(return_value=[retrieved_passage]),
    )

    monkeypatch.setattr(
        audit_service,
        "groq_client",
        mock_client,
    )

    result = await audit_service.evaluate_asset_compliance(
        db=None,
        organisation_id=str(uuid.uuid4()),
        asset_content="Our official Navy Blue #000080 branding!",
    )

    return result

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "category, assessment, expected_status, expected_finding_status",
    [
        (
            "SUPPORTED",
            "INSUFFICIENT",
            "REVIEW_REQUIRED",
            "UNVERIFIED",
        ),
        (
            "SUPPORTED",
            "AMBIGUOUS",
            "REVIEW_REQUIRED",
            "UNVERIFIED",
        ),
        (
            "SUPPORTED",
            "CONTRADICTS_CLAIM",
            "REVIEW_REQUIRED",
            "UNVERIFIED",
        ),
        (
            "CONTRADICTED",
            "CONTRADICTS_CLAIM",
            "NON_COMPLIANT",
            "VERIFIED",
        ),
    ],
)
async def test_semantic_assessment_classification(
    monkeypatch,
    category,
    assessment,
    expected_status,
    expected_finding_status,
):
    result = await run_semantic_audit_test(
        monkeypatch,
        category=category,
        assessment=assessment,
    )
    assert result["status"] == expected_status
    assert result["findings"][0]["validation_status"] == expected_finding_status
    assert result["validation"]["spans_validated"] is True
    assert result["validation"]["checks_completed"] is True
    if expected_finding_status == "UNVERIFIED":
        assert result["validation"]["citations_validated"] is False
    else:
        assert result["validation"]["citations_validated"] is True

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "failure_type",
    ["exception", "malformed"],
)
async def test_semantic_verification_failure_requires_review(
    monkeypatch,
    failure_type,
):
    result = await run_semantic_audit_test(
        monkeypatch,
        category="SUPPORTED",
        assessment="SUPPORTS_CLAIM",
        semantic_failure=failure_type,
    )
    assert result["status"] == "REVIEW_REQUIRED"
    assert result["findings"][0]["validation_status"] == "UNVERIFIED"
    assert result["validation"]["spans_validated"] is True
    assert result["validation"]["checks_completed"] is False
    assert result["validation"]["citations_validated"] is False

@pytest.mark.asyncio
async def test_audit_persistence_failure_rolls_back(monkeypatch):
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.api.v1 import audits

    unique_suffix = uuid.uuid4().hex[:6]
    org_name = f"Rollback Corp {unique_suffix}"
    admin_email = f"rollback_{unique_suffix}@governance.com"

    # 1. Register and log in as admin.
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as ac:

        reg_admin = await ac.post(
            "/api/v1/auth/register",
            json={
                "organisation_name": org_name,
                "name": "Admin Rollback",
                "email": admin_email,
                "password": "securepassword123",
            },
        )

        assert reg_admin.status_code == 201

        admin_data = reg_admin.json()
        organisation_id = uuid.UUID(admin_data["organisation_id"])

        login_admin = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": admin_email,
                "password": "securepassword123",
            },
        )

        assert login_admin.status_code == 200

        admin_token = login_admin.json()["access_token"]

        headers = {
            "Authorization": f"Bearer {admin_token}"
        }

        # 2. Create an asset, its version, and an AuditRun.
        async with AsyncSessionLocal() as db:
            asset = Asset(
                organisation_id=organisation_id,
                title="Rollback Campaign",
                created_by=uuid.UUID(admin_data["id"]),
            )

            db.add(asset)
            await db.flush()

            asset_version = AssetVersion(
                organisation_id=organisation_id,
                asset_id=asset.id,
                version_number=1,
                content_hash=hashlib.sha256(
                    b"Rollback test content"
                ).hexdigest(),
                content_text="Test asset content for rollback.",
                status=AssetVersionStatus.DRAFT,
                created_by=uuid.UUID(admin_data["id"]),
            )

            db.add(asset_version)
            await db.flush()

            audit_run = AuditRun(
                organisation_id=organisation_id,
                asset_version_id=asset_version.id,
                initiated_by=uuid.UUID(admin_data["id"]),
                status=AuditRunStatus.COMPLETED,
            )
            db.add(audit_run)
            await db.flush()

            asset_id = asset.id
            asset_version_id = asset_version.id

            # 3. Save an original finding linked to the audit run.
            original_finding = Finding(
                organisation_id=organisation_id,
                asset_version_id=asset_version_id,
                audit_run_id=audit_run.id,
                category=FindingCategory.SUPPORTED,
                severity="LOW",
                span_start=0,
                span_end=4,
                span_text="Test",
                explanation="Original finding before rollback.",
                suggested_action="No action required.",
                suggested_replacement=None,
                validation_status="VERIFIED",
                model_name="test-model",
                prompt_version="rollback-test-v1",
            )

            db.add(original_finding)
            await db.commit()

            original_finding_id = original_finding.id

        # 4. Mock audit evaluation with a persistable result.
        mocked_audit_result = {
            "status": "COMPLIANT",
            "summary": "Mock audit for rollback testing.",
            "findings": [
                {
                    "category": "SUPPORTED",
                    "severity": "LOW",
                    "span": {
                        "start": 0,
                        "end": 4,
                        "text": "Test",
                    },
                    "explanation": "Replacement finding.",
                    "suggested_action": "No action required.",
                    "suggested_replacement": None,
                    "validation_status": "VERIFIED",
                    "evidence": [],
                }
            ],
            "evidence_used": [],
            "model_name": "test-model",
            "prompt_version": "rollback-test-v1",
            "validation": {
                "citations_validated": True,
                "spans_validated": True,
                "checks_completed": True,
            },
        }

        monkeypatch.setattr(
            audits,
            "evaluate_asset_compliance",
            AsyncMock(return_value=mocked_audit_result),
        )

        # 5. Simulate a failure during the final database commit.
        async def mock_fail_commit(self):
            raise RuntimeError(
                "Simulated database commit failure"
            )

        monkeypatch.setattr(
            AsyncSession,
            "commit",
            mock_fail_commit,
        )

        # 6. Call the audit endpoint.
        response = await ac.post(
            f"/api/v1/assets/{asset_id}/versions/{asset_version_id}/audit",
            headers=headers,
        )

        assert response.status_code == 500

        # 7. Verify rollback preserved the original finding.
        async with AsyncSessionLocal() as db:
            findings_after_failure = (
                await db.execute(
                    select(Finding).where(
                        Finding.asset_version_id == asset_version_id,
                        Finding.organisation_id == organisation_id,
                    )
                )
            ).scalars().all()

        assert len(findings_after_failure) == 1

        assert (
            findings_after_failure[0].id
            == original_finding_id
        )

        assert (
            findings_after_failure[0].explanation
            == "Original finding before rollback."
        )

        print("Simulated commit failure: PASSED")
        print("API error response: HTTP", response.status_code)
        print("Original finding preserved: PASSED")
        print("Partial replacement findings: 0")


@pytest.mark.asyncio
async def test_evidence_link_persistence_failure_rolls_back(monkeypatch):
    from datetime import date
    from sqlalchemy.orm import Session
    from sqlalchemy import event
    from app.api.v1 import audits
    from app.models.brand_source import BrandSource
    from app.models.source_version import SourceVersion, SourceStatus

    unique_suffix = uuid.uuid4().hex[:6]
    org_name = f"Evidence Rollback {unique_suffix}"
    admin_email = f"evidence_{unique_suffix}@governance.com"

    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create organisation and admin.
        register = await ac.post("/api/v1/auth/register", json={
            "organisation_name": org_name,
            "name": "Evidence Rollback Admin",
            "email": admin_email,
            "password": "securepassword123",
        })
        assert register.status_code == 201

        admin_data = register.json()
        organisation_id = uuid.UUID(admin_data["organisation_id"])
        admin_id = uuid.UUID(admin_data["id"])

        login = await ac.post("/api/v1/auth/login", json={
            "email": admin_email,
            "password": "securepassword123",
        })
        assert login.status_code == 200

        headers = {
            "Authorization": f"Bearer {login.json()['access_token']}"
        }

        # 2. Create asset, source version, audit run, original finding and evidence link.
        async with AsyncSessionLocal() as db:
            asset = Asset(
                organisation_id=organisation_id,
                title="Evidence Rollback Campaign",
                created_by=admin_id,
            )
            db.add(asset)
            await db.flush()

            asset_version = AssetVersion(
                organisation_id=organisation_id,
                asset_id=asset.id,
                version_number=1,
                content_hash=hashlib.sha256(
                    b"Evidence rollback content"
                ).hexdigest(),
                content_text="Test asset content for evidence rollback.",
                status=AssetVersionStatus.DRAFT,
                created_by=admin_id,
            )
            db.add(asset_version)
            await db.flush()

            audit_run = AuditRun(
                organisation_id=organisation_id,
                asset_version_id=asset_version.id,
                initiated_by=admin_id,
                status=AuditRunStatus.COMPLETED,
            )
            db.add(audit_run)
            await db.flush()

            brand_source = BrandSource(
                organisation_id=organisation_id,
                name="Rollback Test Guidelines",
                source_type="GUIDELINE",
                owner_user_id=admin_id,
            )
            db.add(brand_source)
            await db.flush()

            source_version = SourceVersion(
                organisation_id=organisation_id,
                source_id=brand_source.id,
                version_number=1,
                effective_from=date.today(),
                effective_to=None,
                status=SourceStatus.APPROVED,
                file_object_key=f"rollback-test-{unique_suffix}",
                content_hash=hashlib.sha256(
                    b"Approved guideline content"
                ).hexdigest(),
                created_by=admin_id,
                approved_by=admin_id,
            )
            db.add(source_version)
            await db.flush()

            original_finding = Finding(
                organisation_id=organisation_id,
                asset_version_id=asset_version.id,
                audit_run_id=audit_run.id,
                category=FindingCategory.SUPPORTED,
                severity="LOW",
                span_start=0,
                span_end=4,
                span_text="Test",
                explanation="Original finding before evidence failure.",
                suggested_action="No action required.",
                validation_status="VERIFIED",
                model_name="test-model",
                prompt_version="evidence-rollback-v1",
            )
            db.add(original_finding)
            await db.flush()

            original_link = EvidenceLink(
                organisation_id=organisation_id,
                finding_id=original_finding.id,
                source_version_id=source_version.id,
                passage_id="original-passage",
            )
            db.add(original_link)

            await db.commit()

            asset_id = asset.id
            asset_version_id = asset_version.id
            source_version_id = source_version.id
            original_finding_id = original_finding.id
            original_link_id = original_link.id

        # 3. Mock an audit that produces a replacement finding and link.
        evidence_item = {
            "source_version_id": str(source_version_id),
            "passage_id": "replacement-passage",
        }

        mocked_audit_result = {
            "status": "COMPLIANT",
            "summary": "Mock audit for evidence rollback.",
            "findings": [{
                "category": "SUPPORTED",
                "severity": "LOW",
                "span": {
                    "start": 0,
                    "end": 4,
                    "text": "Test",
                },
                "explanation": "Replacement finding.",
                "suggested_action": "No action required.",
                "suggested_replacement": None,
                "validation_status": "VERIFIED",
                "evidence": [evidence_item],
            }],
            "evidence_used": [evidence_item],
            "model_name": "test-model",
            "prompt_version": "evidence-rollback-v1",
            "validation": {
                "citations_validated": True,
                "spans_validated": True,
                "checks_completed": True,
            },
        }

        monkeypatch.setattr(
            audits,
            "evaluate_asset_compliance",
            AsyncMock(return_value=mocked_audit_result),
        )

        # 4. Fail specifically when SQLAlchemy tries to flush an EvidenceLink.
        def fail_evidence_link_flush(session, flush_context, instances):
            if any(
                isinstance(obj, EvidenceLink)
                for obj in session.new
            ):
                raise RuntimeError(
                    "Simulated evidence-link insertion failure"
                )

        event.listen(Session, "before_flush", fail_evidence_link_flush)

        try:
            response = await ac.post(
                f"/api/v1/assets/{asset_id}/versions/{asset_version_id}/audit",
                headers=headers,
            )
        finally:
            event.remove(
                Session,
                "before_flush",
                fail_evidence_link_flush,
            )

        assert response.status_code == 500

        # 5. Verify that the original records survived the rollback.
        async with AsyncSessionLocal() as db:
            findings_after_failure = (
                await db.execute(
                    select(Finding).where(
                        Finding.asset_version_id == asset_version_id,
                        Finding.organisation_id == organisation_id,
                    )
                )
            ).scalars().all()

            links_after_failure = (
                await db.execute(
                    select(EvidenceLink).where(
                        EvidenceLink.organisation_id == organisation_id,
                        EvidenceLink.finding_id == original_finding_id,
                    )
                )
            ).scalars().all()

            all_links_after_failure = (
                await db.execute(
                    select(EvidenceLink).where(
                        EvidenceLink.organisation_id == organisation_id,
                        EvidenceLink.source_version_id == source_version_id,
                    )
                )
            ).scalars().all()

        assert len(findings_after_failure) == 1
        assert findings_after_failure[0].id == original_finding_id
        assert (
            findings_after_failure[0].explanation
            == "Original finding before evidence failure."
        )

        assert len(links_after_failure) == 1
        assert links_after_failure[0].id == original_link_id
        assert links_after_failure[0].passage_id == "original-passage"

        assert len(all_links_after_failure) == 1

        print("Evidence-link insertion failure: PASSED")
        print("API error response: HTTP", response.status_code)
        print("Original finding preserved: PASSED")
        print("Original evidence link preserved: PASSED")
        print("Partial replacement evidence links: 0")
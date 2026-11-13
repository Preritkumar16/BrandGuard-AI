import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_auth_and_brand_source_workflow():
    unique_email = f"admin_{uuid.uuid4().hex[:6]}@governance.com"
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register a new tenant & admin user
        reg_response = await ac.post("/api/v1/auth/register", json={
            "organisation_name": "Governance Corp",
            "name": "Audit Admin",
            "email": unique_email,
            "password": "securepassword123"
        })
        assert reg_response.status_code == 201
        data = reg_response.json()
        assert data["email"] == unique_email
        assert data["role"] == "ADMIN"

        # 2. Login to get JWT token
        login_response = await ac.post("/api/v1/auth/login", json={
            "email": unique_email,
            "password": "securepassword123"
        })
        assert login_response.status_code == 200
        token_data = login_response.json()
        token = token_data["access_token"]
        assert token is not None

        # 3. Test authenticated /me endpoint
        me_response = await ac.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert me_response.status_code == 200
        assert me_response.json()["email"] == unique_email

        # 4. Test uploading a brand guideline source (Mock text file upload)
        files = {"file": ("guidelines.txt", b"Brand Rule 1: Always use official logo colors. Never distort proportions.", "text/plain")}
        data_form = {"name": "Primary Brand Guidelines", "source_type": "guideline_text"}
        
        upload_response = await ac.post(
            "/api/v1/sources/",
            data=data_form,
            files=files,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert upload_response.status_code == 201
        source_data = upload_response.json()
        assert source_data["name"] == "Primary Brand Guidelines"
        assert source_data["current_version_id"] is not None

        # 5. List brand sources for tenant
        list_response = await ac.get(
            "/api/v1/sources/",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_response.status_code == 200
        sources = list_response.json()
        assert len(sources) >= 1
        assert sources[0]["name"] == "Primary Brand Guidelines"
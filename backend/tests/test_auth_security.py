import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_public_registration_cannot_assign_role():
    email = f"security_{uuid.uuid4().hex[:8]}@example.com"

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as ac:
        response = await ac.post(
            "/api/v1/auth/register",
            json={
                "organisation_name": "Security Test Org",
                "name": "Security Tester",
                "email": email,
                "password": "securepassword123",
                "role": "REVIEWER",
            },
        )

    assert response.status_code == 422
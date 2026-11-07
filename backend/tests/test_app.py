from fastapi.testclient import TestClient
from app.main import app


def test_root_endpoint():
    with TestClient(app) as client:
        response = client.get("/")

    assert response.status_code == 200
    assert response.json()["version"] == "0.1.0"


def test_health_endpoint_exists():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code in (200, 503)
    assert "data" in response.json()
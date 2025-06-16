import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.main import app
from src.database import get_db, Base
import tempfile
import os

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def auth_headers(client):
    # Register and get token
    response = client.post("/v2/auth/register", json={
        "email": "test@example.com",
        "password": "testpass123",
        "name": "Test User"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

class TestAuthEndpoints:
    def test_register_success(self, client):
        response = client.post("/v2/auth/register", json={
            "email": "test@example.com",
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_register_duplicate_email(self, client):
        # Register first user
        client.post("/v2/auth/register", json={
            "email": "test@example.com",
            "password": "testpass123"
        })
        
        # Try to register again with same email
        response = client.post("/v2/auth/register", json={
            "email": "test@example.com",
            "password": "newpass123"
        })
        assert response.status_code == 400

    def test_login_success(self, client):
        # Register user first
        client.post("/v2/auth/register", json={
            "email": "test@example.com",
            "password": "testpass123"
        })
        
        # Login
        response = client.post("/v2/auth/login", json={
            "email": "test@example.com",
            "password": "testpass123"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login_invalid_credentials(self, client):
        response = client.post("/v2/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401

    def test_get_profile(self, client, auth_headers):
        response = client.get("/v2/auth/profile", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"

class TestKnowledgeEndpoints:
    def test_upload_knowledge(self, client, auth_headers):
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("Test content for knowledge upload")
            temp_file = f.name
        
        try:
            with open(temp_file, 'rb') as f:
                response = client.post(
                    "/v2/knowledge/",
                    files={"files": ("test.txt", f, "text/plain")},
                    data={
                        "auto_process": "true",
                        "generate_content": "true",
                        "content_types": "summary,notes",
                        "content_language": "English"
                    },
                    headers=auth_headers
                )
            
            assert response.status_code == 200
            data = response.json()
            assert "knowledge_id" in data
            assert "ws_channel" in data
        finally:
            os.unlink(temp_file)

    def test_list_knowledge(self, client, auth_headers):
        response = client.get("/v2/knowledge/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_get_knowledge_not_found(self, client, auth_headers):
        response = client.get("/v2/knowledge/999", headers=auth_headers)
        assert response.status_code == 404

class TestAnalyticsEndpoints:
    def test_track_event(self, client, auth_headers):
        response = client.post("/v2/analytics/track-event", json={
            "event_type": "chapter_view",
            "knowledge_id": 1,
            "chapter_id": "chapter_1",
            "data": {"duration": 30}
        }, headers=auth_headers)
        assert response.status_code == 200

class TestSearchEndpoints:
    def test_search(self, client, auth_headers):
        response = client.get("/v2/search/?q=test", headers=auth_headers)
        assert response.status_code == 200

class TestAdminEndpoints:
    def test_health_check(self, client):
        response = client.get("/v2/admin/health/full")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "services" in data

if __name__ == "__main__":
    pytest.main([__file__])

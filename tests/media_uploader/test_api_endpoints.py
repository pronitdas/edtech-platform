import pytest
import requests
import json
from datetime import datetime
from typing import Dict, Any
import coverage

# Start code coverage
cov = coverage.Coverage()
cov.start()

BASE_URL = "http://0.0.0.0:8000"
KNOWLEDGE_ID = "134"

class TestMediaUploaderAPI:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test environment before each test"""
        self.session = requests.Session()
        yield
        self.session.close()

    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Helper method to make HTTP requests"""
        url = f"{BASE_URL}{endpoint}"
        return self.session.request(method, url, **kwargs)

    def test_health_check(self):
        """Test health check endpoint"""
        response = self._make_request("GET", "/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_process_knowledge(self):
        """Test knowledge processing endpoint"""
        response = self._make_request("GET", f"/process/{KNOWLEDGE_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["knowledge_id"] == int(KNOWLEDGE_ID)
        assert "status" in data

    def test_process_retry(self):
        """Test process retry endpoint"""
        payload = {
            "force": True,
            "content_generation": True,
            "content_types": ["notes", "summary", "quiz", "mindmap"],
            "content_language": "English"
        }
        response = self._make_request("POST", f"/process/{KNOWLEDGE_ID}/retry", json=payload)
        assert response.status_code == 200

    def test_process_retry_history(self):
        """Test process retry history endpoint"""
        response = self._make_request("GET", f"/process/{KNOWLEDGE_ID}/retry-history")
        assert response.status_code == 200

    def test_process_status(self):
        """Test process status endpoint"""
        response = self._make_request("GET", f"/process/{KNOWLEDGE_ID}/status")
        assert response.status_code == 200
        data = response.json()
        assert data["knowledge_id"] == int(KNOWLEDGE_ID)

    def test_process_images(self):
        """Test process images endpoint"""
        response = self._make_request("GET", f"/process/{KNOWLEDGE_ID}/images")
        assert response.status_code == 200
        data = response.json()
        assert data["knowledge_id"] == int(KNOWLEDGE_ID)

    def test_generate_content(self):
        """Test content generation endpoint"""
        params = {
            "types": ["notes", "summary", "quiz", "mindmap"],
            "language": "English"
        }
        response = self._make_request("GET", f"/generate-content/{KNOWLEDGE_ID}", params=params)
        assert response.status_code == 200

    def test_chapters(self):
        """Test chapters endpoint"""
        response = self._make_request("GET", f"/chapters/{KNOWLEDGE_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_video_process(self):
        """Test video processing endpoint"""
        # Note: This is a mock test since we can't upload real files in this context
        files = {
            'file': ('test.mp4', b'dummy content', 'video/mp4')
        }
        data = {
            'knowledge_id': KNOWLEDGE_ID,
            'knowledge_name': 'Test Video'
        }
        response = self._make_request("POST", "/test/video-process", files=files, data=data)
        assert response.status_code in [200, 422]  # Accept both success and validation error

    def test_knowledge_graph_sync(self):
        """Test knowledge graph sync endpoint"""
        response = self._make_request("POST", f"/knowledge-graph/{KNOWLEDGE_ID}/sync")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "syncing"

    def test_knowledge_graph_sync_all(self):
        """Test sync all knowledge graphs endpoint"""
        response = self._make_request("POST", "/knowledge-graph/sync-all")
        assert response.status_code == 200

    def test_knowledge_graph_get(self):
        """Test get knowledge graph endpoint"""
        response = self._make_request("GET", f"/knowledge-graph/{KNOWLEDGE_ID}")
        assert response.status_code == 200

    def test_knowledge_graph_concepts(self):
        """Test knowledge graph concepts endpoint"""
        response = self._make_request("GET", f"/knowledge-graph/{KNOWLEDGE_ID}/concepts")
        assert response.status_code == 200

    def test_knowledge_graph_schema(self):
        """Test knowledge graph schema endpoint"""
        response = self._make_request("GET", "/knowledge-graph/schema")
        assert response.status_code == 200

    def test_knowledge_graph_delete(self):
        """Test delete knowledge graph endpoint"""
        response = self._make_request("DELETE", f"/knowledge-graph/{KNOWLEDGE_ID}")
        assert response.status_code == 200

if __name__ == "__main__":
    # Run tests and generate coverage report
    pytest.main(["-v", "--cov=.", "--cov-report=html", __file__])
    
    # Stop coverage
    cov.stop()
    cov.save()
    
    # Generate coverage reports
    cov.html_report(directory="coverage_reports")
    print("\nCoverage report generated in coverage_reports/index.html") 
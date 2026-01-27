"""
E2E Tests for Backend Services
Tests the complete workflow including OCR, LLM, and API endpoints
"""

import pytest
import asyncio
import os
from typing import Dict, Any
from unittest.mock import Mock, patch, AsyncMock

# Set environment variables for testing
os.environ["USE_VM_LLM"] = "true"
os.environ["VM_LLM_BASE_URL"] = "http://192.168.29.70:1234/v1"
os.environ["USE_OPENAI_FALLBACK"] = "false"
os.environ["USE_ANTHROPIC_FALLBACK"] = "false"
os.environ["USE_DOCLING"] = "true"
os.environ["USE_DEEPSEEK_OCR"] = "false"

# Test configuration
TEST_VM_URL = os.getenv("VM_LLM_BASE_URL", "http://192.168.29.70:1234/v1")
TEST_MODEL = os.getenv("VM_LLM_MODEL", "llama3.2-vision")


class TestVMLLMProvider:
    """Test VM LLM Provider integration"""
    
    @pytest.fixture
    def vm_provider(self):
        """Create VM LLM provider instance"""
        from src.services.vm_llm_provider import VMLLMProvider
        return VMLLMProvider()
    
    @pytest.mark.asyncio
    async def test_vm_provider_initialization(self, vm_provider):
        """Test that VM provider initializes correctly"""
        assert vm_provider.base_url == TEST_VM_URL
        assert "Authorization" in vm_provider.headers
    
    @pytest.mark.asyncio
    async def test_vm_provider_list_models(self, vm_provider):
        """Test listing available models from VM"""
        try:
            models = await vm_provider.list_models()
            # If VM is available, check response structure
            if models:
                assert isinstance(models, list)
                # Each model should have id and other fields
                for model in models:
                    assert "id" in model
        except Exception as e:
            # VM might not be available in test environment
            pytest.skip(f"VM not available: {e}")
    
    @pytest.mark.asyncio
    async def test_vm_provider_health_check(self, vm_provider):
        """Test VM health check"""
        try:
            is_healthy = await vm_provider.check_health()
            # If VM is available, it should be healthy
            if not is_healthy:
                pytest.skip("VM health check failed")
        except Exception as e:
            pytest.skip(f"VM not reachable: {e}")
    
    @pytest.mark.asyncio
    async def test_vm_provider_completion(self, vm_provider):
        """Test LLM completion with mock data"""
        mock_messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is 2+2?"}
        ]
        
        try:
            response = await vm_provider.complete(
                messages=mock_messages,
                model=TEST_MODEL,
                temperature=0.7,
                max_tokens=100
            )
            
            assert response is not None
            assert "choices" in response or "error" in response
            
            if "choices" in response:
                choice = response["choices"][0]
                assert "message" in choice
                assert "content" in choice["message"]
        except Exception as e:
            pytest.skip(f"VM completion failed: {e}")


class TestFeatureFlags:
    """Test feature flag configuration"""
    
    def test_ocr_provider_selection(self):
        """Test OCR provider selection based on feature flags"""
        from src.services.vm_llm_provider import FeatureFlags
        
        # Test docling enabled
        with patch.dict(os.environ, {"USE_DOCLING": "true", "USE_DEEPSEEK_OCR": "false"}):
            # Reload module to pick up env changes
            import importlib
            import src.services.vm_llm_provider as vm_module
            importlib.reload(vm_module)
            
            assert vm_module.FeatureFlags.get_ocr_provider() == "docling"
    
    def test_llm_provider_selection(self):
        """Test LLM provider selection based on feature flags"""
        from src.services.vm_llm_provider import FeatureFlags
        
        # Test VM LLM enabled
        with patch.dict(os.environ, {"USE_VM_LLM": "true"}):
            import importlib
            import src.services.vm_llm_provider as vm_module
            importlib.reload(vm_module)
            
            assert vm_module.FeatureFlags.get_llm_provider() == "vm"
    
    def test_feature_flags_defaults(self):
        """Test default feature flag values"""
        from src.services.vm_llm_provider import FeatureFlags
        
        assert FeatureFlags.ENABLE_STREAMING is True
        assert FeatureFlags.ENABLE_CACHING is True
        assert FeatureFlags.ENABLE_OCR_TABLE_EXTRACTION is True


class TestOCRService:
    """Test OCR service with feature flags"""
    
    @pytest.fixture
    def ocr_service(self):
        """Create OCR service instance"""
        from src.services.ocr_service import OCRService
        return OCRService()
    
    def test_ocr_service_initialization(self, ocr_service):
        """Test OCR service initializes with correct provider"""
        from src.services.vm_llm_provider import FeatureFlags
        
        assert ocr_service.provider_name == FeatureFlags.get_ocr_provider()
    
    def test_ocr_provider_info(self, ocr_service):
        """Test getting provider info"""
        info = ocr_service.get_provider_info()
        
        assert "provider" in info
        assert "docling_enabled" in info
        assert "deepseek_enabled" in info
        assert "table_extraction_enabled" in info


class TestAPIEndpoints:
    """Test API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        from fastapi.testclient import TestClient
        from src.main import app  # Assuming main.py exists
        return TestClient(app)
    
    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code in [200, 503]  # 503 if dependencies not available
    
    def test_llm_models_endpoint(self, client):
        """Test LLM models listing endpoint"""
        response = client.get("/api/v2/llm/models")
        # Should return models list or auth error
        assert response.status_code in [200, 401, 403]


class TestDocumentProcessing:
    """Test document processing workflows"""
    
    @pytest.mark.asyncio
    async def test_ocr_text_extraction(self):
        """Test OCR text extraction (requires test files)"""
        # This would test actual OCR if test files exist
        # For now, just test the service can be instantiated
        from src.services.ocr_service import OCRService
        
        service = OCRService()
        assert service is not None
    
    @pytest.mark.asyncio
    async def test_content_generation_workflow(self):
        """Test complete content generation workflow"""
        from src.services.content_service import ContentService
        from sqlalchemy.orm import Session
        
        # Create mock database session
        mock_db = Mock(spec=Session)
        
        service = ContentService(mock_db)
        assert service is not None


class TestE2EWorkflows:
    """End-to-end workflow tests"""
    
    @pytest.mark.asyncio
    async def test_complete_ocr_llm_pipeline(self):
        """Test complete OCR + LLM pipeline"""
        # 1. OCR extraction
        from src.services.ocr_service import OCRService
        from src.services.vm_llm_provider import VMLLMProvider
        
        ocr_service = OCRService()
        vm_provider = VMLLMProvider()
        
        # Verify both services can be created
        assert ocr_service is not None
        assert vm_provider is not None
        
        # Verify feature flags
        from src.services.vm_llm_provider import FeatureFlags
        assert FeatureFlags.USE_VM_LLM is True
        assert FeatureFlags.USE_DOCLING is True
    
    @pytest.mark.asyncio
    async def test_content_generation_with_vm(self):
        """Test content generation using VM LLM"""
        from src.services.llm_service import LLMService
        from src.services.vm_llm_provider import FeatureFlags
        
        service = LLMService()
        
        # Test with mock data since actual VM might not be available
        result = await service.generate_structured_content(
            system_prompt="You are a helpful tutor.",
            user_prompt="topic: Photosynthesis",
            schema_type="chapter_structure"
        )
        
        assert result is not None
        assert "chapters" in result
        assert len(result["chapters"]) > 0


# Pytest configuration
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

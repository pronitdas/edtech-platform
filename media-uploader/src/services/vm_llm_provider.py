"""
VM LLM Provider for local LLM models at 192.168.29.70:1234
OpenAI-compatible API interface for local models
"""

import os
import json
import asyncio
import aiohttp
from typing import Dict, Any, Optional, List, AsyncGenerator
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# VM Configuration
VM_BASE_URL = os.getenv("VM_LLM_BASE_URL", "http://192.168.29.70:1234/v1")
VM_API_KEY = os.getenv("VM_LLM_API_KEY", "no-key-required")

class VMLLMProvider:
    """Provider for VM-hosted LLM models (OpenAI-compatible interface)"""
    
    def __init__(self):
        self.base_url = VM_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {VM_API_KEY}",
            "Content-Type": "application/json"
        }
    
    async def complete(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Complete using VM LLM"""
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=300)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"VM LLM error: {error_text}")
                        raise Exception(f"VM LLM API error: {error_text}")
                    
                    return await response.json()
                    
            except aiohttp.ClientError as e:
                logger.error(f"VM LLM connection error: {e}")
                raise Exception(f"Failed to connect to VM LLM: {str(e)}")
    
    async def stream_complete(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """Stream completion from VM LLM"""
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": True
        }
        
        if max_tokens:
            payload["max_tokens"] = max_tokens
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"VM LLM API error: {error_text}")
                
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        data = line[6:]
                        if data == '[DONE]':
                            break
                        try:
                            yield line + '\n\n'
                        except json.JSONDecodeError:
                            continue
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models on VM"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{self.base_url}/models",
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data", [])
                    return []
            except Exception as e:
                logger.warning(f"Failed to list VM models: {e}")
                return []
    
    async def check_health(self) -> bool:
        """Check if VM is healthy"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/health",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    return response.status == 200
        except Exception:
            return False


# Feature flag configuration
class FeatureFlags:
    """Feature flags for backend configuration"""
    
    # LLM Provider selection
    USE_VM_LLM = os.getenv("USE_VM_LLM", "false").lower() == "true"
    VM_LLM_MODEL = os.getenv("VM_LLM_MODEL", "llama3.2-vision")
    
    # Fallback providers
    USE_OPENAI_FALLBACK = os.getenv("USE_OPENAI_FALLBACK", "true").lower() == "true"
    USE_ANTHROPIC_FALLBACK = os.getenv("USE_ANTHROPIC_FALLBACK", "false").lower() == "true"
    
    # OCR Provider selection (Docling vs DeepSeek OCR 2)
    OCR_PROVIDER = os.getenv("OCR_PROVIDER", "docling")  # "docling" or "deepseek"
    USE_DEEPSEEK_OCR = os.getenv("USE_DEEPSEEK_OCR", "false").lower() == "true"
    USE_DOCLING = os.getenv("USE_DOCLING", "true").lower() == "true"
    
    # Feature flags
    ENABLE_STREAMING = os.getenv("ENABLE_STREAMING", "true").lower() == "true"
    ENABLE_CACHING = os.getenv("ENABLE_CACHING", "true").lower() == "true"
    ENABLE_OCR_TABLE_EXTRACTION = os.getenv("ENABLE_OCR_TABLE_EXTRACTION", "true").lower() == "true"
    ENABLE_OCR_LAYOUT_ANALYSIS = os.getenv("ENABLE_OCR_LAYOUT_ANALYSIS", "true").lower() == "true"
    
    @classmethod
    def get_ocr_provider(cls) -> str:
        """Get configured OCR provider"""
        if cls.USE_DEEPSEEK_OCR:
            return "deepseek"
        elif cls.USE_DOCLING:
            return "docling"
        else:
            return "docling"  # Default
    
    @classmethod
    def get_llm_provider(cls) -> str:
        """Get configured LLM provider"""
        if cls.USE_VM_LLM:
            return "vm"
        elif cls.USE_OPENAI_FALLBACK:
            return "openai"
        elif cls.USE_ANTHROPIC_FALLBACK:
            return "anthropic"
        else:
            return "vm"  # Default


# Export singleton
vm_llm_provider = VMLLMProvider()

__all__ = ['VMLLMProvider', 'vm_llm_provider', 'FeatureFlags']

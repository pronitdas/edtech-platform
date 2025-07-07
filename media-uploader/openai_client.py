import logging
import time
import asyncio
from typing import Dict, List, Any, Optional
import openai
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenAIMessage:
    """OpenAI message structure."""
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content
    
    def to_dict(self) -> Dict[str, str]:
        return {
            "role": self.role,
            "content": self.content
        }

class OpenAIClient:
    """Client for interacting with OpenAI API."""
    
    def __init__(self, api_key: str, base_url: str = None):
        """Initialize the OpenAI client with the API key."""
        self.max_retries = 3
        self.retry_delay = 1.0
        self.timeout = 30.0
        
        try:
            if base_url:
                self.client = OpenAI(
                    api_key=api_key, 
                    base_url=base_url,
                    timeout=self.timeout,
                    max_retries=0  # We'll handle retries ourselves
                )
            else:
                self.client = OpenAI(
                    api_key=api_key,
                    timeout=self.timeout,
                    max_retries=0
                )
            logger.info(f"OpenAI client initialized with base_url: {base_url or 'default'}")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            raise
    
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "llama-3.2-3b-instruct", 
        max_tokens: int = 4096,
        json_schema: Optional[Dict] = None
    ) -> str:
        """
        Send a chat completion request to OpenAI with retry logic.
        
        Args:
            messages: List of message dictionaries with role and content
            model: Model to use (default: llama-3.2-3b-instruct for local)
            max_tokens: Maximum tokens to generate
            json_schema: Optional JSON schema for structured output
            
        Returns:
            The generated text response
        """
        params = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7
        }
        
        if json_schema:
            params["response_format"] = {
                "type": "json_schema",
                "json_schema": json_schema
            }
        
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                logger.debug(f"Attempt {attempt + 1} for chat completion with model {model}")
                
                # Make the request
                response = self.client.chat.completions.create(**params)
                
                # Validate response
                if not response or not response.choices:
                    raise ValueError("Empty response from API")
                
                content = response.choices[0].message.content
                if not content or not content.strip():
                    raise ValueError("Empty content in response")
                
                logger.debug(f"Successfully generated {len(content)} characters")
                return content.strip()
                
            except openai.APITimeoutError as e:
                last_error = f"Timeout error: {str(e)}"
                logger.warning(f"Attempt {attempt + 1} timed out: {e}")
                
            except openai.APIConnectionError as e:
                last_error = f"Connection error: {str(e)}"
                logger.warning(f"Attempt {attempt + 1} connection failed: {e}")
                
            except openai.RateLimitError as e:
                last_error = f"Rate limit error: {str(e)}"
                logger.warning(f"Attempt {attempt + 1} rate limited: {e}")
                
            except openai.APIError as e:
                last_error = f"API error: {str(e)}"
                logger.warning(f"Attempt {attempt + 1} API error: {e}")
                
            except Exception as e:
                last_error = f"Unexpected error: {str(e)}"
                logger.warning(f"Attempt {attempt + 1} failed with unexpected error: {e}")
            
            # Wait before retry (exponential backoff)
            if attempt < self.max_retries - 1:
                wait_time = self.retry_delay * (2 ** attempt)
                logger.info(f"Waiting {wait_time}s before retry {attempt + 2}")
                await asyncio.sleep(wait_time)
        
        # All retries failed
        error_msg = f"Failed after {self.max_retries} attempts. Last error: {last_error}"
        logger.error(error_msg)
        
        # Return a structured error response instead of generic text
        if json_schema:
            return '{"error": "Failed to generate content", "details": "' + str(last_error) + '"}'
        else:
            return f"Error: Failed to generate content after {self.max_retries} attempts. Please try again later." 
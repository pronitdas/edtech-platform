import logging
from typing import Dict, List, Any, Optional
import openai

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
    
    def __init__(self, api_key: str):
        """Initialize the OpenAI client with the API key."""
        self.client = openai.OpenAI(api_key=api_key, base_url="http://192.168.1.12:1234/v1")
    
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "gpt-3.5-turbo", 
        max_tokens: int = 4096,
        json_schema: Optional[Dict] = None
    ) -> str:
        """
        Send a chat completion request to OpenAI.
        
        Args:
            messages: List of message dictionaries with role and content
            model: OpenAI model to use
            max_tokens: Maximum tokens to generate
            json_schema: Optional JSON schema for structured output
            
        Returns:
            The generated text response
        """
        try:
            params = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens
            }
            
            if json_schema:
                params["response_format"] = {
                    "type": "json_schema",
                    "json_schema": json_schema
                }
            
            response = self.client.chat.completions.create(**params)
            print(response)
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content.strip()
            
            raise ValueError("No response content")
            
        except Exception as e:
            logger.error(f"Error fetching data from OpenAI: {str(e)}")
            return "Error in fetching data." 
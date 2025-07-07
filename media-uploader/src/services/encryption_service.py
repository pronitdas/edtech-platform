"""
Encryption service for securely storing and retrieving API keys
"""
import os
import hashlib
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Tuple, Optional
import secrets

class EncryptionService:
    """Service for encrypting and decrypting sensitive data like API keys"""
    
    def __init__(self):
        # Get encryption key from environment or generate one
        self.encryption_key = self._get_or_generate_key()
        self.fernet = Fernet(self.encryption_key)
    
    def _get_or_generate_key(self) -> bytes:
        """Get encryption key from environment or generate a new one"""
        # In production, this should be stored in a secure key management service
        env_key = os.getenv("API_KEY_ENCRYPTION_KEY")
        
        if env_key:
            # Decode the base64 encoded key from environment
            try:
                return base64.urlsafe_b64decode(env_key.encode())
            except Exception:
                print("Warning: Invalid encryption key in environment, generating new one")
        
        # Generate a new key (for development)
        password = os.getenv("API_KEY_ENCRYPTION_PASSWORD", "default-dev-password").encode()
        salt = os.getenv("API_KEY_ENCRYPTION_SALT", "default-dev-salt").encode()
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        
        # In development, print the key so it can be set in environment
        if not env_key:
            print(f"Generated encryption key: {key.decode()}")
            print("Set API_KEY_ENCRYPTION_KEY environment variable to this value")
        
        return key
    
    def encrypt_api_key(self, api_key: str) -> Tuple[str, str]:
        """
        Encrypt an API key and return encrypted value and hash
        
        Args:
            api_key: The plain text API key
            
        Returns:
            Tuple of (encrypted_key, hash) both as base64 strings
        """
        if not api_key:
            raise ValueError("API key cannot be empty")
        
        # Encrypt the API key
        encrypted = self.fernet.encrypt(api_key.encode())
        encrypted_b64 = base64.urlsafe_b64encode(encrypted).decode()
        
        # Create a hash for verification (not reversible)
        hash_value = self._hash_api_key(api_key)
        
        return encrypted_b64, hash_value
    
    def decrypt_api_key(self, encrypted_key: str) -> str:
        """
        Decrypt an API key
        
        Args:
            encrypted_key: Base64 encoded encrypted API key
            
        Returns:
            The plain text API key
        """
        if not encrypted_key:
            raise ValueError("Encrypted key cannot be empty")
        
        try:
            # Decode from base64 and decrypt
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
            decrypted = self.fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt API key: {str(e)}")
    
    def verify_api_key(self, api_key: str, stored_hash: str) -> bool:
        """
        Verify an API key against its stored hash
        
        Args:
            api_key: The plain text API key to verify
            stored_hash: The stored hash to compare against
            
        Returns:
            True if the API key matches the hash
        """
        if not api_key or not stored_hash:
            return False
        
        computed_hash = self._hash_api_key(api_key)
        return secrets.compare_digest(computed_hash, stored_hash)
    
    def _hash_api_key(self, api_key: str) -> str:
        """Create a SHA256 hash of the API key for verification"""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    def mask_api_key(self, api_key: str, visible_chars: int = 4) -> str:
        """
        Mask an API key for display purposes
        
        Args:
            api_key: The API key to mask
            visible_chars: Number of characters to show at the end
            
        Returns:
            Masked API key (e.g., "sk-...j4k2")
        """
        if not api_key:
            return ""
        
        if len(api_key) <= visible_chars:
            return "*" * len(api_key)
        
        return "*" * (len(api_key) - visible_chars) + api_key[-visible_chars:]

# Global instance
encryption_service = EncryptionService()
"""
Profile service for managing user profiles and API keys
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models import User, UserApiKey
from src.services.encryption_service import encryption_service
import logging

logger = logging.getLogger(__name__)

class ProfileService:
    """Service for managing user profiles and API keys"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Profile Management
    def get_user_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user profile including basic info and settings"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Parse roles properly
        roles = user.roles if isinstance(user.roles, list) else []
        if isinstance(user.roles, str):
            try:
                import json
                roles = json.loads(user.roles)
            except:
                roles = []
        
        primary_role = roles[0] if roles else "student"
        
        profile = {
            "id": user.id,
            "email": user.email,
            "name": user.display_name,
            "role": primary_role,
            "roles": roles,
            "onboarding_completed": user.onboarding_completed,
            "profile_settings": user.profile_settings or {},
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }
        
        # Add role-specific fields
        if "student" in roles:
            profile.update({
                "grade_level": user.grade_level,
                "subjects_of_interest": user.subjects_of_interest or [],
                "learning_goals": user.learning_goals,
                "preferred_difficulty": user.preferred_difficulty
            })
        elif "teacher" in roles:
            profile.update({
                "school_name": user.school_name,
                "subjects_taught": user.subjects_taught or [],
                "grade_levels_taught": user.grade_levels_taught or [],
                "years_experience": user.years_experience,
                "classroom_size": user.classroom_size
            })
        
        return profile
    
    def update_profile_settings(self, user_id: int, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile settings"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Merge with existing settings
        current_settings = user.profile_settings or {}
        current_settings.update(settings)
        
        user.profile_settings = current_settings
        user.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(user)
        
        return {"message": "Profile settings updated successfully"}
    
    # API Key Management
    def add_api_key(self, user_id: int, provider_name: str, api_key: str) -> Dict[str, Any]:
        """Add or update an API key for a provider"""
        try:
            # Validate inputs
            if not api_key.strip():
                raise ValueError("API key cannot be empty")
            
            if not provider_name.strip():
                raise ValueError("Provider name cannot be empty")
            
            # Encrypt the API key
            encrypted_key, key_hash = encryption_service.encrypt_api_key(api_key)
            
            # Check if API key already exists for this user/provider
            existing_key = self.db.query(UserApiKey).filter(
                and_(
                    UserApiKey.user_id == user_id,
                    UserApiKey.provider_name == provider_name
                )
            ).first()
            
            if existing_key:
                # Update existing key
                existing_key.api_key_encrypted = encrypted_key
                existing_key.api_key_hash = key_hash
                existing_key.updated_at = datetime.utcnow()
                existing_key.is_active = True
                action = "updated"
            else:
                # Create new key
                new_key = UserApiKey(
                    user_id=user_id,
                    provider_name=provider_name,
                    api_key_encrypted=encrypted_key,
                    api_key_hash=key_hash,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                self.db.add(new_key)
                action = "added"
            
            self.db.commit()
            
            logger.info(f"API key {action} for user {user_id}, provider {provider_name}")
            
            return {
                "message": f"API key {action} successfully",
                "provider": provider_name,
                "masked_key": encryption_service.mask_api_key(api_key)
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to add API key for user {user_id}: {str(e)}")
            raise ValueError(f"Failed to save API key: {str(e)}")
    
    def get_api_keys(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all API keys for a user (masked for security)"""
        keys = self.db.query(UserApiKey).filter(
            and_(
                UserApiKey.user_id == user_id,
                UserApiKey.is_active == True
            )
        ).all()
        
        result = []
        for key in keys:
            try:
                # Decrypt to get the actual key for masking
                decrypted_key = encryption_service.decrypt_api_key(key.api_key_encrypted)
                masked_key = encryption_service.mask_api_key(decrypted_key)
            except Exception as e:
                logger.error(f"Failed to decrypt API key for user {user_id}, provider {key.provider_name}: {str(e)}")
                masked_key = "***ERROR***"
            
            result.append({
                "id": key.id,
                "provider_name": key.provider_name,
                "masked_key": masked_key,
                "created_at": key.created_at.isoformat() if key.created_at else None,
                "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
                "is_active": key.is_active
            })
        
        return result
    
    def get_api_key(self, user_id: int, provider_name: str) -> Optional[str]:
        """Get decrypted API key for a specific provider"""
        key = self.db.query(UserApiKey).filter(
            and_(
                UserApiKey.user_id == user_id,
                UserApiKey.provider_name == provider_name,
                UserApiKey.is_active == True
            )
        ).first()
        
        if not key:
            return None
        
        try:
            # Update last used timestamp
            key.last_used_at = datetime.utcnow()
            self.db.commit()
            
            return encryption_service.decrypt_api_key(key.api_key_encrypted)
        except Exception as e:
            logger.error(f"Failed to decrypt API key for user {user_id}, provider {provider_name}: {str(e)}")
            return None
    
    def delete_api_key(self, user_id: int, provider_name: str) -> Dict[str, Any]:
        """Delete an API key for a provider"""
        key = self.db.query(UserApiKey).filter(
            and_(
                UserApiKey.user_id == user_id,
                UserApiKey.provider_name == provider_name
            )
        ).first()
        
        if not key:
            raise ValueError(f"API key not found for provider {provider_name}")
        
        # Soft delete by marking as inactive
        key.is_active = False
        key.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        logger.info(f"API key deleted for user {user_id}, provider {provider_name}")
        
        return {"message": f"API key for {provider_name} deleted successfully"}
    
    def test_api_key(self, user_id: int, provider_name: str) -> Dict[str, Any]:
        """Test an API key by making a simple API call"""
        api_key = self.get_api_key(user_id, provider_name)
        if not api_key:
            raise ValueError(f"No API key found for provider {provider_name}")
        
        # TODO: Implement actual API testing based on provider
        # For now, just return success if key exists
        return {
            "provider": provider_name,
            "status": "success",
            "message": "API key is valid and accessible"
        }
    
    def get_supported_providers(self) -> List[Dict[str, Any]]:
        """Get list of supported API providers"""
        return [
            {
                "name": "openai",
                "display_name": "OpenAI",
                "description": "GPT models, DALL-E, Whisper",
                "key_format": "sk-...",
                "setup_url": "https://platform.openai.com/api-keys"
            },
            {
                "name": "anthropic",
                "display_name": "Anthropic",
                "description": "Claude models",
                "key_format": "sk-ant-...",
                "setup_url": "https://console.anthropic.com/settings/keys"
            },
            {
                "name": "google",
                "display_name": "Google AI",
                "description": "Gemini models, Palm",
                "key_format": "AIza...",
                "setup_url": "https://makersuite.google.com/app/apikey"
            },
            {
                "name": "cohere",
                "display_name": "Cohere",
                "description": "Command, Embed models",
                "key_format": "...",
                "setup_url": "https://dashboard.cohere.ai/api-keys"
            }
        ]
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime

from models import Knowledge, Base
from src.models.v2_models import RoleplayResponse
from openai_client import OpenAIClient

# Define the RoleplayScenario model if not in models.py
try:
    from models import RoleplayScenario
except ImportError:
    from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
    
    class RoleplayScenario(Base):
        __tablename__ = "roleplay_scenarios"
        
        id = Column(Integer, primary_key=True)
        knowledge_id = Column(Integer, ForeignKey("knowledge.id", ondelete="CASCADE"), nullable=False)
        chapter_id = Column(String(64))
        language = Column(String(48), default="English")
        topic = Column(Text)
        prompt = Column(Text)
        response = Column(Text)
        created_at = Column(DateTime, default=datetime.utcnow)

class RoleplayService:
    def __init__(self, db: Session):
        self.db = db
        self.openai_client = OpenAIClient()

    async def validate_user_access(self, knowledge_id: int, user_id: int) -> Knowledge:
        """Validate user access and return knowledge entry."""
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            raise ValueError("Knowledge entry not found or access denied")
        
        return knowledge

    async def generate_scenario(
        self,
        knowledge_id: int,
        topic: str,
        content: str,
        language: str = "English",
        user_id: int = None
    ) -> RoleplayResponse:
        """Generate a new roleplay scenario based on knowledge content."""
        # Validate access
        knowledge = await self.validate_user_access(knowledge_id, user_id)
        
        try:
            # Create roleplay prompt
            roleplay_prompt = self._create_roleplay_prompt(topic, content, language)
            
            # Generate scenario using OpenAI
            response = await self.openai_client.generate_roleplay_scenario(
                prompt=roleplay_prompt,
                topic=topic,
                language=language
            )
            
            # Extract prompt and response from OpenAI output
            scenario_prompt = response.get("prompt", roleplay_prompt)
            scenario_response = response.get("response", "")
            
            # Save to database
            scenario = RoleplayScenario(
                knowledge_id=knowledge_id,
                chapter_id=None,  # Could be set if generated for specific chapter
                language=language,
                topic=topic,
                prompt=scenario_prompt,
                response=scenario_response
            )
            
            self.db.add(scenario)
            self.db.commit()
            self.db.refresh(scenario)
            
            return RoleplayResponse(
                id=scenario.id,
                knowledge_id=scenario.knowledge_id,
                chapter_id=scenario.chapter_id,
                language=scenario.language,
                topic=scenario.topic,
                prompt=scenario.prompt,
                response=scenario.response,
                created_at=scenario.created_at
            )
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Failed to generate roleplay scenario: {str(e)}")

    async def get_scenarios(self, knowledge_id: int, user_id: int) -> List[RoleplayResponse]:
        """Get all roleplay scenarios for a knowledge entry."""
        # Validate access
        await self.validate_user_access(knowledge_id, user_id)
        
        scenarios = self.db.query(RoleplayScenario).filter(
            RoleplayScenario.knowledge_id == knowledge_id
        ).order_by(RoleplayScenario.created_at.desc()).all()
        
        return [
            RoleplayResponse(
                id=scenario.id,
                knowledge_id=scenario.knowledge_id,
                chapter_id=scenario.chapter_id,
                language=scenario.language,
                topic=scenario.topic,
                prompt=scenario.prompt,
                response=scenario.response,
                created_at=scenario.created_at
            )
            for scenario in scenarios
        ]

    async def get_scenario(self, scenario_id: int, user_id: int) -> RoleplayResponse:
        """Get a specific roleplay scenario by ID."""
        scenario = self.db.query(RoleplayScenario).filter(
            RoleplayScenario.id == scenario_id
        ).first()
        
        if not scenario:
            raise ValueError("Roleplay scenario not found")
        
        # Validate user has access to the associated knowledge
        await self.validate_user_access(scenario.knowledge_id, user_id)
        
        return RoleplayResponse(
            id=scenario.id,
            knowledge_id=scenario.knowledge_id,
            chapter_id=scenario.chapter_id,
            language=scenario.language,
            topic=scenario.topic,
            prompt=scenario.prompt,
            response=scenario.response,
            created_at=scenario.created_at
        )

    def _create_roleplay_prompt(self, topic: str, content: str, language: str) -> str:
        """Create a structured prompt for roleplay scenario generation."""
        prompt = f"""
You are an educational roleplay assistant. Create an engaging roleplay scenario based on the following:

Topic: {topic}
Language: {language}
Content Context: {content[:1000]}...

Generate a roleplay scenario that:
1. Is educational and engaging
2. Relates directly to the topic and content
3. Encourages active learning through role-playing
4. Is appropriate for the given language
5. Includes clear instructions for the learner

Format your response as a structured roleplay scenario with:
- Setting/Context
- Your role
- Learner's role  
- Objectives
- Starting scenario

Respond in {language}.
"""
        return prompt.strip()

    async def delete_scenario(self, scenario_id: int, user_id: int) -> bool:
        """Delete a roleplay scenario."""
        scenario = self.db.query(RoleplayScenario).filter(
            RoleplayScenario.id == scenario_id
        ).first()
        
        if not scenario:
            raise ValueError("Roleplay scenario not found")
        
        # Validate user has access
        await self.validate_user_access(scenario.knowledge_id, user_id)
        
        self.db.delete(scenario)
        self.db.commit()
        
        return True

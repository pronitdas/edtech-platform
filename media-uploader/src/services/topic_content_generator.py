"""
Topic-Based Content Generation Service
Generates comprehensive educational content from topics using LLM integration
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, asdict
import wikipedia
import requests
from sqlalchemy.orm import Session

from models import Knowledge, Chapter, EdTechContent, MediaFile
from src.services.llm_service import LLMService
from src.services.search_service import SearchService
from src.services.content_schemas import (
    ChapterStructure, MindMapStructure, QuizStructure, 
    NotesStructure, SummaryStructure
)

@dataclass
class TopicGenerationRequest:
    """Request structure for topic-based content generation"""
    topic: str
    subject_area: str
    difficulty_level: str  # 'beginner', 'intermediate', 'advanced'
    target_audience: str   # 'high_school', 'college', 'professional'
    content_depth: str     # 'overview', 'detailed', 'comprehensive'
    learning_objectives: List[str]
    user_id: str
    language: str = 'English'

@dataclass
class GeneratedContent:
    """Structure for generated educational content"""
    topic: str
    chapters: List[ChapterStructure]
    mind_maps: List[MindMapStructure]
    notes: NotesStructure
    summary: SummaryStructure
    quiz: QuizStructure
    external_sources: List[Dict[str, str]]
    metadata: Dict[str, Any]

class TopicContentGenerator:
    """
    Advanced topic-based content generation system
    Builds on existing VideoProcessorV2 patterns
    """
    
    def __init__(self, llm_service: LLMService, search_service: SearchService):
        self.llm_service = llm_service
        self.search_service = search_service
        self.wikipedia_api = wikipedia
        
    async def generate_complete_course(
        self, 
        request: TopicGenerationRequest,
        db: Session
    ) -> GeneratedContent:
        """
        Generate complete educational course from topic
        """
        print(f"Starting comprehensive content generation for topic: {request.topic}")
        
        # Step 1: Research and gather external knowledge
        external_sources = await self._gather_external_sources(request.topic)
        
        # Step 2: Generate course structure
        course_structure = await self._generate_course_structure(request, external_sources)
        
        # Step 3: Generate detailed content for each chapter
        chapters = await self._generate_detailed_chapters(request, course_structure)
        
        # Step 4: Generate supplementary materials
        mind_maps = await self._generate_mind_maps(request, chapters)
        notes = await self._generate_comprehensive_notes(request, chapters)
        summary = await self._generate_course_summary(request, chapters)
        quiz = await self._generate_comprehensive_quiz(request, chapters)
        
        # Step 5: Create database records
        knowledge_record = await self._create_knowledge_record(request, db)
        await self._save_generated_content(knowledge_record, chapters, mind_maps, notes, summary, quiz, db)
        
        return GeneratedContent(
            topic=request.topic,
            chapters=chapters,
            mind_maps=mind_maps,
            notes=notes,
            summary=summary,
            quiz=quiz,
            external_sources=external_sources,
            metadata={
                'generation_time': datetime.now().isoformat(),
                'knowledge_id': knowledge_record.id,
                'content_depth': request.content_depth,
                'difficulty_level': request.difficulty_level
            }
        )
    
    async def _gather_external_sources(self, topic: str) -> List[Dict[str, str]]:
        """
        Gather external knowledge sources including Wikipedia
        """
        sources = []
        
        try:
            # Wikipedia search
            wiki_results = wikipedia.search(topic, results=3)
            for result in wiki_results:
                try:
                    page = wikipedia.page(result)
                    sources.append({
                        'source': 'Wikipedia',
                        'title': page.title,
                        'url': page.url,
                        'summary': page.summary[:500] + '...' if len(page.summary) > 500 else page.summary,
                        'content': page.content[:5000] + '...' if len(page.content) > 5000 else page.content
                    })
                except wikipedia.exceptions.DisambiguationError as e:
                    # Use first option from disambiguation
                    try:
                        page = wikipedia.page(e.options[0])
                        sources.append({
                            'source': 'Wikipedia',
                            'title': page.title,
                            'url': page.url,
                            'summary': page.summary[:500] + '...' if len(page.summary) > 500 else page.summary,
                            'content': page.content[:2000] + '...' if len(page.content) > 2000 else page.content
                        })
                    except:
                        continue
                except:
                    continue
                    
        except Exception as e:
            print(f"Error gathering Wikipedia sources: {e}")
        
        # Check existing knowledge base for related content
        try:
            existing_content = await self.search_service.search_knowledge(topic, limit=5)
            for content in existing_content:
                sources.append({
                    'source': 'Internal Knowledge Base',
                    'title': content.name,
                    'content': content.summary[:1000] + '...' if len(content.summary) > 1000 else content.summary,
                    'knowledge_id': content.id
                })
        except Exception as e:
            print(f"Error searching internal knowledge base: {e}")
            
        return sources
    
    async def _generate_course_structure(
        self, 
        request: TopicGenerationRequest,
        external_sources: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive course structure using LLM
        """
        # Prepare context from external sources
        context = self._prepare_source_context(external_sources)
        
        system_prompt = f"""You are an expert educational content designer. Create a comprehensive course structure for the topic "{request.topic}" in the subject area "{request.subject_area}".

Target Audience: {request.target_audience}
Difficulty Level: {request.difficulty_level}
Content Depth: {request.content_depth}
Learning Objectives: {', '.join(request.learning_objectives)}

External Knowledge Context:
{context}

Generate a detailed course structure with:
1. Course overview and introduction
2. 5-8 main chapters with clear learning progression
3. 3-5 subchapters for each main chapter
4. Specific learning objectives for each chapter
5. Prerequisites and recommended background knowledge
6. Estimated time for completion of each section

Format the response as a structured JSON object."""

        response = await self.llm_service.generate_structured_content(
            system_prompt=system_prompt,
            user_prompt=f"Create comprehensive course structure for: {request.topic}",
            schema_type="course_structure"
        )
        
        return response
    
    async def _generate_detailed_chapters(
        self, 
        request: TopicGenerationRequest,
        course_structure: Dict[str, Any]
    ) -> List[ChapterStructure]:
        """
        Generate detailed content for each chapter
        """
        chapters = []
        
        for chapter_info in course_structure.get('chapters', []):
            chapter_content = await self._generate_single_chapter(
                request, chapter_info, course_structure
            )
            chapters.append(chapter_content)
            
        return chapters
    
    async def _generate_single_chapter(
        self, 
        request: TopicGenerationRequest,
        chapter_info: Dict[str, Any],
        course_context: Dict[str, Any]
    ) -> ChapterStructure:
        """
        Generate comprehensive content for a single chapter
        """
        system_prompt = f"""You are an expert educator creating detailed chapter content for "{chapter_info['title']}" in the course "{request.topic}".

Chapter Context:
- Title: {chapter_info['title']}
- Learning Objectives: {', '.join(chapter_info.get('learning_objectives', []))}
- Prerequisites: {', '.join(chapter_info.get('prerequisites', []))}
- Estimated Duration: {chapter_info.get('duration', 'Not specified')}

Course Context:
- Subject Area: {request.subject_area}
- Target Audience: {request.target_audience}
- Difficulty Level: {request.difficulty_level}

Create comprehensive chapter content including:
1. Introduction and overview
2. Detailed explanations with examples
3. Key concepts and definitions
4. Practical applications
5. Common misconceptions and clarifications
6. Interactive elements and activities
7. Assessment checkpoints
8. Further reading suggestions

Make the content engaging, pedagogically sound, and appropriate for the target audience."""

        response = await self.llm_service.generate_structured_content(
            system_prompt=system_prompt,
            user_prompt=f"Generate detailed content for chapter: {chapter_info['title']}",
            schema_type="chapter_content"
        )
        
        return ChapterStructure(**response)
    
    async def _generate_mind_maps(
        self, 
        request: TopicGenerationRequest,
        chapters: List[ChapterStructure]
    ) -> List[MindMapStructure]:
        """
        Generate mind maps for visual concept representation
        """
        mind_maps = []
        
        # Generate overview mind map
        overview_mindmap = await self._generate_single_mindmap(
            request, f"{request.topic} - Course Overview", chapters
        )
        mind_maps.append(overview_mindmap)
        
        # Generate mind map for each chapter
        for chapter in chapters:
            chapter_mindmap = await self._generate_single_mindmap(
                request, f"{chapter.title} - Chapter Overview", [chapter]
            )
            mind_maps.append(chapter_mindmap)
            
        return mind_maps
    
    async def _generate_single_mindmap(
        self, 
        request: TopicGenerationRequest,
        title: str,
        content_sources: List[Any]
    ) -> MindMapStructure:
        """
        Generate a single mind map structure
        """
        system_prompt = f"""Create a comprehensive mind map for "{title}" in the subject of "{request.subject_area}".

Generate a mind map with:
1. Central concept as the root node
2. 3-7 main branches representing key themes
3. 2-4 sub-branches for each main branch
4. Clear hierarchical relationships
5. Visual connection types (association, categorization, sequence)
6. Color coding suggestions for different concept types

Format as JSON with nodes and edges structure suitable for visualization."""

        response = await self.llm_service.generate_structured_content(
            system_prompt=system_prompt,
            user_prompt=f"Generate mind map for: {title}",
            schema_type="mindmap"
        )
        
        return MindMapStructure(**response)
    
    async def _generate_comprehensive_notes(
        self, 
        request: TopicGenerationRequest,
        chapters: List[ChapterStructure]
    ) -> NotesStructure:
        """
        Generate comprehensive study notes
        """
        system_prompt = f"""Create comprehensive study notes for the course "{request.topic}" in {request.subject_area}.

Target Audience: {request.target_audience}
Difficulty Level: {request.difficulty_level}

Generate notes that include:
1. Key concepts and definitions
2. Important formulas, principles, or rules
3. Examples and case studies
4. Mnemonics and memory aids
5. Practice problems and solutions
6. Quick reference sections
7. Common mistakes to avoid
8. Connections to real-world applications

Format as structured study notes with clear sections and subsections."""

        response = await self.llm_service.generate_structured_content(
            system_prompt=system_prompt,
            user_prompt=f"Generate comprehensive study notes for: {request.topic}",
            schema_type="notes"
        )
        
        return NotesStructure(**response)
    
    async def _generate_course_summary(
        self, 
        request: TopicGenerationRequest,
        chapters: List[ChapterStructure]
    ) -> SummaryStructure:
        """
        Generate course summary and key takeaways
        """
        system_prompt = f"""Create a comprehensive summary for the course "{request.topic}" in {request.subject_area}.

Generate a summary that includes:
1. Course overview and main themes
2. Key learning outcomes achieved
3. Most important concepts covered
4. Practical applications and real-world relevance
5. Prerequisites and foundation knowledge
6. Next steps for continued learning
7. Assessment of mastery indicators

Make it concise but comprehensive, suitable for review and reinforcement."""

        response = await self.llm_service.generate_structured_content(
            system_prompt=system_prompt,
            user_prompt=f"Generate comprehensive summary for: {request.topic}",
            schema_type="summary"
        )
        
        return SummaryStructure(**response)
    
    async def _generate_comprehensive_quiz(
        self, 
        request: TopicGenerationRequest,
        chapters: List[ChapterStructure]
    ) -> QuizStructure:
        """
        Generate comprehensive quiz covering all chapters
        """
        system_prompt = f"""Create a comprehensive quiz for the course "{request.topic}" in {request.subject_area}.

Target Audience: {request.target_audience}
Difficulty Level: {request.difficulty_level}

Generate a quiz with:
1. 15-25 questions covering all major concepts
2. Mix of question types: multiple choice, true/false, short answer
3. Questions at different cognitive levels (knowledge, comprehension, application, analysis)
4. Clear, unambiguous questions
5. Detailed explanations for correct answers
6. Distractors that address common misconceptions
7. Appropriate difficulty progression

Format as structured quiz with questions, options, correct answers, and explanations."""

        response = await self.llm_service.generate_structured_content(
            system_prompt=system_prompt,
            user_prompt=f"Generate comprehensive quiz for: {request.topic}",
            schema_type="quiz"
        )
        
        return QuizStructure(**response)
    
    def _prepare_source_context(self, sources: List[Dict[str, str]]) -> str:
        """
        Prepare external source context for LLM prompts
        """
        context_parts = []
        
        for source in sources[:3]:  # Limit to top 3 sources to avoid token limits
            context_parts.append(f"""
Source: {source['source']} - {source['title']}
Summary: {source.get('summary', source.get('content', '')[:300])}
""")
        
        return '\n'.join(context_parts)
    
    async def _create_knowledge_record(
        self, 
        request: TopicGenerationRequest,
        db: Session
    ) -> Knowledge:
        """
        Create database record for generated knowledge
        """
        knowledge = Knowledge(
            name=f"{request.topic} - {request.subject_area}",
            status="completed",
            content_type="generated_topic",
            summary=f"AI-generated comprehensive course on {request.topic}",
            user_id=request.user_id,
            meta_data={
                'generation_request': asdict(request),
                'generation_timestamp': datetime.now().isoformat(),
                'content_source': 'topic_generator'
            }
        )
        
        db.add(knowledge)
        db.commit()
        db.refresh(knowledge)
        
        return knowledge
    
    async def _save_generated_content(
        self,
        knowledge_record: Knowledge,
        chapters: List[ChapterStructure],
        mind_maps: List[MindMapStructure],
        notes: NotesStructure,
        summary: SummaryStructure,
        quiz: QuizStructure,
        db: Session
    ):
        """
        Save all generated content to database
        """
        # Save chapters
        for i, chapter in enumerate(chapters):
            chapter_record = Chapter(
                knowledge_id=knowledge_record.id,
                content=chapter.content,
                meta_data={
                    'chapter_number': i + 1,
                    'title': chapter.title,
                    'learning_objectives': chapter.learning_objectives,
                    'duration': chapter.duration
                }
            )
            db.add(chapter_record)
            
        # Save comprehensive content
        content_record = EdTechContent(
            knowledge_id=knowledge_record.id,
            language="English",
            notes=json.dumps(asdict(notes)),
            summary=json.dumps(asdict(summary)),
            quiz=json.dumps(asdict(quiz)),
            mindmap=json.dumps([asdict(mm) for mm in mind_maps])
        )
        db.add(content_record)
        
        db.commit()

# Export the service for use in API endpoints
__all__ = ['TopicContentGenerator', 'TopicGenerationRequest', 'GeneratedContent']
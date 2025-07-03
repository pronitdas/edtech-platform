"""
Content structure schemas for topic-based generation
Defines data structures for generated educational content
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from datetime import datetime

@dataclass
class ChapterStructure:
    """Structure for generated chapter content"""
    title: str
    content: str
    learning_objectives: List[str]
    key_concepts: List[str]
    examples: List[Dict[str, str]]
    activities: List[Dict[str, Any]]
    assessment_questions: List[Dict[str, Any]]
    prerequisites: List[str]
    duration: str  # Estimated time to complete
    difficulty_level: str
    
@dataclass
class MindMapNode:
    """Individual node in a mind map"""
    id: str
    label: str
    type: str  # 'root', 'branch', 'leaf'
    color: str
    position: Dict[str, float]  # x, y coordinates
    metadata: Dict[str, Any]

@dataclass
class MindMapEdge:
    """Connection between mind map nodes"""
    id: str
    source: str
    target: str
    label: Optional[str]
    type: str  # 'association', 'hierarchy', 'sequence'
    style: Dict[str, str]

@dataclass
class MindMapStructure:
    """Complete mind map structure"""
    title: str
    central_concept: str
    nodes: List[MindMapNode]
    edges: List[MindMapEdge]
    layout: str  # 'radial', 'hierarchical', 'organic'
    color_scheme: Dict[str, str]
    metadata: Dict[str, Any]

@dataclass
class QuizQuestion:
    """Individual quiz question structure"""
    id: str
    question: str
    type: str  # 'multiple_choice', 'true_false', 'short_answer', 'essay'
    options: List[str]  # For multiple choice
    correct_answer: str
    explanation: str
    difficulty_level: str
    cognitive_level: str  # 'knowledge', 'comprehension', 'application', 'analysis'
    chapter_reference: str
    points: int

@dataclass
class QuizStructure:
    """Complete quiz structure"""
    title: str
    description: str
    questions: List[QuizQuestion]
    total_points: int
    time_limit: int  # in minutes
    passing_score: int  # percentage
    instructions: str
    metadata: Dict[str, Any]

@dataclass
class NotesSection:
    """Individual section in study notes"""
    title: str
    content: str
    type: str  # 'concept', 'definition', 'example', 'formula', 'mnemonic'
    importance: str  # 'high', 'medium', 'low'
    references: List[str]

@dataclass
class NotesStructure:
    """Complete study notes structure"""
    title: str
    overview: str
    sections: List[NotesSection]
    key_terms: Dict[str, str]  # term -> definition
    formulas: List[Dict[str, str]]
    quick_reference: str
    study_tips: List[str]
    metadata: Dict[str, Any]

@dataclass
class SummaryStructure:
    """Course summary structure"""
    title: str
    overview: str
    key_concepts: List[str]
    learning_outcomes: List[str]
    practical_applications: List[str]
    prerequisites: List[str]
    next_steps: List[str]
    mastery_indicators: List[str]
    metadata: Dict[str, Any]

@dataclass
class ContentGenerationMetrics:
    """Metrics for content generation process"""
    generation_time: float
    tokens_used: int
    llm_calls: int
    content_size: int  # in characters
    external_sources_used: int
    quality_score: float  # 0.0 to 1.0
    timestamp: datetime

# JSON Schemas for LLM structured output
COURSE_STRUCTURE_SCHEMA = {
    "type": "object",
    "properties": {
        "course_title": {"type": "string"},
        "overview": {"type": "string"},
        "learning_objectives": {
            "type": "array",
            "items": {"type": "string"}
        },
        "prerequisites": {
            "type": "array", 
            "items": {"type": "string"}
        },
        "chapters": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "learning_objectives": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "subchapters": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "duration": {"type": "string"},
                    "difficulty": {"type": "string"}
                },
                "required": ["title", "description", "learning_objectives"]
            }
        },
        "estimated_duration": {"type": "string"},
        "assessment_strategy": {"type": "string"}
    },
    "required": ["course_title", "overview", "learning_objectives", "chapters"]
}

CHAPTER_CONTENT_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "content": {"type": "string"},
        "learning_objectives": {
            "type": "array",
            "items": {"type": "string"}
        },
        "key_concepts": {
            "type": "array",
            "items": {"type": "string"}
        },
        "examples": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "application": {"type": "string"}
                }
            }
        },
        "activities": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "instructions": {"type": "string"},
                    "type": {"type": "string"},
                    "duration": {"type": "string"}
                }
            }
        },
        "assessment_questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "answer": {"type": "string"},
                    "type": {"type": "string"}
                }
            }
        },
        "prerequisites": {
            "type": "array",
            "items": {"type": "string"}
        },
        "duration": {"type": "string"},
        "difficulty_level": {"type": "string"}
    },
    "required": ["title", "content", "learning_objectives", "key_concepts"]
}

MINDMAP_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "central_concept": {"type": "string"},
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "label": {"type": "string"},
                    "type": {"type": "string"},
                    "color": {"type": "string"},
                    "position": {
                        "type": "object",
                        "properties": {
                            "x": {"type": "number"},
                            "y": {"type": "number"}
                        }
                    }
                },
                "required": ["id", "label", "type"]
            }
        },
        "edges": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "source": {"type": "string"},
                    "target": {"type": "string"},
                    "label": {"type": "string"},
                    "type": {"type": "string"}
                },
                "required": ["id", "source", "target", "type"]
            }
        },
        "layout": {"type": "string"},
        "color_scheme": {"type": "object"}
    },
    "required": ["title", "central_concept", "nodes", "edges"]
}

QUIZ_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "description": {"type": "string"},
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "question": {"type": "string"},
                    "type": {"type": "string"},
                    "options": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "correct_answer": {"type": "string"},
                    "explanation": {"type": "string"},
                    "difficulty_level": {"type": "string"},
                    "cognitive_level": {"type": "string"},
                    "points": {"type": "integer"}
                },
                "required": ["id", "question", "type", "correct_answer", "explanation"]
            }
        },
        "total_points": {"type": "integer"},
        "time_limit": {"type": "integer"},
        "passing_score": {"type": "integer"},
        "instructions": {"type": "string"}
    },
    "required": ["title", "description", "questions", "total_points"]
}

NOTES_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "overview": {"type": "string"},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "content": {"type": "string"},
                    "type": {"type": "string"},
                    "importance": {"type": "string"},
                    "references": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["title", "content", "type"]
            }
        },
        "key_terms": {"type": "object"},
        "formulas": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "formula": {"type": "string"},
                    "description": {"type": "string"}
                }
            }
        },
        "quick_reference": {"type": "string"},
        "study_tips": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["title", "overview", "sections", "key_terms"]
}

SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "overview": {"type": "string"},
        "key_concepts": {
            "type": "array",
            "items": {"type": "string"}
        },
        "learning_outcomes": {
            "type": "array",
            "items": {"type": "string"}
        },
        "practical_applications": {
            "type": "array",
            "items": {"type": "string"}
        },
        "prerequisites": {
            "type": "array",
            "items": {"type": "string"}
        },
        "next_steps": {
            "type": "array",
            "items": {"type": "string"}
        },
        "mastery_indicators": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["title", "overview", "key_concepts", "learning_outcomes"]
}

# Schema mapping for LLM service
SCHEMA_MAPPING = {
    "course_structure": COURSE_STRUCTURE_SCHEMA,
    "chapter_content": CHAPTER_CONTENT_SCHEMA,
    "mindmap": MINDMAP_SCHEMA,
    "quiz": QUIZ_SCHEMA,
    "notes": NOTES_SCHEMA,
    "summary": SUMMARY_SCHEMA
}

# Export all schemas and structures
__all__ = [
    'ChapterStructure', 'MindMapStructure', 'QuizStructure', 
    'NotesStructure', 'SummaryStructure', 'ContentGenerationMetrics',
    'SCHEMA_MAPPING', 'COURSE_STRUCTURE_SCHEMA', 'CHAPTER_CONTENT_SCHEMA',
    'MINDMAP_SCHEMA', 'QUIZ_SCHEMA', 'NOTES_SCHEMA', 'SUMMARY_SCHEMA'
]
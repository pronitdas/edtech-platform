"""
Functions for generating content using OpenAI.
"""

import json
import logging
import re
from typing import Dict, List, Any, Optional, Union, Tuple

from openai_client import OpenAIClient
from prompts_config import prompts_config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GenerateQuestionsOutput:
    """Output structure for generated questions."""

    def __init__(self, question: str, options: List[str], answer: str):
        self.question = question
        self.options = options
        self.answer = answer

    def to_dict(self) -> Dict[str, Any]:
        return {
            "question": self.question,
            "options": self.options,
            "answer": self.answer,
        }


class MindMapNode:
    """Node structure for mind maps."""

    def __init__(self, id: str, type: str, label: str):
        self.id = id
        self.type = type
        self.data = {"label": label}

    def to_dict(self) -> Dict[str, Any]:
        return {"id": self.id, "type": self.type, "data": self.data}


class MindMapEdge:
    """Edge structure for mind maps."""

    def __init__(self, id: str, source: str, target: str):
        self.id = id
        self.source = source
        self.target = target

    def to_dict(self) -> Dict[str, Any]:
        return {"id": self.id, "source": self.source, "target": self.target}


class MindMapStructure:
    """Structure for mind maps."""

    def __init__(self, nodes: List[MindMapNode], edges: List[MindMapEdge]):
        self.nodes = nodes
        self.edges = edges

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes": [node.to_dict() for node in self.nodes],
            "edges": [edge.to_dict() for edge in self.edges],
        }


def extract_subheadings(text: str, min_length: int = 2) -> List[str]:
    """
    Extract subheadings from text.

    Args:
        text: The text to extract subheadings from
        min_length: The minimum length of a subheading

    Returns:
        A list of subheadings
    """
    # Look for patterns like "## Heading" or "Heading\n---"
    heading_pattern = r"(?:^|\n)(?:#{2,3}\s+(.+?)(?:\n|$)|(.+?)\n[-=]{3,}(?:\n|$))"
    matches = re.finditer(heading_pattern, text, re.MULTILINE)

    subheadings = []
    for match in matches:
        heading = match.group(1) or match.group(2)
        if heading and len(heading) >= min_length:
            subheadings.append(heading)

    return subheadings


def windowed_chunk(
    sentences: List[str], window_size: int, stride: int
) -> List[List[str]]:
    """
    Create overlapping chunks of sentences.

    Args:
        sentences: List of sentences to chunk
        window_size: Size of each chunk
        stride: Number of sentences to stride by

    Returns:
        List of chunks, where each chunk is a list of sentences
    """
    chunks = []
    for i in range(0, len(sentences), stride):
        chunk = sentences[i : i + window_size]
        if chunk:  # Only add non-empty chunks
            chunks.append(chunk)

    return chunks


async def generate_chunked_content(
    openai_client: OpenAIClient, text: str, prompt: str, max_tokens: int = 500
) -> List[str]:
    """
    Generate content by chunking text and processing each chunk.

    Args:
        openai_client: The OpenAI client
        text: The text to process
        prompt: The prompt to use
        max_tokens: Maximum tokens for the response

    Returns:
        List of generated content pieces
    """
    if not text or len(text) < 10:
        return []

    # Heuristic to decide chunking strategy
    subheadings = extract_subheadings(text, 2)
    subheadings = [h for h in subheadings if h.lower() != "introduction"]

    sentences = text.split(". ")
    forced_chunks = windowed_chunk(sentences, 80, 5)
    print(len(forced_chunks))
    # Use subheadings if we have enough, otherwise use forced chunks
    chunks = forced_chunks if len(subheadings) < 3 else [[h] for h in subheadings]

    results = []
    for chunk in chunks:
        chunk_text = " ".join(chunk) if isinstance(chunk, list) else chunk
        try:
            result = await openai_client.chat_completion(
                [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": chunk_text},
                ],
                model="gpt-4o-mini",
                max_tokens=max_tokens,
            )
            results.append(result)
        except Exception as e:
            logger.error(f"Error generating content for chunk: {str(e)}")

    return results


async def generate_notes(
    openai_client: OpenAIClient, text: str, language: str
) -> List[str]:
    """
    Generate notes from text.

    Args:
        openai_client: The OpenAI client
        text: The text to generate notes from
        language: The language to generate notes in

    Returns:
        A list of note lines
    """
    logger.info("Generating notes with chunking")
    prompt = prompts_config.notes(language)
    return await generate_chunked_content(openai_client, text, prompt, 500)


async def generate_summary(
    openai_client: OpenAIClient, text: str, language: str
) -> List[str]:
    """
    Generate a summary from text.

    Args:
        openai_client: The OpenAI client
        text: The text to summarize
        language: The language to generate the summary in

    Returns:
        A list of summary lines
    """
    prompt = prompts_config.summary(language)
    return await generate_chunked_content(openai_client, text, prompt, 500)


async def generate_mind_map_structure(
    openai_client: OpenAIClient,
    text: str,
    language: str = "English",  # Add language parameter with default value
) -> Dict[str, Any]:
    """
    Generate a mind map structure from text.

    Args:
        openai_client: The OpenAI client
        text: The text to generate a mind map from
        language: The language to generate the mind map in (optional)

    Returns:
        A mind map structure
    """
    if not text or len(text) < 10:
        return {
            "nodes": [
                {
                    "id": "1",
                    "type": "input",
                    "data": {"label": "Error generating mind map"},
                }
            ],
            "edges": [],
        }

    prompt = prompts_config.mind_map()

    try:
        # For mind maps, we'll use a direct call instead of chunking to ensure proper JSON structure
        result = await openai_client.chat_completion(
            [{"role": "system", "content": prompt}, {"role": "user", "content": text}],
            model="gpt-4o-mini",  # Use the same model as other generators
            max_tokens=4096,
            json_schema={
                "name": "mindmap_schema",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "nodes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "type": {
                                        "type": "string",
                                        "enum": ["input", "default", "output"],
                                    },
                                    "data": {
                                        "type": "object",
                                        "properties": {"label": {"type": "string"}},
                                        "additionalProperties": False,
                                        "required": ["label"],
                                    },
                                },
                                "additionalProperties": False,
                                "required": ["id", "type", "data"],
                            },
                        },
                        "edges": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "source": {"type": "string"},
                                    "target": {"type": "string"},
                                },
                                "additionalProperties": False,
                                "required": ["id", "source", "target"],
                            },
                        },
                    },
                    "additionalProperties": False,
                    "required": ["nodes", "edges"],
                },
            },
        )

        # Parse the result as JSON
        return parse_mind_map_result(result)
    except Exception as e:
        logger.error(f"Error generating mind map: {str(e)}")
        return {
            "nodes": [
                {"id": "1", "type": "input", "data": {"label": f"Error: {str(e)}"}}
            ],
            "edges": [],
        }


def parse_mind_map_result(result: str) -> Dict[str, Any]:
    """
    Parse the mind map result from OpenAI.

    Args:
        result: The result from OpenAI

    Returns:
        A mind map structure
    """
    try:
        # Attempt to parse as JSON
        import json

        parsed = json.loads(result)

        # Validate the structure
        if "nodes" not in parsed or "edges" not in parsed:
            raise ValueError("Invalid mind map structure: missing nodes or edges")

        # Ensure there's at least one node
        if not parsed["nodes"]:
            parsed["nodes"] = [
                {"id": "1", "type": "input", "data": {"label": "Central Topic"}}
            ]

        return parsed
    except Exception as e:
        logger.error(f"Error parsing mind map JSON: {str(e)}")
        # Return a fallback structure
        return {
            "nodes": [
                {
                    "id": "1",
                    "type": "input",
                    "data": {"label": "Error parsing mind map"},
                }
            ],
            "edges": [],
        }


async def generate_questions(
    openai_client: OpenAIClient, text: str, language: str, questions_count: int = 10
) -> List[Dict[str, Any]]:
    """
    Generate questions from text.

    Args:
        openai_client: The OpenAI client
        text: The text to generate questions from
        language: The language to generate questions in
        questions_count: The number of questions to generate

    Returns:
        A list of question dictionaries
    """
    if not text or len(text) < 10:
        return []

    json_schema = {
        "name": "question_answer_schema",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "options": {"type": "array", "items": {"type": "string"}},
                            "answer": {"type": "string"},
                        },
                        "additionalProperties": False,
                        "required": ["question", "options", "answer"],
                    },
                }
            },
            "additionalProperties": False,
            "required": ["questions"],
        },
    }

    try:
        # Use a consistent model for all content generation
        prompt = prompts_config.structured_questions(questions_count, language)

        # For quizzes, we'll use a direct call instead of chunking to ensure proper JSON structure
        result = await openai_client.chat_completion(
            [{"role": "system", "content": prompt}, {"role": "user", "content": text}],
            model="gpt-4o-mini",  # Use the same model as other generators
            max_tokens=4096,
            json_schema=json_schema,
        )

        # Parse the result as JSON
        try:
            parsed = json.loads(result)
            if "questions" in parsed and isinstance(parsed["questions"], list):
                return parsed["questions"]
            else:
                logger.error(f"Invalid questions format: {result}")
                return []
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing questions JSON: {str(e)}")
            return []

    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        return []

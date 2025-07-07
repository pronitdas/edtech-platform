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
) -> str:
    """
    Generate content by chunking text and processing each chunk.

    Args:
        openai_client: The OpenAI client
        text: The text to process
        prompt: The prompt to use
        max_tokens: Maximum tokens for the response

    Returns:
        Consolidated generated content as a string
    """
    if not text or len(text) < 10:
        return ""

    # Split text into paragraphs for more natural chunking
    paragraphs = re.split(r'\n\s*\n', text)
    
    # More intelligent chunking based on semantic paragraphs
    chunks = []
    current_chunk = []
    current_length = 0
    
    # Estimate: ~1.5 tokens per word
    estimated_token_limit = 4000  # Safe limit for most models
    words_per_chunk = int(estimated_token_limit / 1.5)
    
    for paragraph in paragraphs:
        paragraph_words = len(paragraph.split())
        
        # If adding this paragraph would exceed our chunk size,
        # start a new chunk (unless current chunk is empty)
        if current_length + paragraph_words > words_per_chunk and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [paragraph]
            current_length = paragraph_words
        else:
            current_chunk.append(paragraph)
            current_length += paragraph_words
    
    # Add the last chunk if it contains anything
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    # If we have only one small chunk, just process it directly
    if len(chunks) == 1 and len(chunks[0].split()) < words_per_chunk:
        try:
            result = await openai_client.chat_completion(
                [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": chunks[0]},
                ],
                model="llama-3.2-3b-instruct",
                max_tokens=max_tokens,
            )
            return result
        except Exception as e:
            logger.error(f"Error generating content: {str(e)}")
            return ""

    # For multiple chunks, we'll use a more sophisticated approach
    results = []
    previous_context = ""
    
    for i, chunk in enumerate(chunks):
        try:
            # Add context from previous generation for continuity
            context_prompt = prompt
            if i > 0:
                context_prompt += "\n\nHere's what you've already covered in previous sections to maintain continuity:\n" + previous_context
                
            # Add information about chunk position
            chunk_context = f"This is part {i+1} of {len(chunks)} of the content. "
            if i > 0:
                chunk_context += "Continue from the previous part maintaining continuity. "
            if i < len(chunks) - 1:
                chunk_context += "There will be more content after this part. "
                
            result = await openai_client.chat_completion(
                [
                    {"role": "system", "content": context_prompt},
                    {"role": "user", "content": chunk_context + chunk},
                ],
                model="llama-3.2-3b-instruct",
                max_tokens=max_tokens,
            )
            
            results.append(result)
            # Store a summary of this result to provide context for the next chunk
            previous_context = result[:500] if len(result) > 500 else result
            
        except Exception as e:
            logger.error(f"Error generating content for chunk {i+1}: {str(e)}")

    # Join results with appropriate spacing
    return "\n\n".join(results)


async def generate_notes(
    openai_client: OpenAIClient, text: str, language: str
) -> str:
    """
    Generate notes from text.

    Args:
        openai_client: The OpenAI client
        text: The text to generate notes from
        language: The language to generate notes in

    Returns:
        Notes as a single coherent string
    """
    logger.info("Generating notes with improved chunking")
    prompt = prompts_config.notes(language)
    return await generate_chunked_content(openai_client, text, prompt, 1000)


async def generate_summary(
    openai_client: OpenAIClient, text: str, language: str
) -> str:
    """
    Generate a summary from text.

    Args:
        openai_client: The OpenAI client
        text: The text to summarize
        language: The language to generate the summary in

    Returns:
        Summary as a single coherent string
    """
    prompt = prompts_config.summary(language)
    return await generate_chunked_content(openai_client, text, prompt, 1500)


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
            model="llama-3.2-3b-instruct",  # Use the same model as other generators
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
        # Check if result is an error message
        if result.startswith("Error:") or "Error in fetching data" in result:
            logger.warning(f"Received error message instead of JSON: {result}")
            return _get_fallback_mindmap()
        
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
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing mind map JSON: {str(e)}. Content: {result[:200]}...")
        return _get_fallback_mindmap()
    except Exception as e:
        logger.error(f"Error processing mind map: {str(e)}")
        return _get_fallback_mindmap()

def _get_fallback_mindmap():
    """Return a fallback mind map structure."""
    return {
        "nodes": [
            {
                "id": "1",
                "type": "input",
                "data": {"label": "Content Overview"},
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
            model="llama-3.2-3b-instruct",  # Use the same model as other generators
            max_tokens=4096,
            json_schema=json_schema,
        )

        # Parse the result as JSON
        try:
            # Check if result is an error message
            if result.startswith("Error:") or "Error in fetching data" in result:
                logger.warning(f"Received error message instead of JSON: {result}")
                return []
            
            parsed = json.loads(result)
            if "questions" in parsed and isinstance(parsed["questions"], list):
                return parsed["questions"]
            else:
                logger.error(f"Invalid questions format: {result[:200]}...")
                return []
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing questions JSON: {str(e)}. Content: {result[:200]}...")
            # Try to extract questions from malformed JSON
            return _extract_questions_fallback(result)

    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        return []

def _extract_questions_fallback(text: str) -> List[Dict]:
    """Extract questions from malformed text as fallback."""
    try:
        # Try to find question patterns in the text
        questions = []
        lines = text.split('\n')
        
        current_question = None
        current_options = []
        
        for line in lines:
            line = line.strip()
            if line.endswith('?'):
                # This looks like a question
                if current_question:
                    # Save previous question
                    questions.append({
                        "question": current_question,
                        "options": current_options if current_options else ["Option 1", "Option 2", "Option 3"],
                        "answer": current_options[0] if current_options else "Option 1"
                    })
                current_question = line
                current_options = []
            elif line.startswith(('A)', 'B)', 'C)', 'D)', '1.', '2.', '3.', '4.')):
                # This looks like an option
                current_options.append(line[2:].strip() if line[1] in ').' else line)
        
        # Save last question
        if current_question:
            questions.append({
                "question": current_question,
                "options": current_options if current_options else ["Option 1", "Option 2", "Option 3"],
                "answer": current_options[0] if current_options else "Option 1"
            })
        
        return questions[:5]  # Return max 5 questions
    except Exception:
        return []

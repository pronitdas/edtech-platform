import logging
import os
import time
import tempfile
import json
from typing import Dict, Tuple, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass, field
from pydantic import BaseModel

import torch
import whisper
from openai import OpenAI
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Pydantic models for structured outputs
class ContentSection(BaseModel):
    title: str
    content: str
    type: str = "section"
    examples: List[str] = []
    code_blocks: List[str] = []
    key_points: List[str] = []


class ContentChapter(BaseModel):
    title: str
    sections: List[ContentSection]
    chapter_number: int
    prerequisites: List[str] = []
    learning_objectives: List[str] = []


class StructuredCourseContent(BaseModel):
    title: str
    chapters: List[ContentChapter]
    description: str
    summary: str
    target_audience: List[str] = []
    difficulty_level: str


class VideoProcessorV2:
    """Enhanced processor for video files that transcribes and generates structured content."""

    # Default OpenAI API Key - should be loaded from environment in production
    DEFAULT_OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "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")

    # Default model names
    DEFAULT_WHISPER_MODEL = "base"
    DEFAULT_OPENAI_MODEL = "gpt-4o-mini"

    # Batch processing settings
    DEFAULT_BATCH_SIZE = 3
    DEFAULT_MAX_WORKERS = 4

    @staticmethod
    def transcribe_video(
        video_data: bytes, model_name: str = DEFAULT_WHISPER_MODEL
    ) -> str:
        """
        Transcribe video using OpenAI Whisper model.

        Args:
            video_data: Binary video data
            model_name: Whisper model size (tiny, base, small, medium, large)

        Returns:
            str: Transcribed text
        """
        # Check CUDA availability
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device for transcription: {device}")

        # Load Whisper model
        logger.info(f"Loading Whisper model: {model_name}")
        model = whisper.load_model(model_name)

        # Save video data to temporary file
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_file:
            temp_file.write(video_data)
            temp_file_path = temp_file.name

        try:
            # Transcribe video
            logger.info(f"Transcribing video")
            result = model.transcribe(temp_file_path)
            return result["text"]
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    @staticmethod
    def chunk_text(text: str, max_chunk_size: int = 12000) -> List[str]:
        """
        Split text into chunks of specified size, trying to maintain semantic boundaries.
        """
        # First attempt to split by paragraphs
        paragraphs = text.split("\n\n")

        # If paragraphs are too large, split by sentences
        if any(len(p) > max_chunk_size for p in paragraphs):
            import re

            # Split by sentences (simple heuristic)
            sentences = re.split(r"(?<=[.!?])\s+", text)

            chunks = []
            current_chunk = []
            current_size = 0

            for sentence in sentences:
                sentence_size = len(sentence) + 1  # +1 for space
                if current_size + sentence_size > max_chunk_size:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = [sentence]
                    current_size = sentence_size
                else:
                    current_chunk.append(sentence)
                    current_size += sentence_size

            if current_chunk:
                chunks.append(" ".join(current_chunk))
        else:
            # Use paragraphs as chunks, combining small ones
            chunks = []
            current_chunk = []
            current_size = 0

            for paragraph in paragraphs:
                paragraph_size = len(paragraph) + 2  # +2 for newlines
                if current_size + paragraph_size > max_chunk_size:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = [paragraph]
                    current_size = paragraph_size
                else:
                    current_chunk.append(paragraph)
                    current_size += paragraph_size

            if current_chunk:
                chunks.append("\n\n".join(current_chunk))

        return chunks

    @staticmethod
    def process_chunk_with_structured_output(
        chunk: str, chunk_index: int, total_chunks: int, client: OpenAI, model_name: str
    ) -> Dict:
        """
        Process a single chunk with structured output.

        Args:
            chunk: Text chunk to process
            chunk_index: Index of the current chunk
            total_chunks: Total number of chunks
            client: OpenAI client
            model_name: OpenAI model to use

        Returns:
            Dict: Structured output for the chunk
        """
        # Define the schema for the structured output
        schema = {
            "name": "chapter_schema",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "sections": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "heading": {"type": "string"},
                                "content": {"type": "string"},
                                "key_points": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                                "examples": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                            },
                            "required": [
                                "heading",
                                "content",
                                "key_points",
                                "examples",
                            ],
                            "additionalProperties": False,
                        },
                    },
                    "chapter_number": {"type": "integer"},
                    "learning_objectives": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": [
                    "title",
                    "sections",
                    "chapter_number",
                    "learning_objectives",
                ],
                "additionalProperties": False,
            },
        }

        prompt = f"""
        Transform this lecture transcript into a structured course chapter, adding 20% new insights or examples.
        
        TRANSCRIPT:
        ```
        {chunk}
        ```
        
        INSTRUCTIONS:
        1. Create a coherent chapter with a clear title and sections based on the content
        2. Preserve all original content and examples
        3. Add approximately 20% new insights, examples, or clarifications
        4. Include all numerical examples and data points from the original
        5. This is part {chunk_index+1} of {total_chunks}, ensure your section flows with others
        
        Structure the content with proper headings, key points, and examples. Be thorough and educational.
        """

        try:
            # Use structured outputs for consistent formatting
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a curriculum development expert specializing in creating educational content.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                response_format={"type": "json_schema", "json_schema": schema},
            )

            # Extract the structured content
            structured_content = json.loads(response.choices[0].message.content)

            # Add chunk metadata
            structured_content["chunk_index"] = chunk_index
            structured_content["total_chunks"] = total_chunks

            return structured_content

        except Exception as e:
            logger.error(f"Error processing chunk {chunk_index+1}: {str(e)}")
            # Return an error structure to maintain consistency
            return {
                "title": f"Error in Chunk {chunk_index+1}",
                "sections": [
                    {
                        "heading": "Processing Error",
                        "content": f"An error occurred while processing this chunk: {str(e)}",
                        "key_points": [],
                        "examples": [],
                    }
                ],
                "chapter_number": chunk_index + 1,
                "learning_objectives": ["Resolve processing errors"],
                "chunk_index": chunk_index,
                "total_chunks": total_chunks,
                "error": str(e),
            }

    @staticmethod
    def process_chunks_in_batches(
        chunks: List[str],
        api_key: str = DEFAULT_OPENAI_API_KEY,
        model_name: str = DEFAULT_OPENAI_MODEL,
        batch_size: int = DEFAULT_BATCH_SIZE,
        max_workers: int = DEFAULT_MAX_WORKERS,
    ) -> List[Dict]:
        """
        Process chunks in batches using ThreadPoolExecutor for parallel processing.

        Args:
            chunks: List of text chunks
            api_key: OpenAI API key
            model_name: OpenAI model to use
            batch_size: Size of batches to process
            max_workers: Maximum number of worker threads

        Returns:
            List[Dict]: List of structured outputs for each chunk
        """
        client = OpenAI(api_key=api_key)
        results = []
        total_chunks = len(chunks)

        # Process chunks in batches to avoid rate limiting
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit tasks for each chunk
            futures = [
                executor.submit(
                    VideoProcessorV2.process_chunk_with_structured_output,
                    chunk,
                    i,
                    total_chunks,
                    client,
                    model_name,
                )
                for i, chunk in enumerate(chunks)
            ]

            # Process results as they complete
            for i, future in enumerate(as_completed(futures)):
                try:
                    result = future.result()
                    results.append(result)
                    logger.info(f"Completed chunk {i+1}/{total_chunks}")

                    # Add a small delay between batches to avoid rate limiting
                    if (i + 1) % batch_size == 0:
                        time.sleep(1)

                except Exception as e:
                    logger.error(f"Error in future for chunk {i}: {str(e)}")
                    # Add an error placeholder to maintain order
                    results.append(
                        {
                            "title": f"Error in Chunk Processing",
                            "sections": [
                                {
                                    "heading": "Processing Error",
                                    "content": f"An error occurred: {str(e)}",
                                    "key_points": [],
                                    "examples": [],
                                }
                            ],
                            "chapter_number": i + 1,
                            "learning_objectives": [],
                            "chunk_index": i,
                            "total_chunks": total_chunks,
                            "error": str(e),
                        }
                    )

        # Sort results by chunk index to maintain order
        results.sort(key=lambda x: x.get("chunk_index", 0))
        return results

    @staticmethod
    def merge_structured_chunks(
        chunk_results: List[Dict],
        knowledge_name: str,
        client: OpenAI,
        model_name: str = DEFAULT_OPENAI_MODEL,
    ) -> Dict:
        """
        Merge structured chunks into a coherent course structure.

        Args:
            chunk_results: List of structured outputs for each chunk
            knowledge_name: Name of the knowledge entry
            client: OpenAI client
            model_name: OpenAI model to use

        Returns:
            Dict: Merged structured course content
        """
        # Extract titles and learning objectives from chunks
        titles = [
            chunk.get("title", f"Chapter {i+1}")
            for i, chunk in enumerate(chunk_results)
        ]
        all_objectives = []
        for chunk in chunk_results:
            all_objectives.extend(chunk.get("learning_objectives", []))

        # Create a summary of the content
        titles_text = "\n".join([f"- {title}" for title in titles])
        objectives_text = "\n".join([f"- {obj}" for obj in all_objectives])

        # Define the structure schema
        course_schema = {
            "name": "course_schema",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "summary": {"type": "string"},
                    "target_audience": {"type": "array", "items": {"type": "string"}},
                    "difficulty_level": {"type": "string"},
                    "recommended_prerequisites": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "additionalProperties": False,
                "required": [
                    "title",
                    "description",
                    "summary",
                    "target_audience",
                    "difficulty_level",
                    "recommended_prerequisites",
                ],
            },
        }

        # Generate a coherent course structure
        prompt = f"""
        Create a coherent course structure based on these chapter titles and learning objectives.
        
        COURSE NAME: {knowledge_name}
        
        CHAPTER TITLES:
        {titles_text}
        
        LEARNING OBJECTIVES:
        {objectives_text}
        
        INSTRUCTIONS:
        1. Create a compelling course title that encapsulates the content
        2. Write a comprehensive course description
        3. Provide a summary of what students will learn
        4. Identify the target audience for this course
        5. Specify the difficulty level (Beginner, Intermediate, Advanced)
        6. List any recommended prerequisites
        
        Structure this as a coherent course that flows logically from the provided chapters.
        """

        try:
            # Use structured outputs for consistent formatting
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a curriculum development expert specializing in creating educational content.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                response_format={"type": "json_schema", "json_schema": course_schema},
            )

            # Extract the structured content
            course_structure = json.loads(response.choices[0].message.content)

            # Add the chunks to the course structure
            course_structure["chapters"] = chunk_results

            return course_structure

        except Exception as e:
            logger.error(f"Error merging chunks: {str(e)}")
            # Return a basic structure on error
            return {
                "title": knowledge_name,
                "description": f"Course generated from video processing",
                "summary": "This course was automatically generated from video content.",
                "target_audience": ["Students interested in this topic"],
                "difficulty_level": "Intermediate",
                "recommended_prerequisites": ["Basic understanding of the subject"],
                "chapters": chunk_results,
                "error": str(e),
            }

    @staticmethod
    def create_chapters_from_structure(
        course_structure: Dict, knowledge_id: int
    ) -> List[Dict]:
        """
        Convert structured course content directly to chapter entries for database insertion.

        Args:
            course_structure: Structured course content from processing
            knowledge_id: Knowledge entry ID

        Returns:
            List[Dict]: List of chapter entries ready for database insertion
        """
        chapters = []
        current_timestamp = datetime.utcnow().isoformat()
        id_counter = 1

        # Create a root chapter for the course overview
        root_chapter = {
            "id": id_counter,
            "topic": course_structure.get("title", "Course"),
            "subtopic": "Course Overview",
            "chaptertitle": "Course Description",
            "chapter": course_structure.get("description", ""),
            "lines": len(course_structure.get("description", "").splitlines()),
            "knowledge_id": int(knowledge_id),
            "k_id": int(knowledge_id)
        }
        chapters.append(root_chapter)
        id_counter += 1

        # Process each chapter in the course
        for i, chapter_data in enumerate(course_structure.get("chapters", [])):
            # Create chapter entry
            chapter_content = chapter_data.get("title", f"Chapter {i+1}")
            if chapter_data.get("learning_objectives"):
                chapter_content += "\n\nLearning Objectives:\n" + "\n".join(f"- {obj}" for obj in chapter_data["learning_objectives"])
            
            chapter = {
                "id": id_counter,
                "topic": course_structure.get("title", "Course"),
                "subtopic": f"Chapter {i+1}",
                "chaptertitle": chapter_data.get("title", f"Chapter {i+1}"),
                "chapter": chapter_content,
                "lines": len(chapter_content.splitlines()),
                "knowledge_id": int(knowledge_id),
                "k_id": int(knowledge_id)
            }
            chapters.append(chapter)
            id_counter += 1

            # Process each section in the chapter
            for j, section_data in enumerate(chapter_data.get("sections", [])):
                # Prepare section content
                section_content = section_data.get("content", "")

                # Add examples if available
                examples = section_data.get("examples", [])
                if examples:
                    section_content += "\n\n**Examples:**\n"
                    for example in examples:
                        section_content += f"\n- {example}"

                # Add key points if available
                key_points = section_data.get("key_points", [])
                if key_points:
                    section_content += "\n\n**Key Points:**\n"
                    for point in key_points:
                        section_content += f"\n- {point}"

                # Create section entry
                section = {
                    "id": id_counter,
                    "topic": course_structure.get("title", "Course"),
                    "subtopic": f"Chapter {i+1}",
                    "chaptertitle": section_data.get("heading", f"Section {j+1}"),
                    "chapter": section_content,
                    "lines": len(section_content.splitlines()),
                    "knowledge_id": int(knowledge_id),
                    "k_id": int(knowledge_id)
                }
                chapters.append(section)
                id_counter += 1

        return chapters

    @staticmethod
    def convert_structure_to_markdown(course_structure: Dict) -> str:
        """
        Convert the structured course content to Markdown format.

        Args:
            course_structure: Structured course content

        Returns:
            str: Markdown content
        """
        markdown = []

        # Add course title and metadata
        markdown.append(f"# {course_structure['title']}")
        markdown.append("")
        markdown.append(course_structure["description"])
        markdown.append("")

        # Add summary section
        markdown.append("## Course Summary")
        markdown.append(course_structure["summary"])
        markdown.append("")

        # Add audience and prerequisites
        markdown.append("### Target Audience")
        for audience in course_structure.get("target_audience", []):
            markdown.append(f"- {audience}")
        markdown.append("")

        markdown.append("### Difficulty Level")
        markdown.append(course_structure.get("difficulty_level", "Intermediate"))
        markdown.append("")

        markdown.append("### Prerequisites")
        for prereq in course_structure.get("recommended_prerequisites", []):
            markdown.append(f"- {prereq}")
        markdown.append("\n---\n")

        # Process each chapter
        for chapter in course_structure.get("chapters", []):
            # Add chapter heading
            markdown.append(
                f"# Chapter {chapter.get('chapter_number', '')}: {chapter['title']}"
            )
            markdown.append("")

            # Add learning objectives
            if chapter.get("learning_objectives"):
                markdown.append("## Learning Objectives")
                for objective in chapter["learning_objectives"]:
                    markdown.append(f"- {objective}")
                markdown.append("")

            # Process sections in the chapter
            for section in chapter.get("sections", []):
                # Add section heading
                markdown.append(f"## {section['heading']}")
                markdown.append("")

                # Add section content
                markdown.append(section["content"])
                markdown.append("")

                # Add examples if present
                if section.get("examples"):
                    markdown.append("### Examples")
                    for example in section["examples"]:
                        markdown.append(f"- {example}")
                    markdown.append("")

                # Add key points if present
                if section.get("key_points"):
                    markdown.append("### Key Points")
                    for point in section["key_points"]:
                        markdown.append(f"- {point}")
                    markdown.append("")

            markdown.append("\n---\n")

        return "\n".join(markdown)

    @staticmethod
    def process_video_to_chapters(
        video_data: bytes,
        knowledge_id: int,
        knowledge_name: str,
        whisper_model: str = DEFAULT_WHISPER_MODEL,
        openai_model: str = DEFAULT_OPENAI_MODEL,
        openai_api_key: str = DEFAULT_OPENAI_API_KEY,
        batch_size: int = DEFAULT_BATCH_SIZE,
        max_workers: int = DEFAULT_MAX_WORKERS,
    ) -> Tuple[Dict, List[Dict]]:
        """
        Process video data into structured course content and chapters.

        Args:
            video_data: Binary video data
            knowledge_id: Knowledge entry ID
            knowledge_name: Name of the knowledge entry
            whisper_model: Whisper model size to use
            openai_model: OpenAI model to use
            openai_api_key: OpenAI API key
            batch_size: Size of batches for processing
            max_workers: Maximum number of worker threads

        Returns:
            Tuple[Dict, List[Dict]]: Tuple of (course_structure, chapters)
        """
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_api_key)

        # Step 1: Transcribe video
        transcription = VideoProcessorV2.transcribe_video(video_data, whisper_model)

        # Step 2: Split transcription into chunks
        chunks = VideoProcessorV2.chunk_text(transcription)

        # Step 3: Process chunks in batches
        chunk_results = VideoProcessorV2.process_chunks_in_batches(
            chunks=chunks,
            api_key=openai_api_key,
            model_name=openai_model,
            batch_size=batch_size,
            max_workers=max_workers,
        )

        # Step 4: Merge chunks into course structure
        course_structure = VideoProcessorV2.merge_structured_chunks(
            chunk_results=chunk_results,
            knowledge_name=knowledge_name,
            client=client,
            model_name=openai_model,
        )

        # Add raw transcription to metadata
        if "metadata" not in course_structure:
            course_structure["metadata"] = {}
        course_structure["metadata"]["transcription"] = transcription

        # Step 5: Create chapters from structure
        chapters = VideoProcessorV2.create_chapters_from_structure(
            course_structure=course_structure, knowledge_id=knowledge_id
        )

        return course_structure, chapters

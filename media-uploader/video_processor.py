import logging
import os
import time
import tempfile
import json
from typing import Dict, Tuple, List, Any, Optional
from datetime import datetime

import torch
import whisper
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoProcessor:
    """Processor for video files that transcribes and generates structured content."""
    
    # Default OpenAI API Key - should be loaded from environment in production
    DEFAULT_OPENAI_API_KEY = os.environ.get(
        "OPENAI_API_KEY", 
        ""
    )
    
    # Default model names
    DEFAULT_WHISPER_MODEL = "base"
    DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
    
    @staticmethod
    def transcribe_video(video_data: bytes, model_name: str = DEFAULT_WHISPER_MODEL) -> str:
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
        """Split text into chunks of specified size."""
        words = text.split()
        chunks = []
        current_chunk = []
        
        current_size = 0
        for word in words:
            word_size = len(word) + 1  # +1 for space
            if current_size + word_size > max_chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_size = word_size
            else:
                current_chunk.append(word)
                current_size += word_size
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    @staticmethod
    def generate_structured_content(
        transcription: str, 
        api_key: str = DEFAULT_OPENAI_API_KEY, 
        model_name: str = DEFAULT_OPENAI_MODEL
    ) -> str:
        """
        Generate structured course content from transcription using OpenAI.
        
        Args:
            transcription: Transcribed text
            api_key: OpenAI API key
            model_name: OpenAI model to use
            
        Returns:
            str: Structured course content in Markdown
        """
        client = OpenAI(api_key=api_key)
        
        # Split transcription into manageable chunks
        chunks = VideoProcessor.chunk_text(transcription)
        logger.info(f"Split transcription into {len(chunks)} chunks")
        
        # Process each chunk
        processed_chunks = []
        
        for i, chunk in enumerate(chunks):
            prompt = f"""
            You are a professional curriculum developer tasked with transforming lecture transcripts into structured course materials.
            
            Here is a transcript from a lecture:
            
            ```
            {chunk}
            ```
            
            Please convert this into a structured course section in Markdown format. Follow these guidelines:
            
            1. Create clear headings and subheadings based on the content
            2. Maintain all the original content and examples
            3. Add approximately 20% new insights, examples, or clarifications that enhance the original material
            4. Use proper Markdown formatting (headings with #, ## etc., bullet points, code blocks if needed)
            5. Avoid adding summaries - stick to transforming the content while maintaining its substance
            6. Make sure to include all numerical examples, data points, and calculations from the original
            7. If this is part {i+1} of {len(chunks)}, ensure your section can flow from/to other parts
            
            Your output should be well-structured Markdown ready to be included in a course document.
            """
            
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": "You are a curriculum development expert specializing in creating educational content."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=4000,
                    temperature=0.5
                )
                
                processed_content = response.choices[0].message.content
                processed_chunks.append(processed_content)
                
                # Rate limiting - pause between significant API calls
                time.sleep(2)
                
            except Exception as e:
                logger.error(f"Error processing chunk {i+1}: {e}")
                processed_chunks.append(f"ERROR PROCESSING CHUNK {i+1}: {str(e)}")
        
        # Combine all processed chunks
        full_content = "\n\n".join(processed_chunks)
        
        return full_content
    
    @staticmethod
    def parse_video_to_textbook(markdown_content: str) -> Dict:
        """
        Parse the markdown content to extract structure.
        
        Args:
            markdown_content: Markdown content generated from video
            
        Returns:
            Dict: A structured representation of the content
        """
        # Simple parsing of markdown headings to create a hierarchical structure
        lines = markdown_content.split('\n')
        textbook = {
            "title": "",
            "metadata": {},
            "children": []
        }
        
        current_h1 = None
        current_h2 = None
        current_h3 = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('# '):
                # H1 heading
                title = line[2:].strip()
                if not textbook["title"]:
                    textbook["title"] = title
                else:
                    current_h1 = {
                        "id": f"h1_{len(textbook['children'])}",
                        "title": title,
                        "type": "section",
                        "content": "",
                        "children": []
                    }
                    textbook["children"].append(current_h1)
                current_h2 = None
                current_h3 = None
            elif line.startswith('## '):
                # H2 heading
                if current_h1 is None:
                    # Create default H1 if needed
                    current_h1 = {
                        "id": "h1_0",
                        "title": "Introduction",
                        "type": "section",
                        "content": "",
                        "children": []
                    }
                    textbook["children"].append(current_h1)
                
                title = line[3:].strip()
                current_h2 = {
                    "id": f"h2_{len(current_h1['children'])}",
                    "title": title,
                    "type": "subsection",
                    "content": "",
                    "children": []
                }
                current_h1["children"].append(current_h2)
                current_h3 = None
            elif line.startswith('### '):
                # H3 heading
                if current_h2 is None:
                    # Skip if no parent
                    continue
                
                title = line[4:].strip()
                current_h3 = {
                    "id": f"h3_{len(current_h2['children'])}",
                    "title": title,
                    "type": "topic",
                    "content": ""
                }
                current_h2["children"].append(current_h3)
            else:
                # Content
                if current_h3:
                    current_h3["content"] += line + "\n"
                elif current_h2:
                    current_h2["content"] += line + "\n"
                elif current_h1:
                    current_h1["content"] += line + "\n"
                else:
                    # Top-level content
                    if "content" not in textbook:
                        textbook["content"] = ""
                    textbook["content"] += line + "\n"
        
        return textbook
    
    @staticmethod
    def walk_textbook(textbook: Dict, knowledge_id: int) -> List[Dict]:
        """
        Convert textbook structure to chapter entries for database insertion.
        
        Args:
            textbook: Hierarchical textbook structure
            knowledge_id: Knowledge entry ID
            
        Returns:
            List[Dict]: List of chapter entries for database insertion
        """
        chapters = []
        
        def process_node(node, parent_id=None, level=0):
            chapter_id = node.get("id", f"auto_{len(chapters)}")
            
            # Create chapter entry
            chapter = {
                "id": chapter_id,
                "knowledge_id": knowledge_id,
                "parent_id": parent_id,
                "type": node.get("type", "section"),
                "title": node.get("title", ""),
                "chapter": node.get("content", ""),
                "level": level,
                "created_at": datetime.utcnow().isoformat()
            }
            
            chapters.append(chapter)
            
            # Process children
            for child in node.get("children", []):
                process_node(child, chapter_id, level + 1)
        
        # Process root level children
        for child in textbook.get("children", []):
            process_node(child, None, 0)
            
        # If no chapters were created but we have content, create a default chapter
        if not chapters and "content" in textbook:
            chapters.append({
                "id": "default_chapter",
                "knowledge_id": knowledge_id,
                "parent_id": None,
                "type": "section",
                "title": textbook.get("title", "Transcription"),
                "chapter": textbook.get("content", ""),
                "level": 0,
                "created_at": datetime.utcnow().isoformat()
            })
        
        return chapters
    
    @staticmethod
    def process_video(
        video_data: bytes, 
        knowledge_id: int, 
        knowledge_name: str,
        whisper_model: str = DEFAULT_WHISPER_MODEL,
        openai_model: str = DEFAULT_OPENAI_MODEL,
        openai_api_key: str = DEFAULT_OPENAI_API_KEY
    ) -> Tuple[str, Dict, Dict]:
        """
        Process a video file into structured content.
        
        Args:
            video_data: Binary video data
            knowledge_id: Knowledge entry ID
            knowledge_name: Name of the knowledge entry
            whisper_model: Whisper model to use for transcription
            openai_model: OpenAI model to use for content generation
            openai_api_key: OpenAI API key
            
        Returns:
            Tuple[str, Dict, Dict]: Markdown content, empty images dict, metadata
        """
        # Start timing
        start_time = time.time()
        
        # Step 1: Transcribe video
        logger.info(f"Transcribing video for knowledge ID {knowledge_id}")
        transcription = VideoProcessor.transcribe_video(video_data, whisper_model)
        
        transcription_time = time.time() - start_time
        logger.info(f"Transcription completed in {transcription_time:.2f} seconds")
        
        # Step 2: Generate structured content
        logger.info(f"Generating structured content for knowledge ID {knowledge_id}")
        markdown_content = VideoProcessor.generate_structured_content(
            transcription, 
            openai_api_key, 
            openai_model
        )
        
        generation_time = time.time() - start_time - transcription_time
        logger.info(f"Content generation completed in {generation_time:.2f} seconds")
        
        # Step 3: Create metadata
        metadata = {
            "title": knowledge_name,
            "knowledge_id": knowledge_id,
            "processed_at": datetime.utcnow().isoformat(),
            "processing_stats": {
                "transcription_time": transcription_time,
                "generation_time": generation_time,
                "total_time": time.time() - start_time
            }
        }
        
        # Return the processed content (no images for video processing)
        return markdown_content, {}, metadata
    
    @staticmethod
    def process_video_to_chapters(
        video_data: bytes, 
        knowledge_id: int, 
        knowledge_name: str,
        whisper_model: str = DEFAULT_WHISPER_MODEL,
        openai_model: str = DEFAULT_OPENAI_MODEL,
        openai_api_key: str = DEFAULT_OPENAI_API_KEY
    ) -> Tuple[Dict, List[Dict]]:
        """
        Process a video to generate textbook structure and chapters.
        
        Args:
            video_data: Binary video data
            knowledge_id: Knowledge entry ID
            knowledge_name: Name of the knowledge entry
            whisper_model: Whisper model to use for transcription
            openai_model: OpenAI model to use for content generation
            openai_api_key: OpenAI API key
            
        Returns:
            Tuple[Dict, List[Dict]]: Textbook structure, list of chapters
        """
        # Process video to get markdown content
        markdown_content, _, metadata = VideoProcessor.process_video(
            video_data, 
            knowledge_id, 
            knowledge_name,
            whisper_model,
            openai_model,
            openai_api_key
        )
        
        # Parse markdown to textbook structure
        textbook = VideoProcessor.parse_video_to_textbook(markdown_content)
        
        # Add metadata to textbook
        textbook["metadata"] = metadata
        
        # Generate chapters
        chapters = VideoProcessor.walk_textbook(textbook, knowledge_id)
        
        return textbook, chapters 
import logging
import threading
import time
import json
import os
from datetime import datetime
from queue import Queue, Empty
from typing import Dict, Optional, List, Any, Callable

from database import DatabaseManager
from pdf_processor import PDFProcessor
from docx_processor import DOCXProcessor
from pptx_processor import PPTXProcessor
from video_processor_v2 import VideoProcessorV2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QueueManager:
    """Manager for job queue and processing thread."""
    
    def __init__(self, db_manager: DatabaseManager):
        """Initialize the queue manager."""
        self.job_queue = Queue(2)
        self.content_generation_queue = Queue(10)  # New queue for content generation
        self.processing_thread = None
        self.content_generation_thread = None  # New thread for content generation
        self.is_processing = False
        self.is_generating_content = False  # Flag for content generation
        self.db_manager = db_manager
        self.max_retries = 3
        self.retry_delays = [5, 30, 120]  # Exponential backoff: 5s, 30s, 2min
        
    def add_job(self, knowledge_id: int) -> None:
        """Add a job to the queue."""
        self.job_queue.put({"knowledge_id": knowledge_id, "retry_count": 0})
        self.ensure_processing_thread()
        
    def add_content_generation_job(self, knowledge_id: int, types: List[str], language: str = "English") -> None:
        """
        Add a content generation job to the queue.
        
        Args:
            knowledge_id: ID of the knowledge entry
            types: List of content types to generate (notes, summary, quiz, mindmap)
            language: Language for content generation
        """
        self.content_generation_queue.put({
            "knowledge_id": knowledge_id,
            "types": types,
            "language": language
        })
        self.ensure_content_generation_thread()
        
    def add_retry_job(self, knowledge_id: int, retry_count: int) -> None:
        """Add a retry job to the queue."""
        if retry_count >= self.max_retries:
            logger.warning(f"Maximum retry count reached for knowledge {knowledge_id}")
            self.db_manager.update_knowledge_status(
                knowledge_id, 
                "failed", 
                {"error": f"Maximum retry count ({self.max_retries}) reached"}
            )
            try:
                self.db_manager.add_retry_history(
                    knowledge_id, 
                    "failed", 
                    f"Maximum retry count ({self.max_retries}) reached"
                )
            except Exception as e:
                logger.warning(f"Failed to add retry history (table may not exist): {str(e)}")
            return
            
        # Calculate delay based on retry count
        delay = self.retry_delays[min(retry_count, len(self.retry_delays) - 1)]
        
        logger.info(f"Scheduling retry #{retry_count + 1} for knowledge {knowledge_id} in {delay} seconds")
        
        # Update retry info in database
        self.db_manager.update_retry_info(knowledge_id, retry_count + 1)
        
        # Add retry history
        try:
            self.db_manager.add_retry_history(
                knowledge_id, 
                "retry_scheduled", 
                f"Retry #{retry_count + 1} scheduled"
            )
        except Exception as e:
            logger.warning(f"Failed to add retry history (table may not exist): {str(e)}")
        
        # Schedule the retry after delay
        threading.Timer(delay, self._add_delayed_job, args=[knowledge_id, retry_count]).start()
        
    def _add_delayed_job(self, knowledge_id: int, retry_count: int) -> None:
        """Add a job to the queue after a delay (for retries)."""
        logger.info(f"Adding delayed retry job for knowledge {knowledge_id}, retry #{retry_count + 1}")
        self.job_queue.put({"knowledge_id": knowledge_id, "retry_count": retry_count + 1})
        self.ensure_processing_thread()
        
    def process_queue(self) -> None:
        """Process items in the queue."""
        self.is_processing = True
        
        while True:
            try:
                job = self.job_queue.get(timeout=1)  # 1-second timeout
                knowledge_id = job["knowledge_id"]
                retry_count = job.get("retry_count", 0)
                
                logger.info(f"Processing knowledge {knowledge_id} (retry #{retry_count})")
                
                try:
                    self._process_knowledge(knowledge_id, retry_count)
                    # Mark job as done
                    self.job_queue.task_done()
                except Exception as e:
                    logger.error(f"Error processing knowledge {knowledge_id}: {str(e)}")
                    # Handle retry
                    self.add_retry_job(knowledge_id, retry_count)
                    # Mark job as done
                    self.job_queue.task_done()
                    
            except Empty:
                self.is_processing = False
                break
            except Exception as e:
                logger.error(f"Error in processing thread: {str(e)}")
                self.is_processing = False
                break
                
    def ensure_processing_thread(self) -> None:
        """Ensure the processing thread is running."""
        if self.processing_thread is None or not self.processing_thread.is_alive():
            if not self.is_processing:
                self.processing_thread = threading.Thread(target=self.process_queue)
                self.processing_thread.daemon = True
                self.processing_thread.start()
                
    def ensure_content_generation_thread(self) -> None:
        """Ensure the content generation thread is running."""
        if self.content_generation_thread is None or not self.content_generation_thread.is_alive():
            if not self.is_generating_content:
                self.content_generation_thread = threading.Thread(target=self.process_content_generation_queue)
                self.content_generation_thread.daemon = True
                self.content_generation_thread.start()
                
    def process_content_generation_queue(self) -> None:
        """Process items in the content generation queue."""
        self.is_generating_content = True
        
        import asyncio
        
        while True:
            try:
                job = self.content_generation_queue.get(timeout=1)  # 1-second timeout
                knowledge_id = job["knowledge_id"]
                types = job["types"]
                language = job.get("language", "English")
                retry_count = job.get("retry_count", 0)
                
                logger.info(f"Generating content for knowledge {knowledge_id}, types: {types}, language: {language}")
                
                try:
                    # Use asyncio.run to run the async function in sync context
                    asyncio.run(self._generate_content(knowledge_id, types, language))
                    # Mark job as done
                    self.content_generation_queue.task_done()
                except Exception as e:
                    logger.error(f"Error generating content for knowledge {knowledge_id}: {str(e)}")
                    
                    # Handle retry logic
                    if retry_count < self.max_retries:
                        logger.info(f"Scheduling retry #{retry_count + 1} for content generation for knowledge {knowledge_id}")
                        # Re-add the job to the queue with incremented retry count
                        self.content_generation_queue.put({
                            "knowledge_id": knowledge_id,
                            "types": types,
                            "language": language,
                            "retry_count": retry_count + 1
                        })
                    else:
                        logger.error(f"Maximum retry count reached for content generation for knowledge {knowledge_id}")
                        # Mark job as done if max retries reached
                        self.content_generation_queue.task_done()
                    
            except Empty:
                self.is_generating_content = False
                break
            except Exception as e:
                logger.error(f"Error in content generation thread: {str(e)}")
                self.is_generating_content = False
                break
                
    async def _generate_content(self, knowledge_id: int, types: List[str], language: str) -> None:
        """
        Generate content for a knowledge entry.
        
        This method makes an internal request to the generate-content endpoint.
        """
        try:
            import requests
            from openai_client import OpenAIClient
            from openai_functions import generate_notes, generate_summary, generate_questions, generate_mind_map_structure
            
            # Get OpenAI client
            openai_client = OpenAIClient(api_key=os.environ.get("OPENAI_API_KEY", ""), base_url="http://192.168.1.12:1234/v1")
            
            # Get chapter data from the database
            chapters = self.db_manager.get_chapter_data(knowledge_id)
            
            if not chapters or len(chapters) == 0:
                logger.error(f"No chapters found for knowledge_id={knowledge_id}")
                return
            
            logger.info(f"Found {len(chapters)} chapters to process for content generation")
            
            # Define type generators mapping
            type_generators = {
                "notes": generate_notes,
                "summary": generate_summary,
                "quiz": generate_questions,
                "mindmap": generate_mind_map_structure,
            }
            
            # Process each chapter
            for chapter in chapters:
                chapter_id = chapter.get("id")
                
                # Generate content for each requested type
                results = {}
                for content_type in types:
                    if content_type not in type_generators:
                        logger.warning(f"{content_type} not supported")
                        continue
                    
                    generator = type_generators[content_type]
                    
                    try:
                        # Call the appropriate generator function
                        if content_type == "mindmap":
                            generated = await generator(openai_client, chapter.get("chapter", ""), language)
                        elif content_type == "quiz":
                            generated = await generator(openai_client, chapter.get("chapter", ""), language)
                        else:
                            generated = await generator(openai_client, chapter.get("chapter", ""), language)
                            # Join the chunked results with a delimiter for storage
                            generated = "|||||".join(generated) if isinstance(generated, list) else generated
                        
                        results[content_type] = generated
                        logger.info(f"Successfully generated {content_type} content for chapter {chapter_id}")
                    except Exception as e:
                        logger.error(f"Error generating {content_type} for chapter {chapter_id}: {str(e)}")
                        results[content_type] = f"Error generating {content_type}: {str(e)}"
                
                # Update content in the database using the EdTechContent model
                logger.info(f"Updating content for chapter {chapter_id}, language {language}")
                
                try:
                    # Add knowledge_id to the content data
                    content_data = {
                        "knowledge_id": knowledge_id,
                        **results
                    }
                    
                    # Update or create content using the new method
                    self.db_manager.update_edtech_content(
                        chapter_id=chapter_id,
                        language=language,
                        content_data=content_data
                    )
                except Exception as e:
                    logger.error(f"Error updating content for chapter {chapter_id}: {str(e)}")
                    raise
            
            logger.info(f"Content generation completed for knowledge {knowledge_id}, language {language}")
            
        except Exception as e:
            logger.error(f"Error in content generation: {str(e)}")
            raise

    def _process_knowledge(self, knowledge_id: int, retry_count: int = 0) -> None:
        """Process a single knowledge entry."""
        try:
            # Update initial status
            self.db_manager.update_knowledge_status(
                knowledge_id, 
                "processing", 
                {
                    "message": f"Starting processing (retry #{retry_count})" if retry_count > 0 else "Starting processing",
                    "start_time": datetime.utcnow().isoformat()
                }
            )

            # Retrieve knowledge row
            knowledge = self.db_manager.get_unseeded_knowledge(knowledge_id)

            # Get filename
            filename_field = knowledge["filename"]
            if isinstance(filename_field, list):
                filename = filename_field[0]
            else:
                filename = filename_field
                
            # Determine file type
            file_extension = os.path.splitext(filename)[1].lower()
            is_video = file_extension in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
            
            # Fetch the file from Supabase storage using appropriate path
            file_path = f"video/{knowledge_id}/{filename}" if is_video else f"doc/{knowledge_id}/{filename}"
            file_data = self.db_manager.download_file(file_path)
            
            # Update status to indicate file type
            self.db_manager.update_knowledge_status(
                knowledge_id, 
                "processing", 
                {
                    "message": f"Processing {'video' if is_video else 'document'}: {filename}",
                    "file_type": "video" if is_video else "document",
                    "start_time": datetime.utcnow().isoformat()
                }
            )

            if is_video:
                # Process video file
                logger.info(f"Processing video file: {filename}")
                
                # Process the video to get structured content using VideoProcessorV2
                textbook, chapters = VideoProcessorV2.process_video_to_chapters(
                    file_data,
                    knowledge_id=knowledge["id"],
                    knowledge_name=knowledge["name"]
                )
                
                # Insert chapters into database
                self.db_manager.insert_chapters(knowledge_id, chapters)
                
                # Build metadata without images
                result = {
                    "markdown": "",  # Not using raw markdown for videos
                    "metadata": textbook.get("metadata", {}),
                    "analysis": textbook,
                    "image_urls": {},
                    "failed_images": [],
                    "processed_at": datetime.utcnow().isoformat(),
                    "retry_count": retry_count,
                    "file_type": "video",
                    
                    # Extract key fields to the top level for easier access
                    "difficulty_level": textbook.get("difficulty_level"),
                    "target_audience": textbook.get("target_audience", []),
                    "prerequisites": textbook.get("recommended_prerequisites", []),
                    "summary": textbook.get("summary")
                }
            else:
                # Process PDF/document file
                logger.info(f"Processing document file: {filename}")
                
                # Determine file type and process accordingly
                file_type = "document"
                if filename.lower().endswith('.pdf'):
                    # Process PDF file
                    markdown, images, metadata = PDFProcessor.process_pdf(file_data)
                    processor = PDFProcessor
                    file_type = "pdf"
                elif filename.lower().endswith('.docx'):
                    # Process DOCX file
                    markdown, images, metadata = DOCXProcessor.process_docx(file_data)
                    processor = DOCXProcessor
                    file_type = "docx"
                elif filename.lower().endswith('.pptx'):
                    # Process PPTX file
                    markdown, images, metadata = PPTXProcessor.process_pptx(file_data)
                    processor = PPTXProcessor
                    file_type = "pptx"
                else:
                    # Fallback to PDF processor for unknown document types
                    markdown, images, metadata = PDFProcessor.process_pdf(file_data)
                    processor = PDFProcessor
    
                # Upload each extracted image to Supabase
                image_urls = {}
                failed_images = []
                
                # Prepare images for upload
                prepared_images = processor.prepare_images_for_upload(images)
                
                # Upload images
                if prepared_images and len(prepared_images) > 0:
                    for img_filename, img_data in prepared_images.items():
                        try:
                            upload_result = self.db_manager.upload_image(
                                knowledge_id,
                                img_filename,
                                img_data["buffer"],
                                f"image/{img_data['format']}"
                            )
                            
                            image_urls[img_filename] = {
                                "url": upload_result["url"],
                                "metadata": {
                                    "width": img_data["width"],
                                    "height": img_data["height"],
                                    "page": img_data["page"],
                                },
                            }
                        except Exception as img_error:
                            logger.error(f"Failed to upload image {img_filename}: {str(img_error)}")
                            failed_images.append(img_filename)
                        continue
    
                # Analyze content and insert chapters
                textbook, chapters = processor.process_text_to_index(
                    markdown, 
                    knowledge_id=knowledge["id"],
                    knowledge_name=knowledge["name"]
                )
                
                # Insert chapters into database
                self.db_manager.insert_chapters(knowledge_id, chapters)
    
                # Build final metadata to store in 'knowledge' table
                result = {
                    "markdown": markdown,
                    "metadata": metadata,
                    "analysis": textbook,
                    "image_urls": image_urls,
                    "failed_images": failed_images,
                    "processed_at": datetime.utcnow().isoformat(),
                    "retry_count": retry_count,
                    "file_type": file_type
                }

            # Update status to processed
            self.db_manager.update_knowledge_status(knowledge_id, "processed", result)
            
            # Add success entry to retry history if this was a retry
            if retry_count > 0:
                self.db_manager.add_retry_history(
                    knowledge_id, 
                    "success", 
                    f"Successfully processed after retry #{retry_count}"
                )
                
            logger.info(f"Successfully processed knowledge {knowledge_id}")

            # Check if this knowledge entry has automatic content generation flag
            knowledge_metadata = self.db_manager.get_knowledge(knowledge_id).get("metadata", "{}")
            if isinstance(knowledge_metadata, str):
                try:
                    knowledge_metadata = json.loads(knowledge_metadata)
                except:
                    knowledge_metadata = {}
                    
            # If auto content generation is enabled, queue it
            if knowledge_metadata.get("auto_generate_content", False):
                content_types = knowledge_metadata.get("content_types", ["notes", "summary", "quiz", "mindmap"])
                content_language = knowledge_metadata.get("content_language", "English")
                logger.info(f"Queueing automatic content generation for knowledge {knowledge_id}")
                self.add_content_generation_job(knowledge_id, content_types, content_language)

        except Exception as e:
            error_message = f"Failed to process knowledge {knowledge_id}: {str(e)}"
            logger.error(error_message)
            
            # Update status to failed
            self.db_manager.update_knowledge_status(
                knowledge_id, 
                "failed", 
                {
                    "error": error_message,
                    "retry_count": retry_count
                }
            )
            
            # Add failure entry to retry history
            self.db_manager.add_retry_history(
                knowledge_id, 
                "failed", 
                error_message
            )
            
            # Re-raise the exception to trigger retry
            raise

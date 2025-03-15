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
from video_processor_v2 import VideoProcessorV2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QueueManager:
    """Manager for job queue and processing thread."""
    
    def __init__(self, db_manager: DatabaseManager):
        """Initialize the queue manager."""
        self.job_queue = Queue()
        self.processing_thread = None
        self.is_processing = False
        self.db_manager = db_manager
        self.max_retries = 3
        self.retry_delays = [5, 30, 120]  # Exponential backoff: 5s, 30s, 2min
        
    def add_job(self, knowledge_id: int) -> None:
        """Add a job to the queue."""
        self.job_queue.put({"knowledge_id": knowledge_id, "retry_count": 0})
        self.ensure_processing_thread()
        
    def add_retry_job(self, knowledge_id: int, retry_count: int) -> None:
        """Add a retry job to the queue."""
        if retry_count >= self.max_retries:
            logger.warning(f"Maximum retry count reached for knowledge {knowledge_id}")
            self.db_manager.update_knowledge_status(
                knowledge_id, 
                "failed", 
                {"error": f"Maximum retry count ({self.max_retries}) reached"}
            )
            self.db_manager.add_retry_history(
                knowledge_id, 
                "failed", 
                f"Maximum retry count ({self.max_retries}) reached"
            )
            return
            
        # Calculate delay based on retry count
        delay = self.retry_delays[min(retry_count, len(self.retry_delays) - 1)]
        
        logger.info(f"Scheduling retry #{retry_count + 1} for knowledge {knowledge_id} in {delay} seconds")
        
        # Update retry info in database
        self.db_manager.update_retry_info(knowledge_id, retry_count + 1)
        
        # Add retry history
        self.db_manager.add_retry_history(
            knowledge_id, 
            "retry_scheduled", 
            f"Retry #{retry_count + 1} scheduled"
        )
        
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
                    "file_type": "video"
                }
            else:
                # Process PDF/document file
                logger.info(f"Processing document file: {filename}")
                
                # Process the PDF
                markdown, images, metadata = PDFProcessor.process_pdf(file_data)
    
                # Upload each extracted image to Supabase
                image_urls = {}
                failed_images = []
                
                # Prepare images for upload
                prepared_images = PDFProcessor.prepare_images_for_upload(images)
                
                # Upload images
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
                textbook, chapters = PDFProcessor.process_pdf_text_to_index(
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
                    "file_type": "document"
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

import json
import logging
from datetime import datetime
from typing import Dict, Optional, List, Any, Tuple

from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = ''
SUPABASE_KEY = ""  # Should be loaded from environment variables in production


class DatabaseManager:
    """Manager for database operations."""
    
    def __init__(self, url: str = SUPABASE_URL, key: str = SUPABASE_KEY):
        """Initialize the database manager."""
        self.supabase: Client = create_client(url, key)
        
    def get_knowledge(self, knowledge_id: int) -> Dict:
        """Get a knowledge entry by ID."""
        try:
            response = (
                self.supabase.table("knowledge")
                .select("*")
                .eq("id", knowledge_id)
                .execute()
            )
            
            if not response.data:
                raise Exception(f"Knowledge not found with id={knowledge_id}.")
                
            return response.data[0]
        except Exception as e:
            logger.error(f"Error getting knowledge {knowledge_id}: {str(e)}")
            raise
            
    def get_unseeded_knowledge(self, knowledge_id: int) -> Dict:
        """Get an unseeded knowledge entry by ID."""
        try:
            response = (
                self.supabase.table("knowledge")
                .select("*")
                .eq("id", knowledge_id)
                .eq("seeded", False)
                .execute()
            )
            print(response);
            if not response.data:
                raise Exception(f"No unseeded knowledge entry found with id={knowledge_id}.")
                
            return response.data[0]
        except Exception as e:
            logger.error(f"Error getting unseeded knowledge {knowledge_id}: {str(e)}")
            raise
            
    def update_knowledge_status(self, knowledge_id: int, status: str, metadata: Optional[Dict] = None) -> None:
        """Update knowledge status and metadata."""
        try:
            update_data = {"status": status}
            if metadata is not None:
                # Convert dict to JSON string
                update_data["metadata"] = json.dumps(metadata)

            response = (
                self.supabase.table("knowledge")
                .update(update_data)
                .eq("id", knowledge_id)
                .execute()
            )
            
            if hasattr(response, 'error') and response.error:
                raise Exception(f"Error updating knowledge status: {response.error}")
                
            logger.info(f"Updated knowledge {knowledge_id} status to {status}")
            
        except Exception as e:
            logger.error(f"Error updating knowledge status: {str(e)}")
            raise
            
    def insert_chapters(self, knowledge_id: int, chapters: List[Dict]) -> None:
        """Insert chapters into the database."""
        try:
            # Insert chapters in batches
            batch_size = 30
            for i in range(0, len(chapters), batch_size):
                batch = chapters[i:i + batch_size]
                response = self.supabase.table("chapters_v1").insert(batch).execute()
                if hasattr(response, 'error') and response.error:
                    raise Exception(f"Error inserting chapters: {response.error}")
                
            logger.info(f"Successfully inserted {len(chapters)} chapters for knowledge_id {knowledge_id}")
            
        except Exception as e:
            logger.error(f"Error inserting chapters: {str(e)}")
            raise
            
    def download_file(self, file_path: str) -> bytes:
        """Download a file from Supabase storage."""
        try:
            response = self.supabase.storage.from_("media").download(file_path)
            return response
        except Exception as e:
            logger.error(f"Error downloading file {file_path}: {str(e)}")
            raise
            
    def upload_image(self, knowledge_id: int, img_filename: str, image_buffer: bytes, content_type: str) -> Dict:
        """Upload an image to Supabase storage."""
        try:
            storage_path = f"image/{knowledge_id}/{img_filename}"
            
            upload_response = self.supabase.storage.from_("media").upload(
                storage_path,
                image_buffer,
                {"contentType": content_type}
            )
            
            if hasattr(upload_response, 'error') and upload_response.error:
                raise Exception(f"Error uploading image: {upload_response.error}")
                
            return {
                "url": storage_path,
                "filename": img_filename
            }
            
        except Exception as e:
            logger.error(f"Failed to upload image {img_filename}: {str(e)}")
            raise
            
    def update_retry_info(self, knowledge_id: int, retry_count: int) -> None:
        """Update retry information for a knowledge entry."""
        try:
            update_data = {
                "retry_count": retry_count,
                "last_retry": datetime.utcnow().isoformat()
            }
            
            response = (
                self.supabase.table("knowledge")
                .update(update_data)
                .eq("id", knowledge_id)
                .execute()
            )
            
            if hasattr(response, 'error') and response.error:
                raise Exception(f"Error updating retry info: {response.error}")
                
            logger.info(f"Updated retry info for knowledge {knowledge_id}: count={retry_count}")
            
        except Exception as e:
            logger.error(f"Error updating retry info: {str(e)}")
            raise
            
    def get_retry_history(self, knowledge_id: int) -> List[Dict]:
        """Get retry history for a knowledge entry."""
        try:
            response = (
                self.supabase.table("retry_history")
                .select("*")
                .eq("knowledge_id", knowledge_id)
                .order("created_at", {"ascending": False})
                .execute()
            )
            
            return response.data
            
        except Exception as e:
            logger.error(f"Error getting retry history: {str(e)}")
            raise
            
    def add_retry_history(self, knowledge_id: int, status: str, error: Optional[str] = None) -> None:
        """Add a retry history entry."""
        try:
            entry = {
                "knowledge_id": knowledge_id,
                "status": status,
                "error": error,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table("retry_history").insert([entry]).execute()
            
            if hasattr(response, 'error') and response.error:
                logger.error(f"Error adding retry history: {response.error}")
                # Don't raise here to avoid breaking the main process
                
        except Exception as e:
            logger.error(f"Error adding retry history: {str(e)}")
            # Don't raise here to avoid breaking the main process
            
    def get_chapter_data(self, knowledge_id: int, chapter_id: Optional[str] = None) -> List[Dict]:
        """Get chapter data from the chapters_v1 table.
        
        Args:
            knowledge_id: The ID of the knowledge entry
            chapter_id: Optional chapter ID to filter by
            
        Returns:
            List of chapter data dictionaries
        """
        try:
            query = (
                self.supabase.table("chapters_v1")
                .select("*")
                .eq("knowledge_id", knowledge_id)
            )
            
            if chapter_id:
                query = query.eq("chapter_id", chapter_id)
                
            response = query.execute()
            
            if not response.data:
                logger.warning(f"No chapters found for knowledge_id={knowledge_id}" + 
                              (f", chapter_id={chapter_id}" if chapter_id else ""))
                return []
                
            return response.data
            
        except Exception as e:
            logger.error(f"Error getting chapter data: {str(e)}")
            raise

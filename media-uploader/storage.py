import os
import logging
from typing import Optional, Dict, Any, BinaryIO
from datetime import datetime, timedelta
from minio import Minio
from minio.error import S3Error
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class MinIOStorage:
    """MinIO client wrapper for handling file storage operations."""
    
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9002")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "edtech-media")
        
        # Initialize MinIO client with timeout
        import urllib3
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure,
            http_client=urllib3.PoolManager(timeout=urllib3.Timeout(connect=5.0, read=10.0))
        )
        
        # Ensure bucket exists
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
        except Exception as e:
            logger.warning(f"Could not connect to MinIO at startup (timeout after 5s): {e}")
            logger.info("MinIO connection will be retried when needed")
    
    def upload_file(
        self, 
        file_data: bytes, 
        object_name: str, 
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Upload a file to MinIO.
        
        Args:
            file_data: File content as bytes
            object_name: Name of the object in MinIO
            content_type: MIME type of the file
            metadata: Optional metadata dictionary
            
        Returns:
            Dictionary with upload result information
        """
        try:
            from io import BytesIO
            
            file_stream = BytesIO(file_data)
            file_size = len(file_data)
            
            # Upload file
            result = self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file_stream,
                length=file_size,
                content_type=content_type,
                metadata=metadata or {}
            )
            
            logger.info(f"Successfully uploaded {object_name} to {self.bucket_name}")
            
            return {
                "success": True,
                "bucket_name": self.bucket_name,
                "object_name": object_name,
                "file_size": file_size,
                "etag": result.etag,
                "version_id": result.version_id
            }
            
        except S3Error as e:
            logger.error(f"Error uploading {object_name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "object_name": object_name
            }
    
    def download_file(self, object_name: str) -> Optional[bytes]:
        """
        Download a file from MinIO.
        
        Args:
            object_name: Name of the object in MinIO
            
        Returns:
            File content as bytes, or None if error
        """
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            
            logger.info(f"Successfully downloaded {object_name} from {self.bucket_name}")
            return data
            
        except S3Error as e:
            logger.error(f"Error downloading {object_name}: {e}")
            return None
    
    def delete_file(self, object_name: str) -> bool:
        """
        Delete a file from MinIO.
        
        Args:
            object_name: Name of the object in MinIO
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"Successfully deleted {object_name} from {self.bucket_name}")
            return True
            
        except S3Error as e:
            logger.error(f"Error deleting {object_name}: {e}")
            return False
    
    def get_file_info(self, object_name: str) -> Optional[Dict[str, Any]]:
        """
        Get file information from MinIO.
        
        Args:
            object_name: Name of the object in MinIO
            
        Returns:
            Dictionary with file information, or None if error
        """
        try:
            stat = self.client.stat_object(self.bucket_name, object_name)
            
            return {
                "object_name": object_name,
                "size": stat.size,
                "etag": stat.etag,
                "last_modified": stat.last_modified,
                "content_type": stat.content_type,
                "metadata": stat.metadata
            }
            
        except S3Error as e:
            logger.error(f"Error getting info for {object_name}: {e}")
            return None
    
    def list_files(self, prefix: str = "") -> list:
        """
        List files in the bucket.
        
        Args:
            prefix: Optional prefix to filter files
            
        Returns:
            List of file information dictionaries
        """
        try:
            objects = self.client.list_objects(
                self.bucket_name, 
                prefix=prefix, 
                recursive=True
            )
            
            files = []
            for obj in objects:
                files.append({
                    "object_name": obj.object_name,
                    "size": obj.size,
                    "etag": obj.etag,
                    "last_modified": obj.last_modified
                })
            
            return files
            
        except S3Error as e:
            logger.error(f"Error listing files: {e}")
            return []
    
    def generate_presigned_url(
        self, 
        object_name: str, 
        expires: timedelta = timedelta(hours=1)
    ) -> Optional[str]:
        """
        Generate a presigned URL for file access.
        
        Args:
            object_name: Name of the object in MinIO
            expires: URL expiration time
            
        Returns:
            Presigned URL string, or None if error
        """
        try:
            url = self.client.presigned_get_object(
                self.bucket_name, 
                object_name, 
                expires=expires
            )
            
            logger.info(f"Generated presigned URL for {object_name}")
            return url
            
        except S3Error as e:
            logger.error(f"Error generating presigned URL for {object_name}: {e}")
            return None

# Global storage instance
storage = MinIOStorage()

# Convenience functions for V2 API compatibility
async def upload_file_to_storage(file, object_name: str = None):
    """Upload FastAPI UploadFile to storage and return file path and bucket name."""
    import uuid
    import asyncio
    from fastapi import UploadFile
    
    # Debug information
    logger.info(f"upload_file_to_storage called with file type: {type(file)}")
    logger.info(f"File attributes: {dir(file) if hasattr(file, '__dict__') else 'No attributes'}")
    
    # Handle UploadFile or file-like objects
    if hasattr(file, 'filename') and hasattr(file, 'read'):
        # Generate object name if not provided
        if object_name is None:
            object_name = f"{uuid.uuid4()}_{getattr(file, 'filename', 'unknown_file')}"
        
        # Read file data
        if hasattr(file, 'read'):
            if asyncio.iscoroutinefunction(file.read):
                file_content = await file.read()
            else:
                file_content = file.read()
        else:
            raise ValueError("File object has no read method")
        
        # Reset file pointer if possible
        if hasattr(file, 'seek'):
            if asyncio.iscoroutinefunction(file.seek):
                await file.seek(0)
            else:
                file.seek(0)
        
        # Get content type
        content_type = getattr(file, 'content_type', None) or "application/octet-stream"
        
        # Upload to storage
        result = storage.upload_file(
            file_data=file_content,
            object_name=object_name,
            content_type=content_type
        )
        
        if result["success"]:
            return object_name, result["bucket_name"]
        else:
            raise Exception(f"Failed to upload file: {result.get('error', 'Unknown error')}")
    else:
        raise ValueError(f"Expected file-like object with filename and read method, got {type(file)}")

def get_file_from_storage(object_name: str) -> Optional[bytes]:
    """Download file from storage using the global storage instance."""
    return storage.download_file(object_name)

def delete_file_from_storage(object_name: str) -> bool:
    """Delete file from storage using the global storage instance."""
    return storage.delete_file(object_name)
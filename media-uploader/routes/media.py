import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from database import DatabaseManager, get_db as get_database_session
from models import Media, User
from routes.auth import get_current_user
from storage import storage
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/media", tags=["media"])

def get_db():
    return get_database_session()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    knowledge_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file to MinIO storage and track in database."""
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Create object path
        object_name = f"uploads/{unique_filename}"
        
        # Upload to MinIO
        upload_result = storage.upload_file(
            file_data=file_content,
            object_name=object_name,
            content_type=file.content_type or "application/octet-stream",
            metadata={
                "original_filename": file.filename,
                "uploaded_by": str(current_user.id),
                "knowledge_id": str(knowledge_id) if knowledge_id else ""
            }
        )
        
        if not upload_result["success"]:
            raise HTTPException(status_code=500, detail=f"Upload failed: {upload_result['error']}")
        
        # Create database record
        media_record = Media(
            knowledge_id=knowledge_id,
            filename=unique_filename,
            original_filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            file_path=object_name,
            bucket_name=storage.bucket_name,
            upload_status="completed",
            uploaded_by=current_user.id,
            meta_data={
                "etag": upload_result.get("etag"),
                "version_id": upload_result.get("version_id")
            }
        )
        
        db.add(media_record)
        db.commit()
        
        logger.info(f"Successfully uploaded file {file.filename} as {unique_filename}")
        
        return {
            "id": media_record.id,
            "filename": unique_filename,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "file_size": file_size,
            "upload_status": "completed",
            "created_at": media_record.created_at
        }
        
    except Exception as e:
        logger.error(f"Error uploading file {file.filename}: {str(e)}")
        
        # Create failed record if we have enough info
        try:
            media_record = Media(
                knowledge_id=knowledge_id,
                filename=file.filename,
                original_filename=file.filename,
                content_type=file.content_type or "application/octet-stream",
                file_size=0,
                file_path="",
                bucket_name=storage.bucket_name,
                upload_status="failed",
                error_message=str(e),
                uploaded_by=current_user.id
            )
            db.add(media_record)
            db.commit()
        except:
            pass
        
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{media_id}")
async def download_file(
    media_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a file from MinIO storage."""
    # Get media record
    media_record = db.query(Media).filter(Media.id == media_id).first()
    if not media_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Download from MinIO
    file_data = storage.download_file(media_record.file_path)
    if file_data is None:
        raise HTTPException(status_code=500, detail="Failed to download file")
    
    from fastapi.responses import Response
    
    return Response(
        content=file_data,
        media_type=media_record.content_type,
        headers={
            "Content-Disposition": f"attachment; filename={media_record.original_filename}"
        }
    )

@router.get("/info/{media_id}")
async def get_file_info(
    media_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file information."""
    media_record = db.query(Media).filter(Media.id == media_id).first()
    if not media_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "id": media_record.id,
        "knowledge_id": media_record.knowledge_id,
        "filename": media_record.filename,
        "original_filename": media_record.original_filename,
        "content_type": media_record.content_type,
        "file_size": media_record.file_size,
        "upload_status": media_record.upload_status,
        "error_message": media_record.error_message,
        "created_at": media_record.created_at,
        "updated_at": media_record.updated_at
    }

@router.get("/list")
async def list_files(
    knowledge_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List uploaded files."""
    query = db.query(Media)
    
    if knowledge_id:
        query = query.filter(Media.knowledge_id == knowledge_id)
    
    # Order by creation date, newest first
    query = query.order_by(Media.created_at.desc())
    
    # Apply pagination
    files = query.offset(offset).limit(limit).all()
    
    return {
        "files": [
            {
                "id": media.id,
                "knowledge_id": media.knowledge_id,
                "filename": media.filename,
                "original_filename": media.original_filename,
                "content_type": media.content_type,
                "file_size": media.file_size,
                "upload_status": media.upload_status,
                "created_at": media.created_at
            }
            for media in files
        ],
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total": query.count()
        }
    }

@router.delete("/{media_id}")
async def delete_file(
    media_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file from storage and database."""
    # Get media record
    media_record = db.query(Media).filter(Media.id == media_id).first()
    if not media_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user owns the file or is admin
    if media_record.uploaded_by != current_user.id and "admin" not in current_user.roles:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
    
    # Delete from MinIO
    if media_record.file_path:
        delete_success = storage.delete_file(media_record.file_path)
        if not delete_success:
            logger.warning(f"Failed to delete file {media_record.file_path} from MinIO")
    
    # Delete from database
    db.delete(media_record)
    db.commit()
    
    logger.info(f"Successfully deleted file {media_record.filename}")
    
    return {"message": "File deleted successfully"}

@router.get("/presigned-url/{media_id}")
async def get_presigned_url(
    media_id: int,
    expires_hours: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a presigned URL for direct file access."""
    # Get media record
    media_record = db.query(Media).filter(Media.id == media_id).first()
    if not media_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    from datetime import timedelta
    
    # Generate presigned URL
    url = storage.generate_presigned_url(
        media_record.file_path,
        expires=timedelta(hours=expires_hours)
    )
    
    if not url:
        raise HTTPException(status_code=500, detail="Failed to generate presigned URL")
    
    return {
        "url": url,
        "expires_in_hours": expires_hours,
        "filename": media_record.original_filename
    } 
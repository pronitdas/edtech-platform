from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import List, Optional
import os
import aiofiles
import aiofiles.os
from datetime import datetime
import uuid
import mimetypes
from pathlib import Path
import redis.asyncio as redis

from src.models.v2_models import MediaUploadResponse, MediaInfoResponse, MediaListResponse, PresignedUrlResponse
from routes.auth import get_current_user
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter(tags=["media-v2"])

# Redis for caching
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# Storage configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "100")) * 1024 * 1024  # 100MB default
ALLOWED_EXTENSIONS = {".pdf", ".mp4", ".avi", ".mov", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"}

async def ensure_upload_dir():
    """Ensure upload directory exists"""
    Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

def validate_file(file: UploadFile) -> tuple[bool, str]:
    """Validate uploaded file"""
    if not file.filename:
        return False, "No filename provided"
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"File type {file_ext} not allowed"
    
    return True, ""

@router.post("/upload", response_model=MediaUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file with security validation and caching"""
    await ensure_upload_dir()
    
    # Validate file
    is_valid, error_msg = validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Generate secure filename
    file_id = str(uuid.uuid4())
    file_ext = Path(file.filename).suffix.lower()
    secure_filename = f"{file_id}{file_ext}"
    file_path = Path(UPLOAD_DIR) / secure_filename
    
    try:
        # Write file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Store metadata in database
        from models import MediaFile
        media_file = MediaFile(
            id=file_id,
            original_filename=file.filename,
            filename=secure_filename,
            file_path=str(file_path),
            file_size=len(content),
            content_type=file.content_type or mimetypes.guess_type(file.filename)[0],
            user_id=user_id,
            created_at=datetime.utcnow()
        )
        db.add(media_file)
        db.commit()
        
        # Cache file info
        cache_key = f"media:{file_id}"
        cache_data = {
            "id": file_id,
            "filename": file.filename,
            "size": len(content),
            "content_type": media_file.content_type,
            "created_at": media_file.created_at.isoformat()
        }
        await redis_client.setex(cache_key, 3600, str(cache_data))
        
        return MediaUploadResponse(
            id=file_id,
            filename=file.filename,
            size=len(content),
            content_type=media_file.content_type,
            upload_url=f"/v2/media/{file_id}",
            status="uploaded"
        )
        
    except Exception as e:
        # Clean up file if database operation fails
        if file_path.exists():
            await aiofiles.os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/{media_id}", response_model=MediaInfoResponse)
async def get_media_info(
    media_id: str,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get media file information with caching"""
    # Try cache first
    cache_key = f"media:{media_id}"
    cached = await redis_client.get(cache_key)
    if cached:
        import ast
        cache_data = ast.literal_eval(cached.decode())
        return MediaInfoResponse(**cache_data)
    
    # Query database
    from models import MediaFile
    media_file = db.query(MediaFile).filter(
        MediaFile.id == media_id,
        MediaFile.user_id == user_id
    ).first()
    
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    response = MediaInfoResponse(
        id=media_file.id,
        filename=media_file.original_filename,
        size=media_file.file_size,
        content_type=media_file.content_type,
        created_at=media_file.created_at,
        download_url=f"/v2/media/{media_id}/download"
    )
    
    # Cache response
    cache_data = response.dict()
    cache_data["created_at"] = cache_data["created_at"].isoformat()
    await redis_client.setex(cache_key, 3600, str(cache_data))
    
    return response

@router.get("/{media_id}/download")
async def download_file(
    media_id: str,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a file with streaming response"""
    from models import MediaFile
    media_file = db.query(MediaFile).filter(
        MediaFile.id == media_id,
        MediaFile.user_id == user_id
    ).first()
    
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    file_path = Path(media_file.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    async def file_generator():
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(8192):
                yield chunk
    
    return StreamingResponse(
        file_generator(),
        media_type=media_file.content_type or 'application/octet-stream',
        headers={
            "Content-Disposition": f"attachment; filename={media_file.original_filename}",
            "Content-Length": str(media_file.file_size)
        }
    )

@router.get("/", response_model=MediaListResponse)
async def list_media_files(
    user_id: int = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List user's media files with pagination"""
    from models import MediaFile
    
    query = db.query(MediaFile).filter(MediaFile.user_id == user_id)
    total = query.count()
    files = query.offset(offset).limit(limit).all()
    
    items = [
        MediaInfoResponse(
            id=f.id,
            filename=f.original_filename,
            size=f.file_size,
            content_type=f.content_type,
            created_at=f.created_at,
            download_url=f"/v2/media/{f.id}/download"
        )
        for f in files
    ]
    
    return MediaListResponse(items=items, total=total, limit=limit, offset=offset)

@router.delete("/{media_id}")
async def delete_media_file(
    media_id: str,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a media file"""
    from models import MediaFile
    media_file = db.query(MediaFile).filter(
        MediaFile.id == media_id,
        MediaFile.user_id == user_id
    ).first()
    
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Delete from filesystem
    file_path = Path(media_file.file_path)
    if file_path.exists():
        await aiofiles.os.remove(file_path)
    
    # Delete from database
    db.delete(media_file)
    db.commit()
    
    # Remove from cache
    cache_key = f"media:{media_id}"
    await redis_client.delete(cache_key)
    
    return {"message": "File deleted successfully"}

@router.post("/{media_id}/presigned-url", response_model=PresignedUrlResponse)
async def generate_presigned_url(
    media_id: str,
    user_id: int = Depends(get_current_user),
    expires_in: int = 3600,
    db: Session = Depends(get_db)
):
    """Generate presigned URL for file access"""
    from models import MediaFile
    media_file = db.query(MediaFile).filter(
        MediaFile.id == media_id,
        MediaFile.user_id == user_id
    ).first()
    
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Generate secure token
    import jwt
    from routes.auth import JWT_SECRET, JWT_ALGORITHM
    
    payload = {
        "media_id": media_id,
        "user_id": user_id,
        "exp": datetime.utcnow().timestamp() + expires_in
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    presigned_url = f"/v2/media/{media_id}/download?token={token}"
    
    return PresignedUrlResponse(
        url=presigned_url,
        expires_at=datetime.utcnow().timestamp() + expires_in,
        media_id=media_id
    )
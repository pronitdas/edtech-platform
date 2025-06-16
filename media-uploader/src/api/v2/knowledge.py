from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from database import get_db
from src.models.v2_models import KnowledgeUploadRequest, KnowledgeResponse, KnowledgeListResponse
from src.services.knowledge_service import KnowledgeService
from src.services.auth_service import get_current_user
from src.services.websocket_manager import websocket_manager
from models import User

router = APIRouter()

@router.post("/", response_model=dict)
async def upload_knowledge(
    file: UploadFile = File(None),
    files: List[UploadFile] = File(None),
    auto_process: bool = True,
    generate_content: bool = True,
    content_types: str = "summary,notes,quiz,mindmap",
    content_language: str = "English",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    knowledge_service = KnowledgeService(db)
    content_types_list = content_types.split(",")
    
    # Handle both single file and multiple files
    upload_files = []
    if file:
        upload_files.append(file)
    if files:
        upload_files.extend(files)
    
    if not upload_files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    try:
        knowledge_id, ws_channel = await knowledge_service.upload_files(
            files=upload_files,
            user_id=current_user.id,
            auto_process=auto_process,
            generate_content=generate_content,
            content_types=content_types_list,
            content_language=content_language
        )
        
        return {
            "knowledge_id": knowledge_id,
            "ws_channel": ws_channel,
            "message": "Upload initiated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=KnowledgeListResponse)
async def list_knowledge(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    knowledge_service = KnowledgeService(db)
    items, total = await knowledge_service.list_knowledge(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status
    )
    return KnowledgeListResponse(items=items, total=total)

@router.get("/{knowledge_id}", response_model=KnowledgeResponse)
async def get_knowledge(
    knowledge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    knowledge_service = KnowledgeService(db)
    knowledge = await knowledge_service.get_knowledge(knowledge_id, current_user.id)
    if not knowledge:
        raise HTTPException(status_code=404, detail="Knowledge not found")
    return knowledge

@router.delete("/{knowledge_id}")
async def delete_knowledge(
    knowledge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    knowledge_service = KnowledgeService(db)
    success = await knowledge_service.delete_knowledge(knowledge_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Knowledge not found")
    return {"message": "Knowledge deleted successfully"}

@router.websocket("/{knowledge_id}/status")
async def websocket_status(websocket: WebSocket, knowledge_id: int):
    await websocket_manager.connect(websocket, f"knowledge_{knowledge_id}")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, f"knowledge_{knowledge_id}")

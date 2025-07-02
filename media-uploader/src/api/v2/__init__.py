from fastapi import APIRouter
from .auth import router as auth_router
from .knowledge import router as knowledge_router
from .chapters import router as chapters_router
from .content import router as content_router
from .roleplay import router as roleplay_router
from .analytics import router as analytics_router
from .search import router as search_router
from .admin import router as admin_router
from .media import router as media_router
from .llm import router as llm_router

v2_router = APIRouter(prefix="/v2")

v2_router.include_router(auth_router, prefix="/auth", tags=["auth"])
v2_router.include_router(knowledge_router, prefix="/knowledge", tags=["knowledge"])
v2_router.include_router(chapters_router, prefix="/chapters", tags=["chapters"])
v2_router.include_router(content_router, prefix="/content", tags=["content"])
v2_router.include_router(roleplay_router, prefix="/roleplay", tags=["roleplay"])
v2_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
v2_router.include_router(search_router, prefix="/search", tags=["search"])
v2_router.include_router(admin_router, prefix="/admin", tags=["admin"])
v2_router.include_router(media_router, prefix="/media", tags=["media"])
v2_router.include_router(llm_router, prefix="/llm", tags=["llm"])

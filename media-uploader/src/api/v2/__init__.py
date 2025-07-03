from fastapi import APIRouter
from .auth import router as auth_router
from .simple_auth import router as simple_auth_router
from .knowledge import router as knowledge_router
from .chapters import router as chapters_router
from .content import router as content_router
from .roleplay import router as roleplay_router
from .analytics import router as analytics_router
from .search import router as search_router
from .admin import router as admin_router
from .media import router as media_router
from .llm import router as llm_router
from .dashboard import router as dashboard_router
from .topic_generation import router as topic_generation_router
from .semantic_search import router as semantic_search_router
from .teacher import router as teacher_router
from .ai_tutor import router as ai_tutor_router

v2_router = APIRouter(prefix="/v2")

v2_router.include_router(auth_router, prefix="/auth", tags=["auth"])
v2_router.include_router(simple_auth_router, prefix="/auth", tags=["simple-auth"])
v2_router.include_router(knowledge_router, prefix="/knowledge", tags=["knowledge"])
v2_router.include_router(chapters_router, prefix="/chapters", tags=["chapters"])
v2_router.include_router(content_router, prefix="/content", tags=["content"])
v2_router.include_router(roleplay_router, prefix="/roleplay", tags=["roleplay"])
v2_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
v2_router.include_router(search_router, prefix="/search", tags=["search"])
v2_router.include_router(admin_router, prefix="/admin", tags=["admin"])
v2_router.include_router(media_router, prefix="/media", tags=["media"])
v2_router.include_router(llm_router, prefix="/llm", tags=["llm"])
v2_router.include_router(dashboard_router, tags=["dashboard"])
v2_router.include_router(topic_generation_router, tags=["topic-generation"])
v2_router.include_router(semantic_search_router, tags=["semantic-search"])
v2_router.include_router(teacher_router, tags=["teacher"])
v2_router.include_router(ai_tutor_router, tags=["ai-tutor"])

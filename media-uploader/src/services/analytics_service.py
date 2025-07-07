from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from datetime import datetime, timedelta
import json

from models import Knowledge, Base
from src.models.v2_models import UserProgressResponse

# Define analytics models if not in models.py
try:
    from models import UserEvent, UserSession
except ImportError:
    from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, BigInteger
    from uuid import uuid4
    
    class UserSession(Base):
        __tablename__ = "user_sessions"
        
        id = Column(String, primary_key=True)
        user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
        started_at = Column(DateTime, default=datetime.utcnow)
        ended_at = Column(DateTime)
        duration_sec = Column(Integer)
    
    class UserEvent(Base):
        __tablename__ = "user_events"
        
        id = Column(BigInteger, primary_key=True)
        user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
        knowledge_id = Column(Integer, ForeignKey("knowledge.id", ondelete="SET NULL"))
        chapter_id = Column(String(64))
        session_id = Column(String, ForeignKey("user_sessions.id", ondelete="SET NULL"))
        event_type = Column(String(64), nullable=False)
        content_id = Column(String(64))
        ts = Column(DateTime, default=datetime.utcnow)
        data = Column(JSON)

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    async def track_event(
        self,
        user_id: int,
        event_type: str,
        knowledge_id: Optional[int] = None,
        chapter_id: Optional[str] = None,
        content_id: Optional[str] = None,
        session_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> None:
        """Track a user event for analytics."""
        event = UserEvent(
            user_id=user_id,
            knowledge_id=knowledge_id,
            chapter_id=chapter_id,
            event_type=event_type,
            content_id=content_id,
            session_id=session_id,
            data=data or {}
        )
        
        self.db.add(event)
        self.db.commit()

    async def get_user_progress(self, user_id: int) -> List[UserProgressResponse]:
        """Get user progress across all knowledge entries."""
        # Query user progress from materialized view or calculate on-the-fly
        try:
            # Try to use materialized view if it exists
            progress_data = self.db.execute("""
                SELECT user_id, knowledge_id, chapters_viewed, last_access, progress_percent
                FROM user_progress 
                WHERE user_id = :user_id
            """, {"user_id": user_id}).fetchall()
            
            return [
                UserProgressResponse(
                    user_id=row.user_id,
                    knowledge_id=row.knowledge_id,
                    chapters_viewed=row.chapters_viewed,
                    last_access=row.last_access,
                    progress_percent=row.progress_percent
                )
                for row in progress_data
            ]
        except Exception:
            # Fallback to calculating progress on-the-fly
            return await self._calculate_user_progress(user_id)

    async def _calculate_user_progress(self, user_id: int) -> List[UserProgressResponse]:
        """Calculate user progress on-the-fly if materialized view is not available."""
        progress_query = self.db.query(
            UserEvent.knowledge_id,
            func.count(func.distinct(UserEvent.chapter_id)).label('chapters_viewed'),
            func.max(UserEvent.ts).label('last_access')
        ).filter(
            and_(
                UserEvent.user_id == user_id,
                UserEvent.knowledge_id.isnot(None),
                UserEvent.chapter_id.isnot(None)
            )
        ).group_by(UserEvent.knowledge_id).all()

        result = []
        for row in progress_query:
            # Calculate progress percentage (simplified)
            total_chapters = self.db.query(func.count(func.distinct("chapters_v1.id"))).filter(
                "chapters_v1.knowledge_id" == row.knowledge_id
            ).scalar() or 1
            
            progress_percent = (row.chapters_viewed / total_chapters) * 100
            
            result.append(UserProgressResponse(
                user_id=user_id,
                knowledge_id=row.knowledge_id,
                chapters_viewed=row.chapters_viewed,
                last_access=row.last_access,
                progress_percent=min(progress_percent, 100.0)
            ))
        
        return result

    async def get_completion_stats(self, user_id: int, course_id: Optional[int] = None) -> Dict[str, Any]:
        """Get user completion statistics."""
        filters = [UserEvent.user_id == user_id]
        if course_id:
            filters.append(UserEvent.knowledge_id == course_id)

        total_events = self.db.query(func.count(UserEvent.id)).filter(and_(*filters)).scalar()
        
        completion_events = self.db.query(func.count(UserEvent.id)).filter(
            and_(*filters, UserEvent.event_type == 'chapter_complete')
        ).scalar()

        # Get time-based stats
        last_30_days = datetime.utcnow() - timedelta(days=30)
        recent_activity = self.db.query(func.count(UserEvent.id)).filter(
            and_(*filters, UserEvent.ts >= last_30_days)
        ).scalar()

        return {
            "total_events": total_events,
            "completion_events": completion_events,
            "completion_rate": (completion_events / max(total_events, 1)) * 100,
            "recent_activity_30d": recent_activity,
            "user_id": user_id,
            "course_id": course_id
        }

    async def get_user_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user session history."""
        sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id
        ).order_by(desc(UserSession.started_at)).limit(50).all()

        return [
            {
                "id": str(session.id),
                "started_at": session.started_at,
                "ended_at": session.ended_at,
                "duration_sec": session.duration_sec
            }
            for session in sessions
        ]

    async def get_user_interactions(self, user_id: int, content_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get user interaction history."""
        query = self.db.query(UserEvent).filter(UserEvent.user_id == user_id)
        
        if content_id:
            query = query.filter(UserEvent.content_id == content_id)
        
        interactions = query.order_by(desc(UserEvent.ts)).limit(100).all()

        return [
            {
                "id": interaction.id,
                "event_type": interaction.event_type,
                "knowledge_id": interaction.knowledge_id,
                "chapter_id": interaction.chapter_id,
                "content_id": interaction.content_id,
                "timestamp": interaction.ts,
                "data": interaction.data
            }
            for interaction in interactions
        ]

    async def get_numeric_summary(
        self, 
        user_id: int, 
        event_type: Optional[str] = None, 
        json_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get numeric summary of user events."""
        query = self.db.query(UserEvent).filter(UserEvent.user_id == user_id)
        
        if event_type:
            query = query.filter(UserEvent.event_type == event_type)
        
        events = query.all()
        
        summary = {
            "total_events": len(events),
            "event_types": {},
            "date_range": {}
        }
        
        if events:
            # Count by event type
            for event in events:
                event_type_key = event.event_type
                summary["event_types"][event_type_key] = summary["event_types"].get(event_type_key, 0) + 1
            
            # Date range
            timestamps = [event.ts for event in events]
            summary["date_range"] = {
                "earliest": min(timestamps),
                "latest": max(timestamps)
            }
            
            # Extract numeric data from JSON if json_key is provided
            if json_key:
                numeric_values = []
                for event in events:
                    if event.data and json_key in event.data:
                        try:
                            value = float(event.data[json_key])
                            numeric_values.append(value)
                        except (ValueError, TypeError):
                            continue
                
                if numeric_values:
                    summary[f"{json_key}_stats"] = {
                        "count": len(numeric_values),
                        "sum": sum(numeric_values),
                        "avg": sum(numeric_values) / len(numeric_values),
                        "min": min(numeric_values),
                        "max": max(numeric_values)
                    }
        
        return summary

    async def get_knowledge_interactions(self, knowledge_id: int, user_id: int) -> Dict[str, Any]:
        """Get interaction statistics for a knowledge entry."""
        # Verify user has access
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            raise ValueError("Knowledge entry not found or access denied")
        
        # Get interaction stats
        total_interactions = self.db.query(func.count(UserEvent.id)).filter(
            UserEvent.knowledge_id == knowledge_id
        ).scalar()
        
        unique_users = self.db.query(func.count(func.distinct(UserEvent.user_id))).filter(
            UserEvent.knowledge_id == knowledge_id
        ).scalar()
        
        # Get event type breakdown
        event_breakdown = self.db.query(
            UserEvent.event_type,
            func.count(UserEvent.id).label('count')
        ).filter(
            UserEvent.knowledge_id == knowledge_id
        ).group_by(UserEvent.event_type).all()
        
        return {
            "knowledge_id": knowledge_id,
            "total_interactions": total_interactions,
            "unique_users": unique_users,
            "event_breakdown": {row.event_type: row.count for row in event_breakdown}
        }

    async def get_video_stats(self, knowledge_id: int, user_id: int) -> Dict[str, Any]:
        """Get video viewing statistics for a knowledge entry."""
        # Verify access
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            raise ValueError("Knowledge entry not found or access denied")
        
        # Get video-related events
        video_events = self.db.query(UserEvent).filter(
            and_(
                UserEvent.knowledge_id == knowledge_id,
                UserEvent.event_type.in_(['video_play', 'video_pause', 'video_complete', 'video_seek'])
            )
        ).all()
        
        stats = {
            "total_video_events": len(video_events),
            "play_events": 0,
            "completion_events": 0,
            "average_watch_time": 0,
            "total_watch_time": 0
        }
        
        watch_times = []
        for event in video_events:
            if event.event_type == 'video_play':
                stats["play_events"] += 1
            elif event.event_type == 'video_complete':
                stats["completion_events"] += 1
                if event.data and 'watch_time' in event.data:
                    try:
                        watch_time = float(event.data['watch_time'])
                        watch_times.append(watch_time)
                        stats["total_watch_time"] += watch_time
                    except (ValueError, TypeError):
                        pass
        
        if watch_times:
            stats["average_watch_time"] = sum(watch_times) / len(watch_times)
        
        return stats

    async def get_quiz_stats(self, knowledge_id: int, user_id: int) -> Dict[str, Any]:
        """Get quiz completion statistics for a knowledge entry."""
        # Verify access
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            raise ValueError("Knowledge entry not found or access denied")
        
        # Get quiz-related events
        quiz_events = self.db.query(UserEvent).filter(
            and_(
                UserEvent.knowledge_id == knowledge_id,
                UserEvent.event_type.in_(['quiz_start', 'quiz_complete', 'quiz_answer'])
            )
        ).all()
        
        stats = {
            "total_quiz_events": len(quiz_events),
            "quiz_attempts": 0,
            "quiz_completions": 0,
            "average_score": 0,
            "total_questions_answered": 0
        }
        
        scores = []
        for event in quiz_events:
            if event.event_type == 'quiz_start':
                stats["quiz_attempts"] += 1
            elif event.event_type == 'quiz_complete':
                stats["quiz_completions"] += 1
                if event.data and 'score' in event.data:
                    try:
                        score = float(event.data['score'])
                        scores.append(score)
                    except (ValueError, TypeError):
                        pass
            elif event.event_type == 'quiz_answer':
                stats["total_questions_answered"] += 1
        
        if scores:
            stats["average_score"] = sum(scores) / len(scores)
        
        return stats

    async def start_session(self, user_id: int) -> str:
        """Start a new user session and return session ID."""
        from uuid import uuid4
        
        session = UserSession(
            id=str(uuid4()),
            user_id=user_id,
            started_at=datetime.utcnow()
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        return str(session.id)

    async def end_session(self, session_id: str, user_id: int) -> None:
        """End a user session."""
        session = self.db.query(UserSession).filter(
            and_(UserSession.id == session_id, UserSession.user_id == user_id)
        ).first()
        
        if session and session.ended_at is None:
            session.ended_at = datetime.utcnow()
            if session.started_at:
                duration = session.ended_at - session.started_at
                session.duration_sec = int(duration.total_seconds())
            
            self.db.commit()

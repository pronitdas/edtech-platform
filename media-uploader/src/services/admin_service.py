from typing import Dict, Any
import asyncio
import psutil
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from models import Knowledge, User, UserEvent
from database import DatabaseManager

class AdminService:
    def __init__(self, db: Session):
        self.db = db

    async def get_full_health_check(self) -> Dict[str, Any]:
        """Get comprehensive health status of all system components."""
        services = {}
        overall_status = "healthy"
        
        # Check PostgreSQL
        try:
            postgres_status = await self._check_postgres_health()
            services["postgresql"] = postgres_status
            if postgres_status["status"] != "healthy":
                overall_status = "degraded"
        except Exception as e:
            services["postgresql"] = {"status": "unhealthy", "error": str(e)}
            overall_status = "unhealthy"
        
        # Check Neo4j
        try:
            neo4j_status = await self._check_neo4j_health()
            services["neo4j"] = neo4j_status
            if neo4j_status["status"] != "healthy":
                overall_status = "degraded"
        except Exception as e:
            services["neo4j"] = {"status": "unhealthy", "error": str(e)}
            overall_status = "unhealthy"
        
        # Check MinIO
        try:
            minio_status = await self._check_minio_health()
            services["minio"] = minio_status
            if minio_status["status"] != "healthy":
                overall_status = "degraded"
        except Exception as e:
            services["minio"] = {"status": "unhealthy", "error": str(e)}
            overall_status = "unhealthy"
        
        # Check Queue System
        try:
            queue_status = await self._check_queue_health()
            services["queue"] = queue_status
            if queue_status["status"] != "healthy":
                overall_status = "degraded"
        except Exception as e:
            services["queue"] = {"status": "unhealthy", "error": str(e)}
            overall_status = "unhealthy"
        
        # Check System Resources
        try:
            system_status = await self._check_system_resources()
            services["system"] = system_status
            if system_status["status"] != "healthy":
                overall_status = "degraded"
        except Exception as e:
            services["system"] = {"status": "unhealthy", "error": str(e)}
            overall_status = "unhealthy"
        
        return {
            "status": overall_status,
            "services": services,
            "version": self._get_version()
        }

    async def _check_postgres_health(self) -> Dict[str, Any]:
        """Check PostgreSQL database health."""
        try:
            # Test connection and basic query
            result = self.db.execute(text("SELECT 1")).scalar()
            
            # Check database size
            db_size = self.db.execute(text("""
                SELECT pg_size_pretty(pg_database_size(current_database()))
            """)).scalar()
            
            # Check connection count
            connection_count = self.db.execute(text("""
                SELECT count(*) FROM pg_stat_activity 
                WHERE state = 'active'
            """)).scalar()
            
            return {
                "status": "healthy",
                "database_size": db_size,
                "active_connections": connection_count,
                "response_time_ms": 0  # Would measure actual response time
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

    async def _check_neo4j_health(self) -> Dict[str, Any]:
        """Check Neo4j database health."""
        try:
            # This would typically use a Neo4j driver
            # For now, return a placeholder implementation
            return {
                "status": "healthy",
                "node_count": 0,  # Would query actual node count
                "relationship_count": 0,  # Would query actual relationship count
                "memory_usage": "N/A"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

    async def _check_minio_health(self) -> Dict[str, Any]:
        """Check MinIO storage health."""
        try:
            # This would typically use MinIO client
            # For now, return a placeholder implementation
            return {
                "status": "healthy",
                "bucket_count": 0,  # Would query actual bucket count
                "total_objects": 0,  # Would query actual object count
                "storage_used": "N/A"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

    async def _check_queue_health(self) -> Dict[str, Any]:
        """Check queue system health."""
        try:
            # This would check the actual queue implementation
            # For now, return a placeholder
            return {
                "status": "healthy",
                "pending_jobs": 0,
                "failed_jobs": 0,
                "workers_active": 0
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

    async def _check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage."""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Determine status based on thresholds
            status = "healthy"
            if cpu_percent > 80 or memory.percent > 85 or disk.percent > 90:
                status = "degraded"
            if cpu_percent > 95 or memory.percent > 95 or disk.percent > 95:
                status = "unhealthy"
            
            return {
                "status": status,
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_total_gb": round(memory.total / (1024**3), 2),
                "memory_used_gb": round(memory.used / (1024**3), 2),
                "disk_percent": disk.percent,
                "disk_total_gb": round(disk.total / (1024**3), 2),
                "disk_used_gb": round(disk.used / (1024**3), 2)
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

    async def get_system_metrics(self) -> Dict[str, Any]:
        """Get system performance metrics."""
        try:
            # Database metrics
            total_knowledge = self.db.query(func.count(Knowledge.id)).scalar()
            total_users = self.db.query(func.count(User.id)).scalar()
            
            # Recent activity (last 24 hours)
            last_24h = datetime.utcnow() - timedelta(hours=24)
            recent_events = self.db.query(func.count(UserEvent.id)).filter(
                UserEvent.ts >= last_24h
            ).scalar()
            
            # Processing queue metrics (placeholder)
            queue_metrics = {
                "pending": 0,
                "processing": 0,
                "completed_24h": 0,
                "failed_24h": 0
            }
            
            return {
                "database": {
                    "total_knowledge_entries": total_knowledge,
                    "total_users": total_users,
                    "events_last_24h": recent_events
                },
                "queue": queue_metrics,
                "system": await self._get_system_performance_metrics()
            }
        except Exception as e:
            raise Exception(f"Failed to get system metrics: {str(e)}")

    async def _get_system_performance_metrics(self) -> Dict[str, Any]:
        """Get detailed system performance metrics."""
        try:
            # CPU metrics
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            # Network metrics
            network = psutil.net_io_counters()
            
            # Disk I/O metrics
            disk_io = psutil.disk_io_counters()
            
            return {
                "cpu": {
                    "count": cpu_count,
                    "frequency_mhz": cpu_freq.current if cpu_freq else None,
                    "percent": psutil.cpu_percent(interval=1)
                },
                "memory": {
                    "total_bytes": memory.total,
                    "available_bytes": memory.available,
                    "percent": memory.percent
                },
                "swap": {
                    "total_bytes": swap.total,
                    "used_bytes": swap.used,
                    "percent": swap.percent
                },
                "network": {
                    "bytes_sent": network.bytes_sent,
                    "bytes_recv": network.bytes_recv,
                    "packets_sent": network.packets_sent,
                    "packets_recv": network.packets_recv
                },
                "disk_io": {
                    "read_bytes": disk_io.read_bytes if disk_io else 0,
                    "write_bytes": disk_io.write_bytes if disk_io else 0,
                    "read_count": disk_io.read_count if disk_io else 0,
                    "write_count": disk_io.write_count if disk_io else 0
                }
            }
        except Exception as e:
            return {"error": str(e)}

    async def get_system_stats(self) -> Dict[str, Any]:
        """Get system usage statistics."""
        try:
            # User activity stats
            total_users = self.db.query(func.count(User.id)).scalar()
            active_users_24h = self.db.query(func.count(func.distinct(UserEvent.user_id))).filter(
                UserEvent.ts >= datetime.utcnow() - timedelta(hours=24)
            ).scalar()
            
            # Content stats
            total_knowledge = self.db.query(func.count(Knowledge.id)).scalar()
            knowledge_by_type = self.db.query(
                Knowledge.content_type,
                func.count(Knowledge.id)
            ).group_by(Knowledge.content_type).all()
            
            # Event stats (last 7 days)
            last_week = datetime.utcnow() - timedelta(days=7)
            event_stats = self.db.query(
                UserEvent.event_type,
                func.count(UserEvent.id)
            ).filter(
                UserEvent.ts >= last_week
            ).group_by(UserEvent.event_type).all()
            
            return {
                "users": {
                    "total": total_users,
                    "active_24h": active_users_24h
                },
                "content": {
                    "total_knowledge": total_knowledge,
                    "by_type": {item[0]: item[1] for item in knowledge_by_type}
                },
                "events_last_7_days": {item[0]: item[1] for item in event_stats}
            }
        except Exception as e:
            raise Exception(f"Failed to get system stats: {str(e)}")

    async def cleanup_old_data(self, days: int = 30) -> Dict[str, Any]:
        """Clean up old data (logs, temporary files, etc.)."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            cleanup_stats = {
                "events_deleted": 0,
                "temp_files_deleted": 0,
                "space_freed_mb": 0
            }
            
            # Clean up old events (keep critical events)
            old_events = self.db.query(UserEvent).filter(
                and_(
                    UserEvent.ts < cutoff_date,
                    ~UserEvent.event_type.in_(['user_login', 'knowledge_upload', 'quiz_complete'])
                )
            )
            
            events_count = old_events.count()
            old_events.delete()
            cleanup_stats["events_deleted"] = events_count
            
            # Clean up temporary files
            temp_dir = "/tmp"
            if os.path.exists(temp_dir):
                temp_files_deleted = 0
                space_freed = 0
                
                for filename in os.listdir(temp_dir):
                    file_path = os.path.join(temp_dir, filename)
                    if os.path.isfile(file_path):
                        try:
                            file_stat = os.stat(file_path)
                            if datetime.fromtimestamp(file_stat.st_mtime) < cutoff_date:
                                space_freed += file_stat.st_size
                                os.remove(file_path)
                                temp_files_deleted += 1
                        except OSError:
                            continue
                
                cleanup_stats["temp_files_deleted"] = temp_files_deleted
                cleanup_stats["space_freed_mb"] = round(space_freed / (1024 * 1024), 2)
            
            self.db.commit()
            
            return cleanup_stats
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Cleanup failed: {str(e)}")

    def _get_version(self) -> str:
        """Get application version."""
        try:
            # Try to read from version file or environment
            version_file = os.path.join(os.path.dirname(__file__), "..", "..", "VERSION")
            if os.path.exists(version_file):
                with open(version_file, "r") as f:
                    return f.read().strip()
            
            # Fallback to environment variable
            return os.environ.get("APP_VERSION", "unknown")
        except Exception:
            return "unknown"

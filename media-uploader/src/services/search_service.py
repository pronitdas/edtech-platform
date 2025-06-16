from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
from sqlalchemy.exc import SQLAlchemyError
import re

from models import Knowledge, Chapter

class SearchService:
    def __init__(self, db: Session):
        self.db = db

    async def search(
        self,
        query: str,
        user_id: int,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search across knowledge entries and chapters using full-text search."""
        
        try:
            # Clean and prepare search query
            clean_query = self._clean_search_query(query)
            
            if not clean_query:
                return {"items": [], "total": 0}

            try:
                # Use PostgreSQL full-text search if available
                results = await self._postgres_full_text_search(
                    clean_query, user_id, filters, limit, offset
                )
            except Exception:
                # Rollback any failed transaction
                self.db.rollback()
                # Fallback to basic text search
                results = await self._basic_text_search(
                    clean_query, user_id, filters, limit, offset
                )
            
            return results
        except SQLAlchemyError as e:
            # Rollback the transaction on any SQLAlchemy error
            self.db.rollback()
            raise e
        except Exception as e:
            # Rollback on any other error
            self.db.rollback()
            raise e

    async def _postgres_full_text_search(
        self,
        query: str,
        user_id: int,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Full-text search using PostgreSQL tsvector."""
        
        # Search in knowledge entries
        knowledge_query = """
            SELECT 
                'knowledge' as result_type,
                k.id,
                k.name as title,
                k.summary as content,
                k.content_type,
                k.created_at,
                ts_rank(to_tsvector('english', coalesce(k.name, '') || ' ' || coalesce(k.summary, '')), 
                        plainto_tsquery('english', :query)) as rank
            FROM knowledge k
            WHERE k.user_id = :user_id
                AND to_tsvector('english', coalesce(k.name, '') || ' ' || coalesce(k.summary, '')) 
                    @@ plainto_tsquery('english', :query)
        """
        
        # Search in chapters
        chapters_query = """
            SELECT 
                'chapter' as result_type,
                c.id,
                k.name || ' - Chapter ' || c.id as title,
                c.content,
                k.content_type,
                k.created_at,
                ts_rank(to_tsvector('english', coalesce(c.content, '')), 
                        plainto_tsquery('english', :query)) as rank
            FROM chapters_v1 c
            JOIN knowledge k ON c.knowledge_id = k.id
            WHERE k.user_id = :user_id
                AND to_tsvector('english', coalesce(c.content, '')) 
                    @@ plainto_tsquery('english', :query)
        """
        
        # Apply filters if provided
        filter_conditions = self._build_filter_conditions(filters)
        if filter_conditions:
            knowledge_query += f" AND {filter_conditions}"
            chapters_query += f" AND {filter_conditions}"
        
        # Combine queries and order by rank
        combined_query = f"""
            ({knowledge_query})
            UNION ALL
            ({chapters_query})
            ORDER BY rank DESC
            LIMIT :limit OFFSET :offset
        """
        
        # Get total count
        count_query = f"""
            SELECT COUNT(*) FROM (
                ({knowledge_query})
                UNION ALL
                ({chapters_query})
            ) AS combined_results
        """
        
        params = {
            "query": query,
            "user_id": user_id,
            "limit": limit,
            "offset": offset
        }
        
        # Execute search
        results = self.db.execute(text(combined_query), params).fetchall()
        total = self.db.execute(text(count_query), params).scalar()
        
        # Format results
        formatted_results = []
        for row in results:
            formatted_results.append({
                "type": row.result_type,
                "id": row.id,
                "title": row.title,
                "content": self._truncate_content(row.content, 200),
                "content_type": row.content_type,
                "created_at": row.created_at,
                "rank": float(row.rank)
            })
        
        return {
            "items": formatted_results,
            "total": total
        }

    async def _basic_text_search(
        self,
        query: str,
        user_id: int,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Fallback basic text search using LIKE queries."""
        
        search_terms = query.lower().split()
        results = []
        
        # Search in knowledge entries
        knowledge_base_query = self.db.query(Knowledge).filter(Knowledge.user_id == user_id)
        
        # Apply text search conditions
        knowledge_conditions = []
        for term in search_terms:
            knowledge_conditions.append(
                or_(
                    func.lower(Knowledge.name).contains(term),
                    func.lower(Knowledge.summary).contains(term)
                )
            )
        
        if knowledge_conditions:
            knowledge_query = knowledge_base_query.filter(and_(*knowledge_conditions))
        else:
            knowledge_query = knowledge_base_query
        
        # Apply additional filters
        knowledge_query = self._apply_filters(knowledge_query, filters, Knowledge)
        
        try:
            knowledge_results = knowledge_query.offset(offset).limit(limit).all()
        except SQLAlchemyError:
            # If there's a transaction error, rollback and retry
            self.db.rollback()
            knowledge_results = knowledge_query.offset(offset).limit(limit).all()
        
        for k in knowledge_results:
            results.append({
                "type": "knowledge",
                "id": k.id,
                "title": k.name,
                "content": self._truncate_content(k.summary, 200),
                "content_type": k.content_type,
                "created_at": k.created_at,
                "rank": self._calculate_relevance_score(query, k.name + " " + (k.summary or ""))
            })
        
        # Search in chapters if we have room for more results
        remaining_limit = limit - len(results)
        if remaining_limit > 0:
            chapter_query = self.db.query(Chapter).join(Knowledge).filter(
                Knowledge.user_id == user_id
            )
            
            # Apply text search to chapters
            chapter_conditions = []
            for term in search_terms:
                chapter_conditions.append(func.lower(Chapter.content).contains(term))
            
            if chapter_conditions:
                chapter_query = chapter_query.filter(and_(*chapter_conditions))
            
            try:
                chapter_results = chapter_query.limit(remaining_limit).all()
            except SQLAlchemyError:
                # If there's a transaction error, rollback and retry
                self.db.rollback()
                chapter_results = chapter_query.limit(remaining_limit).all()
            
            for c in chapter_results:
                knowledge = self.db.query(Knowledge).filter(Knowledge.id == c.knowledge_id).first()
                results.append({
                    "type": "chapter",
                    "id": c.id,
                    "title": f"{knowledge.name} - Chapter {c.id}",
                    "content": self._truncate_content(c.content, 200),
                    "content_type": knowledge.content_type,
                    "created_at": knowledge.created_at,
                    "rank": self._calculate_relevance_score(query, c.content or "")
                })
        
        # Sort by relevance
        results.sort(key=lambda x: x["rank"], reverse=True)
        
        # Calculate total (simplified)
        total = len(results)
        
        return {
            "items": results,
            "total": total
        }

    async def get_suggestions(self, partial_query: str, user_id: int, limit: int = 5) -> List[str]:
        """Get search suggestions based on partial query."""
        clean_query = self._clean_search_query(partial_query)
        
        if len(clean_query) < 2:
            return []
        
        suggestions = []
        
        # Get knowledge names that match
        knowledge_names = self.db.query(Knowledge.name).filter(
            and_(
                Knowledge.user_id == user_id,
                func.lower(Knowledge.name).contains(clean_query.lower())
            )
        ).limit(limit).all()
        
        suggestions.extend([name[0] for name in knowledge_names])
        
        # Get common terms from content if we need more suggestions
        if len(suggestions) < limit:
            # This is a simplified approach - in production you might want to use
            # a more sophisticated suggestion engine
            remaining = limit - len(suggestions)
            content_words = self.db.execute(text("""
                SELECT unnest(string_to_array(lower(name), ' ')) as word
                FROM knowledge 
                WHERE user_id = :user_id 
                    AND lower(name) LIKE :pattern
                GROUP BY word
                HAVING length(word) > 2
                ORDER BY count(*) DESC
                LIMIT :limit
            """), {
                "user_id": user_id,
                "pattern": f"%{clean_query.lower()}%",
                "limit": remaining
            }).fetchall()
            
            suggestions.extend([word[0] for word in content_words])
        
        return list(set(suggestions))[:limit]

    def _clean_search_query(self, query: str) -> str:
        """Clean and normalize search query."""
        if not query:
            return ""
        
        # Remove special characters, keep only alphanumeric and spaces
        cleaned = re.sub(r'[^\w\s]', ' ', query)
        # Normalize whitespace
        cleaned = ' '.join(cleaned.split())
        
        return cleaned.strip()

    def _build_filter_conditions(self, filters: Optional[Dict[str, Any]]) -> str:
        """Build SQL filter conditions from filters dict."""
        if not filters:
            return ""
        
        conditions = []
        
        if "content_type" in filters:
            conditions.append(f"k.content_type = '{filters['content_type']}'")
        
        if "date_from" in filters:
            conditions.append(f"k.created_at >= '{filters['date_from']}'")
        
        if "date_to" in filters:
            conditions.append(f"k.created_at <= '{filters['date_to']}'")
        
        return " AND ".join(conditions)

    def _apply_filters(self, query, filters: Optional[Dict[str, Any]], model_class):
        """Apply filters to SQLAlchemy query."""
        if not filters:
            return query
        
        if "content_type" in filters:
            query = query.filter(model_class.content_type == filters["content_type"])
        
        # Add more filter conditions as needed
        
        return query

    def _calculate_relevance_score(self, query: str, content: str) -> float:
        """Calculate a simple relevance score for basic text search."""
        if not content:
            return 0.0
        
        query_words = set(query.lower().split())
        content_words = set(content.lower().split())
        
        # Simple Jaccard similarity
        intersection = query_words.intersection(content_words)
        union = query_words.union(content_words)
        
        if not union:
            return 0.0
        
        return len(intersection) / len(union)

    def _truncate_content(self, content: str, max_length: int = 200) -> str:
        """Truncate content to specified length."""
        if not content:
            return ""
        
        if len(content) <= max_length:
            return content
        
        return content[:max_length] + "..."

import logging
import os
from typing import Dict, List, Any, Optional

import asyncio
from datetime import datetime
import json

from supabase import create_client, Client
from knowledge_graph import graph_service, GraphNode, GraphRelationship

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KnowledgeGraphSynchronizer:
    """Handles synchronization between Supabase and Neo4j knowledge graph"""
    
    def __init__(self):
        # Initialize Supabase client
        supabase_url = os.environ.get("SUPABASE_URL", "")
        supabase_key = os.environ.get("SUPABASE_KEY", "")
        
        self.connected = False
        self.supabase = None
        
        if not supabase_url or not supabase_key:
            logger.warning("SUPABASE_URL or SUPABASE_KEY not set - sync service will be disabled")
            return
            
        try:
            self.supabase: Client = create_client(supabase_url, supabase_key)
            self.connected = True
            logger.info("Successfully connected to Supabase for knowledge graph sync")
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {str(e)}")
            self.connected = False
        
    async def sync_knowledge(self, knowledge_id: int) -> Dict[str, Any]:
        """
        Synchronize a knowledge entity and all related data to Neo4j
        
        Args:
            knowledge_id: The ID of the knowledge to synchronize
            
        Returns:
            A dictionary with status and details of the sync operation
        """
        if not self.connected:
            return {"success": False, "error": "Supabase not connected - sync service disabled"}
            
        try:
            # Fetch knowledge details from Supabase
            response = self.supabase.table("knowledge").select(
                "id, name, seeded, status, filename, roleplay, difficulty_level, target_audience, prerequisites, summary"
            ).eq("id", knowledge_id).execute()
            
            if not response.data:
                logger.warning(f"Knowledge ID {knowledge_id} not found in Supabase")
                return {"success": False, "error": f"Knowledge ID {knowledge_id} not found"}
            
            knowledge = response.data[0]
            
            # Fetch chapters for this knowledge
            chapters_response = self.supabase.table("chapters_v1").select(
                "*"
            ).eq("k_id", knowledge_id).execute()
            
            chapters = chapters_response.data
            
            # Build the knowledge graph
            logger.info(f"Building knowledge graph for knowledge ID {knowledge_id}")
            
            # Create Knowledge node if it doesn't exist
            knowledge_node = self._find_or_create_knowledge_node(knowledge)
            
            # Process chapters to build the graph
            await self._process_chapters(knowledge_id, chapters, knowledge_node.id)
            
            # Process relationships between concepts
            await self._process_concept_relationships(knowledge_id)
            
            # Update last synced timestamp in Supabase
            self.supabase.table("knowledge").update({
                "graph_synced_at": datetime.utcnow().isoformat()
            }).eq("id", knowledge_id).execute()
            
            return {
                "success": True,
                "knowledge_id": knowledge_id,
                "message": f"Successfully synchronized knowledge graph for {knowledge['name']}",
                "nodes_created": len(chapters) + 1,  # +1 for knowledge node
            }
            
        except Exception as e:
            logger.error(f"Error synchronizing knowledge graph for ID {knowledge_id}: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _find_or_create_knowledge_node(self, knowledge: Dict[str, Any]) -> GraphNode:
        """Find or create a Knowledge node in Neo4j"""
        # Check if Knowledge node already exists
        knowledge_id = knowledge["id"]
        existing = graph_service.execute_query(
            "MATCH (k:Knowledge {knowledge_id: $knowledge_id}) RETURN k",
            {"knowledge_id": knowledge_id}
        )
        
        if existing.peek():
            logger.info(f"Knowledge node already exists for ID {knowledge_id}")
            node = existing.peek()["k"]
            return GraphNode(
                id=node["id"],
                labels=["Knowledge"],
                properties=dict(node)
            )
        
        # Create Knowledge node
        knowledge_node = GraphNode(
            labels=["Knowledge"],
            properties={
                "knowledge_id": knowledge_id,
                "name": knowledge.get("name", ""),
                "difficulty_level": knowledge.get("difficulty_level", "Intermediate"),
                "target_audience": knowledge.get("target_audience", ""),
                "prerequisites": knowledge.get("prerequisites", ""),
                "summary": knowledge.get("summary", ""),
                "created_at": datetime.utcnow().isoformat()
            }
        )
        
        return graph_service.create_node(knowledge_node)
    
    async def _process_chapters(self, knowledge_id: int, chapters: List[Dict[str, Any]], knowledge_node_id: str) -> None:
        """Process chapters and add them to the knowledge graph"""
        for chapter in chapters:
            # Create Chapter node
            chapter_id = chapter.get("id") or chapter.get("chapter_id")
            
            # Check if Chapter node already exists
            existing = graph_service.execute_query(
                "MATCH (c:Chapter {chapter_id: $chapter_id, knowledge_id: $knowledge_id}) RETURN c",
                {"chapter_id": chapter_id, "knowledge_id": knowledge_id}
            )
            
            chapter_node = None
            if existing.peek():
                # Update existing chapter node
                node = existing.peek()["c"]
                chapter_node = GraphNode(
                    id=node["id"],
                    labels=["Chapter"],
                    properties=dict(node)
                )
            else:
                # Create new chapter node
                chapter_node = graph_service.create_node(GraphNode(
                    labels=["Chapter"],
                    properties={
                        "chapter_id": chapter_id,
                        "knowledge_id": knowledge_id,
                        "title": chapter.get("chaptertitle", ""),
                        "subtitle": chapter.get("subtopic", ""),
                        "content": chapter.get("chapter", "")[:1000],  # Limit content length
                        "seq_num": chapter.get("id", 0),
                        "created_at": datetime.utcnow().isoformat()
                    }
                ))
                
                # Create relationship from Knowledge to Chapter
                graph_service.create_relationship(GraphRelationship(
                    start_node_id=knowledge_node_id,
                    end_node_id=chapter_node.id,
                    type="HAS_CHAPTER"
                ))
            
            # Process concepts within chapter content
            await self._process_chapter_concepts(chapter_node.id, knowledge_node_id, chapter["chapter"])
    
    async def _process_chapter_concepts(self, chapter_node_id: str, knowledge_node_id: str, content: str) -> None:
        """Extract and process concepts from chapter content"""
        concepts = graph_service._extract_concepts(content)
        
        for concept in concepts:
            # Check if concept already exists
            existing = graph_service.execute_query(
                "MATCH (c:Concept {name: $name}) RETURN c",
                {"name": concept}
            )
            
            concept_node = None
            if existing.peek():
                # Use existing concept
                node = existing.peek()["c"]
                concept_node = GraphNode(
                    id=node["id"],
                    labels=["Concept"],
                    properties=dict(node)
                )
            else:
                # Create new concept
                concept_node = graph_service.create_node(GraphNode(
                    labels=["Concept"],
                    properties={
                        "name": concept,
                        "created_at": datetime.utcnow().isoformat()
                    }
                ))
            
            # Create relationships (if they don't exist)
            
            # Chapter CONTAINS_CONCEPT relationship
            contains_exists = graph_service.execute_query(
                """
                MATCH (c:Chapter)-[r:CONTAINS_CONCEPT]->(concept:Concept)
                WHERE c.id = $chapter_id AND concept.id = $concept_id
                RETURN r
                """,
                {"chapter_id": chapter_node_id, "concept_id": concept_node.id}
            )
            
            if not contains_exists.peek():
                graph_service.create_relationship(GraphRelationship(
                    start_node_id=chapter_node_id,
                    end_node_id=concept_node.id,
                    type="CONTAINS_CONCEPT"
                ))
            
            # Knowledge TEACHES_CONCEPT relationship
            teaches_exists = graph_service.execute_query(
                """
                MATCH (k:Knowledge)-[r:TEACHES_CONCEPT]->(concept:Concept)
                WHERE k.id = $knowledge_id AND concept.id = $concept_id
                RETURN r
                """,
                {"knowledge_id": knowledge_node_id, "concept_id": concept_node.id}
            )
            
            if not teaches_exists.peek():
                graph_service.create_relationship(GraphRelationship(
                    start_node_id=knowledge_node_id,
                    end_node_id=concept_node.id,
                    type="TEACHES_CONCEPT"
                ))
    
    async def _process_concept_relationships(self, knowledge_id: int) -> None:
        """Process relationships between concepts based on co-occurrence in chapters"""
        # Find all concepts for this knowledge
        concepts_query = """
        MATCH (k:Knowledge {knowledge_id: $knowledge_id})-[:TEACHES_CONCEPT]->(c:Concept)
        RETURN c
        """
        
        concepts_result = graph_service.execute_query(concepts_query, {"knowledge_id": knowledge_id})
        concepts = [record["c"] for record in concepts_result]
        
        # Find concepts that co-occur in the same chapters
        for i in range(len(concepts)):
            for j in range(i + 1, len(concepts)):
                concept1 = concepts[i]
                concept2 = concepts[j]
                
                # Check if they co-occur in any chapter
                cooccurrence_query = """
                MATCH (chap:Chapter)-[:CONTAINS_CONCEPT]->(c1:Concept)
                WHERE c1.id = $concept1_id
                MATCH (chap)-[:CONTAINS_CONCEPT]->(c2:Concept)
                WHERE c2.id = $concept2_id
                RETURN count(chap) as co_count
                """
                
                co_result = graph_service.execute_query(
                    cooccurrence_query,
                    {"concept1_id": concept1["id"], "concept2_id": concept2["id"]}
                )
                
                co_count = co_result.single()["co_count"]
                
                if co_count > 0:
                    # Create RELATED_TO relationship if it doesn't exist
                    related_exists = graph_service.execute_query(
                        """
                        MATCH (c1:Concept)-[r:RELATED_TO]-(c2:Concept)
                        WHERE c1.id = $concept1_id AND c2.id = $concept2_id
                        RETURN r
                        """,
                        {"concept1_id": concept1["id"], "concept2_id": concept2["id"]}
                    )
                    
                    if not related_exists.peek():
                        graph_service.create_relationship(GraphRelationship(
                            start_node_id=concept1["id"],
                            end_node_id=concept2["id"],
                            type="RELATED_TO",
                            properties={"weight": co_count, "co_occurrences": co_count}
                        ))
    
    async def sync_all_knowledge(self) -> Dict[str, Any]:
        """Synchronize all knowledge entities to Neo4j"""
        try:
            # Ensure schema constraints are in place
            graph_service.create_schema_constraints()
            
            # Get all knowledge entities
            response = self.supabase.table("knowledge").select("id").execute()
            
            if not response.data:
                return {"success": True, "message": "No knowledge entities found to sync"}
            
            knowledge_ids = [k["id"] for k in response.data]
            logger.info(f"Syncing {len(knowledge_ids)} knowledge entities")
            
            results = []
            for knowledge_id in knowledge_ids:
                result = await self.sync_knowledge(knowledge_id)
                results.append(result)
            
            success_count = sum(1 for r in results if r.get("success", False))
            
            return {
                "success": True,
                "message": f"Synchronized {success_count} of {len(knowledge_ids)} knowledge entities",
                "details": results
            }
            
        except Exception as e:
            logger.error(f"Error synchronizing all knowledge entities: {str(e)}")
            return {"success": False, "error": str(e)}

# Create singleton instance
sync_service = KnowledgeGraphSynchronizer() 
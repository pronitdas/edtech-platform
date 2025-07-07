import logging
import os
from typing import Dict, List, Any, Optional

import asyncio
from datetime import datetime
import json

import httpx
from knowledge_graph import graph_service, GraphNode, GraphRelationship

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KnowledgeGraphSynchronizer:
    """Handles synchronization between Supabase and Neo4j knowledge graph"""
    
    def __init__(self):
        self.api_base_url = os.environ.get("API_BASE_URL", "http://localhost:8000")
        self.client = httpx.AsyncClient(base_url=self.api_base_url)
        logger.info(f"KnowledgeGraphSynchronizer initialized with API_BASE_URL: {self.api_base_url}")
        
    async def sync_knowledge(self, knowledge_id: int) -> Dict[str, Any]:
        """
        Synchronize a knowledge entity and all related data to Neo4j
        
        Args:
            knowledge_id: The ID of the knowledge to synchronize
            
        Returns:
            A dictionary with status and details of the sync operation
        """
        try:
            # Fetch knowledge details from FastAPI backend
            response = await self.client.get(f"/knowledge/{knowledge_id}")
            response.raise_for_status()
            knowledge = response.json()

            if not knowledge:
                logger.warning(f"Knowledge ID {knowledge_id} not found in FastAPI backend")
                return {"success": False, "error": f"Knowledge ID {knowledge_id} not found"}

            # Fetch chapters for this knowledge
            chapters_response = await self.client.get(f"/chapters/{knowledge_id}")
            chapters_response.raise_for_status()
            chapters = chapters_response.json()

            # Build the knowledge graph
            logger.info(f"Building knowledge graph for knowledge ID {knowledge_id}")

            # Create Knowledge node if it doesn't exist
            knowledge_node = self._find_or_create_knowledge_node(knowledge)

            # Process chapters to build the graph
            await self._process_chapters(knowledge_id, chapters, knowledge_node.id)

            # Process relationships between concepts
            await self._process_concept_relationships(knowledge_id)

            # No longer updating Supabase, so remove this part
            # self.supabase.table("knowledge").update({
            #     "graph_synced_at": datetime.utcnow().isoformat()
            # }).eq("id", knowledge_id).execute()

            return {
                "success": True,
                "knowledge_id": knowledge_id,
                "message": f"Successfully synchronized knowledge graph for {knowledge['name']}",
                "nodes_created": len(chapters) + 1,  # +1 for knowledge node
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error synchronizing knowledge graph for ID {knowledge_id}: {e.response.status_code} - {e.response.text}")
            return {"success": False, "error": f"HTTP error: {e.response.status_code} - {e.response.text}"}
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

        if existing and len(existing) > 0:
            logger.info(f"Knowledge node already exists for ID {knowledge_id}")
            node = existing[0]["k"]
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
            if existing and len(existing) > 0:
                # Update existing chapter node
                node = existing[0]["c"]
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
            if existing and len(existing) > 0:
                # Use existing concept
                node = existing[0]["c"]
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

            if not contains_exists or len(contains_exists) == 0:
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

            if not teaches_exists or len(teaches_exists) == 0:
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

                    if not related_exists or len(related_exists) == 0:
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
            response = await self.client.get("/knowledge/")
            response.raise_for_status()
            knowledge_entities = response.json()

            if not knowledge_entities:
                return {"success": True, "message": "No knowledge entities found to sync"}

            knowledge_ids = [k["id"] for k in knowledge_entities]
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

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error synchronizing all knowledge entities: {e.response.status_code} - {e.response.text}")
            return {"success": False, "error": f"HTTP error: {e.response.status_code} - {e.response.text}"}
        except Exception as e:
            logger.error(f"Error synchronizing all knowledge entities: {str(e)}")
            return {"success": False, "error": str(e)}

# Create singleton instance
sync_service = KnowledgeGraphSynchronizer() 
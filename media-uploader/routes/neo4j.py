from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from knowledge_graph import Neo4jGraphService, GraphNode, GraphRelationship, GraphQueryResult
from utils.cache import cached
from routes.auth import has_role

router = APIRouter()

def get_neo4j_service() -> Neo4jGraphService:
    """Dependency to get Neo4jGraphService instance."""
    return Neo4jGraphService()

@router.get(
    "/neo4j/node/{node_id}",
    response_model=GraphNode,
    summary="Get Node by ID",
    description="Retrieve a single node from the Neo4j graph database by its ID.",
    tags=["Neo4j Graph"]
)
@cached(ttl=300)
async def get_node(node_id: str, neo4j_service: Neo4jGraphService = Depends(get_neo4j_service)):
    node = neo4j_service.get_node_by_id(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node

@router.get(
    "/neo4j/related/{node_id}",
    response_model=GraphQueryResult,
    summary="Get Related Nodes",
    description="Retrieve nodes and relationships connected to a given node ID, with optional filtering by relationship type and direction.",
    tags=["Neo4j Graph"]
)
@cached(ttl=300)
async def get_related_nodes(
    node_id: str,
    relationship_type: str = None,
    direction: str = "BOTH",
    neo4j_service: Neo4jGraphService = Depends(get_neo4j_service)
):
    try:
        result = neo4j_service.get_related_nodes(node_id, relationship_type, direction)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "/neo4j/knowledge_graph/{knowledge_id}",
    response_model=GraphQueryResult,
    summary="Get Knowledge Graph for Course",
    description="Retrieve the entire knowledge graph (nodes and relationships) associated with a specific knowledge ID (e.g., a course or document).",
    tags=["Neo4j Graph"]
)
@cached(ttl=300)
async def get_knowledge_graph(
    knowledge_id: int,
    neo4j_service: Neo4jGraphService = Depends(get_neo4j_service)
):
    result = neo4j_service.get_knowledge_graph(knowledge_id)
    return result

@router.post(
    "/neo4j/clear_cache",
    summary="Clear Neo4j Cache",
    description="Clears the Redis cache for Neo4j related endpoints.",
    tags=["Neo4j Graph"],
    dependencies=[Depends(has_role(["admin"]))]
)
async def clear_neo4j_cache():
    try:
        from config import redis_client
        await redis_client.flushdb()
        return {"message": "Neo4j cache cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

@router.post(
    "/neo4j/build_graph",
    summary="Build Knowledge Graph from Chapters",
    description="Builds or updates a knowledge graph in Neo4j based on provided knowledge ID and chapter data. This is typically used after content processing.",
    tags=["Neo4j Graph"]
)
async def build_knowledge_graph(
    data: Dict[str, Any],
    neo4j_service: Neo4jGraphService = Depends(get_neo4j_service)
):
    try:
        knowledge_id = data.get("knowledge_id")
        chapters = data.get("chapters", [])
        
        if not knowledge_id:
            raise HTTPException(status_code=400, detail="knowledge_id is required")
        if not chapters:
            raise HTTPException(status_code=400, detail="chapters are required")
            
        neo4j_service.build_knowledge_graph(knowledge_id, chapters)
        return {"message": "Knowledge graph built successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build knowledge graph: {str(e)}")

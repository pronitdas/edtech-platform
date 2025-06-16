#!/usr/bin/env python3
"""
Neo4j Database Seeder

This script inserts test data into the Neo4j database for development and testing.
It uses the official Neo4j Python driver and creates deterministic test records that
align with the PostgreSQL test data.

Example usage:
    python seed_neo4j.py
"""

import logging
from typing import Dict, Any
from knowledge_graph import Neo4jGraphService, GraphNode, GraphRelationship

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_nodes(graph: Neo4jGraphService) -> Dict[str, str]:
    """Create test nodes in Neo4j and return a mapping of logical IDs to Neo4j node IDs."""
    
    # Track created node IDs
    node_ids = {}
    
    # Create Knowledge nodes
    knowledge_nodes = [
        GraphNode(
            labels=["Knowledge"],
            properties={
                "knowledge_id": 1,
                "title": "Introduction to FastAPI",
                "difficulty_level": "intermediate",
                "content_type": "video"
            }
        ),
        GraphNode(
            labels=["Knowledge"],
            properties={
                "knowledge_id": 2,
                "title": "Python for Beginners",
                "difficulty_level": "beginner",
                "content_type": "document"
            }
        )
    ]
    
    # Create knowledge nodes and store their IDs
    for node in knowledge_nodes:
        created = graph.create_node(node)
        node_ids[f"knowledge_{node.properties['knowledge_id']}"] = created.id
    
    # Create Concept nodes
    concept_nodes = [
        GraphNode(
            labels=["Concept"],
            properties={
                "name": "FastAPI Framework",
                "category": "Web Development",
                "difficulty": "intermediate"
            }
        ),
        GraphNode(
            labels=["Concept"],
            properties={
                "name": "Python Basics",
                "category": "Programming",
                "difficulty": "beginner"
            }
        ),
        GraphNode(
            labels=["Concept"],
            properties={
                "name": "REST APIs",
                "category": "Web Development",
                "difficulty": "intermediate"
            }
        )
    ]
    
    # Create concept nodes and store their IDs
    for node in concept_nodes:
        created = graph.create_node(node)
        node_ids[f"concept_{node.properties['name']}"] = created.id
    
    # Create Chapter nodes
    chapter_nodes = [
        GraphNode(
            labels=["Chapter"],
            properties={
                "id": "ch1-fastapi-intro",
                "title": "Introduction to FastAPI",
                "order": 1
            }
        ),
        GraphNode(
            labels=["Chapter"],
            properties={
                "id": "ch2-fastapi-setup",
                "title": "Setting up FastAPI",
                "order": 2
            }
        ),
        GraphNode(
            labels=["Chapter"],
            properties={
                "id": "ch1-python-basics",
                "title": "Python Basics",
                "order": 1
            }
        )
    ]
    
    # Create chapter nodes and store their IDs
    for node in chapter_nodes:
        created = graph.create_node(node)
        node_ids[f"chapter_{node.properties['id']}"] = created.id
    
    return node_ids

def create_test_relationships(graph: Neo4jGraphService, node_ids: Dict[str, str]):
    """Create test relationships between nodes."""
    
    relationships = [
        # Connect Knowledge to Chapters
        GraphRelationship(
            start_node_id=node_ids["knowledge_1"],
            end_node_id=node_ids["chapter_ch1-fastapi-intro"],
            type="HAS_CHAPTER",
            properties={"order": 1}
        ),
        GraphRelationship(
            start_node_id=node_ids["knowledge_1"],
            end_node_id=node_ids["chapter_ch2-fastapi-setup"],
            type="HAS_CHAPTER",
            properties={"order": 2}
        ),
        GraphRelationship(
            start_node_id=node_ids["knowledge_2"],
            end_node_id=node_ids["chapter_ch1-python-basics"],
            type="HAS_CHAPTER",
            properties={"order": 1}
        ),
        
        # Connect Knowledge to Concepts
        GraphRelationship(
            start_node_id=node_ids["knowledge_1"],
            end_node_id=node_ids["concept_FastAPI Framework"],
            type="COVERS_CONCEPT"
        ),
        GraphRelationship(
            start_node_id=node_ids["knowledge_1"],
            end_node_id=node_ids["concept_REST APIs"],
            type="COVERS_CONCEPT"
        ),
        GraphRelationship(
            start_node_id=node_ids["knowledge_2"],
            end_node_id=node_ids["concept_Python Basics"],
            type="COVERS_CONCEPT"
        ),
        
        # Connect Concepts to other Concepts (prerequisites)
        GraphRelationship(
            start_node_id=node_ids["concept_FastAPI Framework"],
            end_node_id=node_ids["concept_Python Basics"],
            type="REQUIRES",
            properties={"strength": 0.8}
        ),
        GraphRelationship(
            start_node_id=node_ids["concept_REST APIs"],
            end_node_id=node_ids["concept_Python Basics"],
            type="REQUIRES",
            properties={"strength": 0.6}
        )
    ]
    
    # Create all relationships
    for rel in relationships:
        graph.create_relationship(rel)

def main():
    """Main function to seed the database."""
    try:
        # Initialize Neo4j connection
        graph = Neo4jGraphService()
        
        # Create schema constraints
        graph.create_schema_constraints()
        
        # Create test nodes
        logger.info("Creating test nodes...")
        node_ids = create_test_nodes(graph)
        
        # Create relationships
        logger.info("Creating relationships between nodes...")
        create_test_relationships(graph, node_ids)
        
        logger.info("Successfully seeded Neo4j database with test data")
        
        # Close connection
        graph.close()
        
    except Exception as e:
        logger.error(f"Error seeding Neo4j database: {str(e)}")
        raise

if __name__ == "__main__":
    main()
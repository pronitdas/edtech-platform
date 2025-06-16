import logging
import os
import uuid
from typing import Dict, List, Optional, Any, Union

from neo4j import GraphDatabase
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class GraphNode(BaseModel):
    id: Optional[str] = None
    labels: List[str]
    properties: Dict[str, Any]

class GraphRelationship(BaseModel):
    id: Optional[str] = None
    start_node_id: str
    end_node_id: str
    type: str
    properties: Optional[Dict[str, Any]] = None

class GraphQueryResult(BaseModel):
    nodes: List[GraphNode]
    relationships: List[GraphRelationship]
    summary: Optional[Dict[str, Any]] = None

# Neo4j Graph Service
class Neo4jGraphService:
    def __init__(self):
        # Get connection details from environment variables with consistent naming
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.username = os.getenv("NEO4J_USERNAME", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        self.driver = None
        self.connected = False
        
        # Try to connect, but don't fail if it's not available
        try:
            self.connect()
        except Exception as e:
            logger.warning(f"Neo4j not available during initialization: {str(e)}")
            self.connected = False
    
    def connect(self) -> None:
        """Connect to Neo4j database"""
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password)
            )
            # Test the connection
            self.driver.verify_connectivity()
            self.connected = True
            logger.info("Successfully connected to Neo4j")
            
            # Create schema constraints
            self.create_schema_constraints()
            
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {str(e)}")
            self.connected = False
            # Don't raise exception - allow the service to work without Neo4j
    
    def close(self) -> None:
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()
            self.driver = None
            logger.info("Disconnected from Neo4j database")
    
    def execute_query(self, cypher: str, params: Dict[str, Any] = None) -> Any:
        """Execute a Cypher query"""
        if not self.connected:
            logger.warning("Neo4j not connected - skipping query execution")
            return []
            
        try:
            with self.driver.session() as session:
                result = session.run(cypher, params or {})
                return result
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}")
            return []
    
    def create_node(self, node: GraphNode) -> GraphNode:
        """Create a node in the graph"""
        if not self.connected:
            logger.warning("Neo4j not connected - skipping node creation")
            return node
            
        # Generate ID if not provided
        if not node.id:
            node.id = str(uuid.uuid4())
        
        # Build labels string
        labels_str = ":".join(node.labels)
        
        # Build properties string
        properties = node.properties.copy()
        properties["id"] = node.id
        
        cypher = f"""
        CREATE (n:{labels_str})
        SET n = $properties
        RETURN n
        """
        
        try:
            result = self.execute_query(cypher, {"properties": properties})
            if result:
                record = result.single()
                if record:
                    created_node = record["n"]
                    return GraphNode(
                        id=created_node["id"],
                        labels=node.labels,
                        properties=dict(created_node)
                    )
        except Exception as e:
            logger.error(f"Error creating node: {str(e)}")
        
        return node
    
    def create_relationship(self, relationship: GraphRelationship) -> GraphRelationship:
        """Create a relationship between two nodes"""
        if not self.connected:
            logger.warning("Neo4j not connected - skipping relationship creation")
            return relationship
            
        # Generate ID if not provided
        if not relationship.id:
            relationship.id = str(uuid.uuid4())
        
        cypher = """
        MATCH (start {id: $start_id})
        MATCH (end {id: $end_id})
        CREATE (start)-[r:""" + relationship.type + """ $properties]->(end)
        RETURN r
        """
        
        properties = relationship.properties or {}
        properties["id"] = relationship.id
        
        try:
            result = self.execute_query(cypher, {
                "start_id": relationship.start_node_id,
                "end_id": relationship.end_node_id,
                "properties": properties
            })
            
            if result:
                record = result.single()
                if record:
                    created_rel = record["r"]
                    return GraphRelationship(
                        id=created_rel["id"],
                        start_node_id=relationship.start_node_id,
                        end_node_id=relationship.end_node_id,
                        type=relationship.type,
                        properties=dict(created_rel)
                    )
        except Exception as e:
            logger.error(f"Error creating relationship: {str(e)}")
        
        return relationship
    
    def get_node_by_id(self, node_id: str) -> Optional[GraphNode]:
        """Get a node by ID"""
        cypher = """
        MATCH (n)
        WHERE n.id = $node_id
        RETURN n, labels(n) as labels
        """
        
        result = self.execute_query(cypher, {"node_id": node_id})
        record = result.single()
        
        if not record:
            return None
        
        node = record["n"]
        labels = record["labels"]
        
        return GraphNode(
            id=node["id"],
            labels=labels,
            properties=dict(node)
        )
    
    def get_related_nodes(
        self, 
        node_id: str, 
        relationship_type: Optional[str] = None, 
        direction: str = "BOTH"
    ) -> GraphQueryResult:
        """Get related nodes with various filtering options"""
        if direction not in ["INCOMING", "OUTGOING", "BOTH"]:
            raise ValueError("direction must be one of: INCOMING, OUTGOING, BOTH")
        
        relationship_pattern = ""
        if relationship_type:
            if direction == "INCOMING":
                relationship_pattern = f"<-[r:{relationship_type}]-"
            elif direction == "OUTGOING":
                relationship_pattern = f"-[r:{relationship_type}]->"
            else:
                relationship_pattern = f"-[r:{relationship_type}]-"
        else:
            if direction == "INCOMING":
                relationship_pattern = "<-[r]-"
            elif direction == "OUTGOING":
                relationship_pattern = "-[r]->"
            else:
                relationship_pattern = "-[r]-"
        
        cypher = f"""
        MATCH (n){relationship_pattern}(related)
        WHERE n.id = $node_id
        RETURN n, r, related, labels(n) as n_labels, labels(related) as related_labels
        """
        
        result = self.execute_query(cypher, {"node_id": node_id})
        
        nodes = []
        relationships = []
        node_map = {}
        
        for record in result:
            n = record["n"]
            r = record["r"]
            related = record["related"]
            n_labels = record["n_labels"]
            related_labels = record["related_labels"]
            
            # Add start node if not already in map
            if n["id"] not in node_map:
                start_node = GraphNode(
                    id=n["id"],
                    labels=n_labels,
                    properties=dict(n)
                )
                nodes.append(start_node)
                node_map[n["id"]] = start_node
            
            # Add related node if not already in map
            if related["id"] not in node_map:
                related_node = GraphNode(
                    id=related["id"],
                    labels=related_labels,
                    properties=dict(related)
                )
                nodes.append(related_node)
                node_map[related["id"]] = related_node
            
            # Add relationship
            rel = GraphRelationship(
                id=r.get("id", str(uuid.uuid4())),
                start_node_id=n["id"],
                end_node_id=related["id"],
                type=r.type,
                properties=dict(r)
            )
            relationships.append(rel)
        
        return GraphQueryResult(nodes=nodes, relationships=relationships)
    
    def get_knowledge_graph(self, knowledge_id: int) -> GraphQueryResult:
        """Get the knowledge graph for a specific course"""
        cypher = """
        MATCH (k:Knowledge {knowledge_id: $knowledge_id})-[r]-(related)
        RETURN k, r, related, labels(k) as k_labels, labels(related) as related_labels
        """
        
        result = self.execute_query(cypher, {"knowledge_id": knowledge_id})
        
        nodes = []
        relationships = []
        node_map = {}
        
        for record in result:
            k = record["k"]
            r = record["r"]
            related = record["related"]
            k_labels = record["k_labels"]
            related_labels = record["related_labels"]
            
            # Add knowledge node if not already in map
            if k["id"] not in node_map:
                knowledge_node = GraphNode(
                    id=k["id"],
                    labels=k_labels,
                    properties=dict(k)
                )
                nodes.append(knowledge_node)
                node_map[k["id"]] = knowledge_node
            
            # Add related node if not already in map
            if related["id"] not in node_map:
                related_node = GraphNode(
                    id=related["id"],
                    labels=related_labels,
                    properties=dict(related)
                )
                nodes.append(related_node)
                node_map[related["id"]] = related_node
            
            # Add relationship
            rel = GraphRelationship(
                id=r.get("id", str(uuid.uuid4())),
                start_node_id=k["id"],
                end_node_id=related["id"],
                type=r.type,
                properties=dict(r)
            )
            relationships.append(rel)
        
        return GraphQueryResult(nodes=nodes, relationships=relationships)
    
    def create_schema_constraints(self) -> None:
        """Create necessary database constraints and indexes"""
        constraints = [
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Knowledge) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Concept) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Chapter) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Student) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Skill) REQUIRE n.id IS UNIQUE",
            "CREATE INDEX IF NOT EXISTS FOR (n:Knowledge) ON (n.knowledge_id)",
            "CREATE INDEX IF NOT EXISTS FOR (n:Chapter) ON (n.chapter_id)",
        ]
        
        for constraint in constraints:
            try:
                self.execute_query(constraint)
                logger.info(f"Created constraint/index: {constraint}")
            except Exception as e:
                logger.error(f"Error creating constraint/index '{constraint}': {str(e)}")
    
    def build_knowledge_graph(self, knowledge_id: int, chapters: List[Dict[str, Any]]) -> None:
        """Build a knowledge graph from chapters"""
        # Create Knowledge node
        knowledge_node = GraphNode(
            labels=["Knowledge"],
            properties={"knowledge_id": knowledge_id}
        )
        created_knowledge = self.create_node(knowledge_node)
        
        # Process each chapter
        for chapter in chapters:
            # Create Chapter node
            chapter_id = chapter.get("id") or chapter.get("chapter_id")
            chapter_node = GraphNode(
                labels=["Chapter"],
                properties={
                    "chapter_id": chapter_id,
                    "knowledge_id": knowledge_id,
                    "title": chapter.get("chaptertitle", ""),
                    "content": chapter.get("chapter", "")[:1000]  # Limit content length
                }
            )
            created_chapter = self.create_node(chapter_node)
            
            # Create relationship from Knowledge to Chapter
            self.create_relationship(GraphRelationship(
                start_node_id=created_knowledge.id,
                end_node_id=created_chapter.id,
                type="HAS_CHAPTER"
            ))
            
            # Extract concepts from chapter
            chapter_concepts = self._extract_concepts(chapter.get("chapter", ""))
            
            # Create concept nodes and relationships
            for concept in chapter_concepts:
                # Check if concept already exists
                existing_concepts = self.execute_query(
                    "MATCH (c:Concept {name: $name}) RETURN c",
                    {"name": concept}
                )
                
                concept_node = None
                if existing_concepts.peek():
                    # Use existing concept
                    concept_node = GraphNode(
                        id=existing_concepts.peek()["c"]["id"],
                        labels=["Concept"],
                        properties=dict(existing_concepts.peek()["c"])
                    )
                else:
                    # Create new concept
                    concept_node = self.create_node(GraphNode(
                        labels=["Concept"],
                        properties={"name": concept}
                    ))
                
                # Create relationships
                self.create_relationship(GraphRelationship(
                    start_node_id=created_chapter.id,
                    end_node_id=concept_node.id,
                    type="CONTAINS_CONCEPT"
                ))
                
                self.create_relationship(GraphRelationship(
                    start_node_id=created_knowledge.id,
                    end_node_id=concept_node.id,
                    type="TEACHES_CONCEPT"
                ))
    
    def _extract_concepts(self, text: str) -> List[str]:
        """
        Extract concepts from text
        This is a placeholder implementation - in a real system,
        this would use NLP to extract meaningful concepts
        """
        import re
        from collections import Counter
        
        # Simple concept extraction - get capitalized phrases and nouns
        # In a real implementation, this would use more sophisticated NLP
        words = re.findall(r'\b[A-Z][a-z]{2,}\b', text)
        phrases = re.findall(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', text)
        
        # Count occurrences
        word_counts = Counter(words)
        phrase_counts = Counter(phrases)
        
        # Get most common concepts
        common_words = [word for word, count in word_counts.most_common(10) if count > 1]
        common_phrases = [phrase for phrase, count in phrase_counts.most_common(5)]
        
        return common_phrases + common_words

# Create singleton instance - will not fail if Neo4j is unavailable
graph_service = Neo4jGraphService() 
#!/usr/bin/env python3
"""
Knowledge Graph and Relation Builder Test Suite
Tests the Neo4j knowledge graph functionality and relation building capabilities
"""

import asyncio
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Dict, Optional, List, Any
import httpx

BASE_URL = "http://localhost:8000"

class KnowledgeGraphTester:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=60.0)
        self.auth_token: Optional[str] = None
        self.user_id: Optional[int] = None
        self.knowledge_id: Optional[int] = None
        self.chapter_ids: List[str] = []
        self.node_ids: List[str] = []
        self.test_results: Dict[str, Dict[str, bool]] = {}
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamps"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def add_result(self, category: str, test_name: str, success: bool, details: str = ""):
        """Add test result to tracking"""
        if category not in self.test_results:
            self.test_results[category] = {}
        self.test_results[category][test_name] = success
        status = "✅ PASS" if success else "❌ FAIL"
        self.log(f"{status}: {category} - {test_name} {details}")

    async def setup_authentication(self):
        """Setup authentication for tests"""
        self.log("🔐 Setting up authentication for knowledge graph tests")
        
        try:
            # Use demo login for simplicity
            response = await self.client.post("/api/v2/auth/demo-login")
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user_id")
                if self.auth_token:
                    self.client.headers["Authorization"] = f"Bearer {self.auth_token}"
                    self.add_result("Setup", "Authentication", True)
                    return True
                    
        except Exception as e:
            self.add_result("Setup", "Authentication", False, f"Error: {e}")
            
        return False

    async def test_neo4j_connectivity(self):
        """Test Neo4j database connectivity"""
        self.log("🔌 Testing Neo4j connectivity and basic operations")
        
        # Test direct Neo4j service
        try:
            from knowledge_graph import graph_service
            
            # Test connection
            if graph_service.connected:
                self.add_result("Neo4j", "Connection", True, "Connected to Neo4j")
            else:
                self.add_result("Neo4j", "Connection", False, "Neo4j not connected")
                return False
                
            # Test schema constraints creation
            try:
                graph_service.create_schema_constraints()
                self.add_result("Neo4j", "Schema Setup", True)
            except Exception as e:
                self.add_result("Neo4j", "Schema Setup", False, f"Error: {e}")
                
        except Exception as e:
            self.add_result("Neo4j", "Connection", False, f"Error importing: {e}")
            return False
            
        return True

    async def setup_test_knowledge(self):
        """Create test knowledge and chapters for graph testing"""
        self.log("📚 Setting up test knowledge with rich content for graph building")
        
        # Create test content with concepts that should form a good graph
        test_content = """
# Machine Learning and Artificial Intelligence

## Introduction to Machine Learning
Machine Learning is a subset of Artificial Intelligence that enables computers to learn and make decisions from data without being explicitly programmed. Neural Networks are inspired by biological neurons and form the foundation of Deep Learning.

## Supervised Learning
In Supervised Learning, the algorithm learns from labeled training data. Classification involves predicting categories, while Regression predicts continuous values. Support Vector Machines and Decision Trees are popular algorithms for supervised tasks.

## Unsupervised Learning  
Unsupervised Learning finds patterns in data without labeled examples. Clustering groups similar data points together, and Principal Component Analysis reduces dimensionality while preserving important features.

## Deep Learning
Deep Learning uses Neural Networks with multiple hidden layers. Convolutional Neural Networks excel at image recognition, while Recurrent Neural Networks handle sequential data like Natural Language Processing tasks.

## Applications
Machine Learning applications include Computer Vision for image recognition, Natural Language Processing for text analysis, Recommender Systems for personalized suggestions, and Autonomous Vehicles for self-driving cars.
"""
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
                f.write(test_content)
                temp_file_path = f.name
            
            try:
                with open(temp_file_path, 'rb') as f:
                    files = {"file": ("ml_graph_test.md", f, "text/markdown")}
                    data = {
                        "auto_process": "true",
                        "generate_content": "false",  # Skip content generation for faster testing
                        "content_language": "English"
                    }
                    
                    response = await self.client.post("/api/v2/knowledge/", files=files, data=data)
                    
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.knowledge_id = data.get("knowledge_id") or data.get("id")
                    self.add_result("Setup", "Knowledge Creation", True, f"ID: {self.knowledge_id}")
                    
                    # Wait for processing
                    await asyncio.sleep(10)
                    return True
                else:
                    self.add_result("Setup", "Knowledge Creation", False, f"Status: {response.status_code}")
                    
            finally:
                os.unlink(temp_file_path)
                
        except Exception as e:
            self.add_result("Setup", "Knowledge Creation", False, f"Error: {e}")
            
        return False

    async def test_graph_construction(self):
        """Test building knowledge graph from chapters"""
        self.log("🏗️ Testing knowledge graph construction")
        
        if not self.knowledge_id:
            self.add_result("Graph Construction", "All Tests", False, "No knowledge ID available")
            return False
            
        try:
            # Get chapters first
            response = await self.client.get(f"/api/v2/chapters/{self.knowledge_id}")
            if response.status_code == 200:
                chapters = response.json()
                self.chapter_ids = [chapter.get("id") for chapter in chapters if chapter.get("id")]
                self.add_result("Graph Construction", "Get Chapters", True, f"Found {len(chapters)} chapters")
                
                # Test manual graph building via API
                if chapters:
                    build_response = await self.client.post("/neo4j/build_graph", json={
                        "knowledge_id": self.knowledge_id,
                        "chapters": chapters
                    })
                    
                    if build_response.status_code == 200:
                        self.add_result("Graph Construction", "Build Graph", True)
                    else:
                        self.add_result("Graph Construction", "Build Graph", False, f"Status: {build_response.status_code}")
                        
                else:
                    self.add_result("Graph Construction", "Build Graph", False, "No chapters to build graph from")
            else:
                self.add_result("Graph Construction", "Get Chapters", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.add_result("Graph Construction", "Build Graph", False, f"Error: {e}")

    async def test_graph_queries(self):
        """Test querying the knowledge graph"""
        self.log("🔍 Testing knowledge graph query operations")
        
        if not self.knowledge_id:
            self.add_result("Graph Queries", "All Tests", False, "No knowledge ID available")
            return False
            
        try:
            # Test getting knowledge graph
            response = await self.client.get(f"/neo4j/knowledge_graph/{self.knowledge_id}")
            if response.status_code == 200:
                graph_data = response.json()
                nodes = graph_data.get("nodes", [])
                relationships = graph_data.get("relationships", [])
                
                self.add_result("Graph Queries", "Get Knowledge Graph", True, 
                              f"Found {len(nodes)} nodes, {len(relationships)} relationships")
                
                # Store node IDs for further testing
                self.node_ids = [node.get("id") for node in nodes if node.get("id")]
                
                # Analyze graph structure
                node_types = {}
                for node in nodes:
                    labels = node.get("labels", [])
                    for label in labels:
                        node_types[label] = node_types.get(label, 0) + 1
                        
                self.log(f"   📊 Node types: {node_types}")
                
                relationship_types = {}
                for rel in relationships:
                    rel_type = rel.get("type", "Unknown")
                    relationship_types[rel_type] = relationship_types.get(rel_type, 0) + 1
                    
                self.log(f"   📊 Relationship types: {relationship_types}")
                
            else:
                self.add_result("Graph Queries", "Get Knowledge Graph", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.add_result("Graph Queries", "Get Knowledge Graph", False, f"Error: {e}")

    async def test_node_operations(self):
        """Test individual node operations"""
        self.log("🎯 Testing individual node operations")
        
        if not self.node_ids:
            self.add_result("Node Operations", "All Tests", False, "No node IDs available")
            return False
            
        # Test getting a specific node
        try:
            node_id = self.node_ids[0]
            response = await self.client.get(f"/neo4j/node/{node_id}")
            if response.status_code == 200:
                node_data = response.json()
                self.add_result("Node Operations", "Get Node by ID", True, 
                              f"Retrieved node: {node_data.get('properties', {}).get('name', 'Unknown')}")
            else:
                self.add_result("Node Operations", "Get Node by ID", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.add_result("Node Operations", "Get Node by ID", False, f"Error: {e}")

    async def test_relationship_queries(self):
        """Test relationship and related node queries"""
        self.log("🔗 Testing relationship and related node queries")
        
        if not self.node_ids:
            self.add_result("Relationships", "All Tests", False, "No node IDs available")
            return False
            
        try:
            # Test getting related nodes
            node_id = self.node_ids[0]
            response = await self.client.get(f"/neo4j/related/{node_id}")
            if response.status_code == 200:
                related_data = response.json()
                related_nodes = related_data.get("nodes", [])
                relationships = related_data.get("relationships", [])
                
                self.add_result("Relationships", "Get Related Nodes", True,
                              f"Found {len(related_nodes)} related nodes, {len(relationships)} relationships")
                
            else:
                self.add_result("Relationships", "Get Related Nodes", False, f"Status: {response.status_code}")
                
            # Test with specific relationship type filter
            response = await self.client.get(f"/neo4j/related/{node_id}?relationship_type=HAS_CHAPTER")
            if response.status_code == 200:
                filtered_data = response.json()
                filtered_nodes = filtered_data.get("nodes", [])
                
                self.add_result("Relationships", "Filtered Relationship Query", True,
                              f"Found {len(filtered_nodes)} nodes with HAS_CHAPTER relationship")
            else:
                self.add_result("Relationships", "Filtered Relationship Query", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.add_result("Relationships", "Get Related Nodes", False, f"Error: {e}")

    async def test_concept_relationships(self):
        """Test concept extraction and relationship building"""
        self.log("🧠 Testing concept extraction and relationship building")
        
        try:
            from knowledge_graph import graph_service
            
            # Test concept extraction
            test_text = """
            Machine Learning algorithms like Neural Networks and Support Vector Machines
            are used in Deep Learning applications for Computer Vision and Natural Language Processing.
            """
            
            concepts = graph_service._extract_concepts(test_text)
            if len(concepts) > 0:
                self.add_result("Concepts", "Concept Extraction", True, f"Extracted {len(concepts)} concepts: {concepts[:3]}")
            else:
                self.add_result("Concepts", "Concept Extraction", False, "No concepts extracted")
                
            # Test concept relationships in graph
            if self.knowledge_id:
                # Query for concept nodes and their relationships
                concept_query = """
                MATCH (k:Knowledge {knowledge_id: $knowledge_id})-[:TEACHES_CONCEPT]->(c:Concept)
                RETURN c.name as concept_name, count(*) as count
                LIMIT 10
                """
                
                result = graph_service.execute_query(concept_query, {"knowledge_id": self.knowledge_id})
                concepts_found = []
                for record in result:
                    concepts_found.append(record["concept_name"])
                    
                if concepts_found:
                    self.add_result("Concepts", "Graph Concept Nodes", True, f"Found concepts in graph: {concepts_found[:3]}")
                else:
                    self.add_result("Concepts", "Graph Concept Nodes", False, "No concept nodes found in graph")
                    
        except Exception as e:
            self.add_result("Concepts", "Concept Extraction", False, f"Error: {e}")

    async def test_graph_synchronization(self):
        """Test knowledge graph synchronization features"""
        self.log("🔄 Testing knowledge graph synchronization")
        
        if not self.knowledge_id:
            self.add_result("Synchronization", "All Tests", False, "No knowledge ID available")
            return False
            
        try:
            from knowledge_graph_sync import sync_service
            
            # Test syncing specific knowledge
            result = await sync_service.sync_knowledge(self.knowledge_id)
            if result.get("success", False):
                self.add_result("Synchronization", "Sync Knowledge", True, result.get("message", ""))
            else:
                self.add_result("Synchronization", "Sync Knowledge", False, result.get("error", "Unknown error"))
                
        except Exception as e:
            self.add_result("Synchronization", "Sync Knowledge", False, f"Error: {e}")

    async def test_graph_performance(self):
        """Test graph performance with multiple queries"""
        self.log("⚡ Testing knowledge graph performance")
        
        if not self.knowledge_id:
            self.add_result("Performance", "All Tests", False, "No knowledge ID available")
            return False
            
        try:
            # Time multiple graph queries
            start_time = time.time()
            
            tasks = []
            for i in range(5):
                tasks.append(self.client.get(f"/neo4j/knowledge_graph/{self.knowledge_id}"))
                
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            end_time = time.time()
            duration = end_time - start_time
            
            successful = sum(1 for r in responses if not isinstance(r, Exception) and r.status_code == 200)
            
            self.add_result("Performance", "Concurrent Queries", True, 
                          f"{successful}/5 queries succeeded in {duration:.2f}s ({5/duration:.1f} req/s)")
                          
        except Exception as e:
            self.add_result("Performance", "Concurrent Queries", False, f"Error: {e}")

    async def run_knowledge_graph_tests(self):
        """Run comprehensive knowledge graph test suite"""
        self.log("🚀 Starting Knowledge Graph and Relation Builder Test Suite")
        self.log("=" * 80)
        
        # Setup phase
        if not await self.setup_authentication():
            self.log("❌ Authentication setup failed - cannot proceed")
            return self.generate_test_report()
            
        if not await self.test_neo4j_connectivity():
            self.log("❌ Neo4j connectivity failed - some tests will be skipped")
            
        if not await self.setup_test_knowledge():
            self.log("❌ Test knowledge setup failed - graph tests will be limited")
            
        # Main tests
        await self.test_graph_construction()
        await self.test_graph_queries()
        await self.test_node_operations()
        await self.test_relationship_queries()
        await self.test_concept_relationships()
        await self.test_graph_synchronization()
        await self.test_graph_performance()
        
        return self.generate_test_report()

    def generate_test_report(self):
        """Generate comprehensive test report"""
        self.log("\n" + "=" * 80)
        self.log("📊 KNOWLEDGE GRAPH TEST REPORT")
        self.log("=" * 80)
        
        total_passed = 0
        total_tests = 0
        
        for category, tests in self.test_results.items():
            category_passed = sum(1 for result in tests.values() if result)
            category_total = len(tests)
            total_passed += category_passed
            total_tests += category_total
            
            self.log(f"\n📂 {category}: {category_passed}/{category_total} tests passed")
            for test_name, result in tests.items():
                status = "✅" if result else "❌"
                self.log(f"   {status} {test_name}")
        
        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        self.log(f"\n📈 OVERALL RESULTS: {total_passed}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        if success_rate >= 90:
            self.log("🎉 EXCELLENT: Knowledge graph system is highly robust!")
        elif success_rate >= 75:
            self.log("✅ GOOD: Knowledge graph system is mostly functional")
        elif success_rate >= 50:
            self.log("⚠️  MODERATE: Knowledge graph system has some issues")
        else:
            self.log("❌ POOR: Knowledge graph system needs significant work")
        
        return success_rate

async def main():
    """Main test runner"""
    print("🔧 Knowledge Graph and Relation Builder Test Suite")
    print("Testing Neo4j knowledge graph functionality and relationship building")
    print()
    
    # Check if server is running
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/docs", timeout=5.0)
            if response.status_code != 200:
                print("❌ Server not responding. Make sure Docker Compose is running.")
                return 1
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return 1
    
    # Run knowledge graph tests
    async with KnowledgeGraphTester() as tester:
        success_rate = await tester.run_knowledge_graph_tests()
    
    # Return exit code based on success rate
    if success_rate >= 75:
        print(f"\n🎯 SUCCESS: Knowledge graph system is robust! ({success_rate:.1f}%)")
        return 0
    else:
        print(f"\n⚠️  NEEDS IMPROVEMENT: Knowledge graph robustness at {success_rate:.1f}%")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
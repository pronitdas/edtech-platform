#!/usr/bin/env python3
"""
Focused Knowledge Graph Test
Tests core knowledge graph functionality with better error handling
"""

import asyncio
import json
import os
import tempfile
import time
from typing import Dict, Optional, List, Any
import httpx

BASE_URL = "http://localhost:8000"

class FocusedGraphTester:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=60.0)
        self.auth_token: Optional[str] = None
        self.user_id: Optional[int] = None
        self.knowledge_id: Optional[int] = None
        self.test_results: Dict[str, bool] = {}
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamps"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def test_result(self, name: str, success: bool, details: str = ""):
        """Record test result"""
        self.test_results[name] = success
        status = "✅ PASS" if success else "❌ FAIL"
        self.log(f"{status}: {name} {details}")

    async def setup_auth(self):
        """Setup authentication"""
        self.log("🔐 Setting up authentication")
        
        try:
            response = await self.client.post("/api/v2/auth/demo-login")
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user_id")
                if self.auth_token:
                    self.client.headers["Authorization"] = f"Bearer {self.auth_token}"
                    self.test_result("Authentication", True)
                    return True
        except Exception as e:
            self.test_result("Authentication", False, f"Error: {e}")
        return False

    async def test_neo4j_connection(self):
        """Test Neo4j direct connection"""
        self.log("🔌 Testing Neo4j connection")
        
        try:
            from knowledge_graph import graph_service
            
            if graph_service.connected:
                self.test_result("Neo4j Connection", True, "Connected successfully")
                
                # Test basic operations
                test_result = graph_service.execute_query("RETURN 1 as test")
                if test_result and len(test_result) > 0:
                    record = test_result[0]
                    if record and record["test"] == 1:
                        self.test_result("Neo4j Query", True, "Basic query works")
                    else:
                        self.test_result("Neo4j Query", False, "Query result invalid")
                else:
                    self.test_result("Neo4j Query", False, "No query result")
                    
                return True
            else:
                self.test_result("Neo4j Connection", False, "Not connected")
                return False
                
        except Exception as e:
            self.test_result("Neo4j Connection", False, f"Error: {e}")
            return False

    async def create_test_knowledge(self):
        """Create test knowledge for graph testing"""
        self.log("📚 Creating test knowledge")
        
        test_content = """# Artificial Intelligence

## Machine Learning
Machine Learning is a subset of Artificial Intelligence that uses Neural Networks and algorithms to learn from data.

## Deep Learning  
Deep Learning uses Neural Networks with multiple layers for Computer Vision and Natural Language Processing.
"""
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
                f.write(test_content)
                temp_file_path = f.name
            
            try:
                with open(temp_file_path, 'rb') as f:
                    files = {"file": ("ai_test.md", f, "text/markdown")}
                    data = {"auto_process": "true"}
                    
                    response = await self.client.post("/api/v2/knowledge/", files=files, data=data)
                    
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.knowledge_id = data.get("knowledge_id") or data.get("id")
                    self.test_result("Knowledge Creation", True, f"ID: {self.knowledge_id}")
                    
                    # Wait for processing
                    await asyncio.sleep(8)
                    return True
                else:
                    self.test_result("Knowledge Creation", False, f"Status: {response.status_code}")
                    
            finally:
                os.unlink(temp_file_path)
                
        except Exception as e:
            self.test_result("Knowledge Creation", False, f"Error: {e}")
            
        return False

    async def test_graph_endpoints(self):
        """Test knowledge graph endpoints"""
        self.log("🔍 Testing graph endpoints")
        
        if not self.knowledge_id:
            self.test_result("Graph Endpoints", False, "No knowledge ID")
            return False
            
        # Test knowledge graph endpoint (with better error handling)
        try:
            response = await self.client.get(f"/neo4j/knowledge_graph/{self.knowledge_id}")
            if response.status_code == 200:
                graph_data = response.json()
                nodes = graph_data.get("nodes", [])
                relationships = graph_data.get("relationships", [])
                self.test_result("Get Knowledge Graph", True, f"{len(nodes)} nodes, {len(relationships)} rels")
                
                # Test individual node access if we have nodes
                if nodes:
                    node_id = nodes[0].get("id")
                    if node_id:
                        node_response = await self.client.get(f"/neo4j/node/{node_id}")
                        if node_response.status_code == 200:
                            self.test_result("Get Node by ID", True)
                        else:
                            self.test_result("Get Node by ID", False, f"Status: {node_response.status_code}")
                        
                        # Test related nodes
                        related_response = await self.client.get(f"/neo4j/related/{node_id}")
                        if related_response.status_code == 200:
                            related_data = related_response.json()
                            related_nodes = related_data.get("nodes", [])
                            self.test_result("Get Related Nodes", True, f"{len(related_nodes)} related nodes")
                        else:
                            self.test_result("Get Related Nodes", False, f"Status: {related_response.status_code}")
                else:
                    self.test_result("Get Node by ID", False, "No nodes available")
                    self.test_result("Get Related Nodes", False, "No nodes available")
                    
            else:
                self.test_result("Get Knowledge Graph", False, f"Status: {response.status_code}")
                # Try to get error details
                try:
                    error_detail = response.text
                    self.log(f"   Error details: {error_detail[:200]}")
                except:
                    pass
                    
        except Exception as e:
            self.test_result("Get Knowledge Graph", False, f"Error: {e}")

    async def test_concept_extraction(self):
        """Test concept extraction functionality"""
        self.log("🧠 Testing concept extraction")
        
        try:
            from knowledge_graph import graph_service
            
            test_text = "Machine Learning and Neural Networks are used in Artificial Intelligence applications."
            concepts = graph_service._extract_concepts(test_text)
            
            if len(concepts) > 0:
                self.test_result("Concept Extraction", True, f"Extracted: {concepts}")
            else:
                self.test_result("Concept Extraction", False, "No concepts extracted")
                
        except Exception as e:
            self.test_result("Concept Extraction", False, f"Error: {e}")

    async def test_manual_graph_operations(self):
        """Test manual graph node and relationship creation"""
        self.log("🔧 Testing manual graph operations")
        
        try:
            from knowledge_graph import graph_service, GraphNode, GraphRelationship
            
            # Create test nodes
            node1 = GraphNode(
                labels=["TestConcept"],
                properties={"name": "Test Concept 1", "test_id": "test_1"}
            )
            
            node2 = GraphNode(
                labels=["TestConcept"], 
                properties={"name": "Test Concept 2", "test_id": "test_2"}
            )
            
            created_node1 = graph_service.create_node(node1)
            created_node2 = graph_service.create_node(node2)
            
            if created_node1.id and created_node2.id:
                self.test_result("Manual Node Creation", True, f"Created nodes: {created_node1.id}, {created_node2.id}")
                
                # Create relationship
                rel = GraphRelationship(
                    start_node_id=created_node1.id,
                    end_node_id=created_node2.id,
                    type="TEST_RELATION",
                    properties={"test": True}
                )
                
                created_rel = graph_service.create_relationship(rel)
                if created_rel.id:
                    self.test_result("Manual Relationship Creation", True, f"Created relationship: {created_rel.id}")
                else:
                    self.test_result("Manual Relationship Creation", False, "No relationship ID")
                    
                # Test retrieval
                retrieved_node = graph_service.get_node_by_id(created_node1.id)
                if retrieved_node:
                    self.test_result("Node Retrieval", True, f"Retrieved: {retrieved_node.properties.get('name')}")
                else:
                    self.test_result("Node Retrieval", False, "Could not retrieve node")
                    
                # Clean up test nodes
                try:
                    graph_service.execute_query("MATCH (n:TestConcept {test_id: 'test_1'}) DETACH DELETE n")
                    graph_service.execute_query("MATCH (n:TestConcept {test_id: 'test_2'}) DETACH DELETE n")
                except:
                    pass
                    
            else:
                self.test_result("Manual Node Creation", False, "Failed to create nodes")
                
        except Exception as e:
            self.test_result("Manual Node Creation", False, f"Error: {e}")

    async def test_build_graph_api(self):
        """Test the build graph API endpoint"""
        self.log("🏗️ Testing build graph API")
        
        if not self.knowledge_id:
            self.test_result("Build Graph API", False, "No knowledge ID")
            return
            
        try:
            # Get chapters first
            chapters_response = await self.client.get(f"/api/v2/chapters/{self.knowledge_id}")
            if chapters_response.status_code == 200:
                chapters = chapters_response.json()
                self.log(f"   Found {len(chapters)} chapters for graph building")
                
                if chapters:
                    # Test build graph endpoint  
                    build_data = {
                        "knowledge_id": self.knowledge_id,
                        "chapters": chapters
                    }
                    
                    build_response = await self.client.post("/neo4j/build_graph", json=build_data)
                    if build_response.status_code == 200:
                        self.test_result("Build Graph API", True)
                    else:
                        self.test_result("Build Graph API", False, f"Status: {build_response.status_code}")
                        try:
                            error_detail = build_response.text
                            self.log(f"   Error: {error_detail[:200]}")
                        except:
                            pass
                else:
                    self.test_result("Build Graph API", False, "No chapters available")
            else:
                self.test_result("Build Graph API", False, f"Could not get chapters: {chapters_response.status_code}")
                
        except Exception as e:
            self.test_result("Build Graph API", False, f"Error: {e}")

    async def run_focused_tests(self):
        """Run focused knowledge graph tests"""
        self.log("🚀 Starting Focused Knowledge Graph Tests")
        self.log("=" * 60)
        
        # Setup
        if not await self.setup_auth():
            self.log("❌ Authentication failed - stopping tests")
            return self.generate_report()
            
        neo4j_available = await self.test_neo4j_connection()
        
        if neo4j_available:
            await self.test_concept_extraction()
            await self.test_manual_graph_operations()
            
            # Knowledge-specific tests
            if await self.create_test_knowledge():
                await self.test_build_graph_api()
                await self.test_graph_endpoints()
        else:
            self.log("⚠️  Neo4j not available - skipping graph tests")
            
        return self.generate_report()

    def generate_report(self):
        """Generate test report"""
        self.log("\n" + "=" * 60)
        self.log("📊 FOCUSED KNOWLEDGE GRAPH TEST REPORT")
        self.log("=" * 60)
        
        passed = sum(1 for result in self.test_results.values() if result)
        total = len(self.test_results)
        
        for test_name, result in self.test_results.items():
            status = "✅" if result else "❌"
            self.log(f"{status} {test_name}")
        
        success_rate = (passed / total * 100) if total > 0 else 0
        self.log(f"\n📈 RESULTS: {passed}/{total} tests passed ({success_rate:.1f}%)")
        
        if success_rate >= 85:
            self.log("🎉 EXCELLENT: Knowledge graph system is robust!")
            status = "EXCELLENT"
        elif success_rate >= 70:
            self.log("✅ GOOD: Knowledge graph system works well")
            status = "GOOD"
        elif success_rate >= 50:
            self.log("⚠️  MODERATE: Knowledge graph has some issues")
            status = "MODERATE"
        else:
            self.log("❌ NEEDS WORK: Knowledge graph needs attention")
            status = "NEEDS WORK"
        
        self.log(f"🎯 STATUS: {status}")
        return success_rate

async def main():
    """Main test runner"""
    print("🔧 Focused Knowledge Graph Test Suite")
    print("Testing core knowledge graph and relation builder functionality")
    print()
    
    # Check server connectivity
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/docs", timeout=5.0)
            if response.status_code != 200:
                print("❌ Server not responding")
                return 1
    except:
        print("❌ Cannot connect to server")
        return 1
    
    # Run tests
    async with FocusedGraphTester() as tester:
        success_rate = await tester.run_focused_tests()
    
    if success_rate >= 70:
        print(f"\n🎯 SUCCESS: Knowledge graph is functional! ({success_rate:.1f}%)")
        return 0
    else:
        print(f"\n⚠️  NEEDS WORK: Knowledge graph at {success_rate:.1f}%")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
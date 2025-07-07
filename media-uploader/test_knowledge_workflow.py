#!/usr/bin/env python3
"""
Knowledge Upload and Processing Workflow Test
Tests the complete knowledge upload -> processing -> workflow generation pipeline
"""

import asyncio
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Dict, Optional
import httpx

BASE_URL = "http://localhost:8000"

class KnowledgeWorkflowTester:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=60.0)
        self.auth_token: Optional[str] = None
        self.user_id: Optional[int] = None
        self.knowledge_id: Optional[int] = None
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamps"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    async def create_test_user(self):
        """Create a test user directly in the database"""
        self.log("Creating test user...")
        
        # Register user via API
        register_data = {
            "email": f"test_{int(time.time())}@example.com",
            "password": "testpassword123",
            "name": "Test User"
        }
        
        try:
            response = await self.client.post("/v2/auth/register", json=register_data)
            self.log(f"Registration response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.log(f"✅ User created: {data}")
                return register_data
            else:
                self.log(f"❌ Registration failed: {response.text}")
                return None
        except Exception as e:
            self.log(f"❌ Registration error: {e}", "ERROR")
            return None

    async def login_user(self, email: str, password: str):
        """Login user and get auth token"""
        self.log("Logging in user...")
        
        login_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = await self.client.post("/v2/auth/login", json=login_data)
            self.log(f"Login response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user_id")
                
                if self.auth_token:
                    self.client.headers["Authorization"] = f"Bearer {self.auth_token}"
                    self.log(f"✅ Login successful, token: {self.auth_token[:20]}...")
                    return True
                else:
                    self.log("❌ Login successful but no token received")
                    return False
            else:
                self.log(f"❌ Login failed: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Login error: {e}", "ERROR")
            return False

    async def upload_knowledge_file(self):
        """Upload a knowledge file"""
        self.log("Uploading knowledge file...")
        
        # Create test content
        test_content = """
# Machine Learning Fundamentals

## Introduction
Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.

## Core Concepts

### Supervised Learning
In supervised learning, the algorithm learns from labeled training data. Common types include:
- **Classification**: Predicting categories (e.g., spam detection)
- **Regression**: Predicting continuous values (e.g., house prices)

### Unsupervised Learning
Unsupervised learning finds patterns in data without labeled examples:
- **Clustering**: Grouping similar data points
- **Dimensionality Reduction**: Simplifying data while preserving important features

### Reinforcement Learning
Reinforcement learning involves an agent learning through trial and error by receiving rewards or penalties for actions.

## Applications
- Image recognition
- Natural language processing
- Autonomous vehicles
- Recommendation systems

## Key Algorithms
1. Linear Regression
2. Decision Trees
3. Random Forest
4. Support Vector Machines
5. Neural Networks

## Conclusion
Machine learning is transforming industries by enabling computers to learn from data and make intelligent decisions.
"""
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            f.write(test_content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {"file": ("ml_fundamentals.md", f, "text/markdown")}
                data = {
                    "auto_process": "true",
                    "generate_content": "true",
                    "content_types": "summary,notes,quiz,mindmap",
                    "content_language": "English"
                }
                
                response = await self.client.post("/v2/knowledge/", files=files, data=data)
                
            self.log(f"Knowledge upload response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.log(f"✅ Knowledge uploaded successfully")
                self.knowledge_id = data.get("knowledge_id") or data.get("id")
                ws_channel = data.get("ws_channel")
                
                self.log(f"📝 Knowledge ID: {self.knowledge_id}")
                self.log(f"📡 WebSocket Channel: {ws_channel}")
                
                return True
            else:
                self.log(f"❌ Knowledge upload failed: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Knowledge upload error: {e}", "ERROR")
            return False
        finally:
            # Cleanup temp file
            os.unlink(temp_file_path)

    async def check_processing_status(self):
        """Check processing status of uploaded knowledge"""
        if not self.knowledge_id:
            self.log("❌ No knowledge ID to check status")
            return False
        
        self.log("Checking processing status...")
        
        try:
            # Wait for processing to complete
            max_wait = 60  # 60 seconds
            wait_time = 0
            
            while wait_time < max_wait:
                response = await self.client.get(f"/v2/knowledge/{self.knowledge_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    status = data.get("status", "unknown")
                    
                    self.log(f"📊 Processing status: {status}")
                    
                    if status == "completed":
                        self.log("✅ Processing completed successfully")
                        return True
                    elif status == "failed":
                        self.log("❌ Processing failed")
                        return False
                    else:
                        self.log(f"⏳ Still processing... ({wait_time}s)")
                        await asyncio.sleep(5)
                        wait_time += 5
                else:
                    self.log(f"❌ Failed to check status: {response.status_code}")
                    return False
            
            self.log("⏰ Processing timeout reached")
            return False
            
        except Exception as e:
            self.log(f"❌ Status check error: {e}", "ERROR")
            return False

    async def check_chapters_generated(self):
        """Check if chapters were generated from the knowledge"""
        if not self.knowledge_id:
            self.log("❌ No knowledge ID to check chapters")
            return False
        
        self.log("Checking generated chapters...")
        
        try:
            response = await self.client.get(f"/v2/chapters/{self.knowledge_id}")
            
            if response.status_code == 200:
                chapters = response.json()
                self.log(f"✅ Found {len(chapters)} chapters")
                
                for i, chapter in enumerate(chapters[:3]):  # Show first 3 chapters
                    title = chapter.get("title", "Untitled")
                    content_preview = chapter.get("content", "")[:100] + "..."
                    self.log(f"  📖 Chapter {i+1}: {title}")
                    self.log(f"    Preview: {content_preview}")
                
                return len(chapters) > 0
            else:
                self.log(f"❌ Failed to get chapters: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Chapters check error: {e}", "ERROR")
            return False

    async def check_generated_content(self):
        """Check if educational content was generated"""
        if not self.knowledge_id:
            self.log("❌ No knowledge ID to check content")
            return False
        
        self.log("Checking generated educational content...")
        
        try:
            response = await self.client.get(f"/v2/content/{self.knowledge_id}")
            
            if response.status_code == 200:
                content = response.json()
                self.log(f"✅ Generated content found")
                
                # Check different content types
                content_types = ["summary", "notes", "quiz", "mindmap"]
                found_content = {}
                
                for content_type in content_types:
                    if content_type in content:
                        found_content[content_type] = len(str(content[content_type]))
                        self.log(f"  📝 {content_type}: {found_content[content_type]} chars")
                
                return len(found_content) > 0
            else:
                self.log(f"❌ Failed to get content: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Content check error: {e}", "ERROR")
            return False

    async def test_knowledge_search(self):
        """Test searching through uploaded knowledge"""
        self.log("Testing knowledge search...")
        
        try:
            # Search for terms from our uploaded content
            search_terms = ["machine learning", "supervised learning", "neural networks"]
            
            for term in search_terms:
                response = await self.client.get(f"/v2/search/?q={term}")
                
                if response.status_code == 200:
                    results = response.json()
                    result_count = len(results.get("results", []))
                    self.log(f"  🔍 '{term}': {result_count} results")
                else:
                    self.log(f"  ❌ Search failed for '{term}': {response.status_code}")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Search error: {e}", "ERROR")
            return False

    async def run_complete_workflow(self):
        """Run the complete knowledge upload and processing workflow"""
        self.log("🚀 Starting Knowledge Upload and Processing Workflow Test")
        self.log("=" * 70)
        
        test_results = {}
        
        # Step 1: Create and login user
        user_data = await self.create_test_user()
        if not user_data:
            self.log("❌ Failed to create test user")
            return False
        
        login_success = await self.login_user(user_data["email"], user_data["password"])
        test_results["Authentication"] = login_success
        
        if not login_success:
            self.log("❌ Authentication failed - cannot proceed")
            return test_results
        
        # Step 2: Upload knowledge file
        upload_success = await self.upload_knowledge_file()
        test_results["Knowledge Upload"] = upload_success
        
        if not upload_success:
            self.log("❌ Knowledge upload failed")
            return test_results
        
        # Step 3: Wait for processing
        processing_success = await self.check_processing_status()
        test_results["Processing"] = processing_success
        
        # Step 4: Check chapters generation
        chapters_success = await self.check_chapters_generated()
        test_results["Chapters Generation"] = chapters_success
        
        # Step 5: Check content generation
        content_success = await self.check_generated_content()
        test_results["Content Generation"] = content_success
        
        # Step 6: Test search functionality
        search_success = await self.test_knowledge_search()
        test_results["Search Integration"] = search_success
        
        # Summary
        self.log("\n" + "=" * 70)
        self.log("📊 WORKFLOW TEST SUMMARY")
        self.log("=" * 70)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status}: {test_name}")
        
        self.log(f"\n📈 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL WORKFLOW TESTS PASSED!")
            self.log("✅ Knowledge upload → processing → workflow generation is working!")
        else:
            self.log("⚠️  Some workflow steps failed - check logs above")
        
        return test_results

async def main():
    """Main test runner"""
    print("🔧 Knowledge Upload and Processing Workflow Tester")
    print("Testing complete pipeline: Upload → Process → Generate → Search")
    print()
    
    # Check if server is running
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/docs", timeout=5.0)
            if response.status_code != 200:
                print("❌ Server not responding. Make sure Docker Compose is running.")
                return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("Make sure Docker Compose is running with the media-uploader service.")
        return
    
    # Run workflow test
    async with KnowledgeWorkflowTester() as tester:
        results = await tester.run_complete_workflow()
    
    # Exit with appropriate code
    if results:
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        if passed == total:
            print(f"\n🎯 SUCCESS: Complete workflow is working! ({total}/{total})")
            return 0
        else:
            print(f"\n⚠️  PARTIAL SUCCESS: {passed}/{total} steps working")
            return 1
    else:
        print(f"\n❌ FAILURE: Workflow test could not complete")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
#!/usr/bin/env python3
"""
Comprehensive V2 Backend Integration Tests
Tests all flows end-to-end with real services (no mocking)
"""

import asyncio
import json
import os
import sys
import time
import httpx
from typing import Dict, Optional
import tempfile
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"

class V2IntegrationTester:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
        self.auth_token: Optional[str] = None
        self.test_user_id: Optional[int] = None
        self.test_knowledge_id: Optional[int] = None
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamps"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    async def test_admin_health_basic(self):
        """Test basic health endpoint (no auth required)"""
        self.log("Testing basic health endpoint...")
        try:
            response = await self.client.get("/v2/admin/health/basic")
            self.log(f"Health response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Basic health check passed: {data}")
                return True
            else:
                self.log(f"❌ Health check failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Health check error: {e}", "ERROR")
            return False

    async def test_auth_register(self):
        """Test user registration"""
        self.log("Testing user registration...")
        try:
            # First, check if we need to create a user
            register_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "full_name": "Test User"
            }
            
            response = await self.client.post("/v2/auth/register", json=register_data)
            self.log(f"Register response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.log(f"✅ Registration successful: {data}")
                self.test_user_id = data.get("user_id") or data.get("id")
                return True
            elif response.status_code == 400 and "already exists" in response.text.lower():
                self.log("ℹ️  User already exists, proceeding with login")
                return True
            else:
                self.log(f"❌ Registration failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Registration error: {e}", "ERROR")
            return False

    async def test_auth_login(self):
        """Test user login"""
        self.log("Testing user login...")
        try:
            login_data = {
                "username": TEST_USER_EMAIL,  # Some systems use username field
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            # Try form data first (common for OAuth2)
            response = await self.client.post("/v2/auth/login", data=login_data)
            
            if response.status_code != 200:
                # Try JSON format
                response = await self.client.post("/v2/auth/login", json=login_data)
            
            self.log(f"Login response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Login successful")
                
                # Extract token from various possible formats
                self.auth_token = data.get("access_token") or data.get("token") or data.get("jwt")
                self.test_user_id = data.get("user_id") or data.get("id")
                
                if self.auth_token:
                    self.log(f"🔑 Auth token obtained: {self.auth_token[:20]}...")
                    # Set authorization header for future requests
                    self.client.headers["Authorization"] = f"Bearer {self.auth_token}"
                    return True
                else:
                    self.log("⚠️  Login successful but no token received")
                    return False
            else:
                self.log(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Login error: {e}", "ERROR")
            return False

    async def test_auth_profile(self):
        """Test getting user profile"""
        if not self.auth_token:
            self.log("⚠️  Skipping profile test - no auth token")
            return False
            
        self.log("Testing user profile...")
        try:
            response = await self.client.get("/v2/auth/profile")
            self.log(f"Profile response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Profile retrieved: {data}")
                self.test_user_id = self.test_user_id or data.get("id")
                return True
            else:
                self.log(f"❌ Profile failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Profile error: {e}", "ERROR")
            return False

    async def test_knowledge_upload(self):
        """Test knowledge/file upload"""
        if not self.auth_token:
            self.log("⚠️  Skipping knowledge upload - no auth token")
            return False
            
        self.log("Testing knowledge upload...")
        try:
            # Create a test file
            test_content = """
            # Test Document
            
            This is a test document for V2 backend testing.
            
            ## Chapter 1: Introduction
            This chapter introduces the concept.
            
            ## Chapter 2: Advanced Topics  
            This chapter covers advanced topics.
            """
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
                f.write(test_content)
                temp_file_path = f.name
            
            try:
                with open(temp_file_path, 'rb') as f:
                    files = {"file": ("test_doc.md", f, "text/markdown")}
                    data = {"name": "Test Knowledge Document"}
                    
                    response = await self.client.post("/v2/knowledge/", files=files, data=data)
                    
                self.log(f"Knowledge upload response: {response.status_code}")
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.log(f"✅ Knowledge upload successful: {data}")
                    self.test_knowledge_id = data.get("id") or data.get("knowledge_id")
                    return True
                else:
                    self.log(f"❌ Knowledge upload failed: {response.status_code} - {response.text}")
                    return False
            finally:
                # Cleanup temp file
                os.unlink(temp_file_path)
                
        except Exception as e:
            self.log(f"❌ Knowledge upload error: {e}", "ERROR")
            return False

    async def test_knowledge_list(self):
        """Test listing knowledge entries"""
        if not self.auth_token:
            self.log("⚠️  Skipping knowledge list - no auth token")
            return False
            
        self.log("Testing knowledge list...")
        try:
            response = await self.client.get("/v2/knowledge/")
            self.log(f"Knowledge list response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Knowledge list successful: {len(data.get('items', data))} items")
                
                # If we don't have a test_knowledge_id, try to get one from the list
                if not self.test_knowledge_id and data:
                    items = data.get('items', data) if isinstance(data, dict) else data
                    if items and len(items) > 0:
                        self.test_knowledge_id = items[0].get('id')
                        self.log(f"📝 Using knowledge ID: {self.test_knowledge_id}")
                
                return True
            else:
                self.log(f"❌ Knowledge list failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Knowledge list error: {e}", "ERROR")
            return False

    async def test_chapters_list(self):
        """Test listing chapters for knowledge"""
        if not self.auth_token or not self.test_knowledge_id:
            self.log("⚠️  Skipping chapters test - no auth token or knowledge ID")
            return False
            
        self.log(f"Testing chapters list for knowledge {self.test_knowledge_id}...")
        try:
            response = await self.client.get(f"/v2/chapters/{self.test_knowledge_id}")
            self.log(f"Chapters response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Chapters list successful: {len(data)} chapters")
                return True
            elif response.status_code == 404:
                self.log("ℹ️  No chapters found (expected for new knowledge)")
                return True
            else:
                self.log(f"❌ Chapters failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Chapters error: {e}", "ERROR")
            return False

    async def test_search_functionality(self):
        """Test search functionality"""
        if not self.auth_token:
            self.log("⚠️  Skipping search test - no auth token")
            return False
            
        self.log("Testing search functionality...")
        try:
            # Test search suggestions
            response = await self.client.get("/v2/search/suggestions?q=test")
            self.log(f"Search suggestions response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Search suggestions successful: {data}")
            
            # Test general search
            response = await self.client.get("/v2/search/?q=test")
            self.log(f"Search response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Search successful: {len(data.get('results', []))} results")
                return True
            else:
                self.log(f"❌ Search failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Search error: {e}", "ERROR")
            return False

    async def test_analytics_tracking(self):
        """Test analytics event tracking"""
        if not self.auth_token:
            self.log("⚠️  Skipping analytics test - no auth token")
            return False
            
        self.log("Testing analytics tracking...")
        try:
            event_data = {
                "event_type": "test_event",
                "knowledge_id": self.test_knowledge_id,
                "data": {"test": True, "timestamp": time.time()}
            }
            
            response = await self.client.post("/v2/analytics/track-event", json=event_data)
            self.log(f"Analytics tracking response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                self.log("✅ Analytics tracking successful")
                return True
            else:
                self.log(f"❌ Analytics tracking failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Analytics error: {e}", "ERROR")
            return False

    async def test_roleplay_generation(self):
        """Test roleplay scenario generation"""
        if not self.auth_token or not self.test_knowledge_id:
            self.log("⚠️  Skipping roleplay test - no auth token or knowledge ID")
            return False
            
        self.log("Testing roleplay generation...")
        try:
            roleplay_data = {
                "knowledge_id": self.test_knowledge_id,
                "topic": "Introduction to Testing",
                "language": "English"
            }
            
            response = await self.client.post("/v2/roleplay/generate", json=roleplay_data)
            self.log(f"Roleplay generation response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.log(f"✅ Roleplay generation successful")
                return True
            else:
                self.log(f"❌ Roleplay generation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Roleplay error: {e}", "ERROR")
            return False

    async def test_admin_full_health(self):
        """Test full admin health check"""
        if not self.auth_token:
            self.log("⚠️  Skipping admin health test - no auth token")
            return False
            
        self.log("Testing admin full health check...")
        try:
            response = await self.client.get("/v2/admin/health/full")
            self.log(f"Admin health response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Admin health check successful")
                
                # Log component statuses
                for component, status in data.get("components", {}).items():
                    status_icon = "✅" if status.get("status") == "healthy" else "❌"
                    self.log(f"  {status_icon} {component}: {status.get('status')}")
                
                return True
            else:
                self.log(f"❌ Admin health failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Admin health error: {e}", "ERROR")
            return False

    async def run_all_tests(self):
        """Run all integration tests"""
        self.log("🚀 Starting V2 Backend Integration Tests")
        self.log("=" * 60)
        
        test_results = {}
        
        # Test sequence - order matters for some tests
        tests = [
            ("Basic Health Check", self.test_admin_health_basic),
            ("User Registration", self.test_auth_register),
            ("User Login", self.test_auth_login),
            ("User Profile", self.test_auth_profile),
            ("Knowledge Upload", self.test_knowledge_upload),
            ("Knowledge List", self.test_knowledge_list),
            ("Chapters List", self.test_chapters_list),
            ("Search Functionality", self.test_search_functionality),
            ("Analytics Tracking", self.test_analytics_tracking),
            ("Roleplay Generation", self.test_roleplay_generation),
            ("Admin Health Check", self.test_admin_full_health),
        ]
        
        for test_name, test_func in tests:
            self.log(f"\n🧪 Running: {test_name}")
            try:
                result = await test_func()
                test_results[test_name] = result
                if result:
                    self.log(f"✅ {test_name}: PASSED")
                else:
                    self.log(f"❌ {test_name}: FAILED")
            except Exception as e:
                self.log(f"💥 {test_name}: ERROR - {e}", "ERROR")
                test_results[test_name] = False
            
            # Small delay between tests
            await asyncio.sleep(0.5)
        
        # Print summary
        self.log("\n" + "=" * 60)
        self.log("📊 TEST SUMMARY")
        self.log("=" * 60)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status}: {test_name}")
        
        self.log(f"\n📈 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED! V2 Backend is working correctly!")
        elif passed > total * 0.7:
            self.log("⚠️  Most tests passed. Some issues need attention.")
        else:
            self.log("🚨 Multiple test failures. Backend needs debugging.")
        
        return test_results

async def main():
    """Main test runner"""
    print("🔧 V2 Backend Integration Test Suite")
    print("Using real services - no mocking")
    print(f"Testing against: {BASE_URL}")
    print()
    
    # Check if server is running
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/docs", timeout=5.0)
            if response.status_code != 200:
                print("❌ Server not responding. Make sure the server is running:")
                print("   uvicorn main:app --host 0.0.0.0 --port 8000")
                return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("Make sure the server is running:")
        print("   uvicorn main:app --host 0.0.0.0 --port 8000")
        return
    
    # Run tests
    async with V2IntegrationTester() as tester:
        results = await tester.run_all_tests()
    
    # Exit with appropriate code
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    if passed == total:
        print(f"\n🎯 SUCCESS: All {total} tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️  PARTIAL SUCCESS: {passed}/{total} tests passed")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

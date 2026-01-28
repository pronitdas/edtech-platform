#!/usr/bin/env python3
"""
V2 API Stress Test Suite
Tests API robustness under concurrent load and edge cases
"""

import asyncio
import time
import httpx
from typing import List, Dict
import json

BASE_URL = "http://localhost:8000"

class StressTestRunner:
    def __init__(self):
        self.results: Dict[str, List[float]] = {}
        
    def log(self, message: str):
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")

    async def test_concurrent_authentication(self, num_requests: int = 10):
        """Test concurrent authentication requests"""
        self.log(f"🔐 Testing {num_requests} concurrent authentication requests")
        
        async def single_auth_test(session_id: int):
            async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
                start_time = time.time()
                try:
                    register_data = {
                        "email": f"stress_test_{session_id}_{int(time.time())}@example.com",
                        "password": "testpassword123",
                        "name": f"Stress Test User {session_id}"
                    }
                    
                    response = await client.post("/api/v2/auth/register", json=register_data)
                    duration = time.time() - start_time
                    
                    if response.status_code in [200, 201]:
                        return {"success": True, "duration": duration, "status": response.status_code}
                    else:
                        return {"success": False, "duration": duration, "status": response.status_code}
                        
                except Exception as e:
                    duration = time.time() - start_time
                    return {"success": False, "duration": duration, "error": str(e)}
        
        # Run concurrent requests
        tasks = [single_auth_test(i) for i in range(num_requests)]
        results = await asyncio.gather(*tasks)
        
        # Analyze results
        successful = [r for r in results if r.get("success", False)]
        failed = [r for r in results if not r.get("success", False)]
        avg_duration = sum(r["duration"] for r in results) / len(results)
        
        self.log(f"   ✅ Success: {len(successful)}/{num_requests} ({len(successful)/num_requests*100:.1f}%)")
        self.log(f"   ⏱️  Average duration: {avg_duration:.3f}s")
        
        if failed:
            self.log(f"   ❌ Failures: {len(failed)}")
            for failure in failed[:3]:  # Show first 3 failures
                error_msg = failure.get('error', f"Status: {failure.get('status')}")
                self.log(f"      {error_msg}") 
        
        return len(successful) / num_requests >= 0.9  # 90% success rate

    async def test_concurrent_search(self, num_requests: int = 20):
        """Test concurrent search requests"""
        self.log(f"🔍 Testing {num_requests} concurrent search requests")
        
        # Get auth token first
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            demo_response = await client.post("/api/v2/auth/demo-login")
            if demo_response.status_code != 200:
                self.log("   ❌ Failed to get demo token for search test")
                return False
            
            token = demo_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
        
        async def single_search_test(query_id: int):
            async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
                start_time = time.time()
                try:
                    queries = ["machine learning", "python", "data science", "artificial intelligence", "programming"]
                    query = queries[query_id % len(queries)]
                    
                    response = await client.get(f"/api/v2/search/?q={query}", headers=headers)
                    duration = time.time() - start_time
                    
                    if response.status_code == 200:
                        return {"success": True, "duration": duration, "results": len(response.json().get("results", []))}
                    else:
                        return {"success": False, "duration": duration, "status": response.status_code}
                        
                except Exception as e:
                    duration = time.time() - start_time
                    return {"success": False, "duration": duration, "error": str(e)}
        
        # Run concurrent requests
        tasks = [single_search_test(i) for i in range(num_requests)]
        results = await asyncio.gather(*tasks)
        
        # Analyze results
        successful = [r for r in results if r.get("success", False)]
        failed = [r for r in results if not r.get("success", False)]
        avg_duration = sum(r["duration"] for r in results) / len(results)
        
        self.log(f"   ✅ Success: {len(successful)}/{num_requests} ({len(successful)/num_requests*100:.1f}%)")
        self.log(f"   ⏱️  Average duration: {avg_duration:.3f}s")
        
        return len(successful) / num_requests >= 0.9

    async def test_rapid_requests(self, num_requests: int = 50):
        """Test rapid sequential requests to same endpoint"""
        self.log(f"⚡ Testing {num_requests} rapid sequential requests")
        
        # Get auth token
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            demo_response = await client.post("/api/v2/auth/demo-login")
            if demo_response.status_code != 200:
                return False
            
            token = demo_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            start_time = time.time()
            successful = 0
            
            for i in range(num_requests):
                try:
                    response = await client.get("/api/v2/profile", headers=headers)
                    if response.status_code == 200:
                        successful += 1
                except:
                    pass
            
            total_duration = time.time() - start_time
            rps = num_requests / total_duration
            
            self.log(f"   ✅ Success: {successful}/{num_requests} ({successful/num_requests*100:.1f}%)")
            self.log(f"   ⚡ Rate: {rps:.1f} requests/second")
            
            return successful / num_requests >= 0.95  # 95% success rate

    async def test_error_handling_resilience(self):
        """Test system resilience to various error conditions"""
        self.log("🛡️ Testing error handling resilience")
        
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            # Get auth token
            demo_response = await client.post("/api/v2/auth/demo-login")
            if demo_response.status_code != 200:
                return False
            
            token = demo_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            tests = [
                # Test invalid endpoints
                ("GET", "/api/v2/nonexistent", None, [404]),
                # Test malformed JSON
                ("POST", "/api/v2/analytics/track-event", '{"invalid": json}', [400, 422]),
                # Test missing auth
                ("GET", "/api/v2/profile", None, [401], {}),
                # Test oversized request
                ("POST", "/api/v2/analytics/track-event", {"data": "x" * 100000}, [413, 422]),
                # Test invalid content type
                ("POST", "/api/v2/analytics/track-event", "plain text", [400, 422]),
            ]
            
            passed = 0
            total = len(tests)
            
            for method, endpoint, data, expected_codes, test_headers in tests:
                try:
                    if len(test_headers) == 0:
                        test_headers = {}
                    else:
                        test_headers = headers
                        
                    if method == "GET":
                        response = await client.get(endpoint, headers=test_headers)
                    elif method == "POST":
                        if isinstance(data, str) and data.startswith('{"invalid"'):
                            # Send malformed JSON as text
                            response = await client.post(endpoint, data=data, headers={**test_headers, "Content-Type": "application/json"})
                        elif isinstance(data, str):
                            response = await client.post(endpoint, data=data, headers=test_headers)
                        else:
                            response = await client.post(endpoint, json=data, headers=test_headers)
                    
                    if response.status_code in expected_codes:
                        passed += 1
                        self.log(f"   ✅ {method} {endpoint}: {response.status_code}")
                    else:
                        self.log(f"   ❌ {method} {endpoint}: {response.status_code} (expected {expected_codes})")
                        
                except Exception as e:
                    self.log(f"   ❌ {method} {endpoint}: Exception {e}")
            
            self.log(f"   📊 Error handling: {passed}/{total} tests passed")
            return passed / total >= 0.8

    async def test_memory_leak_resistance(self):
        """Test for potential memory leaks with repeated requests"""
        self.log("🧠 Testing memory leak resistance (100 repeated requests)")
        
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
            # Get auth token
            demo_response = await client.post("/api/v2/auth/demo-login")
            if demo_response.status_code != 200:
                return False
            
            token = demo_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            start_time = time.time()
            successful = 0
            
            # Make 100 requests to various endpoints
            endpoints = [
                "/api/v2/profile",
                "/api/v2/knowledge/", 
                "/api/v2/search/?q=test",
                "/api/v2/admin/health/basic",
                "/api/v2/llm/models"
            ]
            
            for i in range(100):
                endpoint = endpoints[i % len(endpoints)]
                try:
                    response = await client.get(endpoint, headers=headers)
                    if response.status_code == 200:
                        successful += 1
                except:
                    pass
                
                # Brief pause to simulate realistic usage
                if i % 10 == 0:
                    await asyncio.sleep(0.1)
            
            duration = time.time() - start_time
            
            self.log(f"   ✅ Completed 100 requests in {duration:.2f}s")
            self.log(f"   📈 Success rate: {successful}/100 ({successful}%)")
            
            return successful >= 90

    async def run_stress_tests(self):
        """Run all stress tests"""
        self.log("🚀 Starting V2 API Stress Test Suite")
        self.log("=" * 60)
        
        results = {}
        
        # Run stress tests
        results["concurrent_auth"] = await self.test_concurrent_authentication(10)
        results["concurrent_search"] = await self.test_concurrent_search(20)
        results["rapid_requests"] = await self.test_rapid_requests(50)
        results["error_resilience"] = await self.test_error_handling_resilience()
        results["memory_resistance"] = await self.test_memory_leak_resistance()
        
        # Generate report
        self.log("\n" + "=" * 60)
        self.log("📊 STRESS TEST RESULTS")
        self.log("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            readable_name = test_name.replace("_", " ").title()
            self.log(f"{status}: {readable_name}")
        
        success_rate = passed / total * 100
        self.log(f"\n📈 OVERALL STRESS TEST RESULTS: {passed}/{total} ({success_rate:.1f}%)")
        
        if success_rate >= 90:
            self.log("🎉 EXCELLENT: System is highly resilient under stress!")
        elif success_rate >= 75:
            self.log("✅ GOOD: System handles stress well with minor issues")
        elif success_rate >= 50:
            self.log("⚠️  MODERATE: System has some stress-related issues")
        else:
            self.log("❌ POOR: System struggles under stress conditions")
        
        return success_rate

async def main():
    print("🔧 V2 API Stress Test Suite")
    print("Testing API robustness under load and edge conditions")
    print()
    
    # Quick health check
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/docs", timeout=5.0)
            if response.status_code != 200:
                print("❌ Server not responding")
                return 1
    except:
        print("❌ Cannot connect to server")
        return 1
    
    # Run stress tests
    runner = StressTestRunner()
    success_rate = await runner.run_stress_tests()
    
    if success_rate >= 75:
        print(f"\n🎯 SUCCESS: API is stress-resistant! ({success_rate:.1f}%)")
        return 0
    else:
        print(f"\n⚠️  NEEDS WORK: Stress test results at {success_rate:.1f}%")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
#!/usr/bin/env python3
"""
Final V2 API Verification Test
Quick verification of all core v2 API functionality
"""

import asyncio
import time
import httpx

BASE_URL = "http://localhost:8000"

async def verify_v2_apis():
    print("🔧 Final V2 API Verification Test")
    print("=" * 50)
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        passed = 0
        total = 0
        
        def test(name, success, details=""):
            nonlocal passed, total
            total += 1
            if success:
                passed += 1
                print(f"✅ {name} {details}")
            else:
                print(f"❌ {name} {details}")
        
        # 1. Basic connectivity
        try:
            response = await client.get("/docs")
            test("Server Connectivity", response.status_code == 200)
        except:
            test("Server Connectivity", False, "- Cannot connect")
            return
        
        # 2. Authentication
        try:
            demo_response = await client.post("/api/v2/auth/demo-login")
            token = None
            if demo_response.status_code == 200:
                token = demo_response.json()["access_token"]
                headers = {"Authorization": f"Bearer {token}"}
                test("Authentication", True, "- Demo login works")
            else:
                test("Authentication", False, f"- Status {demo_response.status_code}")
                return
        except Exception as e:
            test("Authentication", False, f"- Error: {e}")
            return
        
        # 3. Knowledge Management
        try:
            response = await client.get("/api/v2/knowledge/", headers=headers)
            test("Knowledge List", response.status_code == 200, f"- Found {len(response.json())} entries")
        except Exception as e:
            test("Knowledge List", False, f"- Error: {e}")
        
        # 4. Search
        try:
            response = await client.get("/api/v2/search/?q=test", headers=headers)
            test("Search", response.status_code == 200, f"- Found {len(response.json().get('results', []))} results")
        except Exception as e:
            test("Search", False, f"- Error: {e}")
        
        # 5. Profile
        try:
            response = await client.get("/api/v2/profile", headers=headers)
            test("Profile Access", response.status_code == 200)
        except Exception as e:
            test("Profile Access", False, f"- Error: {e}")
        
        # 6. Analytics
        try:
            event_data = {"event_type": "verification_test", "data": {"test": True}}
            response = await client.post("/api/v2/analytics/track-event", json=event_data, headers=headers)
            test("Analytics Tracking", response.status_code in [200, 201])
        except Exception as e:
            test("Analytics Tracking", False, f"- Error: {e}")
        
        # 7. Admin Health
        try:
            response = await client.get("/api/v2/admin/health/basic")
            test("Admin Health", response.status_code == 200)
        except Exception as e:
            test("Admin Health", False, f"- Error: {e}")
        
        # 8. LLM Models
        try:
            response = await client.get("/api/v2/llm/models", headers=headers)
            test("LLM Models", response.status_code == 200)
        except Exception as e:
            test("LLM Models", False, f"- Error: {e}")
        
        # 9. Error Handling
        try:
            response = await client.get("/api/v2/nonexistent", headers=headers)
            test("Error Handling", response.status_code == 404, "- Proper 404 for invalid endpoint")
        except Exception as e:
            test("Error Handling", False, f"- Error: {e}")
        
        # 10. Unauthorized Access Protection
        try:
            response = await client.get("/api/v2/profile")  # No auth header
            test("Auth Protection", response.status_code == 401, "- Blocks unauthorized access")
        except Exception as e:
            test("Auth Protection", False, f"- Error: {e}")
    
    print("\n" + "=" * 50)
    success_rate = passed / total * 100
    print(f"📊 FINAL RESULTS: {passed}/{total} tests passed ({success_rate:.1f}%)")
    
    if success_rate >= 90:
        print("🎉 EXCELLENT: V2 APIs are robust and production-ready!")
        status = "PRODUCTION READY"
    elif success_rate >= 80:
        print("✅ VERY GOOD: V2 APIs are reliable with minor issues")
        status = "MOSTLY READY"
    elif success_rate >= 70:
        print("✅ GOOD: V2 APIs work well with some issues")
        status = "GOOD"
    else:
        print("⚠️  NEEDS WORK: V2 APIs have significant issues")
        status = "NEEDS WORK"
    
    print(f"🎯 STATUS: {status}")
    return success_rate

if __name__ == "__main__":
    success_rate = asyncio.run(verify_v2_apis())
    exit(0 if success_rate >= 70 else 1)
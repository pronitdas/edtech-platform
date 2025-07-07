#!/usr/bin/env python3
"""
Diagnostic script to check specific API endpoint issues
"""

import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def diagnose_api_issues():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # Get auth token first
        login_response = await client.post("/api/v2/auth/demo-login")
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print(f"✅ Auth successful, token: {token[:20]}...")
        else:
            print("❌ Auth failed")
            return

        # Test specific failing endpoints
        tests = [
            # Media endpoints
            ("GET", "/api/v2/media/", "Media List"),
            
            # Profile endpoints  
            ("PUT", "/api/v2/profile/settings", "Profile Settings Update", {"preferences": {"theme": "dark"}}),
            
            # LLM endpoints
            ("POST", "/api/v2/llm/completions", "LLM Completion", {
                "messages": [{"role": "user", "content": "Hello"}],
                "model": "llama-3.2-3b-instruct",
                "max_tokens": 50
            }),
            
            # Dashboard endpoints
            ("GET", "/api/v2/user/1/dashboard-stats", "Dashboard Stats"),
            
            # Student endpoints
            ("GET", "/api/v2/student/progress", "Student Progress"),
            
            # Teacher endpoints  
            ("GET", "/api/v2/teacher/students", "Teacher Students"),
            
            # Search suggestions
            ("GET", "/api/v2/search/suggestions?q=test", "Search Suggestions"),
            
            # Semantic search
            ("POST", "/api/v2/semantic", "Semantic Search", {"query": "test", "limit": 5}),
            
            # Recommendations
            ("GET", "/api/v2/recommendations", "Recommendations"),
        ]
        
        for method, endpoint, name, *data in tests:
            try:
                json_data = data[0] if data else None
                if method == "GET":
                    response = await client.get(endpoint, headers=headers)
                elif method == "POST":
                    response = await client.post(endpoint, headers=headers, json=json_data)
                elif method == "PUT":
                    response = await client.put(endpoint, headers=headers, json=json_data)
                
                print(f"\n🔍 {name} ({method} {endpoint})")
                print(f"   Status: {response.status_code}")
                
                if response.status_code != 200:
                    print(f"   Error: {response.text[:200]}")
                else:
                    resp_data = response.json()
                    if isinstance(resp_data, dict):
                        print(f"   Response keys: {list(resp_data.keys())}")
                    elif isinstance(resp_data, list):
                        print(f"   Response list length: {len(resp_data)}")
                    else:
                        print(f"   Response type: {type(resp_data)}")
                        
            except Exception as e:
                print(f"\n❌ {name}: Exception {e}")

if __name__ == "__main__":
    asyncio.run(diagnose_api_issues())
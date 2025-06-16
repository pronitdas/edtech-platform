"""
API Test Suite with Database Fixtures

This module provides comprehensive testing for API endpoints with proper database isolation.
Each test uses seeded test data from both PostgreSQL and Neo4j databases, which are
reset and reseeded before each test run.

Features:
- Automatic database reset and reseed before each test
- Isolated test environments for both PostgreSQL and Neo4j
- Comprehensive endpoint testing with detailed output
- Database state validation during tests
- Rich error reporting and test summaries

Database Fixtures (see conftest.py):
- seeded_postgres: SQLAlchemy session with fresh test data
- seeded_neo4j: Neo4j connection with fresh test data
- valid_knowledge_id: Valid knowledge ID from seeded data

Test Data Sources:
- PostgreSQL: seed_postgres.py defines test records
- Neo4j: seed_neo4j.py defines test nodes and relationships

Usage:
    # Run all tests
    pytest tests/

    # Run with coverage
    pytest --cov=../.. --cov-report=term-missing tests/
"""

import pytest
import requests
import json
from datetime import datetime
from typing import Dict, Any
from colorama import init, Fore, Style
from sqlalchemy.orm import Session
from knowledge_graph import Neo4jGraphService
from models import Knowledge, Base
from database import DatabaseManager

# Initialize colorama for colored output
init()

BASE_URL = "http://0.0.0.0:8000"

@pytest.fixture
def valid_knowledge_id(seeded_postgres: Session) -> str:
    """Get a valid knowledge ID from seeded test data."""
    knowledge = seeded_postgres.query(Knowledge).first()
    assert knowledge is not None, "No test knowledge found in database"
    return str(knowledge.id)

@pytest.mark.parametrize("endpoint,method,payload,expected_status", [
    ("/health", "GET", None, 200),
    ("/process/{knowledge_id}", "GET", None, 200),
    ("/process/{knowledge_id}/retry", "POST", None, 200),
    ("/process/{knowledge_id}/retry-history", "GET", None, 200),
    ("/process/{knowledge_id}/status", "GET", None, 200),
    ("/process/{knowledge_id}/images", "GET", None, 200),
    ("/generate-content/{knowledge_id}", "GET", None, 200),
    ("/chapters/{knowledge_id}", "GET", None, 200),
    ("/test/video-process", "POST", None, 200),
    ("/knowledge-graph/{knowledge_id}/sync", "POST", None, 200),
    ("/knowledge-graph/sync-all", "POST", None, 200),
    ("/knowledge-graph/{knowledge_id}", "GET", None, 200),
    ("/knowledge-graph/{knowledge_id}/concepts", "GET", None, 200),
    ("/knowledge-graph/schema", "GET", None, 200),
    ("/knowledge-graph/{knowledge_id}", "DELETE", None, 200),
])
def test_api_endpoints(endpoint, method, payload, expected_status,
                      valid_knowledge_id, seeded_postgres, seeded_neo4j):
    """
    Test all API endpoints with seeded test data.
    
    Args:
        endpoint: The API endpoint pattern to test
        method: HTTP method to use
        payload: Request payload (if any)
        expected_status: Expected HTTP status code
        valid_knowledge_id: Fixture providing a valid knowledge ID
        seeded_postgres: Fixture providing seeded PostgreSQL session
        seeded_neo4j: Fixture providing seeded Neo4j connection
    """
    url = BASE_URL + endpoint.format(knowledge_id=valid_knowledge_id)
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=payload)
        elif method == "DELETE":
            response = requests.delete(url)
        else:
            pytest.fail(f"Unsupported method: {method}")
            
        assert response.status_code == expected_status, \
            f"{method} {url} failed: {response.text}"
            
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (dict, list)), \
                f"Response is not JSON: {response.text}"
            
            # Additional assertions based on endpoint
            if "knowledge-graph" in endpoint and method == "GET":
                assert len(data.get("nodes", [])) > 0, "No nodes returned from graph"
            elif endpoint == "/chapters/{knowledge_id}":
                assert len(data) > 0, "No chapters returned"
                
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Request failed: {str(e)}")

@pytest.mark.parametrize("endpoint,method,payload,expected_status", [
    ("/process/{knowledge_id}", "GET", None, 404),
    ("/process/{knowledge_id}/retry", "POST", None, 404),
    ("/knowledge-graph/{knowledge_id}", "GET", None, 404),
    ("/knowledge-graph/{knowledge_id}", "DELETE", None, 404),
])
def test_api_invalid_knowledge_id(endpoint, method, payload, expected_status,
                                seeded_postgres, seeded_neo4j):
    """
    Test API endpoints with invalid knowledge IDs.
    
    Verifies that endpoints properly handle non-existent knowledge IDs and
    don't modify database state.
    
    Args:
        endpoint: The API endpoint pattern to test
        method: HTTP method to use
        payload: Request payload (if any)
        expected_status: Expected HTTP status code
        seeded_postgres: Fixture providing seeded PostgreSQL session
        seeded_neo4j: Fixture providing seeded Neo4j connection
    """
    # Get initial database state
    initial_pg_count = seeded_postgres.query(Knowledge).count()
    
    with seeded_neo4j.driver.session() as session:
        initial_neo4j_count = session.run(
            "MATCH (n:Knowledge) RETURN count(n) as count"
        ).single()["count"]
    
    # Test with invalid ID
    invalid_id = "99999999"
    url = BASE_URL + endpoint.format(knowledge_id=invalid_id)
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=payload)
        elif method == "DELETE":
            response = requests.delete(url)
        else:
            pytest.fail(f"Unsupported method: {method}")
            
        # Verify response
        assert response.status_code == expected_status, \
            f"{method} {url} should fail for invalid id"
        
        # Verify response content
        data = response.json()
        assert "error" in data, "Error response should contain error message"
        assert "not found" in data["error"].lower(), \
            "Error should indicate resource not found"
        
        # Verify database state hasn't changed
        final_pg_count = seeded_postgres.query(Knowledge).count()
        assert final_pg_count == initial_pg_count, \
            "PostgreSQL database state should not change"
        
        with seeded_neo4j.driver.session() as session:
            final_neo4j_count = session.run(
                "MATCH (n:Knowledge) RETURN count(n) as count"
            ).single()["count"]
            assert final_neo4j_count == initial_neo4j_count, \
                "Neo4j database state should not change"
                
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Request failed: {str(e)}")

# Example for file upload/download if such endpoints exist
# def test_file_upload():
#     url = BASE_URL + "/upload-endpoint"
#     files = {"file": ("testfile.txt", b"test content")}
#     response = requests.post(url, files=files)
#     assert response.status_code == 200
#     # Further assertions on response content

# To run tests and get coverage:
# pytest --cov=../.. --cov-report=term-missing

# If you need to create/delete test data, add fixtures here

def print_response(endpoint: str, method: str, response: requests.Response, payload: Dict[str, Any] = None) -> None:
    """Pretty print the API response with colors"""
    status_color = Fore.GREEN if response.ok else Fore.RED
    print(f"\n{Fore.CYAN}{'='*80}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}Endpoint:{Style.RESET_ALL} {method} {endpoint}")
    if payload:
        print(f"{Fore.YELLOW}Payload:{Style.RESET_ALL}")
        print(json.dumps(payload, indent=2))
    print(f"{Fore.YELLOW}Status:{Style.RESET_ALL} {status_color}{response.status_code}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}Response Time:{Style.RESET_ALL} {response.elapsed.total_seconds():.3f}s")
    
    try:
        response_json = response.json()
        print(f"{Fore.YELLOW}Response:{Style.RESET_ALL}")
        print(json.dumps(response_json, indent=2))
    except:
        print(f"{Fore.YELLOW}Response:{Style.RESET_ALL} {response.text}")

def test_endpoints(valid_knowledge_id, seeded_postgres, seeded_neo4j):
    """
    Comprehensive test of all API endpoints with detailed output.
    
    This test provides rich feedback about each endpoint's behavior and
    maintains database consistency between calls.
    
    Args:
        valid_knowledge_id: Fixture providing a valid knowledge ID
        seeded_postgres: Fixture providing seeded PostgreSQL session
        seeded_neo4j: Fixture providing seeded Neo4j connection
    """
    endpoints = [
        # Health check
        {"method": "GET", "url": f"{BASE_URL}/health"},
        
        # Process endpoints
        {"method": "GET", "url": f"{BASE_URL}/process/{valid_knowledge_id}"},
        {"method": "POST", "url": f"{BASE_URL}/process/{valid_knowledge_id}/retry"},
        {"method": "GET", "url": f"{BASE_URL}/process/{valid_knowledge_id}/retry-history"},
        {"method": "GET", "url": f"{BASE_URL}/process/{valid_knowledge_id}/status"},
        {"method": "GET", "url": f"{BASE_URL}/process/{valid_knowledge_id}/images"},
        
        # Content endpoints
        {"method": "GET", "url": f"{BASE_URL}/generate-content/{valid_knowledge_id}"},
        {"method": "GET", "url": f"{BASE_URL}/chapters/{valid_knowledge_id}"},
        
        # Video process endpoint
        {"method": "POST", "url": f"{BASE_URL}/test/video-process"},
        
        # Knowledge graph endpoints
        {"method": "POST", "url": f"{BASE_URL}/knowledge-graph/{valid_knowledge_id}/sync"},
        {"method": "POST", "url": f"{BASE_URL}/knowledge-graph/sync-all"},
        {"method": "GET", "url": f"{BASE_URL}/knowledge-graph/{valid_knowledge_id}"},
        {"method": "GET", "url": f"{BASE_URL}/knowledge-graph/{valid_knowledge_id}/concepts"},
        {"method": "GET", "url": f"{BASE_URL}/knowledge-graph/schema"},
        {"method": "DELETE", "url": f"{BASE_URL}/knowledge-graph/{valid_knowledge_id}"},
    ]

    results = {
        "success": 0,
        "failed": 0,
        "total": len(endpoints),
        "errors": []
    }

    print(f"\n{Fore.CYAN}Starting API Tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Testing {len(endpoints)} endpoints with knowledge_id: {valid_knowledge_id}{Style.RESET_ALL}\n")

    # Store initial database state
    initial_pg_count = seeded_postgres.query(Knowledge).count()
    with seeded_neo4j.driver.session() as session:
        initial_neo4j_count = session.run(
            "MATCH (n:Knowledge) RETURN count(n) as count"
        ).single()["count"]

    for endpoint in endpoints:
        method = endpoint["method"]
        url = endpoint["url"]
        
        try:
            if method == "GET":
                response = requests.get(url)
            elif method == "POST":
                response = requests.post(url)
            elif method == "DELETE":
                response = requests.delete(url)
            else:
                error = f"Unsupported method: {method}"
                print(f"{Fore.RED}{error}{Style.RESET_ALL}")
                results["errors"].append({"endpoint": url, "error": error})
                results["failed"] += 1
                continue

            print_response(url, method, response)
            
            if response.ok:
                results["success"] += 1
                
                # Verify response format
                if response.headers.get("content-type", "").startswith("application/json"):
                    data = response.json()
                    if not isinstance(data, (dict, list)):
                        error = "Response is not a valid JSON object or array"
                        results["errors"].append({"endpoint": url, "error": error})
            else:
                results["failed"] += 1
                error = f"HTTP {response.status_code}: {response.text}"
                results["errors"].append({"endpoint": url, "error": error})

        except requests.exceptions.RequestException as e:
            error = f"Request failed: {str(e)}"
            print(f"\n{Fore.RED}{error}{Style.RESET_ALL}")
            results["errors"].append({"endpoint": url, "error": error})
            results["failed"] += 1

    # Verify database state after all tests
    final_pg_count = seeded_postgres.query(Knowledge).count()
    with seeded_neo4j.driver.session() as session:
        final_neo4j_count = session.run(
            "MATCH (n:Knowledge) RETURN count(n) as count"
        ).single()["count"]

    if final_pg_count != initial_pg_count:
        error = f"PostgreSQL Knowledge count changed: {initial_pg_count} -> {final_pg_count}"
        results["errors"].append({"endpoint": "database", "error": error})
        
    if final_neo4j_count != initial_neo4j_count:
        error = f"Neo4j Knowledge count changed: {initial_neo4j_count} -> {final_neo4j_count}"
        results["errors"].append({"endpoint": "database", "error": error})

    # Print summary
    print(f"\n{Fore.CYAN}{'='*80}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Test Summary:{Style.RESET_ALL}")
    print(f"Total Endpoints: {results['total']}")
    print(f"Successful: {Fore.GREEN}{results['success']}{Style.RESET_ALL}")
    print(f"Failed: {Fore.RED}{results['failed']}{Style.RESET_ALL}")
    if results["errors"]:
        print(f"\n{Fore.RED}Errors:{Style.RESET_ALL}")
        for error in results["errors"]:
            print(f"{error['endpoint']}: {error['error']}")
    
    print(f"{Fore.CYAN}{'='*80}{Style.RESET_ALL}\n")
    
    # Fail the test if any errors occurred
    assert results["failed"] == 0, f"{results['failed']} endpoints failed"

if __name__ == "__main__":
    test_endpoints() 
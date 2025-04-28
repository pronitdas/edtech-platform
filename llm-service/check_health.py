#!/usr/bin/env python3
"""
Health check script for LLM Inference Service
Checks if all services are running and responding properly
"""

import requests
import time
import sys
import os
from concurrent.futures import ThreadPoolExecutor

# Endpoint configuration
GATEWAY_URL = "http://localhost:8000"
MODEL_ENDPOINTS = {
    "llama-7b": "http://localhost:8001",
    "phi-3": "http://localhost:8002",
    "mistral-7b": "http://localhost:8003"
}
PROMETHEUS_URL = "http://localhost:9090"
GRAFANA_URL = "http://localhost:3000"

def check_endpoint(name, url, endpoint="/health", timeout=5):
    """Check if an endpoint is responding"""
    try:
        start_time = time.time()
        response = requests.get(f"{url}{endpoint}", timeout=timeout)
        latency = time.time() - start_time
        
        if response.status_code == 200:
            return True, f"{name}: OK (latency: {latency:.2f}s)"
        else:
            return False, f"{name}: Error - Status code {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"{name}: Error - {str(e)}"

def main():
    """Main function to check health of all services"""
    print("Running health check for LLM Inference Service...")
    print("=" * 50)
    
    all_checks = [
        ("API Gateway", GATEWAY_URL, "/health"),
        ("Prometheus", PROMETHEUS_URL, "/-/healthy"),
        ("Grafana", GRAFANA_URL, "/api/health"),
    ]
    
    # Add model endpoints
    for model_name, model_url in MODEL_ENDPOINTS.items():
        all_checks.append((f"Model: {model_name}", model_url, "/health"))
    
    # Run checks in parallel
    with ThreadPoolExecutor(max_workers=len(all_checks)) as executor:
        futures = [executor.submit(check_endpoint, name, url, endpoint) for name, url, endpoint in all_checks]
        
        all_healthy = True
        for future in futures:
            is_healthy, message = future.result()
            print(message)
            all_healthy = all_healthy and is_healthy
    
    print("=" * 50)
    
    if all_healthy:
        print("All services are healthy!")
        return 0
    else:
        print("Some services are not healthy. Please check the logs.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 
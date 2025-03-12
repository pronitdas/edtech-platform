#!/usr/bin/env python3
"""
Test script for the content generation endpoint.
"""

import os
import json
import asyncio
import argparse
import requests

# Default values
DEFAULT_API_URL = "http://localhost:8000"
DEFAULT_EDTECH_ID = "test-123"
DEFAULT_CHAPTER_ID = "test-456"
DEFAULT_KNOWLEDGE_ID = 789
DEFAULT_LANGUAGE = "English"
DEFAULT_CONTENT = """
# Introduction to Machine Learning

Machine learning is a field of artificial intelligence that uses statistical techniques to give computer systems the ability to "learn" from data, without being explicitly programmed. The name machine learning was coined in 1959 by Arthur Samuel.

## Supervised Learning

Supervised learning is the machine learning task of learning a function that maps an input to an output based on example input-output pairs. It infers a function from labeled training data consisting of a set of training examples.

## Unsupervised Learning

Unsupervised learning is a type of machine learning algorithm used to draw inferences from datasets consisting of input data without labeled responses. The most common unsupervised learning method is cluster analysis.

## Reinforcement Learning

Reinforcement learning is an area of machine learning concerned with how software agents ought to take actions in an environment so as to maximize some notion of cumulative reward.
"""

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Test the content generation endpoint")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="API URL")
    parser.add_argument("--edtech-id", default=DEFAULT_EDTECH_ID, help="EdTech ID")
    parser.add_argument("--chapter-id", default=DEFAULT_CHAPTER_ID, help="Chapter ID")
    parser.add_argument("--knowledge-id", type=int, default=DEFAULT_KNOWLEDGE_ID, help="Knowledge ID")
    parser.add_argument("--language", default=DEFAULT_LANGUAGE, help="Language")
    parser.add_argument("--content", default=DEFAULT_CONTENT, help="Content to generate from")
    parser.add_argument("--types", default="notes,summary", help="Types to generate (comma-separated)")
    return parser.parse_args()

def test_content_generation(args):
    """Test the content generation endpoint."""
    url = f"{args.api_url}/generate-content"
    
    # Prepare the request payload
    payload = {
        "edtech_id": args.edtech_id,
        "chapter": {
            "id": args.chapter_id,
            "chapter": args.content
        },
        "knowledge_id": args.knowledge_id,
        "types": args.types.split(","),
        "language": args.language
    }
    
    # Print the request details
    print(f"Sending request to {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    # Send the request
    try:
        response = requests.post(url, json=payload)
        
        # Print the response
        print(f"Response status code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success', False)}")
            if result.get("error"):
                print(f"Error: {result.get('error')}")
            else:
                print("Generated content:")
                data = result.get("data", [])
                if isinstance(data, list) and len(data) > 0:
                    for item in data:
                        print(f"  {item}")
                else:
                    print("  No content generated")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    args = parse_args()
    test_content_generation(args) 
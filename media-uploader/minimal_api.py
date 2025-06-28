#!/usr/bin/env python3
"""
Minimal working API for testing
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI(title="EdTech Platform API - Minimal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "EdTech Platform API is running!", "timestamp": datetime.utcnow()}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Basic auth endpoints
@app.post("/v2/auth/login")
async def login():
    return {"access_token": "test-token", "token_type": "bearer"}

@app.post("/v2/auth/register") 
async def register():
    return {"message": "User registered", "user_id": 1}

@app.get("/v2/knowledge")
async def get_knowledge():
    return {"items": [], "total": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
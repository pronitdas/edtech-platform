from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union, Generator
import os
import time
import torch
import json
import logging
import structlog
import asyncio
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from threading import Thread
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge

# Initialize logging
logger = structlog.get_logger()

# Setup metrics
REQUEST_COUNT = Counter('model_request_count', 'Count of requests', ['model'])
LATENCY = Histogram('model_request_latency_seconds', 'Latency of requests', ['model'])
TOKEN_COUNT = Counter('model_tokens_generated', 'Number of tokens generated', ['model'])
GPU_MEMORY = Gauge('model_gpu_memory_usage', 'GPU memory usage in bytes', ['model'])

# Get environment variables
MODEL_ID = os.getenv("MODEL_ID", "meta-llama/Llama-2-7b-hf")
MODEL_NAME = os.getenv("MODEL_NAME", "llama-7b")
DEVICE = os.getenv("DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
PRECISION = os.getenv("PRECISION", "float16")
MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", "1"))
MAX_TOTAL_TOKENS = int(os.getenv("MAX_TOTAL_TOKENS", "4096"))
USE_FLASH_ATTENTION = os.getenv("USE_FLASH_ATTENTION", "false").lower() == "true"
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN", None)

# Initialize FastAPI
app = FastAPI(
    title=f"LLM Model Server - {MODEL_NAME}",
    description=f"API for serving {MODEL_ID} model",
    version="1.0.0"
)

# Semaphore for request limiting
REQUEST_SEMAPHORE = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request and response models
class CompletionRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 1.0
    stream: Optional[bool] = False
    stop: Optional[Union[str, List[str]]] = None

class CompletionResponse(BaseModel):
    id: str
    object: str = "text_completion"
    created: int
    model: str
    choices: List[Dict[str, Any]]
    usage: Dict[str, int]

# Global model and tokenizer
model = None
tokenizer = None

def load_model():
    """Load the model and tokenizer"""
    global model, tokenizer
    
    logger.info(f"Loading {MODEL_ID} on {DEVICE}")
    start_time = time.time()
    
    # Config for model loading
    load_kwargs = {
        "use_auth_token": HF_TOKEN,
        "trust_remote_code": True,
    }
    
    # Set up model loading with appropriate dtype and device
    if PRECISION == "float16" and DEVICE == "cuda":
        load_kwargs["torch_dtype"] = torch.float16
    elif PRECISION == "bfloat16" and DEVICE == "cuda":
        load_kwargs["torch_dtype"] = torch.bfloat16
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_ID,
        **load_kwargs
    )
    
    # Load model with flash attention if available
    model_kwargs = {**load_kwargs}
    if USE_FLASH_ATTENTION and DEVICE == "cuda":
        model_kwargs["attn_implementation"] = "flash_attention_2"
    
    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        device_map=DEVICE,
        **model_kwargs
    )
    
    # Set up model for generation
    model.eval()
    
    # Log model loading time
    logger.info(f"Model loaded in {time.time() - start_time:.2f} seconds")

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()

def update_gpu_memory_metrics():
    """Update GPU memory metrics"""
    if DEVICE == "cuda" and torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            memory_allocated = torch.cuda.memory_allocated(i)
            GPU_MEMORY.labels(model=MODEL_NAME).set(memory_allocated)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model or tokenizer not loaded")
    
    # Update GPU memory metrics
    update_gpu_memory_metrics()
    
    return {"status": "healthy", "model": MODEL_ID, "device": DEVICE}

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return StreamingResponse(
        prometheus_client.generate_latest(),
        media_type="text/plain"
    )

def generate_text(prompt: str, 
                 max_tokens: int = 512, 
                 temperature: float = 0.7, 
                 top_p: float = 1.0,
                 stop: Optional[Union[str, List[str]]] = None) -> Dict[str, Any]:
    """Generate text from a prompt"""
    # Prepare inputs
    inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)
    input_tokens = inputs.input_ids.shape[1]
    
    # Set generation parameters
    generation_config = {
        "max_new_tokens": min(max_tokens, MAX_TOTAL_TOKENS - input_tokens),
        "temperature": temperature,
        "top_p": top_p,
        "pad_token_id": tokenizer.eos_token_id,
    }
    
    # Generate text
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            **generation_config
        )
    
    # Decode output
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Remove prompt from the beginning of the generated text
    completion = generated_text[len(tokenizer.decode(inputs.input_ids[0], skip_special_tokens=True)):]
    
    # Apply stop sequences if provided
    if stop:
        stop_list = [stop] if isinstance(stop, str) else stop
        for stop_seq in stop_list:
            if stop_seq in completion:
                completion = completion[:completion.index(stop_seq)]
    
    # Count tokens
    completion_tokens = len(tokenizer.encode(completion))
    TOKEN_COUNT.labels(model=MODEL_NAME).inc(completion_tokens)
    
    # Prepare response
    response = {
        "id": f"cmpl-{time.time_ns()}",
        "object": "text_completion",
        "created": int(time.time()),
        "model": MODEL_NAME,
        "choices": [
            {
                "text": completion,
                "index": 0,
                "logprobs": None,
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": input_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": input_tokens + completion_tokens
        }
    }
    
    return response

async def generate_stream(prompt: str, 
                         max_tokens: int = 512, 
                         temperature: float = 0.7, 
                         top_p: float = 1.0,
                         stop: Optional[Union[str, List[str]]] = None) -> Generator:
    """Generate text as a stream of tokens"""
    # Prepare inputs
    inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)
    input_tokens = inputs.input_ids.shape[1]
    
    # Set up streamer
    streamer = TextIteratorStreamer(tokenizer, timeout=60.0, skip_prompt=True, skip_special_tokens=True)
    
    # Set generation parameters
    generation_config = {
        "max_new_tokens": min(max_tokens, MAX_TOTAL_TOKENS - input_tokens),
        "temperature": temperature,
        "top_p": top_p,
        "streamer": streamer,
        "pad_token_id": tokenizer.eos_token_id,
    }
    
    # Generate in a separate thread
    thread = Thread(target=lambda: model.generate(
        **inputs,
        **generation_config
    ))
    thread.start()
    
    # Prepare initial SSE response
    response_id = f"cmpl-{time.time_ns()}"
    created = int(time.time())
    
    # Stream tokens
    completion_text = ""
    token_count = 0
    
    for token in streamer:
        token_count += 1
        completion_text += token
        
        # Check if we need to stop based on stop sequences
        should_stop = False
        if stop:
            stop_list = [stop] if isinstance(stop, str) else stop
            for stop_seq in stop_list:
                if stop_seq in completion_text:
                    completion_text = completion_text[:completion_text.index(stop_seq)]
                    should_stop = True
                    break
        
        # Prepare chunk
        chunk = {
            "id": response_id,
            "object": "text_completion",
            "created": created,
            "model": MODEL_NAME,
            "choices": [
                {
                    "text": token,
                    "index": 0,
                    "logprobs": None,
                    "finish_reason": None
                }
            ]
        }
        
        # Yield chunk as SSE
        yield f"data: {json.dumps(chunk)}\n\n"
        
        if should_stop:
            break
    
    # Final chunk with finish_reason
    final_chunk = {
        "id": response_id,
        "object": "text_completion",
        "created": created,
        "model": MODEL_NAME,
        "choices": [
            {
                "text": "",
                "index": 0,
                "logprobs": None,
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": input_tokens,
            "completion_tokens": token_count,
            "total_tokens": input_tokens + token_count
        }
    }
    
    TOKEN_COUNT.labels(model=MODEL_NAME).inc(token_count)
    yield f"data: {json.dumps(final_chunk)}\n\n"
    yield "data: [DONE]\n\n"

@app.post("/completion")
async def completion(request: CompletionRequest):
    """Text completion endpoint"""
    REQUEST_COUNT.labels(model=MODEL_NAME).inc()
    
    async with REQUEST_SEMAPHORE:
        start_time = time.time()
        
        # Handle streaming
        if request.stream:
            return StreamingResponse(
                generate_stream(
                    prompt=request.prompt,
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                    top_p=request.top_p,
                    stop=request.stop
                ),
                media_type="text/event-stream"
            )
        
        # Handle regular completion
        try:
            response = generate_text(
                prompt=request.prompt,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                top_p=request.top_p,
                stop=request.stop
            )
            
            end_time = time.time()
            LATENCY.labels(model=MODEL_NAME).observe(end_time - start_time)
            
            # Update GPU memory metrics
            update_gpu_memory_metrics()
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating completion: {e}")
            raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
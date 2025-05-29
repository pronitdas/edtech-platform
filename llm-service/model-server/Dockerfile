FROM huggingface/text-generation-inference:1.4

# Environment variables that will be provided in docker-compose
# MODEL_ID - Hugging Face model ID
# MODEL_NAME - Name for the model
# HUGGINGFACE_TOKEN - Token for accessing Hugging Face models
# USE_FLASH_ATTENTION - Whether to use Flash Attention for faster inference
# MAX_CONCURRENT_REQUESTS - Maximum number of concurrent requests
# MAX_TOTAL_TOKENS - Maximum total tokens for the model
# DEVICE - Device to run the model on (cuda/cpu)
# PRECISION - Precision for model inference (float16/float32)

# Set working directory
WORKDIR /data

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Command to start the text-generation-inference server
# The actual command will use the environment variables passed from docker-compose
ENTRYPOINT ["text-generation-launcher"]
CMD ["--model-id", "${MODEL_ID}", \
     "--hostname", "0.0.0.0", \
     "--port", "8000", \
     "--max-input-length", "4096", \
     "--max-total-tokens", "${MAX_TOTAL_TOKENS:-4096}", \
     "--max-concurrent-requests", "${MAX_CONCURRENT_REQUESTS:-1}", \
     "--trust-remote-code", \
     "--tensorrt-path", "/opt/tensorrt", \
     "--device", "${DEVICE:-cuda}", \
     "--revision", "main", \
     "--quantize", "${PRECISION:-float16}"]

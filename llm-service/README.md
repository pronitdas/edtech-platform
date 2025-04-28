# LLM Inference Service

This repository contains a Docker Compose setup for deploying a multi-model LLM inference service using Hugging Face models directly. It includes an API gateway, multiple LLM models, and monitoring infrastructure.

## Architecture

The system consists of the following components:

- **API Gateway**: FastAPI service that handles request routing and provides a unified API
- **LLM Services**: Multiple text-generation-inference containers serving different models:
  - Llama 3 8B Instruct
  - Phi-3 Mini 4K Instruct
  - Mistral 7B Instruct v0.2
- **Monitoring**: Prometheus and Grafana for metrics collection and visualization

## Prerequisites

- Docker and Docker Compose
- NVIDIA GPU with CUDA support
- NVIDIA Container Toolkit installed
- Hugging Face account and API token with read access to the models

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Required
HF_TOKEN=your_hugging_face_token

# Optional
API_KEY=your_custom_api_key
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure_password
```

### Hardware Requirements

Recommended minimum specifications:
- 16+ GB GPU VRAM for running all models simultaneously
- 32+ GB system RAM
- 100+ GB disk space

You can adjust which models to run based on your available hardware.

## Usage

### Starting the Service

```bash
# Start all services
docker-compose up -d

# Start specific models only
docker-compose up -d llm-gateway llama-7b prometheus grafana
```

### Stopping the Service

```bash
docker-compose down
```

### API Endpoints

The API Gateway provides the following endpoints:

- `GET /health`: Health check
- `GET /metrics`: Prometheus metrics
- `GET /v1/models`: List available models
- `POST /v1/completions`: Text completion endpoint
- `POST /v1/chat/completions`: Chat completion endpoint

Authentication is done via the API key, which can be provided as:
- Header: `Authorization: Bearer your_api_key`
- Query parameter: `?api_key=your_api_key`

### Example API Request

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{
    "model": "llama-7b",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is machine learning?"}
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

## Monitoring

- Prometheus UI: http://localhost:9090
- Grafana Dashboard: http://localhost:3000 (default login: admin/admin)

## Customization

### Adding/Changing Models

To add or change models, edit the `docker-compose.yml` file:

```yaml
new-model:
  image: ghcr.io/huggingface/text-generation-inference:1.4
  container_name: new-model
  command: --model-id organization/model-name
  environment:
    - HF_TOKEN=${HF_TOKEN}
  # Additional configuration...
```

Then update the `MODEL_SERVERS` environment variable in the `llm-gateway` service to include the new model.

### Model Performance Tuning

For better performance, you can adjust parameters in the TGI command:

```yaml
command: >
  --model-id organization/model-name
  --max-input-length 4096
  --max-total-tokens 8192
  --max-batch-prefill-tokens 4096
  --quantize bitsandbytes-nf4
```

## Troubleshooting

### Common Issues

1. **Models fail to start**: Check if your HF_TOKEN has proper permissions and your GPU has enough memory.

2. **API Gateway can't connect to models**: Ensure that the model services are running and healthy.

3. **Slow response times**: Adjust the quantization level, reduce model size, or allocate more resources.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 
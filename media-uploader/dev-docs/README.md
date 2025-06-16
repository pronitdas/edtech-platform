# Knowledge Processing API

A FastAPI application for processing PDF files, extracting content and images, and storing the processed data in a database.

## Features

- PDF processing with text and image extraction
- Automatic chapter detection and organization
- Image storage and management
- Retry capability for failed processing jobs
- Queue system for background processing
- RESTful API for interacting with the system
- AI-powered content generation using OpenAI

## Project Structure

The project is organized into several modules:

- `models.py`: Pydantic models for request/response validation
- `database.py`: Database operations using Supabase
- `pdf_processor.py`: PDF processing logic
- `queue_manager.py`: Job queue and processing thread management
- `api_routes.py`: FastAPI routes
- `main.py`: Application entry point
- `v2.py`: Legacy entry point (for backward compatibility)
- `openai_client.py`: OpenAI API client
- `openai_functions.py`: Content generation functions using OpenAI
- `prompts_config.py`: Prompt templates for OpenAI

## API Endpoints

### Processing Endpoints

- `GET /process/{knowledge_id}`: Start processing a knowledge entry
- `GET /process/{knowledge_id}/status`: Get the current processing status
- `POST /process/{knowledge_id}/retry`: Retry processing a failed knowledge entry
- `GET /process/{knowledge_id}/retry-history`: Get retry history for a knowledge entry
- `GET /process/{knowledge_id}/images`: Get the status of image uploads for a knowledge entry

### Upload Endpoints

- `POST /upload-pdf`: Upload and process a PDF file (test endpoint)
- `POST /upload-and-process`: Upload a PDF file and automatically start processing

### Content Generation Endpoints

- `POST /generate-content`: Generate educational content using OpenAI

### Utility Endpoints

- `GET /health`: Health check endpoint

## Retry Capability

The system now includes a robust retry mechanism for failed processing jobs:

1. Automatic retries with exponential backoff (5s, 30s, 2min)
2. Maximum retry limit (default: 3)
3. Manual retry option via API
4. Retry history tracking

## Image Processing

Images extracted from PDFs are now properly stored in Supabase storage:

1. Images are extracted during PDF processing
2. Each image is uploaded to `image/{knowledge_id}/{filename}`
3. Image metadata (width, height, page) is stored
4. Failed image uploads are tracked

## Content Generation

The system can generate various types of educational content using OpenAI:

1. Notes: Detailed notes with explanations of key concepts
2. Summary: Concise summary of the content
3. Quiz: Multiple-choice questions with answers
4. Mind Map: Visual representation of the content structure

### Content Generation Example

```bash
curl -X POST "http://localhost:8000/generate-content" \
  -H "Content-Type: application/json" \
  -d '{
    "edtech_id": "123",
    "chapter": {
      "id": "456",
      "chapter": "The content to generate from..."
    },
    "knowledge_id": 789,
    "types": ["notes", "summary", "quiz", "mindmap"],
    "language": "English"
  }'
```

## Usage

### Running the Application

```bash
# Using the new modular structure
python -m media-uploader.main

# Using the legacy entry point
python media-uploader/v2.py
```

### Processing a PDF

1. Upload a PDF file using the `/upload-and-process` endpoint
2. The file will be stored and processing will start automatically
3. Check the status using the `/process/{knowledge_id}/status` endpoint
4. If processing fails, use the `/process/{knowledge_id}/retry` endpoint to retry

## Frontend Integration

The frontend (`tardis-ui/src/services/edtech-content.ts`) has been updated to automatically trigger processing after file upload:

```typescript
// After successful upload, trigger the knowledge processing
if (fileType === 'doc' || fileType === 'pdf') {
    try {
        // Call the process/knowledge endpoint to start processing
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/process/${knowledge_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            console.warn(`Processing request for knowledge_id ${knowledge_id} returned status ${response.status}`);
            // We don't throw here to avoid failing the upload if processing fails
        } else {
            console.log(`Successfully triggered processing for knowledge_id ${knowledge_id}`);
        }
    } catch (error) {
        console.warn(`Failed to trigger processing for knowledge_id ${knowledge_id}:`, error);
        // We don't throw here to avoid failing the upload if processing fails
    }
}
```

## Environment Variables

- `SUPABASE_URL`: Supabase URL (default: 'https://onyibiwnfwxatadlkygz.supabase.co')
- `SUPABASE_KEY`: Supabase API key
- `NEXT_PUBLIC_API_URL`: API URL for frontend integration (default: 'http://localhost:8000')
- `OPENAI_API_KEY`: OpenAI API key for content generation

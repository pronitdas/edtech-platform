# Video Processing Integration

This document explains the video processing functionality that has been integrated into the EdTech knowledge processing pipeline.

## Overview

The system now supports processing video files in addition to PDF/document files. When a video file is detected (by its extension), it follows a different processing pipeline:

1. **Transcription**: The video audio is transcribed using OpenAI's Whisper model.
2. **Structured Content Generation**: The transcription is sent to GPT-4o-mini to generate structured educational content in Markdown format.
3. **Content Organization**: The Markdown content is parsed to extract a hierarchical structure.
4. **Chapter Creation**: The structured content is split into chapters and stored in the database.

## Supported Video Formats

The system supports the following video formats:
- MP4 (.mp4)
- QuickTime (.mov)
- AVI (.avi)
- MKV (.mkv)
- WebM (.webm)
- M4V (.m4v)

## Testing the Video Processing

You can test the video processing functionality using the test endpoint:

```
POST /test/video-process
```

This endpoint accepts the following form parameters:
- `file`: The video file to process
- `knowledge_id`: ID to associate with the processed content
- `knowledge_name`: Name of the knowledge entry
- `whisper_model` (optional): Whisper model to use (tiny, base, small, medium, large)
- `openai_model` (optional): OpenAI model to use for content generation

Example using curl:
```bash
curl -X POST "http://localhost:8000/test/video-process" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/video.mp4" \
  -F "knowledge_id=123" \
  -F "knowledge_name=Sample Video Lecture" \
  -F "whisper_model=base" \
  -F "openai_model=gpt-4o-mini"
```

## Normal Processing Flow

For normal processing through the regular API, you can use the same workflow as document processing:

1. Upload the video file to the storage.
2. Create a knowledge entry in the database with the video filename.
3. Call the processing endpoint:
```
GET /process/{knowledge_id}
```

The system will detect if the file is a video based on its extension and automatically use the video processing pipeline.

## Configuration

The video processing uses the following default models:
- Whisper: `base` (options: tiny, base, small, medium, large)
- OpenAI: `gpt-4o-mini`

These can be configured through environment variables or directly passed to the test endpoint.

## Dependencies

This functionality requires the following additional dependencies:
- `torch`
- `openai-whisper`
- `ffmpeg` (system dependency)
- Audio libraries: `libsndfile1`, `libportaudio2`

These are all included in the updated requirements.txt and Dockerfile. 
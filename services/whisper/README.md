# Whisper Transcription Service

A FastAPI-based transcription service using OpenAI Whisper.

## Configuration

Set the following environment variable:

-   `WHISPER_PORT`: Port to expose the service (default: 5001)

## Running

```bash
# Start the service
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

## Usage

The service provides an OpenAI-compatible transcription endpoint:

```bash
curl -X POST "http://localhost:${WHISPER_PORT:-5001}/v1/audio/transcriptions" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.mp3" \
  -F "model=whisper-1" \
  -F "language=es" \
  -F "response_format=json"
```

## Health Check

Check service status:

```bash
curl http://localhost:${WHISPER_PORT:-5001}/status
```

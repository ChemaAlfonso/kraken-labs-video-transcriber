from fastapi import FastAPI, UploadFile, Form, HTTPException, Header
from fastapi.responses import PlainTextResponse, JSONResponse
import whisper
import tempfile
import os

app = FastAPI()

MODEL_MAP = {
    "whisper-1": "base",  # default
    "tiny": "tiny",
    "base": "base",
    "small": "small",
    "medium": "medium",
    "large": "large",
}


@app.get("/status")
def status():
    return {"status": "ok"}


@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile,
    model: str = Form("whisper-1"),
    language: str = Form("es"),
    response_format: str = Form("json"),
    authorization: str = Header(None),
):
    model_name = MODEL_MAP.get(model, "base")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        loaded_model = whisper.load_model(model_name, download_root="/app/models")
        result = loaded_model.transcribe(tmp_path, language=language)

        if response_format == "text":
            return PlainTextResponse(result["text"].strip())

        elif response_format == "json":
            return JSONResponse(
                {
                    "text": result["text"].strip(),
                    "language": result.get("language", language),
                    "segments": [
                        {
                            "start": seg["start"],
                            "end": seg["end"],
                            "text": seg["text"].strip(),
                        }
                        for seg in result["segments"]
                    ],
                }
            )

        elif response_format == "verbose_json":
            return result

        else:
            raise HTTPException(status_code=400, detail="Unsupported response_format")

    finally:
        os.unlink(tmp_path) 
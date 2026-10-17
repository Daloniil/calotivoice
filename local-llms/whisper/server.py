"""
Local STT upstream (faster-whisper). Called by Go STT API, not by the mobile app.

Later: replace this process with a hosted Whisper/STT API; Go keeps STT_UPSTREAM_URL.
"""
from __future__ import annotations

import os
import tempfile
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")

_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    if _model is None:
        raise RuntimeError("Whisper model is not loaded yet")
    return _model


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model
    print(f"Loading Whisper model={MODEL_SIZE} device={DEVICE} compute={COMPUTE_TYPE}…", flush=True)
    _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    print("Whisper model ready.", flush=True)
    yield
    _model = None


app = FastAPI(title="calorivoice-whisper", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> JSONResponse:
    if _model is None:
        return JSONResponse(status_code=503, content={"status": "loading", "model": MODEL_SIZE})
    return JSONResponse(content={"status": "ok", "model": MODEL_SIZE})


@app.post("/v1/transcribe")
async def transcribe(audio: UploadFile = File(...)) -> JSONResponse:
    if _model is None:
        return JSONResponse(status_code=503, content={"error": "model loading"})

    suffix = ".m4a"
    if audio.filename and "." in audio.filename:
        suffix = "." + audio.filename.rsplit(".", 1)[-1].lower()

    body = await audio.read()
    if not body:
        return JSONResponse(status_code=400, content={"error": "empty audio"})

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
        tmp.write(body)
        tmp.flush()
        segments, info = get_model().transcribe(
            tmp.name,
            beam_size=5,
            vad_filter=True,
        )
        text = " ".join(s.text.strip() for s in segments if s.text.strip()).strip()

    payload: dict[str, Any] = {
        "text": text,
        "language": info.language,
        "language_probability": round(float(info.language_probability), 4),
        "duration_sec": round(float(info.duration), 3) if info.duration else None,
        "model": MODEL_SIZE,
    }
    return JSONResponse(content=payload)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8091"))
    host = os.environ.get("WHISPER_BIND", "127.0.0.1")
    uvicorn.run(app, host=host, port=port, log_level="info")

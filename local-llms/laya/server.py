"""
Local Laya upstream (Jev-compatible POST /v1/systemone). Used by Go guard, not by the mobile app.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

import laya

_agent: Optional[laya.Agent] = None
_MODEL_ID = os.environ.get("LAYA_MODEL_ID", "convaiinnovations/laya")
_SUBFOLDER = os.environ.get("LAYA_SUBFOLDER", os.environ.get("LAYA_MODELS", "multilingual"))


class SystemOneRequest(BaseModel):
    model: Optional[str] = None
    state: str
    questions: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _agent
    print(
        f"Loading Laya model={_MODEL_ID} subfolder={_SUBFOLDER}…",
        flush=True,
    )
    _agent = laya.load(_MODEL_ID, subfolder=_SUBFOLDER or None)
    print("Laya model ready.", flush=True)
    yield
    _agent = None


app = FastAPI(title="calorivoice-laya", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health() -> JSONResponse:
    if _agent is None:
        return JSONResponse(status_code=503, content={"status": "loading"})
    return JSONResponse(content={"status": "ok", "model": _MODEL_ID, "subfolder": _SUBFOLDER})


@app.post("/v1/systemone")
def systemone(body: SystemOneRequest) -> JSONResponse:
    if _agent is None:
        return JSONResponse(status_code=503, content={"error": "model loading"})
    if not body.questions:
        return JSONResponse(status_code=400, content={"error": "questions required"})

    out = _agent.system_one(body.state, body.questions)
    if body.model:
        out["model"] = body.model
    return JSONResponse(content=out)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("LAYA_PORT", os.environ.get("PORT", "8092")))
    host = os.environ.get("LAYA_HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=port, log_level="info")

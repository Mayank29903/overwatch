from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import time

from app.services.transformer import transform_dispatch_text
from app.services.rime import synthesize_audio

router = APIRouter()

class DispatchRequest(BaseModel):
    raw_text: str
    speed_alpha: float = 1.0
    speaker: str = "astra"

class DispatchResponse(BaseModel):
    standard_text: str
    overwatch_text: str
    standard_audio_b64: Optional[str] = None
    overwatch_audio_b64: Optional[str] = None
    groq_latency_ms: Optional[int] = None
    rime_standard_latency_ms: Optional[int] = None
    rime_overwatch_latency_ms: Optional[int] = None
    total_latency_ms: Optional[int] = None

@router.post("/process-dispatch", response_model=DispatchResponse)
async def process_dispatch(request: DispatchRequest):
    rime_key = os.environ.get("RIME_API_KEY")
    if not rime_key or rime_key == "your_rime_api_key_here":
        raise HTTPException(status_code=500, detail="RIME_API_KEY is missing")

    total_start = time.time()

    # 1. Transform text
    groq_start = time.time()
    transformed = await transform_dispatch_text(request.raw_text)
    groq_ms = int((time.time() - groq_start) * 1000)

    standard_text = transformed.get("standard_text", request.raw_text)
    overwatch_text = transformed.get("overwatch_text", request.raw_text)

    # 2. Rime: Standard version (normal speed, same speaker)
    rime_std_start = time.time()
    standard_audio = await synthesize_audio(
        text=standard_text,
        modelId="mist-v3",
        speaker=request.speaker,
        speedAlpha=1.0,
        reduceLatency=True
    )
    rime_std_ms = int((time.time() - rime_std_start) * 1000)

    # 3. Rime: Overwatch version (user-selected speed, same speaker)
    rime_ow_start = time.time()
    overwatch_audio = await synthesize_audio(
        text=overwatch_text,
        modelId="mist-v3",
        speaker=request.speaker,
        speedAlpha=request.speed_alpha,
        reduceLatency=True
    )
    rime_ow_ms = int((time.time() - rime_ow_start) * 1000)

    total_ms = int((time.time() - total_start) * 1000)

    return DispatchResponse(
        standard_text=standard_text,
        overwatch_text=overwatch_text,
        standard_audio_b64=standard_audio,
        overwatch_audio_b64=overwatch_audio,
        groq_latency_ms=groq_ms,
        rime_standard_latency_ms=rime_std_ms,
        rime_overwatch_latency_ms=rime_ow_ms,
        total_latency_ms=total_ms,
    )

import os
import struct
import httpx
import re
from fastapi import HTTPException
import base64

MAX_RIME_TEXT_LEN = 500  # Rime limit is around 1000 chars, keep safe margin

def prepare_text_for_rime(text: str) -> str:
    """
    Clean text for Rime API. Convert spell("XYZ") into spaced-out characters.
    """
    def expand_spell(match):
        content = match.group(1)
        return ". ".join(list(content)) + "."
    
    text = re.sub(r'spell\("([^"]+)"\)', expand_spell, text)
    return text

def split_text_into_chunks(text: str, max_len: int = MAX_RIME_TEXT_LEN) -> list[str]:
    """
    Split text into chunks at sentence boundaries, keeping each under max_len.
    """
    # Split on sentence-ending punctuation
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current = ""
    
    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= max_len:
            current = (current + " " + sentence).strip()
        else:
            if current:
                chunks.append(current)
            # If single sentence is too long, split on commas
            if len(sentence) > max_len:
                parts = sentence.split(", ")
                sub = ""
                for part in parts:
                    if len(sub) + len(part) + 2 <= max_len:
                        sub = (sub + ", " + part).strip(", ")
                    else:
                        if sub:
                            chunks.append(sub)
                        sub = part
                if sub:
                    chunks.append(sub)
                current = ""
            else:
                current = sentence
    
    if current:
        chunks.append(current)
    
    return chunks if chunks else [text[:max_len]]

def pcm_to_wav(pcm_data: bytes, sample_rate: int = 22050, num_channels: int = 1, bits_per_sample: int = 16) -> bytes:
    """Wraps raw PCM bytes in a proper WAV header."""
    data_size = len(pcm_data)
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF', 36 + data_size, b'WAVE',
        b'fmt ', 16, 1, num_channels,
        sample_rate, byte_rate, block_align, bits_per_sample,
        b'data', data_size
    )
    return header + pcm_data

async def _call_rime(client: httpx.AsyncClient, text: str, headers: dict, payload_base: dict) -> bytes:
    """Call Rime for a single text chunk, return raw PCM bytes."""
    payload = {**payload_base, "text": text}
    
    response = await client.post("https://users.rime.ai/v1/rime-tts", json=payload, headers=headers)
    
    if response.status_code != 200:
        print(f"[Rime] Error {response.status_code}: {response.text}")
        raise HTTPException(status_code=502, detail=f"Rime error: {response.text}")
    
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        data = response.json()
        b64 = data.get("audioContent")
        if b64:
            return base64.b64decode(b64)
        raise HTTPException(status_code=502, detail="No audioContent")
    
    return response.content

async def synthesize_audio(text: str, modelId: str = "mist-v3", speaker: str = "astra", speedAlpha: float = 1.0, reduceLatency: bool = False) -> str:
    """
    Calls Rime TTS REST API. Splits long text into chunks, synthesizes each,
    concatenates PCM, wraps in WAV header, returns Base64.
    """
    rime_key = os.environ.get("RIME_API_KEY")
    cleaned_text = prepare_text_for_rime(text)
    
    headers = {
        "Authorization": f"Bearer {rime_key}",
        "Content-Type": "application/json"
    }

    payload_base = {
        "speaker": speaker,
        "modelId": modelId,
        "audioFormat": "pcm",
        "speedAlpha": speedAlpha,
        "reduceLatency": reduceLatency,
        "samplingRate": 22050,
    }
    if "mist" in modelId:
        payload_base["phonemizeBetweenBrackets"] = True

    # Split into chunks if text is too long
    chunks = split_text_into_chunks(cleaned_text)
    print(f"[Rime] Processing {len(chunks)} chunk(s), total len={len(cleaned_text)}")

    try:
        all_pcm = b""
        async with httpx.AsyncClient(timeout=30.0) as client:
            for i, chunk in enumerate(chunks):
                print(f"[Rime] Chunk {i+1}/{len(chunks)}: {len(chunk)} chars")
                pcm = await _call_rime(client, chunk, headers, payload_base)
                all_pcm += pcm
        
        wav_bytes = pcm_to_wav(all_pcm, sample_rate=22050)
        audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")
        print(f"[Rime] Done! {len(chunks)} chunks -> {len(wav_bytes)} bytes WAV")
        return audio_b64
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Rime] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Rime failed: {str(e)}")

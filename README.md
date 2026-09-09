# Overwatch.AI — Tactical Dispatch Voice Engine

> **Hard Voice Problem:** Pronunciation and Controlled Delivery  
> **Speech Provider:** Rime TTS (mist-v3)  
> **LLM Provider:** Groq (qwen/qwen3.8-27b)

## Problem Statement

Emergency dispatchers relay critical information — license plates, street names, drug names, badge numbers — using compressed shorthand over radio. Standard TTS engines butcher this data:

- **License plate `7XYZ892`** → read as one fast word, officer can't copy it
- **Street name `Schuylkill`** → mispronounced as "Shull-kill" 
- **Drug name `Rivaroxaban`** → garbled beyond recognition
- **Badge name `Krzyzewski`** → completely unintelligible

**Mispronounced dispatches can cost lives.** Officers go to wrong locations, paramedics administer wrong medications.

## Solution Architecture

```
┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐
│   Frontend   │    │   FastAPI Backend  │    │   External APIs  │
│  React/Vite  │───▶│                   │───▶│                  │
│  Tailwind v4 │    │  POST /api/v1/    │    │  Groq LLM API    │
│              │◀───│  process-dispatch │◀───│  Rime TTS API    │
└──────────────┘    └───────────────────┘    └──────────────────┘
```

### Pipeline Flow

1. **Raw Dispatch Input** → User types or speaks shorthand dispatch text
2. **Groq LLM Transform** → AI rewrites text with IPA phonemes + spell() tags
3. **Rime TTS (Standard)** → Generates baseline audio from standard text
4. **Rime TTS (Overwatch)** → Generates optimized audio with phoneme injection
5. **Side-by-Side Comparison** → User hears both, sees word-level diff

## Rime Integration Details

| Parameter | Value |
|---|---|
| **Model ID** | `mist-v3` |
| **Speaker** | `astra` (default), `celeste`, `luna`, `hudson` (selectable) |
| **Language** | English (en-US) |
| **Endpoint** | `https://users.rime.ai/v1/rime-tts` |
| **Audio Format** | `pcm` (raw PCM, wrapped in WAV header server-side) |
| **Transport** | REST (HTTPS POST, JSON payload, binary PCM response) |
| **Sample Rate** | 22050 Hz, 16-bit, mono |
| **Key Feature** | `phonemizeBetweenBrackets: true` — enables IPA injection via `{phonemes}` |
| **Speed Control** | `speedAlpha` (0.5–1.5, user-adjustable slider) |

## Features

- **IPA Phoneme Injection** — Difficult names wrapped in `{IPA}` for perfect pronunciation
- **Spell Function** — License plates/codes expanded character-by-character via `spell()`
- **Speed Control Slider** — Adjust `speedAlpha` from 0.5x (slow critical data) to 1.5x (fast context)
- **4-Voice Comparison** — Same dispatch rendered by Astra, Celeste, Luna, Hudson
- **Word-Level Diff** — Color-coded highlighting of IPA, spell(), and modified words
- **Live Microphone Input** — Browser Speech Recognition → Overwatch pipeline
- **Stress Test Runner** — Automated benchmark of all 4 presets with latency metrics
- **Audio Download** — Export before/after WAV files as evidence artifacts
- **Per-Stage Latency** — Groq ms, Rime standard ms, Rime overwatch ms breakdown

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Rime API key (from [rime.ai](https://rime.ai))
- Groq API key (from [console.groq.com](https://console.groq.com))

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

Create `.env` in `backend/`:
```
RIME_API_KEY=your_rime_api_key
GROQ_API_KEY=your_groq_api_key
```

Start:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Third-Party Services

| Service | Purpose | Model/Version |
|---|---|---|
| **Rime TTS** | Text-to-speech with phoneme support | mist-v3, REST API |
| **Groq** | Fast LLM inference for text transformation | qwen/qwen3.8-27b |
| **Browser Speech API** | Live microphone transcription | Built-in (Chrome) |

## Known Limitations

1. **Rime text length limit** — Texts >500 chars are split into sentence-level chunks. Slight pauses may occur at chunk boundaries.
2. **Groq model availability** — Falls back through model list if primary is unavailable; worst case uses mock transform.
3. **Browser STT** — Microphone input uses `webkitSpeechRecognition`, Chrome-only. Falls back gracefully with alert.
4. **PCM format** — Rime returns raw PCM regardless of `audioFormat` parameter; we wrap in WAV header server-side.
5. **IPA accuracy** — LLM-generated IPA is approximate; production would use a curated pronunciation dictionary.

## Failure Behavior

| Failure | Behavior |
|---|---|
| Rime API down | HTTP 502, error shown in UI |
| Groq API down | Falls back to mock transform (hardcoded IPA for demo presets) |
| Text too long | Auto-split into chunks, each sent separately |
| Invalid API key | HTTP 500 with clear error message |
| Browser STT unsupported | Alert message, text input still works |

## Project Structure

```
OverWatch/
├── backend/
│   ├── main.py                          # FastAPI entry point
│   ├── requirements.txt                 # Python dependencies
│   ├── .env                             # API keys (not in repo)
│   ├── .env.example                     # Template
│   └── app/
│       ├── api/tts.py                   # Dispatch processing endpoint
│       └── services/
│           ├── rime.py                  # Rime TTS client + WAV encoding
│           └── transformer.py           # Groq LLM text transform
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                      # Main app
│       ├── index.css                    # Tactical design system
│       └── components/
│           ├── Header.jsx
│           ├── StatusBar.jsx
│           ├── DispatchInput.jsx         # Input + speed slider + voice selector
│           ├── ComparisonView.jsx        # Side-by-side audio comparison
│           ├── EvidencePanel.jsx         # Transform evidence + latency
│           ├── TextDiff.jsx              # Word-level diff highlighting
│           ├── MultiVoice.jsx            # 4-voice comparison
│           ├── MicInput.jsx              # Live microphone input
│           └── StressTest.jsx            # Automated benchmark runner
├── README.md
├── RIME_EVIDENCE.md
└── demo.mp4                             # 4-5 min demo video
```

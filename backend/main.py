from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import tts
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Overwatch.AI Tactical Dispatch API")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tts.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok", "system": "Overwatch.AI"}

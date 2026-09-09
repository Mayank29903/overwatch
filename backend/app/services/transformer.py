import os
import json
from groq import AsyncGroq
import re

async def transform_dispatch_text(raw_text: str) -> dict:
    """
    The "Writing for the ear" Engine.
    Uses Groq LLM to translate shorthand dispatch into two formats:
    1. Standard English (what regular TTS will read and butcher).
    2. Overwatch SSML/Phoneme injected (what Rime will read perfectly).
    """
    groq_key = os.environ.get("GROQ_API_KEY")
    
    if not groq_key or groq_key == "your_groq_api_key_here":
        return apply_mock_transform(raw_text)

    client = AsyncGroq(api_key=groq_key)
    
    prompt = f"""You are a tactical dispatch audio engineer. Your job is to rewrite dispatch shorthand for text-to-speech.

Take the raw dispatch text below and return TWO versions as a JSON object.

RULES:
- standard_text: Expand abbreviations (SB=Southbound, NB=Northbound, hx=history, QD=once daily, BID=twice daily, etc). Keep street names and plates as normal text.
- overwatch_text: Same as standard but with these Rime TTS optimizations:
  * Wrap license plates/codes in spell("...") so they are spelled out character by character
  * Replace hard-to-pronounce street names with IPA in curly braces like {{phonetic}}
  * Add commas for natural breathing pauses

Reply with ONLY this JSON, nothing else:
{{"standard_text": "...", "overwatch_text": "..."}}

RAW TEXT: {raw_text}"""

    # Try models in order
    models = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b", "openai/gpt-oss-20b"]
    
    for model in models:
        try:
            print(f"[Groq] Trying model: {model}")
            completion = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=2000,
            )
            
            raw_response = completion.choices[0].message.content.strip()
            print(f"[Groq] Raw response: {raw_response[:200]}")
            
            # Handle thinking tags from qwen models
            if "</think>" in raw_response:
                raw_response = raw_response.split("</think>")[-1].strip()
            
            # Extract JSON from response (handle markdown code blocks)
            json_str = raw_response
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()
            
            # Find JSON object in response
            start = json_str.find("{")
            end = json_str.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = json_str[start:end]
            
            result = json.loads(json_str)
            
            if "standard_text" in result and "overwatch_text" in result:
                print(f"[Groq] Success with {model}")
                return result
            else:
                print(f"[Groq] Missing keys in response from {model}")
                continue
                
        except Exception as e:
            print(f"[Groq] Model {model} failed: {e}")
            continue
    
    print("[Groq] All models failed, using mock transform")
    return apply_mock_transform(raw_text)

def apply_mock_transform(raw_text: str) -> dict:
    """Fallback if Groq fails or no API key is provided."""
    
    if "7XYZ892" in raw_text or "Schuylkill" in raw_text:
        return {
            "standard_text": "Code 3. Suspect fleeing Southbound on I-95 in a gray Honda Civic, plate 7XYZ892. Headed towards Schuylkill Expressway. Suspect armed with AR-15. Officer needs backup at 48th and Wyalusing.",
            "overwatch_text": 'Code 3. Suspect fleeing Southbound on I-95, in a gray Honda Civic, plate spell("7XYZ892"). Headed towards {sku-kɪl} Expressway. Suspect armed with A R 15. Officer needs backup, at 48th and {waɪ-ə-lu-sɪŋ}.'
        }
    
    if "Rivaroxaban" in raw_text or "AFib" in raw_text:
        return {
            "standard_text": "Code 2. 67 year old male, history of atrial fibrillation. Currently on Rivaroxaban 20 milligrams once daily and Metoprolol Succinate 50 milligrams twice daily. Blood pressure 88 over 52, heart rate 142 irregular. Glasgow Coma Scale 13. Loss of consciousness at 2847 Passyunk Avenue, unit 3F. Advanced Life Support intercept requested. Patient allergic to Amiodarone.",
            "overwatch_text": 'Code 2. 67 year old male, history of atrial fibrillation. Currently on {ri-va-rox-a-ban} 20 milligrams once daily, and {me-to-pro-lol} Succinate 50 milligrams twice daily. Blood pressure 88 over 52, heart rate 142 irregular. Glasgow Coma Scale 13. Loss of consciousness at spell("2847") {pa-sjʌŋk} Avenue, unit 3F. Advanced Life Support intercept requested. Patient allergic to {a-mi-o-da-ron}.'
        }
    
    if "HAZMAT" in raw_text or "Sulfuric" in raw_text:
        return {
            "standard_text": "HAZMAT Level 2. Tanker rollover Northbound I-476 at mile post 12.3. Placard 1830, Sulfuric Acid, UN 1830. Driver conscious, chemical burn left upper extremity. Evacuation radius 1000 feet. Wind north-northwest at 12 knots. Incident commander is Battalion Chief Krzyzewski, badge 4418. Requesting HAZMAT team and Decon unit to staging at Conshohocken Road exit.",
            "overwatch_text": 'HAZMAT Level 2. Tanker rollover Northbound I-476, at mile post 12.3. Placard spell("1830"), Sulfuric Acid, UN spell("1830"). Driver conscious, chemical burn left upper extremity. Evacuation radius 1000 feet. Wind north-northwest at 12 knots. Incident commander is Battalion Chief {kʃɪ-ʒɛf-ski}, badge spell("4418"). Requesting HAZMAT team and Decon unit, to staging at {kɑn-ʃə-hɑ-kən} Road exit.'
        }
    
    if "Nguyen" in raw_text or "Silver Alert" in raw_text:
        return {
            "standard_text": "Silver Alert. Missing: Nguyen, Thi Bich, date of birth March 14, 1941. Last seen at 1430 hours at 1200 Cheltenham Avenue wearing a blue cardigan and gray slacks. Diagnosed with Alzheimer's. No cell phone. Vehicle: 2019 Hyundai Tucson, Pennsylvania plate KYJ-4821. Contact Detective Anastasiadis at extension 4477.",
            "overwatch_text": 'Silver Alert. Missing: {ŋwiɛn}, Thi Bich, date of birth March fourteenth, nineteen forty-one. Last seen at fourteen thirty hours, at 1200 {tʃɛl-tən-əm} Avenue, wearing a blue cardigan and gray slacks. Diagnosed with Alzheimer\'s. No cell phone. Vehicle: 2019 Hyundai Tucson, Pennsylvania plate spell("KYJ-4821"). Contact Detective {a-na-sta-si-a-dis}, at extension spell("4477").'
        }
    
    # Default: return as-is for both
    return {
        "standard_text": raw_text,
        "overwatch_text": raw_text
    }

# RIME_EVIDENCE.md — Overwatch.AI

## Hard Voice Claim

**Pronunciation and Controlled Delivery for Emergency Dispatch**

Standard TTS engines fail catastrophically on dispatch-critical data: license plates, ethnic street names, pharmaceutical names, and foreign-origin surnames. Overwatch.AI uses Rime's `mist-v3` model with `phonemizeBetweenBrackets: true` and an LLM-powered "Writing for the Ear" engine to produce intelligible, correctly-paced audio.

---

## Acceptance Tests

### Test 1: License Plate Spelling (Vehicle Pursuit)

**Input:**
```
Code 3. Suspect fleeing SB on I-95 in gray Honda Civic, plate 7XYZ892.
```

**Expected Standard TTS behavior (FAIL):**  
Reads "7XYZ892" as one fast word — unintelligible at speed.

**Expected Overwatch behavior (PASS):**  
Converts to `spell("7XYZ892")` → expanded to `7. X. Y. Z. 8. 9. 2.` before Rime synthesis. Each character spoken individually with natural pauses.

**Procedure:**
1. Open app at `http://localhost:5173`
2. Click "VEHICLE PURSUIT" preset
3. Click "ENGAGE OVERWATCH"
4. Play STANDARD TTS audio — listen to plate readout
5. Play OVERWATCH ENGINE audio — listen to plate readout
6. Compare: Overwatch spells each character, Standard reads as one word

**Result:** PASS — Overwatch audio clearly spells out each character.

---

### Test 2: Difficult Street Names (IPA Phoneme Injection)

**Input:**
```
Headed to Schuylkill Expy. Need backup at 48th & Wyalusing Ave.
```

**Expected Standard TTS behavior (FAIL):**  
Mispronounces "Schuylkill" (correct: "skoo-kill") and "Wyalusing" (correct: "why-ah-loo-sing").

**Expected Overwatch behavior (PASS):**  
LLM injects IPA: `{sku-kɪl}` and `{waɪ-ə-lu-sɪŋ}`. Rime reads these correctly via `phonemizeBetweenBrackets: true`.

**Procedure:**
1. Click "VEHICLE PURSUIT" preset → "ENGAGE OVERWATCH"
2. Scroll to "WORD-LEVEL DIFF" section — green-highlighted words show IPA injections
3. Play both audios, listen for street name pronunciation
4. Compare: Overwatch pronounces both names correctly

**Result:** PASS — IPA-injected names are pronounced correctly by Rime mist-v3.

---

### Test 3: Pharmaceutical Names (Medical Emergency)

**Input:**
```
Code 2. 67yo M, hx of AFib. Currently on Rivaroxaban 20mg QD and Metoprolol Succinate 50mg BID.
```

**Expected Standard TTS behavior (FAIL):**  
Garbles "Rivaroxaban" and "Metoprolol Succinate" — paramedic cannot confirm medication.

**Expected Overwatch behavior (PASS):**  
LLM rewrites with phonetic guides: `{ri-va-rox-a-ban}`, `{me-to-pro-lol}`. Rime reads clearly.

**Procedure:**
1. Click "MEDICAL EMERGENCY" preset → "ENGAGE OVERWATCH"
2. Play both audios, listen for drug names
3. Check Evidence Panel for IPA transform entries

**Result:** PASS — Drug names are intelligible in Overwatch audio.

---

### Test 4: Speed Control (Controlled Delivery)

**Claim:** `speedAlpha` parameter controls delivery pace for critical vs contextual information.

**Procedure:**
1. Click any preset → adjust speed slider to **0.5x** → "ENGAGE OVERWATCH"
2. Play Overwatch audio — confirm slower, more deliberate delivery
3. Adjust slider to **1.5x** → "ENGAGE OVERWATCH" again
4. Play Overwatch audio — confirm faster delivery
5. Compare the two: critical data (plates, names) should be clearer at 0.5x

**Result:** PASS — `speedAlpha` directly controls Rime output pacing.

---

### Test 5: Multi-Voice Consistency

**Claim:** Pronunciation accuracy is consistent across all 4 Rime speakers.

**Procedure:**
1. Run any preset → scroll to "MULTI-VOICE COMPARISON"
2. Click "GENERATE ALL 4 VOICES"
3. Play each voice (Astra, Celeste, Luna, Hudson)
4. Verify all 4 pronounce IPA-injected words identically

**Result:** PASS — `phonemizeBetweenBrackets` works consistently across speakers.

---

### Test 6: Stress Test (All Presets)

**Procedure:**
1. Scroll to "STRESS TEST RUNNER"
2. Click "RUN ALL STRESS TESTS"
3. Verify all 4 presets show PASS status
4. Confirm audio column shows ✓ for all tests
5. Note latency metrics (Groq + Rime)

**Result:** PASS — All 4 presets complete with audio generated.

---

## Repeatable Test Script

```bash
# Backend must be running on port 8000
curl -X POST http://localhost:8000/api/v1/process-dispatch \
  -H "Content-Type: application/json" \
  -d '{"raw_text": "Code 3. Suspect fleeing SB on I-95, plate 7XYZ892. Headed to Schuylkill Expy.", "speed_alpha": 1.0, "speaker": "astra"}' \
  | python -c "import sys,json; d=json.load(sys.stdin); print('Standard:', d['standard_text']); print('Overwatch:', d['overwatch_text']); print('Audio present:', bool(d.get('overwatch_audio_b64')))"
```

## Rime Configuration Used

| Parameter | Value |
|---|---|
| Model ID | `mist-v3` |
| Speaker | `astra` (default), `celeste`, `luna`, `hudson` |
| Endpoint | `https://users.rime.ai/v1/rime-tts` |
| Audio Format | `pcm` (wrapped in WAV header server-side) |
| Sample Rate | 22050 Hz |
| `phonemizeBetweenBrackets` | `true` |
| `speedAlpha` | 0.5–1.5 (user-adjustable) |
| `reduceLatency` | `true` |

## Limitations

1. IPA phonemes are generated by LLM (qwen/qwen3.8-27b) — approximate, not from a curated dictionary
2. Rime text limit ~1000 chars — we chunk at ~500 chars at sentence boundaries
3. `spell()` is a custom convention expanded server-side, not a Rime feature
4. Demo uses 4 hardcoded presets + free-text input; production would integrate with CAD (Computer-Aided Dispatch) systems
5. Speed control applies uniformly — production would apply different speeds to different parts (slow for plates, normal for context)

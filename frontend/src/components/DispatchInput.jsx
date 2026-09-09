import { useState } from 'react'

const PRESETS = [
  {
    id: 'pursuit',
    label: 'VEHICLE PURSUIT',
    text: 'Code 3. Suspect fleeing SB on I-95 in gray Honda Civic, plate 7XYZ892. Headed to Schuylkill Expy. Suspect armed w/ AR-15. Need backup at 48th & Wyalusing Ave.'
  },
  {
    id: 'medical',
    label: 'MEDICAL EMERGENCY',
    text: 'Code 2. 67yo M, hx of AFib. Currently on Rivaroxaban 20mg QD and Metoprolol Succinate 50mg BID. BP 88/52, HR 142 irreg. GCS 13. LOC at 2847 Passyunk Ave, unit 3F. ALS intercept requested. Pt allergic to Amiodarone.'
  },
  {
    id: 'hazmat',
    label: 'HAZMAT INCIDENT',
    text: 'HAZMAT Level 2. Tanker rollover NB I-476 at mp 12.3. Placard 1830 — Sulfuric Acid, UN1830. Driver conscious, chemical burn LUE. Evac radius 1000ft. Wind NNW at 12kts. IC is Batt Chief Krzyzewski, badge 4418. Requesting HAZMAT team and Decon unit to staging at Conshohocken Rd exit.'
  },
  {
    id: 'missing',
    label: 'MISSING PERSON',
    text: "Silver Alert. Missing: Nguyen, Thi Bich, DOB 03/14/1941. Last seen 1430 hrs at 1200 Cheltenham Ave wearing blue cardigan, gray slacks. Diagnosed Alzheimer's. No cell phone. Vehicle: 2019 Hyundai Tucson, PA plate KYJ-4821. Contact Det. Anastasiadis at ext 4477."
  }
]

const VOICES = [
  { id: 'astra', label: 'Astra', desc: 'Clear, professional' },
  { id: 'luna', label: 'Luna', desc: 'Calm, measured' },
  { id: 'zion', label: 'Zion', desc: 'Warm, composed' },
  { id: 'storm', label: 'Storm', desc: 'Deep, authoritative' },
]

export default function DispatchInput({ onSubmit, processing }) {
  const [text, setText] = useState('')
  const [activePreset, setActivePreset] = useState(null)
  const [speedAlpha, setSpeedAlpha] = useState(1.0)
  const [speaker, setSpeaker] = useState('astra')

  const handlePreset = (preset) => {
    setText(preset.text)
    setActivePreset(preset.id)
  }

  const handleSubmit = () => {
    if (!text.trim() || processing) return
    onSubmit(text.trim(), speedAlpha, speaker)
  }

  const speedLabel = speedAlpha < 0.8 ? 'SLOW — CRITICAL DATA' : 
                     speedAlpha > 1.2 ? 'FAST — CONTEXT' : 'NORMAL'

  return (
    <div className="ow-panel p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="ow-label">dispatch input</span>
        <span className="text-[0.6rem] text-ow-muted">{text.length} chars</span>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePreset(p)}
            className={`ow-btn text-[0.6rem] py-1.5 px-3 ${
              activePreset === p.id ? 'border-ow-accent text-ow-accent' : ''
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setActivePreset(null) }}
        placeholder="Paste raw dispatch shorthand here, or select a preset above..."
        className="flex-1 min-h-[120px] w-full bg-ow-bg border border-ow-border p-4 text-sm text-ow-text font-mono resize-none focus:outline-none focus:border-ow-accent transition-colors placeholder:text-ow-muted"
      />

      {/* Controls Row: Speed + Voice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Speed Control */}
        <div className="bg-ow-bg border border-ow-border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="ow-label">overwatch speed</span>
            <span className={`ow-tag text-[0.55rem] ${
              speedAlpha < 0.8 ? 'border-ow-warning text-ow-warning' :
              speedAlpha > 1.2 ? 'border-ow-accent text-ow-accent' :
              'border-ow-text-dim text-ow-text-dim'
            }`}>{speedLabel}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={speedAlpha}
            onChange={(e) => setSpeedAlpha(parseFloat(e.target.value))}
            className="w-full h-1 bg-ow-border rounded-none appearance-none cursor-pointer accent-ow-accent"
          />
          <div className="flex justify-between text-[0.55rem] text-ow-muted mt-1">
            <span>0.5x Slow</span>
            <span className="text-ow-accent font-bold">{speedAlpha.toFixed(1)}x</span>
            <span>1.5x Fast</span>
          </div>
        </div>

        {/* Voice Selector */}
        <div className="bg-ow-bg border border-ow-border p-3">
          <span className="ow-label block mb-2">rime voice</span>
          <div className="grid grid-cols-2 gap-1.5">
            {VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setSpeaker(v.id)}
                className={`text-left px-2 py-1.5 text-[0.6rem] border transition-colors ${
                  speaker === v.id
                    ? 'border-ow-accent text-ow-accent bg-ow-accent/5'
                    : 'border-ow-border text-ow-text-dim hover:border-ow-border-bright'
                }`}
              >
                <span className="font-bold">{v.label}</span>
                <span className="text-ow-muted ml-1">{v.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || processing}
          className={`ow-btn-primary ow-btn flex-1 ${
            processing ? 'opacity-50 cursor-wait' : ''
          } ${!text.trim() ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-black rounded-full animate-dot-pulse" />
              processing dispatch
            </span>
          ) : (
            'engage overwatch'
          )}
        </button>
        <button
          onClick={() => { setText(''); setActivePreset(null) }}
          className="ow-btn ow-btn-danger"
        >
          clear
        </button>
      </div>
    </div>
  )
}

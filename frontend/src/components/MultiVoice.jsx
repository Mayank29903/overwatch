import { useState, useRef, useEffect } from 'react'

const VOICES = [
  { id: 'astra', label: 'Astra', color: '#b8ff29' },
  { id: 'luna', label: 'Luna', color: '#29b8ff' },
  { id: 'zion', label: 'Zion', color: '#ff29b8' },
  { id: 'storm', label: 'Storm', color: '#ffaa29' },
]

function VoiceCard({ voice, audioB64, loading }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!audioB64) return
    try {
      const binary = atob(audioB64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      return () => URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }, [audioB64])

  const toggle = () => {
    if (!audioRef.current) return
    playing ? audioRef.current.pause() : audioRef.current.play()
  }

  const download = () => {
    if (!audioUrl) return
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `overwatch_${voice.id}.wav`
    a.click()
  }

  return (
    <div className="ow-panel p-3 flex flex-col items-center" style={{ borderColor: playing ? voice.color : undefined }}>
      <div className="flex items-center gap-2 mb-2 w-full">
        <div className="w-2 h-2 rounded-full" style={{ background: voice.color, opacity: playing ? 1 : 0.5 }} />
        <span className="text-[0.65rem] font-bold tracking-wider" style={{ color: voice.color }}>{voice.label.toUpperCase()}</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3">
          <span className="w-1.5 h-1.5 rounded-full animate-dot-pulse" style={{ background: voice.color }} />
          <span className="text-[0.6rem] text-ow-muted">generating...</span>
        </div>
      ) : audioUrl ? (
        <div className="flex items-center gap-2 w-full">
          <button onClick={toggle} className="ow-btn text-[0.6rem] px-3 py-1" style={{ borderColor: voice.color, color: voice.color }}>
            {playing ? '■' : '▶'}
          </button>
          <span className="text-[0.55rem] text-ow-muted tabular-nums">{duration.toFixed(1)}s</span>
          <div className="flex-1" />
          <button onClick={download} className="ow-btn text-[0.55rem] px-2 py-0.5">↓</button>
        </div>
      ) : (
        <span className="text-[0.6rem] text-ow-muted py-3">waiting</span>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        />
      )}
    </div>
  )
}

export default function MultiVoice({ overwatchText }) {
  const [voiceAudios, setVoiceAudios] = useState({})
  const [loading, setLoading] = useState({})
  const [generated, setGenerated] = useState(false)

  const generateAll = async () => {
    if (!overwatchText) return
    setGenerated(true)

    for (const voice of VOICES) {
      setLoading(prev => ({ ...prev, [voice.id]: true }))
      try {
        const res = await fetch('/api/v1/process-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_text: overwatchText, speed_alpha: 1.0, speaker: voice.id })
        })
        if (res.ok) {
          const data = await res.json()
          setVoiceAudios(prev => ({ ...prev, [voice.id]: data.overwatch_audio_b64 }))
        }
      } catch (e) { console.error(e) }
      setLoading(prev => ({ ...prev, [voice.id]: false }))
    }
  }

  return (
    <div className="ow-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="ow-label">multi-voice comparison</span>
        <span className="ow-tag border-ow-text-dim text-ow-text-dim">voice identity test</span>
      </div>

      <p className="text-[0.65rem] text-ow-muted mb-4">
        Same dispatch, 4 different Rime voices. Proves pronunciation consistency across voice identities.
      </p>

      {!overwatchText ? (
        <p className="text-[0.6rem] text-ow-muted">Run a dispatch first, then compare across voices.</p>
      ) : !generated ? (
        <button onClick={generateAll} className="ow-btn ow-btn-primary">
          🔊 generate all 4 voices
        </button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {VOICES.map(v => (
            <VoiceCard
              key={v.id}
              voice={v}
              audioB64={voiceAudios[v.id]}
              loading={loading[v.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

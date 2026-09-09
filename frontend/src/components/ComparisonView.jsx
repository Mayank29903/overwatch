import { useRef, useState, useEffect } from 'react'

function WaveformVisualizer({ isPlaying, variant = 'accent' }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const color = variant === 'accent' ? '#b8ff29' : '#ff2942'
    const barCount = 48

    if (!isPlaying) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < barCount; i++) {
        ctx.fillStyle = color
        ctx.globalAlpha = 0.15
        ctx.fillRect(i * (canvas.width / barCount) + 1, canvas.height - 4, (canvas.width / barCount) - 2, 4)
      }
      ctx.globalAlpha = 1
      return
    }

    const phases = Array.from({ length: barCount }, () => Math.random() * Math.PI * 2)
    const draw = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barW = canvas.width / barCount
      for (let i = 0; i < barCount; i++) {
        const h = (Math.sin(t * 0.003 + phases[i]) * 0.4 + 0.5) * canvas.height * 0.85
        ctx.fillStyle = color
        ctx.globalAlpha = 0.6 + Math.sin(t * 0.002 + i) * 0.4
        ctx.fillRect(i * barW + 1, canvas.height - h, barW - 2, h)
      }
      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [isPlaying, variant])

  return <canvas ref={canvasRef} width={400} height={80} className="w-full h-[80px]" />
}

function AudioColumn({ label, variant, text, audioB64, tagLabel }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)

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
    } catch (err) {
      console.error(`Audio decode error:`, err)
    }
  }, [audioB64])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
  }

  const handleDownload = () => {
    if (!audioUrl) return
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `overwatch_${variant}_${Date.now()}.wav`
    a.click()
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const borderColor = variant === 'accent' ? 'border-ow-accent' : 'border-ow-danger'
  const tagColor = variant === 'accent' ? 'border-ow-accent text-ow-accent' : 'border-ow-danger text-ow-danger'

  return (
    <div className={`ow-panel p-4 flex flex-col ${isPlaying ? 'ow-panel-active' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${variant === 'accent' ? 'bg-ow-accent' : 'bg-ow-danger'} ${isPlaying ? 'animate-dot-pulse' : ''}`} />
          <span className="ow-label">{label}</span>
        </div>
        <span className={`ow-tag ${tagColor}`}>{tagLabel}</span>
      </div>

      <div className={`border ${borderColor} bg-ow-bg p-2 mb-3`}>
        <WaveformVisualizer isPlaying={isPlaying} variant={variant} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={togglePlay}
          disabled={!audioUrl}
          className={`ow-btn ${variant === 'accent' ? 'ow-btn-primary' : 'ow-btn-danger'} px-4 ${!audioUrl ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          {isPlaying ? '■ stop' : '▶ play'}
        </button>
        <span className="text-[0.625rem] text-ow-text-dim tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="flex-1" />
        <button
          onClick={handleDownload}
          disabled={!audioUrl}
          className={`ow-btn text-[0.6rem] px-3 py-1 ${!audioUrl ? 'opacity-30' : ''}`}
          title="Download WAV"
        >
          ↓ WAV
        </button>
      </div>

      <div className="flex-1 bg-ow-bg border border-ow-border p-3 text-xs leading-relaxed overflow-auto max-h-[200px]">
        <p className="whitespace-pre-wrap">{text || 'Awaiting dispatch...'}</p>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        />
      )}
    </div>
  )
}

export default function ComparisonView({ result }) {
  if (!result) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="ow-label">audio comparison</span>
        <div className="flex-1 h-px bg-ow-border" />
        <span className="text-[0.6rem] text-ow-muted">listen to the difference</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AudioColumn label="standard tts" variant="danger" text={result.standard_text} audioB64={result.standard_audio_b64} tagLabel="BASELINE" />
        <AudioColumn label="overwatch engine" variant="accent" text={result.overwatch_text} audioB64={result.overwatch_audio_b64} tagLabel="RIME + IPA" />
      </div>
    </div>
  )
}

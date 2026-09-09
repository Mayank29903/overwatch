import { useEffect, useState } from 'react'

export default function Header({ systemStatus }) {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(
        now.toISOString().slice(0, 19).replace('T', ' ') + ' UTC'
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const statusColor = {
    idle: 'bg-ow-muted',
    processing: 'bg-ow-warning animate-dot-pulse',
    ready: 'bg-ow-accent animate-dot-pulse',
    error: 'bg-ow-danger animate-dot-pulse'
  }[systemStatus] || 'bg-ow-muted'

  return (
    <header className="border-b border-ow-border px-4 md:px-6 py-3 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        <div>
          <h1 className="text-sm font-bold tracking-widest text-ow-text leading-none">
            OVERWATCH<span className="text-ow-accent">.AI</span>
          </h1>
          <p className="text-[0.6rem] tracking-wider text-ow-text-dim mt-0.5">
            TACTICAL DISPATCH VOICE ENGINE
          </p>
        </div>
      </div>

      {/* Center: Rime badge */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="ow-tag border-ow-accent text-ow-accent">RIME</span>
          <span className="text-[0.625rem] text-ow-text-dim">mist-v3 · astra · mp3</span>
        </div>
        <div className="w-px h-4 bg-ow-border" />
        <div className="flex items-center gap-2">
          <span className="ow-tag border-ow-warning text-ow-warning">LLM</span>
          <span className="text-[0.625rem] text-ow-text-dim">groq · qwen3.8-27b</span>
        </div>
      </div>

      {/* Right: Clock */}
      <div className="text-[0.625rem] text-ow-text-dim tabular-nums tracking-wider">
        {clock}
      </div>
    </header>
  )
}

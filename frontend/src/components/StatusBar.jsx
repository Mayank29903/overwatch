import { useEffect, useState } from 'react'

export default function StatusBar({ latency, systemStatus }) {
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setUptime((u) => u + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const statusLabel = {
    idle: 'STANDBY',
    processing: 'PROCESSING',
    ready: 'DISPATCH READY',
    error: 'SYSTEM FAULT'
  }[systemStatus] || 'UNKNOWN'

  const statusColor = {
    idle: 'text-ow-muted',
    processing: 'text-ow-warning',
    ready: 'text-ow-accent',
    error: 'text-ow-danger'
  }[systemStatus] || 'text-ow-muted'

  return (
    <footer className="border-t border-ow-border px-4 md:px-6 py-2 flex items-center justify-between text-[0.6rem] tracking-wider text-ow-text-dim">
      <div className="flex items-center gap-4">
        <span className={statusColor}>{statusLabel}</span>
        <span className="text-ow-border">|</span>
        <span>RIME:mist-v3</span>
        <span className="text-ow-border">|</span>
        <span>SPEAKER:astra</span>
        <span className="text-ow-border">|</span>
        <span>FORMAT:pcm→wav</span>
      </div>
      <div className="flex items-center gap-4">
        {latency && (
          <>
            <span>RTT:{latency}ms</span>
            <span className="text-ow-border">|</span>
          </>
        )}
        <span>UPTIME:{formatUptime(uptime)}</span>
        <span className="text-ow-border">|</span>
        <span>ENDPOINT:users.rime.ai</span>
      </div>
    </footer>
  )
}

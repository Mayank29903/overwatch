import { useState, useCallback } from 'react'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import DispatchInput from './components/DispatchInput'
import ComparisonView from './components/ComparisonView'
import EvidencePanel from './components/EvidencePanel'
import MicInput from './components/MicInput'
import StressTest from './components/StressTest'
import MultiVoice from './components/MultiVoice'
import TextDiff from './components/TextDiff'

const API_BASE = '/api/v1'

export default function App() {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [latency, setLatency] = useState(null)
  const [systemStatus, setSystemStatus] = useState('idle')

  const handleDispatch = useCallback(async (rawText, speedAlpha = 1.0, speaker = 'astra') => {
    setProcessing(true)
    setError(null)
    setResult(null)
    setSystemStatus('processing')
    const startTime = performance.now()

    try {
      const res = await fetch(`${API_BASE}/process-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText, speed_alpha: speedAlpha, speaker })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Server returned ${res.status}`)
      }

      const data = await res.json()
      const elapsed = Math.round(performance.now() - startTime)
      setLatency(elapsed)
      setResult(data)
      setSystemStatus('ready')
    } catch (err) {
      setError(err.message)
      setSystemStatus('error')
    } finally {
      setProcessing(false)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="scanline-overlay" />
      <Header systemStatus={systemStatus} />

      <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto w-full space-y-5">
        {/* Mic Input */}
        <div className="animate-slide-up">
          <MicInput onTranscript={(t) => handleDispatch(t, 1.0, 'astra')} />
        </div>

        {/* Grid: Input + Evidence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-slide-up">
          <div className="lg:col-span-2">
            <DispatchInput onSubmit={handleDispatch} processing={processing} />
          </div>
          <div className="lg:col-span-1">
            <EvidencePanel result={result} latency={latency} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="ow-panel p-4 border-ow-danger animate-slide-up">
            <span className="ow-label text-ow-danger">system error</span>
            <p className="mt-2 text-sm text-ow-danger">{error}</p>
          </div>
        )}

        {/* Audio Comparison */}
        {result && (
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <ComparisonView result={result} />
          </div>
        )}

        {/* Word-Level Diff */}
        {result && (
          <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <TextDiff standardText={result.standard_text} overwatchText={result.overwatch_text} />
          </div>
        )}

        {/* Multi-Voice Comparison */}
        {result && (
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <MultiVoice overwatchText={result.overwatch_text} />
          </div>
        )}

        {/* Stress Test */}
        <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <StressTest />
        </div>
      </main>

      <StatusBar latency={latency} systemStatus={systemStatus} />
    </div>
  )
}

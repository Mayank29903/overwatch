export default function EvidencePanel({ result, latency }) {
  const transformations = []

  if (result) {
    const overwatch = result.overwatch_text || ''

    const spellMatches = overwatch.match(/spell\("([^"]+)"\)/g)
    if (spellMatches) {
      spellMatches.forEach((m) => {
        const inner = m.match(/spell\("([^"]+)"\)/)[1]
        transformations.push({ type: 'SPELL', from: inner, to: m, reason: 'Character-by-character spelling for officer dictation' })
      })
    }

    const ipaMatches = overwatch.match(/\{[^}]+\}/g)
    if (ipaMatches) {
      ipaMatches.forEach((m) => {
        transformations.push({ type: 'IPA', from: '(original)', to: m, reason: 'Phonetic replacement for correct pronunciation' })
      })
    }

    if (result.standard_text !== result.overwatch_text) {
      const stdWords = result.standard_text?.split(' ') || []
      const owWords = result.overwatch_text?.split(' ') || []
      if (stdWords.includes('Southbound') || owWords.includes('Southbound')) {
        transformations.push({ type: 'EXPAND', from: 'SB', to: 'Southbound', reason: 'Abbreviation expanded for clarity' })
      }
    }
  }

  return (
    <div className="ow-panel p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="ow-label">evidence log</span>
        {result?.total_latency_ms && (
          <span className="ow-tag border-ow-accent text-ow-accent">{result.total_latency_ms}ms</span>
        )}
      </div>

      {!result ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-ow-muted text-2xl mb-2">⌘</div>
            <p className="text-xs text-ow-muted">Run a dispatch to see<br />transformation evidence</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-auto">
          {/* Latency Breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-ow-bg border border-ow-border p-2">
              <span className="ow-label text-[0.5rem]">groq</span>
              <p className="text-sm font-bold text-ow-warning mt-0.5">{result.groq_latency_ms || '—'}ms</p>
            </div>
            <div className="bg-ow-bg border border-ow-border p-2">
              <span className="ow-label text-[0.5rem]">rime std</span>
              <p className="text-sm font-bold text-ow-danger mt-0.5">{result.rime_standard_latency_ms || '—'}ms</p>
            </div>
            <div className="bg-ow-bg border border-ow-border p-2">
              <span className="ow-label text-[0.5rem]">rime ow</span>
              <p className="text-sm font-bold text-ow-accent mt-0.5">{result.rime_overwatch_latency_ms || '—'}ms</p>
            </div>
          </div>

          {/* Transform count */}
          <div className="bg-ow-bg border border-ow-border p-2">
            <span className="ow-label text-[0.5rem]">transforms applied</span>
            <p className="text-sm font-bold text-ow-accent mt-0.5">{transformations.length}</p>
          </div>

          {/* Transformation log */}
          {transformations.map((t, i) => (
            <div key={i} className="bg-ow-bg border border-ow-border p-3">
              <span className={`ow-tag text-[0.55rem] ${
                t.type === 'IPA' ? 'border-ow-accent text-ow-accent' :
                t.type === 'SPELL' ? 'border-ow-warning text-ow-warning' :
                'border-ow-text-dim text-ow-text-dim'
              }`}>{t.type}</span>
              <div className="text-xs space-y-1 mt-2">
                <p><span className="text-ow-text-dim">from:</span> <span className="diff-removed">{t.from}</span></p>
                <p><span className="text-ow-text-dim">to:</span> <span className="diff-added">{t.to}</span></p>
                <p className="text-[0.6rem] text-ow-text-dim">{t.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

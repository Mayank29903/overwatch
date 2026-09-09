import { useState } from 'react'

const STRESS_TESTS = [
  { id: 'pursuit', label: 'Vehicle Pursuit', text: 'Code 3. Suspect fleeing SB on I-95 in gray Honda Civic, plate 7XYZ892. Headed to Schuylkill Expy. Suspect armed w/ AR-15. Need backup at 48th & Wyalusing Ave.' },
  { id: 'medical', label: 'Medical Emergency', text: 'Code 2. 67yo M, hx of AFib. Currently on Rivaroxaban 20mg QD and Metoprolol Succinate 50mg BID. BP 88/52, HR 142 irreg. GCS 13. LOC at 2847 Passyunk Ave, unit 3F. ALS intercept requested. Pt allergic to Amiodarone.' },
  { id: 'hazmat', label: 'HAZMAT Incident', text: 'HAZMAT Level 2. Tanker rollover NB I-476 at mp 12.3. Placard 1830 — Sulfuric Acid, UN1830. Driver conscious, chemical burn LUE. Evac radius 1000ft. Wind NNW at 12kts. IC is Batt Chief Krzyzewski, badge 4418. Requesting HAZMAT team and Decon unit to staging at Conshohocken Rd exit.' },
  { id: 'missing', label: 'Missing Person', text: "Silver Alert. Missing: Nguyen, Thi Bich, DOB 03/14/1941. Last seen 1430 hrs at 1200 Cheltenham Ave wearing blue cardigan, gray slacks. Diagnosed Alzheimer's. No cell phone. Vehicle: 2019 Hyundai Tucson, PA plate KYJ-4821. Contact Det. Anastasiadis at ext 4477." },
]

export default function StressTest() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState([])
  const [currentTest, setCurrentTest] = useState(null)

  const runAllTests = async () => {
    setRunning(true)
    setResults([])
    const newResults = []

    for (const test of STRESS_TESTS) {
      setCurrentTest(test.id)
      const start = performance.now()
      try {
        const res = await fetch('/api/v1/process-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_text: test.text, speed_alpha: 1.0, speaker: 'astra' })
        })

        const elapsed = Math.round(performance.now() - start)

        if (!res.ok) {
          newResults.push({ ...test, status: 'FAIL', latency: elapsed, error: `HTTP ${res.status}`, transforms: 0 })
        } else {
          const data = await res.json()
          const ow = data.overwatch_text || ''
          const ipaCount = (ow.match(/\{[^}]+\}/g) || []).length
          const spellCount = (ow.match(/spell\(/g) || []).length
          newResults.push({
            ...test,
            status: 'PASS',
            latency: elapsed,
            transforms: ipaCount + spellCount,
            groq_ms: data.groq_latency_ms,
            rime_ms: data.rime_overwatch_latency_ms,
            hasAudio: !!data.overwatch_audio_b64,
          })
        }
      } catch (err) {
        newResults.push({ ...test, status: 'FAIL', latency: 0, error: err.message, transforms: 0 })
      }
      setResults([...newResults])
    }

    setCurrentTest(null)
    setRunning(false)
  }

  const allPass = results.length === STRESS_TESTS.length && results.every(r => r.status === 'PASS')

  return (
    <div className="ow-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="ow-label">stress test runner</span>
        {allPass && <span className="ow-tag border-ow-accent text-ow-accent">ALL PASS</span>}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={runAllTests}
          disabled={running}
          className={`ow-btn ow-btn-primary ${running ? 'opacity-50 cursor-wait' : ''}`}
        >
          {running ? `testing ${currentTest}...` : '⚡ run all stress tests'}
        </button>
        <span className="text-[0.6rem] text-ow-muted">
          Runs all 4 presets and reports latency, transforms, and audio status
        </span>
      </div>

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[0.65rem]">
            <thead>
              <tr className="border-b border-ow-border text-ow-text-dim text-left">
                <th className="pb-2 pr-3">TEST</th>
                <th className="pb-2 pr-3">STATUS</th>
                <th className="pb-2 pr-3">TOTAL</th>
                <th className="pb-2 pr-3">GROQ</th>
                <th className="pb-2 pr-3">RIME</th>
                <th className="pb-2 pr-3">TRANSFORMS</th>
                <th className="pb-2">AUDIO</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-ow-border/50">
                  <td className="py-2 pr-3 text-ow-text">{r.label}</td>
                  <td className="py-2 pr-3">
                    <span className={r.status === 'PASS' ? 'text-ow-accent' : 'text-ow-danger'}>{r.status}</span>
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{r.latency}ms</td>
                  <td className="py-2 pr-3 tabular-nums text-ow-warning">{r.groq_ms || '—'}ms</td>
                  <td className="py-2 pr-3 tabular-nums text-ow-accent">{r.rime_ms || '—'}ms</td>
                  <td className="py-2 pr-3 tabular-nums">{r.transforms}</td>
                  <td className="py-2">
                    {r.hasAudio ? <span className="text-ow-accent">✓</span> : <span className="text-ow-danger">✗</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

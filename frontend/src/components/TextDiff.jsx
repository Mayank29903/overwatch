export default function TextDiff({ standardText, overwatchText }) {
  if (!standardText || !overwatchText) return null

  const stdWords = standardText.split(/(\s+)/)
  const owWords = overwatchText.split(/(\s+)/)

  // Find changed/added words in overwatch
  const changes = []
  let si = 0, oi = 0

  // Simple word-level diff: highlight words in overwatch that don't exist in standard
  const stdSet = new Set(standardText.split(/\s+/))
  const owSplit = overwatchText.split(/\s+/)

  const highlighted = owSplit.map((word, i) => {
    const isIPA = /\{[^}]+\}/.test(word)
    const isSpell = /spell\(/.test(word)
    const isNew = !stdSet.has(word.replace(/[,.]$/, ''))

    if (isIPA) {
      return { word, type: 'ipa' }
    } else if (isSpell) {
      return { word, type: 'spell' }
    } else if (isNew && word.length > 2) {
      return { word, type: 'changed' }
    }
    return { word, type: 'same' }
  })

  return (
    <div className="ow-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="ow-label">word-level diff</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-ow-accent inline-block" />
            <span className="text-[0.55rem] text-ow-muted">IPA phoneme</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-ow-warning inline-block" />
            <span className="text-[0.55rem] text-ow-muted">spell()</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-[#29b8ff] inline-block" />
            <span className="text-[0.55rem] text-ow-muted">modified</span>
          </span>
        </div>
      </div>

      <div className="bg-ow-bg border border-ow-border p-4 text-sm leading-loose font-mono">
        {highlighted.map((h, i) => {
          let cls = ''
          if (h.type === 'ipa') cls = 'bg-ow-accent/15 text-ow-accent border-b border-ow-accent px-0.5'
          else if (h.type === 'spell') cls = 'bg-ow-warning/15 text-ow-warning border-b border-ow-warning px-0.5'
          else if (h.type === 'changed') cls = 'bg-[#29b8ff]/15 text-[#29b8ff] border-b border-[#29b8ff] px-0.5'

          return (
            <span key={i}>
              <span className={cls}>{h.word}</span>
              {' '}
            </span>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[0.6rem] text-ow-muted">
        <span>Total words: {owSplit.length}</span>
        <span>IPA: {highlighted.filter(h => h.type === 'ipa').length}</span>
        <span>Spelled: {highlighted.filter(h => h.type === 'spell').length}</span>
        <span>Modified: {highlighted.filter(h => h.type === 'changed').length}</span>
      </div>
    </div>
  )
}

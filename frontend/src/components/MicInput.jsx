import { useState, useRef } from 'react'

export default function MicInput({ onTranscript }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser. Use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setTranscript(final + interim)
    }

    recognition.onerror = (e) => {
      console.error('Speech error:', e.error)
      setListening(false)
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setTranscript('')
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setListening(false)
  }

  const handleSend = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim())
    }
  }

  return (
    <div className="ow-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="ow-label">live voice input</span>
          {listening && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-ow-danger rounded-full animate-dot-pulse" />
              <span className="text-[0.6rem] text-ow-danger">recording</span>
            </span>
          )}
        </div>
        <span className="ow-tag border-ow-text-dim text-ow-text-dim">browser stt</span>
      </div>

      <div className="flex gap-2 mb-3">
        {!listening ? (
          <button onClick={startListening} className="ow-btn ow-btn-danger px-4">
            🎤 start recording
          </button>
        ) : (
          <button onClick={stopListening} className="ow-btn border-ow-danger text-ow-danger px-4">
            ■ stop recording
          </button>
        )}
        {transcript && !listening && (
          <button onClick={handleSend} className="ow-btn ow-btn-primary px-4">
            → send to overwatch
          </button>
        )}
      </div>

      {transcript && (
        <div className="bg-ow-bg border border-ow-border p-3 text-xs text-ow-text leading-relaxed">
          {transcript}
          {listening && <span className="inline-block w-2 h-4 bg-ow-accent ml-1 animate-dot-pulse" />}
        </div>
      )}

      {!transcript && !listening && (
        <p className="text-[0.6rem] text-ow-muted">
          Click record and speak a dispatch. Overwatch will process your spoken words.
        </p>
      )}
    </div>
  )
}

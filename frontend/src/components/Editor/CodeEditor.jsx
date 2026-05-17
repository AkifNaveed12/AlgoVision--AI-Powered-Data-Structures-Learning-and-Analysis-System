import { useState, useRef, useEffect } from 'react'

export default function CodeEditor({ code, onChange, language }) {
  const [lines, setLines] = useState(1)
  const textareaRef = useRef(null)

  useEffect(() => {
    setLines(code.split('\n').length)
  }, [code])

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newCode = code.substring(0, start) + '    ' + code.substring(end)
      onChange(newCode)
      
      // Setup cursor position after render
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4
        }
      }, 0)
    }
  }

  // Generate line numbers array
  const lineNumbers = Array.from({ length: Math.max(lines, 10) }, (_, i) => i + 1)

  return (
    <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden font-mono text-sm shadow-inner relative group">
      {/* Line Numbers */}
      <div className="bg-slate-800/80 text-slate-500 text-right select-none py-4 px-3 border-r border-slate-700 min-w-12 h-full flex flex-col">
        {lineNumbers.map(n => <div key={n} className="leading-6">{n}</div>)}
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck="false"
        className="flex-1 bg-transparent text-slate-200 p-4 leading-6 focus:outline-none resize-none whitespace-pre overflow-auto"
        style={{ minHeight: '300px' }}
      />
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import api from '../lib/api'

export default function AIChat({ initialContext = null }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Tutor. Ask me anything about data structures, algorithms, or the code you are working on.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [followUps, setFollowUps] = useState([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, followUps])

  const handleSend = async (text) => {
    if (!text.trim()) return

    const newMsgs = [...messages, { role: 'user', content: text }]
    setMessages(newMsgs)
    setInput('')
    setFollowUps([])
    setLoading(true)

    try {
      const res = await api.post('/ai/query', { 
        question: text,
        context: initialContext
      })
      
      setMessages([...newMsgs, { role: 'assistant', content: res.data.answer }])
      setFollowUps(res.data.follow_up_questions || [])
    } catch (err) {
      setMessages([...newMsgs, { 
        role: 'assistant', 
        content: `Error: ${err.response?.data?.detail || 'Could not reach AI Tutor. Please try again.'}`,
        isError: true 
      }])
    } finally {
      setLoading(false)
    }
  }

  // Very basic markdown parsing for code blocks and bold text
  const renderMessage = (content) => {
    const parts = content.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```[a-z]*\n?/i, '').replace(/```$/, '')
        return (
          <div key={i} className="bg-slate-900 border border-slate-700 rounded-md p-3 my-2 overflow-x-auto font-mono text-xs">
            <pre className="text-slate-300">{code}</pre>
          </div>
        )
      }
      
      // Handle bold **text**
      const boldParts = part.split(/(\*\*.*?\*\*)/g)
      return (
        <span key={i}>
          {boldParts.map((bp, j) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return <strong key={j} className="text-white font-semibold">{bp.slice(2, -2)}</strong>
            }
            return bp
          })}
        </span>
      )
    })
  }

  return (
    <div className="flex flex-col h-[600px] card p-0 overflow-hidden bg-slate-800/50">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl">🤖</div>
        <div>
          <h3 className="font-semibold text-white leading-tight">AlgoVision AI Tutor</h3>
          <p className="text-xs text-emerald-400">Powered by LLaMA 3 70B</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : msg.isError 
                  ? 'bg-red-900/50 border border-red-800 text-red-200 rounded-tl-sm'
                  : 'bg-slate-700 text-slate-200 rounded-tl-sm border border-slate-600/50 shadow-sm'
            }`}>
              {renderMessage(msg.content)}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-600/50">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Follow Ups */}
      {followUps.length > 0 && !loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {followUps.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-blue-300 px-3 py-1.5 rounded-full transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex items-end gap-2 bg-slate-900 border border-slate-600 rounded-xl p-1 focus-within:ring-2 focus-within:ring-blue-500 transition-all"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(input)
              }
            }}
            placeholder="Ask a question..."
            className="flex-1 bg-transparent text-sm text-white px-3 py-2 max-h-32 resize-none focus:outline-none"
            rows={1}
            style={{ minHeight: '40px' }}
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 mb-0.5 mr-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-slate-500">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  )
}

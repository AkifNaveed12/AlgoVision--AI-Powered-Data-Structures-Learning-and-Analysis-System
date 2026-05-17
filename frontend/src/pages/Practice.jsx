import { useState, useEffect } from 'react'
import api from '../lib/api'
import CodeEditor from '../components/Editor/CodeEditor'

export default function Practice() {
  const [problems, setProblems] = useState([])
  const [activeProblem, setActiveProblem] = useState(null)
  
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const [hintInfo, setHintInfo] = useState(null)
  const [hintLoading, setHintLoading] = useState(false)

  // Fetch problems on mount
  useEffect(() => {
    api.get('/practice/problems')
      .then(res => {
        setProblems(res.data.problems)
        if (res.data.problems.length > 0) {
          handleSelectProblem(res.data.problems[0].id)
        }
      })
      .catch(console.error)
  }, [])

  const handleSelectProblem = async (id) => {
    setResult(null)
    setHintInfo(null)
    try {
      const res = await api.get(`/practice/problems/${id}`)
      setActiveProblem(res.data)
      // Provide a basic template
      setCode(`def solve(arr):\n    # Write your code here\n    pass\n\n# Handle input parsing if needed\n# Example for "3 1 4 1 5":\n# arr = list(map(int, input().split()))\n`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleGetHint = async () => {
    if (!activeProblem) return
    setHintLoading(true)
    try {
      const res = await api.get(`/practice/hint/${activeProblem.id}`)
      setHintInfo(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setHintLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!activeProblem) return
    setLoading(true)
    setResult(null)
    
    try {
      const res = await api.post('/practice/submit', {
        problem_id: activeProblem.id,
        submitted_code: code,
        language_id: activeProblem.language_id || 71
      })
      setResult(res.data)
    } catch (err) {
      setResult({ status: 'Error', message: 'Failed to submit solution.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold gradient-text">Practice Problems</h1>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Sidebar: Problem List */}
        <div className="w-1/4 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {problems.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectProblem(p.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeProblem?.id === p.id 
                  ? 'bg-slate-800 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-semibold ${activeProblem?.id === p.id ? 'text-white' : 'text-slate-300'}`}>
                  {p.title}
                </h3>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                  p.difficulty === 'Easy' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/50' : 
                  p.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800/50' : 
                  'bg-red-900/50 text-red-400 border border-red-800/50'
                }`}>
                  {p.difficulty}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Middle: Problem Description & Console */}
        <div className="w-1/3 flex flex-col gap-4 min-h-0">
          <div className="card flex-1 overflow-y-auto custom-scrollbar relative">
            {activeProblem ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-white">{activeProblem.title}</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    activeProblem.difficulty === 'Easy' ? 'badge-easy' : 
                    activeProblem.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'
                  }`}>
                    {activeProblem.difficulty}
                  </span>
                </div>
                
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <pre className="bg-slate-900 p-4 rounded-lg font-sans whitespace-pre-wrap leading-relaxed border border-slate-700/50">
                    {activeProblem.description}
                  </pre>
                </div>

                {/* Hint Section */}
                <div className="mt-8 border-t border-slate-700 pt-6">
                  <button 
                    onClick={handleGetHint} 
                    disabled={hintLoading}
                    className="btn-secondary text-sm flex items-center gap-2 mb-4"
                  >
                    💡 Get a Hint
                    {hintLoading && <span className="animate-pulse">...</span>}
                  </button>

                  {hintInfo && (
                    <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4 animate-fadeIn">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                          Hint Level {hintInfo.hint_level}
                        </span>
                        {hintInfo.ai_generated && (
                          <span className="text-[10px] bg-violet-900/50 text-violet-300 px-2 py-0.5 rounded-full border border-violet-700/50">
                            AI Generated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">{hintInfo.hint}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Select a problem to view details
              </div>
            )}
          </div>

          {/* Console Output */}
          <div className="card h-48 flex flex-col">
            <h3 className="font-semibold text-white mb-2 text-sm flex items-center justify-between">
              Execution Result
              {result && (
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                  result.status === 'Accepted' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {result.status}
                </span>
              )}
            </h3>
            
            <div className="flex-1 bg-slate-900 rounded-lg p-3 overflow-y-auto font-mono text-xs border border-slate-700 custom-scrollbar">
              {!result && <span className="text-slate-600 italic">Submit your code to see results...</span>}
              
              {result && (
                <div className="space-y-3">
                  <div className={`font-semibold text-sm ${result.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.message}
                  </div>
                  
                  {result.stdout && (
                    <div>
                      <span className="text-slate-500 block mb-1">Standard Output:</span>
                      <pre className="text-slate-300">{result.stdout}</pre>
                    </div>
                  )}
                  
                  {result.stderr && (
                    <div>
                      <span className="text-red-500 block mb-1">Standard Error:</span>
                      <pre className="text-red-400">{result.stderr}</pre>
                    </div>
                  )}

                  {(result.execution_time_ms !== null || result.memory_usage_kb !== null) && (
                    <div className="flex gap-4 pt-2 border-t border-slate-800 text-slate-500 mt-2">
                      {result.execution_time_ms !== null && <span>Time: {result.execution_time_ms.toFixed(2)} ms</span>}
                      {result.memory_usage_kb !== null && <span>Memory: {result.memory_usage_kb.toFixed(2)} KB</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Code Editor */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="card flex-1 flex flex-col p-0 overflow-hidden border-slate-700">
            <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Python 3
              </span>
              <button 
                onClick={handleSubmit} 
                disabled={loading || !activeProblem}
                className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2"
              >
                {loading ? 'Evaluating...' : 'Submit Code'}
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor code={code} onChange={setCode} language="Python 3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

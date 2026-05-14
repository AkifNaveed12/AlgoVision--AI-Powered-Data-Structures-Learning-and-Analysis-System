import { useState } from 'react'
import api from '../lib/api'
import CodeEditor from '../components/Editor/CodeEditor'

const LANGUAGES = [
  { id: 71, name: 'Python 3', defaultCode: 'print("Hello, AlgoVision!")' },
  { id: 54, name: 'C++ (GCC)', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, AlgoVision!" << endl;\n    return 0;\n}' },
  { id: 62, name: 'Java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, AlgoVision!");\n    }\n}' },
  { id: 63, name: 'JavaScript', defaultCode: 'console.log("Hello, AlgoVision!");' },
  { id: 50, name: 'C', defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello, AlgoVision!\\n");\n    return 0;\n}' },
]

export default function Compiler() {
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [code, setCode] = useState(LANGUAGES[0].defaultCode)
  const [stdin, setStdin] = useState('')
  
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLanguageChange = (e) => {
    const lang = LANGUAGES.find(l => l.id === parseInt(e.target.value))
    setLanguage(lang)
    setCode(lang.defaultCode)
    setResult(null)
  }

  const handleRun = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const res = await api.post('/execute', {
        source_code: code,
        language_id: language.id,
        stdin: stdin
      })
      setResult(res.data)
    } catch (err) {
      setResult({
        status: 'Error',
        stderr: err.response?.data?.detail || 'Failed to execute code'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text">In-Browser Compiler</h1>
        <p className="text-slate-400 mt-1">Write, compile, and execute code instantly via Judge0.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-300">Language:</label>
              <select 
                value={language.id} 
                onChange={handleLanguageChange}
                className="bg-slate-900 border border-slate-600 rounded-md px-3 py-1.5 text-sm focus:ring-blue-500"
              >
                {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleRun} 
              disabled={loading}
              className="btn-success flex items-center gap-2 py-1.5 px-4"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  Run Code
                </>
              )}
            </button>
          </div>
          
          <div className="flex-1 min-h-[400px]">
            <CodeEditor code={code} onChange={setCode} language={language.name} />
          </div>
        </div>

        {/* Input/Output Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="card p-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-white mb-2">Standard Input (stdin)</h3>
            <textarea
              value={stdin}
              onChange={e => setStdin(e.target.value)}
              placeholder="Enter input here..."
              className="input-field flex-1 min-h-[100px] font-mono text-sm resize-none"
            />
          </div>

          <div className="card p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">Output</h3>
              {result && (
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  result.status === 'Accepted' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {result.status}
                </span>
              )}
            </div>
            
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-sm overflow-auto min-h-[150px]">
              {!result && <span className="text-slate-600">Output will appear here...</span>}
              
              {result && result.compile_output && (
                <div className="text-yellow-400 whitespace-pre-wrap mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Compilation:</span>
                  {result.compile_output}
                </div>
              )}
              
              {result && result.stderr && (
                <div className="text-red-400 whitespace-pre-wrap mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Error:</span>
                  {result.stderr}
                </div>
              )}
              
              {result && result.stdout && (
                <div className="text-slate-200 whitespace-pre-wrap">
                  {result.stdout}
                </div>
              )}
            </div>
            
            {result && result.time && (
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-mono">
                <span>Time: {result.time}s</span>
                <span>Memory: {result.memory} KB</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

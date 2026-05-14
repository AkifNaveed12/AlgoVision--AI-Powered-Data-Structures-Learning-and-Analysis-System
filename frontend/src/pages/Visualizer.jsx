import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import ArrayVisualizer from '../components/Visualizer/ArrayVisualizer'
import LinkedListVisualizer from '../components/Visualizer/LinkedListVisualizer'
import AnimationControls from '../components/Visualizer/AnimationControls'

export default function Visualizer() {
  const [activeTab, setActiveTab] = useState('array') // array, linkedlist
  const [operation, setOperation] = useState('insert') // insert, delete, search
  
  // Data State
  const [arrayData, setArrayData] = useState([10, 20, 30, 40, 50])
  const [llData, setLlData] = useState([10, 20, 30, 40, 50])
  
  // Form State
  const [inputValue, setInputValue] = useState('60')
  const [inputIndex, setInputIndex] = useState('2')
  
  // Animation State
  const [states, setStates] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(800)
  const [performance, setPerformance] = useState(null)
  
  const timerRef = useRef(null)

  // Handlers
  const handleRun = async () => {
    setIsPlaying(false)
    setCurrentStep(0)
    setStates([])
    setPerformance(null)
    
    try {
      let endpoint = `/${activeTab}/${operation}`
      let payload = {}
      
      const val = parseInt(inputValue)
      const idx = parseInt(inputIndex)
      
      if (activeTab === 'array') {
        if (operation === 'insert') payload = { array: arrayData, index: idx, value: val }
        if (operation === 'delete') payload = { array: arrayData, index: idx }
        if (operation === 'search') payload = { array: arrayData, value: val }
      } else {
        if (operation === 'insert') payload = { nodes: llData, position: idx, value: val }
        if (operation === 'delete') payload = { nodes: llData, value: val }
        if (operation === 'search') payload = { nodes: llData, value: val }
      }
      
      const res = await api.post(endpoint, payload)
      setStates(res.data.states)
      setPerformance(res.data.performance)
      
      // Save performance data asynchronously
      api.post('/performance/save', {
        algorithm: `${activeTab}_${operation}`,
        data_structure: activeTab,
        operation: operation,
        input_size: activeTab === 'array' ? arrayData.length : llData.length,
        execution_time_ms: res.data.performance.execution_time_ms,
        memory_usage_kb: res.data.performance.memory_usage_kb,
        operation_count: res.data.performance.operation_count,
        input_data: payload
      }).catch(console.error)
      
      // Auto-start playback
      setIsPlaying(true)
      
    } catch (err) {
      alert(err.response?.data?.detail || 'Error running operation')
    }
  }

  // Animation Loop
  useEffect(() => {
    if (isPlaying && states.length > 0) {
      if (currentStep < states.length - 1) {
        timerRef.current = setTimeout(() => {
          setCurrentStep(prev => prev + 1)
        }, speed)
      } else {
        setIsPlaying(false)
        
        // Update base data for next operations if it was a modifying operation
        const finalState = states[states.length - 1]
        if (operation !== 'search') {
          if (activeTab === 'array' && finalState.elements) {
            // strip nulls
            setArrayData(finalState.elements.filter(x => x !== null))
          } else if (activeTab === 'linkedlist' && finalState.nodes) {
            setLlData(finalState.nodes)
          }
        }
      }
    }
    
    return () => clearTimeout(timerRef.current)
  }, [isPlaying, currentStep, states, speed, activeTab, operation])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6 mb-6 items-end">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Visualizer</h1>
          <p className="text-slate-400 mt-1">Watch data structures in action step by step.</p>
        </div>
        
        <div className="flex bg-slate-800 rounded-lg p-1 ml-auto border border-slate-700">
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'array' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => { setActiveTab('array'); setStates([]); setPerformance(null); setIsPlaying(false) }}
          >
            Array
          </button>
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'linkedlist' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => { setActiveTab('linkedlist'); setStates([]); setPerformance(null); setIsPlaying(false) }}
          >
            Linked List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h3 className="font-semibold text-white mb-4 border-b border-slate-700 pb-2">Operation</h3>
            <div className="space-y-2">
              {['insert', 'delete', 'search'].map(op => (
                <label key={op} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="operation" 
                    value={op} 
                    checked={operation === op}
                    onChange={() => setOperation(op)}
                    className="text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-600"
                  />
                  <span className={`capitalize transition-colors ${operation === op ? 'text-blue-400 font-medium' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {op}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {operation !== 'delete' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Value</label>
                  <input 
                    type="number" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="input-field py-1.5"
                  />
                </div>
              )}
              {operation !== 'search' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {activeTab === 'array' ? 'Index' : 'Position'}
                  </label>
                  <input 
                    type="number" 
                    value={inputIndex}
                    onChange={(e) => setInputIndex(e.target.value)}
                    className="input-field py-1.5"
                  />
                </div>
              )}
              
              <button onClick={handleRun} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Run {operation}
              </button>
            </div>
          </div>
          
          {/* Performance Box */}
          {performance && (
            <div className="card bg-slate-800/50 border-blue-900/30">
              <h3 className="font-semibold text-blue-400 mb-3 text-sm">Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Time:</span>
                  <span className="font-mono text-slate-200">{performance.execution_time_ms} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Memory:</span>
                  <span className="font-mono text-slate-200">{performance.memory_usage_kb} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Steps:</span>
                  <span className="font-mono text-slate-200">{performance.operation_count}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Visualizer Area */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="card flex-1 flex flex-col relative overflow-hidden min-h-[400px]">
            {/* View */}
            <div className="flex-1 flex items-center justify-center">
              {activeTab === 'array' ? (
                <ArrayVisualizer state={states[currentStep]} />
              ) : (
                <LinkedListVisualizer state={states[currentStep]} />
              )}
            </div>
          </div>
          
          <AnimationControls 
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onStepForward={() => { setIsPlaying(false); setCurrentStep(p => Math.min(states.length - 1, p + 1)) }}
            onStepBack={() => { setIsPlaying(false); setCurrentStep(p => Math.max(0, p - 1)) }}
            onReset={() => { setIsPlaying(false); setCurrentStep(0) }}
            speed={speed}
            onSpeedChange={setSpeed}
            currentStep={currentStep}
            totalSteps={states.length}
            hasStarted={states.length > 0}
          />
        </div>
      </div>
    </div>
  )
}

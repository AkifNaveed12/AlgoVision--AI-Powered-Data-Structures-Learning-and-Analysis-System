import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import BSTVisualizer from '../components/Visualizer/BSTVisualizer'
import GraphVisualizer from '../components/Visualizer/GraphVisualizer'
import AnimationControls from '../components/Visualizer/AnimationControls'

// ─── Default sample data ──────────────────────────────────────────────────────
const DEFAULT_BST_VALUES = [50, 30, 70, 20, 40, 60, 80]
const DEFAULT_GRAPH_NODES = ['A', 'B', 'C', 'D', 'E', 'F']
const DEFAULT_GRAPH_EDGES = [
  { from: 'A', to: 'B' }, { from: 'A', to: 'C' },
  { from: 'B', to: 'D' }, { from: 'B', to: 'E' },
  { from: 'C', to: 'F' },
]

export default function TreesGraphs() {
  const [activeTab, setActiveTab] = useState('bst')  // 'bst' | 'graph'

  // ── BST state ──────────────────────────────────────────────────────────────
  // currentBstValues: the live array of values defining the tree (persists across ops)
  const [currentBstValues, setCurrentBstValues] = useState(DEFAULT_BST_VALUES)
  // bstValuesText: the editable text-field representation
  const [bstValuesText, setBstValuesText] = useState(DEFAULT_BST_VALUES.join(', '))
  const [bstOperation, setBstOperation] = useState('insert')  // insert|delete|search|traversal
  const [bstInputValue, setBstInputValue] = useState('90')    // value for insert/delete/search
  const [bstTraversalType, setBstTraversalType] = useState('inorder')

  // ── Graph state ────────────────────────────────────────────────────────────
  const [graphNodes, setGraphNodes] = useState(DEFAULT_GRAPH_NODES.join(', '))
  const [graphEdgesText, setGraphEdgesText] = useState(
    DEFAULT_GRAPH_EDGES.map(e => `${e.from}-${e.to}`).join(', ')
  )
  const [graphAlgo, setGraphAlgo] = useState('bfs')
  const [graphStartNode, setGraphStartNode] = useState('A')

  // ── Animation state ────────────────────────────────────────────────────────
  const [states, setStates] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(800)
  const [performance, setPerformance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const timerRef = useRef(null)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetAnimation = () => {
    setIsPlaying(false)
    setCurrentStep(0)
    setStates([])
    setPerformance(null)
    setError(null)
    clearTimeout(timerRef.current)
  }

  const parseIntList = (str) =>
    str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))

  const parseNodeList = (str) =>
    str.split(',').map(s => s.trim()).filter(Boolean)

  const parseEdgeList = (str) =>
    str.split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const parts = s.split('-')
        if (parts.length >= 2) return { from: parts[0].trim(), to: parts[1].trim() }
        return null
      })
      .filter(Boolean)

  // When the user manually edits the text field, sync currentBstValues
  const handleBstTextChange = (e) => {
    const text = e.target.value
    setBstValuesText(text)
    const parsed = parseIntList(text)
    if (parsed.length > 0) setCurrentBstValues(parsed)
  }

  // ── Run operation ──────────────────────────────────────────────────────────
  const handleRun = async () => {
    resetAnimation()
    setLoading(true)

    try {
      let endpoint = ''
      let payload = {}

      if (activeTab === 'bst') {
        const values = currentBstValues
        if (values.length === 0) { setError('Please enter BST values'); setLoading(false); return }

        if (bstOperation === 'insert') {
          const newVal = parseInt(bstInputValue)
          if (isNaN(newVal)) { setError('Enter a valid integer to insert'); setLoading(false); return }
          endpoint = '/bst/insert'
          payload = { values, new_value: newVal }

        } else if (bstOperation === 'delete') {
          const target = parseInt(bstInputValue)
          if (isNaN(target)) { setError('Enter a valid integer to delete'); setLoading(false); return }
          endpoint = '/bst/delete'
          payload = { values, target }

        } else if (bstOperation === 'search') {
          const target = parseInt(bstInputValue)
          if (isNaN(target)) { setError('Enter a valid integer to search'); setLoading(false); return }
          endpoint = '/bst/search'
          payload = { values, target }

        } else {
          // traversal
          endpoint = '/bst/traversal'
          payload = { values, traversal_type: bstTraversalType }
        }

      } else {
        // Graph
        const nodes = parseNodeList(graphNodes)
        const edges = parseEdgeList(graphEdgesText)
        const start = graphStartNode.trim()

        if (nodes.length === 0) { setError('Please enter graph nodes'); setLoading(false); return }
        if (!nodes.includes(start)) { setError(`Start node "${start}" must be in the node list`); setLoading(false); return }

        endpoint = `/graph/${graphAlgo}`
        payload = { nodes, edges, start_node: start }
      }

      const res = await api.post(endpoint, payload)
      const data = res.data

      setStates(data.states || [])
      setPerformance(data.performance || null)
      setCurrentStep(0)
      setIsPlaying(true)

      // ── Persist tree state after modifying operations ──────────────────
      if (activeTab === 'bst') {
        if (bstOperation === 'insert') {
          // Add the new value to the live tree
          const newVal = parseInt(bstInputValue)
          if (!isNaN(newVal) && !currentBstValues.includes(newVal)) {
            const updated = [...currentBstValues, newVal]
            setCurrentBstValues(updated)
            setBstValuesText(updated.join(', '))
          }
        } else if (bstOperation === 'delete' && data.found && data.updated_values) {
          // Replace live tree with the updated inorder list returned by the API
          // Re-insert in the order that preserves BST structure: we keep original
          // insertion order but exclude the deleted value
          const deleted = parseInt(bstInputValue)
          const updated = currentBstValues.filter(v => v !== deleted)
          setCurrentBstValues(updated)
          setBstValuesText(updated.join(', '))
        }
      }

      // Save performance data
      if (data.performance) {
        api.post('/performance/save', {
          algorithm: activeTab === 'bst' ? `bst_${bstOperation}` : `graph_${graphAlgo}`,
          data_structure: activeTab === 'bst' ? 'bst' : 'graph',
          operation: activeTab === 'bst' ? bstOperation : graphAlgo,
          input_size: activeTab === 'bst' ? currentBstValues.length : parseNodeList(graphNodes).length,
          execution_time_ms: data.performance.execution_time_ms,
          memory_usage_kb: data.performance.memory_usage_kb,
          operation_count: data.performance.operation_count,
          input_data: payload,
        }).catch(() => {})
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Error running operation')
    } finally {
      setLoading(false)
    }
  }

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying && states.length > 0) {
      if (currentStep < states.length - 1) {
        timerRef.current = setTimeout(() => {
          setCurrentStep(prev => prev + 1)
        }, speed)
      } else {
        setIsPlaying(false)
      }
    }
    return () => clearTimeout(timerRef.current)
  }, [isPlaying, currentStep, states, speed])

  const currentState = states[currentStep]

  // ── Operation label helper ─────────────────────────────────────────────────
  const inputLabel = () => {
    if (bstOperation === 'insert') return 'Value to Insert'
    if (bstOperation === 'delete') return 'Value to Delete'
    return 'Value to Search'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header + Tab switcher */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Trees & Graphs</h1>
          <p className="text-slate-400 mt-1">Visualize BST operations and graph traversals (BFS/DFS).</p>
        </div>

        <div className="flex bg-slate-800 rounded-lg p-1 ml-auto border border-slate-700">
          {[
            { key: 'bst', label: 'BST' },
            { key: 'graph', label: 'Graph' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => { setActiveTab(tab.key); resetAnimation() }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            {activeTab === 'bst' ? (
              <>
                <h3 className="font-semibold text-white mb-4 border-b border-slate-700 pb-2">BST Config</h3>

                <div className="space-y-4">
                  {/* Current tree values (editable) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Current Tree Values
                    </label>
                    <input
                      type="text"
                      value={bstValuesText}
                      onChange={handleBstTextChange}
                      className="input-field py-1.5 text-sm"
                      placeholder="50, 30, 70, 20, 40"
                    />
                    <p className="text-xs text-slate-600 mt-1">
                      Updates after insert/delete automatically
                    </p>
                  </div>

                  {/* Operation selector */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Operation</label>
                    <div className="space-y-1">
                      {[
                        { key: 'insert', color: 'text-green-400' },
                        { key: 'delete', color: 'text-red-400' },
                        { key: 'search', color: 'text-blue-400' },
                        { key: 'traversal', color: 'text-purple-400' },
                      ].map(({ key, color }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="bst-op"
                            value={key}
                            checked={bstOperation === key}
                            onChange={() => setBstOperation(key)}
                            className="text-blue-500"
                          />
                          <span className={`capitalize text-sm ${bstOperation === key ? color : 'text-slate-400'}`}>
                            {key}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Value input (not shown for traversal) */}
                  {bstOperation !== 'traversal' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        {inputLabel()}
                      </label>
                      <input
                        type="number"
                        value={bstInputValue}
                        onChange={e => setBstInputValue(e.target.value)}
                        className={`input-field py-1.5 ${
                          bstOperation === 'delete' ? 'border-red-700/50 focus:border-red-500' : ''
                        }`}
                      />
                    </div>
                  )}

                  {/* Traversal type selector */}
                  {bstOperation === 'traversal' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Traversal Type</label>
                      <select
                        value={bstTraversalType}
                        onChange={e => setBstTraversalType(e.target.value)}
                        className="input-field py-1.5 text-sm"
                      >
                        <option value="inorder">Inorder (L-Root-R)</option>
                        <option value="preorder">Preorder (Root-L-R)</option>
                        <option value="postorder">Postorder (L-R-Root)</option>
                      </select>
                    </div>
                  )}

                  {/* Reset tree button */}
                  <button
                    onClick={() => {
                      setCurrentBstValues(DEFAULT_BST_VALUES)
                      setBstValuesText(DEFAULT_BST_VALUES.join(', '))
                      resetAnimation()
                    }}
                    className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 border border-slate-700 rounded transition-colors"
                  >
                    Reset to Default Tree
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-white mb-4 border-b border-slate-700 pb-2">Graph Config</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Nodes (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={graphNodes}
                      onChange={e => setGraphNodes(e.target.value)}
                      className="input-field py-1.5 text-sm"
                      placeholder="A, B, C, D, E"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Edges (format: A-B, B-C)
                    </label>
                    <textarea
                      value={graphEdgesText}
                      onChange={e => setGraphEdgesText(e.target.value)}
                      className="input-field py-1.5 text-sm resize-none"
                      rows={3}
                      placeholder="A-B, A-C, B-D"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Start Node</label>
                    <input
                      type="text"
                      value={graphStartNode}
                      onChange={e => setGraphStartNode(e.target.value)}
                      className="input-field py-1.5 text-sm"
                      placeholder="A"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Algorithm</label>
                    <div className="flex gap-3">
                      {['bfs', 'dfs'].map(alg => (
                        <label key={alg} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="graph-algo"
                            value={alg}
                            checked={graphAlgo === alg}
                            onChange={() => setGraphAlgo(alg)}
                            className="text-blue-500"
                          />
                          <span className={`text-sm uppercase font-semibold ${graphAlgo === alg ? 'text-blue-400' : 'text-slate-400'}`}>
                            {alg}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="text-red-400 text-xs mt-3 bg-red-900/20 rounded p-2">{error}</p>
            )}

            <button
              onClick={handleRun}
              disabled={loading}
              className={`w-full mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-sm transition-all ${
                bstOperation === 'delete' && activeTab === 'bst'
                  ? 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-50'
                  : 'btn-primary'
              }`}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</>
              ) : (
                <>
                  {bstOperation === 'delete' && activeTab === 'bst' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                  Visualize {activeTab === 'bst' ? bstOperation : graphAlgo.toUpperCase()}
                </>
              )}
            </button>
          </div>

          {/* Performance box */}
          {performance && (
            <div className="card bg-slate-800/50 border-blue-900/30">
              <h3 className="font-semibold text-blue-400 mb-3 text-sm">Performance</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Time', value: `${performance.execution_time_ms} ms` },
                  { label: 'Memory', value: `${performance.memory_usage_kb} KB` },
                  { label: 'Steps', value: performance.operation_count },
                ].map(m => (
                  <div key={m.label} className="flex justify-between">
                    <span className="text-slate-400">{m.label}:</span>
                    <span className="font-mono text-slate-200">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live tree summary (BST only) */}
          {activeTab === 'bst' && currentBstValues.length > 0 && (
            <div className="card bg-slate-900/50 border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Current Tree</h3>
              <p className="text-xs font-mono text-slate-400 leading-relaxed break-all">
                {currentBstValues.join(' → ')}
              </p>
              <p className="text-xs text-slate-600 mt-1">{currentBstValues.length} node{currentBstValues.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>

        {/* Main Visualizer Area */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="card flex-1 flex flex-col relative overflow-hidden min-h-[420px]">
            <div className="flex-1 flex items-center justify-center">
              {activeTab === 'bst' ? (
                <BSTVisualizer state={currentState} />
              ) : (
                <GraphVisualizer state={currentState} />
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

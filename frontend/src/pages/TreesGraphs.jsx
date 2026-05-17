import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import BSTVisualizer from '../components/Visualizer/BSTVisualizer'
import GraphVisualizer from '../components/Visualizer/GraphVisualizer'
import AnimationControls from '../components/Visualizer/AnimationControls'

const DEFAULT_BST_VALUES   = [50, 30, 70, 20, 40, 60, 80]
const DEFAULT_AVL_VALUES   = [30, 20, 40, 10, 25, 35, 50]
const DEFAULT_GRAPH_NODES  = ['A', 'B', 'C', 'D', 'E', 'F']
const DEFAULT_GRAPH_EDGES  = [
  { from: 'A', to: 'B' }, { from: 'A', to: 'C' },
  { from: 'B', to: 'D' }, { from: 'B', to: 'E' },
  { from: 'C', to: 'F' },
]

export default function TreesGraphs() {
  const [activeTab, setActiveTab] = useState('bst')  // 'bst' | 'avl' | 'graph'

  // ── BST state ──────────────────────────────────────────────────────────────
  const [currentBstValues, setCurrentBstValues] = useState(DEFAULT_BST_VALUES)
  const [bstValuesText, setBstValuesText]       = useState(DEFAULT_BST_VALUES.join(', '))
  const [bstOperation, setBstOperation]         = useState('insert')
  const [bstInputValue, setBstInputValue]       = useState('90')
  const [bstTraversalType, setBstTraversalType] = useState('inorder')

  // ── AVL state ──────────────────────────────────────────────────────────────
  const [currentAvlValues, setCurrentAvlValues] = useState(DEFAULT_AVL_VALUES)
  const [avlValuesText, setAvlValuesText]       = useState(DEFAULT_AVL_VALUES.join(', '))
  const [avlOperation, setAvlOperation]         = useState('insert')
  const [avlInputValue, setAvlInputValue]       = useState('15')
  const [avlTraversalType, setAvlTraversalType] = useState('inorder')

  // ── Graph state ────────────────────────────────────────────────────────────
  const [graphNodes, setGraphNodes]         = useState(DEFAULT_GRAPH_NODES.join(', '))
  const [graphEdgesText, setGraphEdgesText] = useState(
    DEFAULT_GRAPH_EDGES.map(e => `${e.from}-${e.to}`).join(', ')
  )
  const [graphAlgo, setGraphAlgo]           = useState('bfs')
  const [graphStartNode, setGraphStartNode] = useState('A')

  // ── Animation state ────────────────────────────────────────────────────────
  const [states, setStates]           = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying]     = useState(false)
  const [speed, setSpeed]             = useState(800)
  const [performance, setPerformance] = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  const timerRef = useRef(null)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetAnimation = () => {
    setIsPlaying(false); setCurrentStep(0); setStates([])
    setPerformance(null); setError(null); clearTimeout(timerRef.current)
  }

  const parseIntList  = s => s.split(',').map(x => parseInt(x.trim())).filter(n => !isNaN(n))
  const parseNodeList = s => s.split(',').map(x => x.trim()).filter(Boolean)
  const parseEdgeList = s => s.split(',').map(x => x.trim()).filter(Boolean)
    .map(x => { const p = x.split('-'); return p.length >= 2 ? { from: p[0].trim(), to: p[1].trim() } : null })
    .filter(Boolean)

  const handleBstTextChange = e => {
    setBstValuesText(e.target.value)
    const p = parseIntList(e.target.value)
    if (p.length > 0) setCurrentBstValues(p)
  }

  const handleAvlTextChange = e => {
    setAvlValuesText(e.target.value)
    const p = parseIntList(e.target.value)
    if (p.length > 0) setCurrentAvlValues(p)
  }

  // ── Run ────────────────────────────────────────────────────────────────────
  const handleRun = async () => {
    resetAnimation()
    setLoading(true)

    try {
      let endpoint = '', payload = {}

      if (activeTab === 'bst') {
        if (currentBstValues.length === 0) { setError('Enter BST values'); setLoading(false); return }
        if (bstOperation === 'insert') {
          const v = parseInt(bstInputValue)
          if (isNaN(v)) { setError('Enter a valid integer to insert'); setLoading(false); return }
          endpoint = '/bst/insert'; payload = { values: currentBstValues, new_value: v }
        } else if (bstOperation === 'delete') {
          const v = parseInt(bstInputValue)
          if (isNaN(v)) { setError('Enter a valid integer to delete'); setLoading(false); return }
          endpoint = '/bst/delete'; payload = { values: currentBstValues, target: v }
        } else if (bstOperation === 'search') {
          const v = parseInt(bstInputValue)
          if (isNaN(v)) { setError('Enter a valid integer to search'); setLoading(false); return }
          endpoint = '/bst/search'; payload = { values: currentBstValues, target: v }
        } else {
          endpoint = '/bst/traversal'; payload = { values: currentBstValues, traversal_type: bstTraversalType }
        }

      } else if (activeTab === 'avl') {
        if (currentAvlValues.length === 0) { setError('Enter AVL values'); setLoading(false); return }
        if (avlOperation === 'insert') {
          const v = parseInt(avlInputValue)
          if (isNaN(v)) { setError('Enter a valid integer to insert'); setLoading(false); return }
          endpoint = '/avl/insert'; payload = { values: currentAvlValues, new_value: v }
        } else if (avlOperation === 'delete') {
          const v = parseInt(avlInputValue)
          if (isNaN(v)) { setError('Enter a valid integer to delete'); setLoading(false); return }
          endpoint = '/avl/delete'; payload = { values: currentAvlValues, target: v }
        } else if (avlOperation === 'search') {
          const v = parseInt(avlInputValue)
          if (isNaN(v)) { setError('Enter a valid integer to search'); setLoading(false); return }
          endpoint = '/avl/search'; payload = { values: currentAvlValues, target: v }
        } else {
          endpoint = '/avl/traversal'; payload = { values: currentAvlValues, traversal_type: avlTraversalType }
        }

      } else {
        // Graph
        const nodes = parseNodeList(graphNodes)
        const edges = parseEdgeList(graphEdgesText)
        const start = graphStartNode.trim()
        if (nodes.length === 0) { setError('Enter graph nodes'); setLoading(false); return }
        if (!nodes.includes(start)) { setError(`Start node "${start}" must be in the node list`); setLoading(false); return }
        endpoint = `/graph/${graphAlgo}`; payload = { nodes, edges, start_node: start }
      }

      const res  = await api.post(endpoint, payload)
      const data = res.data

      setStates(data.states || [])
      setPerformance(data.performance || null)
      setCurrentStep(0)
      setIsPlaying(true)

      // Persist tree state after mutating operations
      if (activeTab === 'bst') {
        if (bstOperation === 'insert') {
          const v = parseInt(bstInputValue)
          if (!isNaN(v) && !currentBstValues.includes(v)) {
            const u = [...currentBstValues, v]
            setCurrentBstValues(u); setBstValuesText(u.join(', '))
          }
        } else if (bstOperation === 'delete' && data.found && data.updated_values) {
          const deleted = parseInt(bstInputValue)
          const u = currentBstValues.filter(x => x !== deleted)
          setCurrentBstValues(u); setBstValuesText(u.join(', '))
        }
      }

      if (activeTab === 'avl') {
        if (avlOperation === 'insert') {
          const v = parseInt(avlInputValue)
          if (!isNaN(v) && !currentAvlValues.includes(v)) {
            const u = [...currentAvlValues, v]
            setCurrentAvlValues(u); setAvlValuesText(u.join(', '))
          }
        } else if (avlOperation === 'delete' && data.found && data.updated_values) {
          setCurrentAvlValues(data.updated_values)
          setAvlValuesText(data.updated_values.join(', '))
        }
      }

      // Save performance
      if (data.performance) {
        const ds  = activeTab === 'graph' ? 'graph' : activeTab
        const op  = activeTab === 'bst' ? bstOperation : activeTab === 'avl' ? avlOperation : graphAlgo
        const sz  = activeTab === 'graph' ? parseNodeList(graphNodes).length
                  : activeTab === 'avl'   ? currentAvlValues.length
                  : currentBstValues.length
        api.post('/performance/save', {
          algorithm: `${ds}_${op}`,
          data_structure: ds,
          operation: op,
          input_size: sz,
          execution_time_ms:  data.performance.execution_time_ms,
          memory_usage_kb:    data.performance.memory_usage_kb,
          operation_count:    data.performance.operation_count,
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
        timerRef.current = setTimeout(() => setCurrentStep(p => p + 1), speed)
      } else {
        setIsPlaying(false)
      }
    }
    return () => clearTimeout(timerRef.current)
  }, [isPlaying, currentStep, states, speed])

  const currentState = states[currentStep]

  const inputLabel = (op) => {
    if (op === 'insert') return 'Value to Insert'
    if (op === 'delete') return 'Value to Delete'
    return 'Value to Search'
  }

  // ── Shared operation radio list ────────────────────────────────────────────
  const OpsRadio = ({ op, setOp, name }) => (
    <div className="space-y-1">
      {[
        { key: 'insert',    color: 'text-green-400'  },
        { key: 'delete',    color: 'text-red-400'    },
        { key: 'search',    color: 'text-blue-400'   },
        { key: 'traversal', color: 'text-purple-400' },
      ].map(({ key, color }) => (
        <label key={key} className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} value={key}
            checked={op === key} onChange={() => setOp(key)}
            className="text-blue-500" />
          <span className={`capitalize text-sm ${op === key ? color : 'text-slate-400'}`}>{key}</span>
        </label>
      ))}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header + Tab switcher */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Trees &amp; Graphs</h1>
          <p className="text-slate-400 mt-1">
            Visualize BST &amp; AVL operations with rotation animations, plus graph traversals.
          </p>
        </div>

        <div className="flex bg-slate-800 rounded-lg p-1 ml-auto border border-slate-700">
          {[
            { key: 'bst',   label: 'BST'   },
            { key: 'avl',   label: 'AVL'   },
            { key: 'graph', label: 'Graph' },
          ].map(tab => (
            <button key={tab.key}
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

      {/* AVL info banner */}
      {activeTab === 'avl' && (
        <div className="mb-4 rounded-lg border border-purple-800/40 bg-purple-950/30 px-4 py-2.5 text-sm text-purple-300 flex items-start gap-2">
          <span className="text-lg leading-none">⚖️</span>
          <span>
            <strong className="text-purple-200">AVL Tree</strong> — self-balancing BST.
            Each node shows its <span className="font-mono">bf</span> (balance factor = height(left) − height(right)).
            When |bf| &gt; 1 the tree triggers a <strong>LL / RR / LR / RL</strong> rotation to restore balance.
            Watch the <span className="text-orange-300">orange glow</span> for imbalance and
            <span className="text-purple-300"> purple glow</span> for the rotation step.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">

            {/* BST Config */}
            {activeTab === 'bst' && (
              <>
                <h3 className="font-semibold text-white mb-4 border-b border-slate-700 pb-2">BST Config</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Current Tree Values</label>
                    <input type="text" value={bstValuesText} onChange={handleBstTextChange}
                      className="input-field py-1.5 text-sm" placeholder="50, 30, 70, 20, 40" />
                    <p className="text-xs text-slate-600 mt-1">Updates after insert/delete</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Operation</label>
                    <OpsRadio op={bstOperation} setOp={setBstOperation} name="bst-op" />
                  </div>
                  {bstOperation !== 'traversal' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{inputLabel(bstOperation)}</label>
                      <input type="number" value={bstInputValue} onChange={e => setBstInputValue(e.target.value)}
                        className={`input-field py-1.5 ${bstOperation === 'delete' ? 'border-red-700/50 focus:border-red-500' : ''}`} />
                    </div>
                  )}
                  {bstOperation === 'traversal' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Traversal Type</label>
                      <select value={bstTraversalType} onChange={e => setBstTraversalType(e.target.value)}
                        className="input-field py-1.5 text-sm">
                        <option value="inorder">Inorder (L-Root-R)</option>
                        <option value="preorder">Preorder (Root-L-R)</option>
                        <option value="postorder">Postorder (L-R-Root)</option>
                      </select>
                    </div>
                  )}
                  <button onClick={() => { setCurrentBstValues(DEFAULT_BST_VALUES); setBstValuesText(DEFAULT_BST_VALUES.join(', ')); resetAnimation() }}
                    className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 border border-slate-700 rounded transition-colors">
                    Reset to Default Tree
                  </button>
                </div>
              </>
            )}

            {/* AVL Config */}
            {activeTab === 'avl' && (
              <>
                <h3 className="font-semibold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
                  <span className="text-purple-400">⚖</span> AVL Config
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Current Tree Values</label>
                    <input type="text" value={avlValuesText} onChange={handleAvlTextChange}
                      className="input-field py-1.5 text-sm" placeholder="30, 20, 40, 10" />
                    <p className="text-xs text-slate-600 mt-1">Auto-rebalances on every change</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Operation</label>
                    <OpsRadio op={avlOperation} setOp={setAvlOperation} name="avl-op" />
                  </div>
                  {avlOperation !== 'traversal' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{inputLabel(avlOperation)}</label>
                      <input type="number" value={avlInputValue} onChange={e => setAvlInputValue(e.target.value)}
                        className={`input-field py-1.5 ${avlOperation === 'delete' ? 'border-red-700/50 focus:border-red-500' : ''}`} />
                    </div>
                  )}
                  {avlOperation === 'traversal' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Traversal Type</label>
                      <select value={avlTraversalType} onChange={e => setAvlTraversalType(e.target.value)}
                        className="input-field py-1.5 text-sm">
                        <option value="inorder">Inorder (L-Root-R)</option>
                        <option value="preorder">Preorder (Root-L-R)</option>
                        <option value="postorder">Postorder (L-R-Root)</option>
                      </select>
                    </div>
                  )}
                  <button onClick={() => { setCurrentAvlValues(DEFAULT_AVL_VALUES); setAvlValuesText(DEFAULT_AVL_VALUES.join(', ')); resetAnimation() }}
                    className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 border border-slate-700 rounded transition-colors">
                    Reset to Default Tree
                  </button>
                </div>
              </>
            )}

            {/* Graph Config */}
            {activeTab === 'graph' && (
              <>
                <h3 className="font-semibold text-white mb-4 border-b border-slate-700 pb-2">Graph Config</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nodes (comma-separated)</label>
                    <input type="text" value={graphNodes} onChange={e => setGraphNodes(e.target.value)}
                      className="input-field py-1.5 text-sm" placeholder="A, B, C, D, E" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Edges (format: A-B, B-C)</label>
                    <textarea value={graphEdgesText} onChange={e => setGraphEdgesText(e.target.value)}
                      className="input-field py-1.5 text-sm resize-none" rows={3} placeholder="A-B, A-C, B-D" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Start Node</label>
                    <input type="text" value={graphStartNode} onChange={e => setGraphStartNode(e.target.value)}
                      className="input-field py-1.5 text-sm" placeholder="A" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Algorithm</label>
                    <div className="flex gap-3">
                      {['bfs', 'dfs'].map(alg => (
                        <label key={alg} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="graph-algo" value={alg}
                            checked={graphAlgo === alg} onChange={() => setGraphAlgo(alg)}
                            className="text-blue-500" />
                          <span className={`text-sm uppercase font-semibold ${graphAlgo === alg ? 'text-blue-400' : 'text-slate-400'}`}>{alg}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-red-400 text-xs mt-3 bg-red-900/20 rounded p-2">{error}</p>}

            <button onClick={handleRun} disabled={loading}
              className={`w-full mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-sm transition-all ${
                (activeTab === 'bst' && bstOperation === 'delete') || (activeTab === 'avl' && avlOperation === 'delete')
                  ? 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-50'
                  : 'btn-primary'
              }`}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Visualize {
                    activeTab === 'avl'   ? avlOperation :
                    activeTab === 'bst'   ? bstOperation :
                    graphAlgo.toUpperCase()
                  }
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
                  { label: 'Time',   value: `${performance.execution_time_ms} ms` },
                  { label: 'Memory', value: `${performance.memory_usage_kb} KB`   },
                  { label: 'Steps',  value: performance.operation_count            },
                ].map(m => (
                  <div key={m.label} className="flex justify-between">
                    <span className="text-slate-400">{m.label}:</span>
                    <span className="font-mono text-slate-200">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live tree summary */}
          {activeTab === 'bst' && currentBstValues.length > 0 && (
            <div className="card bg-slate-900/50 border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Current BST</h3>
              <p className="text-xs font-mono text-slate-400 leading-relaxed break-all">{currentBstValues.join(' → ')}</p>
              <p className="text-xs text-slate-600 mt-1">{currentBstValues.length} node{currentBstValues.length !== 1 ? 's' : ''}</p>
            </div>
          )}

          {activeTab === 'avl' && currentAvlValues.length > 0 && (
            <div className="card bg-slate-900/50 border-purple-900/30">
              <h3 className="text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wide">Current AVL</h3>
              <p className="text-xs font-mono text-slate-400 leading-relaxed break-all">{currentAvlValues.join(' → ')}</p>
              <p className="text-xs text-slate-600 mt-1">{currentAvlValues.length} node{currentAvlValues.length !== 1 ? 's' : ''} · always balanced</p>
            </div>
          )}
        </div>

        {/* ── Main Visualizer ── */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="card flex-1 flex flex-col relative overflow-hidden min-h-[420px]">
            <div className="flex-1 flex items-center justify-center">
              {activeTab === 'graph' ? (
                <GraphVisualizer state={currentState} />
              ) : (
                <BSTVisualizer state={currentState} />
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

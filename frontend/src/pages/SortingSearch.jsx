import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import SortingVisualizer from '../components/Visualizer/SortingVisualizer'
import ArrayVisualizer from '../components/Visualizer/ArrayVisualizer'
import AnimationControls from '../components/Visualizer/AnimationControls'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const SORT_ALGORITHMS = [
  { key: 'bubble', label: 'Bubble Sort', color: '#3b82f6' },
  { key: 'selection', label: 'Selection Sort', color: '#8b5cf6' },
  { key: 'insertion', label: 'Insertion Sort', color: '#06b6d4' },
  { key: 'merge', label: 'Merge Sort', color: '#22c55e' },
  { key: 'quick', label: 'Quick Sort', color: '#f97316' },
]

export default function SortingSearch() {
  const [activeMode, setActiveMode] = useState('sort')  // 'sort' | 'binary-search' | 'race'

  // Sort state
  const [sortAlgorithm, setSortAlgorithm] = useState('bubble')
  const [sortArrayText, setSortArrayText] = useState('64, 34, 25, 12, 22, 11, 90')

  // Binary Search state
  const [bsArrayText, setBsArrayText] = useState('5, 10, 15, 20, 25, 30, 35, 40')
  const [bsTarget, setBsTarget] = useState('25')

  // Race state
  const [raceArrayText, setRaceArrayText] = useState('64, 34, 25, 12, 22, 11, 90, 48')
  const [selectedRaceAlgos, setSelectedRaceAlgos] = useState(['bubble', 'merge', 'quick'])
  const [raceResults, setRaceResults] = useState(null)
  const [raceLoading, setRaceLoading] = useState(false)

  // Animation state
  const [states, setStates] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(400)
  const [performance, setPerformance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const timerRef = useRef(null)

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

  // ── Run sort or binary search ──────────────────────────────────────────────
  const handleRun = async () => {
    resetAnimation()
    setLoading(true)

    try {
      let res
      if (activeMode === 'sort') {
        const array = parseIntList(sortArrayText)
        if (array.length === 0) { setError('Enter array values'); setLoading(false); return }
        res = await api.post('/sorting/sort', { array, algorithm: sortAlgorithm })
      } else {
        const array = parseIntList(bsArrayText)
        const target = parseInt(bsTarget)
        if (array.length === 0 || isNaN(target)) { setError('Enter valid array and target'); setLoading(false); return }
        res = await api.post('/sorting/binary-search', { array, target })
      }

      setStates(res.data.states || [])
      setPerformance(res.data.performance || null)
      setCurrentStep(0)
      setIsPlaying(true)

      if (res.data.performance) {
        api.post('/performance/save', {
          algorithm: activeMode === 'sort' ? `${sortAlgorithm}_sort` : 'binary_search',
          data_structure: 'array',
          operation: activeMode === 'sort' ? 'sort' : 'search',
          input_size: activeMode === 'sort' ? parseIntList(sortArrayText).length : parseIntList(bsArrayText).length,
          execution_time_ms: res.data.performance.execution_time_ms,
          memory_usage_kb: res.data.performance.memory_usage_kb,
          operation_count: res.data.performance.operation_count,
          input_data: {},
        }).catch(() => {})
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error running operation')
    } finally {
      setLoading(false)
    }
  }

  // ── Run race mode ──────────────────────────────────────────────────────────
  const handleRace = async () => {
    if (selectedRaceAlgos.length < 2) { setError('Select at least 2 algorithms for race'); return }
    setRaceLoading(true)
    setError(null)
    try {
      const array = parseIntList(raceArrayText)
      if (array.length === 0) { setError('Enter array values'); setRaceLoading(false); return }
      const res = await api.post('/sorting/race', { array, algorithms: selectedRaceAlgos })
      setRaceResults(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Race error')
    } finally {
      setRaceLoading(false)
    }
  }

  const toggleRaceAlgo = (key) => {
    setSelectedRaceAlgos(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
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

  // ── Race chart data ────────────────────────────────────────────────────────
  const raceChartData = raceResults ? {
    labels: Object.keys(raceResults.race_results).map(k => {
      const alg = SORT_ALGORITHMS.find(a => a.key === k)
      return alg ? alg.label : k
    }),
    datasets: [
      {
        label: 'Operation Count',
        data: Object.values(raceResults.race_results).map(r => r.operation_count),
        backgroundColor: Object.keys(raceResults.race_results).map(k => {
          const alg = SORT_ALGORITHMS.find(a => a.key === k)
          return alg ? alg.color + 'cc' : '#3b82f6cc'
        }),
        borderColor: Object.keys(raceResults.race_results).map(k => {
          const alg = SORT_ALGORITHMS.find(a => a.key === k)
          return alg ? alg.color : '#3b82f6'
        }),
        borderWidth: 2,
      }
    ]
  } : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header + mode switcher */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Sorting & Searching</h1>
          <p className="text-slate-400 mt-1">Sorting algorithms, Binary Search, and Algorithm Race mode.</p>
        </div>

        <div className="flex bg-slate-800 rounded-lg p-1 ml-auto border border-slate-700">
          {[
            { key: 'sort', label: 'Sort' },
            { key: 'binary-search', label: 'Binary Search' },
            { key: 'race', label: '🏁 Race' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeMode === tab.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => { setActiveMode(tab.key); resetAnimation(); setRaceResults(null) }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RACE MODE ─────────────────────────────────────────────────────────── */}
      {activeMode === 'race' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-white mb-4 border-b border-slate-700 pb-2">Algorithm Race Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Array (comma-separated)</label>
                <input
                  type="text"
                  value={raceArrayText}
                  onChange={e => setRaceArrayText(e.target.value)}
                  className="input-field py-1.5"
                  placeholder="64, 34, 25, 12, 22, 11, 90"
                />
                <p className="text-xs text-slate-500 mt-1">Max 30 elements for visualization</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Select Algorithms to Race</label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_ALGORITHMS.map(alg => (
                    <label key={alg.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRaceAlgos.includes(alg.key)}
                        onChange={() => toggleRaceAlgo(alg.key)}
                        className="rounded"
                      />
                      <span className="text-sm" style={{ color: alg.color }}>{alg.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs mt-3 bg-red-900/20 rounded p-2">{error}</p>}

            <button
              onClick={handleRace}
              disabled={raceLoading}
              className="btn-primary mt-4 flex items-center gap-2"
            >
              {raceLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Racing...</>
              ) : (
                <>🏁 Start Race</>
              )}
            </button>
          </div>

          {raceResults && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Results table */}
              <div className="card">
                <h3 className="font-semibold text-white mb-4">Race Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 text-slate-400">Algorithm</th>
                        <th className="text-right py-2 text-slate-400">Time (ms)</th>
                        <th className="text-right py-2 text-slate-400">Memory (KB)</th>
                        <th className="text-right py-2 text-slate-400">Operations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(raceResults.race_results)
                        .sort((a, b) => a[1].operation_count - b[1].operation_count)
                        .map(([key, result], idx) => {
                          const alg = SORT_ALGORITHMS.find(a => a.key === key)
                          return (
                            <tr key={key} className="border-b border-slate-800">
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  {idx === 0 && <span title="Winner">🏆</span>}
                                  <span style={{ color: alg?.color || '#fff' }}>{alg?.label || key}</span>
                                </div>
                              </td>
                              <td className="text-right font-mono text-slate-300">{result.execution_time_ms}</td>
                              <td className="text-right font-mono text-slate-300">{result.memory_usage_kb}</td>
                              <td className="text-right font-mono text-slate-300">{result.operation_count}</td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bar chart */}
              {raceChartData && (
                <div className="card">
                  <h3 className="font-semibold text-white mb-4">Operations Comparison</h3>
                  <Bar
                    data={raceChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' }, beginAtZero: true },
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SORT / BINARY SEARCH MODE ──────────────────────────────────────────── */}
      {activeMode !== 'race' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              {activeMode === 'sort' ? (
                <>
                  <h3 className="font-semibold text-white mb-4 border-b border-slate-700 pb-2">Sort Config</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Array (comma-separated)</label>
                      <input
                        type="text"
                        value={sortArrayText}
                        onChange={e => setSortArrayText(e.target.value)}
                        className="input-field py-1.5 text-sm"
                        placeholder="64, 34, 25, 12, 22"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Algorithm</label>
                      <div className="space-y-1">
                        {SORT_ALGORITHMS.map(alg => (
                          <label key={alg.key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="sort-alg"
                              value={alg.key}
                              checked={sortAlgorithm === alg.key}
                              onChange={() => setSortAlgorithm(alg.key)}
                              className="text-blue-500"
                            />
                            <span className="text-sm" style={{ color: sortAlgorithm === alg.key ? alg.color : '#94a3b8' }}>
                              {alg.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-white mb-4 border-b border-slate-700 pb-2">Binary Search</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Array (sorted, comma-separated)
                      </label>
                      <input
                        type="text"
                        value={bsArrayText}
                        onChange={e => setBsArrayText(e.target.value)}
                        className="input-field py-1.5 text-sm"
                        placeholder="5, 10, 15, 20, 25"
                      />
                      <p className="text-xs text-slate-500 mt-1">Will be auto-sorted if not sorted</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Target Value</label>
                      <input
                        type="number"
                        value={bsTarget}
                        onChange={e => setBsTarget(e.target.value)}
                        className="input-field py-1.5"
                      />
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
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</>
                ) : (
                  <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg> Visualize</>
                )}
              </button>
            </div>

            {performance && (
              <div className="card bg-slate-800/50 border-blue-900/30">
                <h3 className="font-semibold text-blue-400 mb-3 text-sm">Performance</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Time', value: `${performance.execution_time_ms} ms` },
                    { label: 'Memory', value: `${performance.memory_usage_kb} KB` },
                    { label: 'Operations', value: performance.operation_count },
                  ].map(m => (
                    <div key={m.label} className="flex justify-between">
                      <span className="text-slate-400">{m.label}:</span>
                      <span className="font-mono text-slate-200">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visualizer */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            <div className="card flex-1 flex flex-col relative overflow-hidden min-h-[380px]">
              <div className="flex-1 flex items-center justify-center">
                {activeMode === 'sort' ? (
                  <SortingVisualizer state={currentState} />
                ) : (
                  <ArrayVisualizer state={currentState} />
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
      )}
    </div>
  )
}

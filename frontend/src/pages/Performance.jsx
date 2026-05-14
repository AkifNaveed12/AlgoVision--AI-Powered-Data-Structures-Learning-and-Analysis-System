import { useState, useEffect } from 'react'
import api from '../lib/api'
import { CompareChart, HistoryLineChart } from '../components/Charts/PerformanceChart'

export default function Performance() {
  const [runs, setRuns] = useState([])
  const [compareData, setCompareData] = useState(null)
  const [loading, setLoading] = useState(true)

  const [compareAlgos, setCompareAlgos] = useState('array_search,linkedlist_search')

  useEffect(() => {
    fetchHistory()
    fetchComparison(compareAlgos)
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await api.get('/performance/history')
      setRuns(res.data.runs)
    } catch (err) {
      console.error('Failed to fetch history', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchComparison = async (algos) => {
    try {
      const res = await api.get(`/performance/compare?algorithms=${algos}`)
      setCompareData(res.data.comparison)
    } catch (err) {
      console.error('Failed to fetch comparison', err)
    }
  }

  const handleCompareSubmit = (e) => {
    e.preventDefault()
    fetchComparison(compareAlgos)
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading performance data...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Performance Analytics</h1>
        <p className="text-slate-400 mt-1">Analyze execution time and memory usage of your algorithm runs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Compare Box */}
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-bold text-white mb-4">Algorithm Comparison</h3>
          <form onSubmit={handleCompareSubmit} className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">
              Comma-separated algorithms (e.g. array_search,linkedlist_search)
            </label>
            <div className="flex gap-2">
              <input
                value={compareAlgos}
                onChange={e => setCompareAlgos(e.target.value)}
                className="input-field py-1.5 px-3 text-sm flex-1"
                placeholder="algo1,algo2"
              />
              <button type="submit" className="btn-primary py-1.5 px-3 text-sm">Compare</button>
            </div>
          </form>

          {compareData && (
            <div className="space-y-6">
              <CompareChart data={compareData} metric="avg_time_ms" title="Avg Time (ms)" />
              <CompareChart data={compareData} metric="avg_memory_kb" title="Avg Memory (KB)" />
            </div>
          )}
        </div>

        {/* History Graph */}
        <div className="card lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-2">Recent Execution History</h3>
          <p className="text-sm text-slate-400 mb-6">Execution time and operation counts over your last 20 runs.</p>
          
          {runs.length > 0 ? (
            <div className="flex-1 min-h-[300px] flex items-center">
              <HistoryLineChart runs={runs} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg">
              <p className="text-slate-500">Go to the Visualizer and run some algorithms to see data here.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="text-lg font-bold text-white">Detailed Run History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Structure</th>
                <th className="px-6 py-3 font-medium">Operation</th>
                <th className="px-6 py-3 font-medium">Input Size</th>
                <th className="px-6 py-3 font-medium">Time (ms)</th>
                <th className="px-6 py-3 font-medium">Memory (KB)</th>
                <th className="px-6 py-3 font-medium">Steps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {runs.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 text-slate-400">{new Date(r.ran_at).toLocaleString()}</td>
                  <td className="px-6 py-3 font-medium text-blue-400">{r.data_structure}</td>
                  <td className="px-6 py-3 text-slate-200 capitalize">{r.operation}</td>
                  <td className="px-6 py-3 text-slate-400 font-mono">{r.input_size}</td>
                  <td className="px-6 py-3 text-slate-200 font-mono">{r.execution_time_ms.toFixed(3)}</td>
                  <td className="px-6 py-3 text-slate-200 font-mono">{r.memory_usage_kb.toFixed(2)}</td>
                  <td className="px-6 py-3 text-emerald-400 font-mono font-bold">{r.operation_count}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No runs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

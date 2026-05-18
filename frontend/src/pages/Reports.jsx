import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import { CompareChart, HistoryLineChart } from '../components/Charts/PerformanceChart'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialFetchDone, setInitialFetchDone] = useState(false)

  // Off-screen chart generation state
  const [offscreenRuns, setOffscreenRuns] = useState(null)
  const [offscreenCompare, setOffscreenCompare] = useState(null)
  const historyChartRef = useRef(null)
  const compareTimeChartRef = useRef(null)
  const compareMemChartRef = useRef(null)

  const fetchReports = async () => {
    try {
      const res = await api.get('/report/list')
      setReports(res.data.reports)
    } catch (err) {
      console.error(err)
    } finally {
      setInitialFetchDone(true)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    try {
      // 1. Fetch data required for the charts
      const historyRes = await api.get('/performance/history')
      const compareRes = await api.get('/performance/compare?algorithms=array_search,linkedlist_search')
      
      setOffscreenRuns(historyRes.data.runs)
      setOffscreenCompare(compareRes.data.comparison)
      
      // 2. Wait for React to render the off-screen charts
      await new Promise(resolve => setTimeout(resolve, 500))

      // 3. Capture Base64 images
      const chart_images = []
      if (historyChartRef.current) chart_images.push(historyChartRef.current.toBase64Image())
      if (compareTimeChartRef.current) chart_images.push(compareTimeChartRef.current.toBase64Image())
      if (compareMemChartRef.current) chart_images.push(compareMemChartRef.current.toBase64Image())

      // 4. Send to backend
      const res = await api.post('/report/generate', { chart_images })
      await fetchReports()
      
      // Auto download
      const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const token = localStorage.getItem('access_token')
      
      const link = document.createElement('a')
      link.href = `${baseURL}${res.data.download_url}`
      // Send token via query or cookie doesn't work easily for raw <a> tag in protected routes if cookies aren't used.
      // So we fetch as blob.
      
      const blobRes = await api.get(res.data.download_url, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([blobRes.data]))
      link.href = url
      link.setAttribute('download', `AlgoVision_Report_${res.data.report_id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (reportId) => {
    try {
      const blobRes = await api.get(`/report/download/${reportId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([blobRes.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `AlgoVision_Report_${reportId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      alert('Failed to download report')
    }
  }

  if (!initialFetchDone) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card text-center py-12 mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <div className="w-20 h-20 rounded-full bg-blue-900/30 flex items-center justify-center text-4xl mx-auto mb-6">
          📄
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Learning Progress Report</h1>
        <p className="text-slate-400 max-w-lg mx-auto mb-8">
          Generate a comprehensive PDF report containing your algorithm execution history, 
          practice problem attempts, and overall performance metrics.
        </p>
        
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          className="btn-primary text-lg px-8 py-3 flex items-center gap-2 mx-auto glow-blue"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              Generating PDF...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Generate & Download New Report
            </>
          )}
        </button>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">Past Reports</h3>
        
        {reports.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No reports generated yet.</p>
        ) : (
          <div className="grid gap-3">
            {reports.map(r => (
              <div key={r.id} className="card p-4 flex items-center justify-between hover:border-slate-500 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400">
                    PDF
                  </div>
                  <div>
                    <h4 className="text-slate-200 font-medium">AlgoVision_Report_{r.id}.pdf</h4>
                    <span className="text-xs text-slate-500">{new Date(r.generated_at).toLocaleString()}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDownload(r.id)}
                  className="p-2 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors"
                  title="Download"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden container for PDF chart generation */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px', opacity: 0, pointerEvents: 'none' }}>
        {offscreenRuns && <HistoryLineChart chartRef={historyChartRef} runs={offscreenRuns} disableAnimation={true} />}
        {offscreenCompare && (
          <>
            <CompareChart chartRef={compareTimeChartRef} data={offscreenCompare} metric="avg_time_ms" title="Avg Time (ms)" disableAnimation={true} />
            <CompareChart chartRef={compareMemChartRef} data={offscreenCompare} metric="avg_memory_kb" title="Avg Memory (KB)" disableAnimation={true} />
          </>
        )}
      </div>
    </div>
  )
}

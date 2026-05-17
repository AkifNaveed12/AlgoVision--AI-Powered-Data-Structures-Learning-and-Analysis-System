import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#94a3b8', font: { family: 'Inter' } }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 10,
    }
  },
  scales: {
    y: {
      grid: { color: '#334155', drawBorder: false },
      ticks: { color: '#94a3b8' }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8' }
    }
  }
}

export function CompareChart({ data, metric, title, chartRef }) {
  if (!data) return null

  const labels = Object.keys(data)
  const isTime = metric === 'avg_time_ms'
  
  const dataset = {
    labels,
    datasets: [
      {
        label: isTime ? 'Time (ms)' : 'Memory (KB)',
        data: labels.map(l => data[l][metric]),
        backgroundColor: isTime ? 'rgba(59, 130, 246, 0.5)' : 'rgba(139, 92, 246, 0.5)',
        borderColor: isTime ? '#3b82f6' : '#8b5cf6',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  }

  return (
    <div className="h-64 w-full">
      <Bar ref={chartRef} options={{ ...CHART_OPTIONS, plugins: { ...CHART_OPTIONS.plugins, title: { display: true, text: title, color: '#f1f5f9' } } }} data={dataset} />
    </div>
  )
}

export function HistoryLineChart({ runs, chartRef }) {
  if (!runs || runs.length === 0) return null
  
  // Sort chronological for line chart
  const sorted = [...runs].reverse().slice(-20) // Last 20 runs
  
  const dataset = {
    labels: sorted.map(r => new Date(r.ran_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Execution Time (ms)',
        data: sorted.map(r => r.execution_time_ms),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Operations',
        data: sorted.map(r => r.operation_count),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderDash: [5, 5],
        yAxisID: 'y1'
      }
    ]
  }

  const options = {
    ...CHART_OPTIONS,
    scales: {
      ...CHART_OPTIONS.scales,
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#10b981' }
      }
    }
  }

  return (
    <div className="h-72 w-full">
      <Line ref={chartRef} options={options} data={dataset} />
    </div>
  )
}

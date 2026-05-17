/**
 * SortingVisualizer — renders an array with sorting-specific state.
 * Supports highlight, highlight2 (comparison partner), and sorted_indices.
 *
 * Props:
 *   state: {
 *     type: 'array',
 *     elements: number[],
 *     highlight: number | null,       -- primary highlighted index
 *     highlight2: number | null,      -- secondary (comparison partner)
 *     sorted_indices: number[],       -- finalized positions
 *     operation: string,
 *     message: string
 *   }
 */
export default function SortingVisualizer({ state }) {
  if (!state || !state.elements) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <p className="text-sm">Enter array values and choose a sorting algorithm</p>
        </div>
      </div>
    )
  }

  const { elements, highlight, highlight2, sorted_indices = [], operation, message } = state

  // Find max for bar height scaling
  const maxVal = Math.max(...elements.map(Math.abs), 1)

  const getBarColor = (idx) => {
    if (sorted_indices.includes(idx)) return '#22c55e'        // green: sorted
    if (idx === highlight) {
      if (operation === 'swap') return '#f97316'              // orange: being swapped
      if (operation === 'pivot' || operation === 'placed') return '#a855f7'  // purple: pivot
      if (operation === 'insert') return '#22c55e'            // green: inserted
      return '#eab308'                                         // yellow: primary highlight
    }
    if (idx === highlight2) {
      if (operation === 'swap') return '#f97316'
      return '#06b6d4'                                         // cyan: comparison partner
    }
    return '#3b82f6'                                           // blue: default
  }

  const getBarBorder = (idx) => {
    if (sorted_indices.includes(idx)) return '#16a34a'
    if (idx === highlight || idx === highlight2) return 'rgba(255,255,255,0.3)'
    return 'transparent'
  }

  const isGlowing = (idx) => idx === highlight || idx === highlight2

  return (
    <div className="flex flex-col items-center w-full h-full px-2">
      {/* Message */}
      {message && (
        <div className="text-sm text-slate-300 mb-3 text-center px-4 italic">
          {message}
        </div>
      )}

      {/* Bar chart */}
      <div className="flex items-end gap-1 w-full justify-center" style={{ height: '220px' }}>
        {elements.map((val, idx) => {
          const heightPct = Math.max((Math.abs(val) / maxVal) * 100, 5)
          const color = getBarColor(idx)
          const border = getBarBorder(idx)
          const glow = isGlowing(idx)

          return (
            <div
              key={idx}
              className="flex flex-col items-center"
              style={{ flex: '1', maxWidth: '60px', minWidth: '20px' }}
            >
              {/* Value label above bar */}
              <span className="text-xs font-mono mb-1" style={{ color, minHeight: '16px' }}>
                {(idx === highlight || idx === highlight2) ? val : ''}
              </span>

              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  backgroundColor: color,
                  border: `2px solid ${border}`,
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.25s ease',
                  boxShadow: glow ? `0 0 10px ${color}80` : 'none',
                  position: 'relative',
                }}
              />

              {/* Index label below bar */}
              <span className="text-xs text-slate-500 mt-1 font-mono">{idx}</span>
              {/* Value label for all */}
              <span className="text-xs text-slate-400 font-mono">{val}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs flex-wrap justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded inline-block bg-blue-500" /> Default
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded inline-block bg-yellow-400" /> Comparing
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded inline-block bg-cyan-400" /> Partner
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded inline-block bg-orange-500" /> Swapping
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded inline-block bg-purple-500" /> Pivot
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded inline-block bg-green-500" /> Sorted
        </span>
      </div>

      {/* Operation badge */}
      {operation && operation !== 'start' && (
        <div className={`mt-2 text-xs font-mono px-3 py-1 rounded-full uppercase tracking-wide ${
          operation === 'done' ? 'bg-green-900/50 text-green-300' :
          operation === 'swap' ? 'bg-orange-900/50 text-orange-300' :
          operation === 'pivot' || operation === 'placed' ? 'bg-purple-900/50 text-purple-300' :
          'bg-yellow-900/50 text-yellow-300'
        }`}>
          {operation.replace('_', ' ')}
        </div>
      )}
    </div>
  )
}

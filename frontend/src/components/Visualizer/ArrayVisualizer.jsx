export default function ArrayVisualizer({ state }) {
  if (!state || !state.elements) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-700 rounded-xl">
        <p className="text-slate-500">Run an operation to see the array visualization</p>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-64 p-8">
      <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
        {state.elements.map((val, idx) => {
          const isHighlighted = state.highlight === idx
          const isTarget = state.operation === 'target' && isHighlighted
          const isFound = state.operation === 'found' && isHighlighted
          const isNew = state.new_value !== undefined && val === state.new_value && isHighlighted

          // Determine box color
          let bgColor = 'bg-slate-800'
          let borderColor = 'border-slate-600'
          let textColor = 'text-slate-200'

          if (isHighlighted) {
            if (isFound || isNew) {
              bgColor = 'bg-emerald-900/50'
              borderColor = 'border-emerald-500'
              textColor = 'text-emerald-400'
            } else if (state.operation === 'delete') {
              bgColor = 'bg-red-900/50'
              borderColor = 'border-red-500'
              textColor = 'text-red-400'
            } else if (state.operation === 'compare') {
              bgColor = 'bg-yellow-900/50'
              borderColor = 'border-yellow-500'
              textColor = 'text-yellow-400'
            } else {
              bgColor = 'bg-blue-900/50'
              borderColor = 'border-blue-500'
              textColor = 'text-blue-400'
            }
          }

          return (
            <div key={`${idx}-${val !== null ? val : 'null'}`} className="flex flex-col items-center">
              <div
                className={`array-box w-14 h-14 flex items-center justify-center text-lg font-bold rounded border-2 shadow-sm ${bgColor} ${borderColor} ${textColor} ${isHighlighted ? 'highlighted pulse-glow' : ''}`}
              >
                {val !== null ? val : ''}
              </div>
              <span className="text-xs text-slate-500 mt-2 font-mono">{idx}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-8 text-center min-h-8">
        <p className="text-lg text-slate-300 font-medium animate-fadeIn key={state.message}">
          {state.message || 'Ready'}
        </p>
        {state.comparison_value !== undefined && state.operation === 'compare' && (
          <p className="text-sm text-yellow-400/80 mt-1">
            Comparing with target: {state.comparison_value}
          </p>
        )}
      </div>
    </div>
  )
}

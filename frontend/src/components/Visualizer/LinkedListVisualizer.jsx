export default function LinkedListVisualizer({ state }) {
  if (!state || !state.nodes) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-700 rounded-xl">
        <p className="text-slate-500">Run an operation to see the linked list visualization</p>
      </div>
    )
  }

  const nodes = state.nodes

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-64 p-8 overflow-x-auto">
      <div className="flex items-center min-w-max">
        {/* Head pointer */}
        <div className="flex flex-col items-center mr-4">
          <span className="text-xs font-bold text-blue-400 mb-1">HEAD</span>
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {nodes.map((val, idx) => {
          const isHighlighted = state.highlight === val || (state.highlight === idx)
          const isCurrent = state.active_pointer === 'current' && isHighlighted
          const isFound = state.operation === 'found' && isHighlighted
          const isNew = state.operation === 'insert' && state.highlight === val

          let bgColor = 'bg-slate-800'
          let borderColor = 'border-slate-600'
          let textColor = 'text-slate-200'

          if (isHighlighted) {
            if (isFound || isNew) {
              bgColor = 'bg-emerald-900/50'
              borderColor = 'border-emerald-500'
              textColor = 'text-emerald-400'
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
            <div key={`${idx}-${val}`} className="flex items-center ll-node animate-fadeIn">
              {/* Node Box */}
              <div className="flex flex-col items-center relative">
                {isCurrent && (
                  <span className="absolute -top-6 text-xs font-bold text-yellow-400">curr</span>
                )}
                <div className={`flex border-2 rounded-lg shadow-sm ${borderColor} ${isHighlighted ? 'pulse-glow transform scale-110 z-10' : ''} transition-all`}>
                  <div className={`w-12 h-12 flex items-center justify-center font-bold border-r-2 ${borderColor} ${bgColor} ${textColor}`}>
                    {val}
                  </div>
                  <div className={`w-6 h-12 flex items-center justify-center ${bgColor}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="w-12 flex items-center justify-center text-slate-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          )
        })}

        {/* Null / Tail indicator */}
        <div className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-slate-600 rounded-lg text-slate-500 font-mono text-sm bg-slate-800/50">
          NULL
        </div>
      </div>

      <div className="mt-12 text-center min-h-8">
        <p className="text-lg text-slate-300 font-medium animate-fadeIn key={state.message}">
          {state.message || 'Ready'}
        </p>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'

/**
 * BSTVisualizer — renders a Binary Search Tree as an SVG canvas.
 * Props:
 *   state: BSTState { nodes: [{id, value, x, y}], edges: [{from, to}], highlight, operation, message }
 */
export default function BSTVisualizer({ state }) {
  if (!state) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">Enter BST values and run an operation</p>
        </div>
      </div>
    )
  }

  const { nodes = [], edges = [], highlight, operation, message } = state

  // Compute bounding box for SVG viewBox
  const padding = 50
  const nodeRadius = 26
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  nodes.forEach(n => {
    minX = Math.min(minX, n.x)
    maxX = Math.max(maxX, n.x)
    minY = Math.min(minY, n.y)
    maxY = Math.max(maxY, n.y)
  })

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p className="text-sm">Empty BST</p>
      </div>
    )
  }

  const svgWidth = Math.max(maxX - minX + padding * 4, 400)
  const svgHeight = Math.max(maxY - minY + padding * 4, 250)
  const offsetX = -minX + padding * 2
  const offsetY = -minY + padding * 2

  // Node color based on state
  const getNodeColor = (nodeId) => {
    if (nodeId === highlight) {
      if (operation === 'found' || operation === 'visit' || operation === 'insert') return '#22c55e'
      if (operation === 'not_found') return '#ef4444'
      return '#eab308'  // compare / traverse
    }
    return '#3b82f6'
  }

  const getNodeBorder = (nodeId) => {
    if (nodeId === highlight) {
      if (operation === 'found' || operation === 'visit' || operation === 'insert') return '#16a34a'
      if (operation === 'not_found') return '#dc2626'
      return '#ca8a04'
    }
    return '#1d4ed8'
  }

  // Build node map for edge rendering
  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = n })

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Message */}
      {message && (
        <div className="text-sm text-slate-300 mb-2 text-center px-4 italic">
          {message}
        </div>
      )}
      
      <div className="w-full overflow-auto flex justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          style={{ maxHeight: '400px', minHeight: '200px' }}
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodeMap[edge.from]
            const to = nodeMap[edge.to]
            if (!from || !to) return null
            const x1 = from.x + offsetX
            const y1 = from.y + offsetY
            const x2 = to.x + offsetX
            const y2 = to.y + offsetY

            // Shorten line to not overlap circles
            const dx = x2 - x1
            const dy = y2 - y1
            const dist = Math.sqrt(dx * dx + dy * dy)
            const ux = dx / dist
            const uy = dy / dist
            const sx = x1 + ux * nodeRadius
            const sy = y1 + uy * nodeRadius
            const ex = x2 - ux * nodeRadius
            const ey = y2 - uy * nodeRadius

            return (
              <line
                key={i}
                x1={sx} y1={sy} x2={ex} y2={ey}
                stroke="#475569"
                strokeWidth="2"
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const cx = node.x + offsetX
            const cy = node.y + offsetY
            const fill = getNodeColor(node.id)
            const stroke = getNodeBorder(node.id)
            const isHighlighted = node.id === highlight

            return (
              <g key={node.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={nodeRadius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHighlighted ? 3 : 2}
                  style={{
                    filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(234,179,8,0.6))' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="white"
                  style={{ userSelect: 'none' }}
                >
                  {node.value}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Operation badge */}
      {operation && operation !== 'start' && (
        <div className={`mt-2 text-xs font-mono px-3 py-1 rounded-full uppercase tracking-wide ${
          operation === 'found' || operation === 'insert' || operation === 'done' ? 'bg-green-900/50 text-green-300' :
          operation === 'not_found' ? 'bg-red-900/50 text-red-300' :
          'bg-yellow-900/50 text-yellow-300'
        }`}>
          {operation.replace('_', ' ')}
        </div>
      )}
    </div>
  )
}

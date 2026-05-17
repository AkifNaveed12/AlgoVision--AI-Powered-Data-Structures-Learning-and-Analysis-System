import { useEffect, useRef } from 'react'

/**
 * BSTVisualizer — renders a Binary Search Tree OR AVL Tree as an SVG canvas.
 *
 * Props:
 *   state: {
 *     type: 'bst' | 'avl',
 *     nodes: [{id, value, x, y, balance_factor?}],
 *     edges: [{from, to}],
 *     highlight,   // node id
 *     operation,   // 'compare' | 'found' | 'insert' | 'delete' | 'visit' |
 *                  // 'not_found' | 'unbalanced' | 'rotate' | 'done' | 'start'
 *     message,
 *     rotation,    // null | 'LL' | 'RR' | 'LR' | 'RL'
 *   }
 */
export default function BSTVisualizer({ state }) {
  if (!state) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">Enter values and run an operation</p>
        </div>
      </div>
    )
  }

  const { nodes = [], edges = [], highlight, operation, message, rotation, type: stateType } = state
  const isAVL = stateType === 'avl'

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p className="text-sm">Empty tree</p>
      </div>
    )
  }

  // ── Bounding box ────────────────────────────────────────────────────────────
  const padding    = 50
  const nodeRadius = 26
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  nodes.forEach(n => {
    minX = Math.min(minX, n.x)
    maxX = Math.max(maxX, n.x)
    minY = Math.min(minY, n.y)
    maxY = Math.max(maxY, n.y)
  })
  const svgWidth  = Math.max(maxX - minX + padding * 4, 400)
  const svgHeight = Math.max(maxY - minY + padding * 4, 260)
  const offsetX   = -minX + padding * 2
  const offsetY   = -minY + padding * 2

  // ── Node colour ─────────────────────────────────────────────────────────────
  const getNodeFill = (node) => {
    if (node.id === highlight) {
      if (operation === 'found' || operation === 'visit' || operation === 'insert') return '#22c55e'
      if (operation === 'not_found')                                                 return '#ef4444'
      if (operation === 'unbalanced')                                                return '#f97316'
      if (operation === 'rotate')                                                    return '#a855f7'
      if (operation === 'delete')                                                    return '#ef4444'
      return '#eab308'  // compare
    }
    return '#3b82f6'
  }

  const getNodeStroke = (node) => {
    if (node.id === highlight) {
      if (operation === 'found' || operation === 'visit' || operation === 'insert') return '#16a34a'
      if (operation === 'not_found')                                                 return '#dc2626'
      if (operation === 'unbalanced')                                                return '#ea580c'
      if (operation === 'rotate')                                                    return '#9333ea'
      if (operation === 'delete')                                                    return '#dc2626'
      return '#ca8a04'
    }
    return '#1d4ed8'
  }

  const getGlowColor = (node) => {
    if (node.id !== highlight) return 'none'
    if (operation === 'unbalanced') return 'drop-shadow(0 0 10px rgba(249,115,22,0.8))'
    if (operation === 'rotate')     return 'drop-shadow(0 0 10px rgba(168,85,247,0.8))'
    if (operation === 'found' || operation === 'insert') return 'drop-shadow(0 0 8px rgba(34,197,94,0.7))'
    if (operation === 'delete' || operation === 'not_found') return 'drop-shadow(0 0 8px rgba(239,68,68,0.7))'
    return 'drop-shadow(0 0 8px rgba(234,179,8,0.6))'
  }

  // AVL balance factor ring colour
  const bfColor = (bf) => {
    if (bf === undefined || bf === null) return null
    if (bf > 1 || bf < -1) return '#f97316'   // orange — unbalanced
    if (Math.abs(bf) === 1)  return '#eab308'  // yellow — slightly skewed
    return '#22c55e'                            // green — balanced
  }

  // ── Build node map for edges ─────────────────────────────────────────────
  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = n })

  // ── Rotation badge colours ────────────────────────────────────────────────
  const rotationMeta = {
    LL: { bg: 'bg-orange-900/70', text: 'text-orange-200', label: 'LL – Right Rotation' },
    RR: { bg: 'bg-orange-900/70', text: 'text-orange-200', label: 'RR – Left Rotation' },
    LR: { bg: 'bg-purple-900/70', text: 'text-purple-200', label: 'LR – Left-Right Rotation' },
    RL: { bg: 'bg-purple-900/70', text: 'text-purple-200', label: 'RL – Right-Left Rotation' },
  }

  return (
    <div className="flex flex-col items-center w-full h-full gap-1">

      {/* Message */}
      {message && (
        <div className="text-sm text-slate-300 text-center px-4 italic leading-snug">
          {message}
        </div>
      )}

      {/* Rotation badge (AVL only) */}
      {isAVL && rotation && rotationMeta[rotation] && (
        <div className={`text-xs font-bold px-3 py-1 rounded-full ${rotationMeta[rotation].bg} ${rotationMeta[rotation].text} tracking-wide uppercase`}>
          ⟳ {rotationMeta[rotation].label}
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
            const to   = nodeMap[edge.to]
            if (!from || !to) return null
            const x1 = from.x + offsetX
            const y1 = from.y + offsetY
            const x2 = to.x   + offsetX
            const y2 = to.y   + offsetY
            const dx = x2 - x1, dy = y2 - y1
            const dist = Math.sqrt(dx * dx + dy * dy)
            const ux = dx / dist, uy = dy / dist
            return (
              <line
                key={i}
                x1={x1 + ux * nodeRadius} y1={y1 + uy * nodeRadius}
                x2={x2 - ux * nodeRadius} y2={y2 - uy * nodeRadius}
                stroke="#475569"
                strokeWidth="2"
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const cx          = node.x + offsetX
            const cy          = node.y + offsetY
            const fill        = getNodeFill(node)
            const stroke      = getNodeStroke(node)
            const glow        = getGlowColor(node)
            const isHighlight = node.id === highlight
            const bf          = node.balance_factor

            return (
              <g key={node.id}>
                {/* Balance-factor ring (AVL only) */}
                {isAVL && bf !== undefined && (
                  <circle
                    cx={cx} cy={cy}
                    r={nodeRadius + 5}
                    fill="none"
                    stroke={bfColor(bf)}
                    strokeWidth="2"
                    strokeDasharray={Math.abs(bf) > 1 ? "4 2" : "none"}
                    opacity="0.7"
                  />
                )}

                <circle
                  cx={cx} cy={cy}
                  r={nodeRadius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHighlight ? 3 : 2}
                  style={{
                    filter:     glow,
                    transition: 'all 0.35s ease',
                  }}
                />

                {/* Node value */}
                <text
                  x={cx} y={isAVL && bf !== undefined ? cy - 3 : cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill="white"
                  style={{ userSelect: 'none' }}
                >
                  {node.value}
                </text>

                {/* Balance factor label (AVL only) */}
                {isAVL && bf !== undefined && (
                  <text
                    x={cx} y={cy + 11}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill={Math.abs(bf) > 1 ? '#fb923c' : '#86efac'}
                    style={{ userSelect: 'none' }}
                  >
                    bf={bf}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Operation badge */}
      {operation && operation !== 'start' && (
        <div className={`text-xs font-mono px-3 py-1 rounded-full uppercase tracking-wide ${
          operation === 'found'  || operation === 'insert' || operation === 'done'
            ? 'bg-green-900/50 text-green-300'
          : operation === 'not_found' || operation === 'delete'
            ? 'bg-red-900/50 text-red-300'
          : operation === 'unbalanced'
            ? 'bg-orange-900/50 text-orange-300'
          : operation === 'rotate'
            ? 'bg-purple-900/50 text-purple-300'
          : 'bg-yellow-900/50 text-yellow-300'
        }`}>
          {operation.replace('_', ' ')}
        </div>
      )}
    </div>
  )
}

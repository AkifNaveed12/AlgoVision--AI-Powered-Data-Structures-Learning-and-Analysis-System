/**
 * GraphVisualizer — renders a graph (nodes + edges) as an SVG canvas.
 * Used for BFS and DFS visualization.
 *
 * Props:
 *   state: GraphState {
 *     nodes: [{id, label, x, y}],
 *     edges: [{from, to}],
 *     visited: [nodeId...],
 *     frontier: [nodeId...],
 *     current: nodeId | null,
 *     operation, message
 *   }
 */
export default function GraphVisualizer({ state }) {
  if (!state) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm">Enter graph nodes/edges and run BFS or DFS</p>
        </div>
      </div>
    )
  }

  const { nodes = [], edges = [], visited = [], frontier = [], current, operation, message } = state

  const nodeRadius = 28
  const svgSize = 700

  // Center offset so positions (from backend ±300 range) map to SVG center
  const cx_offset = svgSize / 2
  const cy_offset = svgSize / 2

  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = n })

  const getNodeStyle = (node) => {
    if (node.id === current) {
      return { fill: '#eab308', stroke: '#ca8a04', glow: 'drop-shadow(0 0 10px rgba(234,179,8,0.8))' }
    }
    if (visited.includes(node.id)) {
      return { fill: '#22c55e', stroke: '#16a34a', glow: 'drop-shadow(0 0 6px rgba(34,197,94,0.5))' }
    }
    if (frontier.includes(node.id)) {
      return { fill: '#a855f7', stroke: '#7c3aed', glow: 'drop-shadow(0 0 6px rgba(168,85,247,0.5))' }
    }
    return { fill: '#3b82f6', stroke: '#1d4ed8', glow: 'none' }
  }

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Message */}
      {message && (
        <div className="text-sm text-slate-300 mb-2 text-center px-4 italic">
          {message}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mb-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full inline-block bg-blue-500" />
          Unvisited
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full inline-block bg-yellow-400" />
          Current
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full inline-block bg-purple-500" />
          Frontier
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full inline-block bg-green-500" />
          Visited
        </span>
      </div>

      <div className="w-full overflow-auto flex justify-center">
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          width="100%"
          style={{ maxHeight: '400px', minHeight: '200px' }}
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const fromNode = nodeMap[edge.from]
            const toNode = nodeMap[edge.to]
            if (!fromNode || !toNode) return null

            const x1 = fromNode.x + cx_offset
            const y1 = fromNode.y + cy_offset
            const x2 = toNode.x + cx_offset
            const y2 = toNode.y + cy_offset

            // Edge is highlighted if both endpoints are visited
            const isActive = visited.includes(edge.from) && visited.includes(edge.to)

            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isActive ? '#22c55e' : '#334155'}
                strokeWidth={isActive ? 2.5 : 1.5}
                opacity={0.8}
                style={{ transition: 'stroke 0.3s ease' }}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const style = getNodeStyle(node)
            const nx = node.x + cx_offset
            const ny = node.y + cy_offset

            return (
              <g key={node.id}>
                <circle
                  cx={nx} cy={ny} r={nodeRadius}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={node.id === current ? 3 : 2}
                  style={{
                    filter: style.glow,
                    transition: 'all 0.3s ease'
                  }}
                />
                <text
                  x={nx} y={ny + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="white"
                  style={{ userSelect: 'none' }}
                >
                  {node.label || node.id}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Traversal order so far */}
      {visited.length > 0 && (
        <div className="mt-2 text-xs text-slate-400">
          Visited order: <span className="text-green-400 font-mono">{visited.join(' → ')}</span>
        </div>
      )}
    </div>
  )
}

// MiniGraphPreview.jsx — Static decorative graph preview for homepage
function MiniGraphPreview() {
  const nodes = [
    { id: 'index', label: 'index.js', type: 'entry', color: '#a78bfa',
      x: 140, y: 20, importance: '9/10' },
    { id: 'app', label: 'app.js', type: 'entry', color: '#a78bfa',
      x: 280, y: 20, importance: '8/10' },
    { id: 'auth', label: 'auth.js', type: 'middleware', color: '#ffa657',
      x: 60, y: 120, importance: '7/10' },
    { id: 'router', label: 'router.js', type: 'route', color: '#7ee787',
      x: 200, y: 120, importance: '6/10' },
    { id: 'db', label: 'db.js', type: 'config', color: '#79c0ff',
      x: 340, y: 120, importance: '7/10' },
    { id: 'user', label: 'user.js', type: 'model', color: '#f78166',
      x: 100, y: 220, importance: '5/10' },
    { id: 'utils', label: 'utils.js', type: 'utility', color: '#8b949e',
      x: 260, y: 220, importance: '4/10' },
  ]

  const edges = [
    { from: { x: 160, y: 40 }, to: { x: 100, y: 120 } },
    { from: { x: 160, y: 40 }, to: { x: 230, y: 120 } },
    { from: { x: 300, y: 40 }, to: { x: 360, y: 120 } },
    { from: { x: 230, y: 140 }, to: { x: 130, y: 220 } },
    { from: { x: 230, y: 140 }, to: { x: 280, y: 220 } },
    { from: { x: 100, y: 140 }, to: { x: 130, y: 220 } },
  ]

  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, #0f1318 0%, #161b22 100%)',
      border: '1px solid #21262d',
      borderRadius: 16,
      padding: 28,
      overflow: 'hidden',
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid #21262d',
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#f78166','#d29922','#7ee787'].map((c, i) => (
            <div key={i} style={{
              width: 10, height: 10,
              borderRadius: '50%',
              background: c,
              opacity: 0.6,
            }} />
          ))}
        </div>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: '#3d444d',
          marginLeft: 4,
        }}>
          expressjs / express
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: '#3d444d',
        }}>
          141 files · 130 deps
        </span>
      </div>

      {/* SVG graph */}
      <svg
        width="100%"
        height="260"
        viewBox="0 0 420 260"
        style={{ overflow: 'visible' }}
      >
        {/* Edges */}
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={edge.from.x} y1={edge.from.y}
            x2={edge.to.x} y2={edge.to.y}
            stroke="rgba(167,139,250,0.2)"
            strokeWidth="1.5"
          />
        ))}

        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            {/* Node card background */}
            <rect
              x={node.x - 52}
              y={node.y - 18}
              width={104}
              height={38}
              rx={6}
              fill="#161b22"
              stroke={node.color}
              strokeWidth="1.5"
            />
            {/* Left accent bar */}
            <rect
              x={node.x - 52}
              y={node.y - 18}
              width={3}
              height={38}
              rx={2}
              fill={node.color}
            />
            {/* Label */}
            <text
              x={node.x - 38}
              y={node.y - 3}
              fill="#e6edf3"
              fontSize="11"
              fontFamily="DM Mono, monospace"
              fontWeight="600"
            >
              {node.label}
            </text>
            {/* Type + importance */}
            <text
              x={node.x - 38}
              y={node.y + 11}
              fill="#8b949e"
              fontSize="9"
              fontFamily="DM Mono, monospace"
            >
              {node.type}
            </text>
            <text
              x={node.x + 28}
              y={node.y + 11}
              fill={node.color}
              fontSize="9"
              fontFamily="DM Mono, monospace"
              textAnchor="end"
            >
              {node.importance}
            </text>
          </g>
        ))}
      </svg>

      {/* Bottom stats row */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 16,
        paddingTop: 16,
        borderTop: '1px solid #21262d',
      }}>
        {[
          { label: 'entry', color: '#a78bfa' },
          { label: 'route', color: '#7ee787' },
          { label: 'middleware', color: '#ffa657' },
          { label: 'model', color: '#f78166' },
          { label: 'utility', color: '#8b949e' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <div style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: item.color,
            }} />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: '#8b949e',
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Animated scan line overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent)',
        animation: 'scanLine 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

export default MiniGraphPreview

// QueryResultsPanel.jsx — Displays matched files from a natural language query

const NODE_COLORS = {
  entry: '#a78bfa', route: '#7ee787', controller: '#d2a8ff',
  middleware: '#ffa657', model: '#f78166',
  utility: '#8b949e', config: '#79c0ff',
}

function QueryResultsPanel({ queryResults, onNodeSelect, onClose }) {
  if (!queryResults || !queryResults.matches) return null

  const { query, matches } = queryResults

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}>
        <div>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: 'var(--text-faint)',
          }}>
            Query results for{' '}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: 'var(--accent)',
          }}>
            "{query}"
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 6px',
          }}
        >
          ×
        </button>
      </div>

      {/* Results list */}
      {matches.length === 0 ? (
        <div style={{
          padding: '20px 16px',
          textAlign: 'center',
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: 'var(--text-faint)',
        }}>
          No matching files found. Try different keywords.
        </div>
      ) : (
        <div>
          {matches.map((match, i) => {
            const typeColor = NODE_COLORS[match.type] || '#8b949e'
            return (
              <button
                key={match.nodeId}
                onClick={() => onNodeSelect(match.nodeId)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  width: '100%',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: i < matches.length - 1
                    ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e =>
                  e.currentTarget.style.background = 'var(--bg-surface)'
                }
                onMouseLeave={e =>
                  e.currentTarget.style.background = 'none'
                }
              >
                {/* Rank badge */}
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: i === 0
                    ? 'var(--accent)' : 'var(--bg-base)',
                  border: i === 0
                    ? 'none' : '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: i === 0 ? '#0d1117' : 'var(--text-faint)',
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  {i + 1}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 3,
                  }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}>
                      {match.label}
                    </span>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9,
                      color: typeColor,
                      background: typeColor + '18',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}>
                      {match.type}
                    </span>
                    {/* Relevance bar */}
                    <div style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0,
                    }}>
                      <div style={{
                        width: 40,
                        height: 3,
                        background: 'var(--bg-base)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: (match.relevanceScore || 50) + '%',
                          height: '100%',
                          background: 'var(--accent)',
                          borderRadius: 2,
                        }} />
                      </div>
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        color: 'var(--text-faint)',
                      }}>
                        {match.relevanceScore}%
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: 'var(--text-faint)',
                    marginBottom: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {match.nodeId}
                  </div>
                  <div style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                  }}>
                    {match.reason}
                  </div>
                </div>

                {/* Arrow */}
                <svg width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="var(--text-faint)"
                  strokeWidth="2" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default QueryResultsPanel

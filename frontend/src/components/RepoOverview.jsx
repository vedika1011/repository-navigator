// RepoOverview.jsx — AI-generated whole-repository summary panel shown at the top of the results page after analysis

import { useState } from 'react'

function RepoOverview({ graphData, onGenerateOverview, isGenerating }) {
  const [expanded, setExpanded] = useState(true)

  if (!graphData) return null

  const { meta, repoOverview } = graphData
  const owner = meta?.owner || ''
  const repo = meta?.repo?.replace(/\.git$/, '') || ''
  const totalFiles = meta?.totalFiles || 0
  const totalEdges = meta?.totalEdges || 0
  const analyzedAt = meta?.analyzedAt
    ? new Date(meta.analyzedAt).toLocaleString()
    : ''

  const hasOverview = Boolean(repoOverview)

  return (
    <div style={{
      background: 'linear-gradient(135deg, #161b23 0%, #0f1318 100%)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: expanded ? '1px solid var(--border)' : 'none',
        cursor: 'pointer',
      }}
        onClick={() => setExpanded(prev => !prev)}
      >
        {/* Left: repo info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          {/* GitHub icon */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill="var(--accent)">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>

          {/* Repo name */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
            }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: 'var(--text-muted)',
              }}>
                {owner}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: 'var(--text-faint)',
              }}>
                /
              </span>
              <span style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--text-primary)',
              }}>
                {repo}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: 'var(--text-faint)',
              marginTop: 2,
            }}>
              {totalFiles} files · {totalEdges} dependencies · {analyzedAt}
            </div>
          </div>
        </div>

        {/* Right: AI badge + chevron */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {hasOverview && (
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: 'var(--success)',
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              borderRadius: 4,
              padding: '2px 7px',
            }}>
              ✦ AI Overview
            </span>
          )}
          <span style={{
            color: 'var(--text-faint)',
            fontSize: 12,
            transition: 'transform 200ms ease',
            display: 'inline-block',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}>
            ▼
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '16px 20px' }}>
          {/* AI Overview text */}
          {hasOverview ? (
            <div>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: 13, // Outfit 13px description
                color: 'var(--text-muted)',
                lineHeight: 1.75,
                margin: 0,
                borderLeft: '3px solid rgba(124, 106, 240, 0.4)',
                paddingLeft: 14,
              }}>
                {repoOverview}
              </p>
            </div>
          ) : isGenerating ? (
            /* Loading state */
            <div style={{ padding: '8px 0' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: 'var(--text-faint)',
              }}>
                <span style={{
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'inline-block',
                  animation: 'pulse 1s ease-in-out infinite',
                }} />
                Generating repository overview...
              </div>
              {[100, 80, 65].map((w, i) => (
                <div key={i} style={{
                  height: 10,
                  width: w + '%',
                  background: 'var(--bg-elevated)',
                  borderRadius: 4,
                  marginBottom: 8,
                }} />
              ))}
            </div>
          ) : (
            /* No overview yet */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              borderRadius: 8,
            }}>
              <div>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  margin: '0 0 3px 0',
                }}>
                  No overview generated yet
                </p>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: 'var(--text-faint)',
                  margin: 0,
                }}>
                  Get a plain-English summary of what this entire repository does
                </p>
              </div>
              {onGenerateOverview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onGenerateOverview()
                  }}
                  style={{
                    background: 'var(--accent-subtle)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 8,
                    color: 'var(--accent)',
                    fontFamily: "var(--font-heading)",
                    fontSize: 11, // Syne Medium 11px
                    padding: '7px 14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    marginLeft: 16,
                    flexShrink: 0,
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={e =>
                    e.currentTarget.style.background = 'rgba(124, 106, 240, 0.15)'
                  }
                  onMouseLeave={e =>
                    e.currentTarget.style.background = 'var(--accent-subtle)'
                  }
                >
                  ✦ Get Overview
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RepoOverview

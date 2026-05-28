// DomainSidebar.jsx — Left sidebar showing AI-detected
// architecture domains for the analyzed repository

import { useState } from 'react'

function DomainSidebar({
  domains,
  activeDomains,
  onDomainSelect,
  onClear,
  graphData,
}) {
  const [collapsed, setCollapsed] = useState(false)

  if (!domains || domains.length === 0) return null

  const activeDomainCount = activeDomains?.size || 0
  const hasActiveSelection = activeDomainCount > 0

  return (
    <div style={{
      width: collapsed ? 44 : 240,
      minWidth: collapsed ? 44 : 240,
      height: '100%',
      background: 'var(--bg-elevated)',
      borderRight: '1px solid var(--border)',
      borderRadius: '12px 0 0 12px',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 250ms ease, min-width 250ms ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: collapsed ? '12px 10px' : '12px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 12,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
            }}>
              ARCHITECTURE
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: 'var(--text-faint)',
              marginTop: 1,
            }}>
              {domains.length} domains detected
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(prev => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 4,
            fontSize: 14,
            lineHeight: 1,
            flexShrink: 0,
            transition: 'color 200ms ease',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.color = 'var(--text-muted)'
          }
          onMouseLeave={e =>
            e.currentTarget.style.color = 'var(--text-faint)'
          }
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Domain list */}
      {!collapsed && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
          scrollbarWidth: 'thin',
        }}>
          {/* Clear selection */}
          {hasActiveSelection && (
            <button
              onClick={onClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                padding: '6px 14px',
                background: 'rgba(124,106,240,0.08)',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: 'var(--accent)',
                textAlign: 'left',
                marginBottom: 4,
              }}
            >
              ✕ Clear selection
            </button>
          )}

          {domains.map(domain => {
            const isActive = activeDomains?.has(domain.id)

            // Count edges where both source and target are in this domain
            const domainNodeSet = new Set(domain.nodeIds)
            const externalEdges = graphData?.graph?.edges?.filter(
              e => domainNodeSet.has(e.source) && !domainNodeSet.has(e.target)
            ).length || 0

            return (
              <button
                key={domain.id}
                onClick={() => onDomainSelect(domain)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 14px',
                  background: isActive
                    ? 'rgba(124,106,240,0.1)'
                    : 'none',
                  border: 'none',
                  borderLeft: isActive
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  if (!isActive)
                    e.currentTarget.style.background =
                      'rgba(255,255,255,0.03)'
                }}
                onMouseLeave={e => {
                  if (!isActive)
                    e.currentTarget.style.background = 'none'
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: 16, flexShrink: 0 }}>
                  {domain.icon}
                </span>

                {/* Name + count */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 12,
                    color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {domain.name}
                  </div>

                  {/* Stats row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 3,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--text-muted)',
                    }}>
                      {domain.fileCount} files
                    </span>
                    {externalEdges > 0 && (
                      <>
                        <span style={{
                          color: 'var(--border)',
                          fontSize: 8,
                        }}>·</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: 'var(--text-muted)',
                        }}>
                          {externalEdges} deps
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    flexShrink: 0,
                  }} />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Collapsed: just icons */}
      {collapsed && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
          scrollbarWidth: 'none',
        }}>
          {domains.map(domain => {
            const isActive = activeDomains?.has(domain.id)
            return (
              <button
                key={domain.id}
                onClick={() => onDomainSelect(domain)}
                title={`${domain.name} (${domain.fileCount} files)`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '10px 0',
                  background: isActive
                    ? 'rgba(124,106,240,0.1)'
                    : 'none',
                  border: 'none',
                  borderLeft: isActive
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: 18,
                  transition: 'all 150ms ease',
                }}
              >
                {domain.icon}
              </button>
            )
          })}
        </div>
      )}

      {/* Multi-select hint */}
      {!collapsed && (
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border)',
          fontFamily: 'var(--font-body)',
          fontSize: 9,
          color: 'var(--text-faint)',
          flexShrink: 0,
        }}>
          Click to select · click again to deselect
          {activeDomainCount > 1 && (
            <span style={{ color: 'var(--accent)', marginLeft: 4 }}>
              {activeDomainCount} selected
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default DomainSidebar

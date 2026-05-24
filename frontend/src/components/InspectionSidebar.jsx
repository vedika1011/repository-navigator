// InspectionSidebar.jsx — Full-featured node inspection panel with sections for summary, stats, dependencies, and onboarding.

import { useMemo, useState, useEffect } from "react";
import { NODE_COLORS } from "../utils/graphUtils.js";
import SidebarSection from "./SidebarSection.jsx";

/**
 * Returns the importance bar color based on score:
 * 1–3 muted, 4–6 amber, 7–8 blue, 9–10 red
 */
function getImportanceColor(importance) {
  if (importance >= 9) return "#f78166";
  if (importance >= 7) return "#58a6ff";
  if (importance >= 4) return "#d29922";
  return "#8b949e";
}

function InspectionSidebar({ node, isOpen, onClose, onNavigate, graphData }) {
  if (!node || !node.data) return null;

  const data = node.data;
  // Safe defaults for every field that might be missing:
  const safeData = {
    label: data.label || 'Unknown file',
    type: data.type || 'utility',
    summary: data.summary || 'No summary available.',
    summaryType: data.summaryType || 'placeholder',
    linesOfCode: data.linesOfCode || 0,
    importance: typeof data.importance === 'number' ? data.importance : 5,
    isOrphaned: Boolean(data.isOrphaned),
    dependencyCount: data.dependencyCount || 0,
    absolutePath: data.absolutePath || '',
  };

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [localSummary, setLocalSummary] = useState(null);
  const [localSummaryType, setLocalSummaryType] = useState(null);

  // Reset local state when node changes
  useEffect(() => {
    setLocalSummary(null);
    setLocalSummaryType(null);
  }, [node?.id]);

  async function handleRetrySummary() {
    if (!node?.data) return;
    setIsSummarizing(true);
    try {
      const response = await fetch('http://localhost:3001/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.id,
          absolutePath: safeData.absolutePath || '',
          label: safeData.label,
          relativePath: node.id,
          extension: safeData.label.split('.').pop() || 'js',
          linesOfCode: safeData.linesOfCode || 0
        })
      });
      const dataResp = await response.json();
      if (dataResp.success && dataResp.summary) {
        setLocalSummary(dataResp.summary);
        setLocalSummaryType('ai');
      } else {
        setLocalSummary(dataResp.error?.message || 'Could not generate summary.');
        setLocalSummaryType('error');
      }
    } catch (err) {
      setLocalSummary('Could not reach the server.');
      setLocalSummaryType('error');
    } finally {
      setIsSummarizing(false);
    }
  }

  const typeColor = NODE_COLORS[safeData.type] || "#8b949e";

  // Compute dependencies: edges where source === this node (files this node imports)
  const dependencies = useMemo(() => {
    if (!graphData?.graph?.edges || !graphData?.graph?.nodes) return [];
    return graphData.graph.edges
      .filter((e) => e.source === node.id)
      .map((e) => graphData.graph.nodes.find((n) => n.id === e.target))
      .filter(Boolean);
  }, [node?.id, graphData]);

  // Compute importedBy: edges where target === this node (files that import this node)
  const importedBy = useMemo(() => {
    if (!graphData?.graph?.edges || !graphData?.graph?.nodes) return [];
    return graphData.graph.edges
      .filter((e) => e.target === node.id)
      .map((e) => graphData.graph.nodes.find((n) => n.id === e.source))
      .filter(Boolean);
  }, [node?.id, graphData]);

  // Check if this node is in the onboarding path
  const onboardingStep = useMemo(() => {
    return graphData?.onboardingPath?.find((p) => p.nodeId === node.id) || null;
  }, [node?.id, graphData]);

  // Determine what to show
  const displaySummary = localSummary || 
    (safeData.summaryType === 'ai' ? safeData.summary : null);
  const displaySummaryType = localSummaryType || safeData.summaryType;

  const hasRealSummary = displaySummaryType === 'ai' && displaySummary;

  // Section title
  const sectionTitle = hasRealSummary ? "AI Summary" : "Summary";

  return (
    <>
      {/* Mobile backdrop (<640px) */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(9, 12, 16, 0.7)",
            zIndex: 9,
            display: "none", // hidden on desktop, shown on mobile via CSS
          }}
        />
      )}

      {/* Sidebar panel */}
      <div
        className="inspection-sidebar"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: "100%",
          width: 320,
          zIndex: 10,
          backgroundColor: "var(--bg-elevated)",
          borderLeft: "1px solid var(--border)",
          borderRadius: "0 12px 12px 0",
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          opacity: isOpen ? 1 : 0,
          transition:
            "transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* ═══ Section 0: Header (always visible) ═══ */}
        <div
          style={{
            padding: "20px 16px 16px 16px",
            borderBottom: "1px solid var(--border)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
              color: "var(--text-faint)",
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-faint)")
            }
            aria-label="Close sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* File label */}
          <h3
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--text-primary)",
              margin: "0 0 4px 0",
              paddingRight: 28,
              wordBreak: "break-word",
            }}
          >
            {safeData.label}
          </h3>

          {/* File path */}
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: "var(--text-muted)",
              margin: "0 0 10px 0",
              wordBreak: "break-all",
            }}
          >
            {node.id}
          </p>

          {/* Badges row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {/* Type badge */}
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: typeColor,
                backgroundColor: "var(--bg-surface)",
                padding: "3px 10px",
                borderRadius: 6,
              }}
            >
              {safeData.type}
            </span>

            {/* Orphaned badge */}
            {safeData.isOrphaned && (
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: "#d29922",
                  backgroundColor: "rgba(210, 169, 34, 0.12)",
                  padding: "3px 10px",
                  borderRadius: 6,
                }}
              >
                ⚠ Orphaned Module
              </span>
            )}
          </div>

          {/* Importance bar */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                Impact Score
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: getImportanceColor(safeData.importance),
                  fontWeight: 600,
                }}
              >
                {safeData.importance}/10
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 4,
                backgroundColor: "var(--bg-base)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(safeData.importance / 10) * 100}%`,
                  height: "100%",
                  backgroundColor: getImportanceColor(safeData.importance),
                  borderRadius: 2,
                  transition: "width 400ms ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* ═══ Scrollable content area ═══ */}
        <div
          className="sidebar-scroll-area"
          style={{ flex: 1, overflowY: "auto" }}
        >
          {/* ═══ Section 1: AI Summary ═══ */}
          <SidebarSection 
            title={sectionTitle} 
            icon={hasRealSummary ? "✦" : "📄"} 
            defaultOpen={true}
          >
            {isSummarizing ? (
              <div style={{ padding: '8px 0' }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: 'var(--text-faint)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: 'var(--accent, #a78bfa)',
                    display: 'inline-block',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  Generating summary...
                </div>
                {[100, 80, 60].map((w, i) => (
                  <div key={i} style={{
                    height: 10,
                    width: w + '%',
                    background: 'var(--bg-elevated)',
                    borderRadius: 4,
                    marginBottom: 8,
                    opacity: 0.6,
                  }} />
                ))}
              </div>
            ) : localSummaryType === 'error' ? (
              <div style={{
                background: 'rgba(247,129,102,0.06)',
                border: '1px solid rgba(247,129,102,0.2)',
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 8,
              }}>
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  color: '#f78166',
                  margin: '0 0 8px 0',
                  lineHeight: 1.5,
                }}>
                  {localSummary}
                </p>
                <button
                  onClick={handleRetrySummary}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(247,129,102,0.3)',
                    borderRadius: 6,
                    color: '#f78166',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Try again
                </button>
              </div>
            ) : hasRealSummary ? (
              <>
                <div style={{
                  borderLeft: '2px solid rgba(126,231,135,0.5)',
                  paddingLeft: 10,
                  marginBottom: 10,
                }}>
                  <p style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13,
                    color: '#c9d1d9',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    {displaySummary}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: '#7ee787',
                    background: 'rgba(126,231,135,0.1)',
                    border: '1px solid rgba(126,231,135,0.2)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    ✦ AI Generated
                  </span>
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 8px',
                gap: 12,
                textAlign: 'center',
              }}>
                {/* Icon */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}>
                  ✦
                </div>
                {/* Message */}
                <div>
                  <p style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    margin: '0 0 4px 0',
                    lineHeight: 1.5,
                  }}>
                    No summary yet
                  </p>
                  <p style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: 'var(--text-faint)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}>
                    Generate an AI summary to understand
                    what this file does
                  </p>
                </div>
                {/* Generate button — prominent */}
                <button
                  onClick={handleRetrySummary}
                  disabled={isSummarizing}
                  style={{
                    background: 'var(--accent-subtle, rgba(167,139,250,0.08))',
                    border: '1px solid rgba(167,139,250,0.3)',
                    borderRadius: 8,
                    color: 'var(--accent, #a78bfa)',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(167,139,250,0.15)'
                    e.currentTarget.style.borderColor = 'var(--accent, #a78bfa)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--accent-subtle, rgba(167,139,250,0.08))'
                    e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'
                  }}
                >
                  ✦ Generate AI Summary
                </button>
              </div>
            )}
          </SidebarSection>

          {/* ═══ Section 2: File Stats ═══ */}
          <SidebarSection title="File Stats" icon="📊" defaultOpen={true}>
            <div style={{ display: "flex", gap: 8 }}>
              {/* Lines of Code */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 6px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "var(--text-primary)",
                  }}
                >
                  {safeData.linesOfCode}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  Lines
                </div>
              </div>

              {/* Imports (dependencyCount) */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 6px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "var(--text-primary)",
                  }}
                >
                  {safeData.dependencyCount}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  Imports
                </div>
              </div>

              {/* Imported By (computed) */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 6px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "var(--text-primary)",
                  }}
                >
                  {importedBy.length}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  Imported By
                </div>
              </div>
            </div>
          </SidebarSection>

          {/* ═══ Section 3: Dependencies ═══ */}
          <SidebarSection
            title="Dependencies"
            icon="→"
            badge={dependencies.length}
            defaultOpen={true}
          >
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "var(--text-faint)",
                margin: "0 0 8px 0",
              }}
            >
              Files this module imports
            </p>
            {dependencies.length === 0 ? (
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 13,
                  color: "var(--text-faint)",
                  fontStyle: "italic",
                }}
              >
                No outgoing dependencies
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {dependencies.map((dep) => (
                  <NodeListItem
                    key={dep.id}
                    node={dep}
                    onClick={() => onNavigate(dep.id)}
                  />
                ))}
              </div>
            )}
          </SidebarSection>

          {/* ═══ Section 4: Imported By ═══ */}
          <SidebarSection
            title="Imported By"
            icon="←"
            badge={importedBy.length}
            defaultOpen={true}
          >
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "var(--text-faint)",
                margin: "0 0 8px 0",
              }}
            >
              Files that import this module
            </p>
            {importedBy.length === 0 ? (
              <div>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13,
                    color: "var(--text-faint)",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Nothing imports this module
                </p>
                {safeData.isOrphaned && (
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      color: "#d29922",
                      marginTop: 6,
                    }}
                  >
                    This module appears to be unused.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {importedBy.map((imp) => (
                  <NodeListItem
                    key={imp.id}
                    node={imp}
                    onClick={() => onNavigate(imp.id)}
                  />
                ))}
              </div>
            )}
          </SidebarSection>

          {/* ═══ Section 5: Onboarding Path (conditional) ═══ */}
          {onboardingStep && (
            <div style={{ padding: "14px 16px" }}>
              <div
                style={{
                  backgroundColor: "rgba(126, 231, 135, 0.08)",
                  border: "1px solid rgba(126, 231, 135, 0.2)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#7ee787",
                    margin: "0 0 6px 0",
                  }}
                >
                  📍 Onboarding Step {onboardingStep.order}
                </p>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {onboardingStep.reason}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * NodeListItem — clickable row inside Dependencies / Imported By sections
 */
function NodeListItem({ node, onClick }) {
  const typeColor = NODE_COLORS[node.type] || "#8b949e";

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 10px",
        background: "none",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 150ms ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--bg-elevated)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
    >
      {/* Type dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: typeColor,
          flexShrink: 0,
        }}
      />
      {/* Label and type */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.label}
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          {node.type}
        </div>
      </div>
      {/* Arrow indicator */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-faint)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginLeft: "auto", flexShrink: 0 }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

export default InspectionSidebar;

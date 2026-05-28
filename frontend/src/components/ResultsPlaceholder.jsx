// ResultsPlaceholder.jsx — Displays analysis results with meta summary, warnings, onboarding path, and collapsible raw JSON.

import { useState } from "react";

const NODE_COLORS = {
  entry: '#58a6ff',
  route: '#7ee787',
  controller: '#d2a8ff',
  middleware: '#ffa657',
  model: '#f78166',
  utility: '#8b949e',
  config: '#79c0ff',
};

function getWarningDotColor(type) {
  if (type === 'orphaned_module' || type === 'orphaned_modules') return '#d29922';
  if (type === 'high_coupling') return '#f78166';
  return '#58a6ff';
}

function ResultsPlaceholder({ graphData, isLoading, onSelectStep }) {
  const [showJson, setShowJson] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(null); // null = auto-decide
  const [copied, setCopied] = useState(false);

  // Hidden when nothing has happened yet and not loading
  if (!graphData && !isLoading) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full animate-pulse-dot"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <span
            className="font-sans text-sm"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}
          >
            Analyzing repository structure…
          </span>
        </div>
        {/* Skeleton lines */}
        <div className="space-y-3">
          {[75, 50, 85, 60].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded"
              style={{
                width: `${w}%`,
                backgroundColor: "var(--bg-surface)",
                opacity: 0.8,
                animation: `fade-in 1s ease-in-out ${i * 150}ms infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Extract data sections from the response
  const { meta, warnings, onboardingPath } = graphData;

  const noEdges = graphData.graph.edges.length === 0;
  const noWarnings = !warnings || warnings.length === 0;
  const showWarningsSection = !(noWarnings && noEdges); // Hide warnings section if both are empty

  // Count orphans from graph data
  const orphanCount = graphData.graph?.nodes
    ? graphData.graph.nodes.filter(n => n.isOrphaned).length
    : 0;

  // Warnings collapse logic
  const isWarningsExpanded = warningsOpen !== null
    ? warningsOpen
    : (warnings && warnings.length <= 3);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(graphData, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4 animate-fade-in-up">

      {/* Section 1 — Meta Summary */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--gradient-card)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Repo name styled: owner / repo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, alignSelf: 'center' }}
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--text-muted)",
          }}>
            {meta.owner}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--text-faint)",
          }}>
            /
          </span>
          <span style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 20,
            color: "var(--text-primary)",
          }}>
            {meta.repo?.replace(/\.git$/, '')}
          </span>
        </div>

        {/* Stats grid — 4 boxes */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}>
          {/* Files */}
          <div style={{
            backgroundColor: "var(--bg-base)",
            borderRadius: 8,
            padding: "10px 12px",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 28,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}>
              {meta.totalFiles}
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-faint)",
              marginTop: 2,
            }}>
              files
            </div>
          </div>

          {/* Edges */}
          <div style={{
            backgroundColor: "var(--bg-base)",
            borderRadius: 8,
            padding: "10px 12px",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 28,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}>
              {meta.totalEdges}
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-faint)",
              marginTop: 2,
            }}>
              edges
            </div>
          </div>

          {/* Orphans */}
          <div style={{
            backgroundColor: "var(--bg-base)",
            borderRadius: 8,
            padding: "10px 12px",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 28,
              color: orphanCount > 0 ? "var(--warning)" : "var(--text-muted)",
              lineHeight: 1.2,
            }}>
              {orphanCount}
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-faint)",
              marginTop: 2,
            }}>
              orphans
            </div>
          </div>

          {/* Analyzed at */}
          <div style={{
            backgroundColor: "var(--bg-base)",
            borderRadius: 8,
            padding: "10px 12px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-faint)",
              marginBottom: 2,
            }}>
              analyzed
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-muted)",
              lineHeight: 1.4,
            }}>
              {new Date(meta.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Informational banner when there are 0 edges */}
        {noEdges && (
          <div style={{
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginTop: '12px',
            fontFamily: "var(--font-body)",
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.6
          }}>
            <span style={{ color: 'var(--warning)' }}>ℹ</span>{' '}
            No import relationships detected. This repo may use dynamic imports,
            be a static website, or use a non-standard module pattern.
            RepoNav works best with explicit import statements. Supported: 20+ languages.
          </div>
        )}
      </div>

      {/* Section 2 — Warnings (collapsible) */}
      {showWarningsSection && (
        <div
          className="rounded-xl"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <button
            onClick={() => setWarningsOpen(prev => prev === null ? !(warnings.length <= 3) : !prev)}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 500,
              fontSize: 14,
              color: "var(--warning)",
            }}>
              ⚠ Warnings ({warnings.length})
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-faint)",
              transition: "transform 200ms ease",
              display: "inline-block",
              transform: isWarningsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
            }}>
              ▼
            </span>
          </button>

          {/* Warning list */}
          {isWarningsExpanded ? (
            <div style={{ padding: "0 16px 12px" }}>
              {warnings.map((warning, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 0",
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: getWarningDotColor(warning.type),
                    flexShrink: 0,
                    marginTop: 5,
                  }} />
                  <span style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}>
                    {warning.message}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: "0 16px 12px",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--text-faint)",
            }}>
              Click to see {warnings.length} warnings
            </div>
          )}
        </div>
      )}


      {/* Section 3 — Recommended Reading Order */}
      {onboardingPath && onboardingPath.length > 0 && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--text-primary)",
              marginBottom: 4,
            }}>
              Recommended Reading Order
            </h3>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--text-muted)",
              margin: 0,
            }}>
              Files to read first to understand this codebase
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {onboardingPath.map((step, index) => {
              const stepTypeColor = NODE_COLORS[step.type] || '#58a6ff';
              const truncatedPath = step.nodeId.length > 45 
                ? step.nodeId.slice(0, 45) + '…' 
                : step.nodeId;
                
              return (
                <div
                  key={step.nodeId}
                  onClick={() => {
                    if (onSelectStep) {
                      onSelectStep(index);
                    }
                    const el = document.getElementById("section-graph");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid ${stepTypeColor}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "border-color 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(124,106,240,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  {/* Row 1: step number + filename */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-heading)",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {step.order}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 500,
                      fontSize: 14,
                      color: "var(--text-primary)",
                    }}>
                      {step.nodeId.split('/').pop()}
                    </span>
                  </div>

                  {/* Row 2: full path */}
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text-faint)",
                    marginBottom: 4,
                    paddingLeft: 34,
                  }}>
                    {truncatedPath}
                  </div>

                  {/* Row 3: reason */}
                  <div style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                    paddingLeft: 34,
                  }}>
                    {step.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 4 — Developer Tools / Raw JSON */}
      <div style={{ marginTop: 8 }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-faint)",
          marginBottom: 6,
        }}>
          Developer Tools
        </div>
        <button
          onClick={() => setShowJson(!showJson)}
          style={{
            color: "var(--text-faint)",
            background: "none",
            border: "none",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          {showJson ? "▾ Hide raw response" : "{ } View raw response"}
        </button>

        {showJson && (
          <div
            className="mt-3 rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)", position: "relative" }}
          >
            {/* Code block header */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="inline-block w-3 h-3 rounded-full" style={{ border: "1.5px solid var(--text-faint)" }} />
                <span className="inline-block w-3 h-3 rounded-full" style={{ border: "1.5px solid var(--text-faint)" }} />
                <span className="inline-block w-3 h-3 rounded-full" style={{ border: "1.5px solid var(--text-faint)" }} />
                <span
                  style={{
                    marginLeft: 4,
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text-faint)",
                  }}
                >
                  response.json
                </span>
              </div>
            </div>
            
            {/* Copy button */}
            <button
              onClick={handleCopy}
              style={{
                position: "absolute",
                top: 6,
                right: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: copied ? "var(--success)" : "var(--text-primary)",
                background: "#161b22",
                border: "1px solid #21262d",
                padding: "3px 8px",
                borderRadius: 4,
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
            >
              {copied ? "✓ Copied" : "⎘ Copy"}
            </button>

            {/* JSON content */}
            <pre
              className="p-5 overflow-x-auto font-mono text-xs leading-relaxed"
              style={{
                backgroundColor: "var(--bg-base)",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                maxHeight: "400px",
                overflowY: "auto",
                margin: 0,
              }}
            >
              {JSON.stringify(graphData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsPlaceholder;

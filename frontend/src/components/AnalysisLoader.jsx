// AnalysisLoader.jsx — Beautiful multi-stage progress screen shown while repository is being analyzed

const STAGES = [
  { label: 'Connect', icon: '🔗', key: 'connecting' },
  { label: 'Clone', icon: '📦', key: 'cloning' },
  { label: 'Scan', icon: '🔍', key: 'scanning' },
  { label: 'Parse', icon: '🔗', key: 'parsing' },
  { label: 'Graph', icon: '🕸️', key: 'graphing' },
  { label: 'History', icon: '⏱', key: 'history' },
  { label: 'Security', icon: '🔐', key: 'security' },
  { label: 'AI', icon: '✦', key: 'ai' },
  { label: 'Done', icon: '✓', key: 'done' },
]

function AnalysisLoader({
  repoUrl,
  progressPercent,
  progressStage,
  progressMessage,
}) {
  const owner = repoUrl?.split('github.com/')?.[1]
    ?.split('/')?.[0] || ''
  const repo = repoUrl?.split('github.com/')?.[1]
    ?.split('/')?.[1]
    ?.replace(/\.git$/, '') || ''

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)',
      padding: '40px 20px',
    }}>
      {/* Repo being analyzed */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 40,
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'rgba(124, 106, 240, 0.1)',
          border: '1px solid rgba(124, 106, 240, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24"
            fill="var(--accent)">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </div>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 5,
          }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              color: 'var(--text-muted)',
            }}>
              {owner}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              color: 'var(--text-faint)',
            }}>
              /
            </span>
            <span style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 24,
              color: 'var(--text-primary)',
            }}>
              {repo}
            </span>
          </div>
          <div style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: 'var(--text-faint)',
            marginTop: 2,
          }}>
            Analyzing repository architecture...
          </div>
        </div>
      </div>

      {/* Main progress bar */}
      <div style={{
        width: '100%',
        maxWidth: 560,
        marginBottom: 12,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: 11, // Outfit 11px
            color: 'var(--text-muted)',
          }}>
            {progressMessage || 'Starting...'}
          </span>
          <span style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--accent)',
          }}>
            {Math.round(progressPercent || 0)}%
          </span>
        </div>

        {/* Progress track */}
        <div style={{
          width: '100%',
          height: 12,
          background: 'var(--bg-elevated)',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent || 0}%`,
            background:
              `linear-gradient(90deg, #7c6af0 0%, #4ade80 100%)`,
            borderRadius: 6,
            transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 8px rgba(124, 106, 240, 0.4)',
          }} />
        </div>
      </div>

      {/* Stage dots */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 40,
        maxWidth: 560,
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Connector line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 16,
          right: 16,
          height: 1,
          background: 'var(--border)',
          transform: 'translateY(-50%)',
          zIndex: 0,
        }} />

        {STAGES.map((stage, i) => {
          const isCompleted = i < progressStage
          const isActive = i === progressStage
          const isPending = i > progressStage

          return (
            <div
              key={stage.key}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                position: 'relative',
                zIndex: 2,
              }}
            >
              {/* Stage dot */}
              <div style={{
                width: isActive ? 28 : 22,
                height: isActive ? 28 : 22,
                borderRadius: '50%',
                background: isCompleted
                  ? 'var(--success)'
                  : isActive
                    ? 'var(--accent)'
                    : 'var(--bg-elevated)',
                border: isCompleted
                  ? '2px solid var(--success)'
                  : isActive
                    ? '2px solid var(--accent)'
                    : '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isActive ? 13 : 10,
                transition: 'all 400ms ease',
                boxShadow: isActive
                  ? '0 0 12px rgba(124, 106, 240, 0.5)'
                  : isCompleted
                    ? '0 0 8px rgba(74, 222, 128, 0.3)'
                    : 'none',
              }}>
                {isCompleted ? (
                  <span style={{ color: '#0a0d12', fontSize: 10, fontWeight: 700 }}>
                    ✓
                  </span>
                ) : (
                  <span style={{
                    fontSize: isActive ? 11 : 9,
                    opacity: isPending ? 0.4 : 1,
                  }}>
                    {stage.icon}
                  </span>
                )}
              </div>

              {/* Stage label (Syne Medium 10px) */}
              <span style={{
                fontFamily: "var(--font-heading)",
                fontSize: 10,
                fontWeight: 500,
                color: isCompleted
                  ? 'var(--success)'
                  : isActive
                    ? 'var(--accent)'
                    : 'var(--text-faint)',
                transition: 'color 400ms ease',
                whiteSpace: 'nowrap',
              }}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Info cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        maxWidth: 560,
        width: '100%',
      }}>
        {[
          {
            icon: '🔍',
            title: 'Static Analysis',
            desc: 'Extracting all import relationships',
          },
          {
            icon: '✦',
            title: 'AI Summaries',
            desc: 'Summarizing key files with Groq AI',
          },
          {
            icon: '🔐',
            title: 'Security Scan',
            desc: 'Checking for exposed secrets',
          },
        ].map(card => (
          <div
            key={card.title}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '12px 14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>
              {card.icon}
            </div>
            <div style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 12, // Syne Medium 12px
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}>
              {card.title}
            </div>
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: 10, // Outfit 10px
              color: 'var(--text-faint)',
              lineHeight: 1.5,
            }}>
              {card.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Time estimate */}
      {progressStage >= 7 && (
        <div style={{
          marginTop: 24,
          fontFamily: "var(--font-body)",
          fontSize: 11, // Outfit 11px
          color: 'var(--text-faint)',
          textAlign: 'center',
          lineHeight: 1.6,
          animation: 'fadeSlideUp 400ms ease both',
        }}>
          AI summaries take 30-90 seconds depending on repo size.
          <br />
          Grab a coffee ☕ — this only happens once per repository.
        </div>
      )}
    </div>
  )
}

export default AnalysisLoader

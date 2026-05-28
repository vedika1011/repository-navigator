// NavBar.jsx — Sticky top navigation bar with backdrop blur, RepoNav wordmark, and GitHub link.

function NavBar({ isLoading, graphData, onNewAnalysis }) {
  const lastUrl = sessionStorage.getItem('reponav_last_url') || ''
  let repoUrl = 'https://github.com'
  if (lastUrl) {
    if (lastUrl.startsWith('http')) {
      repoUrl = lastUrl.replace(/\.git$/, '');
    } else {
      repoUrl = `https://github.com/${lastUrl.replace(/\.git$/, '')}`
    }
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "nowrap",
        gap: 12,
        padding: "0 24px",
        height: 70,
        background: "rgba(10,13,18,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Wordmark */}
        <a
          href="/"
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 22,
            color: "var(--accent)",
            textDecoration: "none",
            display: 'flex',
            alignItems: 'center',
          }}
        >
          RepoNav
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: 'var(--text-faint)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '1px 5px',
            marginLeft: 8,
            verticalAlign: 'middle',
          }}>
            v1.0
          </span>
        </a>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        {/* Status indicator during analysis */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            <span style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'inline-block',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            Analyzing...
          </div>
        )}

        {/* New Analysis button */}
        {graphData && (
          <button
            onClick={onNewAnalysis}
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              borderRadius: 8,
              color: 'var(--accent)',
              fontFamily: "var(--font-heading)",
              fontSize: 12,
              padding: '5px 12px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(124,106,240,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-subtle)';
            }}
          >
            + New Analysis
          </button>
        )}

        {/* GitHub link */}
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'color 200ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          View on GitHub
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </nav>
  );
}

export default NavBar;

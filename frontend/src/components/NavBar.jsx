// NavBar.jsx — Sticky top navigation bar with backdrop blur, RepoNav wordmark, and GitHub link.

function NavBar({ isLoading, graphData, onNewAnalysis }) {
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
        padding: "16px 40px",
        background: "rgba(9,12,16,0.85)",
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
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--accent)",
            textDecoration: "none",
            display: 'flex',
            alignItems: 'center',
          }}
        >
          RepoNav
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
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

        {/* Status indicator during analysis */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: 'var(--text-muted)',
            marginLeft: 8,
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
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* New Analysis button */}
        {graphData && (
          <button
            onClick={onNewAnalysis}
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: 8,
              color: 'var(--accent)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              padding: '5px 12px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(167,139,250,0.15)';
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
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-mono text-sm transition-colors duration-200"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <span>View on GitHub</span>
          {/* External link icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </nav>
  );
}

export default NavBar;

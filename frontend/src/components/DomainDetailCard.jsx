// DomainDetailCard.jsx — Shows details of the selected domain

function DomainDetailCard({ domain, onClear }) {
  if (!domain) return null

  return (
    <div style={{
      background: 'rgba(167,139,250,0.06)',
      border: '1px solid rgba(167,139,250,0.2)',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>{domain.icon}</span>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--accent)',
          }}>
            {domain.name}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: 'var(--text-faint)',
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '1px 6px',
          }}>
            {domain.fileCount} files
          </span>
        </div>
        <button
          onClick={onClear}
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

      {/* Description */}
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: 'var(--text-muted)',
        lineHeight: 1.6,
        margin: '0 0 10px 0',
      }}>
        {domain.description}
      </p>

      {/* Top files */}
      {domain.topFiles && domain.topFiles.length > 0 && (
        <div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: 'var(--text-faint)',
            letterSpacing: '0.06em',
            marginBottom: 5,
          }}>
            KEY FILES
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
          }}>
            {domain.topFiles.map((f, i) => (
              <span key={i} style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: 'var(--text-muted)',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '2px 7px',
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DomainDetailCard

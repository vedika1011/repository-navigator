// QueryBar.jsx — Natural language search bar for querying the repository graph

import { useState, useRef, useEffect } from 'react'

const SUGGESTED_QUERIES = [
  'Where is authentication handled?',
  'Show me the database layer',
  'What handles API routing?',
  'Where is error handling?',
  'Show utility files',
  'What are the entry points?',
]

function QueryBar({
  queryText,
  setQueryText,
  onSubmit,
  onClear,
  isQuerying,
  queryError,
  isQueryMode,
  resultCount,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  // Filter suggestions based on input
  const filteredSuggestions = queryText.length > 0
    ? SUGGESTED_QUERIES.filter(s =>
        s.toLowerCase().includes(queryText.toLowerCase())
      )
    : SUGGESTED_QUERIES

  function handleKeyDown(e) {
    if (e.key === 'Enter' && queryText.trim()) {
      setShowSuggestions(false)
      onSubmit(queryText)
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      if (isQueryMode) onClear()
    }
  }

  function handleSuggestionClick(suggestion) {
    setQueryText(suggestion)
    setShowSuggestions(false)
    onSubmit(suggestion)
  }

  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      {/* Label */}
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: 'var(--text-faint)',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          color: 'var(--accent)',
          fontSize: 12,
        }}>⌕</span>
        Natural Language Search
        {isQueryMode && resultCount > 0 && (
          <span style={{ color: 'var(--text-muted)' }}>
            — {resultCount} file{resultCount !== 1 ? 's' : ''} matched
          </span>
        )}
      </div>

      {/* Input container */}
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'stretch',
      }}>
        {/* Input */}
        <div style={{
          flex: 1,
          position: 'relative',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={queryText}
            onChange={e => {
              setQueryText(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "where is authentication handled?"'
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: isQueryMode
                ? '1px solid rgba(167,139,250,0.4)'
                : '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 36px 8px 12px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'border-color 200ms ease',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e =>
              e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'
            }
            onMouseLeave={e => {
              if (!isQueryMode)
                e.currentTarget.style.borderColor = 'var(--border)'
            }}
          />
          {/* Clear X button inside input */}
          {(queryText || isQueryMode) && (
            <button
              onClick={onClear}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-faint)',
                cursor: 'pointer',
                padding: 2,
                lineHeight: 1,
                fontSize: 14,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          onClick={() => queryText.trim() && onSubmit(queryText)}
          disabled={isQuerying || !queryText.trim()}
          style={{
            background: isQuerying
              ? 'var(--bg-elevated)'
              : 'var(--accent-subtle, rgba(167,139,250,0.08))',
            border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 8,
            color: isQuerying ? 'var(--text-faint)' : 'var(--accent)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            padding: '8px 14px',
            cursor: isQuerying ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 200ms ease',
            minWidth: 70,
          }}
        >
          {isQuerying ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
                animation: 'pulse 1s ease-in-out infinite',
              }} />
              Searching
            </span>
          ) : 'Search'}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && !isQuerying && filteredSuggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 80,
          marginTop: 4,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          overflow: 'hidden',
          zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {filteredSuggestions.map((suggestion, i) => (
            <button
              key={i}
              onMouseDown={() => handleSuggestionClick(suggestion)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                borderBottom: i < filteredSuggestions.length - 1
                  ? '1px solid var(--border)' : 'none',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={e =>
                e.currentTarget.style.background = 'var(--bg-surface)'
              }
              onMouseLeave={e =>
                e.currentTarget.style.background = 'none'
              }
            >
              <span style={{ color: 'var(--text-faint)', marginRight: 8 }}>
                ⌕
              </span>
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {queryError && (
        <div style={{
          marginTop: 6,
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: '#f78166',
        }}>
          ⚠ {queryError}
        </div>
      )}
    </div>
  )
}

export default QueryBar

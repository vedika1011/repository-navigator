// RepoInput.jsx — URL input and Analyze button with client-side validation, loading state, and error display.

import { useState, useEffect } from "react";

function RepoInput({ onAnalyze, isLoading, backendError, defaultValue, progressMessage }) {
  const [url, setUrl] = useState(defaultValue || "");
  const [validationError, setValidationError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (defaultValue && !url) {
      setUrl(defaultValue);
    }
  }, [defaultValue, url]);

  function validate(value) {
    if (!value.trim()) {
      return "Please enter a repository URL";
    }
    if (!value.trim().startsWith("https://github.com/")) {
      return "URL must start with https://github.com/";
    }
    // Check for at least owner/repo pattern
    const path = value.trim().replace("https://github.com/", "").replace(/\/$/, "");
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 2) {
      return "URL must include owner and repository name";
    }
    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    const error = validate(url);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError("");
    onAnalyze(url.trim());
  }

  function handleChange(e) {
    setUrl(e.target.value);
    if (validationError) {
      setValidationError("");
    }
  }

  const displayError = validationError || backendError;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            border: `1px solid ${isFocused ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 12,
            backgroundColor: "var(--bg-elevated)",
            transition: 'border-color 200ms ease',
          }}
        >
          {/* Left search icon inside input */}
          <div style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-faint)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          <input
            type="text"
            value={url}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="https://github.com/username/repository"
            disabled={isLoading}
            className="flex-1 px-5 py-3 bg-transparent outline-none font-mono text-sm disabled:opacity-50"
            style={{
              color: "var(--text-primary)",
              borderRight: 'none',
              borderRadius: '12px 0 0 12px',
              paddingLeft: 40,
            }}
            aria-label="GitHub repository URL"
          />

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{
              backgroundColor: isLoading ? "var(--bg-surface)" : "var(--accent)",
              color: isLoading ? "var(--text-muted)" : "#0d1117",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              width: 160,
              borderRadius: '0 12px 12px 0',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && url.trim()) {
                e.currentTarget.style.backgroundColor = "var(--accent-hover)";
                e.currentTarget.style.boxShadow = "0 0 20px var(--accent-glow)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin-slow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="var(--text-faint)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Analyze</span>
            )}
          </button>
        </div>
      </form>

      {/* Error message */}
      {displayError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#f78166',
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          marginTop: 8,
          paddingLeft: 12,
        }}>
          <span>⚠</span>
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}

export default RepoInput;

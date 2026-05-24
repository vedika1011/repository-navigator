// ErrorBoundary.jsx — Catches React render errors and shows friendly fallback
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#161b22',
          border: '1px solid #f78166',
          borderRadius: 12,
          padding: '16px 20px',
          maxWidth: 380,
          zIndex: 9999,
          fontFamily: 'DM Mono, monospace',
        }}>
          <div style={{
            color: '#f78166',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 6,
          }}>
            ⚠ Something went wrong
          </div>
          <div style={{
            color: '#8b949e',
            fontSize: 12,
            lineHeight: 1.5,
            marginBottom: 12,
          }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: 'none',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#8b949e',
              fontFamily: 'DM Mono, monospace',
              fontSize: 11,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary

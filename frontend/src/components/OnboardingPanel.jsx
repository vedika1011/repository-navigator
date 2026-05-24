// OnboardingPanel.jsx — Redesigned slide-in bottom panel for step-by-step onboarding walkthrough.

import { useEffect } from "react";

const NODE_COLORS = {
  entry: '#58a6ff',
  route: '#7ee787',
  controller: '#d2a8ff',
  middleware: '#ffa657',
  model: '#f78166',
  utility: '#8b949e',
  config: '#79c0ff',
};

function OnboardingPanel({
  onboardingPath,
  currentStepIndex,
  isActive,
  onClose,
  onNext,
  onPrev,
  onGoToStep,
  isFirstStep,
  isLastStep,
  progressPercent,
  graphData,
}) {
  // Debug check for varied reasons
  useEffect(() => {
    if (graphData?.onboardingPath) {
      console.log("[OnboardingPanel] onboardingPath reasons:", graphData.onboardingPath.map(step => step.reason));
    }
  }, [graphData?.onboardingPath]);

  if (!onboardingPath || onboardingPath.length === 0) return null;

  const currentStep = onboardingPath[currentStepIndex] || null;

  // Look up the node summary from graphData
  let summaryText = '';
  let summaryType = 'placeholder';
  if (currentStep && graphData?.graph?.nodes) {
    const matchedNode = graphData.graph.nodes.find(n => n.id === currentStep.nodeId);
    if (matchedNode) {
      summaryText = matchedNode.summary || '';
      summaryType = matchedNode.summaryType || 'placeholder';
    }
  }

  // A summary is "real" only if it was AI-generated
  const hasRealSummary = summaryType === 'ai' && 
    summaryText && 
    summaryText.length > 30
  const typeColor = currentStep ? (NODE_COLORS[currentStep.type] || '#8b949e') : '#8b949e';

  // Detect if summary is truncated mid-sentence
  const isTruncated = summaryText &&
    summaryText.length > 0 &&
    !['.', '!', '?'].includes(summaryText.trim().slice(-1));

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: isActive
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(100%)',
        opacity: isActive ? 1 : 0,
        width: 'min(860px, 95vw)',
        maxHeight: 'min(480px, 60vh)',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)',
        borderTop: '1px solid #30363d',
        borderLeft: '1px solid #21262d',
        borderRight: '1px solid #21262d',
        borderRadius: '12px 12px 0 0',
        padding: '24px 32px',
        zIndex: 50,
        transition: 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
        pointerEvents: isActive ? 'auto' : 'none',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header row (fixed) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--text-primary)',
          }}>
            Onboarding Mode
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            Step {currentStepIndex + 1} of {onboardingPath.length}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: 20,
            cursor: 'pointer',
            padding: '2px 8px',
            borderRadius: 4,
            lineHeight: 1,
            transition: 'color 200ms ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-faint)'}
        >
          ×
        </button>
      </div>

      {/* Progress bar (fixed) */}
      <div style={{
        width: '100%',
        height: 3,
        background: 'var(--bg-elevated)',
        borderRadius: 2,
        marginBottom: 20,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          width: progressPercent + '%',
          height: 3,
          background: 'var(--accent)',
          borderRadius: 2,
          transition: 'width 300ms ease',
        }} />
      </div>

      {/* ═══ Scrollable Content Area ═══ */}
      <div className="sidebar-scroll-area" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        {/* Step hero block */}
        {currentStep && (
          <div style={{ marginBottom: 16 }}>
            {/* File label with inline step number */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 32,
                color: 'rgba(88,166,255,0.15)',
                lineHeight: 1,
                marginRight: 12,
                userSelect: 'none',
              }}>
                {String(currentStep.order).padStart(2, '0')}
              </span>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: 'var(--text-primary)',
              }}>
                {currentStep.label}
              </div>
            </div>

            {/* File path */}
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: 'var(--text-faint)',
              marginBottom: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '70%',
            }}>
              {currentStep.nodeId}
            </div>

            {/* Type badge + importance row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: typeColor,
                background: typeColor + '18',
                padding: '3px 10px',
                borderRadius: 12,
                textTransform: 'lowercase',
              }}>
                {currentStep.type}
              </span>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: 'var(--text-muted)',
              }}>
                Impact: {currentStep.importance || '–'}/10
              </span>
            </div>

            {/* Reason text with left accent border */}
            <div style={{
              borderLeft: '3px solid rgba(88,166,255,0.4)',
              paddingLeft: 12,
              fontFamily: "'DM Mono', monospace",
              fontSize: 14,
              color: 'var(--text-muted)',
              lineHeight: 1.7,
            }}>
              {currentStep.reason}
            </div>
          </div>
        )}

        {/* AI Summary block */}
        {hasRealSummary && (
          <div style={{
            background: 'rgba(88,166,255,0.04)',
            border: '1px solid rgba(88,166,255,0.1)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: 'var(--text-faint)',
              }}>
                ✦ AI Summary
              </span>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: 'var(--accent)',
                background: 'rgba(88,166,255,0.1)',
                padding: '1px 6px',
                borderRadius: 4,
              }}>
                AI
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                maxHeight: 100,
                overflowY: 'auto',
              }} className="sidebar-scroll-area">
                {summaryText}{isTruncated ? '...' : ''}
              </div>
            </div>
          </div>
        )}

        {!hasRealSummary && (
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: 'var(--text-faint)',
            fontStyle: 'italic',
            padding: '8px 0',
            borderTop: '1px solid var(--border)',
            marginTop: 4,
            marginBottom: 16,
          }}>
            ✦ Open this file in the sidebar to generate an AI summary
          </div>
        )}

        {/* Step pill navigator */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 16,
          minHeight: 36,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
          className="onboarding-pills-scroll"
        >
          {onboardingPath.map((step, i) => {
            const isCurrent = i === currentStepIndex;
            const isCompleted = i < currentStepIndex;
            return (
              <button
                key={step.nodeId}
                onClick={() => onGoToStep(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  padding: '4px 10px',
                  borderRadius: 12,
                  border: 'none',
                  borderTop: isCurrent ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  minWidth: 80,
                  textAlign: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  transition: 'all 200ms ease',
                  background: isCurrent
                    ? 'var(--accent)'
                    : 'var(--bg-surface)',
                  color: isCurrent
                    ? '#0d1117'
                    : 'var(--text-faint)',
                }}
              >
                {isCompleted && (
                  <span style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#7ee787',
                    flexShrink: 0,
                  }} />
                )}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* ═══ End Scrollable Content Area ═══ */}

      {/* Separator (fixed) */}
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: 16, flexShrink: 0 }} />

      {/* Navigation row (fixed) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        {/* Previous button */}
        <button
          onClick={onPrev}
          disabled={isFirstStep}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            padding: '10px 20px',
            minWidth: 100,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: isFirstStep ? 'var(--text-faint)' : 'var(--text-muted)',
            cursor: isFirstStep ? 'not-allowed' : 'pointer',
            opacity: isFirstStep ? 0.5 : 1,
            transition: 'all 200ms ease',
          }}
        >
          ← Prev
        </button>

        {/* Exit button */}
        <button
          onClick={onClose}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            padding: '10px 12px',
            transition: 'color 200ms ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-faint)'}
        >
          Exit Onboarding
        </button>

        {/* Next / Finish button */}
        <button
          onClick={isLastStep ? onClose : onNext}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            padding: '10px 20px',
            minWidth: 100,
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#0d1117',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
        >
          {isLastStep ? 'Finish ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

export default OnboardingPanel;

// useOnboarding.js — Manages onboarding walkthrough state with keyboard navigation.

import { useState, useEffect, useCallback, useMemo } from 'react';

export default function useOnboarding(onboardingPath) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [summaries, setSummaries] = useState(new Map())
  const [loadingSummaries, setLoadingSummaries] = useState(new Set())

  const totalSteps = onboardingPath?.length || 0;

  const currentStep = useMemo(() => {
    if (!onboardingPath || totalSteps === 0) return null;
    return onboardingPath[currentStepIndex] || null;
  }, [onboardingPath, currentStepIndex, totalSteps]);

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = totalSteps > 0 && currentStepIndex === totalSteps - 1;
  const progressPercent = totalSteps > 0
    ? Math.round(((currentStepIndex + 1) / totalSteps) * 100)
    : 0;

  async function fetchSummariesForPath(onboardingPath, graphNodes) {
    if (!onboardingPath || onboardingPath.length === 0) return
    if (!graphNodes || graphNodes.length === 0) return

    // Find nodes in the onboarding path that don't have AI summaries yet
    const nodesToSummarize = onboardingPath.filter(step => {
      const node = graphNodes.find(n => n.id === step.nodeId)
      // Only fetch if no AI summary exists
      return node && node.summaryType !== 'ai'
    })

    if (nodesToSummarize.length === 0) return

    console.log(`[useOnboarding] Auto-fetching summaries for ${nodesToSummarize.length} onboarding nodes`)

    // Fetch all summaries concurrently
    await Promise.allSettled(
      nodesToSummarize.map(async (step) => {
        const node = graphNodes.find(n => n.id === step.nodeId)
        if (!node) return

        // Mark as loading
        setLoadingSummaries(prev => new Set([...prev, step.nodeId]))

        try {
          const response = await fetch('http://localhost:3001/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId: node.id,
              absolutePath: node.absolutePath || '',
              label: node.label,
              relativePath: node.id,
              extension: node.label.split('.').pop() || 'js',
              linesOfCode: node.linesOfCode || 0,
            }),
          })

          const data = await response.json()

          if (data.success && data.summary) {
            setSummaries(prev => new Map([...prev, [step.nodeId, data.summary]]))
            console.log(`[useOnboarding] ✓ Summary ready: ${node.label}`)
          }
        } catch (err) {
          console.warn(`[useOnboarding] Failed to fetch summary for ${node.label}: ${err.message}`)
        } finally {
          setLoadingSummaries(prev => {
            const next = new Set(prev)
            next.delete(step.nodeId)
            return next
          })
        }
      })
    )

    console.log(`[useOnboarding] All onboarding summaries fetched`)
  }

  const startOnboarding = useCallback((graphNodes) => {
    if (totalSteps === 0) return;
    setIsOnboardingActive(true);
    setCurrentStepIndex(0);
    // Start fetching summaries in background (non-blocking)
    fetchSummariesForPath(onboardingPath, graphNodes);
  }, [totalSteps, onboardingPath]);

  const stopOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    setCurrentStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(i => i + 1);
    }
  }, [currentStepIndex, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((index) => {
    const clamped = Math.min(totalSteps - 1, Math.max(0, index));
    setCurrentStepIndex(clamped);
  }, [totalSteps]);

  // Keyboard navigation — only active during onboarding
  useEffect(() => {
    if (!isOnboardingActive) return;

    function handleKeyDown(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        stopOnboarding();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboardingActive, nextStep, prevStep, stopOnboarding]);

  return {
    isOnboardingActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    startOnboarding,
    stopOnboarding,
    nextStep,
    prevStep,
    goToStep,
    isLastStep,
    isFirstStep,
    progressPercent,
    summaries,
    loadingSummaries,
  };
}

// useOnboarding.js — Manages onboarding walkthrough state with keyboard navigation.

import { useState, useEffect, useCallback, useMemo } from 'react';

export default function useOnboarding(onboardingPath) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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

  const startOnboarding = useCallback(() => {
    if (totalSteps === 0) return;
    setIsOnboardingActive(true);
    setCurrentStepIndex(0);
  }, [totalSteps]);

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
    progressPercent
  };
}

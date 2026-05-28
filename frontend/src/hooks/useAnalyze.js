// useAnalyze.js — Custom hook that manages the analyze request state and exposes a trigger function.

import { useState } from "react";
import { analyzeRepo } from "../api.js";

function useAnalyze() {
  const [graphData, setGraphData] = useState(() => {
    try {
      const cached = sessionStorage.getItem('reponav_last_result')
      if (cached) {
        const parsed = JSON.parse(cached)
        console.log('[useAnalyze] Restored from sessionStorage')
        return parsed
      }
    } catch (e) {
      console.warn('[useAnalyze] Could not restore from sessionStorage:', e)
    }
    return null
  });
  
  const [lastRepoUrl, setLastRepoUrl] = useState(() => {
    return sessionStorage.getItem('reponav_last_url') || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressStage, setProgressStage] = useState(0)

  async function analyze(repoUrl) {
    setGraphData(null);
    setError(null);
    setLastRepoUrl(repoUrl);
    setIsLoading(true);

    const STAGES = [
      { message: 'Connecting to GitHub...', percent: 3, durationMs: 1500 },
      { message: 'Cloning repository...', percent: 8, durationMs: 15000 },
      { message: 'Scanning source files...', percent: 42, durationMs: 2000 },
      { message: 'Extracting import dependencies...', percent: 57, durationMs: 2000 },
      { message: 'Building architecture graph...', percent: 66, durationMs: 1500 },
      { message: 'Analyzing git history...', percent: 73, durationMs: 1500 },
      { message: 'Running security scan...', percent: 78, durationMs: 2000 },
      { message: 'Generating AI summaries...', percent: 83, durationMs: 60000 },
      { message: 'Almost done...', percent: 96, durationMs: 3000 },
    ]

    let stageIndex = 0
    setProgressPercent(STAGES[0].percent)
    setProgressMessage(STAGES[0].message)
    setProgressStage(0)

    const advanceStage = () => {
      stageIndex = Math.min(stageIndex + 1, STAGES.length - 1)
      setProgressStage(stageIndex)
      setProgressMessage(STAGES[stageIndex].message)
      // Animate percent smoothly to target
      setProgressPercent(STAGES[stageIndex].percent)
    }

    // Schedule stage advances based on estimated durations
    let elapsed = 0
    const stageTimers = []
    STAGES.forEach((stage, i) => {
      if (i === 0) return // already set
      elapsed += STAGES[i - 1].durationMs
      const timer = setTimeout(advanceStage, elapsed)
      stageTimers.push(timer)
    })

    try {
      const data = await analyzeRepo(repoUrl);
      // Jump to 100% on success
      setProgressPercent(100)
      setProgressMessage('Analysis complete!')
      await new Promise(resolve => setTimeout(resolve, 600))
      
      setGraphData(data);
      try {
        sessionStorage.setItem('reponav_last_result', JSON.stringify(data));
        console.log('[useAnalyze] Saved to sessionStorage');
      } catch (e) {
        console.warn('[useAnalyze] Could not save to sessionStorage:', e);
      }
      sessionStorage.setItem('reponav_last_url', repoUrl);
      setLastRepoUrl(repoUrl);
    } catch (err) {
      console.error("[useAnalyze] Caught error:", err);
      console.error("[useAnalyze] Error message:", err.message);
      console.error("[useAnalyze] Error stack:", err.stack);
      setError(err.message);
    } finally {
      stageTimers.forEach(clearTimeout)
      setProgressPercent(0)
      setProgressStage(0)
      setProgressMessage('')
      setIsLoading(false);
    }
  }

  return {
    graphData, isLoading, error, analyze,
    lastRepoUrl, progressMessage,
    progressPercent, progressStage
  };
}

export default useAnalyze;

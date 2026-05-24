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

  async function analyze(repoUrl) {
    setGraphData(null);
    setError(null);
    setIsLoading(true);

    const messages = [
      'Cloning repository...',
      'Scanning source files...',
      'Extracting import statements...',
      'Building dependency graph...',
      'Calculating importance scores...',
      'Generating AI summaries...',
      'Almost done...',
    ];
    let msgIndex = 0;
    setProgressMessage(messages[0]);
    const msgInterval = setInterval(() => {
      msgIndex = Math.min(msgIndex + 1, messages.length - 1);
      setProgressMessage(messages[msgIndex]);
    }, 8000); // advance every 8 seconds

    try {
      const data = await analyzeRepo(repoUrl);
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
      clearInterval(msgInterval);
      setProgressMessage('');
      setIsLoading(false);
    }
  }

  return { graphData, isLoading, error, analyze, lastRepoUrl, progressMessage };
}

export default useAnalyze;

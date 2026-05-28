// useRepoOverview.js — Fetches repo overview on demand

import { useState, useCallback } from 'react'

export default function useRepoOverview(graphData) {
  const [overviewText, setOverviewText] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [overviewError, setOverviewError] = useState(null)

  const generateOverview = useCallback(async () => {
    if (!graphData?.graph?.nodes) return
    if (isGenerating) return

    setIsGenerating(true)
    setOverviewError(null)

    try {
      const response = await fetch(
        'http://localhost:3001/overview',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: graphData.meta.owner,
            repo: graphData.meta.repo,
            nodes: graphData.graph.nodes.map(n => ({
              id: n.id,
              label: n.label,
              type: n.type,
              importance: n.importance,
            })),
            edgeCount: graphData.graph.edges.length,
          }),
        }
      )

      const data = await response.json()

      if (data.success && data.overview) {
        setOverviewText(data.overview)
      } else {
        setOverviewError(
          data.error?.message || 'Could not generate overview.'
        )
      }
    } catch (err) {
      setOverviewError('Could not reach the server.')
    } finally {
      setIsGenerating(false)
    }
  }, [graphData, isGenerating])

  // Use overview from API response first,
  // then fall back to locally generated one
  const overview =
    graphData?.repoOverview || overviewText

  return {
    overview,
    isGenerating,
    overviewError,
    generateOverview,
    hasOverview: Boolean(overview),
  }
}

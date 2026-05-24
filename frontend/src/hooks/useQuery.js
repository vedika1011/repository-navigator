// useQuery.js — Manages natural language query state and API calls

import { useState, useCallback, useMemo } from 'react'

export default function useQuery(graphData) {
  const [queryText, setQueryText] = useState('')
  const [queryResults, setQueryResults] = useState(null)
  const [isQuerying, setIsQuerying] = useState(false)
  const [queryError, setQueryError] = useState(null)
  const [isQueryMode, setIsQueryMode] = useState(false)

  const submitQuery = useCallback(async (query) => {
    console.log('[useQuery] submitQuery called with:', query)
    console.log('[useQuery] graphData exists:', !!graphData)
    console.log('[useQuery] nodes count:', graphData?.graph?.nodes?.length)

    if (!query.trim() || !graphData?.graph?.nodes) {
      console.warn('[useQuery] Early return — missing query or nodes')
      return
    }

    setIsQuerying(true)
    setQueryError(null)
    setIsQueryMode(true)
    console.log('[useQuery] Set isQueryMode: true, making API call...')

    try {
      const response = await fetch('http://localhost:3001/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          nodes: graphData.graph.nodes,
        }),
      })
      console.log('[useQuery] Response status:', response.status)

      const data = await response.json()
      console.log('[useQuery] Response data:', data)
      console.log('[useQuery] Matches:', data.matches?.length)

      if (!data.success) {
        throw new Error(data.error?.message || 'Query failed')
      }

      setQueryResults(data)
      console.log('[useQuery] Set queryResults, matchedNodeIds will be:',
        data.matches?.map(m => m.nodeId))

    } catch (err) {
      console.error('[useQuery] Error:', err.message)
      setQueryError(err.message)
      setQueryResults(null)
    } finally {
      setIsQuerying(false)
      console.log('[useQuery] Done, isQuerying: false')
    }
  }, [graphData])

  const clearQuery = useCallback(() => {
    setQueryText('')
    setQueryResults(null)
    setQueryError(null)
    setIsQueryMode(false)
  }, [])

  const matchedNodeIds = useMemo(() => {
    if (!queryResults?.matches) return null
    return new Set(
      queryResults.matches.map(m =>
        m.nodeId.replace(/^\.\//, '')  // normalize leading ./
      )
    )
  }, [queryResults])

  return {
    queryText,
    setQueryText,
    queryResults,
    isQuerying,
    queryError,
    isQueryMode,
    submitQuery,
    clearQuery,
    matchedNodeIds,
  }
}

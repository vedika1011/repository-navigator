// useDomain.js — Manages domain selection state and
// graph highlighting for architecture domains

import { useState, useCallback, useMemo } from 'react'

export default function useDomain(domains) {
  const [activeDomains, setActiveDomains] = useState(new Set())

  const selectDomain = useCallback((domain) => {
    if (!domain) {
      setActiveDomains(new Set())
      return
    }
    setActiveDomains(prev => {
      const next = new Set(prev)
      if (next.has(domain.id)) {
        next.delete(domain.id)
      } else {
        next.add(domain.id)
      }
      return next
    })
  }, [])

  const clearDomain = useCallback(() => {
    setActiveDomains(new Set())
  }, [])

  // Combined nodeIds from all active domains (union)
  const activeDomainNodeIds = useMemo(() => {
    if (activeDomains.size === 0 || !domains) return null
    const allIds = new Set()
    domains
      .filter(d => activeDomains.has(d.id))
      .forEach(d => d.nodeIds?.forEach(id => allIds.add(id)))
    return allIds
  }, [activeDomains, domains])

  const isDomainActive = activeDomains.size > 0

  return {
    activeDomains,          // Set of active domain IDs
    activeDomainNodeIds,    // Set of all node IDs in active domains
    selectDomain,
    clearDomain,
    isDomainActive,
  }
}

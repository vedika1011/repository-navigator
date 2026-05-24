// queryService.js — Natural language search over repository graph using local Ollama AI

const { isAIEnabled } = require('./aiService')

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

async function queryGraph(userQuery, nodes) {
  console.log(`[QueryService] queryGraph called`)
  console.log(`[QueryService] query: "${userQuery}"`)
  console.log(`[QueryService] nodes received: ${nodes?.length}`)
  console.log(`[QueryService] first node sample:`, nodes?.[0])

  if (!userQuery || !nodes || nodes.length === 0) {
    return { matches: [], queryUsed: userQuery }
  }

  console.log(`[QueryService] Processing query: "${userQuery}"`)

  // Step 1: keyword-based fast pre-filter
  // Find nodes that mention query terms in label, type, path, or summary
  const queryTerms = userQuery.toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2)
    .filter(t => !['the','and','for','are','how','what',
                   'where','show','find','does','with',
                   'this','that','which','file'].includes(t))

  // Score each node by keyword match
  const keywordScored = nodes.map(node => {
    const searchText = [
      node.label,
      node.id,
      node.type,
      node.summary || '',
    ].join(' ').toLowerCase()

    let score = 0
    queryTerms.forEach(term => {
      if (searchText.includes(term)) score += 10
      if (node.label.toLowerCase().includes(term)) score += 15
      if (node.type.toLowerCase().includes(term)) score += 8
    })

    // Boost by importance
    score += (node.importance || 5) * 0.5

    return { node, score }
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)

  // Take top 20 candidates for AI ranking
  const candidates = keywordScored.slice(0, 20)

  // If no keyword matches, take top 15 by importance instead
  const aiCandidates = candidates.length > 0
    ? candidates
    : nodes
        .sort((a, b) => (b.importance || 0) - (a.importance || 0))
        .slice(0, 15)
        .map(node => ({ node, score: 0 }))

  // Step 2: AI ranking (if Ollama available)
  if (isAIEnabled()) {
    try {
      const aiMatches = await rankWithAI(userQuery, aiCandidates.map(c => c.node))
      if (aiMatches && aiMatches.length > 0) {
        console.log(`[QueryService] AI returned ${aiMatches.length} matches`)
        return { matches: aiMatches, queryUsed: userQuery }
      }
    } catch (err) {
      console.warn(`[QueryService] AI ranking failed, using keyword results: ${err.message}`)
    }
  }

  // Fallback: return keyword matches with generated reasons
  const fallbackMatches = aiCandidates.slice(0, 8).map((item, i) => ({
    nodeId: item.node.id,
    label: item.node.label,
    type: item.node.type,
    relevanceScore: Math.round(item.score),
    reason: generateFallbackReason(item.node, queryTerms),
    rank: i + 1,
  }))

  if (fallbackMatches.length === 0) {
    console.log('[QueryService] No keyword matches — returning top nodes by importance')
    const topNodes = [...nodes]
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, 5)

    return {
      matches: topNodes.map((node, i) => ({
        nodeId: node.id,
        label: node.label || node.id.split('/').pop(),
        type: node.type || 'utility',
        relevanceScore: 30,
        reason: `High-importance file — may be related to your query`,
        rank: i + 1,
      })),
      queryUsed: userQuery,
    }
  }

  return { matches: fallbackMatches, queryUsed: userQuery }
}

async function rankWithAI(query, nodes) {
  // Build a compact node list for the prompt
  const nodeList = nodes.map((n, i) =>
    `${i + 1}. [${n.id}] type:${n.type} importance:${n.importance}${n.summary ? ' summary:"' + n.summary.slice(0, 80) + '"' : ''}`
  ).join('\n')

  const prompt = `You are a code navigation assistant. A developer asked: "${query}"

Here are candidate files from the repository:
${nodeList}

Return ONLY a JSON array of the most relevant files (max 8).
Each item must have exactly these fields:
- nodeId: the exact file ID from the list (the part in [brackets])
- reason: one short sentence explaining why this file is relevant
- relevanceScore: number 1-100

Example format:
[{"nodeId":"src/auth.js","reason":"Handles authentication middleware","relevanceScore":95}]

Return ONLY valid JSON. No explanation, no markdown, no extra text.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 400 },
      }),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`Ollama error: ${response.status}`)

    const data = await response.json()
    const raw = data.response?.trim() || ''

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const parsed = JSON.parse(jsonMatch[0])

    // Validate and clean
    return parsed
      .filter(item => item.nodeId && item.reason && item.relevanceScore)
      .map((item, i) => ({
        nodeId: item.nodeId,
        label: item.nodeId.split('/').pop(),
        type: nodes.find(n => n.id === item.nodeId)?.type || 'utility',
        relevanceScore: Number(item.relevanceScore) || 50,
        reason: item.reason,
        rank: i + 1,
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 8)

  } finally {
    clearTimeout(timeout)
  }
}

function generateFallbackReason(node, queryTerms) {
  const matched = queryTerms.filter(t =>
    [node.label, node.id, node.type].join(' ').toLowerCase().includes(t)
  )
  if (matched.length > 0) {
    return `Contains "${matched[0]}" — ${node.type} file at ${node.id}`
  }
  return `High-importance ${node.type} file that may be relevant`
}

module.exports = { queryGraph }

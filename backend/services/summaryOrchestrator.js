// summaryOrchestrator.js — Priority-based AI summarization
// Order: onboarding path files first, then other important files
// Respects Groq free tier: 6,000 tokens/minute

const aiService = require('./aiService')

const AI_REQUEST_DELAY_MS =
  parseInt(process.env.AI_REQUEST_DELAY_MS || '7000')
const AI_MAX_ONBOARDING_FILES =
  parseInt(process.env.AI_MAX_ONBOARDING_FILES || '8')
const AI_MAX_OTHER_FILES =
  parseInt(process.env.AI_MAX_OTHER_FILES || '5')

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateSummaries(nodes, scannedFiles, onboardingPath) {
  if (!aiService.isAIEnabled()) {
    console.log('[Orchestrator] AI disabled — using placeholder summaries')
    return nodes
  }

  const summaryMap = new Map()
  const scannedFileMap = new Map(scannedFiles.map(f => [f.id, f]))

  // Priority 1: onboarding path nodes
  const onboardingIds = new Set(
    (onboardingPath || []).map(p => p.nodeId)
  )
  const onboardingNodes = nodes
    .filter(n => onboardingIds.has(n.id))
    .slice(0, AI_MAX_ONBOARDING_FILES)

  // Priority 2: high importance nodes not in onboarding
  const otherNodes = nodes
    .filter(n => !onboardingIds.has(n.id) && !n.isOrphaned && n.importance >= 6)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, AI_MAX_OTHER_FILES)

  const allToSummarize = [...onboardingNodes, ...otherNodes]

  console.log(`[Orchestrator] Summarization plan:`)
  console.log(`  Onboarding files: ${onboardingNodes.length}`)
  console.log(`  Other important: ${otherNodes.length}`)
  console.log(`  Total: ${allToSummarize.length}`)
  console.log(`  Est. time: ~${Math.ceil(allToSummarize.length * AI_REQUEST_DELAY_MS / 1000)}s`)

  for (let i = 0; i < allToSummarize.length; i++) {
    const node = allToSummarize[i]
    const scannedFile = scannedFileMap.get(node.id)
    if (!scannedFile) continue

    console.log(
      `[Orchestrator] (${i + 1}/${allToSummarize.length}) ` +
      `${node.label} — ${node.type}, importance: ${node.importance}`
    )

    const summary = await aiService.summarizeFile(scannedFile)
    if (summary) summaryMap.set(node.id, summary)

    if (i < allToSummarize.length - 1) {
      await sleep(AI_REQUEST_DELAY_MS)
    }
  }

  const aiCount = summaryMap.size
  console.log(`[Orchestrator] Done: ${aiCount} AI, ${nodes.length - aiCount} placeholder`)

  return nodes.map(node => ({
    ...node,
    summary: summaryMap.get(node.id) || node.summary || '',
    summaryType: summaryMap.has(node.id) ? 'ai' : 'placeholder',
  }))
}

module.exports = { generateSummaries }

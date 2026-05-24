// summaryOrchestrator.js — Decides which files to summarize and processes them in batches.

const aiService = require('./aiService.js');
const summaryCache = require('../utils/summaryCache.js');

/**
 * Orchestrates the generation of AI summaries for the most important files in the repository.
 * Processes files in batches to avoid rate limits and manages fallback to placeholders.
 * 
 * @param {Object[]} nodes - The graph nodes
 * @param {Object[]} scannedFiles - The raw scanned files
 * @param {number} maxFiles - Maximum number of files to summarize
 * @param {number} batchSize - Number of concurrent API requests
 * @returns {Promise<Object[]>} The nodes array with updated summaries
 */
async function generateSummaries(nodes, scannedFiles, maxFiles, batchSize) {
  // Step 1 — Check if AI is enabled
  if (!aiService.isAIEnabled()) {
    console.log('[Orchestrator] AI disabled — using placeholder summaries');
    return nodes.map(n => ({ ...n, summaryType: 'placeholder' }));
  }
  console.log(`[Orchestrator] Starting AI summarization (max ${maxFiles} files, batch size ${batchSize})`);

  // Step 2 — Select files to summarize
  const selectedNodesSet = new Set();
  const selectedNodes = [];

  const addNode = (node) => {
    if (!selectedNodesSet.has(node.id) && selectedNodes.length < maxFiles) {
      selectedNodesSet.add(node.id);
      selectedNodes.push(node);
    }
  };

  // Priority a) entry nodes
  nodes.filter(n => n.type === 'entry').forEach(addNode);
  // Priority b) high importance nodes
  nodes.filter(n => n.importance >= 7).forEach(addNode);
  // Priority c) controllers and middleware
  nodes.filter(n => n.type === 'controller' || n.type === 'middleware').forEach(addNode);
  // Priority d) fill remaining slots by importance
  nodes.slice().sort((a, b) => b.importance - a.importance).forEach(addNode);

  const totalSelected = selectedNodes.length;
  console.log(`[Orchestrator] Selected ${totalSelected} files for AI summarization`);
  selectedNodes.forEach(node => {
    console.log(`[Orchestrator] → ${node.label} (importance: ${node.importance}, type: ${node.type})`);
  });

  // Step 3 — Build a lookup map
  const scannedFileMap = new Map();
  for (const file of scannedFiles) {
    scannedFileMap.set(file.id, file);
  }

  // Step 4 — Process in batches
  const summaryMap = new Map();
  const totalBatches = Math.ceil(totalSelected / batchSize);
  
  let currentIndex = 1;

  for (let i = 0; i < totalSelected; i += batchSize) {
    const batch = selectedNodes.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`[Orchestrator] Processing batch ${batchNum}/${totalBatches}`);

    // Process each batch in parallel (safe with local Ollama)
    const results = await Promise.allSettled(
      batch.map(async (node) => {
        const scannedFile = scannedFileMap.get(node.id)
        if (!scannedFile) return { nodeId: node.id, summary: null }
        console.log(`[Orchestrator] Processing ${node.label} (${node.type}, importance: ${node.importance})`)
        const summary = await aiService.summarizeFile(scannedFile)
        return { nodeId: node.id, summary }
      })
    )

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value?.summary) {
        summaryMap.set(result.value.nodeId, result.value.summary)
      }
    })

    console.log(`[Orchestrator] Batch ${batchNum}/${totalBatches} complete`);

    // Wait 500ms between batches to avoid overloading the local machine slightly
    if (batchNum < totalBatches) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Step 5 — Merge summaries back into nodes
  const updatedNodes = nodes.map(node => ({
    ...node,
    summary: summaryMap.get(node.id) || node.summary,
    summaryType: summaryMap.has(node.id) ? 'ai' : 'placeholder'
  }));

  // Step 6 — Log completion stats
  const aiCount = updatedNodes.filter(n => n.summaryType === 'ai').length;
  const placeholderCount = updatedNodes.length - aiCount;
  console.log(`[Orchestrator] Summarization complete: ${aiCount} AI, ${placeholderCount} placeholder`);
  
  const stats = summaryCache.getStats();
  console.log(`[Orchestrator] Cache stats: ${stats.hits} hits, ${stats.misses} misses, ${stats.size} cached`);

  return updatedNodes;
}

module.exports = { generateSummaries };

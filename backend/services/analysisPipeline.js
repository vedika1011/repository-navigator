// analysisPipeline.js — Orchestrates the complete end-to-end repository analysis process.

const gitService = require('./gitService');
const fileScanner = require('./fileScanner');
const graphBuilder = require('./graphBuilder');
const summaryOrchestrator = require('./summaryOrchestrator');

/**
 * Custom error class for pipeline failures.
 */
class PipelineError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PipelineError';
    this.code = code;
  }
}

/**
 * Runs the complete analysis pipeline for a given repository URL.
 * 
 * @param {string} repoUrl - The GitHub repository URL to analyze
 * @returns {Promise<Object>} An object containing the raw graph data and metadata
 * @throws {PipelineError} If cloning fails, no files are found, etc.
 */
async function runAnalysis(repoUrl) {
  const startTime = Date.now();
  console.log(`[Pipeline] Starting analysis for ${repoUrl}`);

  // 1. Clone Repo
  let cloneResult;
  try {
    const cloneStart = Date.now();
    cloneResult = await gitService.cloneRepo(repoUrl);
    const cloneDurationMs = Date.now() - cloneStart;
    console.log(`[Pipeline] ✓ Clone complete in ${cloneDurationMs}ms`);
  } catch (error) {
    throw new PipelineError('CLONE_FAILED', `Failed to clone repository: ${error.message}`);
  }
  const { owner, repo, clonedPath } = cloneResult;

  // 2. Scan Files
  let scannedFiles;
  try {
    const scanStart = Date.now();
    scannedFiles = await fileScanner.scanRepository(clonedPath);
    const scanDurationMs = Date.now() - scanStart;
    console.log(`[Pipeline] ✓ Scan complete in ${scanDurationMs}ms (${scannedFiles.length} files)`);
  } catch (error) {
    throw new PipelineError('SCAN_FAILED', `Failed to scan repository files: ${error.message}`);
  }

  if (scannedFiles.length === 0) {
    throw new PipelineError('NO_SOURCE_FILES', 'No supported source files found in this repository. RepoNav supports JavaScript, TypeScript, Python, Java, Go, Rust, Ruby, PHP, C, C++, C#, Swift, Kotlin, Scala, Shell, Vue, and Svelte files.');
  }

  // 3. Build Graph
  let rawGraph;
  try {
    const buildStart = Date.now();
    rawGraph = await graphBuilder.buildGraph(scannedFiles, owner, repo);
    const graphDurationMs = Date.now() - buildStart;
    console.log(`[Pipeline] ✓ Graph built in ${graphDurationMs}ms`);
  } catch (error) {
    throw new PipelineError('GRAPH_BUILD_FAILED', `Failed to build dependency graph: ${error.message}`);
  }

  // 4. Summarize Graph Nodes
  const summarizeStart = Date.now();
  const AI_MAX_FILES = parseInt(process.env.AI_MAX_FILES || '10');
  const AI_BATCH_SIZE = parseInt(process.env.AI_BATCH_SIZE || '3');

  rawGraph.nodes = await summaryOrchestrator.generateSummaries(
    rawGraph.nodes,
    scannedFiles,
    AI_MAX_FILES,
    AI_BATCH_SIZE
  );
  const summarizeDurationMs = Date.now() - summarizeStart;
  console.log(`[Pipeline] ✓ Summaries (Ollama local AI) complete in ${summarizeDurationMs}ms`);

  const totalDurationMs = Date.now() - startTime;
  console.log(`[Pipeline] ✓ Analysis complete in ${totalDurationMs}ms`);

  return {
    rawGraph,
    meta: {
      owner,
      repo,
      clonedPath,
      analyzedAt: new Date().toISOString(),
      totalFiles: rawGraph.nodes.length,
      totalEdges: rawGraph.edges.length,
      totalDurationMs
    }
  };
}

module.exports = {
  runAnalysis,
  PipelineError
};

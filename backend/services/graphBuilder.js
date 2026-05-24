// graphBuilder.js — Orchestrates extraction and resolution to build the final dependency graph with timing logs.

const { extractImports } = require('./importExtractor.js');
const { resolveImport } = require('./pathResolver.js');
const { inferNodeType, inferImportance, generatePlaceholderSummary } = require('../utils/nodeHelpers.js');

/**
 * Builds a layered onboarding path: config → entry → middleware → shared → logic → fill.
 * Local function — not exported.
 */
function buildOnboardingPath(nodes, edges) {
  // Filter out test, example, fixture files from consideration
  const isTestOrExample = (nodeId) => {
    const p = nodeId.toLowerCase()
    return ['test/', 'tests/', 'spec/', '__tests__/', 'fixture/',
            'example/', 'examples/', 'demo/', 'mock/', 'mocks/',
            '.test.', '.spec.', '-test.', '-spec.']
      .some(s => p.includes(s))
  }

  // Only consider non-test, non-orphaned nodes for onboarding
  const eligibleNodes = nodes.filter(n => 
    !isTestOrExample(n.id) && !n.isOrphaned
  )

  // If filtering leaves fewer than 3 nodes, fall back to all non-orphaned
  const workingNodes = eligibleNodes.length >= 3 
    ? eligibleNodes 
    : nodes.filter(n => !n.isOrphaned)

  const path = []
  const addedIds = new Set()

  function addNode(node, reason) {
    if (!node || addedIds.has(node.id)) return
    addedIds.add(node.id)
    path.push({
      nodeId: node.id,
      order: path.length + 1,
      reason,
      type: node.type,
      label: node.label,
      importance: node.importance
    })
  }

  // LAYER 1 — Config (use workingNodes instead of nodes)
  const configNodes = workingNodes
    .filter(n => n.type === 'config')
    .sort((a, b) => b.importance - a.importance)
  configNodes.slice(0, 2).forEach(n =>
    addNode(n, 'Read configuration first — it defines how the entire application behaves.')
  )

  // LAYER 2 — Entry points
  const entryNodes = workingNodes
    .filter(n => n.type === 'entry')
    .sort((a, b) => b.importance - a.importance)
  entryNodes.slice(0, 2).forEach(n =>
    addNode(n, 'Application entry point — traces the startup sequence and bootstraps all services.')
  )

  // LAYER 3 — Middleware
  const middlewareNodes = workingNodes
    .filter(n => n.type === 'middleware' && n.importance >= 5)
    .sort((a, b) => b.importance - a.importance)
  middlewareNodes.slice(0, 2).forEach(n =>
    addNode(n, 'Core middleware — runs on every request and shapes the behavior of all routes.')
  )

  // LAYER 4 — Shared utilities/models
  const incomingCount = {}
  edges.forEach(e => {
    incomingCount[e.target] = (incomingCount[e.target] || 0) + 1
  })
  const sharedNodes = workingNodes
    .filter(n => (n.type === 'model' || n.type === 'utility') && !n.isOrphaned)
    .sort((a, b) => (incomingCount[b.id] || 0) - (incomingCount[a.id] || 0))
  sharedNodes.slice(0, 2).forEach(n => {
    const count = incomingCount[n.id] || 0
    addNode(n, `Shared ${n.type} imported by ${count} files — understanding this unlocks many other modules.`)
  })

  // LAYER 5 — Core controllers/routes
  const logicNodes = workingNodes
    .filter(n => (n.type === 'controller' || n.type === 'route') && n.importance >= 5)
    .sort((a, b) => b.importance - a.importance)
  logicNodes.slice(0, 3).forEach(n =>
    addNode(n, `Key ${n.type} — defines the primary operations and API surface of the application.`)
  )

  // LAYER 6 — Fill remaining
  const remaining = workingNodes
    .filter(n => !addedIds.has(n.id))
    .sort((a, b) => b.importance - a.importance)
  remaining.slice(0, Math.max(0, 8 - path.length)).forEach(n =>
    addNode(n, `Important file — ${n.label} has impact score ${n.importance}/10 in this codebase.`)
  )

  return path.map((item, i) => ({ ...item, order: i + 1 }))
}

/**
 * Builds the final dependency graph from scanned files by extracting imports and resolving dependencies.
 */
async function buildGraph(scannedFiles, owner, repo) {
  try {
    // Phase A — Build nodes
    const phaseAStart = Date.now();
    const nodeMap = new Map();
    for (const file of scannedFiles) {
      const node = {
        id: file.id,
        label: file.label,
        type: inferNodeType(file),
        summary: generatePlaceholderSummary(file),
        linesOfCode: file.linesOfCode,
        importance: inferImportance(file),
        isOrphaned: false,
        dependencyCount: 0,
        absolutePath: file.absolutePath,
      };
      nodeMap.set(file.id, node);
    }
    console.log(`[GraphBuilder] Phase A (Nodes built) complete in ${Date.now() - phaseAStart}ms`);

    // Phase B — Extract and resolve imports
    const phaseBStart = Date.now();
    const edges = [];
    const edgeSet = new Set(); // To track duplicates: format "sourceId->targetId"

    for (const file of scannedFiles) {
      const rawPaths = extractImports(file.absolutePath);
      for (const rawPath of rawPaths) {
        const targetId = resolveImport(rawPath, file, scannedFiles);
        
        if (!targetId) continue; // b. skip unresolved
        if (targetId === file.id) continue; // c. skip self-import

        const edgeKey = `${file.id}->${targetId}`;
        if (edgeSet.has(edgeKey)) continue; // d. skip duplicate

        // e. valid new edge
        edgeSet.add(edgeKey);
        edges.push({
          id: `edge-${edges.length}`,
          source: file.id,
          target: targetId,
          type: "imports"
        });
      }
    }
    console.log(`[GraphBuilder] Phase B (Edges extracted: ${edges.length}) complete in ${Date.now() - phaseBStart}ms`);

    // Phase C — Compute derived node properties
    const phaseCStart = Date.now();
    
    // Map edges to target incoming counts
    const incomingEdgeCounts = new Map();
    for (const edge of edges) {
      const currentSourceCount = nodeMap.get(edge.source).dependencyCount || 0;
      nodeMap.get(edge.source).dependencyCount = currentSourceCount + 1;

      const currentTargetCount = incomingEdgeCounts.get(edge.target) || 0;
      incomingEdgeCounts.set(edge.target, currentTargetCount + 1);
    }

    let orphanCount = 0;
    for (const node of nodeMap.values()) {
      const incoming = incomingEdgeCounts.get(node.id) || 0;
      const outgoing = node.dependencyCount;

      if (incoming === 0 && outgoing === 0 && node.type !== 'entry') {
        node.isOrphaned = true;
        orphanCount++;
      }
    }

    // Phase D — Recalculate importance with edge data
    for (const node of nodeMap.values()) {
      const incomingEdges = incomingEdgeCounts.get(node.id) || 0;
      
      if (incomingEdges >= 5) node.importance += 2;
      else if (incomingEdges >= 2) node.importance += 1;
      else if (incomingEdges === 0 && node.type !== 'entry') node.importance -= 1;

      // Clamp between 1 and 10
      if (node.importance > 10) node.importance = 10;
      if (node.importance < 1) node.importance = 1;
    }

    // Phase E — Build onboardingPath (layered algorithm)
    const onboardingPath = buildOnboardingPath(
      Array.from(nodeMap.values()),
      edges
    );
    console.log(`[GraphBuilder] Phase E (Onboarding path: ${onboardingPath.length} steps) complete`);

    // Phase F — Build warnings
    const warnings = [];
    
    // 1. Orphaned modules
    const isTestOrExample = (nodeId) => 
      ['example','test','spec','fixture','demo','__tests__']
      .some(dir => nodeId.includes(dir));

    const orphanedNodes = Array.from(nodeMap.values()).filter(n => n.isOrphaned);
    const realOrphans = orphanedNodes.filter(n => !isTestOrExample(n.id));
    const warningsToShow = realOrphans.slice(0, 5);

    warningsToShow.forEach(node => {
      warnings.push({
        type: 'orphaned_module',
        nodeId: node.id, 
        message: `${node.label} has no detected imports. It may use dynamic require() or be loaded by a build tool.`
      });
    });

    if (realOrphans.length > 5) {
      warnings.push({
        type: 'orphaned_modules',
        nodeId: null,
        message: `${realOrphans.length} files have no detected static imports. Common in repos using dynamic loading patterns.`
      });
    }
    
    // 2. High coupling
    for (const node of nodeMap.values()) {
      if (node.dependencyCount >= 8) {
        warnings.push({
          type: "high_coupling",
          nodeId: node.id,
          message: `${node.label} imports ${node.dependencyCount} other files. Consider splitting it.`
        });
      }
    }
    
    // 3. Large repo
    if (scannedFiles.length > 100) {
      warnings.push({
        type: "large_repo",
        nodeId: null,
        message: `Large repository (${scannedFiles.length} files). Some imports may be unresolved.`
      });
    }

    // Cap warnings at 10 total
    const finalWarnings = warnings.slice(0, 10);
    console.log(`[GraphBuilder] Phase C/D/E/F (Properties/Warnings) complete in ${Date.now() - phaseCStart}ms`);

    // Phase G — Return final graph
    console.log(`[GraphBuilder] Graph complete: ${nodeMap.size} nodes, ${edges.length} edges, ${orphanCount} orphans`);

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
      onboardingPath,
      warnings: finalWarnings
    };

  } catch (error) {
    console.log(`[GraphBuilder] Error building graph: ${error.message}`);
    throw error; // Rethrow to let the pipeline handle it
  }
}

module.exports = { buildGraph };

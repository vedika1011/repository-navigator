// responseBuilder.js — Validates, sanitizes, and enforces size constraints on the final response.

/**
 * Builds the final JSON response payload, enforcing a maximum node count.
 * Nodes exceeding the limit are truncated starting with the lowest importance.
 * 
 * @param {Object} rawGraph - The raw graph object from graphBuilder (nodes, edges, onboardingPath, warnings)
 * @param {Object} meta - Metadata about the analysis (owner, repo, totalFiles, etc.)
 * @returns {Object} The finalized, safe response object ready to be serialized to JSON
 */
function buildResponse(rawGraph, meta, repoOverview, architectureDomains) {
  const MAX_NODES = 500;
  
  let finalNodes = [...rawGraph.nodes];
  let finalEdges = [...rawGraph.edges];
  let finalWarnings = [...rawGraph.warnings];
  
  // Size Guard: Truncate if too many nodes
  if (finalNodes.length > MAX_NODES) {
    console.log(`[ResponseBuilder] Truncating graph from ${finalNodes.length} to ${MAX_NODES} nodes.`);
    
    // Sort ascending by importance (weakest first)
    finalNodes.sort((a, b) => a.importance - b.importance);
    
    // Remove the weakest nodes until we hit the limit
    const nodesToRemove = finalNodes.length - MAX_NODES;
    const removedNodeIds = new Set();
    
    for (let i = 0; i < nodesToRemove; i++) {
      removedNodeIds.add(finalNodes[i].id);
    }
    
    // Keep only the top MAX_NODES nodes
    finalNodes = finalNodes.slice(nodesToRemove);
    
    // Remove any edges connected to removed nodes
    finalEdges = finalEdges.filter(edge => 
      !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target)
    );
    
    // Add a warning about truncation
    finalWarnings.push({
      type: "graph_truncated",
      nodeId: null,
      message: `Repository is very large. Displaying the top ${MAX_NODES} most important files.`
    });
  }

  // Double check that every edge points to a valid remaining node
  const validNodeIds = new Set(finalNodes.map(n => n.id));
  finalEdges = finalEdges.filter(edge => validNodeIds.has(edge.source) && validNodeIds.has(edge.target));

  // Node Sanitization
  finalNodes = finalNodes.map(node => ({
    id: node.id,
    label: node.label,
    type: node.type,
    summary: node.summary,
    summaryType: node.summaryType || 'placeholder',
    linesOfCode: node.linesOfCode,
    importance: node.importance,
    isOrphaned: node.isOrphaned,
    dependencyCount: node.dependencyCount,
    absolutePath: typeof node.absolutePath === 'string' ? node.absolutePath : ''
  }));

  // Update meta stats based on final graph size
  const finalMeta = {
    ...meta,
    totalFiles: finalNodes.length,
    totalEdges: finalEdges.length
  };

  console.log(`[ResponseBuilder] Final response size: ${finalNodes.length} nodes, ${finalEdges.length} edges.`);

  return {
    success: true,
    meta: finalMeta,
    graph: {
      nodes: finalNodes,
      edges: finalEdges
    },
    onboardingPath: rawGraph.onboardingPath,
    warnings: finalWarnings,
    repoOverview: repoOverview || null,
    architectureDomains: architectureDomains || []
  };
}

module.exports = { buildResponse };

// graphUtils.js — Transforms raw API graph data into React Flow nodes/edges with layout logic.

import { MarkerType } from "@xyflow/react";
import dagre from "dagre";
import { getNodeDimensions } from "./importanceUtils.js";

/** Border/handle color for each node type */
export const NODE_COLORS = {
  entry: "#a78bfa",
  route: "#7ee787",
  controller: "#d2a8ff",
  middleware: "#ffa657",
  model: "#f78166",
  utility: "#8b949e",
  config: "#79c0ff",
};

/** Stroke color for each edge type */
export const EDGE_COLORS = {
  imports: "#a78bfa",
  calls: "#d2a8ff",
  extends: "#7ee787",
};

function getEdgeColor(edgeType) {
  const EDGE_COLORS = {
    imports: '#a78bfa',   // violet — matches new accent
    calls:   '#d2a8ff',   // purple
    extends: '#7ee787',   // green
  }
  return EDGE_COLORS[edgeType] || '#a78bfa'
}

/**
 * Runs dagre layout on React Flow nodes and edges.
 */
function applyDagreLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  
  g.setGraph({ 
    rankdir: 'TB',
    nodesep: 90,
    ranksep: 130,
    marginx: 60,
    marginy: 60
  });

  nodes.forEach((node) => {
    const importance = node.data?.importance || 5;
    const dims = getNodeDimensions(importance);
    g.setNode(node.id, { 
      width: dims.width + 20,
      height: dims.height + 16
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const importance = node.data?.importance || 5;
    const dims = getNodeDimensions(importance);
    return {
      ...node,
      position: {
        x: dagreNode.x - dims.width / 2,
        y: dagreNode.y - dims.height / 2,
      },
    };
  });

  return layoutedNodes;
}

/**
 * Applies a simple grid layout grouped by node type.
 * Used when there are zero edges to prevent the graph from collapsing into a single vertical column.
 */
export function applyGridLayout(nodes) {
  const COLUMNS = nodes.length > 30 ? 6 : nodes.length > 15 ? 5 : 4;
  const GRID_NODE_WIDTH = 260 + 60; // max node width + gap
  const GRID_NODE_HEIGHT = 88 + 50; // max node height + gap
  const H_GAP = nodes.length > 20 ? 40 : 60;
  const V_GAP = nodes.length > 20 ? 35 : 50;

  const typePriority = {
    entry: 0,
    config: 1,
    middleware: 2,
    controller: 3,
    route: 4,
    model: 5,
    utility: 6,
  };

  // Sort nodes
  const sortedNodes = [...nodes].sort((a, b) => {
    const pA = typePriority[a.data.type] ?? 99;
    const pB = typePriority[b.data.type] ?? 99;
    if (pA !== pB) return pA - pB;
    if (b.data.importance !== a.data.importance) {
      return b.data.importance - a.data.importance;
    }
    return a.data.label.localeCompare(b.data.label);
  });

  let currentType = null;
  let typeYOffset = 0;

  return sortedNodes.map((node, index) => {
    if (currentType !== null && node.data.type !== currentType) {
      if (index % COLUMNS === 0) {
        typeYOffset += 40;
      }
    }
    currentType = node.data.type;

    const x = (index % COLUMNS) * (GRID_NODE_WIDTH + H_GAP);
    const y = Math.floor(index / COLUMNS) * (GRID_NODE_HEIGHT + V_GAP) + typeYOffset;

    return {
      ...node,
      position: { x, y }
    };
  });
}

/**
 * Transforms the raw API graph object into React Flow compatible nodes and edges.
 * @param {{ nodes: Array, edges: Array }} apiGraph - The graph field from the API response
 * @returns {{ nodes: Array, edges: Array }} React Flow formatted and layouted data
 */
export function transformGraphData(apiGraph) {
  // Map API nodes to React Flow nodes
  const rfNodes = apiGraph.nodes.map((node) => ({
    id: node.id,
    type: "customNode",
    position: { x: 0, y: 0 },
    data: {
      label: node.label,
      type: node.type,
      summary: node.summary,
      linesOfCode: node.linesOfCode,
      importance: node.importance,
      isOrphaned: node.isOrphaned,
      dependencyCount: node.dependencyCount,
      extension: node.id.split('.').pop()
    },
    style: { opacity: 1, transition: 'opacity 200ms ease' }
  }));

  // Map API edges to React Flow edges
  const rfEdges = apiGraph.edges.map((edge) => {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      style: {
        stroke: getEdgeColor(edge.type),
        strokeWidth: 2,
        strokeOpacity: 0.6,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: getEdgeColor(edge.type),
        width: 16,
        height: 16,
      },
      animated: false,
    };
  });

  // Choose layout based on edges
  const layoutedNodes = rfEdges.length < 2 
    ? applyGridLayout(rfNodes) 
    : applyDagreLayout(rfNodes, rfEdges);

  return { nodes: layoutedNodes, edges: rfEdges };
}

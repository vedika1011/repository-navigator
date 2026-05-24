// GraphView.jsx — Interactive dependency graph with dagre layout, inspection sidebar, heatmap mode, and onboarding walkthrough.

import { useMemo, useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";
import { transformGraphData, NODE_COLORS } from "../utils/graphUtils.js";
import CustomNode from "./CustomNode.jsx";
import InspectionSidebar from "./InspectionSidebar.jsx";
import useSidebar from "../hooks/useSidebar.js";
import ImportanceLegend from "./ImportanceLegend.jsx";
import { getHeatmapColor } from "../utils/importanceUtils.js";
import useOnboarding from "../hooks/useOnboarding.js";
import OnboardingPanel from "./OnboardingPanel.jsx";
import useQuery from '../hooks/useQuery.js'
import QueryBar from './QueryBar.jsx'
import QueryResultsPanel from './QueryResultsPanel.jsx'

// nodeTypes must be defined outside the component to prevent React Flow remount bugs
const nodeTypes = { customNode: CustomNode };

function detectRepoType(nodes, edges) {
  if (!nodes || nodes.length === 0) return 'empty';
  if (edges.length === 0) {
    const allUtility = nodes.every(n => n.type === 'utility');
    if (allUtility) return 'static';
    return 'disconnected';
  }
  return 'normal';
}

// Helper: uses useReactFlow to pan to active node (must be inside ReactFlow context)
function AutoPanner({ activeNodeId, nodes, isActive }) {
  const { setCenter } = useReactFlow();

  useEffect(() => {
    if (!isActive || !activeNodeId) return;
    const node = nodes.find(n => n.id === activeNodeId);
    if (!node?.position) return;
    setCenter(
      node.position.x + 110,
      node.position.y + 44,
      { zoom: 1.2, duration: 600 }
    );
  }, [activeNodeId, isActive]);

  return null;
}

function GraphView({ graphData }) {
  const [heatmapMode, setHeatmapMode] = useState(false);

  const repoType = graphData
    ? detectRepoType(graphData.graph.nodes, graphData.graph.edges)
    : null;

  const query = useQuery(graphData)

  // Onboarding state
  const onboarding = useOnboarding(graphData?.onboardingPath || []);

  // Transform API data into React Flow format with dagre layout — memoized for performance
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => transformGraphData(graphData.graph),
    [graphData]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sidebar state — decoupled from React Flow's internal node objects
  const { selectedNode, isSidebarOpen, selectNode, closeSidebar } =
    useSidebar(graphData);

  // Propagate heatmapMode to all nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          heatmapMode,
        },
      }))
    );
  }, [heatmapMode, setNodes]);

  // Onboarding mode: highlight current step node, dim all others
  useEffect(() => {
    if (!onboarding.isOnboardingActive) {
      // Reset all nodes to full opacity when exiting onboarding
      setNodes(nds => nds.map(n => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
          transition: 'opacity 300ms ease',
          filter: 'none',
        }
      })));
      return;
    }

    const activeNodeId = onboarding.currentStep?.nodeId;
    setNodes(nds => nds.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: n.id === activeNodeId ? 1 : 0.2,
        transition: 'opacity 300ms ease',
        filter: n.id === activeNodeId
          ? 'brightness(1.3) drop-shadow(0 0 8px rgba(126,231,135,0.6))'
          : 'none',
      }
    })));
  }, [onboarding.isOnboardingActive, onboarding.currentStepIndex, setNodes]);

  // Query mode overrides onboarding mode
  useEffect(() => {
    console.log('[GraphView] Query mode effect fired')
    console.log('[GraphView] isQueryMode:', query.isQueryMode)
    console.log('[GraphView] matchedNodeIds:', query.matchedNodeIds)
    console.log('[GraphView] nodes count:', nodes.length)

    if (query.isQueryMode && query.matchedNodeIds) {
      console.log('[GraphView] Applying query highlights...')
      console.log('[GraphView] Sample node IDs in graph:', nodes.slice(0, 3).map(n => n.id))
      console.log('[GraphView] Sample matched IDs:', [...(query.matchedNodeIds || [])].slice(0, 3))

      setNodes(nds => {
        const updated = nds.map(n => ({
          ...n,
          style: {
            ...n.style,
            opacity: query.matchedNodeIds.has(n.id) ? 1 : 0.15,
            transition: 'opacity 300ms ease',
            filter: query.matchedNodeIds.has(n.id)
              ? 'drop-shadow(0 0 8px rgba(167,139,250,0.7)) brightness(1.2)'
              : 'none',
          }
        }))
        console.log('[GraphView] Highlighted nodes:', updated.filter(n => n.style.opacity === 1).map(n => n.id))
        return updated
      })
      return
    }

    // Reset when query is cleared
    if (!query.isQueryMode && !onboarding.isOnboardingActive) {
      console.log('[GraphView] Resetting node styles')
      setNodes(nds => nds.map(n => ({
        ...n,
        style: { ...n.style, opacity: 1, filter: 'none' }
      })))
    }
  }, [
    query.isQueryMode,
    query.matchedNodeIds,
    query.queryResults,
    onboarding.isOnboardingActive,
    setNodes
  ])


  const handleNodeClick = useCallback(
    (_event, node) => {
      // If onboarding is active, clicking a node shouldn't open sidebar
      if (onboarding.isOnboardingActive) return;
      selectNode(node.id);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: {
            ...n.style,
            opacity: n.id === node.id ? 1 : 0.35,
            transition: "opacity 200ms ease",
          },
        }))
      );
    },
    [selectNode, setNodes, onboarding.isOnboardingActive]
  );

  const handleCloseSidebar = useCallback(() => {
    closeSidebar();
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: { ...n.style, opacity: 1, filter: 'none' },
      }))
    );
  }, [closeSidebar, setNodes]);

  // MiniMap node coloring function
  const miniMapNodeColor = useCallback((node) => {
    if (heatmapMode) {
      return getHeatmapColor(node.data?.importance || 5);
    }
    return NODE_COLORS[node.data?.type] || "#8b949e";
  }, [heatmapMode]);

  const hasOnboardingPath = graphData?.onboardingPath?.length > 0;
  const showOnboardingButton = hasOnboardingPath && repoType === 'normal';

  return (
    <div>
      {/* Controls row: onboarding button (left), file count + heatmap (right) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        {/* Left side — Onboarding button */}
        <div>
          {showOnboardingButton && (
            <button
              onClick={onboarding.isOnboardingActive
                ? onboarding.stopOnboarding
                : onboarding.startOnboarding
              }
              style={{
                background: onboarding.isOnboardingActive
                  ? 'rgba(126,231,135,0.15)'
                  : 'rgba(126,231,135,0.08)',
                border: onboarding.isOnboardingActive
                  ? '1px solid #7ee787'
                  : '1px solid rgba(126,231,135,0.3)',
                color: '#7ee787',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                padding: '4px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              {onboarding.isOnboardingActive ? '■ Exit Onboarding' : '▶ Start Onboarding'}
            </button>
          )}
        </div>

        {/* Right side — file count + heatmap */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            {edges.length === 0 ? (
              <span>{nodes.length} files · no dependencies detected</span>
            ) : (
              <span>
                {nodes.length} files · {edges.length} dependencies
              </span>
            )}
          </div>
          
          <button
            onClick={() => setHeatmapMode((prev) => !prev)}
            style={{
              background: heatmapMode ? "rgba(88,166,255,0.1)" : "var(--bg-surface)",
              border: heatmapMode ? "1px solid #58a6ff" : "1px solid var(--border)",
              color: heatmapMode ? "#58a6ff" : "var(--text-muted)",
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
          >
            {heatmapMode ? "◑ Heatmap" : "◐ Heatmap"}
          </button>
        </div>
      </div>

      {/* Query bar — shown when graph is ready */}
      <QueryBar
        queryText={query.queryText}
        setQueryText={query.setQueryText}
        onSubmit={query.submitQuery}
        onClear={query.clearQuery}
        isQuerying={query.isQuerying}
        queryError={query.queryError}
        isQueryMode={query.isQueryMode}
        resultCount={query.queryResults?.matches?.length || 0}
      />

      {/* Query results panel */}
      {query.queryResults && query.queryResults.matches && (
        <QueryResultsPanel
          queryResults={query.queryResults}
          onNodeSelect={(nodeId) => {
            selectNode(nodeId)
            query.clearQuery()
            // Find node position and pan to it
            const targetNode = nodes.find(n => n.id === nodeId)
            if (targetNode?.position) {
              // AutoPanner will handle this via the selectedNode
            }
          }}
          onClose={query.clearQuery}
        />
      )}

      {/* Graph container — position:relative so sidebar can overlay */}
      <div
        style={{
          position: "relative",
          height: "calc(100vh - 280px)",
          minHeight: 500,
          maxHeight: 900,
          background: "#090c10",
          border: "1px solid #21262d",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={handleCloseSidebar}
          fitView
          fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.65 }}
          minZoom={0.15}
          maxZoom={2}
          defaultEdgeOptions={{ type: "default" }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant="dots" gap={24} size={1} color="#3d444d" />
          
          <Controls
            style={{
              button: {
                backgroundColor: "#161b22",
                border: "1px solid #21262d",
                color: "#e6edf3",
              },
            }}
          />
          
          <MiniMap
            nodeColor={miniMapNodeColor}
            style={{
              background: "#0f1318",
              border: "1px solid #21262d",
              borderRadius: 8,
            }}
            maskColor="rgba(9,12,16,0.7)"
          />

          {(repoType === 'static' || repoType === 'disconnected') && (
            <Panel position="top-center">
              <div style={{
                background: 'rgba(15,19,24,0.95)',
                border: '1px solid rgba(210,153,34,0.4)',
                borderRadius: '8px',
                padding: '10px 18px',
                fontFamily: "'DM Mono', monospace",
                fontSize: '12px',
                color: '#d29922',
                backdropFilter: 'blur(8px)',
                maxWidth: '480px',
                textAlign: 'center',
                lineHeight: 1.5,
                marginTop: '12px',
              }}>
                ⚠ No import connections detected.
                {repoType === 'static'
                  ? ' This appears to be a static website or non-modular project. RepoNav works best with projects that use explicit import statements. Supports JS, TS, Python, Java, Go, Rust, Ruby, PHP, C/C++, Swift, Kotlin, Vue and more.'
                  : ' Files were found but no import relationships could be extracted. The project may use dynamic imports or a non-standard module pattern.'}
              </div>
            </Panel>
          )}

          {/* AutoPanner — must be child of ReactFlow for useReactFlow hook access */}
          <AutoPanner
            activeNodeId={onboarding.currentStep?.nodeId}
            nodes={nodes}
            isActive={onboarding.isOnboardingActive}
          />
        </ReactFlow>

        {/* Inspection sidebar — overlays the graph */}
        <InspectionSidebar
          node={selectedNode}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          onNavigate={(nodeId) => {
             selectNode(nodeId);
             // When navigating from sidebar, also update opacity highlight
             setNodes((nds) =>
               nds.map((n) => ({
                 ...n,
                 style: {
                   ...n.style,
                   opacity: n.id === nodeId ? 1 : 0.35,
                 },
               }))
             );
          }}
          graphData={graphData}
        />
      </div>

      {/* Legend */}
      <ImportanceLegend heatmapMode={heatmapMode} />

      {/* Onboarding Panel — slides up from bottom */}
      <OnboardingPanel
        onboardingPath={graphData?.onboardingPath || []}
        currentStepIndex={onboarding.currentStepIndex}
        isActive={onboarding.isOnboardingActive}
        onClose={onboarding.stopOnboarding}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onGoToStep={onboarding.goToStep}
        isFirstStep={onboarding.isFirstStep}
        isLastStep={onboarding.isLastStep}
        progressPercent={onboarding.progressPercent}
        graphData={graphData}
      />
    </div>
  );
}

export default GraphView;

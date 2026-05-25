// GraphView.jsx — Interactive dependency graph with dagre layout, inspection sidebar, heatmap mode, and onboarding walkthrough.

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
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
  const { setCenter, getNodes } = useReactFlow();

  useEffect(() => {
    if (!isActive || !activeNodeId) return;

    // Small delay to ensure React Flow has updated positions
    const timer = setTimeout(() => {
      const rfNodes = getNodes();
      const target = rfNodes.find(n => n.id === activeNodeId);
      if (!target?.position) {
        console.warn('[AutoPanner] Node has no position:', activeNodeId);
        return;
      }

      console.log('[AutoPanner] Panning to:', activeNodeId, 'position:', target.position);

      const width = target.width || 220;
      const height = target.height || 80;

      setCenter(
        target.position.x + width / 2,
        target.position.y + height / 2,
        { zoom: 1.1, duration: 700 }
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [activeNodeId, isActive, getNodes, setCenter]);

  return null;
}

function FocusController({ onRegisterFocus }) {
  const { setCenter, getNodes } = useReactFlow();

  useEffect(() => {
    // Register the focus function so GraphView can call it
    onRegisterFocus((nodeId) => {
      const rfNodes = getNodes();
      const target = rfNodes.find(n => n.id === nodeId);
      if (!target?.position) return;
      setCenter(
        target.position.x + (target.width || 220) / 2,
        target.position.y + (target.height || 80) / 2,
        { zoom: 1.2, duration: 500 }
      );
    });
  }, [getNodes, setCenter, onRegisterFocus]);

  return null;
}

function GraphView({ graphData }) {
  const [heatmapMode, setHeatmapMode] = useState(false);

  const focusFnRef = useRef(null);
  const handleRegisterFocus = useCallback((fn) => {
    focusFnRef.current = fn;
  }, []);

  const handleFocusNode = useCallback((nodeId) => {
    if (focusFnRef.current) focusFnRef.current(nodeId);
  }, []);

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
        opacity: n.id === activeNodeId ? 1 : 0.25,
        transition: 'opacity 300ms ease',
        filter: n.id === activeNodeId
          ? 'brightness(1.4) drop-shadow(0 0 16px rgba(126,231,135,0.8)) drop-shadow(0 0 32px rgba(126,231,135,0.3))'
          : 'grayscale(0.5) brightness(0.5)',
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
                : () => onboarding.startOnboarding(graphData?.graph?.nodes || [])
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            <span style={{
              background: 'rgba(167,139,250,0.1)',
              border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: 4,
              padding: '1px 7px',
              color: 'var(--accent)',
              fontSize: 11,
            }}>
              {nodes.length} files
            </span>
            {edges.length > 0 && (
              <>
                <span style={{ color: 'var(--text-faint)' }}>·</span>
                <span style={{
                  background: 'rgba(126,231,135,0.08)',
                  border: '1px solid rgba(126,231,135,0.2)',
                  borderRadius: 4,
                  padding: '1px 7px',
                  color: '#7ee787',
                  fontSize: 11,
                }}>
                  {edges.length} dependencies
                </span>
              </>
            )}
            {edges.length === 0 && (
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                no dependencies detected
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
          height: "calc(100vh - 180px)",
          minHeight: 600,
          maxHeight: 1200,
          background: "transparent",
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
          fitViewOptions={{ padding: 0.25, includeHiddenNodes: false }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.15}
          maxZoom={2}
          defaultEdgeOptions={{ type: "default" }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant="lines"
            gap={40}
            size={1}
            color="rgba(255,255,255,0.03)"
          />
          
          <Controls
            showInteractive={false}
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          />
          
          <MiniMap
            nodeColor={miniMapNodeColor}
            style={{
              background: '#0d1117',
              border: '1px solid #21262d',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            maskColor="rgba(9,12,16,0.8)"
            nodeStrokeWidth={2}
            pannable
            zoomable
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
          <FocusController onRegisterFocus={handleRegisterFocus} />
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
        summaries={onboarding.summaries}
        loadingSummaries={onboarding.loadingSummaries}
        onFocusNode={handleFocusNode}
      />
    </div>
  );
}

export default GraphView;

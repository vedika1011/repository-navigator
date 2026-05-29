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
import DomainSidebar from './DomainSidebar.jsx'
import DomainDetailCard from './DomainDetailCard.jsx'
import useDomain from '../hooks/useDomain.js'

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

// Defined OUTSIDE GraphView (prevents remount on re-render)
function AutoPanner({ activeNodeId, isActive, nodes }) {
  const { setCenter } = useReactFlow()
  const prevNodeIdRef = useRef(null)

  useEffect(() => {
    if (!isActive || !activeNodeId || !nodes || nodes.length === 0) return

    // Don't re-pan if same node
    if (prevNodeIdRef.current === activeNodeId) return

    const target = nodes.find(n => n.id === activeNodeId)

    if (!target) {
      console.warn('[AutoPanner] Node not found in nodes list:', activeNodeId)
      return
    }

    if (!target.position || typeof target.position.x !== 'number') {
      console.warn('[AutoPanner] Node has no position yet:', activeNodeId)
      return
    }

    // Get node center position deterministically based on importance score
    const importance = target.data?.importance || 5
    let nodeWidth = 210
    if (importance >= 9) nodeWidth = 250
    else if (importance >= 7) nodeWidth = 230
    else if (importance >= 5) nodeWidth = 210
    else if (importance >= 3) nodeWidth = 195
    else nodeWidth = 180

    const nodeHeight = 80 // Constant height

    const centerX = target.position.x + nodeWidth / 2
    // Offset centerY by +150px in graph space to push the node UP in viewport space,
    // ensuring it is fully visible above the bottom onboarding panel.
    const centerY = target.position.y + nodeHeight / 2 + 150

    console.log(`[AutoPanner] ✓ Panning to: ${activeNodeId} (offset by +150px)`, { centerX, centerY, nodeWidth, nodeHeight })

    setCenter(centerX, centerY, {
      zoom: 1.1,
      duration: 700,
    })

    prevNodeIdRef.current = activeNodeId
  }, [activeNodeId, isActive, nodes, setCenter])

  return null
}

function FocusController({ registerFn, nodes }) {
  const { setCenter } = useReactFlow()

  useEffect(() => {
    registerFn((nodeId) => {
      if (!nodes || nodes.length === 0) return
      const target = nodes.find(n => n.id === nodeId)

      if (!target?.position) return

      const importance = target.data?.importance || 5
      let nodeWidth = 210
      if (importance >= 9) nodeWidth = 250
      else if (importance >= 7) nodeWidth = 230
      else if (importance >= 5) nodeWidth = 210
      else if (importance >= 3) nodeWidth = 195
      else nodeWidth = 180

      const nodeHeight = 80

      // Offset centerY by +150px to push the node UP above the onboarding panel
      setCenter(
        target.position.x + nodeWidth / 2,
        target.position.y + nodeHeight / 2 + 150,
        { zoom: 1.1, duration: 500 }
      )
    })
  }, [nodes, setCenter, registerFn])

  return null
}

// Defined OUTSIDE GraphView function (prevents remount)
function DomainPanController({ onRegister, nodes }) {
  const { setCenter } = useReactFlow()

  useEffect(() => {
    onRegister((nodeIds) => {
      if (!nodeIds || nodeIds.length === 0 || !nodes || nodes.length === 0) return

      const targetNodes = nodes.filter(n =>
        nodeIds.includes(n.id)
      )

      if (targetNodes.length === 0) return

      // Filter nodes that have valid positions
      const positioned = targetNodes.filter(
        n => n.position && typeof n.position.x === 'number'
      )

      if (positioned.length === 0) return

      // Calculate weighted centroid and spread
      const { sumX, sumY, totalWeight, minX, maxX, minY, maxY } = positioned.reduce(
        (acc, n) => {
          const importance = n.data?.importance || 5
          let nodeWidth = 210
          if (importance >= 9) nodeWidth = 250
          else if (importance >= 7) nodeWidth = 230
          else if (importance >= 5) nodeWidth = 210
          else if (importance >= 3) nodeWidth = 195
          else nodeWidth = 180
          
          const centerX = n.position.x + nodeWidth / 2
          const centerY = n.position.y + 40
          
          // Weight calculation: importance^2 ensures highly important nodes dominate the center
          const weight = Math.pow(importance, 2)
          
          return {
            sumX: acc.sumX + (centerX * weight),
            sumY: acc.sumY + (centerY * weight),
            totalWeight: acc.totalWeight + weight,
            minX: Math.min(acc.minX, centerX),
            maxX: Math.max(acc.maxX, centerX),
            minY: Math.min(acc.minY, centerY),
            maxY: Math.max(acc.maxY, centerY)
          }
        },
        { sumX: 0, sumY: 0, totalWeight: 0, minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
      )

      const centerX = sumX / totalWeight
      const centerY = sumY / totalWeight
      
      const spread = Math.max(maxX - minX, maxY - minY)
      
      let zoom = 0.8
      if (spread > 2000) zoom = 0.4
      else if (spread > 1000) zoom = 0.6
      else if (spread < 200) zoom = 1.1

      console.log(
        `[DomainPan] Panning to centroid of ${positioned.length} nodes:`,
        { centerX, centerY, spread, zoom }
      )

      setCenter(centerX, centerY, {
        zoom,
        duration: 800,
      })
    })
  }, [nodes, setCenter, onRegister])

  return null
}

function FitOnLoad({ shouldFit }) {
  const { fitView } = useReactFlow()
  const hasFit = useRef(false)

  useEffect(() => {
    if (shouldFit && !hasFit.current) {
      hasFit.current = true
      // Longer delay for initial load — React Flow needs
      // time to calculate all node positions from dagre
      setTimeout(() => {
        fitView({
          padding: 0.12,
          duration: 800,
          maxZoom: 1.0,
          minZoom: 0.2,
        })
      }, 400)
    }
  }, [shouldFit, fitView])

  return null
}

function GraphView({ graphData, onboardingIndex, setOnboardingIndex }) {
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [showEdges, setShowEdges] = useState(true);
  const [showCrossDomainOnly, setShowCrossDomainOnly] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(true);

  const focusFnRef = useRef(null);
  const handleRegisterFocus = useCallback((fn) => {
    focusFnRef.current = fn;
  }, []);

  const handleFocusNode = useCallback((nodeId) => {
    if (focusFnRef.current) focusFnRef.current(nodeId);
  }, []);

  const panToDomainRef = useRef(null)

  const repoType = graphData
    ? detectRepoType(graphData.graph.nodes, graphData.graph.edges)
    : null;


  // Onboarding state
  const onboarding = useOnboarding(graphData?.onboardingPath || []);

  // Coordinate onboarding start and navigation from external clicks (ResultsPlaceholder)
  useEffect(() => {
    if (onboardingIndex !== null && onboardingIndex !== undefined) {
      if (!onboarding.isOnboardingActive) {
        onboarding.startOnboarding(graphData?.graph?.nodes || []);
      }
      onboarding.goToStep(onboardingIndex);
      // Reset shared index so subsequent clicks can be registered
      setOnboardingIndex(null);
    }
  }, [onboardingIndex, onboarding.isOnboardingActive, onboarding.startOnboarding, onboarding.goToStep, setOnboardingIndex, graphData]);

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

  const domain = useDomain(graphData?.architectureDomains)

  // Derive visible edges based on toggle
  const visibleEdges = useMemo(() => {
    if (!showEdges) return []
    if (showCrossDomainOnly && domain.isDomainActive) {
      // Only show edges crossing domain boundary
      return edges.filter(e =>
        domain.activeDomainNodeIds?.has(e.source) !==
        domain.activeDomainNodeIds?.has(e.target)
      )
    }
    return edges
  }, [edges, showEdges, showCrossDomainOnly, domain])

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

  // Effect 1: highlight nodes when step changes
  useEffect(() => {
    if (!onboarding.isOnboardingActive) {
      setNodes(nds => nds.map(n => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
          transition: 'opacity 300ms ease',
          filter: 'none',
        }
      })))
      return
    }

    const activeNodeId = onboarding.currentStep?.nodeId
    setNodes(nds => nds.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: n.id === activeNodeId ? 1 : 0.2,
        transition: 'opacity 300ms ease',
        filter: n.id === activeNodeId
          ? 'brightness(1.4) drop-shadow(0 0 16px rgba(126,231,135,0.8)) drop-shadow(0 0 32px rgba(126,231,135,0.3))'
          : 'grayscale(0.5) brightness(0.5)',
      }
    })))
  }, [
    onboarding.isOnboardingActive,
    onboarding.currentStepIndex,
  ])

  // Domain mode: highlight domain nodes, dim others
  useEffect(() => {
    if (domain.isDomainActive && domain.activeDomainNodeIds) {
      setNodes(nds => nds.map(n => ({
        ...n,
        style: {
          ...n.style,
          opacity: domain.activeDomainNodeIds.has(n.id)
            ? 1 : 0.12,
          transition: 'opacity 300ms ease',
          filter: domain.activeDomainNodeIds.has(n.id)
            ? 'brightness(1.15)' : 'none',
        }
      })))

      // Pan to domain centroid after brief delay
      // for React Flow to register style changes first
      setTimeout(() => {
        panToDomainRef.current?.(
          [...domain.activeDomainNodeIds]
        )
      }, 150)
      return
    }

    if (!domain.isDomainActive &&
        !onboarding.isOnboardingActive) {
      setNodes(nds => nds.map(n => ({
        ...n,
        style: { ...n.style, opacity: 1, filter: 'none' }
      })))
    }
  }, [domain.isDomainActive, domain.activeDomainNodeIds])

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

  const handleDomainSelect = useCallback((domainObj) => {
    // Clear other modes when selecting a domain
    if (domainObj) {
      if (onboarding.isOnboardingActive) {
        onboarding.stopOnboarding()
      }
      if (heatmapMode) setHeatmapMode(false)
      handleCloseSidebar()
    }
    domain.selectDomain(domainObj)
  }, [onboarding, heatmapMode, domain, handleCloseSidebar])

  // MiniMap node coloring function
  const miniMapNodeColor = useCallback((node) => {
    if (heatmapMode) {
      return getHeatmapColor(node.data?.importance || 5);
    }
    return NODE_COLORS[node.data?.type] || "#8b949e";
  }, [heatmapMode]);

  const hasOnboardingPath = graphData?.onboardingPath?.length > 0;
  const showOnboardingButton = hasOnboardingPath && repoType === 'normal';

  // Get most recently selected active domain for DetailCard rendering
  const lastActiveDomainId = Array.from(domain.activeDomains).pop()
  const activeDomain = graphData?.architectureDomains?.find(d => d.id === lastActiveDomainId) || null

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
                fontFamily: "var(--font-mono)",
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

        {/* Right side — file count + edges toggle + heatmap */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            <span style={{
              background: 'rgba(124, 106, 240, 0.1)',
              border: '1px solid rgba(124, 106, 240, 0.2)',
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
              <>
                <span style={{ color: 'var(--text-faint)' }}>·</span>
                <span style={{
                  background: 'rgba(210,153,34,0.08)',
                  border: '1px solid rgba(210,153,34,0.2)',
                  borderRadius: 4,
                  padding: '1px 7px',
                  color: '#d29922',
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <span>⚠</span> No dependencies detected
                </span>
              </>
            )}
          </div>
          
          <button
            onClick={() => setShowEdges(prev => !prev)}
            style={{
              background: showEdges
                ? 'var(--bg-surface)'
                : 'var(--accent-subtle)',
              border: `1px solid ${showEdges
                ? 'var(--border)'
                : 'var(--accent-border)'}`,
              borderRadius: 6,
              color: showEdges
                ? 'var(--text-muted)'
                : 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {showEdges ? '⌁ Hide Edges' : '⌁ Show Edges'}
          </button>

          <button
            onClick={() => setHeatmapMode((prev) => !prev)}
            style={{
              background: heatmapMode ? "rgba(88,166,255,0.1)" : "var(--bg-surface)",
              border: heatmapMode ? "1px solid #58a6ff" : "1px solid var(--border)",
              color: heatmapMode ? "#58a6ff" : "var(--text-muted)",
              fontFamily: "var(--font-mono)",
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


      {/* Domain detail card (when domain selected) */}
      {activeDomain && (
        <DomainDetailCard
          domain={activeDomain}
          onClear={domain.clearDomain}
        />
      )}

      {/* Main area: sidebar + graph */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          height: 'calc(100vh - 160px)',
          minHeight: 650,
          maxHeight: 1400,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        {/* Left: Domain Sidebar */}
        {graphData?.architectureDomains?.length > 0 && (
          <DomainSidebar
            domains={graphData.architectureDomains}
            activeDomains={domain.activeDomains}
            onDomainSelect={handleDomainSelect}
            onClear={domain.clearDomain}
            graphData={graphData}
          />
        )}

        {/* Right: Graph */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#0d1117',
            overflow: 'hidden',
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={visibleEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onPaneClick={handleCloseSidebar}
            defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
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

            {(repoType === 'static' || repoType === 'disconnected') && showWarningBanner && (
              <Panel position="top-right" style={{ margin: '20px 20px 0 0', zIndex: 10 }}>
                <div style={{
                  background: 'rgba(21, 27, 35, 0.95)',
                  border: '1px solid rgba(210, 153, 34, 0.4)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontFamily: "var(--font-body)",
                  fontSize: '11px',
                  color: '#d29922',
                  backdropFilter: 'blur(8px)',
                  maxWidth: '300px',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <strong style={{ fontFamily: "var(--font-heading)", fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      ⚠ No import connections detected
                    </strong>
                    {repoType === 'static'
                      ? 'This appears to be a static website or non-modular project. RepoNav works best with projects that use explicit import statements.'
                      : 'Files were found but no import relationships could be extracted. The project may use dynamic imports or a non-standard module pattern.'}
                  </div>
                  <button 
                    onClick={() => setShowWarningBanner(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-faint)',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '0 4px',
                      fontFamily: 'var(--font-heading)',
                      lineHeight: 1,
                      transition: 'color 200ms ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                  >
                    ×
                  </button>
                </div>
              </Panel>
            )}

            {/* AutoPanner — must be child of ReactFlow for useReactFlow hook access */}
            <AutoPanner
              activeNodeId={onboarding.currentStep?.nodeId}
              isActive={onboarding.isOnboardingActive}
              nodes={nodes}
            />
            <FocusController registerFn={handleRegisterFocus} nodes={nodes} />
            <DomainPanController 
              onRegister={(fn) => {
                panToDomainRef.current = fn
              }} 
              nodes={nodes}
            />
            <FitOnLoad shouldFit={Boolean(graphData)} />
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

// useSidebar.js — Custom hook managing sidebar open/close state, selected node, and keyboard shortcuts.

import { useState, useEffect, useCallback } from "react";

function useSidebar(graphData) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Select a node by its id — looks up the full node object from graphData
  const selectNode = useCallback(
    (nodeId) => {
      const node = graphData.graph.nodes.find((n) => n.id === nodeId);
      if (node) {
        // Wrap it in React Flow's shape so the sidebar always gets { id, data: {...} }
        setSelectedNode({ id: node.id, data: { ...node } });
        setIsSidebarOpen(true);
      }
    },
    [graphData]
  );

  // Close sidebar with a 300ms delay before clearing selectedNode
  // so the slide-out animation finishes before content blanks out
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    setTimeout(() => {
      setSelectedNode(null);
    }, 300);
  }, []);

  // Escape key closes the sidebar
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isSidebarOpen) {
        closeSidebar();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  return { selectedNode, isSidebarOpen, selectNode, closeSidebar };
}

export default useSidebar;

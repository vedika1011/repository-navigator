// NodeDetailPanel.jsx — Slide-in panel showing file details when a graph node is clicked.

import { NODE_COLORS } from "../utils/graphUtils.js";

function NodeDetailPanel({ node, onClose }) {
  const data = node.data;
  const typeColor = NODE_COLORS[data.type] || "#8b949e";

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: "#161b22",
        border: "1px solid #21262d",
        borderRadius: 12,
        padding: 24,
        overflowY: "auto",
        maxHeight: 600,
        animation: "slideInRight 250ms ease forwards",
      }}
    >
      {/* Close button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#8b949e",
            fontSize: 20,
            cursor: "pointer",
            padding: "0 4px",
            lineHeight: 1,
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e6edf3")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8b949e")}
        >
          ×
        </button>
      </div>

      {/* File name */}
      <h3
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "#58a6ff",
          margin: "0 0 10px 0",
          wordBreak: "break-word",
        }}
      >
        {data.label}
      </h3>

      {/* Type badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: typeColor,
            backgroundColor: "#0f1318",
            padding: "3px 10px",
            borderRadius: 6,
          }}
        >
          {data.type}
        </span>

        {data.isOrphaned && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: "#d29922",
              backgroundColor: "rgba(210, 169, 34, 0.12)",
              padding: "3px 10px",
              borderRadius: 6,
            }}
          >
            orphaned
          </span>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          backgroundColor: "#21262d",
          margin: "16px 0",
        }}
      />

      {/* Summary */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            color: "#e6edf3",
            margin: "0 0 6px 0",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          What this file does
        </p>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: "#8b949e",
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          {data.summary}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8 }}>
        {/* Lines of Code */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#0f1318",
            borderRadius: 8,
            padding: "10px 8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#e6edf3",
            }}
          >
            {data.linesOfCode}
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: "#3d444d",
              marginTop: 2,
              textTransform: "uppercase",
            }}
          >
            lines
          </div>
        </div>

        {/* Importance */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#0f1318",
            borderRadius: 8,
            padding: "10px 8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: data.importance >= 8 ? "#58a6ff" : "#e6edf3",
            }}
          >
            {data.importance}
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: "#3d444d",
              marginTop: 2,
              textTransform: "uppercase",
            }}
          >
            importance
          </div>
        </div>

        {/* Dependencies */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#0f1318",
            borderRadius: 8,
            padding: "10px 8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#e6edf3",
            }}
          >
            {data.dependencyCount}
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              color: "#3d444d",
              marginTop: 2,
              textTransform: "uppercase",
            }}
          >
            deps
          </div>
        </div>
      </div>
    </div>
  );
}

export default NodeDetailPanel;

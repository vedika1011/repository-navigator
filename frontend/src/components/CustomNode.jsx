// CustomNode.jsx — Styled dark card node for React Flow, colored by file type with handles for edge connections.

import { Handle, Position } from "@xyflow/react";
import { NODE_COLORS } from "../utils/graphUtils.js";
import {
  getNodeDimensions,
  getNodeBorderWidth,
  getNodeGlow,
  getNodeLabelSize,
  getImportanceTier,
  getImportanceBarWidth,
  getImportanceBarColor,
  getHeatmapColor
} from "../utils/importanceUtils.js";

function CustomNode({ data, selected }) {
  const isOrphaned = data.isOrphaned;
  const importance = data.importance || 5;

  const typeColor = NODE_COLORS[data.type] || "#8b949e";
  const borderColor = data.heatmapMode ? getHeatmapColor(importance) : typeColor;

  const dims = getNodeDimensions(importance);
  const bw = getNodeBorderWidth(importance);
  const glow = getNodeGlow(importance);
  const tier = getImportanceTier(importance);

  const borderStyle = isOrphaned ? "dashed" : "solid";
  const activeBorderColor = isOrphaned && !data.heatmapMode ? "#d29922" : borderColor;

  let finalBoxShadow = glow;
  if (selected) {
    const selectionRing = "0 0 0 2px var(--accent)";
    finalBoxShadow = glow && glow !== "none" ? `${glow}, ${selectionRing}` : selectionRing;
  }

  let badgeStyle = null;
  let badgeText = null;
  if (tier === "critical") {
    badgeStyle = { background: "rgba(247,129,102,0.15)", color: "#f78166" };
    badgeText = "● CRITICAL";
  } else if (tier === "high") {
    badgeStyle = { background: "rgba(167,139,250,0.1)", color: "#a78bfa" };
    badgeText = "● HIGH";
  }

  return (
    <div
      className="custom-node-wrapper"
      style={{
        position: "relative",
        width: dims.width,
        minHeight: dims.height,
        background: "#1c2128",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: `1px ${borderStyle} rgba(255,255,255,0.12)`,
        borderLeft: `3px solid ${activeBorderColor}`,
        borderRadius: 8,
        padding: "12px 14px",
        cursor: "pointer",
        boxShadow: finalBoxShadow,
        opacity: isOrphaned ? 0.7 : 1,
        filter: selected ? "brightness(1.15)" : "none",
        transition: "all 200ms ease",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderLeftColor = activeBorderColor;
        if (tier === "critical" || tier === "high") {
          e.currentTarget.style.boxShadow =
            "0 0 16px var(--accent-glow), 0 0 32px var(--accent-glow)";
        }
        e.currentTarget.querySelectorAll(".react-flow__handle").forEach((h) => {
          h.style.opacity = "1";
        });
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderLeftColor = activeBorderColor;
        e.currentTarget.style.boxShadow = finalBoxShadow;
        e.currentTarget.querySelectorAll(".react-flow__handle").forEach((h) => {
          h.style.opacity = "0";
        });
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${activeBorderColor}40, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Subtle gradient sheen */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        borderRadius: '8px 8px 0 0',
        pointerEvents: 'none',
      }} />

      {badgeText && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 4,
            ...badgeStyle
          }}
        >
          {badgeText}
        </span>
      )}

      {!badgeText && data.extension && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "#3d444d",
          }}
        >
          {data.extension}
        </span>
      )}

      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: activeBorderColor,
          border: "2px solid #0f1318",
          width: 8,
          height: 8,
          opacity: 0,
          transition: "opacity 200ms ease",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: badgeText ? 60 : 20, marginTop: 4 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: activeBorderColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: getNodeLabelSize(importance),
            color: "#e6edf3",
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {data.label}
        </span>
      </div>

      <div style={{
        width: "100%",
        height: 4,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 2,
        margin: "10px 0"
      }}>
        <div style={{
          width: getImportanceBarWidth(importance),
          height: 4,
          backgroundColor: getImportanceBarColor(importance),
          borderRadius: 2,
          transition: "width 800ms ease"
        }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: typeColor,
              backgroundColor: typeColor + '18',  // 10% opacity
              border: `1px solid ${typeColor}30`, // 19% opacity border
              padding: '2px 7px',
              borderRadius: 5,
              textTransform: "lowercase",
            }}
          >
            {data.type}
          </span>

          {isOrphaned && (
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#d29922",
                backgroundColor: "rgba(210, 169, 34, 0.12)",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              orphaned
            </span>
          )}
        </div>

        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: getImportanceBarColor(importance),
            fontWeight: 600,
          }}
        >
          {importance}/10
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: activeBorderColor,
          border: "2px solid #0f1318",
          width: 8,
          height: 8,
          opacity: 0,
          transition: "opacity 200ms ease",
        }}
      />
    </div>
  );
}

export default CustomNode;

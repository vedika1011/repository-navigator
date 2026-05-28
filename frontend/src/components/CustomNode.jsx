// CustomNode.jsx — Styled dark card node for React Flow, colored by file type with handles for edge connections.

import { Handle, Position } from "@xyflow/react";
import { NODE_COLORS } from "../utils/graphUtils.js";
import {
  getNodeBorderWidth,
  getNodeLabelSize,
  getImportanceBarWidth,
  getImportanceBarColor,
  getHeatmapColor
} from "../utils/importanceUtils.js";

function CustomNode({ data, selected }) {
  const isOrphaned = data.isOrphaned;
  const importance = data.importance || 5;

  const typeColor = NODE_COLORS[data.type] || "#8b949e";
  const borderColor = data.heatmapMode ? getHeatmapColor(importance) : typeColor;

  // Custom polished widths:
  let customWidth = 210; // default medium (5-6)
  if (importance >= 9) customWidth = 250;
  else if (importance >= 7) customWidth = 230;
  else if (importance >= 5) customWidth = 210;
  else if (importance >= 3) customWidth = 195;
  else customWidth = 180;

  const borderStyle = isOrphaned ? "dashed" : "solid";
  const activeBorderColor = isOrphaned && !data.heatmapMode ? "#d29922" : borderColor;

  const finalBackground = data.heatmapMode
    ? `linear-gradient(135deg, #13181f 0%, ${borderColor}0e 100%)`
    : "#13181f";

  const finalBorder = data.heatmapMode
    ? `1px ${borderStyle} ${borderColor}33`
    : `1px ${borderStyle} rgba(255,255,255,0.07)`;

  let finalBoxShadow = 'none';
  if (data.heatmapMode) {
    if (importance >= 9) finalBoxShadow = `0 0 16px ${borderColor}25`;
    else if (importance >= 7) finalBoxShadow = `0 0 10px ${borderColor}14`;
  } else if (importance >= 9) {
    finalBoxShadow = `0 0 14px ${borderColor}22`;
  }

  if (selected) {
    const selectionRing = "0 0 0 2px var(--accent)";
    finalBoxShadow = finalBoxShadow && finalBoxShadow !== "none" 
      ? `${finalBoxShadow}, ${selectionRing}` 
      : selectionRing;
  }

  return (
    <div
      className="custom-node-wrapper"
      style={{
        position: "relative",
        width: customWidth,
        minHeight: 80,
        background: finalBackground,
        border: finalBorder,
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
        if (importance >= 9) {
          e.currentTarget.style.boxShadow = `0 0 16px ${borderColor}33, 0 0 32px ${borderColor}11`;
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
      {/* Top accent highlight */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${activeBorderColor}40, transparent)`,
        pointerEvents: 'none',
      }} />

      {data.extension && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-faint)",
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

      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 32, marginTop: 4 }}>
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
            fontFamily: "var(--font-heading)",
            fontSize: getNodeLabelSize(importance),
            color: "var(--text-primary)",
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {data.label}
        </span>
      </div>

      {/* Clean importance progress bar (3px height) */}
      <div style={{
        width: "100%",
        height: 3,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 1.5,
        margin: "10px 0"
      }}>
        <div style={{
          width: getImportanceBarWidth(importance),
          height: 3,
          backgroundColor: getImportanceBarColor(importance),
          borderRadius: 1.5,
          transition: "width 800ms ease"
        }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: typeColor,
              backgroundColor: typeColor + '18',
              border: `1px solid ${typeColor}30`,
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
                fontFamily: "var(--font-mono)",
                fontSize: 10,
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
            fontFamily: "var(--font-mono)",
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

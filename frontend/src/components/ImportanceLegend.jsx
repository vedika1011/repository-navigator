// ImportanceLegend.jsx — Displays node type colors and the heatmap importance scale.

import { NODE_COLORS } from "../utils/graphUtils.js";
import { getHeatmapColor } from "../utils/importanceUtils.js";

function ImportanceLegend({ heatmapMode }) {
  // Representative scores for the 5 tiers:
  // minimal (2), low (4), medium (6), high (8), critical (10)
  const tiers = [
    { name: "minimal", range: "1-2", score: 2 },
    { name: "low", range: "3-4", score: 4 },
    { name: "medium", range: "5-6", score: 6 },
    { name: "high", range: "7-8", score: 8 },
    { name: "critical", range: "9-10", score: 10 },
  ];

  return (
    <div
      style={{
        marginTop: 12,
        padding: "12px 16px",
        background: "transparent",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Row 1 — Node type legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div
            key={type}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: color,
                flexShrink: 0,
                opacity: heatmapMode ? 0.3 : 1,
              }}
            />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              {type}
            </span>
          </div>
        ))}
      </div>

      {/* Row 2 — Importance tier scale */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "var(--text-faint)",
          }}
        >
          Impact:
        </span>
        {tiers.map((tier) => (
          <div
            key={tier.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: getHeatmapColor(tier.score),
                flexShrink: 0,
                opacity: heatmapMode ? 1 : 0.6,
              }}
            />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              {tier.name} ({tier.range})
            </span>
          </div>
        ))}
      </div>

      {/* Row 3 — Heatmap explanation */}
      {heatmapMode && (
        <div
          style={{
            marginTop: 8,
            textAlign: "center",
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "var(--text-faint)",
            fontStyle: "italic",
          }}
        >
          Heatmap mode: node colors show impact level, not file type
        </div>
      )}
    </div>
  );
}

export default ImportanceLegend;

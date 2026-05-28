// importanceUtils.js — Pure functions mapping importance score to visual properties.

export function getNodeDimensions(importance) {
  const clamped = Math.min(10, Math.max(1, importance || 5))
  // Increased all widths by 20px, heights by 8px
  if (clamped >= 9) return { width: 320, height: 110 }
  if (clamped >= 7) return { width: 300, height: 100 }
  if (clamped >= 5) return { width: 280, height: 90 }
  if (clamped >= 3) return { width: 260, height: 80 }
  return { width: 240, height: 70 }
}

export function getNodeBorderWidth(importance) {
  const val = Math.min(10, Math.max(1, importance || 1));
  if (val >= 9) return 3;
  if (val >= 7) return 2.5;
  if (val >= 5) return 2;
  if (val >= 3) return 1.5;
  return 1;
}

export function getNodeGlow(importance) {
  const val = Math.min(10, Math.max(1, importance || 1));
  if (val >= 9) return "0 0 20px rgba(247,129,102,0.5)";
  if (val >= 7) return "0 0 12px rgba(88,166,255,0.35)";
  return "none";
}

export function getNodeLabelSize(importance) {
  const val = Math.min(10, Math.max(1, importance || 1));
  if (val >= 9) return 18;
  if (val >= 7) return 17;
  if (val >= 5) return 16;
  if (val >= 3) return 15;
  return 14;
}

export function getImportanceTier(importance) {
  const val = Math.min(10, Math.max(1, importance || 1));
  if (val >= 9) return "critical";
  if (val >= 7) return "high";
  if (val >= 5) return "medium";
  if (val >= 3) return "low";
  return "minimal";
}

export function getHeatmapColor(importance) {
  const val = Math.min(10, Math.max(1, importance || 1));
  if (val >= 9) return "#f78166"; // red-orange
  if (val >= 7) return "#d29922"; // amber
  if (val >= 5) return "#58a6ff"; // blue
  if (val >= 3) return "#7ee787"; // green
  return "#8b949e";               // gray
}

export function getImportanceBarWidth(importance) {
  const val = Math.min(10, Math.max(1, importance || 1));
  return `${(val / 10) * 100}%`;
}

export function getImportanceBarColor(importance) {
  return getHeatmapColor(importance);
}

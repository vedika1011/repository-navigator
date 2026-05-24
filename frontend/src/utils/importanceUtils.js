// importanceUtils.js — Pure functions mapping importance score to visual properties.

export function getNodeDimensions(importance) {
  const val = Math.min(10, Math.max(1, importance || 1));
  let width = 220;
  if (val >= 9) width = 260;
  else if (val >= 7) width = 240;
  else if (val >= 5) width = 220;
  else if (val >= 3) width = 200;
  else width = 185;

  const height = Math.max(72, 56 + Math.floor(val / 2) * 8);
  return { width, height };
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
  if (val >= 9) return 15;
  if (val >= 7) return 14;
  if (val >= 5) return 13;
  if (val >= 3) return 12;
  return 11;
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

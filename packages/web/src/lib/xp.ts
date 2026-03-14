// Mirror of packages/engine/src/xp.rs calculate_level formula
// Formula: level = floor(0.1 * sqrt(total_xp)) + 1

export function calculateLevel(totalXp: number): {
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
} {
  const xp = Math.max(totalXp, 0);
  const level = Math.floor(0.1 * Math.sqrt(xp)) + 1;
  const xpForCurrentLevel = xpForLevel(level);
  const xpForNextLevel = xpForLevel(level + 1);
  return { level, xpForCurrentLevel, xpForNextLevel };
}

// Inverse formula: xp = ((level - 1) / 0.1)^2
function xpForLevel(level: number): number {
  const l = Math.max(level - 1, 0);
  return Math.floor((l / 0.1) ** 2);
}

export function xpProgress(totalXp: number): number {
  const { xpForCurrentLevel, xpForNextLevel } = calculateLevel(totalXp);
  const range = xpForNextLevel - xpForCurrentLevel;
  if (range <= 0) return 0;
  return (totalXp - xpForCurrentLevel) / range;
}

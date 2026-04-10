const XP_PER_LEVEL = 100;

export interface XPState {
  totalExp: number;
  level: number;
  exp: number;
  maxExp: number;
  percent: number;
}

export function computeXPState(totalExp: number, level: number, exp: number, maxExp: number): XPState {
  const safePct = maxExp > 0 ? Math.min(100, Math.round((exp / maxExp) * 100)) : 0;
  return { totalExp, level, exp, maxExp: maxExp || XP_PER_LEVEL, percent: safePct };
}

export function getLevelLabel(level: number): string {
  if (level >= 30) return "S-Rank";
  if (level >= 20) return "A-Rank";
  if (level >= 15) return "B-Rank";
  if (level >= 10) return "C-Rank";
  if (level >= 5) return "D-Rank";
  return "E-Rank";
}

export function getXPBarColor(percent: number): string {
  if (percent >= 80) return "#a855f7";
  if (percent >= 50) return "#7c3aed";
  return "#6d28d9";
}

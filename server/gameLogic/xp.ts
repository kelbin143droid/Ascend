import type { Stats } from "@shared/schema";
import { calculateDerivedStats, type DerivedStats } from "./stats";

export interface XPCalculationInput {
  baseXP: number;
  stats: Stats;
  derived?: DerivedStats;
}

export function calculateXP({ baseXP, stats, derived }: XPCalculationInput): number {
  const derivedStats = derived || calculateDerivedStats(stats);
  return Math.floor(baseXP * derivedStats.xpMultiplier);
}

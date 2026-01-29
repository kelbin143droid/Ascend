import type { Stats } from "@shared/schema";

export interface DerivedStats {
  xpMultiplier: number;
  staminaMax: number;
  streakForgiveness: number;
  powerRating: number;
}

export function calculateDerivedStats(stats: Stats): DerivedStats {
  return {
    xpMultiplier: 1 + stats.sense * 0.02,
    staminaMax: 100 + stats.vitality * 5,
    streakForgiveness: Math.floor(stats.agility / 10),
    powerRating: stats.strength * 1.5,
  };
}

import type { Stats } from "@shared/schema";

export interface DerivedStats {
  xpMultiplier: number;
  staminaMax: number;
  streakForgiveness: number;
  powerRating: number;
  ascensionMode?: boolean;
  balancedMasteryBonus?: boolean;
  eliteSessionsUnlocked?: boolean;
}

export function calculateDerivedStats(stats: Stats, rank?: string): DerivedStats {
  const isAscension = rank === "S";
  const hasBalancedMastery = isAscension && 
    stats.strength >= 150 && 
    stats.agility >= 150 && 
    stats.sense >= 150 && 
    stats.vitality >= 150;
  
  let xpMultiplier = 1 + stats.sense * 0.02;
  if (hasBalancedMastery) {
    xpMultiplier *= 1.1;
  }
  
  return {
    xpMultiplier,
    staminaMax: 100 + stats.vitality * 5,
    streakForgiveness: Math.floor(stats.agility / 10),
    powerRating: stats.strength * 1.5,
    ascensionMode: isAscension,
    balancedMasteryBonus: hasBalancedMastery,
    eliteSessionsUnlocked: isAscension,
  };
}

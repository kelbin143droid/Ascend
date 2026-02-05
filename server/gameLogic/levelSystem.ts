// XP, Level, Strength, and Rank System
// Based on exponential XP growth

const BASE_XP = 100;
const GROWTH_FACTOR = 1.5;

// XP required to go from level N to level N+1
export function getXPForNextLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, GROWTH_FACTOR));
}

// Calculate level from total accumulated XP
export function getLevelFromXP(totalXP: number): { level: number; remainingXP: number; xpForNext: number } {
  let level = 1;
  let xpRemaining = totalXP;
  let xpForNext = getXPForNextLevel(level);

  while (xpRemaining >= xpForNext) {
    xpRemaining -= xpForNext;
    level++;
    xpForNext = getXPForNextLevel(level);
  }

  return { 
    level, 
    remainingXP: xpRemaining,
    xpForNext 
  };
}

// Calculate total XP needed to reach a specific level
export function getTotalXPForLevel(targetLevel: number): number {
  let total = 0;
  for (let lvl = 1; lvl < targetLevel; lvl++) {
    total += getXPForNextLevel(lvl);
  }
  return total;
}

// Power/Strength scaling: base 10 + 1 per level
export function getPowerFromLevel(level: number, baseStats: { strength: number; agility: number; sense: number; vitality: number }): number {
  const statPower = Math.floor(
    baseStats.strength * 1.5 +
    baseStats.agility * 1.2 +
    baseStats.sense * 1.3 +
    baseStats.vitality * 1.4
  );
  return statPower + (level - 1);
}

// Rank system based on level
export function getRankFromLevel(level: number): string {
  if (level >= 101) return "S";
  if (level >= 71) return "A";
  if (level >= 46) return "B";
  if (level >= 26) return "C";
  if (level >= 11) return "D";
  return "E";
}

// XP gain per task - returns small amounts (10-15 for small workout)
export function getXPForTask(
  taskDifficulty: "small" | "medium" | "large",
  userLevel: number,
  durationMinutes: number
): number {
  const difficultyMultiplier: Record<string, number> = {
    small: 1,
    medium: 2,
    large: 4
  };

  const multiplier = difficultyMultiplier[taskDifficulty] || 1;
  
  // Base XP is 10, with slight level scaling
  const baseXP = 10;
  const levelMultiplier = 1 + (userLevel - 1) * 0.05; // Reduced scaling
  
  // Duration bonus: 1 XP per 10 minutes, capped at +5
  const durationBonus = Math.min(5, Math.floor(durationMinutes / 10));

  return Math.floor((baseXP * multiplier * levelMultiplier) + durationBonus);
}

// Calculate XP for completing a session (workout, study, etc.)
export function getSessionXP(
  stat: string,
  durationMinutes: number,
  userLevel: number
): number {
  // Small workout (0-15 min): 10-15 XP
  // Medium workout (15-45 min): 15-25 XP  
  // Large workout (45+ min): 25-40 XP
  
  let difficulty: "small" | "medium" | "large";
  if (durationMinutes < 15) {
    difficulty = "small";
  } else if (durationMinutes < 45) {
    difficulty = "medium";
  } else {
    difficulty = "large";
  }

  return getXPForTask(difficulty, userLevel, durationMinutes);
}

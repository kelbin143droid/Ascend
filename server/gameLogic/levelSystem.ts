const BASE_XP = 100;
const GROWTH = 1.5;

export function getXPForNextLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(level, GROWTH));
}

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
    xpForNext,
  };
}

export function getTotalXPForLevel(targetLevel: number): number {
  let total = 0;
  for (let lvl = 1; lvl < targetLevel; lvl++) {
    total += getXPForNextLevel(lvl);
  }
  return total;
}

export function getStatFromLevel(statTotalXP: number): { level: number; currentXP: number; xpForNext: number } {
  let level = 1;
  let xpRemaining = statTotalXP;
  let xpForNext = getXPForNextLevel(level);

  while (xpRemaining >= xpForNext) {
    xpRemaining -= xpForNext;
    level++;
    xpForNext = getXPForNextLevel(level);
  }

  return {
    level,
    currentXP: xpRemaining,
    xpForNext,
  };
}

const BASE_HP = 100;
const BASE_MP = 50;
const SCALE_PER_LEVEL = 0.05;

export function getScaledHP(level: number): number {
  return Math.floor(BASE_HP * Math.pow(1 + SCALE_PER_LEVEL, level - 1));
}

export function getScaledMP(level: number): number {
  return Math.floor(BASE_MP * Math.pow(1 + SCALE_PER_LEVEL, level - 1));
}

export type Rank = "E" | "D" | "C" | "B" | "A" | "S";

export function getRankFromLevel(level: number): Rank {
  if (level >= 30) return "S";
  if (level >= 20) return "A";
  if (level >= 15) return "B";
  if (level >= 10) return "C";
  if (level >= 5) return "D";
  return "E";
}

export function getPowerFromLevel(level: number, baseStats: { strength: number; agility: number; sense: number; vitality: number }): number {
  const statPower = Math.floor(
    baseStats.strength * 1.5 +
    baseStats.agility * 1.2 +
    baseStats.sense * 1.3 +
    baseStats.vitality * 1.4
  );
  return statPower + (level - 1);
}

export function getXPForActivity(durationMinutes: number): number {
  if (durationMinutes <= 3) return 10 + Math.floor(Math.random() * 6);
  if (durationMinutes <= 10) return 25 + Math.floor(Math.random() * 16);
  return 60 + Math.floor(Math.random() * 41);
}

export function getXPTier(durationMinutes: number): "small" | "medium" | "large" {
  if (durationMinutes <= 3) return "small";
  if (durationMinutes <= 10) return "medium";
  return "large";
}

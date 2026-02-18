export function getXPForNextLevel(level: number): number {
  return 100 + (level - 1) * 25;
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
    xpForNext 
  };
}

export function getTotalXPForLevel(targetLevel: number): number {
  let total = 0;
  for (let lvl = 1; lvl < targetLevel; lvl++) {
    total += getXPForNextLevel(lvl);
  }
  return total;
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

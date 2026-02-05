import type { Stats, StatName, FatigueData } from "@shared/schema";
import { RANK_STAT_CAPS, FATIGUE_MULTIPLIERS } from "@shared/schema";

export interface SessionResult {
  updatedStats: Stats;
  levelXP: number;
  message: string;
  rankLimitReached: boolean;
  spilloverApplied?: { stat: StatName; amount: number };
}

export interface CompleteSessionParams {
  xp: number;
  stat: StatName;
  currentStats: Stats;
  rank: string;
  durationMinutes: number;
  fatigue: FatigueData;
}

export function getTodayDateString(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function getFatigueMultiplier(sessionCount: number): number {
  if (sessionCount >= FATIGUE_MULTIPLIERS.length) {
    return FATIGUE_MULTIPLIERS[FATIGUE_MULTIPLIERS.length - 1];
  }
  return FATIGUE_MULTIPLIERS[sessionCount];
}

export function calculateStatIncrease(xp: number, currentStat: number): number {
  return xp / (50 + currentStat * 2);
}

export function applyRankCap(newStat: number, rank: string): { cappedStat: number; wasLimited: boolean } {
  const cap = RANK_STAT_CAPS[rank] || 25;
  if (newStat > cap) {
    return { cappedStat: cap, wasLimited: true };
  }
  return { cappedStat: newStat, wasLimited: false };
}

export function getSpilloverStat(primaryStat: StatName): StatName | null {
  if (primaryStat === "strength") return "vitality";
  if (primaryStat === "sense") return "agility";
  return null;
}

export function processSession(params: CompleteSessionParams): SessionResult {
  const { stat, currentStats, rank, durationMinutes, fatigue } = params;

  const today = getTodayDateString();
  let sessionCount = 0;
  if (fatigue.date === today) {
    sessionCount = fatigue.sessions[stat] || 0;
  }

  const fatigueMultiplier = getFatigueMultiplier(sessionCount);
  
  const isEliteSession = rank === "S" && durationMinutes >= 90;
  const eliteSessionBonus = isEliteSession ? 1.2 : 1.0;
  
  // Calculate XP based on duration: small workout = 10-15 XP
  // Base: 10 XP, +1 per 10 minutes, capped at +5
  const baseXP = 10;
  const durationBonus = Math.min(5, Math.floor(durationMinutes / 10));
  const calculatedXP = Math.floor((baseXP + durationBonus) * eliteSessionBonus);
  
  // 80% goes to stat progression, 20% to level XP
  const statXP = calculatedXP * 0.8;
  const levelXP = Math.floor(calculatedXP * 0.2);
  
  const fatigueAdjustedXP = statXP * fatigueMultiplier;
  
  const statIncrease = calculateStatIncrease(fatigueAdjustedXP, currentStats[stat]);
  
  let newStatValue = currentStats[stat] + statIncrease;
  const { cappedStat, wasLimited } = applyRankCap(newStatValue, rank);
  newStatValue = cappedStat;

  const updatedStats: Stats = { ...currentStats, [stat]: newStatValue };

  let spilloverApplied: { stat: StatName; amount: number } | undefined;
  
  if (durationMinutes >= 45) {
    const spilloverStat = getSpilloverStat(stat);
    if (spilloverStat) {
      const spilloverXP = xp * 0.05;
      const spilloverIncrease = calculateStatIncrease(spilloverXP, updatedStats[spilloverStat]);
      
      let newSpilloverValue = updatedStats[spilloverStat] + spilloverIncrease;
      const spilloverCapped = applyRankCap(newSpilloverValue, rank);
      newSpilloverValue = spilloverCapped.cappedStat;
      
      updatedStats[spilloverStat] = newSpilloverValue;
      spilloverApplied = { stat: spilloverStat, amount: spilloverIncrease };
    }
  }

  let message = `Session complete! +${statIncrease.toFixed(2)} ${stat}`;
  if (isEliteSession) {
    message += ` (Elite +20%)`;
  }
  if (fatigueMultiplier < 1) {
    message += ` (fatigue: ${(fatigueMultiplier * 100).toFixed(0)}%)`;
  }
  if (spilloverApplied) {
    message += ` | Synergy: +${spilloverApplied.amount.toFixed(2)} ${spilloverApplied.stat}`;
  }
  if (wasLimited) {
    message = "Rank limit reached. Advance to grow further.";
  }

  return {
    updatedStats,
    levelXP,
    message,
    rankLimitReached: wasLimited,
    spilloverApplied
  };
}

export function updateFatigueTracker(
  currentFatigue: FatigueData,
  stat: StatName
): FatigueData {
  const today = getTodayDateString();
  
  if (currentFatigue.date !== today) {
    return {
      date: today,
      sessions: {
        strength: stat === "strength" ? 1 : 0,
        agility: stat === "agility" ? 1 : 0,
        sense: stat === "sense" ? 1 : 0,
        vitality: stat === "vitality" ? 1 : 0,
      }
    };
  }
  
  return {
    ...currentFatigue,
    sessions: {
      ...currentFatigue.sessions,
      [stat]: (currentFatigue.sessions[stat] || 0) + 1
    }
  };
}

export function floorStats(stats: Stats): Stats {
  return {
    strength: Math.floor(stats.strength),
    agility: Math.floor(stats.agility),
    sense: Math.floor(stats.sense),
    vitality: Math.floor(stats.vitality),
  };
}

export function getDisplayStats(stats: Stats): Stats {
  return floorStats(stats);
}

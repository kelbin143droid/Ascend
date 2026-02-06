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
  
  const STAT_BASE_XP: Record<string, number> = {
    strength: 15,
    sense: 5,
    agility: 5,
    vitality: 5,
  };
  
  const calculatedXP = STAT_BASE_XP[stat] || 5;
  
  const statXP = Math.floor(calculatedXP * 0.8);
  const levelXP = calculatedXP;
  
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
      const spilloverXP = calculatedXP * 0.05;
      const spilloverIncrease = calculateStatIncrease(spilloverXP, updatedStats[spilloverStat]);
      
      let newSpilloverValue = updatedStats[spilloverStat] + spilloverIncrease;
      const spilloverCapped = applyRankCap(newSpilloverValue, rank);
      newSpilloverValue = spilloverCapped.cappedStat;
      
      updatedStats[spilloverStat] = newSpilloverValue;
      spilloverApplied = { stat: spilloverStat, amount: spilloverIncrease };
    }
  }

  let message = `Session complete! +${statIncrease.toFixed(2)} ${stat}`;
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

// HP Penalty/Recovery based on Vitality goal (7 hours sleep = 420 minutes)
export const VITALITY_GOAL_MINUTES = 420; // 7 hours
export const HP_CHANGE_PERCENT = 0.05; // 5% change
export const MIN_HP_PERCENT = 0.50; // Cannot drop below 50% of max HP

export interface HPUpdateResult {
  newHp: number;
  changed: boolean;
  message: string;
  direction: 'increase' | 'decrease' | 'none';
}

export function calculateHPUpdate(
  currentHp: number,
  maxHp: number,
  vitalityMinutesToday: number,
  lastHpCheckDate: string | null
): HPUpdateResult {
  const today = getTodayDateString();
  
  // If we already checked today, no change
  if (lastHpCheckDate === today) {
    return { newHp: currentHp, changed: false, message: '', direction: 'none' };
  }
  
  const goalMet = vitalityMinutesToday >= VITALITY_GOAL_MINUTES;
  const minHp = Math.floor(maxHp * MIN_HP_PERCENT);
  
  if (goalMet) {
    // Recovery: +5% HP, up to max
    const hpIncrease = Math.floor(maxHp * HP_CHANGE_PERCENT);
    const newHp = Math.min(currentHp + hpIncrease, maxHp);
    
    if (newHp > currentHp) {
      return {
        newHp,
        changed: true,
        message: `Vitality goal met! HP restored +${hpIncrease}`,
        direction: 'increase'
      };
    }
    return { newHp: currentHp, changed: false, message: 'HP already at maximum', direction: 'none' };
  } else {
    // Penalty: -5% HP, min 50% of max
    const hpDecrease = Math.floor(maxHp * HP_CHANGE_PERCENT);
    const newHp = Math.max(currentHp - hpDecrease, minHp);
    
    if (newHp < currentHp) {
      return {
        newHp,
        changed: true,
        message: `Vitality goal not met! HP decreased -${currentHp - newHp}`,
        direction: 'decrease'
      };
    }
    return { newHp: currentHp, changed: false, message: 'HP already at minimum threshold', direction: 'none' };
  }
}

export function getVitalityMinutesForDate(
  dailyProgress: Array<{ date: string; progress: Record<string, Record<string, number>> }>,
  date: string
): number {
  const dayProgress = dailyProgress.find(p => p.date === date);
  if (!dayProgress || !dayProgress.progress.vitality) {
    return 0;
  }
  return Object.values(dayProgress.progress.vitality).reduce((total, val) => total + (val || 0), 0);
}

export const SENSE_GOAL_MINUTES = 5;
export const MP_CHANGE_PERCENT = 0.05;
export const MIN_MP_PERCENT = 0.50;

export interface MPUpdateResult {
  newMp: number;
  changed: boolean;
  message: string;
  direction: 'increase' | 'decrease' | 'none';
}

export function calculateMPUpdate(
  currentMp: number,
  maxMp: number,
  senseMinutesToday: number,
  lastMpCheckDate: string | null
): MPUpdateResult {
  const today = getTodayDateString();

  if (lastMpCheckDate === today) {
    return { newMp: currentMp, changed: false, message: '', direction: 'none' };
  }

  const goalMet = senseMinutesToday >= SENSE_GOAL_MINUTES;
  const minMp = Math.floor(maxMp * MIN_MP_PERCENT);

  if (goalMet) {
    const mpIncrease = Math.floor(maxMp * MP_CHANGE_PERCENT);
    const newMp = Math.min(currentMp + mpIncrease, maxMp);

    if (newMp > currentMp) {
      return {
        newMp,
        changed: true,
        message: `Sense goal met! Mana restored +${mpIncrease}`,
        direction: 'increase'
      };
    }
    return { newMp: currentMp, changed: false, message: 'Mana already at maximum', direction: 'none' };
  } else {
    const mpDecrease = Math.floor(maxMp * MP_CHANGE_PERCENT);
    const newMp = Math.max(currentMp - mpDecrease, minMp);

    if (newMp < currentMp) {
      return {
        newMp,
        changed: true,
        message: `Sense goal not met! Mana decreased -${currentMp - newMp}`,
        direction: 'decrease'
      };
    }
    return { newMp: currentMp, changed: false, message: 'Mana already at minimum threshold', direction: 'none' };
  }
}

export function getSenseMinutesForDate(
  dailyProgress: Array<{ date: string; progress: Record<string, Record<string, number>> }>,
  date: string
): number {
  const dayProgress = dailyProgress.find(p => p.date === date);
  if (!dayProgress || !dayProgress.progress.sense) {
    return 0;
  }
  return Object.values(dayProgress.progress.sense).reduce((total, val) => total + (val || 0), 0);
}

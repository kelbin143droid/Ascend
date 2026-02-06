import type { StatName, StatXP } from "@shared/schema";
import { getTotalXPForLevel, getXPForNextLevel } from "./levelSystem";

export type TaskStatType = "strength" | "sense" | "agility" | "vitality";

const BASE_XP: Record<TaskStatType, number> = {
  strength: 15,
  sense: 5,
  agility: 5,
  vitality: 5,
};

const MINIMUM_COMPLETION_THRESHOLD = 30;
const MVD_BONUS_PERCENT = 0.05;
const PENALTY_XP_LOSS_PERCENT = 0.03;
const CONSECUTIVE_MISS_THRESHOLD = 3;
const CONSECUTIVE_MISS_STAT_PENALTY = 5;
const STAMINA_XP_PER_POINT = 20;

export function calculateTaskXP(statType: TaskStatType, completionPercentage: number): number {
  if (completionPercentage < MINIMUM_COMPLETION_THRESHOLD) {
    return 0;
  }
  const baseXP = BASE_XP[statType];
  return Math.floor(baseXP * (completionPercentage / 100));
}

export function calculateVitalityXP(sleepQualityPercentage: number): number {
  if (sleepQualityPercentage >= 80) return 5;
  if (sleepQualityPercentage >= 60) return 3;
  return 0;
}

export interface MVDResult {
  achieved: boolean;
  newStreak: number;
  bonusXP: number;
  totalDayXP: number;
  tasksCompleted: { physical: boolean; mind: boolean };
}

export function applyMinimumViableDay(
  tasksCompletedToday: { stat: TaskStatType; xpEarned: number }[],
  currentStreak: number
): MVDResult {
  const physicalStats: TaskStatType[] = ["strength", "agility"];
  const mindStats: TaskStatType[] = ["sense", "vitality"];

  const hasPhysical = tasksCompletedToday.some(
    (t) => physicalStats.includes(t.stat) && t.xpEarned > 0
  );
  const hasMind = tasksCompletedToday.some(
    (t) => mindStats.includes(t.stat) && t.xpEarned > 0
  );

  const totalDayXP = tasksCompletedToday.reduce((sum, t) => sum + t.xpEarned, 0);
  const achieved = hasPhysical && hasMind;

  if (achieved) {
    const bonusXP = Math.floor(totalDayXP * MVD_BONUS_PERCENT);
    return {
      achieved: true,
      newStreak: currentStreak + 1,
      bonusXP,
      totalDayXP: totalDayXP + bonusXP,
      tasksCompleted: { physical: true, mind: true },
    };
  }

  return {
    achieved: false,
    newStreak: 0,
    bonusXP: 0,
    totalDayXP,
    tasksCompleted: { physical: hasPhysical, mind: hasMind },
  };
}

export interface PenaltyResult {
  newTotalXP: number;
  xpLost: number;
  statPenalties: { strength: number; vitality: number };
  message: string;
}

export function applyPenalty(
  currentTotalXP: number,
  currentLevel: number,
  consecutiveMissedDays: number,
  currentStatXP: StatXP
): PenaltyResult {
  const levelFloor = getTotalXPForLevel(currentLevel);
  const xpToLose = Math.floor(currentTotalXP * PENALTY_XP_LOSS_PERCENT);
  const newTotalXP = Math.max(currentTotalXP - xpToLose, levelFloor);
  const actualLoss = currentTotalXP - newTotalXP;

  let statPenalties = { strength: 0, vitality: 0 };
  let message = `MVD missed! Lost ${actualLoss} XP.`;

  if (consecutiveMissedDays >= CONSECUTIVE_MISS_THRESHOLD) {
    statPenalties = {
      strength: Math.min(CONSECUTIVE_MISS_STAT_PENALTY, currentStatXP.strength),
      vitality: Math.min(CONSECUTIVE_MISS_STAT_PENALTY, currentStatXP.vitality),
    };
    message += ` ${consecutiveMissedDays} days missed — lost ${statPenalties.strength} STR XP and ${statPenalties.vitality} VIT XP.`;
  }

  return {
    newTotalXP,
    xpLost: actualLoss,
    statPenalties,
    message,
  };
}

export function calculateXPRequired(level: number): number {
  return getXPForNextLevel(level);
}

export function updateStamina(totalStrengthXP: number, totalAgilityXP: number): number {
  const combinedXP = totalStrengthXP + totalAgilityXP;
  return Math.max(1, Math.floor(combinedXP / STAMINA_XP_PER_POINT));
}

export interface TaskCompletionResult {
  xpEarned: number;
  statXPEarned: number;
  newStatXP: StatXP;
  newTotalXP: number;
  newStamina: number;
  leveledUp: boolean;
  newLevel: number;
  message: string;
}

export function processTaskCompletion(
  statType: TaskStatType,
  completionPercentage: number,
  currentTotalXP: number,
  currentLevel: number,
  currentStatXP: StatXP
): TaskCompletionResult {
  const xpEarned =
    statType === "vitality"
      ? calculateVitalityXP(completionPercentage)
      : calculateTaskXP(statType, completionPercentage);

  const newStatXP: StatXP = {
    ...currentStatXP,
    [statType]: (currentStatXP[statType] || 0) + xpEarned,
  };

  const newTotalXP = currentTotalXP + xpEarned;

  let newLevel = currentLevel;
  let xpCheck = newTotalXP;
  let leveledUp = false;
  let lvl = 1;
  let xpForNext = calculateXPRequired(lvl);

  while (xpCheck >= xpForNext) {
    xpCheck -= xpForNext;
    lvl++;
    xpForNext = calculateXPRequired(lvl);
  }
  if (lvl > currentLevel) {
    newLevel = lvl;
    leveledUp = true;
  }

  const newStamina = updateStamina(newStatXP.strength, newStatXP.agility);

  let message = xpEarned > 0
    ? `+${xpEarned} ${statType.toUpperCase()} XP`
    : `Below threshold — no XP earned.`;
  if (leveledUp) {
    message += ` | Level up! → ${newLevel}`;
  }

  return {
    xpEarned,
    statXPEarned: xpEarned,
    newStatXP,
    newTotalXP,
    newStamina,
    leveledUp,
    newLevel,
    message,
  };
}

export function getCompletionPercentage(
  dailyProgress: Record<string, Record<string, number>>,
  stat: string,
  exercises: { id: string; targetValue: number }[]
): number {
  const statProgress = dailyProgress[stat] || {};
  if (exercises.length === 0) return 0;

  let totalPct = 0;
  for (const ex of exercises) {
    const current = statProgress[ex.id] || 0;
    totalPct += Math.min(100, (current / ex.targetValue) * 100);
  }
  return totalPct / exercises.length;
}

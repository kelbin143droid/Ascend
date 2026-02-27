import type { Habit } from "@shared/schema";

const MIN_DURATION = 2;
const MAX_DURATION = 60;
const CONSECUTIVE_SUCCESS_THRESHOLD = 5;
const DURATION_INCREASE_STEP = 1;
const DURATION_DECREASE_FACTOR = 0.8;

export interface ScaledDifficulty {
  duration: number;
  difficultyLevel: number;
  reason: string;
  isAutoAdjusted: boolean;
}

export function scaleDifficulty(
  habit: Habit,
  consecutiveCompletions: number,
  playerPhase: number
): ScaledDifficulty {
  const baseDuration = habit.baseDurationMinutes;
  let targetDuration = habit.currentDurationMinutes;
  let difficultyLevel = habit.difficultyLevel;
  let reason = "Maintaining current difficulty";
  let isAutoAdjusted = false;

  const phaseFloor = getPhaseMinDuration(playerPhase);
  const phaseCeiling = getPhaseMaxDuration(playerPhase);

  if (consecutiveCompletions >= CONSECUTIVE_SUCCESS_THRESHOLD) {
    const increase = DURATION_INCREASE_STEP;
    targetDuration = Math.min(phaseCeiling, targetDuration + increase);
    reason = `+${increase} min after ${consecutiveCompletions} consecutive completions`;
    isAutoAdjusted = true;

    if (targetDuration >= baseDuration * getDifficultyThreshold(difficultyLevel)) {
      if (difficultyLevel < 5) {
        difficultyLevel = Math.min(5, difficultyLevel + 1);
        reason += ` — difficulty increased to level ${difficultyLevel}`;
      }
    }
  }

  if (habit.momentum < 0.2 && habit.totalCompletions > 3) {
    targetDuration = Math.max(
      MIN_DURATION,
      Math.round(baseDuration * DURATION_DECREASE_FACTOR)
    );
    if (difficultyLevel > 1) {
      difficultyLevel = Math.max(1, difficultyLevel - 1);
    }
    reason = "Reduced difficulty — rebuilding momentum";
    isAutoAdjusted = true;
  }

  if (habit.currentStreak === 0 && habit.totalCompletions > 5) {
    targetDuration = Math.max(MIN_DURATION, Math.round(baseDuration * 0.6));
    difficultyLevel = Math.max(1, difficultyLevel - 1);
    reason = "Micro-session mode — restarting after break";
    isAutoAdjusted = true;
  }

  targetDuration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, targetDuration));
  targetDuration = Math.max(phaseFloor, Math.min(phaseCeiling, targetDuration));

  return {
    duration: targetDuration,
    difficultyLevel,
    reason,
    isAutoAdjusted,
  };
}

export function getPhaseMinDuration(phase: number): number {
  return MIN_DURATION;
}

export function getPhaseMaxDuration(phase: number): number {
  switch (phase) {
    case 1: return 15;
    case 2: return 25;
    case 3: return 35;
    case 4: return 45;
    case 5: return 60;
    default: return 15;
  }
}

function getDifficultyThreshold(currentLevel: number): number {
  switch (currentLevel) {
    case 1: return 1.5;
    case 2: return 1.8;
    case 3: return 2.2;
    case 4: return 2.8;
    default: return 3.5;
  }
}

export function getDifficultyLabel(level: number): string {
  switch (level) {
    case 1: return "Micro";
    case 2: return "Light";
    case 3: return "Standard";
    case 4: return "Intense";
    case 5: return "Master";
    default: return "Micro";
  }
}

export function calculateTrainingDuration(
  playerPhase: number,
  momentum: number,
  recentCompletionCount: number,
  stat: string
): { duration: number; workSeconds: number; restSeconds: number; cycles: number; exercisesPerCycle: number } {
  const phaseMax = getPhaseMaxDuration(playerPhase);

  let baseMins: number;
  if (momentum >= 0.7) {
    baseMins = Math.min(phaseMax, 8 + Math.floor(recentCompletionCount * 0.3));
  } else if (momentum >= 0.4) {
    baseMins = Math.min(phaseMax, 5 + Math.floor(recentCompletionCount * 0.2));
  } else {
    baseMins = Math.min(phaseMax, 3 + Math.floor(recentCompletionCount * 0.1));
  }

  baseMins = Math.max(MIN_DURATION, Math.min(phaseMax, baseMins));

  let workSeconds: number;
  let restSeconds: number;
  if (momentum >= 0.7) {
    workSeconds = stat === "sense" ? 60 : 40;
    restSeconds = stat === "sense" ? 10 : 20;
  } else if (momentum >= 0.4) {
    workSeconds = stat === "sense" ? 45 : 30;
    restSeconds = stat === "sense" ? 15 : 25;
  } else {
    workSeconds = stat === "sense" ? 30 : 25;
    restSeconds = stat === "sense" ? 15 : 30;
  }

  const cycleTime = (workSeconds + restSeconds) / 60;
  const exercisesPerCycle = momentum >= 0.7 ? 5 : momentum >= 0.4 ? 4 : 3;
  const exerciseCycleTime = cycleTime * exercisesPerCycle;
  const cycles = Math.max(1, Math.round(baseMins / exerciseCycleTime));

  return {
    duration: baseMins,
    workSeconds,
    restSeconds,
    cycles,
    exercisesPerCycle,
  };
}

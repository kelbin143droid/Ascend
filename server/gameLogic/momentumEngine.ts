import type { Habit } from "@shared/schema";

const MOMENTUM_GAIN_BASE = 0.12;
const MOMENTUM_DECAY_DAILY = 0.92;
const MOMENTUM_DECAY_MISS_2 = 0.75;
const MOMENTUM_DECAY_MISS_3 = 0.55;
const MOMENTUM_DECAY_MISS_5PLUS = 0.3;
const MAX_MOMENTUM = 1.0;
const GRACE_DAYS = 1;

export interface MomentumResult {
  momentum: number;
  streakBroken: boolean;
  graceDayUsed: boolean;
  newStreak: number;
  missedDays: number;
  recoveryMode: boolean;
  xpMultiplier: number;
}

function daysBetween(dateA: string | null, dateB: string): number {
  if (!dateA) return 999;
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateMomentumUpdate(
  habit: Habit,
  today: string,
  completed: boolean,
  streakForgiveness: number = 0
): MomentumResult {
  const currentMomentum = habit.momentum || 0;
  let newMomentum = currentMomentum;
  let newStreak = habit.currentStreak;
  let streakBroken = false;
  let graceDayUsed = false;
  let recoveryMode = false;

  const isFirstCompletion = !habit.lastCompletedDate || habit.totalCompletions === 0;
  const missed = isFirstCompletion ? 0 : daysBetween(habit.lastCompletedDate, today);

  if (completed) {
    if (isFirstCompletion) {
      newStreak = 1;
      newMomentum = MOMENTUM_GAIN_BASE;
      const xpMultiplier = calculateXPMultiplier(newMomentum, newStreak);
      return {
        momentum: Math.round(newMomentum * 1000) / 1000,
        streakBroken: false,
        graceDayUsed: false,
        newStreak: 1,
        missedDays: 0,
        recoveryMode: false,
        xpMultiplier,
      };
    }

    if (missed <= 1) {
      newStreak = habit.lastCompletedDate === today ? habit.currentStreak : habit.currentStreak + 1;
      newMomentum = Math.min(MAX_MOMENTUM, currentMomentum + MOMENTUM_GAIN_BASE * (1 + newStreak * 0.01));
    } else if (missed <= 1 + GRACE_DAYS + Math.floor(streakForgiveness)) {
      graceDayUsed = true;
      newStreak = habit.currentStreak + 1;
      newMomentum = Math.min(MAX_MOMENTUM, currentMomentum * 0.95 + MOMENTUM_GAIN_BASE);
    } else if (missed <= 3) {
      streakBroken = true;
      newStreak = 1;
      newMomentum = Math.max(0, currentMomentum * MOMENTUM_DECAY_MISS_2 + MOMENTUM_GAIN_BASE * 0.5);
      recoveryMode = true;
    } else if (missed <= 5) {
      streakBroken = true;
      newStreak = 1;
      newMomentum = Math.max(0, currentMomentum * MOMENTUM_DECAY_MISS_3 + MOMENTUM_GAIN_BASE * 0.3);
      recoveryMode = true;
    } else {
      streakBroken = true;
      newStreak = 1;
      newMomentum = Math.max(0, currentMomentum * MOMENTUM_DECAY_MISS_5PLUS + MOMENTUM_GAIN_BASE * 0.2);
      recoveryMode = true;
    }
  } else {
    if (missed <= 1) {
      newMomentum = currentMomentum * MOMENTUM_DECAY_DAILY;
    } else if (missed <= 3) {
      newMomentum = currentMomentum * MOMENTUM_DECAY_MISS_2;
    } else if (missed <= 5) {
      newMomentum = currentMomentum * MOMENTUM_DECAY_MISS_3;
    } else {
      newMomentum = currentMomentum * MOMENTUM_DECAY_MISS_5PLUS;
      recoveryMode = true;
    }
  }

  newMomentum = Math.round(newMomentum * 1000) / 1000;

  const xpMultiplier = calculateXPMultiplier(newMomentum, newStreak);

  return {
    momentum: newMomentum,
    streakBroken,
    graceDayUsed,
    newStreak,
    missedDays: missed,
    recoveryMode,
    xpMultiplier,
  };
}

export function calculateXPMultiplier(momentum: number, streak: number): number {
  const momentumBonus = momentum * 1.5;
  const streakBonus = Math.min(0.5, streak * 0.02);
  return Math.min(3.0, 1 + momentumBonus + streakBonus);
}

export function getMomentumTier(momentum: number): {
  tier: string;
  label: string;
  color: string;
} {
  if (momentum >= 0.9) return { tier: "blazing", label: "Blazing", color: "#ef4444" };
  if (momentum >= 0.7) return { tier: "strong", label: "Strong", color: "#f59e0b" };
  if (momentum >= 0.4) return { tier: "building", label: "Building", color: "#3b82f6" };
  if (momentum >= 0.15) return { tier: "warming", label: "Warming Up", color: "#6b7280" };
  return { tier: "cold", label: "Cold Start", color: "#374151" };
}

export function shouldTriggerRecovery(habit: Habit, today: string): {
  trigger: boolean;
  missedDays: number;
  suggestion: string;
} {
  if (!habit.lastCompletedDate || habit.totalCompletions === 0) {
    return { trigger: false, missedDays: 0, suggestion: "" };
  }
  const missed = daysBetween(habit.lastCompletedDate, today);

  if (missed > 5) {
    return {
      trigger: true,
      missedDays: missed,
      suggestion: "Start with a micro-session (2-3 minutes). Small wins rebuild momentum faster than big efforts.",
    };
  }
  if (missed > 3) {
    return {
      trigger: true,
      missedDays: missed,
      suggestion: "Try a shorter session today. Consistency matters more than duration.",
    };
  }
  return { trigger: false, missedDays: missed, suggestion: "" };
}

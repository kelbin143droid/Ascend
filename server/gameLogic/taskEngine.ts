import type { Player, Habit, HabitCompletion, Badge, StatName } from "@shared/schema";
import { scaleDifficulty, getPhaseMaxDuration } from "./difficultyScaler";
import { calculateMomentumUpdate, type MomentumResult } from "./momentumEngine";
import { calculateHabitXP, checkBadgeEligibility, type BadgeDefinition } from "./rewardEngine";
import { calculateStabilityScore, checkRegression, buildUpdatedStabilityData } from "./stabilityEngine";

export interface TodayTask {
  habit: Habit;
  completedToday: boolean;
  adjustedDuration: number;
  difficultyLevel: number;
  adjustmentReason: string;
  priority: number;
}

export interface CompleteTaskResult {
  xpEarned: number;
  statGain: { stat: StatName; amount: number };
  newMomentum: MomentumResult;
  badges: BadgeDefinition[];
  streakUpdate: { newStreak: number; broken: boolean; graceDayUsed: boolean };
  recoveryMode: boolean;
}

export function getTasksForToday(
  player: Player,
  habits: Habit[],
  completions: HabitCompletion[]
): TodayTask[] {
  const today = new Date().toLocaleDateString("en-CA");
  const stabilityScore = player.stability?.score ?? 50;
  const activeHabits = habits.filter(h => h.active);

  const completedTodaySet = new Set(
    completions
      .filter(c => {
        const completedDate = c.completedAt
          ? new Date(c.completedAt).toLocaleDateString("en-CA")
          : null;
        return completedDate === today;
      })
      .map(c => c.habitId)
  );

  const tasks: TodayTask[] = activeHabits.map(habit => {
    const completedToday = completedTodaySet.has(habit.id);

    const consecutiveCompletions = habit.currentStreak;
    const scaled = scaleDifficulty(
      habit,
      consecutiveCompletions,
      player.phase,
      stabilityScore
    );

    const priority = calculatePriority(habit, completedToday, stabilityScore);

    return {
      habit,
      completedToday,
      adjustedDuration: scaled.duration,
      difficultyLevel: scaled.difficultyLevel,
      adjustmentReason: scaled.reason,
      priority,
    };
  });

  tasks.sort((a, b) => b.priority - a.priority);

  return tasks;
}

export function completeTask(
  player: Player,
  habit: Habit,
  durationMinutes: number,
  allHabits: Habit[],
  existingBadges: Badge[],
  completions: HabitCompletion[]
): CompleteTaskResult {
  const today = new Date().toLocaleDateString("en-CA");
  const stabilityScore = player.stability?.score ?? 50;

  const momentumResult = calculateMomentumUpdate(habit, today, true);

  const xpEarned = calculateHabitXP(habit, momentumResult.momentum, momentumResult.newStreak);

  const statAmount = xpEarned / (50 + (player.stats[habit.stat] || 1) * 2);
  const statGain: { stat: StatName; amount: number } = {
    stat: habit.stat,
    amount: Math.round(statAmount * 100) / 100,
  };

  const totalCompletionsAll = allHabits.reduce((sum, h) => sum + h.totalCompletions, 0) + 1;

  const todayCompletions = completions.filter(c => {
    const d = c.completedAt ? new Date(c.completedAt).toLocaleDateString("en-CA") : null;
    return d === today;
  });
  const allCompletedToday = todayCompletions.length + 1 >= allHabits.filter(h => h.active).length;

  const badges = checkBadgeEligibility(
    { ...habit, totalCompletions: habit.totalCompletions + 1, currentStreak: momentumResult.newStreak, momentum: momentumResult.momentum },
    allHabits,
    existingBadges,
    totalCompletionsAll,
    allCompletedToday
  );

  return {
    xpEarned,
    statGain,
    newMomentum: momentumResult,
    badges,
    streakUpdate: {
      newStreak: momentumResult.newStreak,
      broken: momentumResult.streakBroken,
      graceDayUsed: momentumResult.graceDayUsed,
    },
    recoveryMode: momentumResult.recoveryMode,
  };
}

export function getPhaseAdjustedDuration(
  habit: Habit,
  playerPhase: number,
  stabilityScore: number
): { duration: number; difficultyLevel: number; reason: string } {
  const scaled = scaleDifficulty(
    habit,
    habit.currentStreak,
    playerPhase,
    stabilityScore
  );

  return {
    duration: scaled.duration,
    difficultyLevel: scaled.difficultyLevel,
    reason: scaled.reason,
  };
}

function calculatePriority(
  habit: Habit,
  completedToday: boolean,
  stabilityScore: number
): number {
  if (completedToday) return 0;

  let priority = 50;

  if (habit.currentStreak > 0) {
    priority += Math.min(20, habit.currentStreak * 2);
  }

  if (habit.momentum < 0.3) {
    priority += 15;
  }

  if (stabilityScore < 40) {
    if (habit.baseDurationMinutes <= 5) {
      priority += 10;
    }
  }

  const statPriority: Record<string, number> = {
    strength: 4,
    vitality: 3,
    sense: 2,
    agility: 1,
  };
  priority += statPriority[habit.stat] || 0;

  return priority;
}

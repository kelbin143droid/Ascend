import type { Habit, Badge, BadgeType } from "@shared/schema";
import { calculateXPMultiplier } from "./momentumEngine";

const BASE_HABIT_XP = 10;

export function calculateHabitXP(habit: Habit, momentum: number, streak: number): number {
  const multiplier = calculateXPMultiplier(momentum, streak);
  const difficultyBonus = 1 + (habit.difficultyLevel - 1) * 0.15;
  return Math.floor(BASE_HABIT_XP * multiplier * difficultyBonus);
}

export interface DailyBonusResult {
  earned: boolean;
  bonusXP: number;
  message: string;
}

export function checkDailyBonus(
  habitsCompletedToday: number,
  totalHabits: number
): DailyBonusResult {
  if (totalHabits === 0 || habitsCompletedToday < totalHabits) {
    return { earned: false, bonusXP: 0, message: "" };
  }
  const bonusXP = 25 + totalHabits * 5;
  return {
    earned: true,
    bonusXP,
    message: `Daily bonus! All ${totalHabits} habits completed — +${bonusXP} XP`,
  };
}

export interface WeeklyBonusResult {
  earned: boolean;
  bonusXP: number;
  perfectDays: number;
  message: string;
}

export function checkWeeklyBonus(
  completionsByDay: number[],
  totalHabitsPerDay: number
): WeeklyBonusResult {
  if (completionsByDay.length < 7 || totalHabitsPerDay === 0) {
    return { earned: false, bonusXP: 0, perfectDays: 0, message: "" };
  }

  const perfectDays = completionsByDay.filter(c => c >= totalHabitsPerDay).length;
  if (perfectDays >= 7) {
    const bonusXP = 100;
    return {
      earned: true,
      bonusXP,
      perfectDays,
      message: `Perfect week! 7/7 days completed — +${bonusXP} XP`,
    };
  }
  return { earned: false, bonusXP: 0, perfectDays, message: "" };
}

export interface BadgeDefinition {
  type: BadgeType;
  name: string;
  description: string;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { type: "first_habit", name: "First Step", description: "Completed your first habit" },
  { type: "streak_7", name: "Week Warrior", description: "Maintained a 7-day streak" },
  { type: "streak_14", name: "Fortnight Fighter", description: "Maintained a 14-day streak" },
  { type: "streak_30", name: "Monthly Master", description: "Maintained a 30-day streak" },
  { type: "streak_100", name: "Century Champion", description: "Maintained a 100-day streak" },
  { type: "all_stats_trained", name: "Well Rounded", description: "Completed habits in all 4 stat categories" },
  { type: "perfect_week", name: "Perfect Week", description: "Completed all habits every day for 7 days" },
  { type: "habit_master", name: "Habit Master", description: "Completed 100 total habit sessions" },
  { type: "consistency_king", name: "Momentum Master", description: "Reached blazing momentum on any habit" },
];

export function checkBadgeEligibility(
  habit: Habit,
  allHabits: Habit[],
  existingBadges: Badge[],
  totalCompletionsAllHabits: number,
  perfectWeek: boolean
): BadgeDefinition[] {
  const earnedTypes = new Set(existingBadges.map(b => b.badgeType));
  const newBadges: BadgeDefinition[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (earnedTypes.has(def.type)) continue;

    switch (def.type) {
      case "first_habit":
        if (habit.totalCompletions >= 1) newBadges.push(def);
        break;
      case "streak_7":
        if (habit.currentStreak >= 7) newBadges.push(def);
        break;
      case "streak_14":
        if (habit.currentStreak >= 14) newBadges.push(def);
        break;
      case "streak_30":
        if (habit.currentStreak >= 30) newBadges.push(def);
        break;
      case "streak_100":
        if (habit.currentStreak >= 100) newBadges.push(def);
        break;
      case "all_stats_trained": {
        const statsUsed = new Set(allHabits.filter(h => h.totalCompletions > 0).map(h => h.stat));
        if (statsUsed.size >= 4) newBadges.push(def);
        break;
      }
      case "perfect_week":
        if (perfectWeek) newBadges.push(def);
        break;
      case "habit_master":
        if (totalCompletionsAllHabits >= 100) newBadges.push(def);
        break;
      case "consistency_king":
        if (habit.momentum >= 0.9) newBadges.push(def);
        break;
    }
  }

  return newBadges;
}

export function getBadgeDefinitions(): BadgeDefinition[] {
  return [...BADGE_DEFINITIONS];
}

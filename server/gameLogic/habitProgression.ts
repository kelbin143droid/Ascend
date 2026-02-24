import type { Habit } from "@shared/schema";

const MIN_DURATION = 2;
const MAX_DURATION = 60;
const STREAK_SCALE_FACTOR = 0.15;
const MOMENTUM_DECAY = 0.85;
const MOMENTUM_GAIN = 0.3;
const GRACE_DAYS = 1;

export function calculateAdaptiveDuration(
  baseDuration: number,
  streak: number,
  difficultyLevel: number
): number {
  const streakBonus = Math.floor(streak * STREAK_SCALE_FACTOR * baseDuration);
  const difficultyMultiplier = 1 + (difficultyLevel - 1) * 0.1;
  const duration = Math.round((baseDuration + streakBonus) * difficultyMultiplier);
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, duration));
}

export function getProgressiveIntensity(streak: number, totalCompletions: number): number {
  if (totalCompletions >= 100 || streak >= 60) return 5;
  if (totalCompletions >= 50 || streak >= 30) return 4;
  if (totalCompletions >= 20 || streak >= 14) return 3;
  if (totalCompletions >= 7 || streak >= 7) return 2;
  return 1;
}

export function calculateMomentum(currentMomentum: number, completed: boolean): number {
  if (completed) {
    return Math.min(1, currentMomentum * MOMENTUM_DECAY + MOMENTUM_GAIN);
  }
  return Math.max(0, currentMomentum * MOMENTUM_DECAY);
}

export function shouldBreakStreak(
  lastCompletedDate: string | null,
  today: string,
  streakForgiveness: number
): { broken: boolean; graceDayUsed: boolean } {
  if (!lastCompletedDate) return { broken: false, graceDayUsed: false };

  const last = new Date(lastCompletedDate + "T00:00:00");
  const now = new Date(today + "T00:00:00");
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return { broken: false, graceDayUsed: false };

  const allowedGrace = GRACE_DAYS + Math.floor(streakForgiveness);
  if (diffDays <= 1 + allowedGrace) return { broken: false, graceDayUsed: true };

  return { broken: true, graceDayUsed: false };
}

export function calculateReducedDuration(currentDuration: number, baseDuration: number): number {
  const reduced = Math.round(currentDuration * 0.75);
  return Math.max(baseDuration, Math.max(MIN_DURATION, reduced));
}

export interface HabitStackSuggestion {
  afterHabitId: string;
  afterHabitName: string;
  suggestedName: string;
  suggestedStat: string;
  reason: string;
}

const STACK_SUGGESTIONS: Record<string, { stat: string; name: string; reason: string }[]> = {
  strength: [
    { stat: "vitality", name: "Deep Breathing", reason: "Cool down after exercise with breathing" },
    { stat: "agility", name: "Quick Stretch", reason: "Stretch after strength work to improve flexibility" },
  ],
  agility: [
    { stat: "sense", name: "Body Scan", reason: "Mindful awareness after stretching" },
    { stat: "vitality", name: "Hydration Check", reason: "Rehydrate after mobility work" },
  ],
  sense: [
    { stat: "vitality", name: "Gentle Walk", reason: "Light movement after meditation" },
    { stat: "strength", name: "Push-ups", reason: "Energize with quick exercise after focus" },
  ],
  vitality: [
    { stat: "sense", name: "Gratitude Journal", reason: "Reflect during recovery time" },
    { stat: "agility", name: "Morning Stretch", reason: "Light mobility during recovery" },
  ],
};

export function suggestHabitStacks(existingHabits: Habit[]): HabitStackSuggestion[] {
  const suggestions: HabitStackSuggestion[] = [];
  const existingNames = new Set(existingHabits.map(h => h.name.toLowerCase()));

  for (const habit of existingHabits) {
    const possibleStacks = STACK_SUGGESTIONS[habit.stat] || [];
    for (const stack of possibleStacks) {
      if (!existingNames.has(stack.name.toLowerCase())) {
        suggestions.push({
          afterHabitId: habit.id,
          afterHabitName: habit.name,
          suggestedName: stack.name,
          suggestedStat: stack.stat,
          reason: stack.reason,
        });
      }
    }
  }

  return suggestions.slice(0, 5);
}

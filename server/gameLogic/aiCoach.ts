import type { Habit, Player } from "@shared/schema";
import type { HabitCompletion } from "@shared/schema";

export interface CoachMessage {
  type: "motivation" | "suggestion" | "warning" | "celebration" | "check_in";
  title: string;
  message: string;
  priority: number;
}

export function generateCoachMessages(
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[]
): CoachMessage[] {
  const messages: CoachMessage[] = [];
  const now = new Date();
  const hour = now.getHours();
  const today = now.toLocaleDateString("en-CA");

  if (habits.length === 0) {
    messages.push({
      type: "suggestion",
      title: "Get Started",
      message: "Create your first habit to begin building your daily routine. Start small — even 2-3 minutes counts!",
      priority: 10,
    });
    return messages;
  }

  const todayCompletions = recentCompletions.filter(c => {
    const d = new Date(c.completedAt!);
    return d.toLocaleDateString("en-CA") === today;
  });
  const completedHabitIds = new Set(todayCompletions.map(c => c.habitId));
  const remainingHabits = habits.filter(h => h.active && !completedHabitIds.has(h.id));

  if (remainingHabits.length === 0 && habits.length > 0) {
    messages.push({
      type: "celebration",
      title: "All Done!",
      message: "You've completed all your habits for today. Outstanding work, Hunter!",
      priority: 9,
    });
  } else if (remainingHabits.length > 0) {
    if (hour >= 6 && hour < 12) {
      messages.push({
        type: "motivation",
        title: "Morning Momentum",
        message: `You have ${remainingHabits.length} habit${remainingHabits.length > 1 ? "s" : ""} left today. Morning sessions build the strongest habits — start with "${remainingHabits[0].name}".`,
        priority: 7,
      });
    } else if (hour >= 12 && hour < 18) {
      messages.push({
        type: "suggestion",
        title: "Midday Check-in",
        message: `${remainingHabits.length} habit${remainingHabits.length > 1 ? "s" : ""} remaining. A quick session now keeps your streak alive.`,
        priority: 6,
      });
    } else if (hour >= 18) {
      messages.push({
        type: "warning",
        title: "Evening Reminder",
        message: `Don't let today slip! ${remainingHabits.length} habit${remainingHabits.length > 1 ? "s" : ""} still waiting. Even a micro-session counts.`,
        priority: 8,
      });
    }
  }

  const highStreakHabits = habits.filter(h => h.currentStreak >= 7);
  if (highStreakHabits.length > 0) {
    const best = highStreakHabits.reduce((a, b) => a.currentStreak > b.currentStreak ? a : b);
    messages.push({
      type: "celebration",
      title: "Streak Fire",
      message: `"${best.name}" is on a ${best.currentStreak}-day streak! Keep the momentum going.`,
      priority: 5,
    });
  }

  const strugglingHabits = habits.filter(h => h.active && h.currentStreak === 0 && h.totalCompletions > 3);
  for (const habit of strugglingHabits.slice(0, 1)) {
    messages.push({
      type: "suggestion",
      title: "Try Shorter",
      message: `Having trouble with "${habit.name}"? Try reducing to just ${Math.max(2, Math.floor(habit.currentDurationMinutes * 0.5))} minutes. Small wins rebuild momentum.`,
      priority: 6,
    });
  }

  const statsUsed = new Set(habits.filter(h => h.totalCompletions > 0).map(h => h.stat));
  const allStats = ["strength", "agility", "sense", "vitality"];
  const missingStats = allStats.filter(s => !statsUsed.has(s as any));
  if (missingStats.length > 0 && habits.length >= 2) {
    const statLabels: Record<string, string> = {
      strength: "Strength (exercise)",
      agility: "Agility (yoga/flexibility)",
      sense: "Sense (meditation/focus)",
      vitality: "Vitality (recovery/health)",
    };
    messages.push({
      type: "suggestion",
      title: "Balance Your Training",
      message: `You haven't trained ${statLabels[missingStats[0]]} yet. Adding a micro-habit for it would round out your growth.`,
      priority: 4,
    });
  }

  if (player.streak >= 3) {
    messages.push({
      type: "motivation",
      title: "Building Momentum",
      message: `${player.streak}-day overall streak! Your consistency is paying off — your character grows stronger each day.`,
      priority: 3,
    });
  }

  if (hour >= 22 || hour < 6) {
    messages.push({
      type: "check_in",
      title: "Rest Well",
      message: "Recovery is part of growth. Make sure you're getting enough sleep — your Vitality depends on it.",
      priority: 2,
    });
  }

  return messages.sort((a, b) => b.priority - a.priority);
}

export function getDurationSuggestion(habit: Habit): { suggested: number; reason: string } {
  if (habit.currentStreak === 0 && habit.totalCompletions > 5) {
    const reduced = Math.max(2, Math.floor(habit.baseDurationMinutes * 0.75));
    return { suggested: reduced, reason: "Shorter duration to help restart your streak" };
  }

  if (habit.currentStreak >= 14 && habit.difficultyLevel < 5) {
    const increased = Math.min(60, Math.floor(habit.currentDurationMinutes * 1.15));
    return { suggested: increased, reason: "You're ready for a longer session" };
  }

  return { suggested: habit.currentDurationMinutes, reason: "Current duration is working well" };
}

export function getMotivationNudge(streak: number, missedDays: number): string {
  if (missedDays >= 3) {
    return "It's okay to miss days. What matters is starting again. Even 2 minutes today rebuilds your foundation.";
  }
  if (missedDays === 1) {
    return "You missed yesterday, but today is a fresh start. Your grace day keeps your streak alive!";
  }
  if (streak >= 30) {
    return "30+ days of consistency. You've proven this is part of who you are now. Keep going, Hunter.";
  }
  if (streak >= 14) {
    return "Two weeks strong! The habit is taking root. Each day it gets easier.";
  }
  if (streak >= 7) {
    return "One week down! Research shows it takes 21 days to form a habit — you're a third of the way there.";
  }
  if (streak >= 3) {
    return "Three days in a row! You're building momentum. Don't stop now.";
  }
  return "Every journey starts with a single step. Complete one habit today and you're on your way.";
}

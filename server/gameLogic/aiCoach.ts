import type { Habit, Player } from "@shared/schema";
import type { HabitCompletion } from "@shared/schema";
import { getMomentumTier, shouldTriggerRecovery } from "./momentumEngine";
import { getDifficultyLabel, getPhaseMaxDuration } from "./difficultyScaler";

export interface CoachMessage {
  type: "motivation" | "suggestion" | "warning" | "celebration" | "check_in" | "recovery" | "insight";
  title: string;
  message: string;
  priority: number;
  actionable?: boolean;
  action?: string;
}

export interface CoachChatResponse {
  reply: string;
  suggestions: string[];
  context: string;
}

const APP_KNOWLEDGE: Record<string, string> = {
  phases: "The game has 5 phases. You progress by maintaining consistency — completing habits regularly over time. Phase 1 is your starting point. Phase 2 requires ~57% completion rate over 7 days. Phase 3 needs 70%+ over 14 days. Phase 4 needs 75%+ over 21 days. Phase 5 needs 80%+ sustained over 45 days. Your stats, level, and completion rate all matter.",
  stats: "There are 4 stats: Strength (STR) for physical exercise, Agility (AGI) for flexibility/yoga, Sense (SEN) for meditation/focus, and Vitality (VIT) for recovery/health. Stats increase through task completion — not by allocating points.",
  momentum: "Momentum is a score from 0 to 1 that reflects your real consistency. It increases with each completion and decreases gradually with inactivity. Unlike streaks, momentum doesn't reset to zero from one miss. It drives your XP multiplier — higher momentum = more XP per habit.",
  streaks: "Streaks count consecutive days. Missing 1 day uses a grace day (streak preserved). Missing 2-3 days slightly reduces momentum. Missing 5+ days triggers recovery mode with micro-sessions. The system is forgiving — it's designed to help you bounce back.",
  habits: "Create habits linked to a stat. Durations are controlled automatically — they start short and grow as you build consistency. The DifficultyScaler adjusts everything based on your performance. No need to set difficulty manually.",
  difficulty: "Difficulty scales automatically within your phase. After 5 consecutive completions, duration increases by 1 minute. If you struggle (low momentum), it drops back to micro-sessions. The system floats within a range rather than making big jumps.",
  badges: "Earn badges at milestones: first completion, 7/14/30/100-day streaks, training all 4 stats, perfect weeks, reaching high momentum, and completing 100 total sessions.",
  recovery: "If you miss several days, don't worry. The system enters recovery mode: shorter sessions, gentler difficulty, and a focus on rebuilding momentum. Even 2-3 minutes counts. Consistency matters more than duration.",
  xp: "XP is earned by completing habits. Your XP multiplier is driven by momentum (not raw streak count). Higher momentum = higher multiplier (up to 3x). Daily and weekly bonuses add extra XP for completing all habits.",
  calendar: "The Sectograph shows your daily schedule as a circular clock. Blocks repeat daily by default. You can also use the full calendar for specific events.",
  trials: "Trials are multi-day challenges unlocked at Phase 4. They test your consistency and reward you with bonus XP and badges.",
};

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
      message: "Create your first habit to begin building your daily routine. Start small — even 2-3 minutes counts! The system will automatically scale up as you build consistency.",
      priority: 10,
      actionable: true,
      action: "create_habit",
    });
    return messages;
  }

  const todayCompletions = recentCompletions.filter(c => {
    const d = new Date(c.completedAt!);
    return d.toLocaleDateString("en-CA") === today;
  });
  const completedHabitIds = new Set(todayCompletions.map(c => c.habitId));
  const activeHabits = habits.filter(h => h.active);
  const remainingHabits = activeHabits.filter(h => !completedHabitIds.has(h.id));

  if (remainingHabits.length === 0 && activeHabits.length > 0) {
    messages.push({
      type: "celebration",
      title: "All Done!",
      message: "You've completed all your habits for today. Outstanding work, Hunter! Rest and recover — your stats are growing.",
      priority: 9,
    });
  } else if (remainingHabits.length > 0) {
    const recoveryHabits = remainingHabits.filter(h => {
      const recovery = shouldTriggerRecovery(h, today);
      return recovery.trigger;
    });

    if (recoveryHabits.length > 0) {
      const worst = recoveryHabits.reduce((a, b) => {
        const aMissed = shouldTriggerRecovery(a, today).missedDays;
        const bMissed = shouldTriggerRecovery(b, today).missedDays;
        return aMissed > bMissed ? a : b;
      });
      const recovery = shouldTriggerRecovery(worst, today);
      messages.push({
        type: "recovery",
        title: "Recovery Mode",
        message: `"${worst.name}" hasn't been done in ${recovery.missedDays} days. ${recovery.suggestion}`,
        priority: 9,
        actionable: true,
        action: "micro_session",
      });
    }

    if (hour >= 6 && hour < 12) {
      const bestFirst = remainingHabits.sort((a, b) => b.momentum - a.momentum)[0];
      messages.push({
        type: "motivation",
        title: "Morning Momentum",
        message: `${remainingHabits.length} habit${remainingHabits.length > 1 ? "s" : ""} today. Start with "${bestFirst.name}" — it has the highest momentum and will be easiest to maintain.`,
        priority: 7,
      });
    } else if (hour >= 12 && hour < 18) {
      messages.push({
        type: "suggestion",
        title: "Midday Check-in",
        message: `${remainingHabits.length} habit${remainingHabits.length > 1 ? "s" : ""} remaining. A quick session now keeps your momentum alive.`,
        priority: 6,
      });
    } else if (hour >= 18) {
      messages.push({
        type: "warning",
        title: "Evening Reminder",
        message: `Don't let today slip! ${remainingHabits.length} habit${remainingHabits.length > 1 ? "s" : ""} still waiting. Even a micro-session counts toward your momentum.`,
        priority: 8,
        actionable: true,
        action: "quick_complete",
      });
    }
  }

  const highMomentumHabits = habits.filter(h => h.momentum >= 0.7);
  if (highMomentumHabits.length > 0) {
    const best = highMomentumHabits.reduce((a, b) => a.momentum > b.momentum ? a : b);
    const tier = getMomentumTier(best.momentum);
    messages.push({
      type: "celebration",
      title: `${tier.label} Momentum`,
      message: `"${best.name}" is at ${Math.round(best.momentum * 100)}% momentum (${tier.label})! ${best.currentStreak > 0 ? `${best.currentStreak}-day streak.` : ""} Keep it going for maximum XP.`,
      priority: 5,
    });
  }

  const strugglingHabits = habits.filter(h => h.active && h.momentum < 0.2 && h.totalCompletions > 3);
  for (const habit of strugglingHabits.slice(0, 1)) {
    messages.push({
      type: "suggestion",
      title: "Try a Micro-Session",
      message: `"${habit.name}" needs attention. The system has reduced it to a micro-session. Just ${Math.max(2, Math.round(habit.baseDurationMinutes * 0.6))} minutes can restart your momentum.`,
      priority: 6,
      actionable: true,
      action: "micro_session",
    });
  }

  const statsUsed = new Set(habits.filter(h => h.totalCompletions > 0).map(h => h.stat));
  const allStats = ["strength", "agility", "sense", "vitality"];
  const missingStats = allStats.filter(s => !statsUsed.has(s as any));
  if (missingStats.length > 0 && habits.length >= 2) {
    const statLabels: Record<string, string> = {
      strength: "Strength (exercise)",
      agility: "Agility (flexibility)",
      sense: "Sense (meditation)",
      vitality: "Vitality (recovery)",
    };
    messages.push({
      type: "insight",
      title: "Balance Your Training",
      message: `You haven't trained ${statLabels[missingStats[0]]} yet. Adding a micro-habit rounds out your growth and unlocks the "Well Rounded" badge.`,
      priority: 4,
    });
  }

  const avgMomentum = habits.length > 0
    ? habits.reduce((sum, h) => sum + h.momentum, 0) / habits.length
    : 0;
  if (avgMomentum >= 0.5) {
    messages.push({
      type: "motivation",
      title: "Building Momentum",
      message: `Average momentum: ${Math.round(avgMomentum * 100)}%. Your consistency is paying off — your XP multiplier is ${(1 + avgMomentum * 1.5).toFixed(1)}x.`,
      priority: 3,
    });
  }

  if (hour >= 22 || hour < 6) {
    messages.push({
      type: "check_in",
      title: "Rest Well",
      message: "Recovery is part of growth. Sleep restores your Vitality and prepares you for tomorrow's training.",
      priority: 2,
    });
  }

  return messages.sort((a, b) => b.priority - a.priority);
}

export function getDurationSuggestion(habit: Habit, playerPhase: number): { suggested: number; reason: string } {
  const maxDuration = getPhaseMaxDuration(playerPhase);

  if (habit.momentum < 0.15 && habit.totalCompletions > 5) {
    const micro = Math.max(2, Math.round(habit.baseDurationMinutes * 0.5));
    return { suggested: micro, reason: "Micro-session to rebuild momentum" };
  }

  if (habit.currentStreak === 0 && habit.totalCompletions > 3) {
    const reduced = Math.max(2, Math.round(habit.baseDurationMinutes * 0.6));
    return { suggested: reduced, reason: "Shorter restart after break" };
  }

  if (habit.momentum >= 0.7 && habit.currentStreak >= 14) {
    const increased = Math.min(maxDuration, Math.round(habit.currentDurationMinutes * 1.1));
    return { suggested: increased, reason: "Ready for a slight increase" };
  }

  return { suggested: habit.currentDurationMinutes, reason: "Current duration is working well" };
}

export function getMotivationNudge(momentum: number, streak: number, missedDays: number): string {
  if (missedDays >= 5) {
    return "It's been a while, but that's okay. Your momentum is waiting. Even 2 minutes today starts the rebuild. The system has auto-adjusted to make it easy.";
  }
  if (missedDays >= 3) {
    return "A few days off — no big deal. Your momentum dipped slightly but hasn't reset. Jump back in with a micro-session.";
  }
  if (missedDays === 1) {
    return "You missed yesterday, but your grace day kept your streak alive! Jump back in today.";
  }

  const tier = getMomentumTier(momentum);
  if (tier.tier === "blazing") {
    return `Blazing momentum (${Math.round(momentum * 100)}%)! You're earning maximum XP. This consistency is transforming your character.`;
  }
  if (tier.tier === "strong") {
    return `Strong momentum! You're in the growth zone. Keep this up and you'll hit blazing momentum soon.`;
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
  return "Every journey starts with a single step. Complete one habit today and watch your momentum grow.";
}

export function handleCoachChat(
  question: string,
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[]
): CoachChatResponse {
  const q = question.toLowerCase().trim();

  for (const [topic, knowledge] of Object.entries(APP_KNOWLEDGE)) {
    if (q.includes(topic) || matchesTopic(q, topic)) {
      return {
        reply: knowledge,
        suggestions: getFollowUpSuggestions(topic),
        context: topic,
      };
    }
  }

  if (q.includes("how") && (q.includes("level") || q.includes("progress"))) {
    return {
      reply: `You're currently Level ${player.level} in Phase ${player.phase}. ${APP_KNOWLEDGE.phases} Focus on consistent daily completions to progress.`,
      suggestions: ["How does momentum work?", "What badges can I earn?", "How do I recover from missed days?"],
      context: "progression",
    };
  }

  if (q.includes("struggling") || q.includes("hard") || q.includes("can't") || q.includes("difficult") || q.includes("help")) {
    const lowestMomentum = habits.length > 0
      ? habits.reduce((a, b) => a.momentum < b.momentum ? a : b)
      : null;

    let advice = "Here are some tips:\n";
    advice += "1. The system auto-adjusts — if you're struggling, durations shrink automatically.\n";
    advice += "2. Try a micro-session (2-3 minutes). It still counts for momentum.\n";
    advice += "3. Focus on the easiest habit first to build a quick win.\n";
    if (lowestMomentum) {
      advice += `4. "${lowestMomentum.name}" has the lowest momentum (${Math.round(lowestMomentum.momentum * 100)}%). Start there with just ${Math.max(2, Math.round(lowestMomentum.baseDurationMinutes * 0.5))} minutes.`;
    }

    return {
      reply: advice,
      suggestions: ["How does recovery mode work?", "What's a micro-session?", "How do I build momentum?"],
      context: "help",
    };
  }

  if (q.includes("what") && (q.includes("do") || q.includes("should") || q.includes("next"))) {
    const today = new Date().toLocaleDateString("en-CA");
    const completedToday = new Set(
      recentCompletions
        .filter(c => new Date(c.completedAt!).toLocaleDateString("en-CA") === today)
        .map(c => c.habitId)
    );
    const remaining = habits.filter(h => h.active && !completedToday.has(h.id));

    if (remaining.length === 0) {
      return {
        reply: "You've completed all your habits for today! Rest and recover. Check back tomorrow to keep your momentum going.",
        suggestions: ["How is my momentum?", "What badges can I earn?", "Tell me about trials"],
        context: "completed",
      };
    }

    const sorted = remaining.sort((a, b) => b.momentum - a.momentum);
    return {
      reply: `You have ${remaining.length} habit${remaining.length > 1 ? "s" : ""} remaining today. I'd suggest starting with "${sorted[0].name}" (${sorted[0].currentDurationMinutes} min, ${Math.round(sorted[0].momentum * 100)}% momentum). It has the highest momentum so it'll feel easiest.`,
      suggestions: ["What if I struggle?", "How does difficulty work?", "Tell me about my stats"],
      context: "next_action",
    };
  }

  if (q.includes("mood") || q.includes("feel") || q.includes("tired") || q.includes("energy")) {
    if (q.includes("tired") || q.includes("low") || q.includes("bad")) {
      return {
        reply: "On low-energy days, the best strategy is a micro-session — just 2-3 minutes. It maintains your momentum without draining you. The system has already adjusted your difficulty to match. Remember: showing up matters more than performing.",
        suggestions: ["Start a micro-session", "What's my easiest habit?", "Tell me about recovery"],
        context: "mood_low",
      };
    }
    return {
      reply: "Great that you're checking in with how you feel! Your emotional state matters. On high-energy days, push a little harder. On low days, go for micro-sessions. The system adapts either way.",
      suggestions: ["What should I do today?", "How does adaptive difficulty work?", "Tell me about momentum"],
      context: "mood",
    };
  }

  const avgMomentum = habits.length > 0
    ? habits.reduce((sum, h) => sum + h.momentum, 0) / habits.length
    : 0;

  return {
    reply: `I can help with questions about the app, your progress, habits, phases, stats, momentum, badges, and more. You're at ${Math.round(avgMomentum * 100)}% average momentum in Phase ${player.phase}. What would you like to know?`,
    suggestions: ["How do phases work?", "What should I do today?", "How does momentum work?", "I'm struggling — help!"],
    context: "general",
  };
}

function matchesTopic(question: string, topic: string): boolean {
  const topicKeywords: Record<string, string[]> = {
    phases: ["phase", "unlock", "progress", "advance", "level up"],
    stats: ["stat", "str", "agi", "sen", "vit", "strength", "agility", "sense", "vitality"],
    momentum: ["momentum", "multiplier", "consistency"],
    streaks: ["streak", "grace", "miss", "forgive"],
    habits: ["habit", "routine", "daily"],
    difficulty: ["difficulty", "duration", "scale", "adjust", "harder", "easier"],
    badges: ["badge", "achievement", "reward", "unlock", "earn"],
    recovery: ["recovery", "come back", "restart", "missed", "break"],
    xp: ["xp", "experience", "points", "earn"],
    calendar: ["calendar", "schedule", "sectograph", "time"],
    trials: ["trial", "challenge"],
  };

  const keywords = topicKeywords[topic] || [];
  return keywords.some(kw => question.includes(kw));
}

function getFollowUpSuggestions(topic: string): string[] {
  const followUps: Record<string, string[]> = {
    phases: ["How do stats work?", "What's my current progress?", "How does momentum help?"],
    stats: ["How do phases work?", "What badges can I earn?", "Tell me about difficulty"],
    momentum: ["How do streaks work?", "What drives my XP?", "How do I recover momentum?"],
    streaks: ["How does momentum work?", "What about grace days?", "Tell me about recovery"],
    habits: ["How does difficulty scale?", "What about habit stacking?", "How do I earn XP?"],
    difficulty: ["How does momentum work?", "What about micro-sessions?", "Tell me about phases"],
    badges: ["How do I get more badges?", "What's my progress?", "Tell me about streaks"],
    recovery: ["How does momentum work?", "What's a micro-session?", "Tell me about streaks"],
    xp: ["How does momentum affect XP?", "What are daily bonuses?", "Tell me about badges"],
    calendar: ["How do habits work?", "Tell me about the schedule", "What should I do today?"],
    trials: ["How do I unlock trials?", "What are phases?", "Tell me about badges"],
  };
  return followUps[topic] || ["How do phases work?", "What should I do today?", "Tell me about momentum"];
}

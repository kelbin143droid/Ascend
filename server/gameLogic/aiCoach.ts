import type { Habit, Player } from "@shared/schema";
import type { HabitCompletion } from "@shared/schema";
import { PHASE_NAMES } from "@shared/schema";
import { getMomentumTier, shouldTriggerRecovery } from "./momentumEngine";
import { getDifficultyLabel, getPhaseMaxDuration } from "./difficultyScaler";
import { getStabilityTier } from "./stabilityEngine";

export interface CoachMessage {
  type: "motivation" | "suggestion" | "warning" | "celebration" | "check_in" | "recovery" | "insight" | "regression" | "stability";
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
  phases: "There are 5 phases: Stabilization, Foundation, Expansion, Optimization, and Sovereignty. Progression is driven by your Stability Score (0-100), not just time or streaks. You only see your current phase and the next unlock requirement. Stability Score must meet the threshold along with completion rate, level, and average stats.",
  stability: "Your Stability Score (0-100) combines: habit completion rate (35%), sleep consistency (20%), energy/recovery compliance (15%), emotional stability (15%), and task timing adherence (15%). It drives phase progression, regression, difficulty adjustments, and visual environment changes.",
  regression: "Regression is a recalibration tool, not a punishment. Soft regression: if stability drops below 40 for 2-3 days, difficulty auto-adjusts downward. Hard regression: if stability stays below 50 for 5 consecutive days, you drop one phase. The system explains this strategically — isolated failures don't cause regression.",
  stats: "There are 4 stats: Strength (STR) for physical exercise, Agility (AGI) for flexibility/yoga, Sense (SEN) for meditation/focus, and Vitality (VIT) for recovery/health. Stats increase only through task completion — never by allocating points.",
  momentum: "Momentum is a score from 0 to 1 that reflects your real consistency. It increases with each completion and decreases gradually with inactivity. Unlike streaks, momentum doesn't reset to zero from one miss. It drives your XP multiplier — higher momentum = more XP per habit.",
  streaks: "Streaks count consecutive days. Missing 1 day uses a grace day (streak preserved). Missing 2-3 days slightly reduces momentum. Missing 5+ days triggers recovery mode with micro-sessions. The system is forgiving — it's designed to help you bounce back.",
  habits: "Create habits linked to a stat. Durations are controlled automatically — they start short and grow as you build consistency. The system adjusts everything based on your performance and phase. No need to set difficulty manually.",
  difficulty: "Difficulty scales automatically based on your phase and stability. Phase 1: micro-sessions (2-5 min). Phase 2: moderate. Phase 3: flexible expansion. Phase 4: optional optimization. Phase 5: focus on consistency, not time. If stability drops, difficulty reduces to help recovery.",
  badges: "Earn badges at milestones: first completion, 7/14/30/100-day streaks, training all 4 stats, perfect weeks, reaching high momentum, and completing 100 total sessions.",
  recovery: "If you miss several days, don't worry. The system enters recovery mode: shorter sessions, gentler difficulty, and a focus on rebuilding momentum. Even 2-3 minutes counts. Consistency matters more than duration.",
  xp: "XP is earned by completing habits. Your XP multiplier is driven by momentum (not raw streak count). Higher momentum = higher multiplier (up to 3x). Daily and weekly bonuses add extra XP for completing all habits.",
  meditation: "Sense (meditation) tasks focus on mindfulness and focus. They can include guided visual cues and breathing patterns. Duration scales with your phase — start with 2-3 minute sessions in Phase 1.",
  vitality: "Vitality tasks focus on recovery, sleep, and health. The system recommends scheduling these in the evening or pre-bedtime when possible. Good vitality habits directly boost your sleep consistency score.",
  calendar: "The Sectograph shows your daily schedule as a circular clock. Blocks repeat daily by default. You can also use the full calendar for specific events.",
  trials: "Trials are multi-day challenges unlocked at Phase 4 (Optimization). They test your consistency and reward you with bonus XP and badges.",
  visuals: "The game world evolves with your phase. Phase 1: soft pastels, minimal environment. Phase 2: richer colors, minor upgrades. Phase 3: dynamic environment, medium aura. Phase 4: advanced, strong aura. Phase 5: epic, multi-layered aura. Visual changes also respond to your stability score.",
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
  const stability = player.stability;
  const stabilityScore = stability?.score ?? 50;
  const phaseName = PHASE_NAMES[player.phase] || `Phase ${player.phase}`;

  if (habits.length === 0) {
    messages.push({
      type: "suggestion",
      title: "Get Started",
      message: "Create your first habit to begin building your daily routine. Start small — even 2-3 minutes counts. The system will automatically scale up as you build consistency.",
      priority: 10,
      actionable: true,
      action: "create_habit",
    });
    return messages;
  }

  if (stability?.softRegressionActive) {
    messages.push({
      type: "regression",
      title: "Recalibration Active",
      message: `Your stability has been low recently. The system has reduced difficulty to help you rebuild. This is strategic — focus on completing shorter sessions consistently rather than pushing intensity.`,
      priority: 10,
    });
  }

  const stabilityTier = getStabilityTier(stabilityScore);
  if (stabilityScore < 40 && (stability?.consecutiveLowDays ?? 0) >= 3) {
    messages.push({
      type: "stability",
      title: "Stability Warning",
      message: `Stability at ${stabilityScore}/100 (${stabilityTier.label}). ${stability?.consecutiveLowDays ?? 0} consecutive low days. To prevent phase regression, focus on completing even one micro-session today. Small wins compound.`,
      priority: 9,
    });
  } else if (stabilityScore >= 70) {
    messages.push({
      type: "stability",
      title: `${stabilityTier.label} Stability`,
      message: `Stability at ${stabilityScore}/100. Your consistency is paying off. ${player.phase < 5 ? `Keep this up to progress toward ${PHASE_NAMES[player.phase + 1] || "the next phase"}.` : "You're in Sovereignty — maintain this level."}`,
      priority: 4,
    });
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
      title: "All Done",
      message: `All habits completed for today. Your stats are growing and stability is being reinforced. Rest well, ${phaseName} Hunter.`,
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
        title: "Morning Strategy",
        message: `${remainingHabits.length} habit${remainingHabits.length > 1 ? "s" : ""} today. Start with "${bestFirst.name}" — highest momentum, easiest to maintain.`,
        priority: 7,
      });
    } else if (hour >= 12 && hour < 18) {
      messages.push({
        type: "suggestion",
        title: "Midday Check-in",
        message: `${remainingHabits.length} habit${remainingHabits.length > 1 ? "s" : ""} remaining. A quick session now keeps your stability on track.`,
        priority: 6,
      });
    } else if (hour >= 18) {
      const hasVitality = remainingHabits.some(h => h.stat === "vitality");
      const vitalityNote = hasVitality ? " Consider starting with your Vitality habit — evening is ideal for recovery tasks." : "";
      messages.push({
        type: "warning",
        title: "Evening Strategy",
        message: `${remainingHabits.length} habit${remainingHabits.length > 1 ? "s" : ""} remaining.${vitalityNote} Even a micro-session preserves your momentum.`,
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
      message: `"${best.name}" at ${Math.round(best.momentum * 100)}% momentum (${tier.label}). ${best.currentStreak > 0 ? `${best.currentStreak}-day streak.` : ""} Maximum XP territory.`,
      priority: 5,
    });
  }

  const strugglingHabits = habits.filter(h => h.active && h.momentum < 0.2 && h.totalCompletions > 3);
  for (const habit of strugglingHabits.slice(0, 1)) {
    messages.push({
      type: "suggestion",
      title: "Micro-Session Available",
      message: `"${habit.name}" needs attention. Difficulty has been auto-reduced. ${Math.max(2, Math.round(habit.baseDurationMinutes * 0.6))} minutes can restart momentum.`,
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
      title: "Balance Training",
      message: `${statLabels[missingStats[0]]} hasn't been trained yet. Adding a micro-habit rounds out your growth and improves stability score.`,
      priority: 4,
    });
  }

  if (hour >= 20 || hour < 6) {
    const hasVitalityHabit = habits.some(h => h.stat === "vitality");
    messages.push({
      type: "check_in",
      title: "Rest Protocol",
      message: hasVitalityHabit
        ? "Good sleep directly improves your Vitality stat and sleep consistency score. Both feed into your overall stability."
        : "Recovery is part of growth. Consider adding a Vitality habit focused on sleep or evening wind-down.",
      priority: 2,
    });
  }

  return messages.sort((a, b) => {
    if (a.actionable && !b.actionable) return -1;
    if (!a.actionable && b.actionable) return 1;
    return b.priority - a.priority;
  });
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
    return "It's been a while. Your momentum has dipped but the system has auto-adjusted to make reentry easy. Even 2 minutes today starts the rebuild.";
  }
  if (missedDays >= 3) {
    return "A few days off — your momentum dipped slightly but hasn't reset. Jump back in with a micro-session. The system adapts to where you are.";
  }
  if (missedDays === 1) {
    return "You missed yesterday, but your grace day kept your streak alive. Back on track today.";
  }

  const tier = getMomentumTier(momentum);
  if (tier.tier === "blazing") {
    return `Blazing momentum (${Math.round(momentum * 100)}%). Maximum XP earnings. This consistency is transforming your character.`;
  }
  if (tier.tier === "strong") {
    return `Strong momentum. You're in the growth zone — push toward blazing for maximum returns.`;
  }
  if (streak >= 30) {
    return "30+ days of consistency. This is identity-level change. The habit is part of who you are now.";
  }
  if (streak >= 14) {
    return "Two weeks strong. The neural pathways are forming. Each day reinforces the pattern.";
  }
  if (streak >= 7) {
    return "One week in. Research shows 21 days to form a habit — you're a third of the way there.";
  }
  if (streak >= 3) {
    return "Three days in a row. Momentum is building. Don't stop now.";
  }
  return "Every journey starts with a single step. Complete one habit today and watch your momentum grow.";
}

export function getHomeInsight(
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[]
): { title: string; message: string; action?: string } {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA");
  const stabilityScore = player.stability?.score ?? 50;
  const stabilityTier = getStabilityTier(stabilityScore);
  const phaseName = PHASE_NAMES[player.phase] || `Phase ${player.phase}`;

  const todayCompletions = recentCompletions.filter(c => {
    const d = new Date(c.completedAt!);
    return d.toLocaleDateString("en-CA") === today;
  });
  const completedHabitIds = new Set(todayCompletions.map(c => c.habitId));
  const activeHabits = habits.filter(h => h.active);
  const remainingHabits = activeHabits.filter(h => !completedHabitIds.has(h.id));

  if (activeHabits.length === 0) {
    return {
      title: "Welcome, Hunter",
      message: "Create your first habit to begin your journey. Start with just 2-3 minutes — the system scales with you.",
      action: "create_habit",
    };
  }

  if (remainingHabits.length === 0) {
    return {
      title: "All Complete",
      message: `Great work today. Your stability is ${stabilityTier.label} (${stabilityScore}/100). Rest and recover, ${phaseName} Hunter.`,
    };
  }

  if (player.stability?.softRegressionActive) {
    const easiest = remainingHabits.sort((a, b) => b.momentum - a.momentum)[0];
    return {
      title: "Recovery Focus",
      message: `Difficulty has been reduced to help you rebuild. Start with "${easiest.name}" — just ${Math.max(2, Math.round(easiest.baseDurationMinutes * 0.6))} minutes.`,
      action: "start_habit",
    };
  }

  const sorted = remainingHabits.sort((a, b) => b.momentum - a.momentum);
  const next = sorted[0];

  return {
    title: `${remainingHabits.length} Habit${remainingHabits.length > 1 ? "s" : ""} Today`,
    message: `Start with "${next.name}" (${next.currentDurationMinutes} min). Stability: ${stabilityTier.label}. ${stabilityScore >= 70 ? "You're on track." : "Consistency builds momentum."}`,
    action: "start_habit",
  };
}

export function handleCoachChat(
  question: string,
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[]
): CoachChatResponse {
  const q = question.toLowerCase().trim();
  const stabilityScore = player.stability?.score ?? 50;
  const phaseName = PHASE_NAMES[player.phase] || `Phase ${player.phase}`;

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
    const nextPhaseReq = player.phase < 5 ? ` To reach ${PHASE_NAMES[player.phase + 1]}, maintain your Stability Score above the threshold while keeping completion rates high.` : "";
    return {
      reply: `You're Level ${player.level} in ${phaseName} (Phase ${player.phase}). Stability: ${stabilityScore}/100.${nextPhaseReq} Focus on consistent daily completions.`,
      suggestions: ["How does stability work?", "What causes regression?", "How does momentum work?"],
      context: "progression",
    };
  }

  if (q.includes("regress") || q.includes("drop") || q.includes("lost phase") || q.includes("went down")) {
    return {
      reply: APP_KNOWLEDGE.regression,
      suggestions: ["How do I rebuild stability?", "What's my stability score?", "How do phases work?"],
      context: "regression",
    };
  }

  if (q.includes("struggling") || q.includes("hard") || q.includes("can't") || q.includes("difficult") || q.includes("help")) {
    const lowestMomentum = habits.length > 0
      ? habits.reduce((a, b) => a.momentum < b.momentum ? a : b)
      : null;

    let advice = "Here's a strategic approach:\n";
    advice += "1. The system auto-adjusts — if stability is dropping, difficulty reduces automatically.\n";
    advice += "2. Try a micro-session (2-3 minutes). It still counts for momentum and stability.\n";
    advice += "3. Focus on the easiest habit first to build a quick win.\n";
    if (lowestMomentum) {
      advice += `4. "${lowestMomentum.name}" has the lowest momentum (${Math.round(lowestMomentum.momentum * 100)}%). Start there with just ${Math.max(2, Math.round(lowestMomentum.baseDurationMinutes * 0.5))} minutes.`;
    }
    if (stabilityScore < 50) {
      advice += `\n\nYour stability is at ${stabilityScore}/100. Prioritize consistency over intensity right now.`;
    }

    return {
      reply: advice,
      suggestions: ["How does recovery mode work?", "What's a micro-session?", "How do I improve stability?"],
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
        reply: `All habits completed for today. Rest and recover. Your stability is at ${stabilityScore}/100. Check back tomorrow to maintain momentum.`,
        suggestions: ["What's my stability?", "What badges can I earn?", "Tell me about my phase"],
        context: "completed",
      };
    }

    const sorted = remaining.sort((a, b) => b.momentum - a.momentum);
    const hour = new Date().getHours();
    const vitalityFirst = hour >= 20 && sorted.some(h => h.stat === "vitality");

    if (vitalityFirst) {
      const vHabit = sorted.find(h => h.stat === "vitality")!;
      return {
        reply: `Evening is ideal for Vitality tasks. Start with "${vHabit.name}" (${vHabit.currentDurationMinutes} min). ${remaining.length} habit${remaining.length > 1 ? "s" : ""} remaining total.`,
        suggestions: ["What if I struggle?", "How does stability work?", "Tell me about meditation"],
        context: "next_action",
      };
    }

    return {
      reply: `${remaining.length} habit${remaining.length > 1 ? "s" : ""} remaining. Start with "${sorted[0].name}" (${sorted[0].currentDurationMinutes} min, ${Math.round(sorted[0].momentum * 100)}% momentum). Highest momentum = easiest to maintain.`,
      suggestions: ["What if I struggle?", "How does difficulty work?", "Tell me about my stats"],
      context: "next_action",
    };
  }

  if (q.includes("mood") || q.includes("feel") || q.includes("tired") || q.includes("energy") || q.includes("stress") || q.includes("anxious")) {
    if (q.includes("tired") || q.includes("low") || q.includes("bad") || q.includes("stress") || q.includes("anxious")) {
      return {
        reply: "On low-energy days, the strategic move is a micro-session — 2-3 minutes. It maintains momentum without draining you. The system has already adjusted difficulty. Showing up matters more than performing. Your emotional state feeds into your stability score, so be honest with yourself.",
        suggestions: ["Start a micro-session", "What's my easiest habit?", "Tell me about recovery"],
        context: "mood_low",
      };
    }
    return {
      reply: "Checking in with how you feel is important. Your emotional state contributes to your stability score. On high-energy days, push a little harder. On low days, go for micro-sessions. The system adapts either way.",
      suggestions: ["What should I do today?", "How does stability work?", "Tell me about momentum"],
      context: "mood",
    };
  }

  const avgMomentum = habits.length > 0
    ? habits.reduce((sum, h) => sum + h.momentum, 0) / habits.length
    : 0;

  return {
    reply: `I can help with questions about stability, phases, habits, stats, momentum, regression, badges, and more. You're in ${phaseName} at ${stabilityScore}/100 stability with ${Math.round(avgMomentum * 100)}% average momentum. What would you like to know?`,
    suggestions: ["How does stability work?", "What should I do today?", "How do phases work?", "I'm struggling — help!"],
    context: "general",
  };
}

function matchesTopic(question: string, topic: string): boolean {
  const topicKeywords: Record<string, string[]> = {
    phases: ["phase", "unlock", "advance", "evolve", "evolution"],
    stability: ["stability", "stable", "stability score", "score"],
    regression: ["regress", "drop", "lost phase", "went down", "demote"],
    stats: ["stat", "str", "agi", "sen", "vit", "strength", "agility", "sense", "vitality"],
    momentum: ["momentum", "multiplier", "consistency"],
    streaks: ["streak", "grace", "miss", "forgive"],
    habits: ["habit", "routine", "daily"],
    difficulty: ["difficulty", "duration", "scale", "adjust", "harder", "easier"],
    badges: ["badge", "achievement", "reward", "earn"],
    recovery: ["recovery", "come back", "restart", "missed", "break"],
    xp: ["xp", "experience", "points", "earn"],
    meditation: ["meditat", "mindful", "breath", "focus", "sense training"],
    vitality: ["vitality", "sleep", "recover", "health", "evening", "bedtime"],
    calendar: ["calendar", "schedule", "sectograph", "time"],
    trials: ["trial", "challenge"],
    visuals: ["visual", "environment", "aura", "particle", "world", "avatar", "theme"],
  };

  const keywords = topicKeywords[topic] || [];
  return keywords.some(kw => question.includes(kw));
}

function getFollowUpSuggestions(topic: string): string[] {
  const followUps: Record<string, string[]> = {
    phases: ["How does stability work?", "What causes regression?", "Tell me about visuals"],
    stability: ["How do phases work?", "What causes regression?", "How do I improve stability?"],
    regression: ["How does stability work?", "How do I rebuild?", "Tell me about phases"],
    stats: ["How do phases work?", "What badges can I earn?", "Tell me about difficulty"],
    momentum: ["How do streaks work?", "What drives my XP?", "How do I recover momentum?"],
    streaks: ["How does momentum work?", "What about grace days?", "Tell me about recovery"],
    habits: ["How does difficulty scale?", "What about habit stacking?", "How do I earn XP?"],
    difficulty: ["How does stability work?", "What about micro-sessions?", "Tell me about phases"],
    badges: ["How do I get more badges?", "What's my progress?", "Tell me about streaks"],
    recovery: ["How does momentum work?", "What's a micro-session?", "How does stability help?"],
    xp: ["How does momentum affect XP?", "What are daily bonuses?", "Tell me about badges"],
    meditation: ["How does Sense stat work?", "Tell me about difficulty scaling", "What about vitality?"],
    vitality: ["When should I schedule vitality?", "How does sleep affect stability?", "Tell me about meditation"],
    calendar: ["How do habits work?", "Tell me about the schedule", "What should I do today?"],
    trials: ["How do I unlock trials?", "What are phases?", "Tell me about badges"],
    visuals: ["How do phases work?", "What changes at each phase?", "Tell me about stability"],
  };
  return followUps[topic] || ["How does stability work?", "What should I do today?", "Tell me about phases"];
}

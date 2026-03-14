import type { Habit, Player } from "@shared/schema";
import type { HabitCompletion } from "@shared/schema";
import { PHASE_NAMES } from "@shared/schema";
import { getMomentumTier, shouldTriggerRecovery } from "./momentumEngine";
import { getDifficultyLabel, getPhaseMaxDuration } from "./difficultyScaler";
import { getStabilityTier } from "./stabilityEngine";
import { applyLanguageStage, type LanguageStage } from "./languageStage";

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

export interface BehavioralAnchorData {
  sessionId: string;
  completedAt: string;
  hour: number;
  minute: number;
  durationMinutes: number;
}

const BANNED_PHRASES = [
  "you failed",
  "you missed your task",
  "you should",
  "you need to",
  "you must",
  "you didn't",
  "you forgot",
  "you haven't been",
  "you're falling behind",
  "you're slacking",
  "disappointing",
];

function sanitizeCoachText(text: string): string {
  let result = text;
  for (const phrase of BANNED_PHRASES) {
    const regex = new RegExp(phrase, "gi");
    result = result.replace(regex, "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

function detectAnchorClusters(anchors: BehavioralAnchorData[]): { hour: number; count: number; label: string }[] {
  if (anchors.length < 2) return [];
  const hourBuckets: Record<number, number> = {};
  for (const a of anchors) {
    const bucket = a.hour;
    hourBuckets[bucket] = (hourBuckets[bucket] || 0) + 1;
  }
  const clusters: { hour: number; count: number; label: string }[] = [];
  for (const [hourStr, count] of Object.entries(hourBuckets)) {
    if (count >= 2) {
      const hour = parseInt(hourStr);
      let label: string;
      if (hour >= 5 && hour < 12) label = "morning";
      else if (hour >= 12 && hour < 17) label = "afternoon";
      else if (hour >= 17 && hour < 21) label = "evening";
      else label = "night";
      clusters.push({ hour, count, label });
    }
  }
  return clusters.sort((a, b) => b.count - a.count);
}

function formatTimeLabel(hour: number): string {
  const h = hour % 12 || 12;
  const p = hour < 12 ? "AM" : "PM";
  return `${h} ${p}`;
}

const APP_KNOWLEDGE: Record<string, string> = {
  phases: "There are 5 phases: Stabilization, Foundation, Expansion, Optimization, and Sovereignty. Progression follows your Stability Score — consistency drives advancement. Each phase unlocks new capabilities as your rhythm deepens.",
  stability: "Your Stability Score reflects daily completion rate, sleep consistency, energy levels, emotional state, and timing. It's a mirror of your overall rhythm. Small, consistent actions raise it steadily.",
  regression: "Regression is a recalibration, not a setback. When stability dips, the system eases difficulty to help you find your footing. Isolated low days don't cause regression — the system looks at patterns, not single moments.",
  stats: "Four growth areas: Strength (physical), Agility (flexibility), Sense (meditation/focus), and Vitality (recovery/health). Each grows through completing sessions — real actions, real progress.",
  momentum: "Momentum reflects your recent consistency. Unlike streaks, it doesn't reset from one missed day — it adjusts gradually. Higher momentum means greater returns on each session.",
  streaks: "Streaks track consecutive active days. Missing one day uses a grace day. Missing a few days lowers momentum slightly but doesn't erase your progress. The system is built for human rhythm, not perfection.",
  habits: "Daily rituals are the foundation. Durations scale automatically based on your consistency and phase. Start small — even 2-3 minutes counts. The system grows with you.",
  difficulty: "Difficulty adapts to where you are. Early phases focus on micro-sessions. As stability builds, sessions grow naturally. If things get hard, difficulty reduces to meet you where you are.",
  badges: "Milestones mark real achievements: first completion, streak milestones, balanced growth, perfect weeks. Each one reflects genuine progress.",
  recovery: "After a break, the system meets you where you are. Shorter sessions, gentler pacing. Even 2-3 minutes rebuilds momentum. Returning is always welcomed.",
  xp: "Experience grows from completing sessions. Your momentum multiplier rewards consistency — steady rhythm earns more than occasional bursts.",
  meditation: "Sense training deepens focus and awareness. Sessions include guided visual cues and breathing. Duration scales with your readiness.",
  vitality: "Vitality sessions support recovery, sleep, and health. Evening sessions work well for winding down. Good recovery directly strengthens your stability.",
  calendar: "The Sectograph maps your day as a 24-hour circle. It shows your rhythm, free windows, and where your resets naturally fall.",
  trials: "Trials are multi-day challenges that test and reward sustained consistency. They unlock when your foundation is strong.",
  visuals: "Your environment evolves with your phase. Deeper consistency reveals richer visual layers — a reflection of inner growth made visible.",
};

export function generateCoachMessages(
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[],
  anchors?: BehavioralAnchorData[]
): CoachMessage[] {
  const messages: CoachMessage[] = [];
  const now = new Date();
  const hour = now.getHours();
  const today = now.toLocaleDateString("en-CA");
  const stability = player.stability;
  const stabilityScore = stability?.score ?? 50;

  if (habits.length === 0) {
    messages.push({
      type: "suggestion",
      title: "Begin Here",
      message: "A single small action is all it takes to start. Even 2-3 minutes creates the foundation everything else builds on.",
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
      message: "Stability dipped recently. The system has eased difficulty to help you rebuild. Short, consistent sessions will restore your rhythm naturally.",
      priority: 10,
    });
  }

  const stabilityTier = getStabilityTier(stabilityScore);
  if (stabilityScore < 40 && (stability?.consecutiveLowDays ?? 0) >= 3) {
    messages.push({
      type: "stability",
      title: "Stability Check",
      message: `Stability at ${stabilityScore}/100. A few low days in a row — this is where a single micro-session makes the most difference. One action today shifts the pattern.`,
      priority: 9,
    });
  } else if (stabilityScore >= 70) {
    messages.push({
      type: "stability",
      title: `${stabilityTier.label} Stability`,
      message: `Stability at ${stabilityScore}/100. Your consistency is compounding. ${player.phase < 5 ? "This rhythm leads to the next phase." : "Sovereignty is sustained through this kind of steadiness."}`,
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
      title: "All Complete",
      message: "Every session done for today. Rest is part of the system — let tomorrow's strength build from tonight's recovery.",
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
        title: "Gentle Restart",
        message: `"${worst.name}" has been resting for ${recovery.missedDays} days. ${recovery.suggestion} Returning to it — even briefly — restores the connection.`,
        priority: 9,
        actionable: true,
        action: "micro_session",
      });
    }

    if (hour >= 6 && hour < 12) {
      const bestFirst = remainingHabits.sort((a, b) => b.momentum - a.momentum)[0];
      messages.push({
        type: "motivation",
        title: "Morning Rhythm",
        message: `${remainingHabits.length} session${remainingHabits.length > 1 ? "s" : ""} ahead. "${bestFirst.name}" has the strongest momentum — starting there builds on what's already working.`,
        priority: 7,
      });
    } else if (hour >= 12 && hour < 18) {
      messages.push({
        type: "suggestion",
        title: "Midday Window",
        message: `${remainingHabits.length} session${remainingHabits.length > 1 ? "s" : ""} remaining. A short session now keeps the rhythm steady.`,
        priority: 6,
      });
    } else if (hour >= 18) {
      const hasVitality = remainingHabits.some(h => h.stat === "vitality");
      const note = hasVitality ? " Evening is natural territory for recovery sessions." : "";
      messages.push({
        type: "suggestion",
        title: "Evening Window",
        message: `${remainingHabits.length} session${remainingHabits.length > 1 ? "s" : ""} remaining.${note} Even a few minutes preserves what you've built.`,
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
      message: `"${best.name}" at ${Math.round(best.momentum * 100)}% momentum. ${best.currentStreak > 0 ? `${best.currentStreak} days in rhythm.` : ""} This consistency compounds.`,
      priority: 5,
    });
  }

  const strugglingHabits = habits.filter(h => h.active && h.momentum < 0.2 && h.totalCompletions > 3);
  for (const habit of strugglingHabits.slice(0, 1)) {
    messages.push({
      type: "suggestion",
      title: "Micro-Session Available",
      message: `"${habit.name}" could use attention. Difficulty has been eased. ${Math.max(2, Math.round(habit.baseDurationMinutes * 0.6))} minutes reconnects the thread.`,
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
      strength: "Strength (physical)",
      agility: "Agility (flexibility)",
      sense: "Sense (focus/meditation)",
      vitality: "Vitality (recovery)",
    };
    messages.push({
      type: "insight",
      title: "Growth Balance",
      message: `${statLabels[missingStats[0]]} is unexplored. Adding even a small session rounds out your development and strengthens overall stability.`,
      priority: 4,
    });
  }

  if (anchors && anchors.length > 0) {
    const clusters = detectAnchorClusters(anchors);
    if (clusters.length > 0) {
      const top = clusters[0];
      messages.push({
        type: "insight",
        title: "Pattern Noticed",
        message: `Your resets tend to happen in the ${top.label}, around ${formatTimeLabel(top.hour)}. This may be your natural reset window — the system adapts to these rhythms.`,
        priority: 3,
      });
    }
  }

  if (hour >= 20 || hour < 6) {
    const hasVitalityHabit = habits.some(h => h.stat === "vitality");
    messages.push({
      type: "check_in",
      title: "Rest Protocol",
      message: hasVitalityHabit
        ? "Good sleep strengthens your Vitality and stability. Both feed into tomorrow's readiness."
        : "Recovery is part of growth. The system recognizes rest as an active contribution.",
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
    return { suggested: micro, reason: "Micro-session to gently rebuild momentum" };
  }

  if (habit.currentStreak === 0 && habit.totalCompletions > 3) {
    const reduced = Math.max(2, Math.round(habit.baseDurationMinutes * 0.6));
    return { suggested: reduced, reason: "Shorter restart — ease back in" };
  }

  if (habit.momentum >= 0.7 && habit.currentStreak >= 14) {
    const increased = Math.min(maxDuration, Math.round(habit.currentDurationMinutes * 1.1));
    return { suggested: increased, reason: "Your consistency supports a slight increase" };
  }

  return { suggested: habit.currentDurationMinutes, reason: "Current duration is working well" };
}

export function getMotivationNudge(momentum: number, streak: number, missedDays: number): string {
  if (missedDays >= 5) {
    return "Momentum cooled over several days. The system has adjusted to make reentry gentle. Even 2 minutes today restores the thread.";
  }
  if (missedDays >= 3) {
    return "A few days away. Momentum dipped but hasn't reset — it adjusts gradually. A micro-session brings you back into rhythm.";
  }
  if (missedDays === 1) {
    return "Momentum cooled yesterday. Returning today restores your rhythm.";
  }

  const tier = getMomentumTier(momentum);
  if (tier.tier === "blazing") {
    return `Blazing momentum at ${Math.round(momentum * 100)}%. Your consistency is transforming into something lasting.`;
  }
  if (tier.tier === "strong") {
    return "Strong momentum. Each session deepens the pattern.";
  }
  if (streak >= 30) {
    return "30+ days. This isn't just a habit anymore — it's becoming part of who you are.";
  }
  if (streak >= 14) {
    return "Two weeks of rhythm. The pattern is forming. Each day reinforces it.";
  }
  if (streak >= 7) {
    return "One week in. Your rhythm is forming.";
  }
  if (streak >= 3) {
    return "Three days in rhythm. Small steps compound over time.";
  }
  return "Every rhythm begins with a single action. One session today starts the pattern.";
}

export function getHomeInsight(
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[],
  languageStage: LanguageStage = 4,
  anchors?: BehavioralAnchorData[]
): { title: string; message: string; action?: string } {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA");
  const hour = now.getHours();
  const stabilityScore = player.stability?.score ?? 50;

  const todayCompletions = recentCompletions.filter(c => {
    const d = new Date(c.completedAt!);
    return d.toLocaleDateString("en-CA") === today;
  });
  const completedHabitIds = new Set(todayCompletions.map(c => c.habitId));
  const activeHabits = habits.filter(h => h.active);
  const remainingHabits = activeHabits.filter(h => !completedHabitIds.has(h.id));

  const ls = (text: string) => applyLanguageStage(text, languageStage);

  if (activeHabits.length === 0) {
    return {
      title: "Coach",
      message: ls("One small step begins everything."),
      action: "create_habit",
    };
  }

  if (remainingHabits.length === 0) {
    const doneMessages = [
      "All sessions complete. Rest builds tomorrow's strength.",
      "You showed up today. That compounds over time.",
      "Recovery is part of the system. Let it work.",
    ];
    return {
      title: "Coach",
      message: ls(doneMessages[todayCompletions.length % doneMessages.length]),
    };
  }

  if (player.stability?.softRegressionActive) {
    return {
      title: "Coach",
      message: ls("A short session now rebuilds momentum gently."),
      action: "start_habit",
    };
  }

  const next = remainingHabits.sort((a, b) => b.momentum - a.momentum)[0];
  const completedCount = todayCompletions.length;

  if (anchors && anchors.length > 0) {
    const clusters = detectAnchorClusters(anchors);
    if (clusters.length > 0 && Math.abs(clusters[0].hour - hour) <= 1) {
      return {
        title: "Coach",
        message: ls("This is around the time your resets naturally happen. Good moment to begin."),
        action: "start_habit",
      };
    }
  }

  const dayIndex = now.getDate() % 4;

  if (completedCount === 0) {
    const startMessages = [
      "Begin with a small action.",
      `A ${next.currentDurationMinutes}-minute session shifts your state.`,
      "One action starts the rhythm.",
      hour < 12 ? "Morning sessions set the tone." : "Any moment is the right moment to continue.",
    ];
    return {
      title: "Coach",
      message: ls(startMessages[dayIndex]),
      action: "start_habit",
    };
  }

  const flowMessages = [
    "A short session now keeps the rhythm steady.",
    `${remainingHabits.length} session${remainingHabits.length > 1 ? "s" : ""} left. Keep the flow.`,
    stabilityScore >= 70 ? "Your consistency is compounding." : "Each action strengthens your stability.",
  ];
  return {
    title: "Coach",
    message: ls(flowMessages[completedCount % flowMessages.length]),
    action: "start_habit",
  };
}

export function handleCoachChat(
  question: string,
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[],
  languageStage: LanguageStage = 4,
  anchors?: BehavioralAnchorData[]
): CoachChatResponse {
  const q = question.toLowerCase().trim();
  const stabilityScore = player.stability?.score ?? 50;
  const phaseName = PHASE_NAMES[player.phase] || `Phase ${player.phase}`;
  const ls = (text: string) => sanitizeCoachText(applyLanguageStage(text, languageStage));

  for (const [topic, knowledge] of Object.entries(APP_KNOWLEDGE)) {
    if (q.includes(topic) || matchesTopic(q, topic)) {
      return {
        reply: ls(knowledge),
        suggestions: getFollowUpSuggestions(topic, languageStage),
        context: topic,
      };
    }
  }

  if (q.includes("how") && (q.includes("level") || q.includes("progress"))) {
    const nextPhaseNote = player.phase < 5 ? ` Consistent stability leads toward ${PHASE_NAMES[player.phase + 1]}.` : "";
    return {
      reply: ls(`Level ${player.level} in ${phaseName}. Stability: ${stabilityScore}/100.${nextPhaseNote} Steady daily action is the path.`),
      suggestions: getStagedSuggestions(["How does stability work?", "Tell me about momentum", "What are phases?"], languageStage),
      context: "progression",
    };
  }

  if (q.includes("regress") || q.includes("drop") || q.includes("lost phase") || q.includes("went down")) {
    return {
      reply: ls("Regression is a recalibration, not a punishment. The system eases difficulty when stability dips, creating space to rebuild. Isolated low days don't cause regression — it looks at patterns. A single session today starts the recovery."),
      suggestions: getStagedSuggestions(["How do I rebuild?", "What's my stability?", "Tell me about phases"], languageStage),
      context: "regression",
    };
  }

  if (q.includes("lazy") || q.includes("unmotivated") || q.includes("procrastinat")) {
    return {
      reply: ls("Low energy days happen. Your system may just need a reset. Would you like to begin with a 2-minute session? Even that small action shifts the pattern."),
      suggestions: getStagedSuggestions(["Start a micro-session", "How does recovery work?", "Tell me about momentum"], languageStage),
      context: "mood_low",
    };
  }

  if (q.includes("struggling") || q.includes("hard") || q.includes("can't") || q.includes("difficult") || q.includes("help")) {
    const lowestMomentum = habits.length > 0
      ? habits.reduce((a, b) => a.momentum < b.momentum ? a : b)
      : null;

    let reply = "Difficult periods are part of the process, not a sign of failure.\n\n";
    reply += "The system has already adjusted difficulty to meet you where you are. ";
    reply += "A micro-session — even 2-3 minutes — maintains the connection.\n\n";
    if (lowestMomentum) {
      reply += `"${lowestMomentum.name}" could use some attention. Starting there with just ${Math.max(2, Math.round(lowestMomentum.baseDurationMinutes * 0.5))} minutes reconnects the thread.`;
    }
    if (stabilityScore < 50) {
      reply += `\n\nStability is at ${stabilityScore}/100. Consistency matters more than intensity right now.`;
    }

    return {
      reply: ls(reply),
      suggestions: getStagedSuggestions(["Start a micro-session", "How does recovery work?", "Tell me about momentum"], languageStage),
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
        reply: ls("All sessions complete for today. Rest and recovery now. Let tomorrow's strength build from tonight's stillness."),
        suggestions: getStagedSuggestions(["What's my stability?", "Tell me about my progress", "How do phases work?"], languageStage),
        context: "completed",
      };
    }

    const sorted = remaining.sort((a, b) => b.momentum - a.momentum);
    const hour = new Date().getHours();
    const vitalityFirst = hour >= 20 && sorted.some(h => h.stat === "vitality");

    if (vitalityFirst) {
      const vHabit = sorted.find(h => h.stat === "vitality")!;
      return {
        reply: ls(`Evening is natural territory for recovery. "${vHabit.name}" (${vHabit.currentDurationMinutes} min) aligns well with this time. ${remaining.length} session${remaining.length > 1 ? "s" : ""} remaining.`),
        suggestions: getStagedSuggestions(["How does vitality work?", "Tell me about stability", "What about meditation?"], languageStage),
        context: "next_action",
      };
    }

    let anchorNote = "";
    if (anchors && anchors.length > 0) {
      const clusters = detectAnchorClusters(anchors);
      if (clusters.length > 0 && Math.abs(clusters[0].hour - hour) <= 1) {
        anchorNote = " This is close to your natural reset time — good timing.";
      }
    }

    return {
      reply: ls(`${remaining.length} session${remaining.length > 1 ? "s" : ""} remaining. "${sorted[0].name}" has the strongest momentum (${Math.round(sorted[0].momentum * 100)}%) — building on what's working.${anchorNote}`),
      suggestions: getStagedSuggestions(["How does momentum work?", "I'm struggling", "Tell me about my stats"], languageStage),
      context: "next_action",
    };
  }

  if (q.includes("mood") || q.includes("feel") || q.includes("tired") || q.includes("energy") || q.includes("stress") || q.includes("anxious")) {
    if (q.includes("tired") || q.includes("low") || q.includes("bad") || q.includes("stress") || q.includes("anxious")) {
      return {
        reply: ls("Low energy days happen. Your system may just need a reset. A micro-session — 2-3 minutes — maintains momentum without draining you. The system has already adjusted. Showing up matters more than performing."),
        suggestions: getStagedSuggestions(["Start a micro-session", "What's my easiest session?", "Tell me about recovery"], languageStage),
        context: "mood_low",
      };
    }
    return {
      reply: ls("Checking in with how you feel is valuable. On high-energy days, lean into it. On low days, micro-sessions keep the connection alive. The system adapts either way."),
      suggestions: getStagedSuggestions(["What's next for today?", "How does stability work?", "Tell me about momentum"], languageStage),
      context: "mood",
    };
  }

  if (q.includes("anchor") || q.includes("reset") || q.includes("pattern") || q.includes("rhythm") || q.includes("when do i")) {
    if (anchors && anchors.length > 0) {
      const clusters = detectAnchorClusters(anchors);
      if (clusters.length > 0) {
        const top = clusters[0];
        return {
          reply: ls(`Your resets tend to happen in the ${top.label}, around ${formatTimeLabel(top.hour)}. This pattern is your natural rhythm emerging. The system uses these anchors to understand when you're most likely to engage.`),
          suggestions: getStagedSuggestions(["Tell me about the Sectograph", "What's my stability?", "How does momentum work?"], languageStage),
          context: "anchors",
        };
      }
      return {
        reply: ls(`You have ${anchors.length} reset marker${anchors.length > 1 ? "s" : ""} recorded. As more accumulate, patterns will emerge — the system learns when you naturally show up.`),
        suggestions: getStagedSuggestions(["What's next for today?", "How does stability work?", "Tell me about phases"], languageStage),
        context: "anchors",
      };
    }
    return {
      reply: ls("Your resets will start appearing on the timeline as you complete sessions. Over time, they reveal your natural rhythm."),
      suggestions: getStagedSuggestions(["How does the Sectograph work?", "What's next?", "Tell me about stability"], languageStage),
      context: "anchors",
    };
  }

  const avgMomentum = habits.length > 0
    ? habits.reduce((sum, h) => sum + h.momentum, 0) / habits.length
    : 0;

  return {
    reply: ls(`You're in ${phaseName} with ${stabilityScore}/100 stability and ${Math.round(avgMomentum * 100)}% average momentum. I can help with stability, phases, habits, stats, momentum, recovery, and your daily rhythm. What's on your mind?`),
    suggestions: getStagedSuggestions(["How does stability work?", "What's next for today?", "I'm struggling", "Tell me about phases"], languageStage),
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

function getStagedSuggestions(suggestions: string[], stage: LanguageStage): string[] {
  return suggestions.map(s => applyLanguageStage(s, stage));
}

function getFollowUpSuggestions(topic: string, stage: LanguageStage): string[] {
  const followUps: Record<string, string[]> = {
    phases: ["How does stability work?", "What causes regression?", "Tell me about visuals"],
    stability: ["How do phases work?", "What causes regression?", "How do I improve stability?"],
    regression: ["How does stability work?", "How do I rebuild?", "Tell me about phases"],
    stats: ["How do phases work?", "What badges can I earn?", "Tell me about difficulty"],
    momentum: ["How do streaks work?", "What drives my XP?", "How do I recover momentum?"],
    streaks: ["How does momentum work?", "Tell me about grace days", "Tell me about recovery"],
    habits: ["How does difficulty scale?", "How do I earn XP?", "Tell me about stability"],
    difficulty: ["How does stability work?", "Tell me about micro-sessions", "Tell me about phases"],
    badges: ["How do I earn more badges?", "What's my progress?", "Tell me about streaks"],
    recovery: ["How does momentum work?", "What's a micro-session?", "How does stability help?"],
    xp: ["How does momentum affect XP?", "Tell me about daily bonuses", "Tell me about badges"],
    meditation: ["How does Sense work?", "Tell me about difficulty scaling", "Tell me about vitality"],
    vitality: ["When should I schedule vitality?", "How does sleep affect stability?", "Tell me about meditation"],
    calendar: ["How do habits work?", "Tell me about the schedule", "What's next for today?"],
    trials: ["How do I unlock trials?", "What are phases?", "Tell me about badges"],
    visuals: ["How do phases work?", "What changes at each phase?", "Tell me about stability"],
  };
  const raw = followUps[topic] || ["How does stability work?", "What's next for today?", "Tell me about phases"];
  return raw.map(s => applyLanguageStage(s, stage));
}

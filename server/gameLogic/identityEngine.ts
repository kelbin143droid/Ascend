import type { Player, Habit, HabitCompletion, StabilityData } from "@shared/schema";
import type { RhythmWindow } from "./rhythmEngine";

export type IdentityStage = "early" | "developing" | "stabilized" | "advanced";

export interface IdentityReflection {
  message: string;
  stage: IdentityStage;
  category: "observation" | "pattern" | "anchor";
  source: string;
}

export interface IdentityProfile {
  stage: IdentityStage;
  stageLabel: string;
  stageDescription: string;
  reflection: IdentityReflection | null;
  reflectionAnchor: IdentityReflection | null;
  metrics: IdentityMetrics;
}

export interface IdentityMetrics {
  totalActiveDays: number;
  totalCompletions: number;
  totalFocusSessions: number;
  recoveryCount: number;
  longestStreak: number;
  weeksEngaged: number;
  rhythmWindowCount: number;
  stabilityScore: number;
  stabilityState: string;
}

const STAGE_INFO: Record<IdentityStage, { label: string; description: string }> = {
  early: { label: "Emerging", description: "Building first patterns" },
  developing: { label: "Developing", description: "Rhythm forming" },
  stabilized: { label: "Stabilized", description: "Consistent engagement" },
  advanced: { label: "Established", description: "Reliable system in place" },
};

const EARLY_REFLECTIONS: string[] = [
  "You've returned several times this week.",
  "Small consistency builds strength.",
  "Showing up is the hardest part — you're doing it.",
  "Each return is a choice. You keep choosing.",
  "A few days of action can shift momentum.",
];

const DEVELOPING_REFLECTIONS: string[] = [
  "Your rhythm is becoming steady.",
  "You often show up around this time.",
  "A pattern is forming in how you engage.",
  "Your consistency is starting to shape a rhythm.",
  "You're building something that wasn't there before.",
  "The way you return after breaks shows resilience.",
];

const STABILIZED_REFLECTIONS: string[] = [
  "You return even after difficult days.",
  "Your consistency is strengthening.",
  "Your system handles disruptions better now.",
  "Engagement has become part of your routine.",
  "You've maintained this longer than most realize.",
  "Your rhythm recovers faster each time.",
];

const ADVANCED_REFLECTIONS: string[] = [
  "You've built a reliable system.",
  "Your growth path is becoming clear.",
  "What started as effort has become natural.",
  "Your patterns show sustained discipline.",
  "The system you've built reflects who you are becoming.",
  "Long-term engagement reveals deep consistency.",
];

const RHYTHM_REFLECTIONS: string[] = [
  "You tend to be most active in the {timeOfDay}.",
  "There's a natural rhythm forming — {timeOfDay} seems to work for you.",
  "Your {timeOfDay} pattern has been consistent.",
];

const RECOVERY_REFLECTIONS: string[] = [
  "You've come back after gaps before. That matters.",
  "Recovery is a skill. You're practicing it.",
  "Returning after a break is harder than continuing. You did it.",
];

const FOCUS_REFLECTIONS: string[] = [
  "Your focus sessions are becoming more frequent.",
  "Focused work is becoming part of your system.",
  "You're choosing depth over just checking boxes.",
];

const REFLECTION_ANCHORS: string[] = [
  "Do you handle difficult days differently now?",
  "Do you trust yourself more than before?",
  "Has your relationship with consistency changed?",
  "What does showing up mean to you now?",
  "Do you notice when your rhythm shifts?",
  "What would you tell someone starting where you were?",
];

function getTimeOfDayLabel(hour: number): string {
  if (hour >= 5 && hour < 9) return "early morning";
  if (hour >= 9 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "midday";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  if (hour >= 20 && hour < 23) return "late evening";
  return "night";
}

function computeMetrics(
  player: Player,
  completions: HabitCompletion[],
  rhythmWindows: RhythmWindow[]
): IdentityMetrics {
  const uniqueDays = new Set<string>();
  let totalFocusSessions = 0;

  completions.forEach(c => {
    if (c.completedAt) {
      uniqueDays.add(new Date(c.completedAt).toLocaleDateString("en-CA"));
      if (c.habitId.startsWith("focus_")) totalFocusSessions++;
    }
  });

  const sortedDays = [...uniqueDays].sort();
  let longestStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + "T00:00:00").getTime();
    const curr = new Date(sortedDays[i] + "T00:00:00").getTime();
    if (curr - prev === 86400000) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  let recoveryCount = 0;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + "T00:00:00").getTime();
    const curr = new Date(sortedDays[i] + "T00:00:00").getTime();
    const gap = (curr - prev) / 86400000;
    if (gap >= 2) recoveryCount++;
  }

  const firstDay = sortedDays.length > 0 ? new Date(sortedDays[0] + "T00:00:00") : new Date();
  const weeksEngaged = Math.max(1, Math.ceil((Date.now() - firstDay.getTime()) / (7 * 86400000)));

  return {
    totalActiveDays: uniqueDays.size,
    totalCompletions: completions.filter(c => c.completedAt).length,
    totalFocusSessions,
    recoveryCount,
    longestStreak,
    weeksEngaged,
    rhythmWindowCount: rhythmWindows.length,
    stabilityScore: player.stability?.score ?? 50,
    stabilityState: player.stability?.state ?? "stabilizing",
  };
}

export function determineIdentityStage(metrics: IdentityMetrics): IdentityStage {
  if (metrics.weeksEngaged >= 12 && metrics.stabilityScore >= 65 && metrics.totalActiveDays >= 40) {
    return "advanced";
  }
  if (metrics.weeksEngaged >= 4 && metrics.stabilityScore >= 55 && metrics.totalActiveDays >= 15) {
    return "stabilized";
  }
  if (metrics.weeksEngaged >= 2 && (metrics.rhythmWindowCount > 0 || metrics.totalActiveDays >= 7)) {
    return "developing";
  }
  return "early";
}

function selectReflection(
  stage: IdentityStage,
  metrics: IdentityMetrics,
  rhythmWindows: RhythmWindow[]
): IdentityReflection {
  const stagePool = {
    early: EARLY_REFLECTIONS,
    developing: DEVELOPING_REFLECTIONS,
    stabilized: STABILIZED_REFLECTIONS,
    advanced: ADVANCED_REFLECTIONS,
  }[stage];

  const candidates: IdentityReflection[] = stagePool.map(msg => ({
    message: msg,
    stage,
    category: "observation" as const,
    source: "stage",
  }));

  if (rhythmWindows.length > 0 && (stage === "developing" || stage === "stabilized" || stage === "advanced")) {
    const topWindow = rhythmWindows.sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
    const timeLabel = getTimeOfDayLabel(topWindow.centerHour);
    RHYTHM_REFLECTIONS.forEach(template => {
      candidates.push({
        message: template.replace("{timeOfDay}", timeLabel),
        stage,
        category: "pattern",
        source: "rhythm",
      });
    });
  }

  if (metrics.recoveryCount >= 2) {
    RECOVERY_REFLECTIONS.forEach(msg => {
      candidates.push({
        message: msg,
        stage,
        category: "observation",
        source: "recovery",
      });
    });
  }

  if (metrics.totalFocusSessions >= 3 && (stage === "developing" || stage === "stabilized" || stage === "advanced")) {
    FOCUS_REFLECTIONS.forEach(msg => {
      candidates.push({
        message: msg,
        stage,
        category: "pattern",
        source: "focus",
      });
    });
  }

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const index = (dayOfYear + metrics.totalActiveDays) % candidates.length;
  return candidates[index];
}

function selectReflectionAnchor(
  stage: IdentityStage,
  metrics: IdentityMetrics
): IdentityReflection | null {
  if (stage === "early") return null;

  const dayOfWeek = new Date().getDay();
  const weekOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 86400000));

  const showAnchor = (dayOfWeek === 3 || dayOfWeek === 6) && (weekOfYear % 1 === 0);
  if (!showAnchor) return null;

  const pool = REFLECTION_ANCHORS.filter((_, i) => {
    if (stage === "developing" && i >= 4) return false;
    return true;
  });

  const index = (weekOfYear * 2 + (dayOfWeek === 6 ? 1 : 0) + metrics.totalActiveDays) % pool.length;
  return {
    message: pool[index],
    stage,
    category: "anchor",
    source: "reflectionAnchor",
  };
}

export function generateIdentityProfile(
  player: Player,
  completions: HabitCompletion[],
  rhythmWindows: RhythmWindow[]
): IdentityProfile {
  const metrics = computeMetrics(player, completions, rhythmWindows);
  const stage = determineIdentityStage(metrics);
  const info = STAGE_INFO[stage];
  const reflection = selectReflection(stage, metrics, rhythmWindows);
  const reflectionAnchor = selectReflectionAnchor(stage, metrics);

  return {
    stage,
    stageLabel: info.label,
    stageDescription: info.description,
    reflection,
    reflectionAnchor,
    metrics,
  };
}

export function getIdentityCoachComment(profile: IdentityProfile): string | null {
  if (!profile.reflection) return null;
  return profile.reflection.message;
}

export function getIdentityAnchorForChat(profile: IdentityProfile): string | null {
  if (!profile.reflectionAnchor) return null;
  return profile.reflectionAnchor.message;
}

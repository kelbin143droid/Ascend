import type { Player, Habit, HabitCompletion } from "@shared/schema";

export type AbsenceTier = "none" | "short" | "extended" | "long";

export interface ReturnProtocolResult {
  active: boolean;
  tier: AbsenceTier;
  daysSinceLastActivity: number;
  coachMessage: string | null;
  resetRitual: ResetRitual | null;
  simplifyMode: SimplifyModeConfig | null;
  softRestart: boolean;
  hideProgress: boolean;
}

export interface ResetRitual {
  steps: ResetRitualStep[];
  totalDurationSeconds: number;
}

export interface ResetRitualStep {
  id: string;
  type: "reflection" | "affirmation";
  title: string;
  instruction: string;
  durationSeconds: number;
}

export interface SimplifyModeConfig {
  habitLoadReduction: number;
  focusDurationMultiplier: number;
  hideAnalytics: boolean;
  hideWeeklyPlanning: boolean;
  durationDays: number;
}

const TIER_THRESHOLDS = {
  short: { min: 7, max: 13 },
  extended: { min: 14, max: 29 },
  long: { min: 30 },
};

const COACH_MESSAGES: Record<Exclude<AbsenceTier, "none">, string> = {
  short: "Welcome back. A full week away is real life, not failure. Let's make today easy.",
  extended: "It looks like the previous pace may have been heavier than needed. Let's simplify for a bit.",
  long: "It's been a while. Let's start fresh and rebuild your rhythm.",
};

const RESET_RITUAL: ResetRitual = {
  steps: [
    {
      id: "reflection",
      type: "reflection",
      title: "Quick Reflection",
      instruction: "What's one small thing you want to restart today?",
      durationSeconds: 20,
    },
  ],
  totalDurationSeconds: 20,
};

const SOFT_RESTART_RITUAL: ResetRitual = {
  steps: [
    {
      id: "affirmation",
      type: "affirmation",
      title: "Fresh Start",
      instruction: "Returning restores momentum. Every restart is valid.",
      durationSeconds: 12,
    },
    {
      id: "reflection",
      type: "reflection",
      title: "One Small Step",
      instruction: "Choose one thing — anything — to do today. That's enough.",
      durationSeconds: 20,
    },
  ],
  totalDurationSeconds: 32,
};

export function calculateDaysSinceLastActivity(completions: HabitCompletion[]): number {
  if (completions.length === 0) return 999;

  const withDates = completions.filter(c => c.completedAt);
  if (withDates.length === 0) return 999;

  const latest = withDates.reduce((best, c) => {
    const t = new Date(c.completedAt!).getTime();
    return t > best ? t : best;
  }, 0);

  const now = Date.now();
  return Math.floor((now - latest) / 86400000);
}

export function detectAbsenceTier(daysSince: number): AbsenceTier {
  if (daysSince >= TIER_THRESHOLDS.long.min) return "long";
  if (daysSince >= TIER_THRESHOLDS.extended.min) return "extended";
  if (daysSince >= TIER_THRESHOLDS.short.min && daysSince <= TIER_THRESHOLDS.short.max) return "short";
  return "none";
}

export function getReturnProtocol(
  player: Player,
  completions: HabitCompletion[]
): ReturnProtocolResult {
  // Brand-new players have never been active — do not trigger return protocol
  const hasEverBeenActive = completions.some(c => c.completedAt);
  if (!hasEverBeenActive) {
    return {
      active: false,
      tier: "none",
      daysSinceLastActivity: 0,
      coachMessage: null,
      resetRitual: null,
      simplifyMode: null,
      softRestart: false,
      hideProgress: false,
    };
  }

  const daysSince = calculateDaysSinceLastActivity(completions);
  const tier = detectAbsenceTier(daysSince);

  if (tier === "none") {
    return {
      active: false,
      tier: "none",
      daysSinceLastActivity: daysSince,
      coachMessage: null,
      resetRitual: null,
      simplifyMode: null,
      softRestart: false,
      hideProgress: false,
    };
  }

  const coachMessage = COACH_MESSAGES[tier];

  let resetRitual: ResetRitual | null = null;
  let simplifyMode: SimplifyModeConfig | null = null;
  let softRestart = false;
  let hideProgress = false;

  if (tier === "short") {
    resetRitual = RESET_RITUAL;
  }

  if (tier === "extended") {
    resetRitual = RESET_RITUAL;
    simplifyMode = {
      habitLoadReduction: 0.5,
      focusDurationMultiplier: 0.6,
      hideAnalytics: true,
      hideWeeklyPlanning: true,
      durationDays: 7,
    };
  }

  if (tier === "long") {
    resetRitual = SOFT_RESTART_RITUAL;
    softRestart = true;
    hideProgress = true;
    simplifyMode = {
      habitLoadReduction: 0.7,
      focusDurationMultiplier: 0.5,
      hideAnalytics: true,
      hideWeeklyPlanning: true,
      durationDays: 14,
    };
  }

  return {
    active: true,
    tier,
    daysSinceLastActivity: daysSince,
    coachMessage,
    resetRitual,
    simplifyMode,
    softRestart,
    hideProgress,
  };
}

export function getReturnCoachComment(tier: AbsenceTier, daysSince: number): string {
  if (tier === "short") {
    if (daysSince === 7) return "A week away. Rhythm paused, not lost.";
    return "Some time away. Returning starts with one small step.";
  }
  if (tier === "extended") {
    return "The pace before may have been more than needed. Starting lighter builds a stronger rhythm.";
  }
  if (tier === "long") {
    return "A fresh start is always available. No looking back needed — just one step forward.";
  }
  return "";
}

export function getSimplifiedHabitLimit(
  currentLimit: number,
  simplifyMode: SimplifyModeConfig | null
): number {
  if (!simplifyMode) return currentLimit;
  return Math.max(2, Math.floor(currentLimit * (1 - simplifyMode.habitLoadReduction)));
}

export function getSimplifiedFocusDuration(
  baseDuration: number,
  simplifyMode: SimplifyModeConfig | null
): number {
  if (!simplifyMode) return baseDuration;
  return Math.max(1, Math.round(baseDuration * simplifyMode.focusDurationMultiplier));
}

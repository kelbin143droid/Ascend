import type { Player, Habit, HabitCompletion, StabilityData, StabilityState } from "@shared/schema";

const WEIGHTS = {
  consistency: 0.4,
  completionRate: 0.3,
  focusEngagement: 0.2,
  recoverySpeed: 0.1,
};

const SOFT_REGRESSION_THRESHOLD = 40;
const SOFT_REGRESSION_DAYS = 2;
const HARD_REGRESSION_THRESHOLD = 50;
const HARD_REGRESSION_DAYS = 5;

const DISRUPTION_INACTIVE_DAYS = 3;
const DISRUPTION_RATE_DROP_THRESHOLD = 25;

const STATE_THRESHOLDS = {
  expanding: { minScore: 70, minWeeksStable: 2 },
  stable: { minScore: 45, minConsecutiveActive: 5 },
};

const HABIT_LIMITS: Record<StabilityState, number> = {
  stabilizing: 3,
  stable: 6,
  expanding: 10,
};

const FEATURE_GATES: Record<StabilityState, string[]> = {
  stabilizing: ["basic_habits", "guided_sessions", "coach_basic"],
  stable: ["custom_habits", "focus_sessions", "coach_insights", "analytics_basic", "rhythm_detection"],
  expanding: ["unlimited_habits", "deep_analytics", "advanced_coach", "weekly_planning", "habit_placement"],
};

export interface StabilityCalculation {
  score: number;
  state: StabilityState;
  components: {
    habitCompletionPct: number;
    sleepConsistency: number;
    energyCompliance: number;
    emotionalStability: number;
    taskTimingAdherence: number;
    consecutiveActiveDays: number;
    focusSessionFrequency: number;
    recoverySpeed: number;
  };
  trend: "improving" | "stable" | "declining";
  regressionWarning: string | null;
}

export interface RegressionResult {
  type: "none" | "soft" | "hard";
  newPhase: number;
  message: string;
  stabilityScore: number;
  consecutiveLowDays: number;
}

export interface DisruptionResult {
  detected: boolean;
  type: "inactivity" | "rate_drop" | "none";
  inactiveDays: number;
  rateDropAmount: number;
  recoveryMessage: string;
}

export interface StabilitySystemState {
  state: StabilityState;
  habitLimit: number;
  unlockedFeatures: string[];
  recoveryModeActive: boolean;
  disruptionDetected: boolean;
  expansionReady: boolean;
  coachToneModifier: "gentle" | "encouraging" | "challenging";
}

export function calculateStabilityScore(
  player: Player,
  habits: Habit[],
  completions: HabitCompletion[],
  overrides?: Partial<StabilityData>
): StabilityCalculation {
  const consecutiveActiveDays = calculateConsecutiveActiveDays(completions);
  const habitPct = calculateHabitCompletionPct(habits, completions, 7);
  const focusFreq = calculateFocusSessionFrequency(completions, 14);
  const recoverySpeed = calculateRecoverySpeed(completions, player);

  const sleepConsistency = overrides?.sleepConsistency ?? player.stability?.sleepConsistency ?? 50;
  const energyCompliance = overrides?.energyCompliance ?? player.stability?.energyCompliance ?? 50;
  const emotionalStability = overrides?.emotionalStability ?? player.stability?.emotionalStability ?? 50;
  const taskTimingAdherence = calculateTaskTimingAdherence(player, completions);

  const consistencyScore = Math.min(100, consecutiveActiveDays * 10 + taskTimingAdherence * 0.3);
  const completionScore = habitPct;
  const focusScore = Math.min(100, focusFreq * 20);
  const recoveryScore = recoverySpeed;

  const rawScore =
    consistencyScore * WEIGHTS.consistency +
    completionScore * WEIGHTS.completionRate +
    focusScore * WEIGHTS.focusEngagement +
    recoveryScore * WEIGHTS.recoverySpeed;

  const clampedScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const previousScore = player.stability?.score ?? 50;
  const diff = clampedScore - previousScore;
  const trend: "improving" | "stable" | "declining" =
    diff > 3 ? "improving" : diff < -3 ? "declining" : "stable";

  const state = determineStabilityState(clampedScore, player, consecutiveActiveDays);

  let regressionWarning: string | null = null;
  const lowDays = player.stability?.consecutiveLowDays ?? 0;
  if (clampedScore < SOFT_REGRESSION_THRESHOLD && lowDays >= SOFT_REGRESSION_DAYS - 1) {
    regressionWarning = "Stability is low. The system is adjusting difficulty to help you recover.";
  }
  if (clampedScore < HARD_REGRESSION_THRESHOLD && lowDays >= HARD_REGRESSION_DAYS - 1 && player.phase > 1) {
    regressionWarning = "Extended low stability detected. Phase regression may occur to recalibrate.";
  }

  return {
    score: clampedScore,
    state,
    components: {
      habitCompletionPct: Math.round(habitPct),
      sleepConsistency: Math.round(sleepConsistency),
      energyCompliance: Math.round(energyCompliance),
      emotionalStability: Math.round(emotionalStability),
      taskTimingAdherence: Math.round(taskTimingAdherence),
      consecutiveActiveDays,
      focusSessionFrequency: Math.round(focusFreq * 10) / 10,
      recoverySpeed: Math.round(recoverySpeed),
    },
    trend,
    regressionWarning,
  };
}

function determineStabilityState(
  score: number,
  player: Player,
  consecutiveActiveDays: number
): StabilityState {
  const weeksAtStable = player.stability?.weeksAtStable ?? 0;

  if (
    score >= STATE_THRESHOLDS.expanding.minScore &&
    weeksAtStable >= STATE_THRESHOLDS.expanding.minWeeksStable
  ) {
    return "expanding";
  }

  if (
    score >= STATE_THRESHOLDS.stable.minScore &&
    consecutiveActiveDays >= STATE_THRESHOLDS.stable.minConsecutiveActive
  ) {
    return "stable";
  }

  return "stabilizing";
}

function calculateConsecutiveActiveDays(completions: HabitCompletion[]): number {
  if (completions.length === 0) return 0;

  const uniqueDays = new Set<string>();
  completions.forEach(c => {
    if (c.completedAt) {
      uniqueDays.add(new Date(c.completedAt).toLocaleDateString("en-CA"));
    }
  });

  const sortedDays = [...uniqueDays].sort().reverse();
  if (sortedDays.length === 0) return 0;

  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");

  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) return 0;

  let consecutive = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + "T00:00:00");
    const curr = new Date(sortedDays[i] + "T00:00:00");
    const diffMs = prev.getTime() - curr.getTime();
    if (diffMs === 86400000) {
      consecutive++;
    } else {
      break;
    }
  }

  return consecutive;
}

function calculateFocusSessionFrequency(completions: HabitCompletion[], windowDays: number): number {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  const focusSessions = completions.filter(c => {
    if (!c.completedAt) return false;
    if (!c.habitId.startsWith("focus_")) return false;
    return new Date(c.completedAt) >= windowStart;
  });

  return focusSessions.length / Math.max(1, windowDays / 7);
}

function calculateRecoverySpeed(completions: HabitCompletion[], player: Player): number {
  if (completions.length < 3) return 50;

  const uniqueDays = new Set<string>();
  completions.forEach(c => {
    if (c.completedAt) uniqueDays.add(new Date(c.completedAt).toLocaleDateString("en-CA"));
  });
  const sortedDays = [...uniqueDays].sort();
  if (sortedDays.length < 2) return 50;

  let totalGapDays = 0;
  let gapCount = 0;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + "T00:00:00");
    const curr = new Date(sortedDays[i] + "T00:00:00");
    const gapMs = curr.getTime() - prev.getTime();
    const gap = gapMs / 86400000;
    if (gap > 1) {
      totalGapDays += gap;
      gapCount++;
    }
  }

  if (gapCount === 0) return 90;

  const avgGap = totalGapDays / gapCount;
  if (avgGap <= 2) return 85;
  if (avgGap <= 3) return 65;
  if (avgGap <= 5) return 45;
  return 25;
}

function calculateHabitCompletionPct(
  habits: Habit[],
  completions: HabitCompletion[],
  windowDays: number
): number {
  const activeHabits = habits.filter(h => h.active);
  if (activeHabits.length === 0) return 50;

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - windowDays);

  const recentCompletions = completions.filter(c => {
    const d = new Date(c.completedAt!);
    return d >= windowStart;
  });

  const dailyCounts: Record<string, Set<string>> = {};
  recentCompletions.forEach(c => {
    const day = new Date(c.completedAt!).toLocaleDateString("en-CA");
    if (!dailyCounts[day]) dailyCounts[day] = new Set();
    dailyCounts[day].add(c.habitId);
  });

  let totalCompleted = 0;
  for (const day of Object.keys(dailyCounts)) {
    totalCompleted += dailyCounts[day].size;
  }

  const totalPossible = windowDays * activeHabits.length;
  if (totalPossible === 0) return 50;

  return Math.min(100, (totalCompleted / totalPossible) * 100);
}

function calculateTaskTimingAdherence(
  player: Player,
  completions: HabitCompletion[]
): number {
  if (completions.length === 0) return 50;

  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const recent = completions.filter(c => new Date(c.completedAt!) >= threeDaysAgo);
  if (recent.length === 0) return 40;

  const score = Math.min(100, 40 + recent.length * 10);
  return score;
}

export function detectDisruption(
  player: Player,
  completions: HabitCompletion[],
  previousCompletionRate: number
): DisruptionResult {
  const today = new Date();
  const uniqueDays = new Set<string>();
  completions.forEach(c => {
    if (c.completedAt) uniqueDays.add(new Date(c.completedAt).toLocaleDateString("en-CA"));
  });

  const sortedDays = [...uniqueDays].sort().reverse();
  let inactiveDays = 0;

  if (sortedDays.length === 0) {
    inactiveDays = 999;
  } else {
    const lastActiveDate = new Date(sortedDays[0] + "T00:00:00");
    inactiveDays = Math.floor((today.getTime() - lastActiveDate.getTime()) / 86400000);
  }

  if (inactiveDays >= DISRUPTION_INACTIVE_DAYS) {
    return {
      detected: true,
      type: "inactivity",
      inactiveDays,
      rateDropAmount: 0,
      recoveryMessage: inactiveDays >= 7
        ? "It's been a while. Let's restart with something small — just one step today."
        : "A few days away. That's okay. One small action today rebuilds the momentum.",
    };
  }

  const currentRate = player.stability?.habitCompletionPct ?? 50;
  const rateDrop = previousCompletionRate - currentRate;

  if (rateDrop >= DISRUPTION_RATE_DROP_THRESHOLD) {
    return {
      detected: true,
      type: "rate_drop",
      inactiveDays,
      rateDropAmount: Math.round(rateDrop),
      recoveryMessage: "Completion rate has shifted. The system is simplifying expectations — focus on your core habits.",
    };
  }

  return {
    detected: false,
    type: "none",
    inactiveDays,
    rateDropAmount: 0,
    recoveryMessage: "",
  };
}

export function checkRegression(
  player: Player,
  stabilityScore: number
): RegressionResult {
  const currentLowDays = player.stability?.consecutiveLowDays ?? 0;
  const today = new Date().toLocaleDateString("en-CA");
  const lastCalc = player.stability?.lastCalculated;

  let consecutiveLowDays = currentLowDays;
  if (lastCalc !== today) {
    if (stabilityScore < HARD_REGRESSION_THRESHOLD) {
      consecutiveLowDays = currentLowDays + 1;
    } else {
      consecutiveLowDays = 0;
    }
  }

  if (consecutiveLowDays >= HARD_REGRESSION_DAYS && player.phase > 1) {
    return {
      type: "hard",
      newPhase: player.phase - 1,
      message: `Stability has been below ${HARD_REGRESSION_THRESHOLD} for ${consecutiveLowDays} consecutive days. The system is recalibrating to Phase ${player.phase - 1} to rebuild your foundation. This is a strategic adjustment — not a punishment.`,
      stabilityScore,
      consecutiveLowDays,
    };
  }

  if (consecutiveLowDays >= SOFT_REGRESSION_DAYS && stabilityScore < SOFT_REGRESSION_THRESHOLD) {
    return {
      type: "soft",
      newPhase: player.phase,
      message: "Stability is dropping. The system is reducing difficulty to help you recover momentum. Focus on completing shorter sessions consistently.",
      stabilityScore,
      consecutiveLowDays,
    };
  }

  return {
    type: "none",
    newPhase: player.phase,
    message: "",
    stabilityScore,
    consecutiveLowDays,
  };
}

export function getSystemState(
  calc: StabilityCalculation,
  player: Player,
  disruption: DisruptionResult
): StabilitySystemState {
  const state = calc.state;
  const recoveryModeActive = disruption.detected || (player.stability?.recoveryModeActive ?? false);

  const effectiveState: StabilityState = recoveryModeActive ? "stabilizing" : state;

  const habitLimit = recoveryModeActive
    ? Math.min(HABIT_LIMITS.stabilizing, 2)
    : HABIT_LIMITS[effectiveState];

  const unlockedFeatures = FEATURE_GATES[effectiveState];

  const weeksAtStable = player.stability?.weeksAtStable ?? 0;
  const expansionReady = state === "stable" && weeksAtStable >= STATE_THRESHOLDS.expanding.minWeeksStable - 1 && calc.score >= STATE_THRESHOLDS.expanding.minScore;

  let coachToneModifier: "gentle" | "encouraging" | "challenging";
  if (recoveryModeActive || effectiveState === "stabilizing") {
    coachToneModifier = "gentle";
  } else if (effectiveState === "expanding") {
    coachToneModifier = "challenging";
  } else {
    coachToneModifier = "encouraging";
  }

  return {
    state: effectiveState,
    habitLimit,
    unlockedFeatures,
    recoveryModeActive,
    disruptionDetected: disruption.detected,
    expansionReady,
    coachToneModifier,
  };
}

export function buildUpdatedStabilityData(
  calc: StabilityCalculation,
  regression: RegressionResult,
  disruption?: DisruptionResult,
  previousData?: StabilityData
): StabilityData {
  const today = new Date().toLocaleDateString("en-CA");
  const prevWeeksAtStable = previousData?.weeksAtStable ?? 0;
  const lastWeeklyCheck = previousData?.lastWeeklyCheck;

  let weeksAtStable = prevWeeksAtStable;
  if (lastWeeklyCheck) {
    const daysSinceCheck = Math.floor(
      (new Date(today + "T00:00:00").getTime() - new Date(lastWeeklyCheck + "T00:00:00").getTime()) / 86400000
    );
    if (daysSinceCheck >= 7) {
      if (calc.state === "stable" || calc.state === "expanding") {
        weeksAtStable = prevWeeksAtStable + 1;
      } else {
        weeksAtStable = 0;
      }
    }
  }

  const recoveryModeActive = disruption?.detected ?? previousData?.recoveryModeActive ?? false;
  const isExitingRecovery = previousData?.recoveryModeActive && !disruption?.detected && calc.score >= 45;

  const state = calc.state;
  const habitLimit = recoveryModeActive && !isExitingRecovery
    ? Math.min(HABIT_LIMITS.stabilizing, 2)
    : HABIT_LIMITS[state];

  return {
    score: calc.score,
    state: calc.state,
    habitCompletionPct: calc.components.habitCompletionPct,
    sleepConsistency: calc.components.sleepConsistency,
    energyCompliance: calc.components.energyCompliance,
    emotionalStability: calc.components.emotionalStability,
    taskTimingAdherence: calc.components.taskTimingAdherence,
    consecutiveActiveDays: calc.components.consecutiveActiveDays,
    focusSessionFrequency: calc.components.focusSessionFrequency,
    recoverySpeed: calc.components.recoverySpeed,
    lastCalculated: today,
    consecutiveLowDays: regression.consecutiveLowDays,
    softRegressionActive: regression.type === "soft",
    recoveryModeActive: isExitingRecovery ? false : recoveryModeActive,
    recoveryModeEnteredDate: recoveryModeActive
      ? (previousData?.recoveryModeEnteredDate ?? today)
      : undefined,
    weeksAtStable,
    lastWeeklyCheck: (lastWeeklyCheck && Math.floor((new Date(today + "T00:00:00").getTime() - new Date(lastWeeklyCheck + "T00:00:00").getTime()) / 86400000) >= 7)
      ? today
      : (lastWeeklyCheck ?? today),
    habitLimit,
    disruptionDetected: disruption?.detected ?? false,
  };
}

export function getStabilityTier(score: number): {
  tier: string;
  label: string;
  color: string;
} {
  if (score >= 85) return { tier: "excellent", label: "Excellent", color: "#22c55e" };
  if (score >= 70) return { tier: "strong", label: "Strong", color: "#3b82f6" };
  if (score >= 55) return { tier: "solid", label: "Solid", color: "#f59e0b" };
  if (score >= 40) return { tier: "developing", label: "Developing", color: "#f97316" };
  return { tier: "building", label: "Building", color: "#a855f7" };
}

export function getStabilityStateInfo(state: StabilityState): {
  label: string;
  description: string;
  color: string;
  icon: string;
} {
  switch (state) {
    case "stabilizing":
      return {
        label: "Stabilizing",
        description: "Building consistency. Focus on showing up.",
        color: "#a855f7",
        icon: "seed",
      };
    case "stable":
      return {
        label: "Stable",
        description: "Consistent engagement. Systems expanding.",
        color: "#3b82f6",
        icon: "tree",
      };
    case "expanding":
      return {
        label: "Expanding",
        description: "Strong stability. Advanced features unlocked.",
        color: "#22c55e",
        icon: "mountain",
      };
  }
}

export function getRecoveryCoachMessage(disruption: DisruptionResult, state: StabilityState): string {
  if (!disruption.detected) return "";

  if (disruption.type === "inactivity") {
    if (disruption.inactiveDays >= 7) {
      return "It's been a little while. No pressure — let's restart with something small. One step is all it takes.";
    }
    return "A few days off. That's part of the process. One small action today can shift things back.";
  }

  if (disruption.type === "rate_drop") {
    return "Your completion rhythm shifted. The system is simplifying things — focus on your strongest habit first.";
  }

  return "";
}

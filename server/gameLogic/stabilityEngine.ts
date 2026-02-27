import type { Player, Habit, HabitCompletion, StabilityData } from "@shared/schema";

const WEIGHTS = {
  habitCompletion: 0.35,
  sleepConsistency: 0.2,
  energyCompliance: 0.15,
  emotionalStability: 0.15,
  taskTimingAdherence: 0.15,
};

const SOFT_REGRESSION_THRESHOLD = 40;
const SOFT_REGRESSION_DAYS = 2;
const HARD_REGRESSION_THRESHOLD = 50;
const HARD_REGRESSION_DAYS = 5;

export interface StabilityCalculation {
  score: number;
  components: {
    habitCompletionPct: number;
    sleepConsistency: number;
    energyCompliance: number;
    emotionalStability: number;
    taskTimingAdherence: number;
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

export function calculateStabilityScore(
  player: Player,
  habits: Habit[],
  completions: HabitCompletion[],
  overrides?: Partial<StabilityData>
): StabilityCalculation {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA");

  const habitPct = calculateHabitCompletionPct(habits, completions, 7);

  const sleepConsistency = overrides?.sleepConsistency ?? player.stability?.sleepConsistency ?? 50;
  const energyCompliance = overrides?.energyCompliance ?? player.stability?.energyCompliance ?? 50;
  const emotionalStability = overrides?.emotionalStability ?? player.stability?.emotionalStability ?? 50;
  const taskTimingAdherence = calculateTaskTimingAdherence(player, completions);

  const score = Math.round(
    habitPct * WEIGHTS.habitCompletion +
    sleepConsistency * WEIGHTS.sleepConsistency +
    energyCompliance * WEIGHTS.energyCompliance +
    emotionalStability * WEIGHTS.emotionalStability +
    taskTimingAdherence * WEIGHTS.taskTimingAdherence
  );

  const clampedScore = Math.max(0, Math.min(100, score));
  const previousScore = player.stability?.score ?? 50;
  const diff = clampedScore - previousScore;
  const trend: "improving" | "stable" | "declining" =
    diff > 3 ? "improving" : diff < -3 ? "declining" : "stable";

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
    components: {
      habitCompletionPct: Math.round(habitPct),
      sleepConsistency: Math.round(sleepConsistency),
      energyCompliance: Math.round(energyCompliance),
      emotionalStability: Math.round(emotionalStability),
      taskTimingAdherence: Math.round(taskTimingAdherence),
    },
    trend,
    regressionWarning,
  };
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

export function buildUpdatedStabilityData(
  calc: StabilityCalculation,
  regression: RegressionResult
): StabilityData {
  return {
    score: calc.score,
    habitCompletionPct: calc.components.habitCompletionPct,
    sleepConsistency: calc.components.sleepConsistency,
    energyCompliance: calc.components.energyCompliance,
    emotionalStability: calc.components.emotionalStability,
    taskTimingAdherence: calc.components.taskTimingAdherence,
    lastCalculated: new Date().toLocaleDateString("en-CA"),
    consecutiveLowDays: regression.consecutiveLowDays,
    softRegressionActive: regression.type === "soft",
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

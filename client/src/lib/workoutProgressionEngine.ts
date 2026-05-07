/**
 * workoutProgressionEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure, side-effect-free scoring and progression logic.
 * All inputs are plain data — no localStorage, no React.
 * This makes the module fully testable and easy to replace with an AI model
 * in a future version without changing any callers.
 */

import type { WorkoutLevel } from "./workoutPlans";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DifficultyRating = "easy" | "same" | "hard";
export type RecoveryFeedback = "energized" | "normal" | "fatigued";
export type FormQuality     = "yes" | "mostly" | "no";

export type ProgressionAction =
  | "increase_reps"
  | "increase_sets"
  | "level_up"
  | "maintain"
  | "decrease_reps"
  | "decrease_sets"
  | "level_down";

/** One completed (or abandoned) workout session with full performance data. */
export interface TrackedWorkoutSession {
  level: WorkoutLevel;
  completedAt: string;           // ISO string
  workoutCompleted: boolean;
  setsCompleted: number;
  totalSets: number;
  repsCompleted: number;         // aggregate reps (or seconds for timed)
  targetReps: number;
  userDifficulty: DifficultyRating;
  performanceScore: number;      // cached score at time of recording
  // Optional — available from 3-step feedback; absent on legacy sessions
  recoveryFeedback?: RecoveryFeedback;
  formQuality?: FormQuality;
}

/** Micro-progression state per workout level. */
export interface MicroProgressState {
  repsBonus: number;   // extra reps added to the base range (0, 2, 4 — capped at 6)
  setsBonus: number;   // extra sets added (0 or 1 — capped at 2)
}

export interface ProgressionRecommendation {
  action: ProgressionAction;
  scoreLabel: string;            // e.g. "85 / 100"
  zone: "progress" | "maintain" | "regress";
  headline: string;              // Bold action headline
  message: string;               // Explanatory sub-text
  scoreBreakdown: ScoreBreakdownItem[];
  averageScore: number;          // Rolling 3-session average
}

export interface ScoreBreakdownItem {
  label: string;
  points: number;
  earned: boolean;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/**
 * Compute the performance score for a single session.
 *
 * Core:     completion(20) + sets(40) + reps(30) + difficulty(-15…+10) = max 100
 * Bonuses:  recovery(+8/-8) + form(+5/-8)  — can push total above/below core
 * Final score is clamped to [-15, 100] for display sanity.
 */
export function calculatePerformanceScore(
  workoutCompleted: boolean,
  setsCompleted: number,
  totalSets: number,
  repsCompleted: number,
  targetReps: number,
  difficulty: DifficultyRating,
  recoveryFeedback?: RecoveryFeedback,
  formQuality?: FormQuality,
): { total: number; breakdown: ScoreBreakdownItem[] } {
  const allSets = workoutCompleted && setsCompleted >= totalSets;
  const hitReps = workoutCompleted && repsCompleted >= targetReps;

  const diffPoints     = difficulty === "easy" ? 10 : difficulty === "hard" ? -15 : 0;
  const recoveryPoints = recoveryFeedback === "energized" ? 8 : recoveryFeedback === "fatigued" ? -8 : 0;
  const formPoints     = formQuality === "yes" ? 5 : formQuality === "no" ? -8 : 0;

  const breakdown: ScoreBreakdownItem[] = [
    { label: "Workout completed",    points: 20,             earned: workoutCompleted },
    { label: "All sets completed",   points: 40,             earned: allSets },
    { label: "Target reps achieved", points: 30,             earned: hitReps },
    {
      label: difficulty === "easy"  ? "Felt easy (+10)"
           : difficulty === "hard"  ? "Felt hard (-15)"
           : "Felt just right",
      points: diffPoints,
      earned: true,
    },
  ];

  if (recoveryFeedback) {
    breakdown.push({
      label: recoveryFeedback === "energized" ? "Energized recovery (+8)"
           : recoveryFeedback === "fatigued"  ? "Fatigued (-8)"
           : "Normal recovery",
      points: recoveryPoints,
      earned: true,
    });
  }
  if (formQuality) {
    breakdown.push({
      label: formQuality === "yes"    ? "Solid form (+5)"
           : formQuality === "no"     ? "Form struggled (-8)"
           : "Mostly good form",
      points: formPoints,
      earned: true,
    });
  }

  const raw =
    (workoutCompleted ? 20 : 0) +
    (allSets          ? 40 : 0) +
    (hitReps          ? 30 : 0) +
    diffPoints + recoveryPoints + formPoints;

  return { total: Math.min(raw, 100), breakdown };
}

// ── Progression decision ──────────────────────────────────────────────────────

/** Rolling average of the last N sessions (default 3). */
export function rollingAverage(sessions: TrackedWorkoutSession[], n = 3): number {
  if (sessions.length === 0) return 0;
  const slice = sessions.slice(-n);
  return Math.round(slice.reduce((sum, s) => sum + s.performanceScore, 0) / slice.length);
}

/** True if the last `count` sessions all have difficulty === "hard". */
function consecutiveHard(sessions: TrackedWorkoutSession[], count = 2): boolean {
  if (sessions.length < count) return false;
  return sessions.slice(-count).every((s) => s.userDifficulty === "hard");
}

/**
 * Decide what to recommend based on rolling performance + current micro-progress state.
 *
 * Micro-progression order (before level jump):
 *   1. increase_reps  (+2 reps, up to +6)
 *   2. increase_sets  (+1 set, up to +2)
 *   3. level_up
 *
 * Regression order (before level drop):
 *   1. decrease_reps  (-2 reps, floor at 0)
 *   2. decrease_sets  (-1 set, floor at 0)
 *   3. level_down
 */
export function getProgressionRecommendation(
  sessions: TrackedWorkoutSession[],
  microProgress: MicroProgressState,
  currentLevel: WorkoutLevel,
  latestScore: number,
  latestDifficulty: DifficultyRating,
): ProgressionRecommendation {
  const avg = rollingAverage(sessions);
  const hardStreak = consecutiveHard(sessions);

  // ── Determine zone ──────────────────────────────────────────────────────────
  const shouldProgress = avg >= 80 && !hardStreak;
  const shouldRegress  = avg < 60  || hardStreak;
  const zone: ProgressionRecommendation["zone"] = shouldProgress
    ? "progress"
    : shouldRegress
    ? "regress"
    : "maintain";

  // ── Map zone → action ───────────────────────────────────────────────────────
  let action: ProgressionAction;
  if (zone === "progress") {
    if (microProgress.repsBonus < 6) {
      action = "increase_reps";
    } else if (microProgress.setsBonus < 2) {
      action = "increase_sets";
    } else {
      action = "level_up";
    }
  } else if (zone === "regress") {
    if (microProgress.repsBonus > 0) {
      action = "decrease_reps";
    } else if (microProgress.setsBonus > 0) {
      action = "decrease_sets";
    } else {
      action = "level_down";
    }
  } else {
    action = "maintain";
  }

  // ── Human-readable copy ─────────────────────────────────────────────────────
  const headlines: Record<ProgressionAction, string> = {
    increase_reps:  "Add 2 more reps next session",
    increase_sets:  "Add 1 more set next session",
    level_up:       "Time to advance to the next level",
    maintain:       "Keep this level — you're dialled in",
    decrease_reps:  "Drop 2 reps to recharge",
    decrease_sets:  "Drop 1 set to recover",
    level_down:     "Step back a level to rebuild",
  };

  const messages: Record<ProgressionAction, string> = {
    increase_reps:  `Your ${sessions.length >= 3 ? "3-session" : "recent"} average is ${avg} — you're ready for more volume. Reps will increase next time.`,
    increase_sets:  `You've maximized reps. Adding one more set builds total volume before the next level.`,
    level_up:       `Outstanding — you've earned the next level. Switch when you're ready.`,
    maintain:       `You're in the optimal training zone (score ${avg}). Stay consistent and keep building.`,
    decrease_reps:  `Score average ${avg} suggests recovery is needed. Pulling back reps keeps progress sustainable.`,
    decrease_sets:  `Reducing sets lets you reset and come back stronger.`,
    level_down:     `Stepping down a level will help you rebuild a solid foundation — no shame, only strategy.`,
  };

  // Minimal breakdown for display (uses the latest session's breakdown)
  const { breakdown } = calculatePerformanceScore(
    true, // completed (we only call this after onComplete)
    sessions.at(-1)?.setsCompleted ?? 0,
    sessions.at(-1)?.totalSets ?? 1,
    sessions.at(-1)?.repsCompleted ?? 0,
    sessions.at(-1)?.targetReps ?? 1,
    latestDifficulty,
  );

  return {
    action,
    zone,
    scoreLabel: `${latestScore} / 100`,
    headline: headlines[action],
    message: messages[action],
    scoreBreakdown: breakdown,
    averageScore: avg,
  };
}

// ── Micro-progression state updater ──────────────────────────────────────────

/**
 * Apply a progression action to the current micro-progress state.
 * Returns a new state (immutable).
 */
export function applyMicroProgression(
  state: MicroProgressState,
  action: ProgressionAction,
): MicroProgressState {
  switch (action) {
    case "increase_reps":
      return { ...state, repsBonus: Math.min(state.repsBonus + 2, 6) };
    case "decrease_reps":
      return { ...state, repsBonus: Math.max(state.repsBonus - 2, 0) };
    case "increase_sets":
      return { ...state, setsBonus: Math.min(state.setsBonus + 1, 2) };
    case "decrease_sets":
      return { ...state, setsBonus: Math.max(state.setsBonus - 1, 0) };
    default:
      return state;
  }
}

// ── Helpers for UI ────────────────────────────────────────────────────────────

export const ZONE_COLORS: Record<ProgressionRecommendation["zone"], string> = {
  progress: "#22c55e",
  maintain: "#3b82f6",
  regress:  "#f59e0b",
};

export const ZONE_ICONS: Record<ProgressionRecommendation["zone"], string> = {
  progress: "📈",
  maintain: "🎯",
  regress:  "🔄",
};

export const DIFFICULTY_LABELS: Record<DifficultyRating, string> = {
  easy: "😌 Easy",
  same: "👌 Just Right",
  hard: "💪 Hard",
};

export const RECOVERY_LABELS: Record<RecoveryFeedback, string> = {
  energized: "⚡ Energized",
  normal:    "😐 Normal",
  fatigued:  "😴 Fatigued",
};

export const FORM_LABELS: Record<FormQuality, string> = {
  yes:    "✅ Yes, solid",
  mostly: "🟡 Mostly",
  no:     "❌ Struggled",
};

// ── Adaptive readiness & recovery helpers ─────────────────────────────────────

/**
 * Returns readiness percentage (0–100) toward the next level.
 * Weighted: 80% from rolling 5-session performance average, 20% from streak.
 */
export function getReadinessPercent(sessions: TrackedWorkoutSession[]): number {
  if (!sessions.length) return 0;
  const avg   = rollingAverage(sessions, 5);
  const base  = Math.min(Math.round((avg / 80) * 80), 80);
  const streak = getConsistencyStreak(sessions);
  const bonus = Math.min(streak * 2, 20);
  return Math.min(base + bonus, 100);
}

/**
 * Count consecutive days (ending today or yesterday) with at least one session.
 */
export function getConsistencyStreak(sessions: TrackedWorkoutSession[]): number {
  if (!sessions.length) return 0;
  const days = Array.from(new Set(sessions.map((s) => s.completedAt.slice(0, 10)))).sort();
  if (!days.length) return 0;
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const last = days[days.length - 1];
  // Streak is stale if last session was more than 1 day ago
  if (last !== today && last !== yesterday) return 0;
  let streak = 0;
  const anchor = new Date(last);
  for (let i = 0; i < 30; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    if (days.includes(d.toISOString().slice(0, 10))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Returns the dominant recovery status from the last 3 sessions that have
 * recovery feedback. Falls back to "normal" for legacy sessions.
 */
export function getFatigueStatus(sessions: TrackedWorkoutSession[]): RecoveryFeedback {
  const recent = sessions.slice(-3).filter((s) => s.recoveryFeedback);
  if (!recent.length) return "normal";
  const fatigued  = recent.filter((s) => s.recoveryFeedback === "fatigued").length;
  const energized = recent.filter((s) => s.recoveryFeedback === "energized").length;
  if (fatigued  >= 2) return "fatigued";
  if (energized >= 2) return "energized";
  return "normal";
}

/**
 * Suggest today's training intensity based on recent fatigue + performance.
 */
export function getSuggestedIntensity(
  sessions: TrackedWorkoutSession[],
): "light" | "normal" | "push" {
  const fatigue = getFatigueStatus(sessions);
  const avg     = rollingAverage(sessions, 3);
  if (fatigue === "fatigued") return "light";
  if (avg >= 80 && fatigue === "energized") return "push";
  return "normal";
}

/**
 * Returns a short, positive motivational message based on the user's trend.
 */
export function getProgressMessage(sessions: TrackedWorkoutSession[]): string {
  if (!sessions.length) return "Start your first session to begin tracking your progress.";
  const avg       = rollingAverage(sessions, 3);
  const streak    = getConsistencyStreak(sessions);
  const intensity = getSuggestedIntensity(sessions);
  const fatigue   = getFatigueStatus(sessions);
  if (avg >= 90)            return "You're adapting exceptionally well. Next level is within reach.";
  if (avg >= 80)            return "Outstanding consistency. You're ready to begin transition training.";
  if (avg >= 70)            return "Your endurance is steadily improving. Keep showing up.";
  if (fatigue === "fatigued") return "Recovery is part of the process. A lighter session today builds long-term resilience.";
  if (streak >= 5)          return `${streak} days strong. Momentum is your greatest tool.`;
  if (streak >= 3)          return "Three days in a row. Consistency is the only secret.";
  if (avg >= 60)            return "Solid foundation forming. Each session compounds over time.";
  if (intensity === "light") return "Ease in today. Sustainable progress is the goal.";
  return "Every session moves you forward. Consistency over intensity.";
}

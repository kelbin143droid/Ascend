/**
 * dailyRecommendationEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure orchestration layer that answers "What should I do today?"
 *
 * getDailyRecommendation — completely side-effect-free, accepts all inputs as
 * parameters, returns a plain object. No localStorage, no API calls.
 *
 * assembleDailyProfile   — the ONE place that reads stores; isolates all I/O
 * so the engine stays fully testable.
 */

import type { WorkoutLevel } from "./workoutPlans";
import type { TrackedWorkoutSession, RecoveryFeedback } from "./workoutProgressionEngine";
import {
  getConsistencyStreak,
  getFatigueStatus,
  getReadinessPercent,
} from "./workoutProgressionEngine";
import { getAllSessions, getWorkoutLevel } from "./workoutProgressStore";
import { getBreathingProfile } from "./breathingStore";
import type { BreathingProfile } from "./breathingProgressionSystem";
import type { CalibrationProfile } from "./calibrationEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecommendationType =
  | "MOMENTUM_RECOVERY"
  | "RECOVERY_SESSION"
  | "TRAINING_READINESS_HIGH"
  | "CONTINUE_MOMENTUM"
  | "BEGIN_DAILY_FLOW";

export type IntensityLevel = "rest" | "light" | "normal" | "push";
export type FlowVariant    = "recovery" | "light" | "full" | "push";
export type ConsistencyTrend = "improving" | "stable" | "declining";

export interface DailyProfile {
  workoutSessions:  TrackedWorkoutSession[];
  breathingProfile: BreathingProfile;
  streak:           number;
  missedDays:       number;
  lastFlowDate:     string | null;
  calibrationLevel: WorkoutLevel;
  fatigue:          RecoveryFeedback;
  readiness:        number;
}

export interface ProgressSnapshot {
  streak:           number;
  readinessPercent: number;
  recoveryState:    RecoveryFeedback;
  consistencyTrend: ConsistencyTrend;
}

export interface DailyRecommendation {
  type:             RecommendationType;
  headline:         string;
  subtext:          string;
  intensity:        IntensityLevel;
  flowVariant:      FlowVariant;
  quickActions:     string[];
  progressSnapshot: ProgressSnapshot;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function computeConsistencyTrend(sessions: TrackedWorkoutSession[]): ConsistencyTrend {
  if (sessions.length < 6) return "stable";
  const recent = sessions.slice(-3).reduce((s, x) => s + x.performanceScore, 0) / 3;
  const older  = sessions.slice(-6, -3).reduce((s, x) => s + x.performanceScore, 0) / 3;
  if (recent - older >= 8)  return "improving";
  if (older  - recent >= 8) return "declining";
  return "stable";
}

function buildSnapshot(profile: DailyProfile): ProgressSnapshot {
  return {
    streak:           profile.streak,
    readinessPercent: profile.readiness,
    recoveryState:    profile.fatigue,
    consistencyTrend: computeConsistencyTrend(profile.workoutSessions),
  };
}

// ── Engine ────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS: Record<RecommendationType, string[]> = {
  MOMENTUM_RECOVERY:      ["Calm Breathing", "Light Stretch"],
  RECOVERY_SESSION:       ["Calm Breathing", "Light Stretch", "Hydrate"],
  TRAINING_READINESS_HIGH: ["Begin Flow", "Strength Focus", "Push Cardio"],
  CONTINUE_MOMENTUM:      ["Begin Flow", "Track Progress"],
  BEGIN_DAILY_FLOW:       ["Begin Flow", "Review Path"],
};

const HEADLINES: Record<RecommendationType, string> = {
  MOMENTUM_RECOVERY:      "Welcome back. Let's ease in.",
  RECOVERY_SESSION:       "Rest is progress. Light day ahead.",
  TRAINING_READINESS_HIGH: "You're primed. Push today.",
  CONTINUE_MOMENTUM:      "Keep the streak alive.",
  BEGIN_DAILY_FLOW:       "Begin your daily flow.",
};

const SUBTEXTS: Record<RecommendationType, string> = {
  MOMENTUM_RECOVERY:
    "It's been a few days. A light session re-activates momentum without risking burnout.",
  RECOVERY_SESSION:
    "Your recent sessions signal fatigue. Breathing and light movement restore more than rest alone.",
  TRAINING_READINESS_HIGH:
    "Energy is high, consistency is building. This is the window — give it your full effort.",
  CONTINUE_MOMENTUM:
    "Consistency compounds. Show up today and the habit grows stronger.",
  BEGIN_DAILY_FLOW:
    "Every system starts with a first step. Your flow is ready when you are.",
};

const INTENSITIES: Record<RecommendationType, IntensityLevel> = {
  MOMENTUM_RECOVERY:       "light",
  RECOVERY_SESSION:        "rest",
  TRAINING_READINESS_HIGH: "push",
  CONTINUE_MOMENTUM:       "normal",
  BEGIN_DAILY_FLOW:        "normal",
};

const FLOW_VARIANTS: Record<RecommendationType, FlowVariant> = {
  MOMENTUM_RECOVERY:       "light",
  RECOVERY_SESSION:        "recovery",
  TRAINING_READINESS_HIGH: "push",
  CONTINUE_MOMENTUM:       "full",
  BEGIN_DAILY_FLOW:        "full",
};

/**
 * Core decision function — fully pure.
 * Evaluates signals in strict priority order and returns a recommendation.
 */
export function getDailyRecommendation(profile: DailyProfile): DailyRecommendation {
  const snapshot = buildSnapshot(profile);
  const hasHistory = profile.workoutSessions.length > 0;

  // 1 — Missed 3+ days → gentle re-entry regardless of anything else
  if (profile.missedDays >= 3) {
    return {
      type:             "MOMENTUM_RECOVERY",
      headline:         HEADLINES.MOMENTUM_RECOVERY,
      subtext:          SUBTEXTS.MOMENTUM_RECOVERY,
      intensity:        INTENSITIES.MOMENTUM_RECOVERY,
      flowVariant:      FLOW_VARIANTS.MOMENTUM_RECOVERY,
      quickActions:     QUICK_ACTIONS.MOMENTUM_RECOVERY,
      progressSnapshot: snapshot,
    };
  }

  // 2 — Fatigue override → recovery session
  if (profile.fatigue === "fatigued") {
    return {
      type:             "RECOVERY_SESSION",
      headline:         HEADLINES.RECOVERY_SESSION,
      subtext:          SUBTEXTS.RECOVERY_SESSION,
      intensity:        INTENSITIES.RECOVERY_SESSION,
      flowVariant:      FLOW_VARIANTS.RECOVERY_SESSION,
      quickActions:     QUICK_ACTIONS.RECOVERY_SESSION,
      progressSnapshot: snapshot,
    };
  }

  // 3 — High readiness + energized + streak ≥ 3 → push
  if (
    profile.readiness >= 75 &&
    profile.fatigue === "energized" &&
    profile.streak >= 3
  ) {
    return {
      type:             "TRAINING_READINESS_HIGH",
      headline:         HEADLINES.TRAINING_READINESS_HIGH,
      subtext:          SUBTEXTS.TRAINING_READINESS_HIGH,
      intensity:        INTENSITIES.TRAINING_READINESS_HIGH,
      flowVariant:      FLOW_VARIANTS.TRAINING_READINESS_HIGH,
      quickActions:     QUICK_ACTIONS.TRAINING_READINESS_HIGH,
      progressSnapshot: snapshot,
    };
  }

  // 4 — Streak 1–2, normal fatigue (in motion but not a push day) → momentum
  if (hasHistory && profile.streak >= 1 && profile.streak <= 2 && profile.fatigue === "normal") {
    return {
      type:             "CONTINUE_MOMENTUM",
      headline:         HEADLINES.CONTINUE_MOMENTUM,
      subtext:          SUBTEXTS.CONTINUE_MOMENTUM,
      intensity:        INTENSITIES.CONTINUE_MOMENTUM,
      flowVariant:      FLOW_VARIANTS.CONTINUE_MOMENTUM,
      quickActions:     QUICK_ACTIONS.CONTINUE_MOMENTUM,
      progressSnapshot: snapshot,
    };
  }

  // 5 + default — No history / first day / catch-all
  return {
    type:             "BEGIN_DAILY_FLOW",
    headline:         HEADLINES.BEGIN_DAILY_FLOW,
    subtext:          SUBTEXTS.BEGIN_DAILY_FLOW,
    intensity:        INTENSITIES.BEGIN_DAILY_FLOW,
    flowVariant:      FLOW_VARIANTS.BEGIN_DAILY_FLOW,
    quickActions:     QUICK_ACTIONS.BEGIN_DAILY_FLOW,
    progressSnapshot: snapshot,
  };
}

// ── Store assembler (the ONLY function that touches localStorage) ──────────────

/**
 * Reads all relevant stores and assembles a DailyProfile ready for the engine.
 * Must only be called from a browser context (has localStorage access).
 */
export function assembleDailyProfile(): DailyProfile {
  const sessions        = getAllSessions();
  const breathingProfile = getBreathingProfile();
  const streak          = getConsistencyStreak(sessions);
  const fatigue         = getFatigueStatus(sessions);
  const readiness       = getReadinessPercent(sessions);

  // Calibration level: prefer the calibrated level stored by CalibrationFlow,
  // otherwise fall back to whatever the workout store has.
  let calibrationLevel: WorkoutLevel = getWorkoutLevel();
  try {
    const raw = localStorage.getItem("ascend_calibration");
    if (raw) {
      const parsed = JSON.parse(raw) as CalibrationProfile;
      if (parsed.derivedLevel) calibrationLevel = parsed.derivedLevel;
    }
  } catch { /* silently use fallback */ }

  // Last flow completion date (set by Day6Home on flow complete)
  let lastFlowDate: string | null = null;
  try {
    lastFlowDate = localStorage.getItem("ascend_light_movement_completed") ?? null;
  } catch { /* ignore */ }

  // Missed days: days since last flow, capped at 30 to avoid extreme values
  let missedDays = 0;
  if (lastFlowDate) {
    try {
      const last  = new Date(lastFlowDate);
      const today = new Date();
      const diffMs = today.setHours(0,0,0,0) - last.setHours(0,0,0,0);
      const diffDays = Math.floor(diffMs / 86_400_000);
      // diffDays === 0 means completed today, 1 means yesterday, etc.
      if (!isNaN(diffDays)) {
        missedDays = Math.max(0, Math.min(diffDays - 1, 30));
      }
    } catch { /* corrupted date — treat as no prior flow */ }
  }

  return {
    workoutSessions:  sessions,
    breathingProfile,
    streak,
    missedDays,
    lastFlowDate,
    calibrationLevel,
    fatigue,
    readiness,
  };
}

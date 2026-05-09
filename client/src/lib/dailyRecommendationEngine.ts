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

export type IntensityLevel   = "rest" | "light" | "normal" | "push";
export type FlowVariant      = "recovery" | "light" | "full" | "push";
export type ConsistencyTrend = "improving" | "stable" | "declining";
export type CalibrationPath  = "Foundation" | "Build" | "Evolve" | "Ascend";

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
  journeyTitle:     string;
  calibrationPath:  CalibrationPath;
  intensity:        IntensityLevel;
  flowVariant:      FlowVariant;
  quickActions:     string[];
  progressSnapshot: ProgressSnapshot;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveCalibrationPath(level: WorkoutLevel): CalibrationPath {
  if (level === "entry")        return "Foundation";
  if (level === "beginner")     return "Build";
  if (level === "intermediate") return "Evolve";
  return "Ascend";
}

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

// ── Content tables ────────────────────────────────────────────────────────────

const QUICK_ACTIONS: Record<RecommendationType, string[]> = {
  MOMENTUM_RECOVERY:       ["Calm Breathing", "Light Stretch"],
  RECOVERY_SESSION:        ["Calm Breathing", "Light Stretch", "Hydrate"],
  TRAINING_READINESS_HIGH: ["Begin Flow", "Strength Focus", "Push Cardio"],
  CONTINUE_MOMENTUM:       ["Begin Flow", "Track Progress"],
  BEGIN_DAILY_FLOW:        ["Begin Flow", "Review Path"],
};

// Journey title — the dominant heading on Zone 1, calibration-path-aware
const JOURNEY_TITLES: Record<CalibrationPath, Record<RecommendationType, string>> = {
  Foundation: {
    BEGIN_DAILY_FLOW:        "Foundation Flow",
    CONTINUE_MOMENTUM:       "Foundation Progress",
    MOMENTUM_RECOVERY:       "Foundation Reset",
    RECOVERY_SESSION:        "Gentle Recovery",
    TRAINING_READINESS_HIGH: "Foundation Push",
  },
  Build: {
    BEGIN_DAILY_FLOW:        "Build Routine",
    CONTINUE_MOMENTUM:       "Build Momentum",
    MOMENTUM_RECOVERY:       "Momentum Reset",
    RECOVERY_SESSION:        "Recovery Day",
    TRAINING_READINESS_HIGH: "Build Push",
  },
  Evolve: {
    BEGIN_DAILY_FLOW:        "Evolve Flow",
    CONTINUE_MOMENTUM:       "Evolve Momentum",
    MOMENTUM_RECOVERY:       "Evolve Reset",
    RECOVERY_SESSION:        "Evolve Recovery",
    TRAINING_READINESS_HIGH: "Evolve Peak",
  },
  Ascend: {
    BEGIN_DAILY_FLOW:        "Ascend Protocol",
    CONTINUE_MOMENTUM:       "Ascend Protocol",
    MOMENTUM_RECOVERY:       "System Reset",
    RECOVERY_SESSION:        "Ascend Recovery",
    TRAINING_READINESS_HIGH: "Peak Session",
  },
};

// Headline — short secondary line shown below the journey title
const PATH_HEADLINES: Record<CalibrationPath, Record<RecommendationType, string>> = {
  Foundation: {
    BEGIN_DAILY_FLOW:        "Begin your foundation.",
    CONTINUE_MOMENTUM:       "Keep building.",
    MOMENTUM_RECOVERY:       "Welcome back. Ease in.",
    RECOVERY_SESSION:        "Rest is progress.",
    TRAINING_READINESS_HIGH: "Energy is up. Light push.",
  },
  Build: {
    BEGIN_DAILY_FLOW:        "Begin your daily flow.",
    CONTINUE_MOMENTUM:       "Keep the streak alive.",
    MOMENTUM_RECOVERY:       "Welcome back. Ease in.",
    RECOVERY_SESSION:        "Rest is progress. Light day.",
    TRAINING_READINESS_HIGH: "You're primed. Push today.",
  },
  Evolve: {
    BEGIN_DAILY_FLOW:        "Your Evolve flow is ready.",
    CONTINUE_MOMENTUM:       "Momentum is building.",
    MOMENTUM_RECOVERY:       "Welcome back. Re-engage.",
    RECOVERY_SESSION:        "Recovery day. Restore.",
    TRAINING_READINESS_HIGH: "Full readiness. Push hard.",
  },
  Ascend: {
    BEGIN_DAILY_FLOW:        "Run the protocol.",
    CONTINUE_MOMENTUM:       "Protocol active. Continue.",
    MOMENTUM_RECOVERY:       "System reset. Re-engage.",
    RECOVERY_SESSION:        "Strategic recovery.",
    TRAINING_READINESS_HIGH: "Peak window open.",
  },
};

// Subtext — 1–2 sentences, emotionally clear, path and state aware
const PATH_SUBTEXTS: Record<CalibrationPath, Record<RecommendationType, string>> = {
  Foundation: {
    BEGIN_DAILY_FLOW:
      "Low friction, early wins. One session builds the next.",
    CONTINUE_MOMENTUM:
      "Consistency is the skill. Showing up today is the achievement.",
    MOMENTUM_RECOVERY:
      "Starting again is the win. This flow is gentle by design.",
    RECOVERY_SESSION:
      "Rest is part of building. Today's flow protects your progress.",
    TRAINING_READINESS_HIGH:
      "Energy is up. A light push today builds real Foundation momentum.",
  },
  Build: {
    BEGIN_DAILY_FLOW:
      "Structure builds discipline. Today's session starts the pattern.",
    CONTINUE_MOMENTUM:
      "Balanced challenge. Consistent structure. Keep the momentum alive.",
    MOMENTUM_RECOVERY:
      "Welcome back. A moderate re-entry re-activates your momentum.",
    RECOVERY_SESSION:
      "Recovery is progress. Breathing and movement restore more than rest.",
    TRAINING_READINESS_HIGH:
      "Energy is high, consistency is building. This is the window — push today.",
  },
  Evolve: {
    BEGIN_DAILY_FLOW:
      "Structured progress. Each session builds toward the next level.",
    CONTINUE_MOMENTUM:
      "Each session deepens the system. Consistency compounds.",
    MOMENTUM_RECOVERY:
      "Re-entry is a skill. Your system remembers — ease back in.",
    RECOVERY_SESSION:
      "Strategic recovery prevents breakdown. Today you restore and rebuild.",
    TRAINING_READINESS_HIGH:
      "High readiness detected. Your Evolve protocol runs at full intensity.",
  },
  Ascend: {
    BEGIN_DAILY_FLOW:
      "Mastery begins with the daily protocol. Run it.",
    CONTINUE_MOMENTUM:
      "Optimization pacing. Precision effort. The system compounds.",
    MOMENTUM_RECOVERY:
      "Even systems need resets. A measured re-entry sustains your baseline.",
    RECOVERY_SESSION:
      "Optimal performance requires strategic recovery. Today you restore.",
    TRAINING_READINESS_HIGH:
      "Peak readiness. Your Ascend protocol runs at maximum capacity today.",
  },
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

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Core decision function — fully pure.
 * Evaluates signals in strict priority order and returns a recommendation.
 */
export function getDailyRecommendation(profile: DailyProfile): DailyRecommendation {
  const snapshot        = buildSnapshot(profile);
  const hasHistory      = profile.workoutSessions.length > 0;
  const calibrationPath = deriveCalibrationPath(profile.calibrationLevel);

  function makeRec(type: RecommendationType): DailyRecommendation {
    return {
      type,
      headline:         PATH_HEADLINES[calibrationPath][type],
      subtext:          PATH_SUBTEXTS[calibrationPath][type],
      journeyTitle:     JOURNEY_TITLES[calibrationPath][type],
      calibrationPath,
      intensity:        INTENSITIES[type],
      flowVariant:      FLOW_VARIANTS[type],
      quickActions:     QUICK_ACTIONS[type],
      progressSnapshot: snapshot,
    };
  }

  // 1 — Missed 3+ days → gentle re-entry regardless of anything else
  if (profile.missedDays >= 3) return makeRec("MOMENTUM_RECOVERY");

  // 2 — Fatigue override → recovery session
  if (profile.fatigue === "fatigued") return makeRec("RECOVERY_SESSION");

  // 3 — High readiness + energized + streak ≥ 3 → push
  if (
    profile.readiness >= 75 &&
    profile.fatigue   === "energized" &&
    profile.streak    >= 3
  ) {
    return makeRec("TRAINING_READINESS_HIGH");
  }

  // 4 — Streak 1–2, normal fatigue → momentum (in motion but not a push day)
  if (hasHistory && profile.streak >= 1 && profile.streak <= 2 && profile.fatigue === "normal") {
    return makeRec("CONTINUE_MOMENTUM");
  }

  // 5 + default — No history / first day / catch-all
  return makeRec("BEGIN_DAILY_FLOW");
}

// ── Store assembler (the ONLY function that touches localStorage) ──────────────

/**
 * Reads all relevant stores and assembles a DailyProfile ready for the engine.
 * Must only be called from a browser context (has localStorage access).
 */
export function assembleDailyProfile(): DailyProfile {
  const sessions         = getAllSessions();
  const breathingProfile = getBreathingProfile();
  const streak           = getConsistencyStreak(sessions);
  const fatigue          = getFatigueStatus(sessions);
  const readiness        = getReadinessPercent(sessions);

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
      const last     = new Date(lastFlowDate);
      const today    = new Date();
      const diffMs   = today.setHours(0, 0, 0, 0) - last.setHours(0, 0, 0, 0);
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

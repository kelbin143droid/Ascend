/**
 * calibrationEngine.ts
 * Pure functions for the System Sync calibration flow.
 * Workout level is derived directly from the powerOutput (Strength) tier
 * so that the pushup tier maps 1:1 to the training programme assigned.
 */

import type { WorkoutLevel } from "./workoutPlans";

// ── Answer types ───────────────────────────────────────────────────────────────

export interface CalibrationAnswers {
  /** Strength output 0–100, derived from pushup tier */
  powerOutput:     number;
  /** Recovery efficiency 0–100 */
  recoveryRate:    number;
  /** Mental signal clarity 0–100, derived from meditation tier */
  signalStability: number;
  /** Behavioural sync consistency 0–100 */
  syncRegularity:  number;
}

export interface CalibrationProfile extends CalibrationAnswers {
  derivedLevel: WorkoutLevel;
  completedAt:  string;
}

// ── Tier → WorkoutLevel mapping ────────────────────────────────────────────────

/**
 * Derives a WorkoutLevel from calibration answers.
 *
 * Uses the average of all four stats so that strength, recovery (sleep/hydration),
 * mindfulness, and consistency are all considered — a user with strong pushups
 * but poor sleep and inconsistent habits is placed at an appropriate level
 * rather than being over-assigned based on strength alone.
 *
 * Thresholds (average score 0–100):
 *   < 25  → entry        (Foundation)
 *   < 50  → beginner     (Build)
 *   < 75  → intermediate (Evolve)
 *   ≥ 75  → advanced     (Ascend)
 */
export function deriveCalibrationLevel(answers: CalibrationAnswers): WorkoutLevel {
  const avg = (
    answers.powerOutput +
    answers.recoveryRate +
    answers.signalStability +
    answers.syncRegularity
  ) / 4;
  if (avg < 25) return "entry";
  if (avg < 50) return "beginner";
  if (avg < 75) return "intermediate";
  return "advanced";
}

// ── Storage ────────────────────────────────────────────────────────────────────

export function saveCalibrationProfile(profile: CalibrationProfile): void {
  try { localStorage.setItem("ascend_calibration", JSON.stringify(profile)); } catch {}
}

export function getCalibrationProfile(): CalibrationProfile | null {
  try {
    const raw = localStorage.getItem("ascend_calibration");
    return raw ? (JSON.parse(raw) as CalibrationProfile) : null;
  } catch {
    return null;
  }
}

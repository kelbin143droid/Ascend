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
 * The workout level is driven purely by the Strength (powerOutput) tier:
 *   < 25  → entry        (Foundation — Wall / Incline pushup)
 *   < 50  → beginner     (Build — Knee pushup)
 *   < 75  → intermediate (Evolve — Regular floor pushup)
 *   ≥ 75  → advanced     (Ascend — Clap / decline / weighted)
 *
 * This ensures "Regular Form" maps directly to standard pushups in the
 * training engine, skipping wall and knee progressions.
 */
export function deriveCalibrationLevel(answers: CalibrationAnswers): WorkoutLevel {
  if (answers.powerOutput < 25) return "entry";
  if (answers.powerOutput < 50) return "beginner";
  if (answers.powerOutput < 75) return "intermediate";
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

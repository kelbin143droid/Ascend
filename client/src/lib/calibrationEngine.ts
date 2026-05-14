/**
 * calibrationEngine.ts
 * Pure functions for the System Sync calibration flow.
 * Uses 4 slider values (0–100 each) to derive a WorkoutLevel and persist
 * the calibration profile in localStorage under "ascend_calibration".
 */

import type { WorkoutLevel } from "./workoutPlans";

// ── Answer types (slider-based) ────────────────────────────────────────────────

export interface CalibrationAnswers {
  /** Physical output level 0–100 (maps to Strength) */
  powerOutput:     number;
  /** Recovery efficiency 0–100 (maps to Vitality) */
  recoveryRate:    number;
  /** Mental signal clarity 0–100 (maps to Sense) */
  signalStability: number;
  /** Behavioral sync consistency 0–100 (maps to Discipline / Agility) */
  syncRegularity:  number;
}

export interface CalibrationProfile extends CalibrationAnswers {
  derivedLevel: WorkoutLevel;
  completedAt:  string;
}

// ── Engine ─────────────────────────────────────────────────────────────────────

/**
 * Derives a recommended WorkoutLevel from 4 slider values.
 *
 * Average of all 4 sliders (0–100):
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

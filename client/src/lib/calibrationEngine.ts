/**
 * calibrationEngine.ts
 * Pure functions for the post-onboarding calibration flow.
 * Derives a recommended WorkoutLevel from 5 answered questions and
 * persists the profile in localStorage under "ascend_calibration".
 */

import type { WorkoutLevel } from "./workoutPlans";

// ── Answer types ───────────────────────────────────────────────────────────────

export type PhysicalReadiness = "inactive" | "somewhat" | "consistent" | "disciplined";
export type FocusStability    = "very_difficult" | "inconsistent" | "manageable" | "strong";
export type RoutineConsistency = "struggles" | "starts_stops" | "fairly" | "structured";
export type EnergyState       = "exhausted" | "unstable" | "balanced" | "strong";
export type StartingPace      = "slow" | "balanced" | "challenging";

export interface CalibrationAnswers {
  physicalReadiness:  PhysicalReadiness;
  focusStability:     FocusStability;
  routineConsistency: RoutineConsistency;
  energyState:        EnergyState;
  startingPace?:      StartingPace;
}

export interface CalibrationProfile extends CalibrationAnswers {
  derivedLevel: WorkoutLevel;
  completedAt:  string;
}

// ── Scoring tables ─────────────────────────────────────────────────────────────

const PHYS_SCORE: Record<PhysicalReadiness, number>    = { inactive: 0, somewhat: 1, consistent: 2, disciplined: 3 };
const FOCUS_SCORE: Record<FocusStability, number>      = { very_difficult: 0, inconsistent: 1, manageable: 2, strong: 3 };
const ROUTINE_SCORE: Record<RoutineConsistency, number> = { struggles: 0, starts_stops: 1, fairly: 2, structured: 3 };
const ENERGY_SCORE: Record<EnergyState, number>        = { exhausted: 0, unstable: 1, balanced: 2, strong: 3 };

// ── Engine ─────────────────────────────────────────────────────────────────────

/**
 * Derives a recommended WorkoutLevel from the calibration answers.
 * Body score   = physical + energy   (0–6)
 * Discipline   = focus + routine     (0–6)
 * Total        = body + discipline   (0–12)
 * Pace modifier: slow → −2, challenging → +2
 */
export function deriveCalibrationLevel(answers: CalibrationAnswers): WorkoutLevel {
  const body       = PHYS_SCORE[answers.physicalReadiness]    + ENERGY_SCORE[answers.energyState];
  const discipline = FOCUS_SCORE[answers.focusStability]      + ROUTINE_SCORE[answers.routineConsistency];
  let total        = body + discipline; // 0–12

  if (answers.startingPace === "slow")        total = Math.max(0, total - 2);
  if (answers.startingPace === "challenging") total = Math.min(12, total + 2);

  if (total <= 3)  return "entry";
  if (total <= 6)  return "beginner";
  if (total <= 9)  return "intermediate";
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

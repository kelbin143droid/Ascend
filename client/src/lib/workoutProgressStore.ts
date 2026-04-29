/**
 * workoutProgressStore.ts
 * Persists workout level choice, cardio config, full session history,
 * and per-level micro-progression state in localStorage.
 *
 * Backward compatible — existing sessions without new fields degrade gracefully.
 */

import type { WorkoutLevel, CardioIntensity, CardioPosition } from "./workoutPlans";
import {
  type TrackedWorkoutSession,
  type DifficultyRating,
  type MicroProgressState,
  calculatePerformanceScore,
  applyMicroProgression,
  type ProgressionAction,
} from "./workoutProgressionEngine";

export type { TrackedWorkoutSession, DifficultyRating, MicroProgressState };

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEY_LEVEL        = "ascend_workout_level";
const KEY_CARDIO       = "ascend_workout_cardio";
const KEY_HISTORY      = "ascend_workout_history_v2"; // v2 — richer schema
const KEY_MICRO        = "ascend_workout_micro";

// ── Level preference ──────────────────────────────────────────────────────────

export function getWorkoutLevel(): WorkoutLevel {
  try {
    const v = localStorage.getItem(KEY_LEVEL);
    if (v === "entry" || v === "beginner" || v === "intermediate" || v === "advanced") return v;
  } catch {}
  return "beginner";
}

export function setWorkoutLevel(level: WorkoutLevel): void {
  try { localStorage.setItem(KEY_LEVEL, level); } catch {}
}

// ── Cardio config ─────────────────────────────────────────────────────────────

export interface CardioPrefs {
  intensity: CardioIntensity;
  position: CardioPosition;
}

const DEFAULT_CARDIO: CardioPrefs = { intensity: "off", position: "after" };

export function getCardioPrefs(): CardioPrefs {
  try {
    const raw = localStorage.getItem(KEY_CARDIO);
    if (raw) return { ...DEFAULT_CARDIO, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CARDIO;
}

export function setCardioPrefs(patch: Partial<CardioPrefs>): void {
  try { localStorage.setItem(KEY_CARDIO, JSON.stringify({ ...getCardioPrefs(), ...patch })); } catch {}
}

// ── Session history ───────────────────────────────────────────────────────────

interface WorkoutHistory {
  sessions: TrackedWorkoutSession[];
}

function loadHistory(): WorkoutHistory {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { sessions: [] };
}

function saveHistory(h: WorkoutHistory): void {
  try { localStorage.setItem(KEY_HISTORY, JSON.stringify(h)); } catch {}
}

/**
 * Record a fully-tracked session.
 * Computes performance score automatically from the raw inputs.
 */
export function recordTrackedSession(
  level: WorkoutLevel,
  workoutCompleted: boolean,
  setsCompleted: number,
  totalSets: number,
  repsCompleted: number,
  targetReps: number,
  userDifficulty: DifficultyRating,
): TrackedWorkoutSession {
  const { total } = calculatePerformanceScore(
    workoutCompleted,
    setsCompleted,
    totalSets,
    repsCompleted,
    targetReps,
    userDifficulty,
  );

  const session: TrackedWorkoutSession = {
    level,
    completedAt: new Date().toISOString(),
    workoutCompleted,
    setsCompleted,
    totalSets,
    repsCompleted,
    targetReps,
    userDifficulty,
    performanceScore: total,
  };

  const history = loadHistory();
  history.sessions.push(session);
  if (history.sessions.length > 60) history.sessions = history.sessions.slice(-60);
  saveHistory(history);

  return session;
}

/** Legacy shim for any remaining callers that only pass hitMaxReps. */
export function recordWorkoutSession(level: WorkoutLevel, _hitMaxReps: boolean): void {
  recordTrackedSession(level, true, 3, 3, 30, 30, "same");
}

export function getRecentSessions(level: WorkoutLevel, count = 5): TrackedWorkoutSession[] {
  return loadHistory().sessions.filter((s) => s.level === level).slice(-count);
}

export function getTotalCompleted(level: WorkoutLevel): number {
  return loadHistory().sessions.filter((s) => s.level === level && s.workoutCompleted).length;
}

// ── Micro-progression state ───────────────────────────────────────────────────

const DEFAULT_MICRO: MicroProgressState = { repsBonus: 0, setsBonus: 0 };

function loadAllMicro(): Record<string, MicroProgressState> {
  try {
    const raw = localStorage.getItem(KEY_MICRO);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function getMicroProgress(level: WorkoutLevel): MicroProgressState {
  return loadAllMicro()[level] ?? { ...DEFAULT_MICRO };
}

export function saveMicroProgress(level: WorkoutLevel, state: MicroProgressState): void {
  const all = loadAllMicro();
  all[level] = state;
  try { localStorage.setItem(KEY_MICRO, JSON.stringify(all)); } catch {}
}

/**
 * Apply a progression action to the level's micro state and persist it.
 * Only applies actions that change local state (reps/sets bonuses).
 * Level-up and level-down are handled by the caller in TrainPage.
 */
export function applyAndSaveMicroProgression(
  level: WorkoutLevel,
  action: ProgressionAction,
): MicroProgressState {
  const current = getMicroProgress(level);
  const next = applyMicroProgression(current, action);
  saveMicroProgress(level, next);
  return next;
}

// ── Legacy compat ─────────────────────────────────────────────────────────────

/**
 * Still exported for the existing level-up suggestion banner.
 * Now delegates to the engine's average-score check.
 */
export function shouldSuggestLevelUp(level: WorkoutLevel): boolean {
  const sessions = getRecentSessions(level, 3);
  if (sessions.length < 3) return false;
  const avg = sessions.reduce((s, r) => s + r.performanceScore, 0) / sessions.length;
  return avg >= 80 && !sessions.slice(-2).every((s) => s.userDifficulty === "hard");
}

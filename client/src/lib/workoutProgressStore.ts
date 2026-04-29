/**
 * workoutProgressStore.ts
 * Persists the user's chosen workout level, cardio config, and
 * completion history locally. Used to detect "suggest level-up" moments.
 */

import type { WorkoutLevel, CardioIntensity, CardioPosition } from "./workoutPlans";

const KEY_LEVEL   = "ascend_workout_level";
const KEY_CARDIO  = "ascend_workout_cardio";
const KEY_HISTORY = "ascend_workout_history";

export interface WorkoutSession {
  level: WorkoutLevel;
  completedAt: string; // ISO date
  hitMaxReps: boolean; // user completed all exercises at max rep count
}

export interface WorkoutHistory {
  sessions: WorkoutSession[];
}

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
  const next = { ...getCardioPrefs(), ...patch };
  try { localStorage.setItem(KEY_CARDIO, JSON.stringify(next)); } catch {}
}

// ── Session history ───────────────────────────────────────────────────────────

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

export function recordWorkoutSession(level: WorkoutLevel, hitMaxReps: boolean): void {
  const history = loadHistory();
  history.sessions.push({
    level,
    completedAt: new Date().toISOString(),
    hitMaxReps,
  });
  // Keep last 60 sessions max
  if (history.sessions.length > 60) {
    history.sessions = history.sessions.slice(-60);
  }
  saveHistory(history);
}

/**
 * Returns true if the user has completed the current level at max reps
 * in the last N consecutive sessions — suggesting they should level up.
 */
export function shouldSuggestLevelUp(level: WorkoutLevel, consecutiveRequired = 2): boolean {
  const history = loadHistory();
  const forLevel = history.sessions.filter((s) => s.level === level);
  if (forLevel.length < consecutiveRequired) return false;
  const last = forLevel.slice(-consecutiveRequired);
  return last.every((s) => s.hitMaxReps);
}

export function getRecentSessions(level: WorkoutLevel, count = 5): WorkoutSession[] {
  const history = loadHistory();
  return history.sessions.filter((s) => s.level === level).slice(-count);
}

export function getTotalCompleted(level: WorkoutLevel): number {
  return loadHistory().sessions.filter((s) => s.level === level).length;
}

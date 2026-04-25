/**
 * Exercise log — rep-based exercise entries persisted in localStorage,
 * keyed by ISO date. Acts as the single source of truth for calories
 * burned. The energy engine reads from here; nothing else mutates burn.
 *
 * On every mutation we dispatch `ascend:exercise-changed` so subscribed
 * views can re-render without a global store dependency.
 */

export type ExerciseType = "pushups" | "situps" | "squats";

export const EXERCISE_TYPES: ExerciseType[] = ["pushups", "situps", "squats"];

export const EXERCISE_LABEL: Record<ExerciseType, string> = {
  pushups: "Push-ups",
  situps: "Sit-ups",
  squats: "Squats",
};

/** kcal burned per rep — kept simple per spec. */
export const EXERCISE_CALORIES_PER_REP: Record<ExerciseType, number> = {
  pushups: 0.4,
  situps: 0.3,
  squats: 0.5,
};

export interface ExerciseEntry {
  id: string;
  type: ExerciseType;
  reps: number;
  calories: number;
  timestamp: number;
}

const CHANGE_EVENT = "ascend:exercise-changed";
const STORAGE_PREFIX = "ascend_exercise_";

export function todayIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function key(date: string): string {
  return `${STORAGE_PREFIX}${date}`;
}

/** kcal for a given exercise + reps, rounded to 1 decimal. */
export function caloriesForExercise(type: ExerciseType, reps: number): number {
  const r = Math.max(0, Math.floor(reps));
  return Math.round(EXERCISE_CALORIES_PER_REP[type] * r * 10) / 10;
}

export function readExercises(date: string = todayIso()): ExerciseEntry[] {
  try {
    const raw = localStorage.getItem(key(date));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

function isValidEntry(e: unknown): e is ExerciseEntry {
  if (!e || typeof e !== "object") return false;
  const x = e as Partial<ExerciseEntry>;
  return (
    typeof x.id === "string" &&
    (x.type === "pushups" || x.type === "situps" || x.type === "squats") &&
    typeof x.reps === "number" &&
    typeof x.calories === "number" &&
    typeof x.timestamp === "number"
  );
}

function writeExercises(date: string, entries: ExerciseEntry[]): void {
  try {
    localStorage.setItem(key(date), JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { date } }));
  } catch (err) {
    console.warn("[exercise] persist failed", err);
  }
}

export function addExercise(
  type: ExerciseType,
  reps: number,
  date: string = todayIso(),
): ExerciseEntry | null {
  const r = Math.max(0, Math.floor(reps));
  if (r <= 0) return null;
  const entry: ExerciseEntry = {
    id: `ex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    reps: r,
    calories: caloriesForExercise(type, r),
    timestamp: Date.now(),
  };
  const list = readExercises(date);
  list.unshift(entry);
  writeExercises(date, list);
  return entry;
}

export function removeExercise(id: string, date: string = todayIso()): void {
  const list = readExercises(date).filter((e) => e.id !== id);
  writeExercises(date, list);
}

export interface ExerciseTotals {
  totalReps: number;
  totalCalories: number;
  count: number;
  perType: Record<ExerciseType, { reps: number; calories: number }>;
}

export function computeExerciseTotals(entries: ExerciseEntry[]): ExerciseTotals {
  const perType: ExerciseTotals["perType"] = {
    pushups: { reps: 0, calories: 0 },
    situps:  { reps: 0, calories: 0 },
    squats:  { reps: 0, calories: 0 },
  };
  let totalReps = 0;
  let totalCalories = 0;
  for (const e of entries) {
    perType[e.type].reps += e.reps;
    perType[e.type].calories += e.calories;
    totalReps += e.reps;
    totalCalories += e.calories;
  }
  return {
    totalReps,
    // Keep one decimal of precision so a single push-up (0.4 kcal) is not
    // erased by integer rounding. Display-time formatters round as needed.
    totalCalories: Math.round(totalCalories * 10) / 10,
    count: entries.length,
    perType,
  };
}

export function subscribeExercises(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/* ──────────────────────────────────────────────────────────────────
 * Guided-session integration
 *
 * The existing strength session in activityEngine.ts is *time-based*
 * (durationSeconds), but this exercise model is rep-based. We map
 * known step IDs (pushups_*, abs_*, squats_*) to ExerciseType and
 * estimate reps from the per-rep cadence used by the visual loops in
 * `animationRegistry.ts`. This keeps a single rep ↔ calorie pipeline.
 * ────────────────────────────────────────────────────────────────── */

const SECONDS_PER_REP: Record<ExerciseType, number> = {
  pushups: 2.4, // matches str_pushups loopDurationMs
  squats: 2.8,  // matches str_squats loopDurationMs
  situps: 2.5,  // sensible default; no registered loop
};

interface CompletedStep {
  id: string;
  durationSeconds?: number;
}

function stepIdToType(stepId: string): ExerciseType | null {
  if (stepId.startsWith("pushups")) return "pushups";
  if (stepId.startsWith("squats")) return "squats";
  if (stepId.startsWith("abs")) return "situps";
  return null;
}

/**
 * Iterate completed steps from a guided session and log a rep-based
 * exercise entry for each strength step. Skips steps without a
 * matching type or zero duration. Returns the number of entries
 * created so callers can report it.
 */
export function logExercisesFromGuidedSession(
  steps: CompletedStep[],
): number {
  let logged = 0;
  for (const s of steps) {
    const type = stepIdToType(s.id);
    if (!type) continue;
    const dur = s.durationSeconds ?? 0;
    if (dur <= 0) continue;
    const reps = Math.max(1, Math.floor(dur / SECONDS_PER_REP[type]));
    if (addExercise(type, reps)) logged += 1;
  }
  return logged;
}

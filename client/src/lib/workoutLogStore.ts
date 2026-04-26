/**
 * Workout log store — the single source of truth for "calories burned"
 * each day. After every Daily Flow circuit completes, exactly one entry
 * is written here with the circuit name and its summed calorie burn.
 *
 * Per-day shape (per spec):
 *   { date, workouts: [{name, calories}], caloriesBurned }
 *
 * Mutations dispatch `ascend:workout-log-changed` so the energy engine
 * and any subscribed views can re-render without a global store
 * dependency.
 *
 * Calorie formulas (used by the Daily Flow engines):
 *   reps:  kcal = perRep × reps         (pushups 0.4, situps 0.3, squats 0.5)
 *   time:  kcal = MET × kg × sec / 3600 (jumping_jacks 8, jog_in_place 7, plank 3.5)
 */

export interface WorkoutEntry {
  id: string;
  /** Human-readable name shown in the Nutrition log (e.g. "Physical Circuit"). */
  name: string;
  /** kcal burned, rounded to 1 decimal so single-rep contributions aren't erased. */
  calories: number;
  timestamp: number;
}

export interface WorkoutLogDay {
  date: string;
  workouts: WorkoutEntry[];
  caloriesBurned: number;
}

const STORAGE_PREFIX = "ascend_workout_log_";
const CHANGE_EVENT = "ascend:workout-log-changed";

/* ───────────────────────── Calorie tables ───────────────────────── */

/** kcal per rep — the rep-mode exercises in the Physical Circuit. */
export const REPS_KCAL: Record<string, number> = {
  pushups: 0.4,
  situps: 0.3,
  squats: 0.5,
};

/** MET coefficients — the time-mode exercises in the Cardio Circuit. */
export const TIME_MET: Record<string, number> = {
  jumping_jacks: 8.0,
  jog_in_place: 7.0,
  plank: 3.5,
  // Auxiliary cardio moves that show up in CardioSessionEngine — added
  // so they're never silently zero. Adjust freely.
  shadow_boxing: 6.0,
  jogging: 7.0, // alias used by CardioSessionEngine
};

export function caloriesForReps(name: string, reps: number): number {
  const perRep = REPS_KCAL[name];
  if (!perRep) return 0;
  const r = Math.max(0, Math.floor(reps));
  return Math.round(perRep * r * 10) / 10;
}

export function caloriesForTime(name: string, seconds: number, weightKg: number): number {
  const met = TIME_MET[name];
  if (!met || met <= 0 || weightKg <= 0 || seconds <= 0) return 0;
  return Math.round(((met * weightKg * seconds) / 3600) * 10) / 10;
}

/* ───────────────────────── Date / key helpers ───────────────────────── */

export function todayIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function key(date: string): string {
  return `${STORAGE_PREFIX}${date}`;
}

/* ───────────────────────── Reads ───────────────────────── */

function isValidEntry(e: unknown): e is WorkoutEntry {
  if (!e || typeof e !== "object") return false;
  const x = e as Partial<WorkoutEntry>;
  return (
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    typeof x.calories === "number" &&
    typeof x.timestamp === "number"
  );
}

/**
 * Read the full per-day shape from storage. Persists as
 * `{ date, workouts, caloriesBurned }` per spec; tolerates the legacy
 * raw-array shape (older builds wrote just the entry list).
 */
export function readWorkoutDay(date: string = todayIso()): WorkoutLogDay {
  const empty: WorkoutLogDay = { date, workouts: [], caloriesBurned: 0 };
  try {
    const raw = localStorage.getItem(key(date));
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    // Legacy: bare array of entries.
    if (Array.isArray(parsed)) {
      const entries = parsed.filter(isValidEntry);
      return { date, workouts: entries, caloriesBurned: totalCaloriesBurned(entries) };
    }
    // Current: full WorkoutLogDay object.
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Partial<WorkoutLogDay>;
      const entries = Array.isArray(obj.workouts) ? obj.workouts.filter(isValidEntry) : [];
      return { date, workouts: entries, caloriesBurned: totalCaloriesBurned(entries) };
    }
    return empty;
  } catch {
    return empty;
  }
}

/** Convenience reader returning just the entry list. */
export function readWorkouts(date: string = todayIso()): WorkoutEntry[] {
  return readWorkoutDay(date).workouts;
}

export function totalCaloriesBurned(entries: WorkoutEntry[]): number {
  let t = 0;
  for (const e of entries) t += e.calories;
  return Math.round(t * 10) / 10;
}

/* ───────────────────────── Writes ───────────────────────── */

function writeWorkouts(date: string, entries: WorkoutEntry[]): void {
  try {
    const day: WorkoutLogDay = {
      date,
      workouts: entries,
      caloriesBurned: totalCaloriesBurned(entries),
    };
    localStorage.setItem(key(date), JSON.stringify(day));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { date } }));
  } catch (err) {
    console.warn("[workout-log] persist failed", err);
  }
}

/**
 * Append a workout entry for the given date. Returns null if calories
 * are zero or negative (so the log doesn't get cluttered with no-ops).
 */
export function addWorkout(input: {
  name: string;
  calories: number;
  date?: string;
}): WorkoutEntry | null {
  const calories = Math.max(0, Math.round(input.calories * 10) / 10);
  if (calories <= 0) return null;
  const date = input.date ?? todayIso();
  const entry: WorkoutEntry = {
    id: `wo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: input.name,
    calories,
    timestamp: Date.now(),
  };
  const list = readWorkouts(date);
  list.unshift(entry);
  writeWorkouts(date, list);
  return entry;
}

export function removeWorkout(id: string, date: string = todayIso()): void {
  const list = readWorkouts(date).filter((e) => e.id !== id);
  writeWorkouts(date, list);
}

export function subscribeWorkouts(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

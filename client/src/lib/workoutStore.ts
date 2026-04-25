/**
 * Workout store — persists completed workout sessions per date and the
 * per-template progression "start date" used to compute weeks elapsed.
 * Mutations dispatch `ascend:workout-changed` so the energy engine and
 * any subscribed views can re-render without a global store dependency.
 */

export interface WorkoutSession {
  id: string;
  date: string;        // ISO yyyy-mm-dd
  templateId: string;
  roundsCompleted: number;
  totalCalories: number;
  timestamp: number;
}

const SESSIONS_PREFIX = "ascend_workouts_";
const PROGRESSION_KEY = "ascend_workout_progression";
const CHANGE_EVENT = "ascend:workout-changed";

function todayIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sessionsKey(date: string): string {
  return `${SESSIONS_PREFIX}${date}`;
}

/* ───────────────────────── Session reads / writes ───────────────────────── */

export function readSessions(date: string = todayIso()): WorkoutSession[] {
  try {
    const raw = localStorage.getItem(sessionsKey(date));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidSession) : [];
  } catch {
    return [];
  }
}

function isValidSession(s: unknown): s is WorkoutSession {
  if (!s || typeof s !== "object") return false;
  const x = s as Partial<WorkoutSession>;
  return (
    typeof x.id === "string" &&
    typeof x.date === "string" &&
    typeof x.templateId === "string" &&
    typeof x.roundsCompleted === "number" &&
    typeof x.totalCalories === "number" &&
    typeof x.timestamp === "number"
  );
}

function writeSessions(date: string, sessions: WorkoutSession[]): void {
  try {
    localStorage.setItem(sessionsKey(date), JSON.stringify(sessions));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { date } }));
  } catch (err) {
    console.warn("[workout] persist failed", err);
  }
}

export function addSession(input: {
  templateId: string;
  roundsCompleted: number;
  totalCalories: number;
  date?: string;
}): WorkoutSession {
  const date = input.date ?? todayIso();
  // First time the user completes this template, seed its progression
  // clock so weekly increases start from this date.
  markTemplateStarted(input.templateId, date);
  const session: WorkoutSession = {
    id: `wo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    date,
    templateId: input.templateId,
    roundsCompleted: Math.max(0, Math.floor(input.roundsCompleted)),
    totalCalories: Math.max(0, Math.round(input.totalCalories * 10) / 10),
    timestamp: Date.now(),
  };
  const list = readSessions(date);
  list.unshift(session);
  writeSessions(date, list);
  return session;
}

export function removeSession(id: string, date: string = todayIso()): void {
  const list = readSessions(date).filter((s) => s.id !== id);
  writeSessions(date, list);
}

export function totalSessionCalories(sessions: WorkoutSession[]): number {
  let t = 0;
  for (const s of sessions) t += s.totalCalories;
  return Math.round(t * 10) / 10;
}

export function subscribeWorkouts(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/* ───────────────────────── Progression tracking ───────────────────────── */

interface ProgressionMap {
  /** templateId → ISO date string when the user first encountered it. */
  [templateId: string]: string;
}

function readProgressionMap(): ProgressionMap {
  try {
    const raw = localStorage.getItem(PROGRESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgressionMap(map: ProgressionMap): void {
  try {
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Get the ISO date the user first started this template, or null if it
 * has never been started. Pure read — does not seed, so browsing the
 * template list never advances progression.
 */
export function getTemplateStartDate(templateId: string): string | null {
  const map = readProgressionMap();
  return map[templateId] ?? null;
}

/**
 * Seed the progression "start date" for a template the first time the
 * user actually completes a session of it. Subsequent calls are no-ops.
 */
export function markTemplateStarted(templateId: string, date: string = todayIso()): void {
  const map = readProgressionMap();
  if (map[templateId]) return;
  map[templateId] = date;
  writeProgressionMap(map);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function weeksElapsed(templateId: string, now: Date = new Date()): number {
  const start = getTemplateStartDate(templateId);
  if (!start) return 0; // un-started template → still on week 1 (base values)
  const startDate = new Date(`${start}T00:00:00`);
  const todayDate = new Date(`${todayIso(now)}T00:00:00`);
  const diffMs = todayDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 0;
  return Math.floor(diffMs / MS_PER_DAY / 7);
}

export { todayIso };

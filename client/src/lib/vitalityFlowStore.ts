/**
 * Trigger-based Vitality Flow tracking.
 *
 * Stores (per ISO date) completion of the morning Wake Flow and evening
 * Night Flow, plus rolling streaks, the user's adaptive food-cutoff
 * window, and last sleep/wake timestamps used for sleep consistency.
 *
 * Persisted in localStorage. Mutations dispatch
 * `ascend:vitality-flow-changed` for in-page reactivity.
 */

import { addWater } from "./nutritionStore";

const STORAGE_KEY = "ascend_vitality_flow";
const CHANGE_EVENT = "ascend:vitality-flow-changed";

export type SkipReason =
  | "too_tired"
  | "no_time"
  | "outside_routine"
  | "other";

export type DreamRecall = "none" | "faint" | "vivid";

export interface DailyFlowRecord {
  date: string;                // YYYY-MM-DD
  wakeCompleted: boolean;
  wakeStartedAt?: number;      // epoch ms
  wakeCompletedAt?: number;
  hydrated: boolean;           // morning glass logged
  lightExposure: boolean;
  movement: boolean;
  nightCompleted: boolean;
  nightCompletedAt?: number;
  foodCutoffHeld: boolean;     // honored cutoff window
  bedTime?: number;            // epoch ms (when night flow finished)
  wakeTime?: number;           // epoch ms (when wake flow started)
  skipped?: { phase: string; reason: SkipReason }[];
  /** Subjective REM recall logged by the morning debrief. */
  dreamRecall?: DreamRecall;
  /** Self-reported sleep quality 1-5 from the morning debrief. */
  sleepQuality?: number;
  /** Target bedtime computed from cycle settings, snapshotted when night flow began. */
  targetBedTime?: number;
  /** Hours since last caffeine when night flow ran. */
  caffeineHoursAgo?: number;
  /** True if user logged alcohol consumption tonight. */
  hadAlcohol?: boolean;
}

export interface VitalityFlowState {
  /** Rolling streak of consecutive days with wake flow completion. */
  wakeStreak: number;
  /** Rolling streak of consecutive days with at least the morning hydration. */
  hydrationStreak: number;
  /** Rolling streak of consecutive nights with food cutoff held. */
  cutoffStreak: number;
  /** Adaptive food-cutoff window in minutes (starts at 30). */
  cutoffMinutes: number;
  /** History keyed by ISO date. */
  history: Record<string, DailyFlowRecord>;
}

export const CUTOFF_LADDER = [30, 45, 60, 90];
const STREAK_TO_PROGRESS_CUTOFF = 4; // 3-5 successful days → bump

function todayIso(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyDay(date: string): DailyFlowRecord {
  return {
    date,
    wakeCompleted: false,
    hydrated: false,
    lightExposure: false,
    movement: false,
    nightCompleted: false,
    foodCutoffHeld: false,
  };
}

function emptyState(): VitalityFlowState {
  return {
    wakeStreak: 0,
    hydrationStreak: 0,
    cutoffStreak: 0,
    cutoffMinutes: 30,
    history: {},
  };
}

function read(): VitalityFlowState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<VitalityFlowState>;
    return {
      wakeStreak: parsed.wakeStreak ?? 0,
      hydrationStreak: parsed.hydrationStreak ?? 0,
      cutoffStreak: parsed.cutoffStreak ?? 0,
      cutoffMinutes: parsed.cutoffMinutes ?? 30,
      history: parsed.history ?? {},
    };
  } catch {
    return emptyState();
  }
}

function write(state: VitalityFlowState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch (err) {
    console.warn("[vitalityFlow] persist failed", err);
  }
}

export function getState(): VitalityFlowState {
  return read();
}

export function getToday(): DailyFlowRecord {
  const state = read();
  const date = todayIso();
  return state.history[date] ?? emptyDay(date);
}

function mutateToday(updater: (rec: DailyFlowRecord) => DailyFlowRecord): VitalityFlowState {
  const state = read();
  const date = todayIso();
  const prev = state.history[date] ?? emptyDay(date);
  state.history[date] = updater({ ...prev });
  write(state);
  return state;
}

/* ─────────────── Wake Flow events ─────────────── */

export function markWakeStarted(): void {
  mutateToday((rec) => {
    if (!rec.wakeStartedAt) {
      rec.wakeStartedAt = Date.now();
      rec.wakeTime = Date.now();
    }
    return rec;
  });
}

export function markHydrated(ml = 250): void {
  // Mirror into the nutrition hydration card for one source of truth.
  try { addWater(ml); } catch {}
  // Idempotent streak update — only the first call of the day advances the streak.
  const state = read();
  const date = todayIso();
  const prev = state.history[date] ?? emptyDay(date);
  const firstMarkToday = !prev.hydrated;
  prev.hydrated = true;
  state.history[date] = prev;
  if (firstMarkToday) {
    const yesterday = todayIso(new Date(Date.now() - 86_400_000));
    const wasYesterday = state.history[yesterday]?.hydrated ?? false;
    state.hydrationStreak = wasYesterday ? state.hydrationStreak + 1 : 1;
  }
  write(state);
}

export function markLightExposure(): void {
  mutateToday((rec) => {
    rec.lightExposure = true;
    return rec;
  });
}

export function markMovement(): void {
  mutateToday((rec) => {
    rec.movement = true;
    return rec;
  });
}

export function recordSkip(phase: string, reason: SkipReason): void {
  mutateToday((rec) => {
    rec.skipped = [...(rec.skipped ?? []), { phase, reason }];
    return rec;
  });
}

export function markWakeCompleted(): VitalityFlowState {
  // Idempotent — re-running the flow same day does not double-count the streak.
  const state = read();
  const date = todayIso();
  const prev = state.history[date] ?? emptyDay(date);
  const firstCompleteToday = !prev.wakeCompleted;
  prev.wakeCompleted = true;
  prev.wakeCompletedAt = Date.now();
  state.history[date] = prev;
  if (firstCompleteToday) {
    const yesterday = todayIso(new Date(Date.now() - 86_400_000));
    const wasYesterday = state.history[yesterday]?.wakeCompleted ?? false;
    state.wakeStreak = wasYesterday ? state.wakeStreak + 1 : 1;
  }
  write(state);
  return state;
}

/* ─────────────── Night Flow events ─────────────── */

export function markFoodCutoffHeld(): void {
  // Idempotent — only the first hold of the day advances streak / cutoff ladder.
  const state = read();
  const date = todayIso();
  const prev = state.history[date] ?? emptyDay(date);
  const firstMarkToday = !prev.foodCutoffHeld;
  prev.foodCutoffHeld = true;
  state.history[date] = prev;
  if (firstMarkToday) {
    const yesterday = todayIso(new Date(Date.now() - 86_400_000));
    const wasYesterday = state.history[yesterday]?.foodCutoffHeld ?? false;
    state.cutoffStreak = wasYesterday ? state.cutoffStreak + 1 : 1;
    // Progress the cutoff ladder after 3-5 successful days.
    if (state.cutoffStreak >= STREAK_TO_PROGRESS_CUTOFF) {
      const idx = CUTOFF_LADDER.indexOf(state.cutoffMinutes);
      if (idx >= 0 && idx < CUTOFF_LADDER.length - 1) {
        state.cutoffMinutes = CUTOFF_LADDER[idx + 1];
        state.cutoffStreak = 0;
      }
    }
  }
  write(state);
}

export function markNightCompleted(): VitalityFlowState {
  const state = read();
  const date = todayIso();
  const prev = state.history[date] ?? emptyDay(date);
  prev.nightCompleted = true;
  prev.nightCompletedAt = Date.now();
  prev.bedTime = Date.now();
  state.history[date] = prev;
  write(state);
  return state;
}

/* ─────────────── REM-specific setters ─────────────── */

/** Snapshot tonight's target bedtime so the morning debrief can compare. */
export function setTargetBedTime(targetMs: number): void {
  mutateToday((rec) => {
    rec.targetBedTime = targetMs;
    return rec;
  });
}

export function setCaffeineHoursAgo(hours: number): void {
  mutateToday((rec) => {
    rec.caffeineHoursAgo = hours;
    return rec;
  });
}

export function setHadAlcohol(value: boolean): void {
  mutateToday((rec) => {
    rec.hadAlcohol = value;
    return rec;
  });
}

/**
 * Log this morning's dream recall. Stored against TODAY (the morning the
 * Wake Flow ran), not the previous night, so debriefs are simple to read.
 */
export function setDreamRecall(value: DreamRecall): void {
  mutateToday((rec) => {
    rec.dreamRecall = value;
    return rec;
  });
}

export function setSleepQuality(value: number): void {
  const clamped = Math.max(1, Math.min(5, Math.round(value)));
  mutateToday((rec) => {
    rec.sleepQuality = clamped;
    return rec;
  });
}

/* ─────────────── Insights ─────────────── */

export interface SleepInsight {
  averageBedTime: string | null;
  averageWakeTime: string | null;
  consistencyScore: number;     // 0..100
  daysAnalyzed: number;
}

function fmtTime(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = h % 12 || 12;
  const p = h < 12 ? "AM" : "PM";
  return `${hh}:${String(m).padStart(2, "0")} ${p}`;
}

export function computeSleepInsight(days = 7): SleepInsight {
  const state = read();
  const dates = Object.keys(state.history).sort().slice(-days);
  const beds: number[] = [];
  const wakes: number[] = [];
  for (const d of dates) {
    const rec = state.history[d];
    if (rec.bedTime) beds.push(new Date(rec.bedTime).getHours() * 60 + new Date(rec.bedTime).getMinutes());
    if (rec.wakeTime) wakes.push(new Date(rec.wakeTime).getHours() * 60 + new Date(rec.wakeTime).getMinutes());
  }
  if (beds.length === 0 && wakes.length === 0) {
    return { averageBedTime: null, averageWakeTime: null, consistencyScore: 0, daysAnalyzed: 0 };
  }
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const std = (xs: number[]) => {
    if (xs.length < 2) return 0;
    const m = avg(xs);
    return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  };
  // Lower stddev (in minutes) → higher consistency. 0 min = 100, 60+ min → 0.
  const variation = (std(beds) + std(wakes)) / 2;
  const score = Math.max(0, Math.min(100, Math.round(100 - (variation / 60) * 100)));
  const fmtMin = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = Math.round(m % 60);
    const hh = h % 12 || 12;
    const p = h < 12 ? "AM" : "PM";
    return `${hh}:${String(mm).padStart(2, "0")} ${p}`;
  };
  return {
    averageBedTime: beds.length ? fmtMin(avg(beds)) : null,
    averageWakeTime: wakes.length ? fmtMin(avg(wakes)) : null,
    consistencyScore: score,
    daysAnalyzed: Math.max(beds.length, wakes.length),
  };
}

/* ─────────────── REM insights ─────────────── */

export interface RemInsight {
  daysAnalyzed: number;
  recallCounts: { none: number; faint: number; vivid: number };
  /** Average self-reported sleep quality (1-5), null if no logs. */
  averageQuality: number | null;
  /** Average bedtime delta vs target (minutes; positive = late). */
  averageBedDeltaMin: number | null;
  /** Count of nights where bedtime was >30 min later than target. */
  lateNights: number;
  /** Approximate average completed cycles, null if no logs. */
  averageCycles: number | null;
  /** Trailing 7-day count of vivid recalls — used by adaptive engine. */
  vividRecallRate: number;  // 0..1
}

const CYCLE_MIN_LOCAL = 90;
const SLEEP_LATENCY_MIN_LOCAL = 14;

export function computeRemInsight(days = 7): RemInsight {
  const state = read();
  const dates = Object.keys(state.history).sort().slice(-days);

  const recallCounts = { none: 0, faint: 0, vivid: 0 };
  const qualities: number[] = [];
  const deltas: number[] = [];
  const cycles: number[] = [];
  let lateNights = 0;
  let recallTotal = 0;

  for (const d of dates) {
    const rec = state.history[d];
    if (!rec) continue;
    if (rec.dreamRecall) {
      recallCounts[rec.dreamRecall] += 1;
      recallTotal += 1;
    }
    if (typeof rec.sleepQuality === "number") qualities.push(rec.sleepQuality);
    if (rec.bedTime && rec.targetBedTime) {
      const delta = Math.round((rec.bedTime - rec.targetBedTime) / 60_000);
      deltas.push(delta);
      if (delta > 30) lateNights += 1;
    }
    if (rec.bedTime && rec.wakeTime && rec.wakeTime > rec.bedTime) {
      const totalMin = (rec.wakeTime - rec.bedTime) / 60_000 - SLEEP_LATENCY_MIN_LOCAL;
      if (totalMin > 0) cycles.push(totalMin / CYCLE_MIN_LOCAL);
    }
  }

  const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

  return {
    daysAnalyzed: dates.length,
    recallCounts,
    averageQuality: qualities.length ? Math.round((avg(qualities) ?? 0) * 10) / 10 : null,
    averageBedDeltaMin: deltas.length ? Math.round(avg(deltas) ?? 0) : null,
    lateNights,
    averageCycles: cycles.length ? Math.round((avg(cycles) ?? 0) * 10) / 10 : null,
    vividRecallRate: recallTotal > 0 ? recallCounts.vivid / recallTotal : 0,
  };
}

export function subscribeVitalityFlow(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

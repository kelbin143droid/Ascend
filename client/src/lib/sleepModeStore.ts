/**
 * Sleep Mode System.
 *
 * Controls how the Night Flow behaves. Four modes:
 *   - beginner   → full guided routine, all phases
 *   - adaptive   → dynamic, narrows based on recent completion
 *   - custom     → per-step toggles + wind-down time
 *   - minimal    → no full flow; just one wind-down notification
 *
 * The adaptive mode reads completion data from `vitalityFlowStore` to
 * decide which non-essential phases to hide on a given night.
 *
 * Persisted in localStorage. Mutations dispatch
 * `ascend:sleep-mode-changed` for in-page reactivity.
 */

import { getState as getFlowState, computeRemInsight } from "./vitalityFlowStore";
import {
  bedtimeForCycles,
  formatHM,
  recommendedCycles,
  type CycleCount,
  type WakeHM,
  VALID_CYCLES,
} from "./remCycleEngine";
import {
  isNativePlatform,
  scheduleTaskNotification,
  cancelTaskNotification,
  type ScheduleResult,
} from "./notificationService";

export type SleepMode = "beginner" | "adaptive" | "custom" | "minimal";

export interface CustomConfig {
  windDownReminder: boolean;
  foodCutoff: boolean;
  lowStimulation: boolean;
  sleepPriming: boolean;
  /** Wind-down notification offset in minutes BEFORE sleep block. */
  windDownOffsetMin: number;
}

export interface SleepModeState {
  mode: SleepMode;
  /** Used in custom mode. */
  custom: CustomConfig;
  /** ISO date when the user last dismissed the auto-switch prompt. */
  autoSwitchPromptDismissedAt?: string;
  /** Flag set once the user has been auto-promoted (or accepted the prompt). */
  promotedToAdaptive?: boolean;
  /** First-use timestamp for gating the 7–14 day auto-switch logic. */
  firstSeenAt: number;
  /** Desired wake time (24h) — drives cycle math across all modes. */
  wakeTime?: WakeHM;
  /** Targeted REM cycles tonight (4/5/6). Undefined → "auto" (best fit). */
  cycles?: CycleCount;
  /** When true, Night Flow asks the optional alcohol/caffeine prompt. */
  remPromptsEnabled?: boolean;
}

const STORAGE_KEY = "ascend_sleep_mode";
const CHANGE_EVENT = "ascend:sleep-mode-changed";

const DEFAULT_CUSTOM: CustomConfig = {
  windDownReminder: true,
  foodCutoff: true,
  lowStimulation: true,
  sleepPriming: true,
  windDownOffsetMin: 10,
};

function defaultState(): SleepModeState {
  return {
    mode: "beginner",
    custom: { ...DEFAULT_CUSTOM },
    firstSeenAt: Date.now(),
  };
}

function read(): SleepModeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = defaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<SleepModeState>;
    return {
      mode: parsed.mode ?? "beginner",
      custom: { ...DEFAULT_CUSTOM, ...(parsed.custom ?? {}) },
      autoSwitchPromptDismissedAt: parsed.autoSwitchPromptDismissedAt,
      promotedToAdaptive: parsed.promotedToAdaptive,
      firstSeenAt: parsed.firstSeenAt ?? Date.now(),
      wakeTime: parsed.wakeTime,
      cycles: parsed.cycles && (VALID_CYCLES as readonly number[]).includes(parsed.cycles) ? parsed.cycles : undefined,
      remPromptsEnabled: parsed.remPromptsEnabled ?? false,
    };
  } catch {
    return defaultState();
  }
}

function write(state: SleepModeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch (err) {
    console.warn("[sleepMode] persist failed", err);
  }
}

export function getSleepModeState(): SleepModeState {
  return read();
}

export function setMode(mode: SleepMode): void {
  const state = read();
  state.mode = mode;
  if (mode === "adaptive") state.promotedToAdaptive = true;
  write(state);
}

export function updateCustom(patch: Partial<CustomConfig>): void {
  const state = read();
  state.custom = { ...state.custom, ...patch };
  write(state);
}

export function setWakeTime(wake: WakeHM | undefined): void {
  const state = read();
  state.wakeTime = wake;
  write(state);
}

export function setCycles(cycles: CycleCount | undefined): void {
  const state = read();
  state.cycles = cycles;
  write(state);
}

export function setRemPromptsEnabled(enabled: boolean): void {
  const state = read();
  state.remPromptsEnabled = enabled;
  write(state);
}

export function dismissAutoSwitchPrompt(): void {
  const state = read();
  state.autoSwitchPromptDismissedAt = new Date().toISOString().slice(0, 10);
  write(state);
}

export function subscribeSleepMode(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/* ─────────────── Adaptive engine ─────────────── */

export interface AdaptiveSnapshot {
  /** % of last `windowDays` that the night flow was completed. */
  completionRate: number;
  /** Convenience pass-through from vitalityFlowStore. */
  consistencyScore: number;
  windowDays: number;
  daysAnalyzed: number;
  daysSinceFirstUse: number;
  /** Trailing 7-day REM signal: % vivid out of all recall logs. */
  vividRecallRate: number;
  /** Trailing 7-day count of nights where bedtime was >30 min late. */
  lateNights: number;
  /** Number of nights with any recall log in the trailing window. */
  recallSampleSize: number;
}

const ADAPTIVE_WINDOW_DAYS = 5;

function lastNDates(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return out;
}

export function computeAdaptiveSnapshot(): AdaptiveSnapshot {
  const flow = getFlowState();
  const dates = lastNDates(ADAPTIVE_WINDOW_DAYS);
  const present = dates.filter((d) => flow.history[d]).length;
  const completed = dates.filter((d) => flow.history[d]?.nightCompleted).length;
  // % over the WINDOW (not just analyzed days) so missed days count against rate.
  const completionRate = (completed / ADAPTIVE_WINDOW_DAYS) * 100;

  // Consistency from sleep timing variance (lazy import to avoid cycle).
  // Re-implementing the bed/wake stddev locally so we don't pull the whole helper.
  const beds: number[] = [];
  const wakes: number[] = [];
  const allDates = Object.keys(flow.history).sort().slice(-7);
  for (const d of allDates) {
    const rec = flow.history[d];
    if (rec.bedTime) {
      const bd = new Date(rec.bedTime);
      beds.push(bd.getHours() * 60 + bd.getMinutes());
    }
    if (rec.wakeTime) {
      const wd = new Date(rec.wakeTime);
      wakes.push(wd.getHours() * 60 + wd.getMinutes());
    }
  }
  const std = (xs: number[]) => {
    if (xs.length < 2) return 0;
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  };
  const variation = beds.length || wakes.length ? (std(beds) + std(wakes)) / 2 : 0;
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (variation / 60) * 100)));

  const state = read();
  const daysSinceFirstUse = Math.floor((Date.now() - state.firstSeenAt) / 86_400_000);

  const rem = computeRemInsight(7);
  const recallSampleSize =
    rem.recallCounts.none + rem.recallCounts.faint + rem.recallCounts.vivid;

  return {
    completionRate: Math.round(completionRate),
    consistencyScore,
    windowDays: ADAPTIVE_WINDOW_DAYS,
    daysAnalyzed: present,
    daysSinceFirstUse,
    vividRecallRate: rem.vividRecallRate,
    lateNights: rem.lateNights,
    recallSampleSize,
  };
}

/**
 * Resolve which night-flow phases should run tonight given the active mode.
 * Returns explicit booleans for every phase + whether to schedule a notification.
 */
export interface NightPlan {
  windDownReminder: boolean;   // schedule the wind-down ping
  foodCutoff: boolean;         // run phase 2
  lowStimulation: boolean;     // run phase 3
  sleepPriming: boolean;       // run phase 4
  showFullFlow: boolean;       // false → minimal mode (notification only)
  windDownOffsetMin: number;   // minutes before sleep start
  reason: string;              // human readable, used in UI
  /** Cycle-aware wake target (undefined if user hasn't set one yet). */
  wakeTime?: WakeHM;
  /** Resolved cycle count for tonight (user pick or adaptive default). */
  cycles?: CycleCount;
  /** When true, Night Flow surfaces the alcohol/caffeine micro-row. */
  remPromptsEnabled: boolean;
}

const HIGH_PERFORMER_RATE = 80;     // %
const RECOVERY_RATE = 50;           // % — drop below this re-enables guidance

export function getNightPlan(): NightPlan {
  const state = read();
  const offset = state.custom.windDownOffsetMin;
  const remPromptsEnabled = !!state.remPromptsEnabled;
  const wakeTime = state.wakeTime;
  const cycles = state.cycles;

  if (state.mode === "minimal") {
    return {
      windDownReminder: true,
      foodCutoff: false,
      lowStimulation: false,
      sleepPriming: false,
      showFullFlow: false,
      windDownOffsetMin: offset,
      reason: "Minimal mode — light reminder only.",
      wakeTime,
      cycles,
      remPromptsEnabled,
    };
  }
  if (state.mode === "custom") {
    const c = state.custom;
    const anyOn = c.foodCutoff || c.lowStimulation || c.sleepPriming;
    return {
      windDownReminder: c.windDownReminder,
      foodCutoff: c.foodCutoff,
      lowStimulation: c.lowStimulation,
      sleepPriming: c.sleepPriming,
      showFullFlow: anyOn,
      windDownOffsetMin: c.windDownOffsetMin,
      reason: "Custom mode — your selected steps only.",
      wakeTime,
      cycles,
      remPromptsEnabled,
    };
  }
  if (state.mode === "adaptive") {
    const snap = computeAdaptiveSnapshot();
    // REM signal — drives a full-flow recall recovery if either:
    //   • >2 late nights in the last 7
    //   • <20% vivid recall over 5+ logged days
    const remPoor =
      snap.lateNights > 2 ||
      (snap.recallSampleSize >= 5 && snap.vividRecallRate < 0.2);
    // High performer → trim non-essential prompts (low-stim).
    const highPerformer =
      snap.daysAnalyzed >= 3 &&
      snap.completionRate >= HIGH_PERFORMER_RATE &&
      !remPoor;
    // Slipping → force full flow back on regardless.
    const slipping =
      (snap.daysAnalyzed >= 3 && snap.completionRate < RECOVERY_RATE) || remPoor;
    return {
      windDownReminder: true,
      foodCutoff: true,
      lowStimulation: slipping || !highPerformer,
      sleepPriming: true,
      showFullFlow: true,
      windDownOffsetMin: offset,
      reason: remPoor
        ? "Adaptive — REM signals are weak, broadening guidance."
        : slipping
        ? "Adaptive — guidance increased to help you re-establish the rhythm."
        : highPerformer
        ? "Adaptive — light touch, you've earned it."
        : "Adaptive — standard guided flow.",
      wakeTime,
      cycles,
      remPromptsEnabled,
    };
  }
  // beginner (default)
  return {
    windDownReminder: true,
    foodCutoff: true,
    lowStimulation: true,
    sleepPriming: true,
    showFullFlow: true,
    windDownOffsetMin: offset,
    reason: "Beginner mode — full guided routine.",
    wakeTime,
    cycles,
    remPromptsEnabled,
  };
}

/* ─────────────── Wind-down notification sync ─────────────── */

/** Stable id for the wind-down notification so we can replace it. */
export const WIND_DOWN_NOTIFICATION_ID = "ascend_wind_down";

/**
 * Uses `scheduleTaskNotification` (stable string id) — NOT the generic
 * `scheduleNotification` — because every settings change re-syncs and we
 * need to replace the prior pending wind-down. `scheduleNotification`
 * auto-generates a new numeric id each call and would leak duplicates.
 */
async function scheduleWindDownNotification(opts: {
  wake: WakeHM;
  cycles: CycleCount;
  leadMinutes: number;
}): Promise<ScheduleResult> {
  if (!isNativePlatform()) {
    return { scheduled: false, reason: "not-native" };
  }
  const bedtime = bedtimeForCycles(opts.wake, opts.cycles);
  const fireAt = new Date(bedtime.getTime() - opts.leadMinutes * 60_000);
  if (fireAt.getTime() <= Date.now()) {
    await cancelTaskNotification(WIND_DOWN_NOTIFICATION_ID);
    return { scheduled: false, reason: "past-time" };
  }
  return scheduleTaskNotification(
    WIND_DOWN_NOTIFICATION_ID,
    `Wind down in ${opts.leadMinutes} min`,
    `Asleep by ${formatHM(bedtime)} for ${opts.cycles} REM cycles.`,
    fireAt,
    { source: "night-flow", route: "/night-flow" },
  );
}

async function cancelWindDownNotification(): Promise<void> {
  await cancelTaskNotification(WIND_DOWN_NOTIFICATION_ID);
}

/** Default wake target used when the user hasn't set one (preserves the
 *  pre-REM behavior of always firing a nightly wind-down reminder). */
const DEFAULT_WAKE: WakeHM = { hour: 7, minute: 0 };
const DEFAULT_CYCLES: CycleCount = 5;

/**
 * Apply current sleep settings to the OS wind-down notification.
 * Web is a no-op (notification service short-circuits there).
 *
 * Behavior:
 *   - Reminder OFF → cancel the notification.
 *   - Reminder ON  + wake time set → cycle-aware bedtime.
 *   - Reminder ON  + NO wake time → fall back to a 7:00 / 5-cycle target
 *     so users who haven't opted into REM tracking still get the nightly
 *     wind-down nudge they had before.
 *
 * Call after settings change and once per app boot. Idempotent.
 */
export async function syncWindDownNotification(): Promise<void> {
  const state = read();
  const plan = getNightPlan();
  if (!plan.windDownReminder) {
    await cancelWindDownNotification();
    return;
  }
  const wake = state.wakeTime ?? DEFAULT_WAKE;
  // Resolve cycles: explicit pick > best fit > sane default.
  let cycles: CycleCount = state.cycles ?? DEFAULT_CYCLES;
  if (!state.cycles) {
    const best = recommendedCycles(wake);
    if (best === 4 || best === 5 || best === 6) cycles = best;
  }
  await scheduleWindDownNotification({
    wake,
    cycles,
    leadMinutes: plan.windDownOffsetMin,
  });
}

/* ─────────────── Auto-switch prompt ─────────────── */

const AUTO_SWITCH_MIN_DAYS = 7;
const AUTO_SWITCH_MAX_DAYS = 14;

/**
 * True if we should surface the "switch to Adaptive" prompt right now.
 * Conditions: between day 7 and 14 of use, beginner mode active,
 * not already promoted, not dismissed today, and metrics ≥ 80%.
 */
export function shouldPromptAutoSwitch(): boolean {
  const state = read();
  if (state.mode !== "beginner" || state.promotedToAdaptive) return false;
  const todayIso = new Date().toISOString().slice(0, 10);
  if (state.autoSwitchPromptDismissedAt === todayIso) return false;
  const snap = computeAdaptiveSnapshot();
  if (snap.daysSinceFirstUse < AUTO_SWITCH_MIN_DAYS) return false;
  if (snap.daysSinceFirstUse > AUTO_SWITCH_MAX_DAYS && state.autoSwitchPromptDismissedAt) {
    // Past the window; respect prior dismissal forever.
    return false;
  }
  return snap.completionRate >= HIGH_PERFORMER_RATE && snap.consistencyScore >= HIGH_PERFORMER_RATE;
}

export const SLEEP_MODE_META: Record<SleepMode, { label: string; description: string; color: string; recommended?: boolean }> = {
  beginner: {
    label: "Beginner",
    description: "Guided routine to build better sleep habits.",
    color: "#22c55e",
  },
  adaptive: {
    label: "Adaptive",
    description: "Adjusts based on your behavior.",
    color: "#fbbf24",
    recommended: true,
  },
  custom: {
    label: "Custom",
    description: "Build your own routine.",
    color: "#8b5cf6",
  },
  minimal: {
    label: "Minimal",
    description: "Light reminders only.",
    color: "#94a3b8",
  },
};

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

import { getState as getFlowState } from "./vitalityFlowStore";

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
}

const STORAGE_KEY = "ascend_sleep_mode";
const CHANGE_EVENT = "ascend:sleep-mode-changed";

const DEFAULT_CUSTOM: CustomConfig = {
  windDownReminder: true,
  foodCutoff: true,
  lowStimulation: true,
  sleepPriming: true,
  windDownOffsetMin: 60,
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

  return {
    completionRate: Math.round(completionRate),
    consistencyScore,
    windowDays: ADAPTIVE_WINDOW_DAYS,
    daysAnalyzed: present,
    daysSinceFirstUse,
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
}

const HIGH_PERFORMER_RATE = 80;     // %
const RECOVERY_RATE = 50;           // % — drop below this re-enables guidance

export function getNightPlan(): NightPlan {
  const state = read();
  const offset = state.custom.windDownOffsetMin;

  if (state.mode === "minimal") {
    return {
      windDownReminder: true,
      foodCutoff: false,
      lowStimulation: false,
      sleepPriming: false,
      showFullFlow: false,
      windDownOffsetMin: offset,
      reason: "Minimal mode — light reminder only.",
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
    };
  }
  if (state.mode === "adaptive") {
    const snap = computeAdaptiveSnapshot();
    // High performer → trim non-essential prompts (low-stim).
    const highPerformer =
      snap.daysAnalyzed >= 3 && snap.completionRate >= HIGH_PERFORMER_RATE;
    // Slipping → force full flow back on regardless.
    const slipping =
      snap.daysAnalyzed >= 3 && snap.completionRate < RECOVERY_RATE;
    return {
      windDownReminder: true,
      foodCutoff: true,
      lowStimulation: slipping || !highPerformer,
      sleepPriming: true,
      showFullFlow: true,
      windDownOffsetMin: offset,
      reason: slipping
        ? "Adaptive — guidance increased to help you re-establish the rhythm."
        : highPerformer
        ? "Adaptive — light touch, you've earned it."
        : "Adaptive — standard guided flow.",
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
  };
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

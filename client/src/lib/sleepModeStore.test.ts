/**
 * Integration tests for syncWindDownNotification and syncWakeUpNotification.
 *
 * These are the functions that decide *when* the OS fires the wind-down and
 * wake-up nudges. A regression there would silently send them at the wrong
 * time — or not at all — and users wouldn't notice until they missed bedtime.
 *
 * Strategy:
 *   • Each test calls the public sync functions with injected stub `deps`
 *     (WindDownDeps / WakeUpDeps) so the OS notification layer is never hit.
 *   • Storage state is written to a plain in-memory localStorage shim before
 *     each test; no browser or Capacitor runtime is required.
 *   • Tests verify which dep methods were called and what arguments they
 *     received.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  syncWindDownNotification,
  syncWakeUpNotification,
  WIND_DOWN_NOTIFICATION_ID,
  WAKE_UP_NOTIFICATION_ID,
  DEFAULT_CYCLES,
  type WindDownDeps,
  type WakeUpDeps,
} from "./sleepModeStore.ts";
import type { ScheduleResult } from "./notificationService.ts";
import type { CycleCount, WakeHM } from "./remCycleEngine.ts";

// ─── Browser shims ────────────────────────────────────────────────────────────
// Node doesn't provide localStorage or window; install minimal fakes before the
// store module is imported (module-level import hoisting means the shims must
// be at the top of this file).

const _store: Record<string, string> = {};
const _ls = {
  getItem: (k: string) => _store[k] ?? null,
  setItem: (k: string, v: string) => { _store[k] = v; },
  removeItem: (k: string) => { delete _store[k]; },
  clear: () => { for (const k of Object.keys(_store)) delete _store[k]; },
};
(globalThis as any).localStorage = _ls;
(globalThis as any).window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ascend_sleep_mode";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function writeSleepState(patch: Record<string, unknown>): void {
  const base = {
    mode: "beginner",
    custom: {
      windDownReminder: true,
      foodCutoff: true,
      lowStimulation: true,
      sleepPriming: true,
      windDownOffsetMin: 10,
    },
    firstSeenAt: Date.now(),
    wakeUpReminderEnabled: true,
  };
  _ls.setItem(STORAGE_KEY, JSON.stringify({ ...base, ...patch }));
}

function clearStorage(): void {
  _ls.clear();
}

/** OK result returned by stub schedule fns. */
const OK: ScheduleResult = { scheduled: true, notificationId: 42 };

// ─── Stub factories ───────────────────────────────────────────────────────────

interface Recorded<T> {
  calls: T[];
}

function makeWindDownDeps(overrides: Partial<WindDownDeps> = {}): WindDownDeps & {
  _scheduled: Array<{ wake: WakeHM; cycles: CycleCount; leadMinutes: number }>;
  _cancelled: number;
} {
  const _scheduled: Array<{ wake: WakeHM; cycles: CycleCount; leadMinutes: number }> = [];
  let _cancelled = 0;
  return {
    scheduleWindDown: async (opts) => { _scheduled.push(opts); return OK; },
    cancelWindDown: async () => { _cancelled++; },
    getRecommendedCycles: (_wake) => 5,
    ...overrides,
    get _scheduled() { return _scheduled; },
    get _cancelled() { return _cancelled; },
  };
}

function makeWakeUpDeps(overrides: Partial<WakeUpDeps> = {}): WakeUpDeps & {
  _scheduled: Array<{ wake: WakeHM; completedCycles?: number }>;
  _cancelled: number;
} {
  const _scheduled: Array<{ wake: WakeHM; completedCycles?: number }> = [];
  let _cancelled = 0;
  return {
    scheduleWakeUp: async (opts) => { _scheduled.push(opts); return OK; },
    cancelWakeUp: async () => { _cancelled++; },
    getLastNightCycles: () => undefined,
    ...overrides,
    get _scheduled() { return _scheduled; },
    get _cancelled() { return _cancelled; },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// syncWindDownNotification — three branches
// ═══════════════════════════════════════════════════════════════════════════════

test("syncWindDownNotification — reminder OFF (custom mode) cancels, does not schedule", async () => {
  clearStorage();
  writeSleepState({
    mode: "custom",
    custom: {
      windDownReminder: false,   // <-- reminder disabled
      foodCutoff: true,
      lowStimulation: true,
      sleepPriming: true,
      windDownOffsetMin: 10,
    },
    wakeTime: { hour: 7, minute: 0 },
  });

  const deps = makeWindDownDeps();
  await syncWindDownNotification(deps);

  assert.equal(deps._cancelled, 1, "should call cancelWindDown exactly once");
  assert.equal(deps._scheduled.length, 0, "must not schedule");
});

test("syncWindDownNotification — no wake time set cancels, does not schedule", async () => {
  clearStorage();
  // Reminder is on (beginner default) but wakeTime is absent.
  writeSleepState({ wakeTime: undefined });

  const deps = makeWindDownDeps();
  await syncWindDownNotification(deps);

  assert.equal(deps._cancelled, 1, "should call cancelWindDown exactly once");
  assert.equal(deps._scheduled.length, 0, "must not schedule");
});

test("syncWindDownNotification — reminder ON + wake time set schedules notification", async () => {
  clearStorage();
  writeSleepState({ wakeTime: { hour: 7, minute: 0 }, cycles: 5 });

  const deps = makeWindDownDeps();
  await syncWindDownNotification(deps);

  assert.equal(deps._cancelled, 0, "should not cancel");
  assert.equal(deps._scheduled.length, 1, "should schedule exactly once");
  assert.deepEqual(deps._scheduled[0].wake, { hour: 7, minute: 0 });
  assert.equal(deps._scheduled[0].cycles, 5);
});

// ─── Cycles fallback chain ────────────────────────────────────────────────────

test("syncWindDownNotification — explicit cycles used; recommendedCycles NOT consulted", async () => {
  clearStorage();
  // User has explicitly picked 4 cycles.
  writeSleepState({ wakeTime: { hour: 6, minute: 0 }, cycles: 4 });

  let recommendedCalled = false;
  const deps = makeWindDownDeps({
    getRecommendedCycles: (_wake) => { recommendedCalled = true; return 5; },
  });

  await syncWindDownNotification(deps);

  assert.equal(recommendedCalled, false, "explicit pick must skip recommendedCycles");
  assert.equal(deps._scheduled[0].cycles, 4, "should schedule with the explicit cycle count");
});

test("syncWindDownNotification — no explicit cycles uses recommendedCycles (returns 6)", async () => {
  clearStorage();
  writeSleepState({ wakeTime: { hour: 7, minute: 0 } }); // cycles omitted

  const deps = makeWindDownDeps({
    getRecommendedCycles: (_wake) => 6,
  });

  await syncWindDownNotification(deps);

  assert.equal(deps._scheduled.length, 1);
  assert.equal(deps._scheduled[0].cycles, 6, "should use the recommended cycle count");
});

test("syncWindDownNotification — falls back to DEFAULT_CYCLES when recommendedCycles returns 0", async () => {
  clearStorage();
  // Window too narrow → recommendedCycles returns 0 (not a valid CycleCount).
  writeSleepState({ wakeTime: { hour: 7, minute: 0 } });

  const deps = makeWindDownDeps({
    getRecommendedCycles: (_wake) => 0,
  });

  await syncWindDownNotification(deps);

  assert.equal(deps._scheduled.length, 1);
  assert.equal(deps._scheduled[0].cycles, DEFAULT_CYCLES, `should fall back to DEFAULT_CYCLES (${DEFAULT_CYCLES})`);
});

test("syncWindDownNotification — windDownOffsetMin from custom config is forwarded", async () => {
  clearStorage();
  writeSleepState({
    mode: "custom",
    custom: {
      windDownReminder: true,
      foodCutoff: false,
      lowStimulation: false,
      sleepPriming: false,
      windDownOffsetMin: 20,   // non-default offset
    },
    wakeTime: { hour: 7, minute: 0 },
    cycles: 5,
  });

  const deps = makeWindDownDeps();
  await syncWindDownNotification(deps);

  assert.equal(deps._scheduled[0].leadMinutes, 20, "should forward the custom lead offset");
});

// ═══════════════════════════════════════════════════════════════════════════════
// syncWakeUpNotification — three branches
// ═══════════════════════════════════════════════════════════════════════════════

test("syncWakeUpNotification — toggle OFF cancels, does not schedule", async () => {
  clearStorage();
  writeSleepState({ wakeUpReminderEnabled: false, wakeTime: { hour: 7, minute: 0 } });

  const deps = makeWakeUpDeps();
  await syncWakeUpNotification(deps);

  assert.equal(deps._cancelled, 1, "should call cancelWakeUp exactly once");
  assert.equal(deps._scheduled.length, 0, "must not schedule");
});

test("syncWakeUpNotification — no wake time set cancels, does not schedule", async () => {
  clearStorage();
  writeSleepState({ wakeUpReminderEnabled: true, wakeTime: undefined });

  const deps = makeWakeUpDeps();
  await syncWakeUpNotification(deps);

  assert.equal(deps._cancelled, 1, "should call cancelWakeUp exactly once");
  assert.equal(deps._scheduled.length, 0, "must not schedule");
});

test("syncWakeUpNotification — toggle ON + wake time schedules recurring notification", async () => {
  clearStorage();
  writeSleepState({ wakeUpReminderEnabled: true, wakeTime: { hour: 7, minute: 15 } });

  const deps = makeWakeUpDeps();
  await syncWakeUpNotification(deps);

  assert.equal(deps._cancelled, 0, "should not cancel");
  assert.equal(deps._scheduled.length, 1, "should schedule exactly once");
  assert.deepEqual(deps._scheduled[0].wake, { hour: 7, minute: 15 });
});

test("syncWakeUpNotification — forwards completed-cycles count from last night", async () => {
  clearStorage();
  writeSleepState({ wakeUpReminderEnabled: true, wakeTime: { hour: 7, minute: 0 } });

  // Stub: last night produced 5 completed cycles.
  const deps = makeWakeUpDeps({ getLastNightCycles: () => 5 });
  await syncWakeUpNotification(deps);

  assert.equal(deps._scheduled.length, 1);
  assert.equal(deps._scheduled[0].completedCycles, 5, "completedCycles should be passed through");
});

test("syncWakeUpNotification — schedules with undefined completedCycles when no last-night data", async () => {
  clearStorage();
  writeSleepState({ wakeUpReminderEnabled: true, wakeTime: { hour: 6, minute: 30 } });

  const deps = makeWakeUpDeps({ getLastNightCycles: () => undefined });
  await syncWakeUpNotification(deps);

  assert.equal(deps._scheduled.length, 1);
  assert.equal(deps._scheduled[0].completedCycles, undefined, "no data → completedCycles should be undefined");
});

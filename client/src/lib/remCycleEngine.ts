/**
 * REM Cycle Engine.
 *
 * Pure helpers that turn a desired wake time + cycle count into a
 * recommended bedtime, expressed in local time. Centralized here so the
 * Night Flow, Wake Flow, Sectograph and notification scheduler all
 * derive the same numbers.
 *
 * Math: human sleep proceeds in ~90-minute cycles; we add a baseline
 * 14-minute sleep latency so a "5 cycle" target lands on completed REM
 * rather than mid-cycle wakes.
 */

import {
  isNativePlatform,
  scheduleTaskNotification,
  cancelTaskNotification,
  type ScheduleResult,
} from "./notificationService";

export const SLEEP_LATENCY_MIN = 14;
export const CYCLE_MIN = 90;
export const VALID_CYCLES = [4, 5, 6] as const;
export type CycleCount = (typeof VALID_CYCLES)[number];

export interface WakeHM {
  hour: number;
  minute: number;
}

/** The next occurrence of `wake` (today if still in the future, else tomorrow). */
export function nextWakeDate(wake: WakeHM, now: Date = new Date()): Date {
  const target = new Date(now);
  target.setHours(wake.hour, wake.minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Bedtime needed so that `cycles` complete REM cycles finish exactly at
 * the next `wake` time, accounting for sleep latency.
 */
export function bedtimeForCycles(
  wake: WakeHM,
  cycles: CycleCount,
  now: Date = new Date(),
): Date {
  const wakeDate = nextWakeDate(wake, now);
  const totalMin = cycles * CYCLE_MIN + SLEEP_LATENCY_MIN;
  return new Date(wakeDate.getTime() - totalMin * 60_000);
}

/**
 * Whole 90-minute cycles you can still complete if you fell asleep
 * `SLEEP_LATENCY_MIN` minutes from now.
 */
export function cyclesUntil(wake: WakeHM, now: Date = new Date()): number {
  const wakeDate = nextWakeDate(wake, now);
  const onsetMs = now.getTime() + SLEEP_LATENCY_MIN * 60_000;
  const minutes = (wakeDate.getTime() - onsetMs) / 60_000;
  if (minutes <= 0) return 0;
  return Math.floor(minutes / CYCLE_MIN);
}

/**
 * Best-fit cycle count for tonight. Returns 0 if we cannot even reach
 * four cycles from now.
 */
export function recommendedCycles(
  wake: WakeHM,
  now: Date = new Date(),
): CycleCount | 0 {
  const c = cyclesUntil(wake, now);
  if (c >= 6) return 6;
  if (c >= 5) return 5;
  if (c >= 4) return 4;
  return 0;
}

/** "10:36 PM" */
export function formatHM(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = h % 12 || 12;
  const p = h < 12 ? "AM" : "PM";
  return `${hh}:${String(m).padStart(2, "0")} ${p}`;
}

/** "07:00" → { hour: 7, minute: 0 } */
export function parseHMString(hm: string): WakeHM | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** WakeHM → "07:00" for <input type="time" /> */
export function formatHM24(wake: WakeHM): string {
  return `${String(wake.hour).padStart(2, "0")}:${String(wake.minute).padStart(2, "0")}`;
}

/** Difference (in minutes) between actual bedtime and target bedtime. Positive = late. */
export function bedtimeDeltaMin(actualMs: number, targetMs: number): number {
  return Math.round((actualMs - targetMs) / 60_000);
}

/* ─────────────── Notification scheduling ─────────────── */

/** Stable id for the wind-down notification so we can replace it. */
export const WIND_DOWN_NOTIFICATION_ID = "ascend_wind_down";

/**
 * Schedule (or replace) the cycle-aware wind-down ping.
 *
 * Fires `leadMinutes` BEFORE the recommended bedtime. Web returns a
 * `not-native` no-op so the rest of the app can call this freely.
 */
export async function scheduleWindDownNotification(opts: {
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

export async function cancelWindDownNotification(): Promise<void> {
  await cancelTaskNotification(WIND_DOWN_NOTIFICATION_ID);
}

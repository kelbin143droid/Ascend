import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CYCLE_MIN,
  SLEEP_LATENCY_MIN,
  bedtimeDeltaMin,
  bedtimeForCycles,
  cyclesUntil,
  formatHM,
  formatHM24,
  nextWakeDate,
  parseHMString,
  recommendedCycles,
} from "./remCycleEngine.ts";

const at = (y: number, m: number, d: number, h: number, min: number) =>
  new Date(y, m, d, h, min, 0, 0);

test("nextWakeDate rolls forward when wake target already passed today", () => {
  const now = at(2026, 3, 26, 9, 0); // April 26 2026, 9:00 AM
  const wake = { hour: 7, minute: 0 };
  const next = nextWakeDate(wake, now);

  assert.equal(next.getFullYear(), 2026);
  assert.equal(next.getMonth(), 3);
  assert.equal(next.getDate(), 27, "should land on tomorrow when target already past");
  assert.equal(next.getHours(), 7);
  assert.equal(next.getMinutes(), 0);
});

test("nextWakeDate stays on today when target is later today", () => {
  const now = at(2026, 3, 26, 6, 0);
  const wake = { hour: 7, minute: 0 };
  const next = nextWakeDate(wake, now);

  assert.equal(next.getDate(), 26);
  assert.equal(next.getHours(), 7);
});

test("nextWakeDate rolls forward when wake target equals now (boundary)", () => {
  const now = at(2026, 3, 26, 7, 0);
  const wake = { hour: 7, minute: 0 };
  const next = nextWakeDate(wake, now);

  assert.equal(next.getDate(), 27, "exact-equal time should still advance to tomorrow");
});

test("recommendedCycles returns 0 when window is too short for 4 cycles", () => {
  // 4 cycles + latency = 4*90 + 14 = 374 min ≈ 6h14m needed.
  // Wake at 07:00, now at 02:00 = only 5h until wake => not enough.
  const now = at(2026, 3, 26, 2, 0);
  const wake = { hour: 7, minute: 0 };
  assert.equal(recommendedCycles(wake, now), 0);
});

test("recommendedCycles returns 4 when window fits exactly four cycles", () => {
  // 4*90 + 14 = 374 min before wake. Wake at 07:00, now at 00:46 → 6h14m.
  const now = at(2026, 3, 26, 0, 46);
  const wake = { hour: 7, minute: 0 };
  assert.equal(recommendedCycles(wake, now), 4);
});

test("recommendedCycles caps at 6 even with massive window", () => {
  const now = at(2026, 3, 26, 12, 0);
  const wake = { hour: 7, minute: 0 }; // ~19h away
  assert.equal(recommendedCycles(wake, now), 6);
});

test("bedtimeForCycles produces wake - cycles*90 - latency", () => {
  const now = at(2026, 3, 26, 22, 0);
  const wake = { hour: 7, minute: 0 };
  const bed = bedtimeForCycles(wake, 5, now);
  const wakeDate = nextWakeDate(wake, now);
  const diffMin = (wakeDate.getTime() - bed.getTime()) / 60_000;
  assert.equal(diffMin, 5 * CYCLE_MIN + SLEEP_LATENCY_MIN);
});

test("cyclesUntil counts whole cycles, dropping partials", () => {
  // Wake 07:00, now 23:30 → 7.5h to wake; minus 14min latency = 7h16m = 436min
  // 436 / 90 = 4.84 → 4 whole cycles
  const now = at(2026, 3, 25, 23, 30);
  const wake = { hour: 7, minute: 0 };
  assert.equal(cyclesUntil(wake, now), 4);
});

test("bedtimeDeltaMin handles bedtime crossing midnight", () => {
  // Target bedtime: 11:46 PM, actual: 12:14 AM next day → 28 min late.
  const target = at(2026, 3, 25, 23, 46).getTime();
  const actual = at(2026, 3, 26, 0, 14).getTime();
  assert.equal(bedtimeDeltaMin(actual, target), 28);
});

test("bedtimeDeltaMin returns negative when actual bedtime is earlier than target", () => {
  // Target 12:30 AM, actual 11:55 PM previous day = 35 min early.
  const target = at(2026, 3, 26, 0, 30).getTime();
  const actual = at(2026, 3, 25, 23, 55).getTime();
  assert.equal(bedtimeDeltaMin(actual, target), -35);
});

test("bedtimeDeltaMin rounds to nearest minute around midnight", () => {
  const target = at(2026, 3, 25, 23, 59).getTime();
  const actual = target + 90_000; // 1.5 minutes later → rounds to 2
  assert.equal(bedtimeDeltaMin(actual, target), 2);
});

test("formatHM/parseHMString round-trip preserves WakeHM", () => {
  const samples = [
    { hour: 0, minute: 0 },
    { hour: 7, minute: 5 },
    { hour: 12, minute: 0 },
    { hour: 13, minute: 45 },
    { hour: 23, minute: 59 },
  ];

  for (const wake of samples) {
    const hm24 = formatHM24(wake);
    const parsed = parseHMString(hm24);
    assert.deepEqual(parsed, wake, `round-trip failed for ${hm24}`);
  }
});

test("formatHM renders 12-hour clock with AM/PM", () => {
  assert.equal(formatHM(at(2026, 3, 26, 0, 0)), "12:00 AM");
  assert.equal(formatHM(at(2026, 3, 26, 7, 5)), "7:05 AM");
  assert.equal(formatHM(at(2026, 3, 26, 12, 0)), "12:00 PM");
  assert.equal(formatHM(at(2026, 3, 26, 22, 36)), "10:36 PM");
});

test("parseHMString rejects invalid strings", () => {
  assert.equal(parseHMString(""), null);
  assert.equal(parseHMString("7:5"), null, "minutes must be 2 digits");
  assert.equal(parseHMString("24:00"), null);
  assert.equal(parseHMString("07:60"), null);
  assert.equal(parseHMString("ab:cd"), null);
});

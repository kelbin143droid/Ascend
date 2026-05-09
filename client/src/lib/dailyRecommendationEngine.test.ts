/**
 * dailyRecommendationEngine.test.ts
 * Unit tests for the pure getDailyRecommendation function.
 * Run with:  npx tsx --test client/src/lib/dailyRecommendationEngine.test.ts
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getDailyRecommendation } from "./dailyRecommendationEngine";
import type { DailyProfile } from "./dailyRecommendationEngine";
import type { TrackedWorkoutSession } from "./workoutProgressionEngine";
import { DEFAULT_PROFILE } from "./breathingProgressionSystem";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSession(
  overrides: Partial<TrackedWorkoutSession> = {}
): TrackedWorkoutSession {
  const today = new Date().toISOString();
  return {
    level:            "beginner",
    completedAt:      today,
    workoutCompleted: true,
    setsCompleted:    3,
    totalSets:        3,
    repsCompleted:    30,
    targetReps:       30,
    userDifficulty:   "same",
    performanceScore: 80,
    ...overrides,
  };
}

function baseProfile(overrides: Partial<DailyProfile> = {}): DailyProfile {
  return {
    workoutSessions:  [],
    breathingProfile: { ...DEFAULT_PROFILE },
    streak:           0,
    missedDays:       0,
    lastFlowDate:     null,
    calibrationLevel: "beginner",
    fatigue:          "normal",
    readiness:        50,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("getDailyRecommendation", () => {
  test("new user with no history → BEGIN_DAILY_FLOW", () => {
    const result = getDailyRecommendation(baseProfile());
    assert.equal(result.type, "BEGIN_DAILY_FLOW");
    assert.equal(result.intensity, "normal");
    assert.equal(result.flowVariant, "full");
    assert.ok(result.headline.length > 0);
    assert.ok(result.quickActions.length > 0);
  });

  test("missedDays ≥ 3 overrides everything → MOMENTUM_RECOVERY", () => {
    const result = getDailyRecommendation(
      baseProfile({
        missedDays:       5,
        streak:           10,       // high streak should NOT win
        fatigue:          "energized",
        readiness:        95,
      })
    );
    assert.equal(result.type, "MOMENTUM_RECOVERY");
    assert.equal(result.intensity, "light");
    assert.equal(result.flowVariant, "light");
  });

  test("fatigued state (no missed days) → RECOVERY_SESSION", () => {
    const sessions = [
      makeSession({ recoveryFeedback: "fatigued" }),
      makeSession({ recoveryFeedback: "fatigued" }),
    ];
    const result = getDailyRecommendation(
      baseProfile({ fatigue: "fatigued", workoutSessions: sessions, missedDays: 0 })
    );
    assert.equal(result.type, "RECOVERY_SESSION");
    assert.equal(result.intensity, "rest");
    assert.equal(result.flowVariant, "recovery");
    assert.ok(result.quickActions.includes("Calm Breathing"));
  });

  test("fatigue check skipped when missedDays ≥ 3 (priority order)", () => {
    const result = getDailyRecommendation(
      baseProfile({ missedDays: 4, fatigue: "fatigued" })
    );
    // missedDays rule fires first
    assert.equal(result.type, "MOMENTUM_RECOVERY");
  });

  test("high readiness + energized + streak ≥ 3 → TRAINING_READINESS_HIGH", () => {
    const result = getDailyRecommendation(
      baseProfile({
        readiness:  80,
        fatigue:    "energized",
        streak:     4,
        missedDays: 0,
        workoutSessions: [makeSession()],
      })
    );
    assert.equal(result.type, "TRAINING_READINESS_HIGH");
    assert.equal(result.intensity, "push");
    assert.equal(result.flowVariant, "push");
    assert.ok(result.quickActions.includes("Begin Flow"));
  });

  test("streak 1–2 with normal fatigue → CONTINUE_MOMENTUM", () => {
    const result = getDailyRecommendation(
      baseProfile({
        streak:          2,
        fatigue:         "normal",
        readiness:       55,
        missedDays:      0,
        workoutSessions: [makeSession()],
      })
    );
    assert.equal(result.type, "CONTINUE_MOMENTUM");
    assert.equal(result.intensity, "normal");
    assert.equal(result.flowVariant, "full");
  });

  test("streak exactly 1 → CONTINUE_MOMENTUM", () => {
    const result = getDailyRecommendation(
      baseProfile({
        streak:          1,
        fatigue:         "normal",
        workoutSessions: [makeSession()],
      })
    );
    assert.equal(result.type, "CONTINUE_MOMENTUM");
  });

  test("readiness below threshold does not trigger push even with energized+streak3", () => {
    const result = getDailyRecommendation(
      baseProfile({
        readiness:  40,     // below 75
        fatigue:    "energized",
        streak:     5,
        workoutSessions: [makeSession()],
      })
    );
    // Falls through to CONTINUE_MOMENTUM (streak 5, has sessions)
    assert.notEqual(result.type, "TRAINING_READINESS_HIGH");
  });

  test("progressSnapshot contains correct streak value", () => {
    const result = getDailyRecommendation(baseProfile({ streak: 7 }));
    assert.equal(result.progressSnapshot.streak, 7);
  });

  test("progressSnapshot.readinessPercent matches input readiness", () => {
    const result = getDailyRecommendation(baseProfile({ readiness: 63 }));
    assert.equal(result.progressSnapshot.readinessPercent, 63);
  });

  test("every recommendation type has non-empty quickActions", () => {
    const types: Array<Parameters<typeof getDailyRecommendation>[0]> = [
      baseProfile({ missedDays: 4 }),
      baseProfile({ fatigue: "fatigued" }),
      baseProfile({ readiness: 80, fatigue: "energized", streak: 4, workoutSessions: [makeSession()] }),
      baseProfile({ streak: 1, workoutSessions: [makeSession()] }),
      baseProfile(),
    ];
    for (const p of types) {
      const r = getDailyRecommendation(p);
      assert.ok(r.quickActions.length > 0, `${r.type} should have quickActions`);
    }
  });

  test("consistencyTrend is 'stable' with fewer than 6 sessions", () => {
    const result = getDailyRecommendation(
      baseProfile({ workoutSessions: [makeSession(), makeSession()] })
    );
    assert.equal(result.progressSnapshot.consistencyTrend, "stable");
  });

  test("consistencyTrend 'improving' when recent scores significantly higher", () => {
    const older  = Array.from({ length: 3 }, () => makeSession({ performanceScore: 50 }));
    const recent = Array.from({ length: 3 }, () => makeSession({ performanceScore: 90 }));
    const result = getDailyRecommendation(
      baseProfile({ workoutSessions: [...older, ...recent] })
    );
    assert.equal(result.progressSnapshot.consistencyTrend, "improving");
  });

  test("consistencyTrend 'declining' when recent scores significantly lower", () => {
    const older  = Array.from({ length: 3 }, () => makeSession({ performanceScore: 90 }));
    const recent = Array.from({ length: 3 }, () => makeSession({ performanceScore: 50 }));
    const result = getDailyRecommendation(
      baseProfile({ workoutSessions: [...older, ...recent] })
    );
    assert.equal(result.progressSnapshot.consistencyTrend, "declining");
  });

  test("default catch-all: history exists, streak=0, no overrides → BEGIN_DAILY_FLOW", () => {
    // Has sessions but streak is 0 (user missed yesterday), fatigue normal, readiness low
    const result = getDailyRecommendation(
      baseProfile({
        workoutSessions: [makeSession()],
        streak:          0,
        missedDays:      0,
        fatigue:         "normal",
        readiness:       40,
      })
    );
    assert.equal(result.type, "BEGIN_DAILY_FLOW");
    assert.equal(result.intensity, "normal");
    assert.equal(result.flowVariant, "full");
  });

  test("energized user with streak 1-2 does NOT enter CONTINUE_MOMENTUM (falls to BEGIN_DAILY_FLOW)", () => {
    // After the spec-tightening: CONTINUE_MOMENTUM requires fatigue === "normal"
    const result = getDailyRecommendation(
      baseProfile({
        workoutSessions: [makeSession()],
        streak:          2,
        missedDays:      0,
        fatigue:         "energized",
        readiness:       40,        // below push threshold
      })
    );
    assert.notEqual(result.type, "CONTINUE_MOMENTUM");
    assert.equal(result.type, "BEGIN_DAILY_FLOW");
  });
});

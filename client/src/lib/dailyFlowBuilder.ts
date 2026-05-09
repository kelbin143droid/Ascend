/**
 * dailyFlowBuilder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine-level daily flow composer.
 *
 * Single function that decides which ActivityDefinition objects go into each
 * path's daily flow.  All path-composition logic lives here — away from UI
 * components and away from activityEngine.ts circular-dep concerns.
 *
 * Foundation (entry)
 *   → [Calm Breathing, Light Movement (agility relabeled)]
 *   → NO strength circuit at all
 *
 * Build (beginner)
 *   → [Calm Breathing, Agility Flow, Starter Strength — 1 round]
 *   → wall push-ups → assisted squats → glute bridges → plank hold
 *   → Short, guided, tier-scaled reps. Matches session card promise exactly.
 *
 * Evolve (intermediate)
 *   → [Calm Breathing, Agility Flow, Physical Circuit — 2 rounds]
 *   → Warm-up cardio + Jog + Round 1 (Squats/Push-ups/Sit-ups/Plank) +
 *     Rest + Round 2. Uses standard strength tier from adaptive scaling.
 *
 * Ascend (advanced)
 *   → Same 2-round Physical Circuit, but strength tier boosted to min 3.
 *   → Higher rep counts (≥16 push-ups, ≥18 squats/sit-ups vs tier-1's 8/10/10).
 */

import {
  buildPhase1Activities,
  CATEGORY_COLORS,
  TIER_XP_MULTIPLIERS,
  type CategoryTiers,
  type ActivityDefinition,
  type ActivityStep,
} from "./activityEngine";
import { type WorkoutLevel } from "./workoutPlans";
import { getPathFlowConfig } from "./pathFlowConfig";

// ── Public API ────────────────────────────────────────────────────────────────

export interface DailyFlowBuildOptions {
  dayNumber: number;
  tiers?: CategoryTiers;
}

/**
 * Builds a short, 1-round Starter Strength activity for the Build path.
 *
 * Exercises match the session card promise exactly:
 *   Wall push-ups → Assisted squats → Glute bridges → Plank hold
 *
 * Single round with 15 s rests, tier-scaled reps (8–16 / 10–18).
 * No second round, no multi-set structure.
 */
function buildStarterStrengthActivity(tier: number): ActivityDefinition {
  const xpMultiplier = TIER_XP_MULTIPLIERS[tier] ?? 1.0;

  const wallPushReps = 8  + Math.min(tier - 1, 4) * 2;   // 8 → 16
  const squatReps    = 10 + Math.min(tier - 1, 4) * 2;   // 10 → 18
  const gluteReps    = 10 + Math.min(tier - 1, 4) * 2;   // 10 → 18
  const plankSeconds = 15 + Math.min(tier - 1, 4) * 5;   // 15 → 35 s
  const restSeconds  = 15;
  const SECS_PER_REP = 3;

  const duration =
    10 +
    (wallPushReps + squatReps + gluteReps) * SECS_PER_REP +
    3 * restSeconds +
    plankSeconds +
    5;

  const steps: ActivityStep[] = [
    {
      id: "starter_intro",
      type: "instruction",
      label: "Get Ready — Starter Strength",
      instruction:
        "One round · Wall push-ups → Squats → Glute bridges → Plank. Take it at your own pace.",
      voiceText:
        "Get ready. One round. Wall push-ups, squats, glute bridges, then a plank hold.",
    },
    {
      id: "wall_pushups",
      type: "rep",
      label: "Wall Push-ups",
      instruction: `${wallPushReps} wall push-ups. Hands shoulder-width apart, lean in, push back.`,
      repCount: wallPushReps,
      repLabel: "reps",
      voiceText: `Wall push-ups. ${wallPushReps} reps.`,
      videoSrc: "/videos/wall_pushups_loop.mp4",
    },
    {
      id: "rest_1",
      type: "timer",
      label: "Rest",
      instruction: "Rest 15 seconds. Shake out your hands.",
      durationSeconds: restSeconds,
      voiceText: "Rest. 15 seconds.",
    },
    {
      id: "asst_squats",
      type: "rep",
      label: "Assisted Squats",
      instruction: `${squatReps} squats. Hold a chair or wall if needed. Chest up.`,
      repCount: squatReps,
      repLabel: "reps",
      voiceText: `Assisted squats. ${squatReps} reps. Chest up.`,
      videoSrc: "/videos/squats_loop.mp4",
    },
    {
      id: "rest_2",
      type: "timer",
      label: "Rest",
      instruction: "Rest 15 seconds.",
      durationSeconds: restSeconds,
      voiceText: "Rest. 15 seconds.",
    },
    {
      id: "glute_bridges",
      type: "rep",
      label: "Glute Bridges",
      instruction: `${gluteReps} glute bridges. Lie on your back, feet flat, push hips up.`,
      repCount: gluteReps,
      repLabel: "reps",
      voiceText: `Glute bridges. ${gluteReps} reps.`,
      videoSrc: "/videos/glute_bridges_loop.mp4",
    },
    {
      id: "rest_3",
      type: "timer",
      label: "Rest",
      instruction: "Rest 15 seconds. Last exercise coming.",
      durationSeconds: restSeconds,
      voiceText: "Rest. 15 seconds.",
    },
    {
      id: "plank_hold",
      type: "timer",
      label: "Plank Hold",
      instruction: `Hold a plank for ${plankSeconds} seconds. Straight line from head to heels.`,
      durationSeconds: plankSeconds,
      voiceText: `Plank hold. ${plankSeconds} seconds.`,
      videoSrc: "/videos/plank_hold_loop.mp4",
      loop: false,
    },
    {
      id: "starter_done",
      type: "completion",
      label: "Starter Strength Complete",
      instruction: "Well done. One round of strength work done.",
      voiceText: "Starter strength complete. Great work.",
    },
  ];

  return {
    id: "phase1_strength",
    activityName: "Starter Strength",
    category: "strength",
    stat: "strength",
    duration,
    xpReward: 0,
    color: CATEGORY_COLORS.strength,
    tier,
    xpMultiplier,
    autoflow: true,
    steps,
  };
}

/**
 * Returns the ordered ActivityDefinition array for the given path.
 *
 * This is the single engine-level source of truth — all path-composition
 * logic lives here.  Day6Home simply calls this and passes the result to
 * DailyFlowEngine.
 */
export function buildDailyFlowActivities(
  workoutLevel: WorkoutLevel,
  options: DailyFlowBuildOptions,
): ActivityDefinition[] {
  const config = getPathFlowConfig(workoutLevel);

  // ── Foundation / entry ──────────────────────────────────────────────────────
  // No strength.  Agility relabeled "Light Movement" so voice guidance and UI
  // use the lower-friction framing consistently.
  if (!config.includesStrength) {
    const base = buildPhase1Activities(options.dayNumber, options.tiers);
    return base
      .filter(a => a.id !== "phase1_strength")
      .map(a =>
        a.id === "phase1_agility"
          ? { ...a, activityName: "Light Movement" }
          : a
      );
  }

  // ── Build / beginner ────────────────────────────────────────────────────────
  // Replace the generic Physical Circuit stub with the 1-round Starter Strength
  // activity (wall push-ups → assisted squats → glute bridges → plank).
  if (workoutLevel === "beginner") {
    const strengthTier = options.tiers?.strength ?? 1;
    const base = buildPhase1Activities(options.dayNumber, options.tiers);
    return base.map((a): ActivityDefinition =>
      a.id === "phase1_strength"
        ? buildStarterStrengthActivity(strengthTier)
        : a
    );
  }

  // ── Ascend / advanced ───────────────────────────────────────────────────────
  // Same 2-round Physical Circuit from activityEngine, but strength tier is
  // boosted to at least 3 so Ascend users always get higher rep counts:
  //   Tier-3: push-ups ×16, squats ×18, sit-ups ×18, plank 30 s
  //   vs Tier-1: push-ups ×8, squats ×10, sit-ups ×10, plank 20 s
  if (workoutLevel === "advanced") {
    const ascendTiers: CategoryTiers = {
      strength:  Math.max(options.tiers?.strength  ?? 1, 3),
      agility:   options.tiers?.agility   ?? 1,
      meditation: options.tiers?.meditation ?? 1,
      vitality:  options.tiers?.vitality  ?? 1,
    };
    return buildPhase1Activities(options.dayNumber, ascendTiers);
  }

  // ── Evolve / intermediate ───────────────────────────────────────────────────
  // Standard 2-round Physical Circuit at the user's current adaptive tier.
  // Warm-up cardio → Jog → Round 1 → Rest → Round 2.
  return buildPhase1Activities(options.dayNumber, options.tiers);
}

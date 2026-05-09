/**
 * dailyFlowBuilder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine-level daily flow composer.
 *
 * This is the SINGLE function that decides which ActivityDefinition objects
 * go into each path's daily flow.  It keeps all path-composition logic out
 * of UI components and avoids the circular-dependency issue between
 * activityEngine.ts and workoutPlans.ts.
 *
 * Foundation (entry)
 *   → [Calm Breathing, Light Movement (agility relabeled)]
 *   → NO strength circuit
 *
 * Build (beginner)
 *   → [Calm Breathing, Agility Flow, Starter Strength (1-round)]
 *   → Exercises: wall push-ups, assisted squats, glute bridges, plank
 *   → Short, guided, matches the session card promise exactly
 *
 * Evolve (intermediate) / Ascend (advanced)
 *   → [Calm Breathing, Agility Flow, level WorkoutPlan activity]
 *   → Compound / high-intensity exercises respectively
 *   → Cardio injected when cardioIntensity ≠ "off"
 */

import {
  buildPhase1Activities,
  CATEGORY_COLORS,
  TIER_XP_MULTIPLIERS,
  type CategoryTiers,
  type ActivityDefinition,
  type ActivityStep,
} from "./activityEngine";
import {
  buildWorkoutActivity,
  type WorkoutLevel,
  type CardioIntensity,
  type CardioPosition,
} from "./workoutPlans";
import { getPathFlowConfig } from "./pathFlowConfig";

// ── Public API ────────────────────────────────────────────────────────────────

export interface DailyFlowBuildOptions {
  dayNumber: number;
  tiers?: CategoryTiers;
  cardioIntensity?: CardioIntensity;
  cardioPosition?: CardioPosition;
}

/**
 * Builds a short, 1-round Starter Strength activity for the Build path.
 *
 * Exercises match the session card promise:
 *   Wall push-ups → Assisted squats → Glute bridges → Plank hold
 *
 * No second round, no rest between rounds — designed for beginners who are
 * new to structured exercise.  Uses tier to scale reps gently.
 */
function buildStarterStrengthActivity(tier: number): ActivityDefinition {
  const xpMultiplier = TIER_XP_MULTIPLIERS[tier] ?? 1.0;

  // Gentle, tier-scaled rep/duration targets
  const wallPushReps  = 8 + Math.min(tier - 1, 4) * 2;   // 8→16
  const squatReps     = 10 + Math.min(tier - 1, 4) * 2;  // 10→18
  const gluteReps     = 10 + Math.min(tier - 1, 4) * 2;  // 10→18
  const plankSeconds  = 15 + Math.min(tier - 1, 4) * 5;  // 15→35
  const restSeconds   = 15;
  const SECS_PER_REP  = 3;

  // Estimated total: intro + reps×3 + 3 rests + plank + completion
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
      voiceText: `Wall push-ups. ${wallPushReps} reps. Hands shoulder-width.`,
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
      instruction: `${squatReps} squats. Hold a chair or wall if needed. Chest up, knees track over toes.`,
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
      voiceText: `Glute bridges. ${gluteReps} reps. Push hips up.`,
      videoSrc: "/videos/glute_bridges_loop.mp4",
    },
    {
      id: "rest_3",
      type: "timer",
      label: "Rest",
      instruction: "Rest 15 seconds. Last exercise coming.",
      durationSeconds: restSeconds,
      voiceText: "Rest. 15 seconds. Last exercise coming.",
    },
    {
      id: "plank_hold",
      type: "timer",
      label: "Plank Hold",
      instruction: `Hold a plank for ${plankSeconds} seconds. Straight line from head to heels. Breathe.`,
      durationSeconds: plankSeconds,
      voiceText: `Plank hold. ${plankSeconds} seconds. Straight line.`,
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
 * Returns the ordered ActivityDefinition array that the DailyFlowEngine should
 * run for the given starting path and current adaptive tiers.
 *
 * Replaces the ad-hoc build+filter logic that was previously in Day6Home.tsx.
 */
export function buildDailyFlowActivities(
  workoutLevel: WorkoutLevel,
  options: DailyFlowBuildOptions,
): ActivityDefinition[] {
  const config = getPathFlowConfig(workoutLevel);

  // Base returns [meditation, agility, strength] in DAILY_FLOW_ORDER.
  const base = buildPhase1Activities(options.dayNumber, options.tiers);

  // ── Foundation / entry ──────────────────────────────────────────────────────
  // No strength.  Agility is relabeled "Light Movement" to reflect the
  // lower-friction intent both in the UI and in voice guidance.
  if (!config.includesStrength) {
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
  // activity.  Exercises match the session card promise exactly:
  //   wall push-ups → assisted squats → glute bridges → plank hold
  // No second round.  No multi-set structure.  Short and guided.
  if (workoutLevel === "beginner") {
    const strengthTier = options.tiers?.strength ?? 1;
    return base.map((a): ActivityDefinition =>
      a.id === "phase1_strength"
        ? buildStarterStrengthActivity(strengthTier)
        : a
    );
  }

  // ── Evolve / Ascend (intermediate + advanced) ───────────────────────────────
  // Replace with the level-appropriate WorkoutPlan activity.
  // Cardio is only injected for paths that allow "push" days.
  const effectiveCardio: CardioIntensity =
    config.maxFlowVariant === "push"
      ? (options.cardioIntensity ?? "off")
      : "off";

  return base.map((a): ActivityDefinition => {
    if (a.id === "phase1_strength") {
      const workoutActivity = buildWorkoutActivity(workoutLevel, {
        intensity: effectiveCardio,
        position: options.cardioPosition ?? "after",
      });
      return { ...workoutActivity, id: "phase1_strength" };
    }
    return a;
  });
}

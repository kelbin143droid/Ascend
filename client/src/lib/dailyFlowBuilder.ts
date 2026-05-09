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
 *   → [Calm Breathing, Light Movement (agility, relabeled)]
 *   → NO strength circuit
 *
 * Build (beginner)
 *   → [Calm Breathing, Agility Flow, beginner WorkoutPlan activity]
 *   → Gentler exercises: wall push-ups, assisted squats, glute bridges, plank
 *
 * Evolve (intermediate) / Ascend (advanced)
 *   → [Calm Breathing, Agility Flow, level WorkoutPlan activity]
 *   → Compound / high-intensity exercises respectively
 *
 * Cardio (intermediate/advanced only)
 *   → Injected into the strength activity via buildWorkoutActivity when
 *     cardio intensity is not "off".
 */

import {
  buildPhase1Activities,
  type CategoryTiers,
  type ActivityDefinition,
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
 * Returns the ordered ActivityDefinition array that the DailyFlowEngine should
 * run for the given starting path and current adaptive tiers.
 *
 * This is the engine-level replacement for the ad-hoc build logic that was
 * previously scattered across Day6Home.tsx.
 */
export function buildDailyFlowActivities(
  workoutLevel: WorkoutLevel,
  options: DailyFlowBuildOptions,
): ActivityDefinition[] {
  const config = getPathFlowConfig(workoutLevel);

  // Build base: returns [meditation, agility, strength] via DAILY_FLOW_ORDER.
  const base = buildPhase1Activities(options.dayNumber, options.tiers);

  if (!config.includesStrength) {
    // ── Foundation / entry ────────────────────────────────────────────────
    // Remove strength entirely; relabel agility as "Light Movement" to signal
    // the lower-friction intent to the user and the voice guidance system.
    return base
      .filter(a => a.id !== "phase1_strength")
      .map(a =>
        a.id === "phase1_agility"
          ? { ...a, activityName: "Light Movement" }
          : a
      );
  }

  // ── Build / Evolve / Ascend ───────────────────────────────────────────────
  // Replace the generic Physical Circuit stub with the level-appropriate
  // WorkoutPlan activity.  Each level has meaningfully different exercises:
  //   beginner     → wall push-ups, assisted squats, glute bridges (low impact)
  //   intermediate → push-ups, split squats, pike push-ups (compound)
  //   advanced     → weighted push-ups, pull-ups, squats (high intensity)
  // Cardio is injected into the workout activity for advanced levels when
  // cardioIntensity is not "off".
  const effectiveCardio: CardioIntensity =
    config.maxFlowVariant === "push"
      ? (options.cardioIntensity ?? "off")
      : "off"; // Foundation / Build never get cardio injected

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

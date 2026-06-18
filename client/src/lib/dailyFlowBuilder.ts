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
 *   → [Calm Breathing, Agility Flow, Physical Circuit — 1 round]
 *   → Push-ups → Sit-ups → Squats → Plank hold (regular floor push-ups, no wall/incline)
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
import {
  getPhysicalCircuitProfile,
  PUSH_VARIATION_COPY,
} from "./physicalCircuitProgressStore";

// ── Public API ────────────────────────────────────────────────────────────────

export interface DailyFlowBuildOptions {
  dayNumber: number;
  tiers?: CategoryTiers;
  isOnboardingComplete?: boolean;
}

/**
 * Builds the Foundation path circuit.
 *
 * This is intentionally tiny: one confidence-building round after Agility,
 * not the full Workout Builder routine.
 */
function buildFoundationStrengthActivity(tier: number): ActivityDefinition {
  const xpMultiplier = TIER_XP_MULTIPLIERS[tier] ?? 1.0;
  const pushReps = 6 + Math.min(tier - 1, 4) * 2;
  const squatReps = 8 + Math.min(tier - 1, 4) * 2;
  const bridgeReps = 8 + Math.min(tier - 1, 4) * 2;
  const plankSeconds = 15 + Math.min(tier - 1, 4) * 5;
  const restSeconds = 12;
  const SECS_PER_REP = 3;

  const duration =
    10 +
    (pushReps + squatReps + bridgeReps) * SECS_PER_REP +
    3 * restSeconds +
    plankSeconds +
    5;

  const steps: ActivityStep[] = [
    {
      id: "foundation_intro",
      type: "instruction",
      label: "Get Ready — Foundation Circuit",
      instruction:
        "One short round · Wall push-ups → assisted squats → glute bridges → plank. Smooth form, no rush.",
      voiceText:
        "Get ready. One short foundation circuit. Wall push-ups, assisted squats, glute bridges, then plank.",
    },
    {
      id: "wall_pushups",
      type: "rep",
      label: "Wall Push-ups",
      instruction: `${pushReps} wall push-ups. Keep your body straight and move with control.`,
      repCount: pushReps,
      repLabel: "reps",
      voiceText: `Wall push-ups. ${pushReps} reps.`,
      videoSrc: "/videos/wall_pushups_loop.mp4",
    },
    {
      id: "foundation_rest_1",
      type: "timer",
      label: "Rest",
      instruction: "Rest 12 seconds. Reset your breath.",
      durationSeconds: restSeconds,
      voiceText: "Rest. 12 seconds.",
    },
    {
      id: "assisted_squats",
      type: "rep",
      label: "Assisted Squats",
      instruction: `${squatReps} assisted squats. Use a chair or wall if needed. Chest up.`,
      repCount: squatReps,
      repLabel: "reps",
      voiceText: `Assisted squats. ${squatReps} reps.`,
      videoSrc: "/videos/squats_loop.mp4",
    },
    {
      id: "foundation_rest_2",
      type: "timer",
      label: "Rest",
      instruction: "Rest 12 seconds.",
      durationSeconds: restSeconds,
      voiceText: "Rest. 12 seconds.",
    },
    {
      id: "glute_bridges",
      type: "rep",
      label: "Glute Bridges",
      instruction: `${bridgeReps} glute bridges. Squeeze at the top, lower with control.`,
      repCount: bridgeReps,
      repLabel: "reps",
      voiceText: `Glute bridges. ${bridgeReps} reps.`,
      videoSrc: "/videos/glute_bridges_loop.mp4",
    },
    {
      id: "foundation_rest_3",
      type: "timer",
      label: "Rest",
      instruction: "Rest 12 seconds. Last hold coming.",
      durationSeconds: restSeconds,
      voiceText: "Rest. 12 seconds.",
    },
    {
      id: "foundation_plank",
      type: "timer",
      label: "Plank Hold",
      instruction: `Hold a plank for ${plankSeconds} seconds. Knees down is fine. Breathe steadily.`,
      durationSeconds: plankSeconds,
      voiceText: `Plank hold. ${plankSeconds} seconds.`,
      videoSrc: "/videos/plank_hold_loop.mp4",
      loop: false,
    },
    {
      id: "foundation_done",
      type: "completion",
      label: "Physical Circuit Complete",
      instruction: "Foundation circuit complete. You showed up.",
      voiceText: "Physical circuit complete. Great work.",
    },
  ];

  return {
    id: "phase1_strength",
    activityName: "Foundation Circuit",
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
 * Builds a short, 1-round Starter Strength activity for the Build path.
 *
 * Exercises: Push-ups → Sit-ups → Squats → Plank hold
 * (regular floor push-ups, no wall/incline variations)
 *
 * Single round with 15 s rests, tier-scaled reps (8–16 / 10–18).
 * No second round, no multi-set structure.
 */
function buildStarterStrengthActivity(tier: number): ActivityDefinition {
  const xpMultiplier = TIER_XP_MULTIPLIERS[tier] ?? 1.0;

  const pushReps     = 8  + Math.min(tier - 1, 4) * 2;   // 8 → 16
  const situpReps    = 10 + Math.min(tier - 1, 4) * 2;   // 10 → 18
  const squatReps    = 10 + Math.min(tier - 1, 4) * 2;   // 10 → 18
  const plankSeconds = 20 + Math.min(tier - 1, 4) * 5;   // 20 → 40 s
  const restSeconds  = 15;
  const SECS_PER_REP = 3;

  const duration =
    10 +
    (pushReps + situpReps + squatReps) * SECS_PER_REP +
    3 * restSeconds +
    plankSeconds +
    5;

  const steps: ActivityStep[] = [
    {
      id: "starter_intro",
      type: "instruction",
      label: "Get Ready — Physical Circuit",
      instruction:
        "One round · Push-ups → Sit-ups → Squats → Plank. Full form, your pace.",
      voiceText:
        "Get ready. One round. Push-ups, sit-ups, squats, then a plank hold.",
    },
    {
      id: "pushups",
      type: "rep",
      label: "Push-ups",
      instruction: `${pushReps} push-ups. Full range of motion — chest near the floor, arms fully extended.`,
      repCount: pushReps,
      repLabel: "reps",
      voiceText: `Push-ups. ${pushReps} reps. Full range.`,
      videoSrc: "/videos/pushups_loop.mp4",
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
      id: "situps",
      type: "rep",
      label: "Sit-ups",
      instruction: `${situpReps} sit-ups. Core tight. Controlled on the way down.`,
      repCount: situpReps,
      repLabel: "reps",
      voiceText: `Sit-ups. ${situpReps} reps. Core tight.`,
      videoSrc: "/videos/abs_crunch_loop.mp4",
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
      id: "squats",
      type: "rep",
      label: "Squats",
      instruction: `${squatReps} squats. Chest up, knees tracking over toes, drive through your heels.`,
      repCount: squatReps,
      repLabel: "reps",
      voiceText: `Squats. ${squatReps} reps. Chest up.`,
      videoSrc: "/videos/squats_loop.mp4",
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
      instruction: `Hold a plank for ${plankSeconds} seconds. Straight line from head to heels. Breathe.`,
      durationSeconds: plankSeconds,
      voiceText: `Plank hold. ${plankSeconds} seconds.`,
      videoSrc: "/videos/plank_hold_loop.mp4",
      loop: false,
    },
    {
      id: "starter_done",
      type: "completion",
      label: "Physical Circuit Complete",
      instruction: "Well done. One round of strength work done.",
      voiceText: "Physical circuit complete. Great work.",
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

function buildAdaptiveStarterStrengthActivity(tier: number): ActivityDefinition {
  const profile = getPhysicalCircuitProfile();
  const xpMultiplier = TIER_XP_MULTIPLIERS[tier] ?? 1.0;
  const push = PUSH_VARIATION_COPY[profile.pushVariation];

  const tierBonus = Math.min(tier - 1, 4) * 2;
  const pushReps = Math.max(4, 6 + tierBonus + profile.repsBonus);
  const squatReps = Math.max(6, 8 + tierBonus + profile.repsBonus);
  const situpReps = Math.max(6, 8 + tierBonus + profile.repsBonus);
  const plankSeconds = Math.max(10, 15 + Math.min(tier - 1, 4) * 5 + profile.plankBonusSeconds);
  const restSeconds = Math.min(25, Math.max(10, 15 + profile.restBonusSeconds));
  const SECS_PER_REP = 3;

  const cardioLabel =
    profile.cardioMode === "march" ? "March in Place" :
    profile.cardioMode === "step_jacks" ? "Step Jacks" :
    "Jog in Place";
  const cardioVideo =
    profile.cardioMode === "step_jacks"
      ? "/videos/jumpingjacks_loop.mp4"
      : "/videos/joginplace_loop.mp4";

  const duration =
    10 +
    (profile.cardioSeconds > 0 ? profile.cardioSeconds + 5 : 0) +
    (pushReps + squatReps + situpReps) * SECS_PER_REP +
    3 * restSeconds +
    plankSeconds +
    5;

  const steps: ActivityStep[] = [
    {
      id: "adaptive_intro",
      type: "instruction",
      label: "Get Ready — Physical Circuit",
      instruction:
        `${push.label} → Squats → Sit-ups → Plank. The system will adjust after your feedback.`,
      voiceText:
        `Get ready. ${push.label}, squats, sit-ups, then a plank hold.`,
    },
  ];

  if (profile.cardioSeconds > 0) {
    steps.push({
      id: "adaptive_cardio",
      type: "timer",
      label: cardioLabel,
      instruction: `${cardioLabel} for ${profile.cardioSeconds} seconds. Keep it smooth and controlled.`,
      durationSeconds: profile.cardioSeconds,
      voiceText: `${cardioLabel}. ${profile.cardioSeconds} seconds.`,
      videoSrc: cardioVideo,
    });
  }

  steps.push(
    {
      id: "adaptive_pushups",
      type: "rep",
      label: push.label,
      instruction: `${pushReps} ${push.instructionNoun}. Move with control. Stop if form breaks.`,
      repCount: pushReps,
      repLabel: "reps",
      voiceText: `${push.label}. ${pushReps} reps.`,
      videoSrc: push.videoSrc,
    },
    {
      id: "adaptive_rest_1",
      type: "timer",
      label: "Rest",
      instruction: `Rest ${restSeconds} seconds. Squats next.`,
      durationSeconds: restSeconds,
      voiceText: `Rest ${restSeconds} seconds.`,
    },
    {
      id: "adaptive_squats",
      type: "rep",
      label: "Squats",
      instruction: `${squatReps} squats. Chest up, knees tracking over toes.`,
      repCount: squatReps,
      repLabel: "reps",
      voiceText: `Squats. ${squatReps} reps.`,
      videoSrc: "/videos/squats_loop.mp4",
    },
    {
      id: "adaptive_rest_2",
      type: "timer",
      label: "Rest",
      instruction: `Rest ${restSeconds} seconds. Core next.`,
      durationSeconds: restSeconds,
      voiceText: `Rest ${restSeconds} seconds.`,
    },
    {
      id: "adaptive_situps",
      type: "rep",
      label: "Sit-ups",
      instruction: `${situpReps} sit-ups. Controlled on the way down.`,
      repCount: situpReps,
      repLabel: "reps",
      voiceText: `Sit-ups. ${situpReps} reps.`,
      videoSrc: "/videos/abs_crunch_loop.mp4",
    },
    {
      id: "adaptive_rest_3",
      type: "timer",
      label: "Rest",
      instruction: `Rest ${restSeconds} seconds. Plank next.`,
      durationSeconds: restSeconds,
      voiceText: `Rest ${restSeconds} seconds.`,
    },
    {
      id: "adaptive_plank",
      type: "timer",
      label: "Plank Hold",
      instruction: `Hold a plank for ${plankSeconds} seconds. Knees down is fine. Breathe steadily.`,
      durationSeconds: plankSeconds,
      voiceText: `Plank hold. ${plankSeconds} seconds.`,
      videoSrc: "/videos/plank_hold_loop.mp4",
      loop: false,
    },
    {
      id: "adaptive_done",
      type: "completion",
      label: "Physical Circuit Complete",
      instruction: "Physical circuit complete. Your next answer tunes the next session.",
      voiceText: "Physical circuit complete. Great work.",
    },
  );

  return {
    id: "phase1_strength",
    activityName: "Physical Circuit",
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
  // ── Foundation / entry ──────────────────────────────────────────────────────
  // Short physical circuit after Agility, tuned much lighter than Build.
  if (workoutLevel === "entry") {
    const strengthTier = options.tiers?.strength ?? 1;
    const base = buildPhase1Activities(options.dayNumber, options.tiers);
    return base.map((a): ActivityDefinition => {
      if (a.id === "phase1_agility") return { ...a, activityName: "Light Movement" };
      if (a.id === "phase1_strength") return buildFoundationStrengthActivity(strengthTier);
      return a;
    });
  }

  // ── Build / beginner ────────────────────────────────────────────────────────
  // Replace the generic Physical Circuit stub with the 1-round Starter Strength
  // activity (wall push-ups → assisted squats → glute bridges → plank).
  if (workoutLevel === "beginner") {
    const strengthTier = options.tiers?.strength ?? 1;
    const base = buildPhase1Activities(options.dayNumber, options.tiers);
    return base.map((a): ActivityDefinition =>
      a.id === "phase1_strength"
        ? options.isOnboardingComplete
          ? buildAdaptiveStarterStrengthActivity(strengthTier)
          : buildStarterStrengthActivity(strengthTier)
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

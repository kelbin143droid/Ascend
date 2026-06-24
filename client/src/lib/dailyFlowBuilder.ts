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
  CORE_VARIATION_COPY,
  getPhysicalCircuitProfile,
  isPhysicalCircuitProfileInitialized,
  PLANK_VARIATION_COPY,
  PUSH_VARIATION_COPY,
  SQUAT_VARIATION_COPY,
} from "./physicalCircuitProgressStore";
import {
  AGILITY_STAGE_LABELS,
  getAgilityProgressProfile,
  type AgilityLimiter,
} from "./agilityProgressStore";

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
  const squat = SQUAT_VARIATION_COPY[profile.squatVariation];
  const core = CORE_VARIATION_COPY[profile.coreVariation];
  const plank = PLANK_VARIATION_COPY[profile.plankVariation];

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
        `${push.label} → ${squat.label} → ${core.label} → ${plank.label}. The system will adjust after your feedback.`,
      voiceText:
        `Get ready. ${push.label}, ${squat.label}, ${core.label}, then ${plank.label}.`,
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
      label: squat.label,
      instruction: `${squatReps} ${squat.instructionNoun}. ${squat.formCue}`,
      repCount: squatReps,
      repLabel: "reps",
      voiceText: `${squat.label}. ${squatReps} reps.`,
      videoSrc: squat.videoSrc,
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
      label: core.label,
      instruction: `${situpReps} ${core.instructionNoun}. ${core.formCue}`,
      repCount: situpReps,
      repLabel: "reps",
      voiceText: `${core.label}. ${situpReps} reps.`,
      videoSrc: core.videoSrc,
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
      label: plank.label,
      instruction: `Hold a ${plank.instructionNoun} for ${plankSeconds} seconds. ${plank.formCue}`,
      durationSeconds: plankSeconds,
      voiceText: `${plank.label}. ${plankSeconds} seconds.`,
      videoSrc: plank.videoSrc,
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

function makeMobilityStep(
  id: string,
  label: string,
  seconds: number,
  instruction: string,
  videoSrc?: string,
): ActivityStep {
  return {
    id,
    type: "timer",
    label,
    instruction,
    durationSeconds: seconds,
    voiceText: `${label}. ${seconds} seconds.`,
    ...(videoSrc ? { videoSrc } : {}),
    loop: !!videoSrc,
  };
}

function focusSteps(focus: AgilityLimiter, seconds: number): ActivityStep[] {
  switch (focus) {
    case "shoulders":
      return [
        makeMobilityStep("focus_neck_release", "Neck Release", seconds, "Slowly release tension through the neck. Move gently, no forcing."),
        makeMobilityStep("focus_chest_opener", "Chest Opener", seconds, "Open your chest and pull the shoulders back softly."),
      ];
    case "back":
      return [
        makeMobilityStep("focus_cat_cow", "Cat-Cow", seconds, "Round and arch your back with slow breathing."),
        makeMobilityStep("focus_child_pose", "Child's Pose", seconds, "Sink back and let the spine lengthen."),
      ];
    case "hips":
      return [
        makeMobilityStep("focus_figure_four", "Figure-Four Stretch", seconds, "Cross one ankle over the opposite knee and breathe into the hip."),
        makeMobilityStep("focus_low_lunge", "Low Lunge", seconds, "Step one foot forward and open the front of the hip."),
      ];
    case "hamstrings":
      return [
        makeMobilityStep("focus_forward_fold", "Forward Fold", seconds, "Hinge forward with soft knees. Let the hamstrings open gradually."),
        makeMobilityStep("focus_hamstring_reach", "Hamstring Reach", seconds, "Reach toward one foot with control, then breathe."),
      ];
    case "ankles":
      return [
        makeMobilityStep("focus_calf_stretch", "Calf Stretch", seconds, "Press through the heel and stretch the calf."),
        makeMobilityStep("focus_ankle_rocks", "Ankle Rocks", seconds, "Rock the knee forward over the toes while keeping the heel down."),
      ];
    default:
      return [];
  }
}

function buildAdaptiveAgilityActivity(tier: number): ActivityDefinition {
  const profile = getAgilityProgressProfile();
  const stage = profile.stage;
  const stageLabel = AGILITY_STAGE_LABELS[stage];
  const baseSeconds = 16 + Math.min(tier - 1, 4) * 2 + profile.holdBonusSeconds;
  const seconds = Math.max(10, baseSeconds);
  const longSeconds = Math.max(15, seconds + 6);
  const xpMultiplier = TIER_XP_MULTIPLIERS[tier] ?? 1.0;

  const stageSteps: Record<number, ActivityStep[]> = {
    1: [
      makeMobilityStep("mobility_shoulder_forward", "Shoulder Rolls", seconds, "Roll both shoulders forward in slow circles.", "/videos/shoulder-roll-forward.mp4"),
      makeMobilityStep("mobility_shoulder_backward", "Reverse Shoulder Rolls", seconds, "Reverse the circles and open the chest.", "/videos/shoulder-roll-backward.mp4"),
      makeMobilityStep("mobility_arm_circles", "Arm Circles", seconds, "Extend your arms and draw smooth circles.", "/videos/arm_circles_forward_loop.mp4"),
      makeMobilityStep("mobility_cross_arm", "Cross Arm Stretch", seconds, "Bring one arm across your chest and hold gently.", "/videos/cross_arm_left.mp4"),
      makeMobilityStep("mobility_toe_touch", "Toe Touch Hold", longSeconds, "Reach toward your toes with soft knees. No bouncing.", "/videos/toe_hold.mp4"),
      makeMobilityStep("mobility_hip_opener", "Hip Opener", longSeconds, "Open the hips with an easy lunge or butterfly stretch.", "/videos/holderstretch.mp4"),
      makeMobilityStep("mobility_calf_stretch", "Calf Stretch", seconds, "Press the heel down and breathe into the calf."),
    ],
    2: [
      makeMobilityStep("flow_cat_cow", "Cat-Cow", seconds, "Move the spine slowly between round and arched positions."),
      makeMobilityStep("flow_side_bends", "Side Bends", seconds, "Reach overhead and bend gently side to side."),
      makeMobilityStep("flow_seated_twist", "Seated Twist", seconds, "Rotate through the upper back. Keep the breath steady."),
      makeMobilityStep("flow_low_lunge", "Low Lunge", longSeconds, "Step forward and open the hip. Switch sides halfway."),
      makeMobilityStep("flow_down_dog_prep", "Downward Dog Prep", longSeconds, "Press the hips back and lengthen the spine."),
    ],
    3: [
      makeMobilityStep("flex_forward_fold", "Forward Fold", longSeconds, "Fold forward with soft knees and a long spine."),
      makeMobilityStep("flex_deep_lunge", "Deep Lunge Stretch", longSeconds, "Open the front hip and breathe low."),
      makeMobilityStep("flex_figure_four", "Figure-Four Stretch", longSeconds, "Cross the ankle over the knee and release the hip."),
      makeMobilityStep("flex_cobra", "Cobra", seconds, "Lift the chest gently and keep the low back comfortable."),
      makeMobilityStep("flex_child_pose", "Child's Pose", longSeconds, "Sink back and let the back soften."),
    ],
    4: [
      makeMobilityStep("yoga_cat_cow", "Cat-Cow", seconds, "Match breath to movement."),
      makeMobilityStep("yoga_down_dog", "Downward Dog", longSeconds, "Press hips back, lengthen arms, soften knees."),
      makeMobilityStep("yoga_low_lunge", "Low Lunge Flow", longSeconds, "Step forward, open the hip, then switch sides."),
      makeMobilityStep("yoga_warrior_one", "Warrior 1", seconds, "Ground your feet and reach tall."),
      makeMobilityStep("yoga_warrior_two", "Warrior 2", seconds, "Open the hips and reach through both arms."),
      makeMobilityStep("yoga_cobra", "Cobra", seconds, "Lift the chest with control."),
      makeMobilityStep("yoga_child_pose", "Child's Pose", longSeconds, "Reset your breath and release."),
    ],
    5: [
      makeMobilityStep("athletic_deep_squat", "Deep Squat Hold", longSeconds, "Sink into a controlled squat and keep the chest lifted."),
      makeMobilityStep("athletic_cossack_left", "Cossack Squat — Left", seconds, "Shift into the left leg and keep the opposite leg long."),
      makeMobilityStep("athletic_cossack_right", "Cossack Squat — Right", seconds, "Shift into the right leg and control the range."),
      makeMobilityStep("athletic_lizard", "Lizard Stretch", longSeconds, "Step forward wide and open the hips."),
      makeMobilityStep("athletic_hamstring_pulses", "Hamstring Pulses", seconds, "Pulse gently through the hamstrings with control."),
      makeMobilityStep("athletic_balance_reach", "Balance Reach", seconds, "Stand tall, reach forward, and control your balance."),
    ],
  };

  const extraFocus = profile.focus === "everything" ? [] : focusSteps(profile.focus, seconds);
  const steps: ActivityStep[] = [
    {
      id: "adaptive_agility_intro",
      type: "instruction",
      label: stageLabel,
      instruction: `${stageLabel}. Move smoothly and stop before sharp pain. Your feedback tunes the next flow.`,
      voiceText: `${stageLabel}. Move smoothly and breathe.`,
    },
    ...stageSteps[stage],
    ...extraFocus,
    {
      id: "adaptive_agility_done",
      type: "completion",
      label: "Flow Complete",
      instruction: "Agility flow complete. Your next answer tunes the next session.",
      voiceText: "Agility flow complete. Well done.",
    },
  ];

  const duration = steps.reduce((sum, step) => sum + (step.durationSeconds ?? 6), 0);

  return {
    id: "phase1_agility",
    activityName: stageLabel,
    category: "agility",
    stat: "agility",
    duration,
    xpReward: 0,
    color: CATEGORY_COLORS.agility,
    tier,
    xpMultiplier,
    autoflow: true,
    steps,
  };
}

function applyAdaptiveAgility(
  activities: ActivityDefinition[],
  tier: number,
  enabled?: boolean,
): ActivityDefinition[] {
  if (!enabled) return activities;
  return activities.map((activity) =>
    activity.id === "phase1_agility" ? buildAdaptiveAgilityActivity(tier) : activity
  );
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
    const agilityTier = options.tiers?.agility ?? 1;
    const base = buildPhase1Activities(options.dayNumber, options.tiers);
    return applyAdaptiveAgility(base.map((a): ActivityDefinition => {
      if (a.id === "phase1_agility") return { ...a, activityName: "Light Movement" };
      if (a.id === "phase1_strength") return buildFoundationStrengthActivity(strengthTier);
      return a;
    }), agilityTier, options.isOnboardingComplete);
  }

  // ── Build / beginner ────────────────────────────────────────────────────────
  // Replace the generic Physical Circuit stub with the 1-round Starter Strength
  // activity (wall push-ups → assisted squats → glute bridges → plank).
  if (workoutLevel === "beginner") {
    const strengthTier = options.tiers?.strength ?? 1;
    const agilityTier = options.tiers?.agility ?? 1;
    const base = buildPhase1Activities(options.dayNumber, options.tiers);
    return applyAdaptiveAgility(base.map((a): ActivityDefinition =>
      a.id === "phase1_strength"
        ? options.isOnboardingComplete || isPhysicalCircuitProfileInitialized()
          ? buildAdaptiveStarterStrengthActivity(strengthTier)
          : buildStarterStrengthActivity(strengthTier)
        : a
    ), agilityTier, options.isOnboardingComplete);
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
    return applyAdaptiveAgility(
      buildPhase1Activities(options.dayNumber, ascendTiers),
      ascendTiers.agility,
      options.isOnboardingComplete,
    );
  }

  // ── Evolve / intermediate ───────────────────────────────────────────────────
  // Standard 2-round Physical Circuit at the user's current adaptive tier.
  // Warm-up cardio → Jog → Round 1 → Rest → Round 2.
  return applyAdaptiveAgility(
    buildPhase1Activities(options.dayNumber, options.tiers),
    options.tiers?.agility ?? 1,
    options.isOnboardingComplete,
  );
}

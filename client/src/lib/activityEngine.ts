export type StepType = "instruction" | "timer" | "rep" | "breath" | "completion" | "check";

export interface BreathTiming {
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
}

export interface CheckInfoTooltip {
  title: string;
  bullets: string[];
  note: string;
}

export interface ActivityStep {
  id: string;
  type: StepType;
  label: string;
  instruction: string;
  durationSeconds?: number;
  repCount?: number;
  repLabel?: string;
  breathTiming?: BreathTiming;
  voiceText?: string;
  infoTooltip?: CheckInfoTooltip;
}

export interface ActivityDefinition {
  id: string;
  activityName: string;
  category: "strength" | "agility" | "meditation" | "vitality";
  stat: "strength" | "agility" | "sense" | "vitality";
  duration: number;
  xpReward: number;
  color: string;
  steps: ActivityStep[];
  tier?: number;
  xpMultiplier?: number;
}

export const CATEGORY_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  meditation: "#3b82f6",
  vitality: "#f59e0b",
};

export const TIER_XP_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.1,
  3: 1.2,
  4: 1.3,
  5: 1.5,
};

export interface TierConfig {
  pushupSeconds: number;
  cardioSeconds: number;
  crunchSeconds: number;
}

export const STRENGTH_TIERS: Record<number, TierConfig> = {
  1: { pushupSeconds: 20, cardioSeconds: 30, crunchSeconds: 20 },
  2: { pushupSeconds: 25, cardioSeconds: 35, crunchSeconds: 25 },
  3: { pushupSeconds: 30, cardioSeconds: 40, crunchSeconds: 30 },
  4: { pushupSeconds: 35, cardioSeconds: 45, crunchSeconds: 35 },
  5: { pushupSeconds: 45, cardioSeconds: 60, crunchSeconds: 45 },
};

export interface AgilityTierConfig {
  neckRollSeconds: number;
  shoulderRollSeconds: number;
  armCircleSeconds: number;
  torsoTwistSeconds: number;
  hipCircleSeconds: number;
  forwardFoldSeconds: number;
  restSeconds: number;
}

export const AGILITY_TIERS: Record<number, AgilityTierConfig> = {
  1: { neckRollSeconds: 15, shoulderRollSeconds: 15, armCircleSeconds: 15, torsoTwistSeconds: 20, hipCircleSeconds: 15, forwardFoldSeconds: 15, restSeconds: 15 },
  2: { neckRollSeconds: 18, shoulderRollSeconds: 18, armCircleSeconds: 18, torsoTwistSeconds: 25, hipCircleSeconds: 18, forwardFoldSeconds: 20, restSeconds: 15 },
  3: { neckRollSeconds: 20, shoulderRollSeconds: 20, armCircleSeconds: 20, torsoTwistSeconds: 30, hipCircleSeconds: 20, forwardFoldSeconds: 25, restSeconds: 15 },
  4: { neckRollSeconds: 25, shoulderRollSeconds: 25, armCircleSeconds: 25, torsoTwistSeconds: 35, hipCircleSeconds: 25, forwardFoldSeconds: 30, restSeconds: 15 },
  5: { neckRollSeconds: 30, shoulderRollSeconds: 30, armCircleSeconds: 30, torsoTwistSeconds: 40, hipCircleSeconds: 30, forwardFoldSeconds: 35, restSeconds: 15 },
};

export function getMaxTierForPhase(phase: number): number {
  if (phase <= 1) return 3;
  return 5;
}

export interface CategoryTiers {
  strength: number;
  agility: number;
  meditation: number;
  vitality: number;
}

export function buildPhase1Activities(
  _dayNumber: number,
  tiers?: CategoryTiers,
): ActivityDefinition[] {
  const strengthTier = tiers?.strength ?? 1;
  const agilityTier = tiers?.agility ?? 1;
  const meditationTier = tiers?.meditation ?? 1;
  const vitalityTier = tiers?.vitality ?? 1;

  const st = STRENGTH_TIERS[strengthTier] ?? STRENGTH_TIERS[1];
  const strengthMultiplier = TIER_XP_MULTIPLIERS[strengthTier] ?? 1.0;
  const agilityMultiplier = TIER_XP_MULTIPLIERS[agilityTier] ?? 1.0;
  const meditationMultiplier = TIER_XP_MULTIPLIERS[meditationTier] ?? 1.0;
  const vitalityMultiplier = TIER_XP_MULTIPLIERS[vitalityTier] ?? 1.0;

  const ag = AGILITY_TIERS[agilityTier] ?? AGILITY_TIERS[1];

  const meditationDuration = 120 + (meditationTier - 1) * 30;

  return [
    {
      id: "phase1_meditation",
      activityName: "Calm Breathing",
      category: "meditation",
      stat: "sense",
      duration: meditationDuration,
      xpReward: 0,
      color: CATEGORY_COLORS.meditation,
      tier: meditationTier,
      xpMultiplier: meditationMultiplier,
      steps: [
        {
          id: "calm_intro",
          type: "instruction",
          label: "Get Ready",
          instruction: `Find a comfortable position. Close your eyes or soften your gaze. We'll breathe together for ${Math.round(meditationDuration / 60)} minutes.`,
          voiceText: `Find a comfortable position. Close your eyes. We'll breathe together for ${Math.round(meditationDuration / 60)} minutes.`,
        },
        {
          id: "calm_breathing",
          type: "breath",
          label: "Calm Breathing",
          instruction: "Follow the circle. Inhale 4s → Hold 2s → Exhale 6s.",
          durationSeconds: meditationDuration,
          breathTiming: { inhaleSeconds: 4, holdSeconds: 2, exhaleSeconds: 6 },
          voiceText: "Follow the circle. Inhale for 4 seconds. Hold for 2. Exhale for 6.",
        },
        {
          id: "meditation_done",
          type: "completion",
          label: "Meditation Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
          voiceText: "Meditation complete. Well done.",
        },
      ],
    },
    {
      id: "phase1_strength",
      activityName: "Strength Micro Circuit",
      category: "strength",
      stat: "strength",
      duration: 120,
      xpReward: 0,
      color: CATEGORY_COLORS.strength,
      tier: strengthTier,
      xpMultiplier: strengthMultiplier,
      steps: [
        {
          id: "intro",
          type: "instruction",
          label: "Get Ready",
          instruction: "Quick body activation. Follow the steps.",
          voiceText: "Get ready. Quick body activation.",
        },
        {
          id: "pushups",
          type: "timer",
          label: "Push-ups",
          instruction: `Push-ups for ${st.pushupSeconds} seconds. Go at your own pace. Knee push-ups are perfectly fine.`,
          durationSeconds: st.pushupSeconds,
          voiceText: `Push-ups. Go at your own pace for ${st.pushupSeconds} seconds.`,
        },
        {
          id: "cardio",
          type: "timer",
          label: "Cardio",
          instruction: "Jog in place. Keep it light and steady.",
          durationSeconds: st.cardioSeconds,
          voiceText: `Jog in place for ${st.cardioSeconds} seconds. Keep it light and steady.`,
        },
        {
          id: "abs",
          type: "timer",
          label: "Crunches",
          instruction: `Crunches for ${st.crunchSeconds} seconds. Slow and controlled.`,
          durationSeconds: st.crunchSeconds,
          voiceText: `Crunches. Slow and controlled for ${st.crunchSeconds} seconds.`,
        },
        {
          id: "rest",
          type: "timer",
          label: "Rest",
          instruction: "Catch your breath. Shake out your arms and legs.",
          durationSeconds: 20,
          voiceText: "Rest. Catch your breath. Shake out your arms and legs.",
        },
        {
          id: "strength_done",
          type: "completion",
          label: "Circuit Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
          voiceText: "Circuit complete. Great work.",
        },
      ],
    },
    {
      id: "phase1_agility",
      activityName: "Light Movement Circuit",
      category: "agility",
      stat: "agility",
      duration: ag.neckRollSeconds + ag.shoulderRollSeconds + ag.armCircleSeconds + ag.torsoTwistSeconds + ag.hipCircleSeconds + ag.forwardFoldSeconds + ag.restSeconds,
      xpReward: 0,
      color: CATEGORY_COLORS.agility,
      tier: agilityTier,
      xpMultiplier: agilityMultiplier,
      steps: [
        {
          id: "intro",
          type: "instruction",
          label: "Get Ready",
          instruction: "Light movement circuit. Follow the intervals — each exercise has a timer.",
          voiceText: "Get ready. Light movement circuit. Follow the intervals.",
        },
        {
          id: "neck_rolls",
          type: "timer",
          label: "Neck Rolls",
          instruction: `Roll your neck gently — clockwise then counter-clockwise. ${ag.neckRollSeconds} seconds.`,
          durationSeconds: ag.neckRollSeconds,
          voiceText: `Neck rolls for ${ag.neckRollSeconds} seconds. Clockwise then counter-clockwise.`,
        },
        {
          id: "shoulder_rolls",
          type: "timer",
          label: "Shoulder Rolls",
          instruction: `Roll your shoulders forward and backward. Loosen up. ${ag.shoulderRollSeconds} seconds.`,
          durationSeconds: ag.shoulderRollSeconds,
          voiceText: `Shoulder rolls for ${ag.shoulderRollSeconds} seconds. Forward and backward.`,
        },
        {
          id: "arm_circles",
          type: "timer",
          label: "Arm Circles",
          instruction: `Extend your arms and make small circles, then big circles. ${ag.armCircleSeconds} seconds.`,
          durationSeconds: ag.armCircleSeconds,
          voiceText: `Arm circles for ${ag.armCircleSeconds} seconds. Small circles, then big circles.`,
        },
        {
          id: "torso_twist",
          type: "timer",
          label: "Torso Twist",
          instruction: `Feet shoulder-width apart. Twist your torso side to side. ${ag.torsoTwistSeconds} seconds.`,
          durationSeconds: ag.torsoTwistSeconds,
          voiceText: `Torso twist for ${ag.torsoTwistSeconds} seconds. Twist side to side.`,
        },
        {
          id: "hip_circles",
          type: "timer",
          label: "Hip Circles",
          instruction: `Hands on hips. Rotate your hips in slow circles. ${ag.hipCircleSeconds} seconds.`,
          durationSeconds: ag.hipCircleSeconds,
          voiceText: `Hip circles for ${ag.hipCircleSeconds} seconds. Slow rotations.`,
        },
        {
          id: "forward_fold",
          type: "timer",
          label: "Forward Fold",
          instruction: `Bend forward and reach toward your toes. Hold gently — no bouncing. ${ag.forwardFoldSeconds} seconds.`,
          durationSeconds: ag.forwardFoldSeconds,
          voiceText: `Forward fold for ${ag.forwardFoldSeconds} seconds. Reach toward your toes.`,
        },
        {
          id: "rest",
          type: "timer",
          label: "Rest",
          instruction: "Shake out your limbs. Take a few deep breaths.",
          durationSeconds: ag.restSeconds,
          voiceText: "Rest. Shake out your limbs. Take a few deep breaths.",
        },
        {
          id: "agility_done",
          type: "completion",
          label: "Circuit Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
          voiceText: "Light movement circuit complete. Well done.",
        },
      ],
    },
    {
      id: "phase1_vitality",
      activityName: "Vitality Check",
      category: "vitality",
      stat: "vitality",
      duration: 30,
      xpReward: 0,
      color: CATEGORY_COLORS.vitality,
      tier: vitalityTier,
      xpMultiplier: vitalityMultiplier,
      steps: [
        {
          id: "hydration",
          type: "instruction",
          label: "Hydration",
          instruction: "Drink one full glass of water right now. Hydration is the foundation of energy.",
          voiceText: "Drink a full glass of water. Hydration is the foundation of energy.",
        },
        {
          id: "sleep_check",
          type: "instruction",
          label: "Sleep Check",
          instruction: "Did you sleep at least 6 hours last night? Consistent sleep fuels recovery.",
          voiceText: "Did you sleep at least 6 hours? Consistent sleep fuels recovery.",
        },
        {
          id: "meal_check",
          type: "check",
          label: "Nutrition Check",
          instruction: "Did you eat a balanced meal today?",
          voiceText: "Did you eat a balanced meal today?",
          infoTooltip: {
            title: "What counts as balanced?",
            bullets: [
              "Carbohydrates — energy (50%)",
              "Protein — muscle repair (30%)",
              "Healthy fats — hormonal support (20%)",
            ],
            note: "Aim for variety. Any whole-food meal with all three groups counts.",
          },
        },
        {
          id: "vitality_done",
          type: "completion",
          label: "Vitality Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
          voiceText: "Vitality check complete.",
        },
      ],
    },
  ];
}

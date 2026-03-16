export type StepType = "instruction" | "timer" | "rep" | "breath" | "completion";

export interface BreathTiming {
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
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
  shoulderRollSeconds: number;
  torsoTwistSeconds: number;
  forwardFoldSeconds: number;
}

export const AGILITY_TIERS: Record<number, AgilityTierConfig> = {
  1: { shoulderRollSeconds: 15, torsoTwistSeconds: 20, forwardFoldSeconds: 15 },
  2: { shoulderRollSeconds: 18, torsoTwistSeconds: 25, forwardFoldSeconds: 20 },
  3: { shoulderRollSeconds: 20, torsoTwistSeconds: 30, forwardFoldSeconds: 25 },
  4: { shoulderRollSeconds: 25, torsoTwistSeconds: 35, forwardFoldSeconds: 30 },
  5: { shoulderRollSeconds: 30, torsoTwistSeconds: 40, forwardFoldSeconds: 35 },
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
      activityName: "Agility Mobility Flow",
      category: "agility",
      stat: "agility",
      duration: 75,
      xpReward: 0,
      color: CATEGORY_COLORS.agility,
      tier: agilityTier,
      xpMultiplier: agilityMultiplier,
      steps: [
        {
          id: "intro",
          type: "instruction",
          label: "Get Ready",
          instruction: "Follow the mobility flow slowly.",
          voiceText: "Get ready. Follow the mobility flow slowly.",
        },
        {
          id: "neck_cw",
          type: "timer",
          label: "Neck Clockwise",
          instruction: "Slowly roll your neck clockwise. Keep it gentle.",
          durationSeconds: 10,
          voiceText: "Roll your neck clockwise. Keep it gentle.",
        },
        {
          id: "neck_ccw",
          type: "timer",
          label: "Neck Counter-clockwise",
          instruction: "Now roll your neck counter-clockwise. Same pace.",
          durationSeconds: 10,
          voiceText: "Now counter-clockwise. Same pace.",
        },
        {
          id: "shoulder_rolls",
          type: "timer",
          label: "Shoulder Rolls",
          instruction: `Roll your shoulders forward and backward for ${ag.shoulderRollSeconds} seconds. Loosen up.`,
          durationSeconds: ag.shoulderRollSeconds,
          voiceText: `Shoulder rolls for ${ag.shoulderRollSeconds} seconds. Roll forward and backward. Loosen up.`,
        },
        {
          id: "torso_twist",
          type: "timer",
          label: "Torso Twist",
          instruction: "Stand with feet shoulder-width apart. Gently twist your torso side to side.",
          durationSeconds: ag.torsoTwistSeconds,
          voiceText: `Torso twist for ${ag.torsoTwistSeconds} seconds. Twist side to side.`,
        },
        {
          id: "forward_fold",
          type: "timer",
          label: "Forward Fold",
          instruction: "Slowly bend forward and reach toward your toes. Hold gently — no bouncing.",
          durationSeconds: ag.forwardFoldSeconds,
          voiceText: `Forward fold for ${ag.forwardFoldSeconds} seconds. Reach toward your toes. No bouncing.`,
        },
        {
          id: "agility_done",
          type: "completion",
          label: "Mobility Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
          voiceText: "Mobility complete. Well done.",
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

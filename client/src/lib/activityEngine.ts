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
  pushups: number;
  cardioSeconds: number;
  crunches: number;
}

export const STRENGTH_TIERS: Record<number, TierConfig> = {
  1: { pushups: 5, cardioSeconds: 30, crunches: 10 },
  2: { pushups: 6, cardioSeconds: 35, crunches: 12 },
  3: { pushups: 7, cardioSeconds: 40, crunches: 14 },
  4: { pushups: 8, cardioSeconds: 45, crunches: 16 },
  5: { pushups: 10, cardioSeconds: 60, crunches: 20 },
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

  const agilityNeckDuration = 20 + (agilityTier - 1) * 5;
  const agilityShoulderReps = 10 + (agilityTier - 1) * 2;
  const agilityBendDuration = 15 + (agilityTier - 1) * 5;

  const meditationDuration = 120 + (meditationTier - 1) * 30;

  return [
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
        },
        {
          id: "pushups",
          type: "rep",
          label: "Push-ups",
          instruction: `Do ${st.pushups} push-ups at your own pace. Knee push-ups are perfectly fine.`,
          repCount: st.pushups,
          repLabel: "push-ups",
        },
        {
          id: "cardio",
          type: "timer",
          label: "Cardio",
          instruction: "Jog in place. Keep it light and steady.",
          durationSeconds: st.cardioSeconds,
        },
        {
          id: "abs",
          type: "rep",
          label: "Abs",
          instruction: `Do ${st.crunches} crunches. Slow and controlled.`,
          repCount: st.crunches,
          repLabel: "crunches",
        },
        {
          id: "rest",
          type: "timer",
          label: "Rest",
          instruction: "Catch your breath. Shake out your arms and legs.",
          durationSeconds: 20,
        },
        {
          id: "strength_done",
          type: "completion",
          label: "Circuit Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
        },
      ],
    },
    {
      id: "phase1_agility",
      activityName: "Agility",
      category: "agility",
      stat: "agility",
      duration: 60,
      xpReward: 0,
      color: CATEGORY_COLORS.agility,
      tier: agilityTier,
      xpMultiplier: agilityMultiplier,
      steps: [
        {
          id: "neck_roll",
          type: "timer",
          label: "Neck Rolls",
          instruction: `Gently roll your neck in circles. ${Math.round(agilityNeckDuration / 2)} seconds each direction.`,
          durationSeconds: agilityNeckDuration,
        },
        {
          id: "shoulder_rolls",
          type: "rep",
          label: "Shoulder Rolls",
          instruction: "Roll your shoulders forward and backward.",
          repCount: agilityShoulderReps,
          repLabel: "each direction",
        },
        {
          id: "forward_bend",
          type: "timer",
          label: "Forward Bend",
          instruction: "Stand and slowly bend forward. Reach toward your toes. Hold gently.",
          durationSeconds: agilityBendDuration,
        },
        {
          id: "agility_done",
          type: "completion",
          label: "Agility Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
        },
      ],
    },
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
        },
        {
          id: "calm_breathing",
          type: "breath",
          label: "Calm Breathing",
          instruction: "Follow the circle. Inhale 4s → Hold 2s → Exhale 6s.",
          durationSeconds: meditationDuration,
          breathTiming: { inhaleSeconds: 4, holdSeconds: 2, exhaleSeconds: 6 },
        },
        {
          id: "meditation_done",
          type: "completion",
          label: "Meditation Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
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
        },
        {
          id: "sleep_check",
          type: "instruction",
          label: "Sleep Check",
          instruction: "Did you sleep at least 6 hours last night? Consistent sleep fuels recovery.",
        },
        {
          id: "vitality_done",
          type: "completion",
          label: "Vitality Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
        },
      ],
    },
  ];
}

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
  videoSrc?: string;
  loop?: boolean;
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
  cardioSeconds: number;
  pushupSeconds: number;
  plankSeconds: number;
  restSeconds: number;
}

export const STRENGTH_TIERS: Record<number, TierConfig> = {
  1: { cardioSeconds: 25, pushupSeconds: 20, plankSeconds: 20, restSeconds: 15 },
  2: { cardioSeconds: 30, pushupSeconds: 25, plankSeconds: 25, restSeconds: 15 },
  3: { cardioSeconds: 35, pushupSeconds: 30, plankSeconds: 30, restSeconds: 15 },
  4: { cardioSeconds: 40, pushupSeconds: 35, plankSeconds: 35, restSeconds: 15 },
  5: { cardioSeconds: 50, pushupSeconds: 45, plankSeconds: 45, restSeconds: 15 },
};

export interface AgilityTierConfig {
  crossArmSeconds: number;
  tricepSeconds: number;
  toeTouchSeconds: number;
  hipOpenerSeconds: number;
  restSeconds: number;
}

export const AGILITY_TIERS: Record<number, AgilityTierConfig> = {
  1: { crossArmSeconds: 15, tricepSeconds: 15, toeTouchSeconds: 20, hipOpenerSeconds: 20, restSeconds: 10 },
  2: { crossArmSeconds: 18, tricepSeconds: 18, toeTouchSeconds: 25, hipOpenerSeconds: 25, restSeconds: 10 },
  3: { crossArmSeconds: 20, tricepSeconds: 20, toeTouchSeconds: 30, hipOpenerSeconds: 30, restSeconds: 10 },
  4: { crossArmSeconds: 25, tricepSeconds: 25, toeTouchSeconds: 35, hipOpenerSeconds: 35, restSeconds: 10 },
  5: { crossArmSeconds: 30, tricepSeconds: 30, toeTouchSeconds: 40, hipOpenerSeconds: 40, restSeconds: 10 },
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

  const useJumpingJacks = Math.random() < 0.5;
  const cardioLabel = useJumpingJacks ? "Jumping Jacks" : "Jog in Place";
  const cardioVideo = useJumpingJacks ? "/videos/jumpingjacks_loop.mp4" : "/videos/joginplace_loop.mp4";
  const cardioInstruction = useJumpingJacks
    ? `Jumping jacks for ${st.cardioSeconds} seconds. Arms and legs in sync.`
    : `Jog in place for ${st.cardioSeconds} seconds. Knees up, stay light.`;
  const cardioVoice = useJumpingJacks
    ? `Jumping jacks. ${st.cardioSeconds} seconds.`
    : `Jog in place. ${st.cardioSeconds} seconds.`;

  const pushUpVideo = "/videos/pushups_loop.mp4";
  const pushUpLabel = strengthTier <= 1 ? "Push-Ups (Knee if needed)" : "Push-Ups";
  const pushUpInstruction = strengthTier <= 1
    ? `Push-ups for ${st.pushupSeconds} seconds. Use your knees if needed — control the movement.`
    : `Push-ups for ${st.pushupSeconds} seconds. Slow and steady.`;

  const strengthTotal = st.cardioSeconds + st.pushupSeconds + st.pushupSeconds + st.plankSeconds + st.restSeconds;
  const agilityTotal = ag.crossArmSeconds * 2 + ag.tricepSeconds * 2 + ag.toeTouchSeconds + ag.hipOpenerSeconds + ag.restSeconds;

  const DAILY_FLOW_ORDER = [
    "phase1_meditation",
    "phase1_agility",
    "phase1_strength",
    "phase1_vitality",
  ];

  const allActivities = [
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
          instruction: "Follow the circle. Inhale 4s → Hold 4s → Exhale 6s.",
          durationSeconds: meditationDuration,
          breathTiming: { inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 6 },
          voiceText: "Follow the circle. Inhale for 4 seconds. Hold for 4. Exhale for 6.",
          videoSrc: "/videos/meditation_loop.mp4",
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
      activityName: "Physical Circuit",
      category: "strength",
      stat: "strength",
      duration: strengthTotal,
      xpReward: 0,
      color: CATEGORY_COLORS.strength,
      tier: strengthTier,
      xpMultiplier: strengthMultiplier,
      steps: [
        {
          id: "intro",
          type: "instruction",
          label: "Get Ready",
          instruction: "Four exercises. Follow the animations and timer.",
          voiceText: "Get ready. Four exercises. Follow the animations.",
        },
        {
          id: "cardio",
          type: "timer",
          label: cardioLabel,
          instruction: cardioInstruction,
          durationSeconds: st.cardioSeconds,
          voiceText: cardioVoice,
          videoSrc: cardioVideo,
        },
        {
          id: "pushups",
          type: "timer",
          label: pushUpLabel,
          instruction: pushUpInstruction,
          durationSeconds: st.pushupSeconds,
          voiceText: `${pushUpLabel}. ${st.pushupSeconds} seconds.`,
          videoSrc: pushUpVideo,
        },
        {
          id: "abs",
          type: "timer",
          label: "Abs — Sit-ups",
          instruction: `Sit-ups for ${st.pushupSeconds} seconds. Curl up slowly, lower with control.`,
          durationSeconds: st.pushupSeconds,
          voiceText: `Sit-ups. ${st.pushupSeconds} seconds. Core tight.`,
          videoSrc: "/videos/abs_crunch_loop.mp4",
        },
        {
          id: "plank",
          type: "timer",
          label: "Plank Hold",
          instruction: `Hold a plank for ${st.plankSeconds} seconds. Hips level, core tight.`,
          durationSeconds: st.plankSeconds,
          voiceText: `Plank hold. ${st.plankSeconds} seconds. Core tight.`,
          videoSrc: "/videos/plank_hold_loop.mp4",
          loop: false,
        },
        {
          id: "rest",
          type: "instruction",
          label: "Rest",
          instruction: "Circuit done. Shake out your arms. Breathe.",
          voiceText: "Rest. Shake out your arms. Breathe.",
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
      activityName: "Agility Flow",
      category: "agility",
      stat: "agility",
      duration: agilityTotal,
      xpReward: 0,
      color: CATEGORY_COLORS.agility,
      tier: agilityTier,
      xpMultiplier: agilityMultiplier,
      steps: [
        {
          id: "intro",
          type: "instruction",
          label: "Get Ready",
          instruction: "Four stretches. Each side, follow the animation.",
          voiceText: "Get ready. Four stretches. Follow the animation.",
        },
        {
          id: "cross_arm_left",
          type: "timer",
          label: "Cross Arm — Left",
          instruction: `Bring your left arm across your chest. Hold the stretch. ${ag.crossArmSeconds} seconds.`,
          durationSeconds: ag.crossArmSeconds,
          voiceText: `Cross arm stretch, left side. ${ag.crossArmSeconds} seconds.`,
          videoSrc: "/videos/cross_arm_left.mp4",
          loop: false,
        },
        {
          id: "cross_arm_right",
          type: "timer",
          label: "Cross Arm — Right",
          instruction: `Switch to your right arm across your chest. ${ag.crossArmSeconds} seconds.`,
          durationSeconds: ag.crossArmSeconds,
          voiceText: `Cross arm stretch, right side. ${ag.crossArmSeconds} seconds.`,
          videoSrc: "/videos/cross_arm_right.mp4",
          loop: false,
        },
        {
          id: "tricep_left",
          type: "timer",
          label: "Tricep — Left",
          instruction: `Raise your left arm, bend at the elbow, reach down your back. ${ag.tricepSeconds} seconds.`,
          durationSeconds: ag.tricepSeconds,
          voiceText: `Tricep stretch, left side. ${ag.tricepSeconds} seconds.`,
          videoSrc: "/videos/tricep_left.mp4",
          loop: false,
        },
        {
          id: "tricep_right",
          type: "timer",
          label: "Tricep — Right",
          instruction: `Switch to your right arm. Elbow up, reach down your back. ${ag.tricepSeconds} seconds.`,
          durationSeconds: ag.tricepSeconds,
          voiceText: `Tricep stretch, right side. ${ag.tricepSeconds} seconds.`,
          videoSrc: "/videos/tricep_right.mp4",
          loop: false,
        },
        {
          id: "toe_touch",
          type: "timer",
          label: "Toe Touch Hold",
          instruction: `Reach toward your toes and hold gently. No bouncing. ${ag.toeTouchSeconds} seconds.`,
          durationSeconds: ag.toeTouchSeconds,
          voiceText: `Toe touch hold. ${ag.toeTouchSeconds} seconds. No bouncing.`,
          videoSrc: "/videos/toe_hold.mp4",
          loop: false,
        },
        {
          id: "hip_opener",
          type: "timer",
          label: "Hip Opener",
          instruction: `Open your hips with a wide-stance lunge or butterfly stretch. ${ag.hipOpenerSeconds} seconds.`,
          durationSeconds: ag.hipOpenerSeconds,
          voiceText: `Hip opener stretch. ${ag.hipOpenerSeconds} seconds.`,
          videoSrc: "/videos/holderstretch.mp4",
          loop: false,
        },
        {
          id: "agility_done",
          type: "completion",
          label: "Flow Complete",
          instruction: "Activity complete.\nSmall actions build momentum.",
          voiceText: "Agility flow complete. Well done.",
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
          type: "check",
          label: "Sleep Check",
          instruction: "Did you sleep at least 6 hours last night?",
          voiceText: "Did you sleep at least 6 hours? Consistent sleep fuels recovery.",
          infoTooltip: {
            title: "Why sleep matters",
            bullets: [
              "Muscle repair happens during deep sleep",
              "6–9 hours supports hormone balance",
              "Sleep debt reduces willpower and focus",
            ],
            note: "Even one extra hour of sleep tonight will compound over time.",
          },
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

  return DAILY_FLOW_ORDER
    .map(id => allActivities.find(a => a.id === id))
    .filter((a): a is ActivityDefinition => !!a);
}

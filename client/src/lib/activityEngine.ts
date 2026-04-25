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
  autoflow?: boolean;
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
  /** Rep targets for the Physical Circuit (per round, 2 rounds total). */
  pushupReps: number;
  situpReps: number;
  squatReps: number;
  /** Rest seconds between rounds. */
  restSeconds: number;
}

export const STRENGTH_TIERS: Record<number, TierConfig> = {
  1: { pushupReps:  8, situpReps: 10, squatReps: 10, restSeconds: 60 },
  2: { pushupReps: 12, situpReps: 14, squatReps: 14, restSeconds: 60 },
  3: { pushupReps: 16, situpReps: 18, squatReps: 18, restSeconds: 60 },
  4: { pushupReps: 20, situpReps: 22, squatReps: 22, restSeconds: 60 },
  5: { pushupReps: 26, situpReps: 28, squatReps: 28, restSeconds: 60 },
};

/** Rough seconds-per-rep used to estimate Physical Circuit duration. */
const SECONDS_PER_REP = 3;

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

  const pushUpVideo = "/videos/pushups_loop.mp4";
  const pushUpLabel = strengthTier <= 1 ? "Push-Ups (Knee if needed)" : "Push-Ups";
  const pushUpInstruction = strengthTier <= 1
    ? `${st.pushupReps} push-ups. Use your knees if needed — control the movement.`
    : `${st.pushupReps} push-ups. Slow and steady, full range.`;

  // Total ≈ 2 rounds × (pushups + situps + squats) × 3s/rep + rest break.
  // Each transition between exercises is a 6s "Get Ready" preview rendered
  // by the engine itself (not a separate timer step), so it is not counted
  // here.
  const strengthTotal =
    2 * (st.pushupReps + st.situpReps + st.squatReps) * SECONDS_PER_REP +
    st.restSeconds;
  const agilityTotal = ag.crossArmSeconds * 2 + ag.tricepSeconds * 2 + ag.toeTouchSeconds + ag.hipOpenerSeconds + ag.restSeconds;

  const DAILY_FLOW_ORDER = [
    "phase1_meditation",
    "phase1_agility",
    "phase1_strength",
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
      autoflow: true,
      steps: [
        {
          id: "intro",
          type: "instruction",
          label: "Get Ready",
          instruction: `Two rounds of Push-ups → Sit-ups → Squats. ${st.restSeconds}s break between rounds. Tap "Done" when you finish each set.`,
          voiceText: "Get ready. Two rounds of push-ups, sit-ups, and squats.",
        },
        // ── Round 1
        {
          id: "pushups_1",
          type: "rep",
          label: `${pushUpLabel} — Round 1`,
          instruction: pushUpInstruction,
          repCount: st.pushupReps,
          repLabel: "reps",
          voiceText: `Round one. ${st.pushupReps} push-ups.`,
          videoSrc: pushUpVideo,
        },
        {
          id: "situps_1",
          type: "rep",
          label: "Sit-ups — Round 1",
          instruction: `${st.situpReps} sit-ups. Curl up slowly, lower with control.`,
          repCount: st.situpReps,
          repLabel: "reps",
          voiceText: `${st.situpReps} sit-ups. Core tight.`,
          videoSrc: "/videos/abs_crunch_loop.mp4",
        },
        {
          id: "squats_1",
          type: "rep",
          label: "Squats — Round 1",
          instruction: `${st.squatReps} squats. Chest up, knees track over toes.`,
          repCount: st.squatReps,
          repLabel: "reps",
          voiceText: `${st.squatReps} squats. Chest up.`,
        },
        // ── Break between rounds
        {
          id: "set_break",
          type: "timer",
          label: "Rest",
          instruction: `Rest ${st.restSeconds} seconds. Round 2 coming up — Push-ups → Sit-ups → Squats.`,
          durationSeconds: st.restSeconds,
          voiceText: `Rest ${st.restSeconds} seconds. Round two coming up.`,
        },
        // ── Round 2
        {
          id: "pushups_2",
          type: "rep",
          label: `${pushUpLabel} — Round 2`,
          instruction: pushUpInstruction,
          repCount: st.pushupReps,
          repLabel: "reps",
          voiceText: `Round two. ${st.pushupReps} push-ups.`,
          videoSrc: pushUpVideo,
        },
        {
          id: "situps_2",
          type: "rep",
          label: "Sit-ups — Round 2",
          instruction: `${st.situpReps} sit-ups. Stay controlled.`,
          repCount: st.situpReps,
          repLabel: "reps",
          voiceText: `Round two. ${st.situpReps} sit-ups.`,
          videoSrc: "/videos/abs_crunch_loop.mp4",
        },
        {
          id: "squats_2",
          type: "rep",
          label: "Squats — Round 2",
          instruction: `${st.squatReps} squats. Drive through your heels.`,
          repCount: st.squatReps,
          repLabel: "reps",
          voiceText: `Final round. ${st.squatReps} squats.`,
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
      autoflow: true,
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
  ];

  return DAILY_FLOW_ORDER
    .map(id => allActivities.find(a => a.id === id))
    .filter((a) => !!a) as ActivityDefinition[];
}

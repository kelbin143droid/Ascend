import { getBreathingProfile } from "./breathingStore";
import { BREATHING_PHASES } from "./breathingProgressionSystem";

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
  breathingPhase?: number;
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
  /** Time-based warm-up + plank durations (seconds). */
  cardioSeconds: number;
  plankSeconds: number;
  /** Rep targets for the Physical Circuit (per round, 2 rounds total). */
  pushupReps: number;
  situpReps: number;
  squatReps: number;
  /** Rest seconds between rounds. */
  restSeconds: number;
}

export const STRENGTH_TIERS: Record<number, TierConfig> = {
  1: { cardioSeconds: 25, plankSeconds: 20, pushupReps:  8, situpReps: 10, squatReps: 10, restSeconds: 45 },
  2: { cardioSeconds: 30, plankSeconds: 25, pushupReps: 12, situpReps: 14, squatReps: 14, restSeconds: 45 },
  3: { cardioSeconds: 35, plankSeconds: 30, pushupReps: 16, situpReps: 18, squatReps: 18, restSeconds: 45 },
  4: { cardioSeconds: 40, plankSeconds: 35, pushupReps: 20, situpReps: 22, squatReps: 22, restSeconds: 45 },
  5: { cardioSeconds: 50, plankSeconds: 45, pushupReps: 26, situpReps: 28, squatReps: 28, restSeconds: 45 },
};

/** Rough seconds-per-rep used to estimate Physical Circuit duration. */
const SECONDS_PER_REP = 3;

export interface AgilityTierConfig {
  shoulderRollSeconds: number;
  armCircleSeconds: number;
  crossArmSeconds: number;
  tricepSeconds: number;
  toeTouchSeconds: number;
  hipOpenerSeconds: number;
  restSeconds: number;
}

export const AGILITY_TIERS: Record<number, AgilityTierConfig> = {
  1: { shoulderRollSeconds: 10, armCircleSeconds: 20, crossArmSeconds: 15, tricepSeconds: 15, toeTouchSeconds: 20, hipOpenerSeconds: 20, restSeconds: 10 },
  2: { shoulderRollSeconds: 12, armCircleSeconds: 25, crossArmSeconds: 18, tricepSeconds: 18, toeTouchSeconds: 25, hipOpenerSeconds: 25, restSeconds: 10 },
  3: { shoulderRollSeconds: 15, armCircleSeconds: 30, crossArmSeconds: 20, tricepSeconds: 20, toeTouchSeconds: 30, hipOpenerSeconds: 30, restSeconds: 10 },
  4: { shoulderRollSeconds: 18, armCircleSeconds: 35, crossArmSeconds: 25, tricepSeconds: 25, toeTouchSeconds: 35, hipOpenerSeconds: 35, restSeconds: 10 },
  5: { shoulderRollSeconds: 20, armCircleSeconds: 40, crossArmSeconds: 30, tricepSeconds: 30, toeTouchSeconds: 40, hipOpenerSeconds: 40, restSeconds: 10 },
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

  const breathProfile = getBreathingProfile();
  const meditationDuration = breathProfile.durationSeconds;
  const breathPattern = breathProfile.pattern;
  const breathingPhaseNum = breathProfile.phase;
  const breathPhaseDef = BREATHING_PHASES[breathingPhaseNum];

  // ── Warm-up cardio (time-based)
  const cardioLabel = "Jumping Jacks";
  const cardioVideo = "/videos/jumpingjacks_loop.mp4";
  const cardioInstruction = `Jumping jacks for ${st.cardioSeconds} seconds. Arms and legs in sync.`;
  const cardioVoice = `Jumping jacks. ${st.cardioSeconds} seconds.`;

  const jogLabel = "Jog in Place";
  const jogVideo = "/videos/joginplace_loop.mp4";
  const jogSeconds = st.cardioSeconds;
  const jogInstruction = `Jog in place for ${jogSeconds} seconds. Lift your knees, land softly.`;
  const jogVoice = `Jog in place. ${jogSeconds} seconds. Knees up.`;

  const pushUpVideo = "/videos/pushups_loop.mp4";
  const pushUpLabel = strengthTier <= 1 ? "Push-Ups (Knee if needed)" : "Push-Ups";
  const pushUpInstruction = strengthTier <= 1
    ? `${st.pushupReps} push-ups. Use your knees if needed — control the movement.`
    : `${st.pushupReps} push-ups. Slow and steady, full range.`;

  // Total ≈ jumping jacks + jog + 2 rounds × (rep work × 3s/rep + plank) + rest break.
  // Each transition between exercises is a 6s "Get Ready" preview rendered
  // by the engine itself (not a separate timer step), so it is not counted
  // here.
  const strengthTotal =
    st.cardioSeconds +
    jogSeconds +
    2 * ((st.pushupReps + st.situpReps + st.squatReps) * SECONDS_PER_REP + st.plankSeconds) +
    st.restSeconds;
  const agilityTotal = ag.shoulderRollSeconds * 2 + ag.armCircleSeconds * 2 + ag.crossArmSeconds * 2 + ag.tricepSeconds * 2 + ag.toeTouchSeconds + ag.hipOpenerSeconds + ag.restSeconds;

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
      breathingPhase: breathingPhaseNum,
      steps: [
        {
          id: "calm_intro",
          type: "instruction",
          label: "Get Ready",
          instruction: `Find a comfortable position. Close your eyes or soften your gaze. We'll breathe together for ${Math.round(meditationDuration / 60)} minutes.\n\n${breathPhaseDef.label} phase · ${breathPattern.inhaleSeconds}-${breathPattern.holdSeconds}-${breathPattern.exhaleSeconds} rhythm.`,
          voiceText: `Find a comfortable position. Close your eyes. We'll breathe together for ${Math.round(meditationDuration / 60)} minutes.`,
        },
        {
          id: "calm_breathing",
          type: "breath",
          label: "Calm Breathing",
          instruction: `Follow the circle. Inhale ${breathPattern.inhaleSeconds}s → Hold ${breathPattern.holdSeconds}s → Exhale ${breathPattern.exhaleSeconds}s.`,
          durationSeconds: (() => {
            const cycle = breathPattern.inhaleSeconds + breathPattern.holdSeconds + breathPattern.exhaleSeconds;
            return Math.max(cycle, Math.round(meditationDuration / cycle) * cycle);
          })(),
          breathTiming: {
            inhaleSeconds: breathPattern.inhaleSeconds,
            holdSeconds: breathPattern.holdSeconds,
            exhaleSeconds: breathPattern.exhaleSeconds,
          },
          voiceText: `Follow the circle. Inhale for ${breathPattern.inhaleSeconds} seconds. Hold for ${breathPattern.holdSeconds}. Exhale for ${breathPattern.exhaleSeconds}.`,
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
          instruction: `Jumping Jacks → Jog in Place, then two rounds of Squats → Push-ups → Sit-ups → Plank. ${st.restSeconds}s break between rounds.`,
          voiceText: "Get ready. Jumping jacks, then jog in place, then two full rounds.",
        },
        // ── Warm-up cardio (time-based)
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
          id: "jog",
          type: "timer",
          label: jogLabel,
          instruction: jogInstruction,
          durationSeconds: jogSeconds,
          voiceText: jogVoice,
          videoSrc: jogVideo,
        },
        // ── Round 1 (rep work + plank hold)
        {
          id: "squats_1",
          type: "rep",
          label: "Squats — Round 1",
          instruction: `${st.squatReps} squats. Chest up, knees track over toes.`,
          repCount: st.squatReps,
          repLabel: "reps",
          voiceText: `Round one. ${st.squatReps} squats. Chest up.`,
        },
        {
          id: "pushups_1",
          type: "rep",
          label: `${pushUpLabel} — Round 1`,
          instruction: pushUpInstruction,
          repCount: st.pushupReps,
          repLabel: "reps",
          voiceText: `${st.pushupReps} push-ups.`,
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
          id: "plank_1",
          type: "timer",
          label: "Plank — Round 1",
          instruction: `Hold a plank for ${st.plankSeconds} seconds. Straight line head to heels.`,
          durationSeconds: st.plankSeconds,
          voiceText: `Plank hold. ${st.plankSeconds} seconds. Straight line.`,
          videoSrc: "/videos/plank_hold_loop.mp4",
          loop: false,
        },
        // ── Break between rounds
        {
          id: "set_break",
          type: "timer",
          label: "Rest",
          instruction: `Rest ${st.restSeconds} seconds. Round 2 coming up — Squats → Push-ups → Sit-ups → Plank.`,
          durationSeconds: st.restSeconds,
          voiceText: `Rest ${st.restSeconds} seconds. Round two coming up.`,
        },
        // ── Round 2
        {
          id: "squats_2",
          type: "rep",
          label: "Squats — Round 2",
          instruction: `${st.squatReps} squats. Drive through your heels.`,
          repCount: st.squatReps,
          repLabel: "reps",
          voiceText: `Round two. ${st.squatReps} squats.`,
        },
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
          id: "plank_2",
          type: "timer",
          label: "Plank — Round 2",
          instruction: `Final plank — hold for ${st.plankSeconds} seconds. Squeeze your core.`,
          durationSeconds: st.plankSeconds,
          voiceText: `Final plank. ${st.plankSeconds} seconds. Squeeze your core.`,
          videoSrc: "/videos/plank_hold_loop.mp4",
          loop: false,
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
          instruction: "Shoulder rolls, arm circles, then six stretches. Breathe slow and easy.",
          voiceText: "Get ready. Shoulder rolls, arm circles, then stretches. Nice and easy.",
        },
        {
          id: "shoulder_roll_forward",
          type: "timer",
          label: "Shoulder Rolls — Forward",
          instruction: `Roll both shoulders forward in smooth slow circles. ${ag.shoulderRollSeconds} seconds.`,
          durationSeconds: ag.shoulderRollSeconds,
          voiceText: `Forward shoulder rolls. ${ag.shoulderRollSeconds} seconds. Slow and smooth.`,
          loop: false,
        },
        {
          id: "shoulder_roll_backward",
          type: "timer",
          label: "Shoulder Rolls — Backward",
          instruction: `Reverse direction — roll both shoulders backward, opening the chest. ${ag.shoulderRollSeconds} seconds.`,
          durationSeconds: ag.shoulderRollSeconds,
          voiceText: `Backward shoulder rolls. ${ag.shoulderRollSeconds} seconds. Open the chest.`,
          loop: false,
        },
        {
          id: "arm_circles_forward",
          type: "timer",
          label: "Arm Circles — Forward",
          instruction: `Extend both arms out wide and rotate them forward in big smooth circles. ${ag.armCircleSeconds} seconds.`,
          durationSeconds: ag.armCircleSeconds,
          voiceText: `Forward arm circles. ${ag.armCircleSeconds} seconds. Keep the circles big and smooth.`,
          videoSrc: "/videos/arm_circles_forward_loop.mp4",
          loop: true,
        },
        {
          id: "arm_circles_backward",
          type: "timer",
          label: "Arm Circles — Backward",
          instruction: `Reverse direction — rotate both arms backward in big smooth circles. ${ag.armCircleSeconds} seconds.`,
          durationSeconds: ag.armCircleSeconds,
          voiceText: `Backward arm circles. ${ag.armCircleSeconds} seconds. Open up the chest.`,
          videoSrc: "/videos/arm_circles_backward_loop.mp4",
          loop: true,
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

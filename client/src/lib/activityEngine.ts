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
}

export const CATEGORY_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  meditation: "#3b82f6",
  vitality: "#f59e0b",
};

export function buildPhase1Activities(dayNumber: number): ActivityDefinition[] {
  const pushupReps = 5 + Math.floor((dayNumber - 1) / 3);
  const cardioSeconds = 30 + Math.floor((dayNumber - 1) / 3) * 5;
  const crunchReps = 10 + Math.floor((dayNumber - 1) / 3) * 2;

  return [
    {
      id: "phase1_strength",
      activityName: "Strength Micro Circuit",
      category: "strength",
      stat: "strength",
      duration: 120,
      xpReward: 0,
      color: CATEGORY_COLORS.strength,
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
          instruction: `Do ${pushupReps} push-ups at your own pace. Knee push-ups are perfectly fine.`,
          repCount: pushupReps,
          repLabel: "push-ups",
        },
        {
          id: "cardio",
          type: "timer",
          label: "Cardio",
          instruction: `Jog in place. Keep it light and steady.`,
          durationSeconds: cardioSeconds,
        },
        {
          id: "abs",
          type: "rep",
          label: "Abs",
          instruction: `Do ${crunchReps} crunches. Slow and controlled.`,
          repCount: crunchReps,
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
      steps: [
        {
          id: "neck_roll",
          type: "timer",
          label: "Neck Rolls",
          instruction: "Gently roll your neck in circles. 10 seconds each direction.",
          durationSeconds: 20,
        },
        {
          id: "shoulder_rolls",
          type: "rep",
          label: "Shoulder Rolls",
          instruction: "Roll your shoulders forward and backward.",
          repCount: 10,
          repLabel: "each direction",
        },
        {
          id: "forward_bend",
          type: "timer",
          label: "Forward Bend",
          instruction: "Stand and slowly bend forward. Reach toward your toes. Hold gently.",
          durationSeconds: 15,
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
      duration: 120,
      xpReward: 0,
      color: CATEGORY_COLORS.meditation,
      steps: [
        {
          id: "calm_intro",
          type: "instruction",
          label: "Get Ready",
          instruction: "Find a comfortable position. Close your eyes or soften your gaze. We'll breathe together for 2 minutes.",
        },
        {
          id: "calm_breathing",
          type: "breath",
          label: "Calm Breathing",
          instruction: "Follow the circle. Inhale 4s → Hold 2s → Exhale 6s.",
          durationSeconds: 120,
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

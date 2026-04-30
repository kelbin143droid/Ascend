/**
 * workoutPlans.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 4-level workout progression system with warm-up and cardio modules.
 * Converts cleanly to ActivityDefinition so the existing GuidedActivityEngine
 * can run every workout without any changes to the engine.
 */

import type { ActivityDefinition, ActivityStep } from "./activityEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export type WorkoutLevel = "entry" | "beginner" | "intermediate" | "advanced";
export type CardioIntensity = "off" | "light" | "moderate" | "intense";
export type CardioPosition = "before" | "after";

export interface ExerciseDef {
  id: string;
  name: string;
  sets: number;
  /** e.g. "8-12" or "10" */
  reps?: string;
  /** For timed holds (plank, etc.) — seconds per set */
  durationSeconds?: number;
  /** Existing video if available */
  videoSrc?: string;
  /** When true, shows a placeholder card instead of a real animation */
  isPlaceholder?: boolean;
  /** Voice cue override */
  voiceCue?: string;
  /** Rest between sets (seconds) — defaults to REST_BETWEEN_SETS */
  restSeconds?: number;
}

export interface WorkoutPlan {
  level: WorkoutLevel;
  label: string;
  description: string;
  color: string;
  exercises: ExerciseDef[];
}

export interface CardioConfig {
  intensity: CardioIntensity;
  position: CardioPosition;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REST_BETWEEN_SETS = 30;       // seconds rest between sets
const WARMUP_DURATION = 30;         // seconds per warm-up exercise
const CARDIO_WORK_SEC = 30;         // work interval
const CARDIO_REST_SEC = 15;         // rest interval

/** How many intervals per cardio intensity level */
const CARDIO_INTERVALS: Record<Exclude<CardioIntensity, "off">, number> = {
  light:    6,   // ~5 min  (6 × 45s ≈ 4.5 min)
  moderate: 13,  // ~10 min (13 × 45s ≈ 9.75 min)
  intense:  20,  // ~15 min (20 × 45s = 15 min)
};

// ── Warm-up definition ────────────────────────────────────────────────────────

export const WARMUP_EXERCISES: ExerciseDef[] = [
  {
    id: "warmup_jacks",
    name: "Jumping Jacks",
    sets: 1,
    durationSeconds: WARMUP_DURATION,
    videoSrc: "/videos/jumpingjacks_loop.mp4",
    voiceCue: `Warm-up. Jumping jacks for ${WARMUP_DURATION} seconds.`,
  },
  {
    id: "warmup_jog",
    name: "Jog in Place",
    sets: 1,
    durationSeconds: WARMUP_DURATION,
    videoSrc: "/videos/joginplace_loop.mp4",
    voiceCue: `Jog in place for ${WARMUP_DURATION} seconds.`,
  },
  {
    id: "warmup_arms",
    name: "Arm Circles",
    sets: 1,
    durationSeconds: WARMUP_DURATION,
    isPlaceholder: true,
    voiceCue: `Arm circles for ${WARMUP_DURATION} seconds. Forward and back.`,
  },
];

// ── Cardio exercises pool ──────────────────────────────────────────────────────

const CARDIO_EXERCISES: Record<Exclude<CardioIntensity, "off">, ExerciseDef[]> = {
  light: [
    { id: "cardio_jacks",  name: "Jumping Jacks",     sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/jumpingjacks_loop.mp4" },
    { id: "cardio_jog",    name: "Jog in Place",       sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/joginplace_loop.mp4" },
    { id: "cardio_jacks2", name: "Jumping Jacks",      sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/jumpingjacks_loop.mp4" },
  ],
  moderate: [
    { id: "cardio_jacks",   name: "Jumping Jacks",      sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/jumpingjacks_loop.mp4" },
    { id: "cardio_jog",     name: "Jog in Place",        sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/joginplace_loop.mp4" },
    { id: "cardio_knees",   name: "High Knees",          sets: 1, durationSeconds: CARDIO_WORK_SEC, isPlaceholder: true },
    { id: "cardio_climber", name: "Mountain Climbers",   sets: 1, durationSeconds: CARDIO_WORK_SEC, isPlaceholder: true },
    { id: "cardio_jacks2",  name: "Jumping Jacks",       sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/jumpingjacks_loop.mp4" },
    { id: "cardio_jog2",    name: "Jog in Place",        sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/joginplace_loop.mp4" },
  ],
  intense: [
    { id: "cardio_jacks",    name: "Jumping Jacks",     sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/jumpingjacks_loop.mp4" },
    { id: "cardio_jog",      name: "Jog in Place",      sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/joginplace_loop.mp4" },
    { id: "cardio_knees",    name: "High Knees",        sets: 1, durationSeconds: CARDIO_WORK_SEC, isPlaceholder: true },
    { id: "cardio_climber",  name: "Mountain Climbers", sets: 1, durationSeconds: CARDIO_WORK_SEC, isPlaceholder: true },
    { id: "cardio_burpees",  name: "Burpees",           sets: 1, durationSeconds: CARDIO_WORK_SEC, isPlaceholder: true },
    { id: "cardio_jacks2",   name: "Jumping Jacks",     sets: 1, durationSeconds: CARDIO_WORK_SEC, videoSrc: "/videos/jumpingjacks_loop.mp4" },
    { id: "cardio_knees2",   name: "High Knees",        sets: 1, durationSeconds: CARDIO_WORK_SEC, isPlaceholder: true },
    { id: "cardio_climber2", name: "Mountain Climbers", sets: 1, durationSeconds: CARDIO_WORK_SEC, isPlaceholder: true },
  ],
};

// ── Workout plans ─────────────────────────────────────────────────────────────

export const WORKOUT_PLANS: Record<WorkoutLevel, WorkoutPlan> = {
  entry: {
    level: "entry",
    label: "Entry",
    description: "Prep Stage — build foundational strength",
    color: "#22c55e",
    exercises: [
      { id: "wall_push",    name: "Wall Push-ups",     sets: 3, reps: "8-12",  videoSrc: "/videos/wall_pushups_loop.mp4",    voiceCue: "Wall push-ups." },
      { id: "incline_push", name: "Incline Push-ups",  sets: 3, reps: "8-12",  videoSrc: "/videos/incline_pushups_loop.mp4", voiceCue: "Incline push-ups." },
      { id: "asst_squat",   name: "Assisted Squats",   sets: 3, reps: "10-15", videoSrc: "/videos/squats_loop.mp4",          voiceCue: "Assisted squats." },
      { id: "glute_bridge", name: "Glute Bridges",     sets: 3, reps: "12-15", videoSrc: "/videos/glute_bridges_loop.mp4",   voiceCue: "Glute bridges." },
      { id: "entry_plank",  name: "Plank Hold",        sets: 3, durationSeconds: 20, videoSrc: "/videos/plank_hold_loop.mp4", voiceCue: "Plank hold. 20 seconds." },
    ],
  },
  beginner: {
    level: "beginner",
    label: "Beginner",
    description: "Core moves with guided animation",
    color: "#3b82f6",
    exercises: [
      { id: "beg_push",   name: "Push-ups",       sets: 3, reps: "8-12",  videoSrc: "/videos/pushups_loop.mp4",     voiceCue: "Push-ups." },
      { id: "beg_situp",  name: "Sit-ups",         sets: 3, reps: "10-15", videoSrc: "/videos/abs_crunch_loop.mp4",  voiceCue: "Sit-ups. Core tight." },
      { id: "beg_plank",  name: "Plank Hold",      sets: 3, durationSeconds: 25, videoSrc: "/videos/plank_hold_loop.mp4", voiceCue: "Plank. 25 seconds." },
      { id: "beg_squat",  name: "Squats",          sets: 3, reps: "12-15", videoSrc: "/videos/squats_loop.mp4", voiceCue: "Squats." },
      { id: "beg_glute",  name: "Glute Bridges",   sets: 3, reps: "12-15", videoSrc: "/videos/glute_bridges_loop.mp4", voiceCue: "Glute bridges." },
    ],
  },
  intermediate: {
    level: "intermediate",
    label: "Intermediate",
    description: "Compound moves and increased volume",
    color: "#f59e0b",
    exercises: [
      { id: "int_push",    name: "Push-ups",              sets: 4, reps: "12-15", videoSrc: "/videos/pushups_loop.mp4",     voiceCue: "Push-ups." },
      { id: "int_split",   name: "Bulgarian Split Squats", sets: 3, reps: "8-10",  videoSrc: "/videos/squats_loop.mp4", voiceCue: "Bulgarian split squats." },
      { id: "int_dips",    name: "Dips",                  sets: 3, reps: "8-12",  isPlaceholder: true, voiceCue: "Dips." },
      { id: "int_pike",    name: "Pike Push-ups",         sets: 3, reps: "8-12",  isPlaceholder: true, voiceCue: "Pike push-ups." },
      { id: "int_plank",   name: "Plank Hold",            sets: 3, durationSeconds: 40, videoSrc: "/videos/plank_hold_loop.mp4", voiceCue: "Plank. 40 seconds." },
    ],
  },
  advanced: {
    level: "advanced",
    label: "Advanced",
    description: "High intensity with added resistance",
    color: "#ef4444",
    exercises: [
      { id: "adv_wpush",   name: "Weighted Push-ups",    sets: 4, reps: "10-15", isPlaceholder: true, voiceCue: "Weighted push-ups." },
      { id: "adv_pullup",  name: "Pull-ups",             sets: 4, reps: "6-10",  isPlaceholder: true, voiceCue: "Pull-ups." },
      { id: "adv_squat",   name: "Squats",               sets: 4, reps: "15-20", videoSrc: "/videos/squats_loop.mp4", voiceCue: "Squats." },
      { id: "adv_dips",    name: "Dips",                 sets: 4, reps: "10-15", isPlaceholder: true, voiceCue: "Dips." },
      { id: "adv_core",    name: "Sit-ups",              sets: 3, reps: "20-25", videoSrc: "/videos/abs_crunch_loop.mp4", voiceCue: "Core work. Sit-ups." },
      { id: "adv_plank",   name: "Plank Hold",           sets: 3, durationSeconds: 60, videoSrc: "/videos/plank_hold_loop.mp4", voiceCue: "Plank. 60 seconds." },
    ],
  },
};

// ── Conversion helpers ────────────────────────────────────────────────────────

/** Parse "8-12" → max reps (12) used for completion detection. */
export function parseMaxReps(repsStr: string): number {
  const parts = repsStr.split("-").map(Number).filter(Boolean);
  return Math.max(...parts);
}

/** Convert one ExerciseDef × N sets into ActivitySteps. */
function exerciseToSteps(ex: ExerciseDef, setLabel: (i: number) => string, restSec: number): ActivityStep[] {
  const steps: ActivityStep[] = [];
  for (let i = 0; i < ex.sets; i++) {
    const label = ex.sets === 1 ? ex.name : setLabel(i);
    if (ex.durationSeconds) {
      steps.push({
        id: `${ex.id}_set${i + 1}`,
        type: "timer",
        label,
        instruction: ex.isPlaceholder
          ? `${ex.name} — ${ex.durationSeconds}s. No video yet, but you got this!`
          : `${ex.name} — ${ex.durationSeconds} seconds.`,
        durationSeconds: ex.durationSeconds,
        voiceText: ex.voiceCue ?? ex.name,
        videoSrc: ex.videoSrc,
      });
    } else {
      const maxReps = ex.reps ? parseMaxReps(ex.reps) : 10;
      steps.push({
        id: `${ex.id}_set${i + 1}`,
        type: "rep",
        label,
        instruction: ex.isPlaceholder
          ? `${ex.name} — ${ex.reps ?? "10"} reps. Placeholder: guide coming soon.`
          : `${ex.name} — ${ex.reps ?? "10"} reps.`,
        repCount: maxReps,
        repLabel: "reps",
        voiceText: ex.voiceCue ?? ex.name,
        videoSrc: ex.videoSrc,
      });
    }
    // Rest between sets (not after last set)
    if (i < ex.sets - 1) {
      steps.push({
        id: `${ex.id}_rest${i + 1}`,
        type: "timer",
        label: "Rest",
        instruction: `Rest ${restSec} seconds. Next set coming up.`,
        durationSeconds: restSec,
        voiceText: `Rest ${restSec} seconds.`,
      });
    }
  }
  return steps;
}

/** Build warm-up ActivitySteps. */
function buildWarmupSteps(): ActivityStep[] {
  const steps: ActivityStep[] = [
    {
      id: "warmup_intro",
      type: "instruction",
      label: "Warm-up",
      instruction: "3-minute warm-up before we start. Jumping Jacks → Jog → Arm Circles.",
      voiceText: "Let's warm up. Three exercises, 30 seconds each.",
    },
  ];
  for (const ex of WARMUP_EXERCISES) {
    steps.push({
      id: ex.id,
      type: "timer",
      label: ex.name,
      instruction: ex.isPlaceholder
        ? `${ex.name} — ${ex.durationSeconds}s. Keep it smooth.`
        : `${ex.name} — ${ex.durationSeconds} seconds.`,
      durationSeconds: ex.durationSeconds,
      voiceText: ex.voiceCue ?? ex.name,
      videoSrc: ex.videoSrc,
    });
  }
  return steps;
}

/** Build cardio ActivitySteps for given intensity. */
function buildCardioSteps(intensity: Exclude<CardioIntensity, "off">): ActivityStep[] {
  const pool = CARDIO_EXERCISES[intensity];
  const numIntervals = CARDIO_INTERVALS[intensity];
  const steps: ActivityStep[] = [
    {
      id: "cardio_intro",
      type: "instruction",
      label: "Cardio",
      instruction: `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} cardio — 30s work / 15s rest intervals.`,
      voiceText: `Cardio block starting. ${intensity} intensity.`,
    },
  ];

  for (let i = 0; i < numIntervals; i++) {
    const ex = pool[i % pool.length];
    steps.push({
      id: `${ex.id}_i${i}`,
      type: "timer",
      label: ex.name,
      instruction: ex.isPlaceholder
        ? `${ex.name} — ${CARDIO_WORK_SEC}s all out!`
        : `${ex.name} — ${CARDIO_WORK_SEC} seconds.`,
      durationSeconds: CARDIO_WORK_SEC,
      voiceText: ex.name,
      videoSrc: ex.videoSrc,
    });
    if (i < numIntervals - 1) {
      steps.push({
        id: `cardio_rest_${i}`,
        type: "timer",
        label: "Rest",
        instruction: `Rest ${CARDIO_REST_SEC} seconds.`,
        durationSeconds: CARDIO_REST_SEC,
        voiceText: `Rest ${CARDIO_REST_SEC} seconds.`,
      });
    }
  }
  return steps;
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build a complete ActivityDefinition from a workout level + cardio config.
 * This is what gets handed to GuidedActivityEngine.
 */
export function buildWorkoutActivity(
  level: WorkoutLevel,
  cardio: CardioConfig,
): ActivityDefinition {
  const plan = WORKOUT_PLANS[level];
  const allSteps: ActivityStep[] = [];

  // ── Warm-up (always first)
  allSteps.push(...buildWarmupSteps());

  // ── Cardio BEFORE main workout
  if (cardio.intensity !== "off" && cardio.position === "before") {
    allSteps.push(...buildCardioSteps(cardio.intensity));
  }

  // ── Main workout intro
  allSteps.push({
    id: "main_intro",
    type: "instruction",
    label: plan.label,
    instruction: `${plan.label} workout: ${plan.exercises.length} exercises, ${plan.exercises[0]?.sets ?? 3} sets each. Let's go!`,
    voiceText: `${plan.label} workout. ${plan.exercises.length} exercises. Let's go.`,
  });

  // ── Main exercises
  for (const ex of plan.exercises) {
    const setLabel = (i: number) =>
      `${ex.name} — Set ${i + 1}/${ex.sets}`;
    const restSec = ex.restSeconds ?? REST_BETWEEN_SETS;
    allSteps.push(...exerciseToSteps(ex, setLabel, restSec));
    // rest after each EXERCISE (not just between sets)
    const notLast = plan.exercises.indexOf(ex) < plan.exercises.length - 1;
    if (notLast) {
      allSteps.push({
        id: `${ex.id}_exercise_rest`,
        type: "timer",
        label: "Rest",
        instruction: "Good work. Rest 30 seconds before the next exercise.",
        durationSeconds: 30,
        voiceText: "Rest 30 seconds.",
      });
    }
  }

  // ── Cardio AFTER main workout
  if (cardio.intensity !== "off" && cardio.position === "after") {
    allSteps.push(...buildCardioSteps(cardio.intensity));
  }

  // ── Completion
  allSteps.push({
    id: "workout_done",
    type: "completion",
    label: "Workout Complete",
    instruction: "Activity complete.\nConsistency is the only secret.",
    voiceText: "Workout complete. Great work.",
  });

  // Estimate total duration
  const totalSec = allSteps.reduce((sum, s) => {
    if (s.durationSeconds) return sum + s.durationSeconds;
    if (s.repCount) return sum + s.repCount * 3; // 3s per rep estimate
    return sum + 6;
  }, 0);

  return {
    id: `workout_${level}_${cardio.intensity}_${cardio.position}`,
    activityName: `${plan.label} Workout`,
    category: "strength",
    stat: "strength",
    duration: totalSec,
    xpReward: 15 + (["entry", "beginner", "intermediate", "advanced"].indexOf(level)) * 5,
    color: plan.color,
    steps: allSteps,
    tier: (["entry", "beginner", "intermediate", "advanced"].indexOf(level)) + 1,
  } as ActivityDefinition;
}

// ── Progression helpers ───────────────────────────────────────────────────────

/**
 * Returns the max-reps string for each exercise in a level,
 * used by the progression system to detect if user hit max reps.
 */
export function getLevelMaxReps(level: WorkoutLevel): Record<string, number> {
  const plan = WORKOUT_PLANS[level];
  const result: Record<string, number> = {};
  for (const ex of plan.exercises) {
    if (ex.reps) result[ex.id] = parseMaxReps(ex.reps);
    else if (ex.durationSeconds) result[ex.id] = ex.durationSeconds;
  }
  return result;
}

export function getNextLevel(level: WorkoutLevel): WorkoutLevel | null {
  const order: WorkoutLevel[] = ["entry", "beginner", "intermediate", "advanced"];
  const idx = order.indexOf(level);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export const LEVEL_COLORS: Record<WorkoutLevel, string> = {
  entry:        "#22c55e",
  beginner:     "#3b82f6",
  intermediate: "#f59e0b",
  advanced:     "#ef4444",
};

export const CARDIO_LABELS: Record<CardioIntensity, string> = {
  off:      "Off",
  light:    "Light ~5 min",
  moderate: "Moderate ~10 min",
  intense:  "Intense ~15 min",
};

export type TrainingLevel = "beginner" | "advanced";
export type TrainingStat = "strength" | "agility" | "sense" | "vitality";

export interface Exercise {
  id: string;
  name: string;
  beginnerVariant: string;
  advancedVariant: string;
  category: string;
}

export interface IntervalStep {
  type: "work" | "rest";
  durationSeconds: number;
  exercise?: Exercise;
  label: string;
  variant: string;
}

export interface TrainingSession {
  stat: TrainingStat;
  level: TrainingLevel;
  totalDurationSeconds: number;
  cycles: number;
  exercisesPerCycle: number;
  workSeconds: number;
  restSeconds: number;
  steps: IntervalStep[];
}

export interface SessionConfig {
  totalMinutes: number;
  workSeconds: number;
  restSeconds: number;
  exercisesPerCycle: number;
  cycles: number;
}

const STR_EXERCISES: Exercise[] = [
  { id: "pushups", name: "Push-ups", beginnerVariant: "Knee push-ups", advancedVariant: "Standard push-ups", category: "upper" },
  { id: "squats", name: "Squats", beginnerVariant: "Half squats", advancedVariant: "Full depth squats", category: "lower" },
  { id: "plank", name: "Plank Hold", beginnerVariant: "Knee plank", advancedVariant: "Full plank", category: "core" },
  { id: "lunges", name: "Lunges", beginnerVariant: "Stationary lunges", advancedVariant: "Walking lunges", category: "lower" },
  { id: "mountain_climbers", name: "Mountain Climbers", beginnerVariant: "Slow mountain climbers", advancedVariant: "Fast mountain climbers", category: "full" },
  { id: "tricep_dips", name: "Tricep Dips", beginnerVariant: "Bench dips (bent knees)", advancedVariant: "Bench dips (legs straight)", category: "upper" },
  { id: "glute_bridges", name: "Glute Bridges", beginnerVariant: "Double leg bridges", advancedVariant: "Single leg bridges", category: "lower" },
  { id: "superman", name: "Superman Hold", beginnerVariant: "Arms only lift", advancedVariant: "Full superman", category: "core" },
  { id: "burpees", name: "Burpees", beginnerVariant: "No-jump burpees", advancedVariant: "Full burpees", category: "full" },
  { id: "wall_sit", name: "Wall Sit", beginnerVariant: "Shallow wall sit", advancedVariant: "90° wall sit", category: "lower" },
  { id: "crunches", name: "Crunches", beginnerVariant: "Standard crunches", advancedVariant: "Bicycle crunches", category: "core" },
  { id: "jumping_jacks", name: "Jumping Jacks", beginnerVariant: "Step-out jacks", advancedVariant: "Star jumps", category: "full" },
];

const AGI_EXERCISES: Exercise[] = [
  { id: "forward_fold", name: "Forward Fold", beginnerVariant: "Bent knees, hands to shins", advancedVariant: "Straight legs, palms to floor", category: "hamstrings" },
  { id: "cat_cow", name: "Cat-Cow Stretch", beginnerVariant: "Gentle arch & round", advancedVariant: "Deep breath-synced flow", category: "spine" },
  { id: "pigeon_pose", name: "Pigeon Pose", beginnerVariant: "Modified with cushion", advancedVariant: "Full pigeon pose", category: "hips" },
  { id: "downward_dog", name: "Downward Dog", beginnerVariant: "Bent knees, heels up", advancedVariant: "Straight legs, heels down", category: "full" },
  { id: "seated_twist", name: "Seated Twist", beginnerVariant: "Gentle twist, hands on knee", advancedVariant: "Deep twist, bind variation", category: "spine" },
  { id: "quad_stretch", name: "Quad Stretch", beginnerVariant: "Standing with wall support", advancedVariant: "Standing no support", category: "quads" },
  { id: "hip_circles", name: "Hip Circles", beginnerVariant: "Small controlled circles", advancedVariant: "Large deep circles", category: "hips" },
  { id: "child_pose", name: "Child's Pose", beginnerVariant: "Arms by sides", advancedVariant: "Extended arms forward", category: "back" },
  { id: "cobra_stretch", name: "Cobra Stretch", beginnerVariant: "Baby cobra (elbows bent)", advancedVariant: "Full cobra (arms straight)", category: "spine" },
  { id: "butterfly", name: "Butterfly Stretch", beginnerVariant: "Feet far from body", advancedVariant: "Feet close, lean forward", category: "hips" },
  { id: "hamstring_stretch", name: "Hamstring Stretch", beginnerVariant: "Seated, bent knee", advancedVariant: "Seated, straight leg reach", category: "hamstrings" },
  { id: "shoulder_stretch", name: "Shoulder Stretch", beginnerVariant: "Cross-body arm pull", advancedVariant: "Eagle arms", category: "shoulders" },
  { id: "warrior_flow", name: "Warrior Flow", beginnerVariant: "Warrior I hold", advancedVariant: "Warrior I to II to III flow", category: "full" },
  { id: "neck_rolls", name: "Neck Rolls", beginnerVariant: "Half circles", advancedVariant: "Full slow circles", category: "neck" },
];

const SEN_EXERCISES: Exercise[] = [
  { id: "breath_awareness", name: "Breath Awareness", beginnerVariant: "Focus on natural breath", advancedVariant: "Count breaths 1-10, restart", category: "breath" },
  { id: "box_breathing", name: "Box Breathing", beginnerVariant: "4s in, 4s hold, 4s out, 4s hold", advancedVariant: "6s in, 6s hold, 6s out, 6s hold", category: "breath" },
  { id: "body_scan", name: "Body Scan", beginnerVariant: "Scan head to toes, notice tension", advancedVariant: "Deep scan with release at each area", category: "awareness" },
  { id: "emotional_labeling", name: "Emotional Labeling", beginnerVariant: "Name your current emotion", advancedVariant: "Track emotion shifts without reacting", category: "awareness" },
  { id: "gratitude_focus", name: "Gratitude Focus", beginnerVariant: "Think of 3 things you're grateful for", advancedVariant: "Visualize each in detail, feel it", category: "visualization" },
  { id: "visualization", name: "Visualization", beginnerVariant: "Imagine a peaceful place", advancedVariant: "Visualize your ideal day in detail", category: "visualization" },
  { id: "mantra_repeat", name: "Mantra Repetition", beginnerVariant: "Repeat 'I am calm' silently", advancedVariant: "Choose a personal intention, hold focus", category: "focus" },
  { id: "sound_awareness", name: "Sound Awareness", beginnerVariant: "Listen to surrounding sounds", advancedVariant: "Layer sounds, identify each one", category: "awareness" },
  { id: "thought_observation", name: "Thought Observation", beginnerVariant: "Watch thoughts pass like clouds", advancedVariant: "Label thought types without attachment", category: "focus" },
  { id: "loving_kindness", name: "Loving-Kindness", beginnerVariant: "Send good wishes to yourself", advancedVariant: "Extend to loved ones, strangers, all", category: "visualization" },
];

const VIT_EXERCISES: Exercise[] = [
  { id: "hydration_check", name: "Hydration Check", beginnerVariant: "Drink a full glass of water now", advancedVariant: "Track: aim for 8 glasses today", category: "hydration" },
  { id: "sleep_reflect", name: "Sleep Reflection", beginnerVariant: "Did you sleep 7+ hours?", advancedVariant: "Rate sleep quality 1-10, note patterns", category: "sleep" },
  { id: "gentle_walk", name: "Gentle Walk", beginnerVariant: "Walk in place or around room", advancedVariant: "Brisk walk with posture focus", category: "movement" },
  { id: "deep_breathing", name: "Deep Breathing", beginnerVariant: "5 slow deep breaths", advancedVariant: "4-7-8 breathing technique", category: "recovery" },
  { id: "neck_shoulder_release", name: "Neck & Shoulder Release", beginnerVariant: "Gentle neck tilts side to side", advancedVariant: "Full neck circles + shoulder rolls", category: "recovery" },
  { id: "posture_check", name: "Posture Reset", beginnerVariant: "Sit tall, roll shoulders back", advancedVariant: "Full posture alignment head to hips", category: "movement" },
  { id: "eye_rest", name: "Eye Rest (20-20-20)", beginnerVariant: "Look 20ft away for 20 seconds", advancedVariant: "Eye rest + palming technique", category: "recovery" },
  { id: "wrist_ankle_circles", name: "Wrist & Ankle Circles", beginnerVariant: "5 circles each direction", advancedVariant: "10 circles + finger stretches", category: "movement" },
  { id: "meal_awareness", name: "Meal Awareness", beginnerVariant: "Did you eat a balanced meal?", advancedVariant: "Rate nutrition quality, plan next meal", category: "nutrition" },
  { id: "sunlight_check", name: "Sunlight Exposure", beginnerVariant: "Step outside or near a window", advancedVariant: "10 min morning sunlight routine", category: "recovery" },
];

const SESSION_CONFIGS: Record<TrainingStat, Record<TrainingLevel, SessionConfig>> = {
  strength: {
    beginner: { totalMinutes: 10, workSeconds: 30, restSeconds: 30, exercisesPerCycle: 4, cycles: 2 },
    advanced: { totalMinutes: 15, workSeconds: 30, restSeconds: 30, exercisesPerCycle: 5, cycles: 3 },
  },
  agility: {
    beginner: { totalMinutes: 10, workSeconds: 30, restSeconds: 30, exercisesPerCycle: 4, cycles: 2 },
    advanced: { totalMinutes: 15, workSeconds: 45, restSeconds: 15, exercisesPerCycle: 5, cycles: 2 },
  },
  sense: {
    beginner: { totalMinutes: 5, workSeconds: 45, restSeconds: 15, exercisesPerCycle: 4, cycles: 1 },
    advanced: { totalMinutes: 15, workSeconds: 60, restSeconds: 15, exercisesPerCycle: 5, cycles: 2 },
  },
  vitality: {
    beginner: { totalMinutes: 5, workSeconds: 30, restSeconds: 15, exercisesPerCycle: 4, cycles: 1 },
    advanced: { totalMinutes: 10, workSeconds: 40, restSeconds: 20, exercisesPerCycle: 5, cycles: 1 },
  },
};

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectExercises(pool: Exercise[], count: number): Exercise[] {
  const categories = Array.from(new Set(pool.map(e => e.category)));
  const selected: Exercise[] = [];
  const shuffledPool = shuffleArray(pool);

  const usedCategories = new Set<string>();
  for (const exercise of shuffledPool) {
    if (selected.length >= count) break;
    if (!usedCategories.has(exercise.category) || usedCategories.size >= categories.length) {
      selected.push(exercise);
      usedCategories.add(exercise.category);
    }
  }

  while (selected.length < count) {
    const remaining = shuffledPool.filter(e => !selected.includes(e));
    if (remaining.length === 0) break;
    selected.push(remaining[0]);
  }

  return selected;
}

function getExercisePoolForStat(stat: TrainingStat): Exercise[] {
  switch (stat) {
    case "strength": return STR_EXERCISES;
    case "agility": return AGI_EXERCISES;
    case "sense": return SEN_EXERCISES;
    case "vitality": return VIT_EXERCISES;
  }
}

function getRestLabel(stat: TrainingStat): string {
  switch (stat) {
    case "strength": return "Shake it out & breathe";
    case "agility": return "Deep breathing & relax";
    case "sense": return "Settle into stillness";
    case "vitality": return "Pause & breathe";
  }
}

export function getPhaseScaling(phase: number): { durationMultiplier: number; holdBonus: number } {
  const clampedPhase = Math.max(1, Math.min(5, phase));
  return {
    durationMultiplier: 1 + (clampedPhase - 1) * 0.05,
    holdBonus: Math.floor((clampedPhase - 1) * 5),
  };
}

export interface DynamicSessionConfig {
  workSeconds: number;
  restSeconds: number;
  cycles: number;
  exercisesPerCycle: number;
  duration: number;
}

export function generateSession(stat: TrainingStat, level: TrainingLevel, phase?: number): TrainingSession {
  const config = SESSION_CONFIGS[stat][level];
  const pool = getExercisePoolForStat(stat);
  const exercises = selectExercises(pool, config.exercisesPerCycle);
  const scaling = getPhaseScaling(phase || 1);

  const workSec = config.workSeconds + (level === "advanced" ? scaling.holdBonus : 0);
  const restSec = config.restSeconds;

  const steps: IntervalStep[] = [];

  for (let cycle = 0; cycle < config.cycles; cycle++) {
    const cycleExercises = cycle === 0 ? exercises : shuffleArray([...exercises]);

    for (let i = 0; i < cycleExercises.length; i++) {
      const ex = cycleExercises[i];
      const variant = level === "beginner" ? ex.beginnerVariant : ex.advancedVariant;

      steps.push({
        type: "work",
        durationSeconds: workSec,
        exercise: ex,
        label: ex.name,
        variant,
      });

      const isLastInSession = cycle === config.cycles - 1 && i === cycleExercises.length - 1;
      if (!isLastInSession) {
        steps.push({
          type: "rest",
          durationSeconds: restSec,
          exercise: undefined,
          label: "Rest",
          variant: getRestLabel(stat),
        });
      }
    }
  }

  const totalDurationSeconds = steps.reduce((sum, s) => sum + s.durationSeconds, 0);

  return {
    stat,
    level,
    totalDurationSeconds,
    cycles: config.cycles,
    exercisesPerCycle: config.exercisesPerCycle,
    workSeconds: workSec,
    restSeconds: restSec,
    steps,
  };
}

export function generateDynamicSession(stat: TrainingStat, dynamicConfig: DynamicSessionConfig): TrainingSession {
  const pool = getExercisePoolForStat(stat);
  const exercises = selectExercises(pool, dynamicConfig.exercisesPerCycle);
  const useAdvanced = dynamicConfig.workSeconds >= 35;

  const steps: IntervalStep[] = [];

  for (let cycle = 0; cycle < dynamicConfig.cycles; cycle++) {
    const cycleExercises = cycle === 0 ? exercises : shuffleArray([...exercises]);

    for (let i = 0; i < cycleExercises.length; i++) {
      const ex = cycleExercises[i];
      const variant = useAdvanced ? ex.advancedVariant : ex.beginnerVariant;

      steps.push({
        type: "work",
        durationSeconds: dynamicConfig.workSeconds,
        exercise: ex,
        label: ex.name,
        variant,
      });

      const isLastInSession = cycle === dynamicConfig.cycles - 1 && i === cycleExercises.length - 1;
      if (!isLastInSession) {
        steps.push({
          type: "rest",
          durationSeconds: dynamicConfig.restSeconds,
          exercise: undefined,
          label: "Rest",
          variant: getRestLabel(stat),
        });
      }
    }
  }

  const totalDurationSeconds = steps.reduce((sum, s) => sum + s.durationSeconds, 0);

  return {
    stat,
    level: useAdvanced ? "advanced" : "beginner",
    totalDurationSeconds,
    cycles: dynamicConfig.cycles,
    exercisesPerCycle: dynamicConfig.exercisesPerCycle,
    workSeconds: dynamicConfig.workSeconds,
    restSeconds: dynamicConfig.restSeconds,
    steps,
  };
}

export function getExercisePool(stat: TrainingStat): Exercise[] {
  return getExercisePoolForStat(stat);
}

export function formatIntervalTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getSessionSummary(session: TrainingSession): string {
  const statLabels: Record<TrainingStat, string> = {
    strength: "Strength",
    agility: "Flexibility",
    sense: "Meditation",
    vitality: "Vitality",
  };
  const label = statLabels[session.stat];
  const mins = Math.ceil(session.totalDurationSeconds / 60);
  return `${label} \u2022 ${mins} min \u2022 ${session.cycles} cycle${session.cycles > 1 ? "s" : ""} \u00d7 ${session.exercisesPerCycle} exercises`;
}

export const COMPLETION_MESSAGES: Record<TrainingStat, string[]> = {
  strength: [
    "Foundation built. Power grows.",
    "Muscles activated. Strength rising.",
    "Discipline forged in effort.",
    "Another brick in the wall of power.",
  ],
  agility: [
    "Flow unlocked. Body loosened.",
    "Flexibility improved. Tension released.",
    "Range of motion expanded.",
    "Mobility restored. Move freely.",
  ],
  sense: [
    "Mind sharpened. Clarity gained.",
    "Awareness deepened. Inner calm.",
    "Meditation complete. Focus renewed.",
    "Stillness mastered. Perception heightened.",
  ],
  vitality: [
    "Recovery anchored. Energy restored.",
    "Vitality reinforced. Health first.",
    "Foundations checked. Balance maintained.",
    "Body cared for. Momentum sustained.",
  ],
};

export function getCompletionMessage(stat: TrainingStat): string {
  const msgs = COMPLETION_MESSAGES[stat];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

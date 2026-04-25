/**
 * Workout templates — declarative definitions of structured circuits.
 * A template is a list of exercises (mixed reps + time mode) repeated
 * across N rounds, with a per-week progression rule that scales the
 * targets over time. New exercises can be added by extending
 * `EXERCISE_REGISTRY`; the calorie engine and UI pick them up
 * automatically.
 */

export type ExerciseMode = "reps" | "time";

export interface TemplateExercise {
  /** Stable identifier — used for calorie lookups + UI labels. */
  type: string;
  mode: ExerciseMode;
  /** Reps if mode === "reps", seconds if mode === "time". */
  value: number;
}

export interface WorkoutProgression {
  /** kg → reps added per week to every reps-mode exercise. */
  repsIncrease: number;
  /** Seconds added per week to every time-mode exercise. */
  timeIncrease: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  rounds: number;
  exercises: TemplateExercise[];
  progression: WorkoutProgression;
}

/**
 * Per-exercise calorie metadata. Future exercises only need an entry
 * here — no other code changes required.
 *  - mode: "reps" → kcal per rep
 *  - mode: "time" → MET coefficient (used in the standard
 *      kcal = MET × kg × seconds / 3600 formula)
 */
export interface ExerciseDefinition {
  label: string;
  /** Default mode used in the template builder UI; either is allowed. */
  mode: ExerciseMode;
  /** kcal per rep — only meaningful when mode === "reps". */
  caloriesPerRep?: number;
  /** MET — only meaningful when mode === "time". */
  met?: number;
}

export const EXERCISE_REGISTRY: Record<string, ExerciseDefinition> = {
  // Reps-based
  pushups: { label: "Push-ups", mode: "reps", caloriesPerRep: 0.4 },
  situps:  { label: "Sit-ups",  mode: "reps", caloriesPerRep: 0.3 },
  squats:  { label: "Squats",   mode: "reps", caloriesPerRep: 0.5 },
  // Time-based (MET values per ACSM compendium, rounded)
  jumping_jacks: { label: "Jumping Jacks",  mode: "time", met: 8.0 },
  jog_in_place:  { label: "Jog in Place",   mode: "time", met: 7.0 },
  plank:         { label: "Plank Hold",     mode: "time", met: 3.5 },
};

/** Look up the user-facing label for an exercise type, falling back gracefully. */
export function exerciseLabel(type: string): string {
  return EXERCISE_REGISTRY[type]?.label ?? type;
}

/* ───────────────────────── Calorie math ───────────────────────── */

/**
 * Calories burned by a single exercise within a single round.
 *  - reps mode → caloriesPerRep × reps
 *  - time mode → MET × weightKg × seconds / 3600
 *
 * Returns 0 (and warns once) for unknown types so the system stays
 * resilient when new templates ship before the registry is updated.
 */
export function caloriesForExercise(
  ex: TemplateExercise,
  weightKg: number,
): number {
  const def = EXERCISE_REGISTRY[ex.type];
  if (!def) {
    if (typeof console !== "undefined") {
      console.warn(`[workout] unknown exercise type "${ex.type}" — 0 kcal`);
    }
    return 0;
  }
  if (ex.mode === "reps") {
    const perRep = def.caloriesPerRep ?? 0;
    return Math.max(0, perRep * Math.max(0, ex.value));
  }
  // time mode
  const met = def.met ?? 0;
  if (met <= 0 || weightKg <= 0) return 0;
  return (met * weightKg * Math.max(0, ex.value)) / 3600;
}

/**
 * Calories for a single round (one pass through all exercises) of the
 * given (already progression-adjusted) exercises.
 */
export function caloriesPerRound(
  exercises: TemplateExercise[],
  weightKg: number,
): number {
  let total = 0;
  for (const ex of exercises) total += caloriesForExercise(ex, weightKg);
  return total;
}

/* ───────────────────────── Progression ───────────────────────── */

/**
 * Apply weekly progression to a template's exercises. `weeksElapsed`
 * starts at 0 (week 1 = no increase). Reps mode adds repsIncrease per
 * week; time mode adds timeIncrease per week.
 */
export function applyProgression(
  template: WorkoutTemplate,
  weeksElapsed: number,
): TemplateExercise[] {
  const w = Math.max(0, Math.floor(weeksElapsed));
  return template.exercises.map((ex) => {
    if (ex.mode === "reps") {
      return { ...ex, value: ex.value + w * template.progression.repsIncrease };
    }
    return { ...ex, value: ex.value + w * template.progression.timeIncrease };
  });
}

/* ───────────────────────── Seed templates ───────────────────────── */

export const SEED_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "foundation_circuit",
    name: "Foundation Circuit",
    description: "Bodyweight base — push, hinge, core. Builds the floor.",
    rounds: 3,
    exercises: [
      { type: "pushups", mode: "reps", value: 8 },
      { type: "squats",  mode: "reps", value: 10 },
      { type: "situps",  mode: "reps", value: 10 },
    ],
    progression: { repsIncrease: 2, timeIncrease: 0 },
  },
  {
    id: "cardio_burn",
    name: "Cardio Burn",
    description: "Steady metabolic spike — jumping jacks → jog → plank.",
    rounds: 3,
    exercises: [
      { type: "jumping_jacks", mode: "time", value: 30 },
      { type: "jog_in_place",  mode: "time", value: 60 },
      { type: "plank",         mode: "time", value: 20 },
    ],
    progression: { repsIncrease: 0, timeIncrease: 5 },
  },
  {
    id: "mixed_strength",
    name: "Mixed Strength",
    description: "Reps + holds — strength, isometrics, and core depth.",
    rounds: 3,
    exercises: [
      { type: "pushups", mode: "reps", value: 5 },
      { type: "plank",   mode: "time", value: 15 },
      { type: "squats",  mode: "reps", value: 8 },
    ],
    progression: { repsIncrease: 1, timeIncrease: 5 },
  },
];

export function getTemplate(id: string): WorkoutTemplate | undefined {
  return SEED_TEMPLATES.find((t) => t.id === id);
}

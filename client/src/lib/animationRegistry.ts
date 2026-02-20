export type AnimationStat = "strength" | "agility" | "sense" | "vitality";
export type RendererType = "svg-silhouette" | "unity-3d" | "sprite-sheet";
export type AnimationDifficulty = "beginner" | "intermediate" | "advanced";

export interface AnimationMeta {
  actionId: string;
  name: string;
  stat: AnimationStat;
  muscleGroup: string;
  difficulty: AnimationDifficulty;
  loopDurationMs: number;
  loopable: boolean;
  rendererType: RendererType;
  tags: string[];
}

export interface AnimationRendererProps {
  meta: AnimationMeta;
  accentColor: string;
  size: number;
}

const ANIMATION_REGISTRY: AnimationMeta[] = [
  { actionId: "str_pushups", name: "Push-ups", stat: "strength", muscleGroup: "chest_triceps_shoulders", difficulty: "beginner", loopDurationMs: 2400, loopable: true, rendererType: "svg-silhouette", tags: ["upper", "push", "compound"] },
  { actionId: "str_squats", name: "Squats", stat: "strength", muscleGroup: "quads_glutes_hamstrings", difficulty: "beginner", loopDurationMs: 2800, loopable: true, rendererType: "svg-silhouette", tags: ["lower", "compound", "functional"] },
  { actionId: "str_plank", name: "Plank Hold", stat: "strength", muscleGroup: "core_shoulders", difficulty: "beginner", loopDurationMs: 3000, loopable: true, rendererType: "svg-silhouette", tags: ["core", "isometric", "stability"] },
  { actionId: "str_lunges", name: "Lunges", stat: "strength", muscleGroup: "quads_glutes_hamstrings", difficulty: "beginner", loopDurationMs: 2600, loopable: true, rendererType: "svg-silhouette", tags: ["lower", "unilateral", "balance"] },
  { actionId: "str_mountain_climbers", name: "Mountain Climbers", stat: "strength", muscleGroup: "core_shoulders_cardio", difficulty: "intermediate", loopDurationMs: 1200, loopable: true, rendererType: "svg-silhouette", tags: ["full", "cardio", "core"] },
  { actionId: "str_tricep_dips", name: "Tricep Dips", stat: "strength", muscleGroup: "triceps_shoulders", difficulty: "intermediate", loopDurationMs: 2400, loopable: true, rendererType: "svg-silhouette", tags: ["upper", "push", "isolation"] },
  { actionId: "str_glute_bridges", name: "Glute Bridges", stat: "strength", muscleGroup: "glutes_hamstrings", difficulty: "beginner", loopDurationMs: 2400, loopable: true, rendererType: "svg-silhouette", tags: ["lower", "posterior", "isolation"] },
  { actionId: "str_superman", name: "Superman Hold", stat: "strength", muscleGroup: "lower_back_glutes", difficulty: "beginner", loopDurationMs: 3000, loopable: true, rendererType: "svg-silhouette", tags: ["core", "posterior", "isometric"] },
  { actionId: "str_burpees", name: "Burpees", stat: "strength", muscleGroup: "full_body", difficulty: "advanced", loopDurationMs: 2800, loopable: true, rendererType: "svg-silhouette", tags: ["full", "cardio", "explosive"] },
  { actionId: "str_wall_sit", name: "Wall Sit", stat: "strength", muscleGroup: "quads_glutes", difficulty: "beginner", loopDurationMs: 2000, loopable: true, rendererType: "svg-silhouette", tags: ["lower", "isometric", "endurance"] },
  { actionId: "str_crunches", name: "Crunches", stat: "strength", muscleGroup: "abs_core", difficulty: "beginner", loopDurationMs: 2200, loopable: true, rendererType: "svg-silhouette", tags: ["core", "isolation", "flexion"] },
  { actionId: "str_jumping_jacks", name: "Jumping Jacks", stat: "strength", muscleGroup: "full_body_cardio", difficulty: "beginner", loopDurationMs: 1200, loopable: true, rendererType: "svg-silhouette", tags: ["full", "cardio", "warmup"] },
  { actionId: "agi_forward_fold", name: "Forward Fold", stat: "agility", muscleGroup: "hamstrings_lower_back", difficulty: "beginner", loopDurationMs: 3000, loopable: true, rendererType: "svg-silhouette", tags: ["hamstrings", "stretch", "flexibility"] },
  { actionId: "agi_cat_cow", name: "Cat-Cow", stat: "agility", muscleGroup: "spine_core", difficulty: "beginner", loopDurationMs: 3200, loopable: true, rendererType: "svg-silhouette", tags: ["spine", "mobility", "breath"] },
  { actionId: "agi_downward_dog", name: "Downward Dog", stat: "agility", muscleGroup: "shoulders_hamstrings_calves", difficulty: "beginner", loopDurationMs: 3000, loopable: true, rendererType: "svg-silhouette", tags: ["full", "yoga", "stretch"] },
  { actionId: "agi_warrior_flow", name: "Warrior Flow", stat: "agility", muscleGroup: "legs_hips_core", difficulty: "intermediate", loopDurationMs: 3500, loopable: true, rendererType: "svg-silhouette", tags: ["full", "yoga", "balance"] },
  { actionId: "agi_cobra_stretch", name: "Cobra Stretch", stat: "agility", muscleGroup: "spine_chest_abs", difficulty: "beginner", loopDurationMs: 3000, loopable: true, rendererType: "svg-silhouette", tags: ["spine", "extension", "yoga"] },
  { actionId: "agi_butterfly", name: "Butterfly Stretch", stat: "agility", muscleGroup: "hips_groin", difficulty: "beginner", loopDurationMs: 3000, loopable: true, rendererType: "svg-silhouette", tags: ["hips", "stretch", "seated"] },
  { actionId: "sen_breath_awareness", name: "Breath Awareness", stat: "sense", muscleGroup: "respiratory_mind", difficulty: "beginner", loopDurationMs: 4000, loopable: true, rendererType: "svg-silhouette", tags: ["breath", "meditation", "focus"] },
  { actionId: "sen_body_scan", name: "Body Scan", stat: "sense", muscleGroup: "nervous_system", difficulty: "beginner", loopDurationMs: 5000, loopable: true, rendererType: "svg-silhouette", tags: ["awareness", "meditation", "relaxation"] },
  { actionId: "sen_visualization", name: "Visualization", stat: "sense", muscleGroup: "mind_focus", difficulty: "intermediate", loopDurationMs: 4000, loopable: true, rendererType: "svg-silhouette", tags: ["visualization", "focus", "meditation"] },
  { actionId: "rest_breathe", name: "Rest & Breathe", stat: "vitality", muscleGroup: "recovery", difficulty: "beginner", loopDurationMs: 4000, loopable: true, rendererType: "svg-silhouette", tags: ["rest", "recovery", "breath"] },
];

const REGISTRY_MAP = new Map<string, AnimationMeta>();
const EXERCISE_TO_ACTION_MAP = new Map<string, string>();

ANIMATION_REGISTRY.forEach(meta => {
  REGISTRY_MAP.set(meta.actionId, meta);
});

const EXERCISE_ID_MAPPINGS: Record<string, string> = {
  pushups: "str_pushups",
  squats: "str_squats",
  plank: "str_plank",
  lunges: "str_lunges",
  mountain_climbers: "str_mountain_climbers",
  tricep_dips: "str_tricep_dips",
  glute_bridges: "str_glute_bridges",
  superman: "str_superman",
  burpees: "str_burpees",
  wall_sit: "str_wall_sit",
  crunches: "str_crunches",
  jumping_jacks: "str_jumping_jacks",
  forward_fold: "agi_forward_fold",
  cat_cow: "agi_cat_cow",
  pigeon_pose: "agi_butterfly",
  downward_dog: "agi_downward_dog",
  seated_twist: "agi_cat_cow",
  quad_stretch: "agi_forward_fold",
  hip_circles: "agi_warrior_flow",
  child_pose: "agi_cobra_stretch",
  cobra_stretch: "agi_cobra_stretch",
  butterfly: "agi_butterfly",
  hamstring_stretch: "agi_forward_fold",
  shoulder_stretch: "agi_downward_dog",
  warrior_flow: "agi_warrior_flow",
  neck_rolls: "agi_cat_cow",
  breath_awareness: "sen_breath_awareness",
  box_breathing: "sen_breath_awareness",
  body_scan: "sen_body_scan",
  emotional_labeling: "sen_body_scan",
  gratitude_focus: "sen_visualization",
  visualization: "sen_visualization",
  mantra_repeat: "sen_breath_awareness",
  sound_awareness: "sen_body_scan",
  thought_observation: "sen_visualization",
  loving_kindness: "sen_visualization",
  hydration_check: "rest_breathe",
  sleep_reflect: "rest_breathe",
  gentle_walk: "rest_breathe",
  deep_breathing: "rest_breathe",
  neck_shoulder_release: "rest_breathe",
  posture_check: "rest_breathe",
  eye_rest: "rest_breathe",
  wrist_ankle_circles: "rest_breathe",
  nutrition_check: "rest_breathe",
  cold_splash: "rest_breathe",
  meal_planning: "rest_breathe",
  stress_check: "rest_breathe",
};

Object.entries(EXERCISE_ID_MAPPINGS).forEach(([exerciseId, actionId]) => {
  EXERCISE_TO_ACTION_MAP.set(exerciseId, actionId);
});

export function getAnimationMeta(actionId: string): AnimationMeta | undefined {
  return REGISTRY_MAP.get(actionId);
}

export function resolveActionId(exerciseId: string): string {
  return EXERCISE_TO_ACTION_MAP.get(exerciseId) || "rest_breathe";
}

export function getAnimationsForStat(stat: AnimationStat): AnimationMeta[] {
  return ANIMATION_REGISTRY.filter(m => m.stat === stat);
}

export function getAllAnimations(): AnimationMeta[] {
  return [...ANIMATION_REGISTRY];
}

export function hasAnimation(exerciseId: string): boolean {
  return EXERCISE_TO_ACTION_MAP.has(exerciseId);
}

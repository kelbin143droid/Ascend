export type LanguageStage = 1 | 2 | 3 | 4;

const STAGE_REPLACEMENTS: Record<string, Record<LanguageStage, string>> = {
  "Quest": { 1: "Step", 2: "Task", 3: "Challenge", 4: "Quest" },
  "quest": { 1: "step", 2: "task", 3: "challenge", 4: "quest" },
  "Quests": { 1: "Steps", 2: "Tasks", 3: "Challenges", 4: "Quests" },
  "quests": { 1: "steps", 2: "tasks", 3: "challenges", 4: "quests" },

  "Mission": { 1: "Goal", 2: "Goal", 3: "Goal", 4: "Mission" },
  "mission": { 1: "goal", 2: "goal", 3: "goal", 4: "mission" },
  "Missions": { 1: "Goals", 2: "Goals", 3: "Goals", 4: "Missions" },
  "missions": { 1: "goals", 2: "goals", 3: "goals", 4: "missions" },

  "Power Growth": { 1: "Practice", 2: "Training", 3: "Growth", 4: "Power Growth" },
  "power growth": { 1: "practice", 2: "training", 3: "growth", 4: "power growth" },

  "Daily Habit": { 1: "Step", 2: "Habit", 3: "Habit", 4: "Daily Habit" },
  "daily habit": { 1: "step", 2: "habit", 3: "habit", 4: "daily habit" },
  "Daily Habits": { 1: "Steps", 2: "Habits", 3: "Habits", 4: "Daily Habits" },
  "daily habits": { 1: "steps", 2: "habits", 3: "habits", 4: "daily habits" },
  "Habit": { 1: "Step", 2: "Habit", 3: "Habit", 4: "Habit" },
  "habit": { 1: "step", 2: "habit", 3: "habit", 4: "habit" },
  "Habits": { 1: "Steps", 2: "Habits", 3: "Habits", 4: "Habits" },
  "habits": { 1: "steps", 2: "habits", 3: "habits", 4: "habits" },

  "Hunter Path": { 1: "Routine", 2: "Routine", 3: "Path", 4: "Hunter Path" },
  "hunter path": { 1: "routine", 2: "routine", 3: "path", 4: "hunter path" },

  "Focus Session": { 1: "Moment", 2: "Focus Session", 3: "Focus Session", 4: "Focus Session" },
  "focus session": { 1: "moment", 2: "focus session", 3: "focus session", 4: "focus session" },

  "Momentum": { 1: "Progress", 2: "Consistency", 3: "Momentum", 4: "Momentum" },
  "momentum": { 1: "progress", 2: "consistency", 3: "momentum", 4: "momentum" },
};

const SORTED_KEYS = Object.keys(STAGE_REPLACEMENTS).sort((a, b) => b.length - a.length);

export function applyLanguageStage(text: string, stage: LanguageStage): string {
  if (stage === 4) return text;

  let result = text;
  for (const key of SORTED_KEYS) {
    const replacement = STAGE_REPLACEMENTS[key][stage];
    if (replacement !== key) {
      result = result.split(key).join(replacement);
    }
  }
  return result;
}

export function calculateLanguageStage(
  onboardingDay: number,
  isOnboardingComplete: boolean,
  streak: number,
  totalCompletionDays: number,
): LanguageStage {
  if (!isOnboardingComplete && onboardingDay <= 7) {
    return 1;
  }

  if (totalCompletionDays < 14 || streak < 7) {
    return 2;
  }

  if (totalCompletionDays >= 28 && streak >= 14) {
    return 4;
  }

  return 3;
}

export const STAGE_LABELS: Record<LanguageStage, string> = {
  1: "Onboarding",
  2: "Rhythm",
  3: "Growth",
  4: "Narrative",
};

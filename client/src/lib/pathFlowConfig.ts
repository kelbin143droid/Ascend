/**
 * pathFlowConfig.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines what each starting path (Foundation / Build / Evolve / Ascend)
 * shows on the home screen and how it constrains the daily flow intensity.
 *
 * This is the single source of truth for per-path composition.  Day6Home reads
 * it to build the session card list and to filter the activity array that the
 * DailyFlowEngine runs.  dailyRecommendationEngine reads it to cap the variant.
 */

import type { WorkoutLevel } from "./workoutPlans";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PathSessionCard {
  id: string;
  label: string;
  sublabel: string;
  icon: "Brain" | "Wind" | "Dumbbell";
  color: string;
  stat: string;
}

export interface PathFlowConfig {
  level: WorkoutLevel;
  /** Short all-caps label shown as a badge on the home screen. */
  displayLabel: string;
  /** One-line description shown next to the badge. */
  tagline: string;
  /** Accent color for the badge. */
  primaryColor: string;
  /**
   * Highest flow variant this path may ever recommend.
   * entry → "light" | beginner → "full" | intermediate/advanced → "push"
   */
  maxFlowVariant: "light" | "full" | "push";
  /**
   * Whether the Physical Circuit is part of this path's daily flow.
   * When false the strength activity is stripped from the activity list
   * and no strength session card is shown.
   */
  includesStrength: boolean;
  /** Session cards rendered in the "Today's Sessions" panel. */
  sessionCards: PathSessionCard[];
}

// ── Configs ───────────────────────────────────────────────────────────────────

export const PATH_FLOW_CONFIGS: Record<WorkoutLevel, PathFlowConfig> = {
  entry: {
    level: "entry",
    displayLabel: "FOUNDATION PATH",
    tagline: "Low friction · early wins · consistency first",
    primaryColor: "#22c55e",
    maxFlowVariant: "light",
    includesStrength: false,
    sessionCards: [
      {
        id: "phase1_meditation",
        label: "Calm Breathing",
        sublabel: "4-4-6 rhythm · 2 min · grounds the nervous system",
        icon: "Brain",
        color: "#3b82f6",
        stat: "Mana",
      },
      {
        id: "phase1_agility",
        label: "Light Movement",
        sublabel: "Gentle stretches · no gym circuit · 3 min",
        icon: "Wind",
        color: "#22c55e",
        stat: "Agility",
      },
    ],
  },

  beginner: {
    level: "beginner",
    displayLabel: "BUILD PATH",
    tagline: "Foundational exercises · guided form",
    primaryColor: "#3b82f6",
    maxFlowVariant: "full",
    includesStrength: true,
    sessionCards: [
      {
        id: "phase1_meditation",
        label: "Calm Breathing",
        sublabel: "4-4-6 rhythm · 2 min",
        icon: "Brain",
        color: "#3b82f6",
        stat: "Mana",
      },
      {
        id: "phase1_agility",
        label: "Agility Flow",
        sublabel: "Shoulder rolls · stretches · 3 min",
        icon: "Wind",
        color: "#22c55e",
        stat: "Agility",
      },
      {
        id: "phase1_strength",
        label: "Build Workout",
        sublabel: "Wall push-ups · Assisted squats · Plank",
        icon: "Dumbbell",
        color: "#3b82f6",
        stat: "Strength",
      },
    ],
  },

  intermediate: {
    level: "intermediate",
    displayLabel: "EVOLVE PATH",
    tagline: "Compound movements · increasing volume",
    primaryColor: "#f59e0b",
    maxFlowVariant: "full",
    includesStrength: true,
    sessionCards: [
      {
        id: "phase1_meditation",
        label: "Calm Breathing",
        sublabel: "4-4-6 rhythm · 2 min",
        icon: "Brain",
        color: "#3b82f6",
        stat: "Mana",
      },
      {
        id: "phase1_agility",
        label: "Agility Flow",
        sublabel: "Stretch circuit · 4 min",
        icon: "Wind",
        color: "#22c55e",
        stat: "Agility",
      },
      {
        id: "phase1_strength",
        label: "Evolve Workout",
        sublabel: "Push-ups · Split squats · Pike push-ups · Plank",
        icon: "Dumbbell",
        color: "#f59e0b",
        stat: "Strength",
      },
    ],
  },

  advanced: {
    level: "advanced",
    displayLabel: "ASCEND PATH",
    tagline: "High-intensity resistance · full commitment",
    primaryColor: "#ef4444",
    maxFlowVariant: "push",
    includesStrength: true,
    sessionCards: [
      {
        id: "phase1_meditation",
        label: "Calm Breathing",
        sublabel: "Adaptive rhythm · 2-3 min",
        icon: "Brain",
        color: "#3b82f6",
        stat: "Mana",
      },
      {
        id: "phase1_agility",
        label: "Agility Flow",
        sublabel: "Stretch circuit · 5 min",
        icon: "Wind",
        color: "#22c55e",
        stat: "Agility",
      },
      {
        id: "phase1_strength",
        label: "Ascend Workout",
        sublabel: "Weighted push-ups · Pull-ups · Squats · Plank",
        icon: "Dumbbell",
        color: "#ef4444",
        stat: "Strength",
      },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPathFlowConfig(level: WorkoutLevel): PathFlowConfig {
  return PATH_FLOW_CONFIGS[level] ?? PATH_FLOW_CONFIGS.entry;
}

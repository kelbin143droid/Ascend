/**
 * pathFlowConfig.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines what each starting path (Foundation / Build / Evolve / Ascend)
 * shows on the home screen and how it constrains the daily flow intensity.
 *
 * Single source of truth for per-path composition.
 * - Day6Home reads sessionCards to build the "Today's Sessions" panel.
 * - dailyFlowBuilder reads includesStrength to assemble the activity list.
 * - dailyRecommendationEngine reads maxFlowVariant to cap intensity.
 */

import type { WorkoutLevel } from "./workoutPlans";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PathSessionCard {
  id: string;
  label: string;
  sublabel: string;
  icon: "Brain" | "Wind" | "Dumbbell" | "Sparkles";
  color: string;
  stat: string;
  /** If set, clicking the card navigates here instead of /guided-session/:id */
  route?: string;
  /** When true the card is shown with a softer style and "(optional)" hint */
  optional?: boolean;
  /**
   * When true the card is a navigation shortcut, NOT part of the guided Daily
   * Flow sequence.  Rendered in a separate "Also today" section below the flow
   * steps so there is no ambiguity about what the flow actually contains.
   */
  isQuickLink?: boolean;
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
   * Whether the Physical Circuit activity is part of this path's daily flow.
   * When false the strength step is omitted from the DailyFlowEngine list.
   */
  includesStrength: boolean;
  /** Session cards rendered in the "Today's Sessions" panel. */
  sessionCards: PathSessionCard[];
}

// ── Configs ───────────────────────────────────────────────────────────────────

export const PATH_FLOW_CONFIGS: Record<WorkoutLevel, PathFlowConfig> = {
  /**
   * Foundation — rebuild consistency. Low friction, zero gym circuit.
   * maxFlowVariant: light (never sent into a full or push day)
   */
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
        sublabel: "Gentle stretches only · no gym circuit · 3 min",
        icon: "Wind",
        color: "#22c55e",
        stat: "Agility",
      },
      {
        id: "habit_check",
        label: "Daily Habit Check",
        sublabel: "Log one small win or avoided trigger",
        icon: "Sparkles",
        color: "#a855f7",
        stat: "Habits",
        route: "/habits",
        isQuickLink: true,
      },
    ],
  },

  /**
   * Build — foundational exercises with guided form.
   * maxFlowVariant: full (never pushed into high-intensity days)
   */
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
        sublabel: "Shoulder rolls · arm circles · stretches · 3 min",
        icon: "Wind",
        color: "#22c55e",
        stat: "Agility",
      },
      {
        id: "phase1_strength",
        label: "Build Workout",
        sublabel: "Wall push-ups · Assisted squats · Glute bridges · Plank",
        icon: "Dumbbell",
        color: "#3b82f6",
        stat: "Strength",
      },
    ],
  },

  /**
   * Evolve — compound movements, increasing volume.
   * maxFlowVariant: push (can be sent into high-intensity days when ready)
   */
  intermediate: {
    level: "intermediate",
    displayLabel: "EVOLVE PATH",
    tagline: "Compound movements · increasing volume",
    primaryColor: "#f59e0b",
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
        sublabel: "Stretch circuit · 4 min",
        icon: "Wind",
        color: "#22c55e",
        stat: "Agility",
      },
      {
        id: "phase1_strength",
        label: "Evolve Workout",
        sublabel: "Push-ups · Bulgarian split squats · Pike push-ups · Plank",
        icon: "Dumbbell",
        color: "#f59e0b",
        stat: "Strength",
      },
    ],
  },

  /**
   * Ascend — high-intensity resistance, full commitment.
   * maxFlowVariant: push (unrestricted; also shows optional push cardio card)
   */
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
        sublabel: "Full stretch circuit · 5 min",
        icon: "Wind",
        color: "#22c55e",
        stat: "Agility",
      },
      {
        id: "phase1_strength",
        label: "Ascend Workout",
        sublabel: "Weighted push-ups · Pull-ups · Squats · Core · Plank",
        icon: "Dumbbell",
        color: "#ef4444",
        stat: "Strength",
      },
      {
        id: "phase1_cardio",
        label: "Push Cardio",
        sublabel: "High-intensity cardio block · optional · configure in Training",
        icon: "Sparkles",
        color: "#f97316",
        stat: "Agility",
        route: "/training",
        optional: true,
      },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPathFlowConfig(level: WorkoutLevel): PathFlowConfig {
  return PATH_FLOW_CONFIGS[level] ?? PATH_FLOW_CONFIGS.entry;
}

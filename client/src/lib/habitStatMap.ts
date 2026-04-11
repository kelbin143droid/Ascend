import type { StatName } from "@shared/schema";

export interface HabitTemplate {
  name: string;
  stat: StatName;
  defaultDurationMinutes: number;
  description: string;
  cue?: string;
  craving?: string;
  response?: string;
  reward?: string;
  tags: string[];
}

export const HABIT_STAT_MAP: Record<StatName, HabitTemplate[]> = {
  strength: [
    {
      name: "Morning Push-Ups",
      stat: "strength",
      defaultDurationMinutes: 5,
      description: "Start the day with upper-body activation",
      cue: "After waking up",
      craving: "Feel physically powerful",
      response: "10-20 push-ups",
      reward: "Strength XP + energized start",
      tags: ["morning", "bodyweight", "quick"],
    },
    {
      name: "Resistance Training",
      stat: "strength",
      defaultDurationMinutes: 30,
      description: "Compound lifts or bodyweight circuits",
      cue: "After work",
      craving: "Build visible strength",
      response: "Full training session",
      reward: "Major STR XP boost",
      tags: ["gym", "bodyweight", "compound"],
    },
    {
      name: "Cold Plunge",
      stat: "strength",
      defaultDurationMinutes: 5,
      description: "Cold water exposure builds mental toughness",
      cue: "Post-workout",
      craving: "Mental hardening",
      response: "Cold shower or plunge",
      reward: "STR XP + resilience boost",
      tags: ["recovery", "discipline"],
    },
    {
      name: "Plank Hold",
      stat: "strength",
      defaultDurationMinutes: 3,
      description: "Core stabilization and isometric hold",
      cue: "Lunch break",
      craving: "Core stability",
      response: "Hold plank for target time",
      reward: "STR XP + posture improvement",
      tags: ["core", "quick", "desk-friendly"],
    },
  ],
  agility: [
    {
      name: "Morning Stretch",
      stat: "agility",
      defaultDurationMinutes: 10,
      description: "Full-body mobility routine on waking",
      cue: "After bed",
      craving: "Move fluidly through the day",
      response: "Guided stretch sequence",
      reward: "AGI XP + reduced stiffness",
      tags: ["morning", "mobility", "recovery"],
    },
    {
      name: "Jump Rope",
      stat: "agility",
      defaultDurationMinutes: 10,
      description: "Coordination and cardiovascular drill",
      cue: "Pre-workout warmup",
      craving: "Feel light and fast",
      response: "Continuous jump rope intervals",
      reward: "AGI XP + cardio bonus",
      tags: ["cardio", "coordination", "quick"],
    },
    {
      name: "Yoga Flow",
      stat: "agility",
      defaultDurationMinutes: 20,
      description: "Flexibility and balance through yoga",
      cue: "Evening wind-down",
      craving: "Body awareness",
      response: "Follow yoga sequence",
      reward: "AGI XP + calm mind",
      tags: ["evening", "flexibility", "mindful"],
    },
    {
      name: "Balance Training",
      stat: "agility",
      defaultDurationMinutes: 5,
      description: "Single-leg stands and stability drills",
      cue: "While brushing teeth",
      craving: "Proprioceptive control",
      response: "Balance drills",
      reward: "AGI XP + coordination",
      tags: ["quick", "desk-friendly", "balance"],
    },
  ],
  sense: [
    {
      name: "Daily Reading",
      stat: "sense",
      defaultDurationMinutes: 20,
      description: "Non-fiction or educational reading each day",
      cue: "After morning coffee",
      craving: "Expand mental models",
      response: "Read focused for 20 min",
      reward: "SNS XP + new knowledge",
      tags: ["morning", "cognitive", "knowledge"],
    },
    {
      name: "Gratitude Note",
      stat: "sense",
      defaultDurationMinutes: 5,
      description: "Write 3 specific things you're grateful for",
      cue: "Before sleep",
      craving: "Emotional clarity",
      response: "Journal 3 gratitudes",
      reward: "SNS XP + positive framing",
      tags: ["evening", "journaling", "mindset"],
    },
    {
      name: "Calm Breathing",
      stat: "sense",
      defaultDurationMinutes: 5,
      description: "4-4-6 breath pattern to activate calm state",
      cue: "Any moment of tension",
      craving: "Mental stillness",
      response: "Inhale 4s, hold 4s, exhale 6s",
      reward: "SNS XP + MP restored",
      tags: ["anywhere", "quick", "mindful"],
    },
    {
      name: "Daily Journaling",
      stat: "sense",
      defaultDurationMinutes: 10,
      description: "Reflect on the day and plan tomorrow",
      cue: "Before bed",
      craving: "Mental clarity",
      response: "Write freely for 10 min",
      reward: "SNS XP + better sleep",
      tags: ["evening", "journaling", "reflection"],
    },
  ],
  vitality: [
    {
      name: "Drink More Water",
      stat: "vitality",
      defaultDurationMinutes: 1,
      description: "Hit your hydration target today",
      cue: "With every meal",
      craving: "Feel energized and clear-headed",
      response: "Drink a full glass",
      reward: "VIT XP + HP recovery",
      tags: ["daily", "health", "quick"],
    },
    {
      name: "Early Bedtime",
      stat: "vitality",
      defaultDurationMinutes: 1,
      description: "Lights out by your target hour",
      cue: "Alarm 30 min before target",
      craving: "Wake up refreshed",
      response: "Shut down screens and rest",
      reward: "VIT XP + HP bonus next day",
      tags: ["evening", "sleep", "recovery"],
    },
    {
      name: "Healthy Meal Prep",
      stat: "vitality",
      defaultDurationMinutes: 30,
      description: "Prepare nutritious meals for the day",
      cue: "Sunday or day before",
      craving: "Fuel for performance",
      response: "Cook and portion meals",
      reward: "VIT XP + sustained energy",
      tags: ["nutrition", "weekly", "prep"],
    },
    {
      name: "Evening Walk",
      stat: "vitality",
      defaultDurationMinutes: 20,
      description: "Low-intensity movement to aid recovery",
      cue: "After dinner",
      craving: "Digest and decompress",
      response: "Walk 15-20 min",
      reward: "VIT XP + HP restoration",
      tags: ["evening", "recovery", "cardio"],
    },
  ],
};

export const STAT_LABELS: Record<StatName, string> = {
  strength: "Strength",
  agility: "Agility",
  sense: "Sense",
  vitality: "Vitality",
};

export const STAT_ABBREV: Record<StatName, string> = {
  strength: "STR",
  agility: "AGI",
  sense: "SNS",
  vitality: "VIT",
};

export const STAT_EMOJIS: Record<StatName, string> = {
  strength: "💪",
  agility: "⚡",
  sense: "🧘",
  vitality: "❤️",
};

export const STAT_COLORS: Record<StatName, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

export const STAT_DESCRIPTIONS: Record<StatName, string> = {
  strength: "Physical power, discipline, and endurance. Built through resistance and challenge.",
  agility: "Speed, coordination, and adaptability. Sharpened through movement and flexibility.",
  sense: "Mental clarity, focus, and perception. Cultivated through reflection and mindfulness.",
  vitality: "Life energy, recovery, and resilience. Sustained through sleep, nutrition, and rest.",
};

export const ALL_STATS: StatName[] = ["strength", "agility", "sense", "vitality"];

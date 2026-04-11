export interface HabitRecommendation {
  name: string;
  durationMinutes: number;
  stat: string;
  xpBonus: number;
  hpEffect: "restore" | "protect" | "none";
  mpEffect: "restore" | "protect" | "none";
  tip: string;
  cue: string;
  craving: string;
  response: string;
  reward: string;
}

export interface BadHabitSolution {
  replacement: string;
  replacementCue: string;
  tip: string;
  category: string;
}

const HABIT_RECS: Record<string, HabitRecommendation[]> = {
  strength: [
    {
      name: "Push-Up Routine",
      durationMinutes: 5,
      stat: "strength",
      xpBonus: 25,
      hpEffect: "restore",
      mpEffect: "none",
      tip: "Builds upper body strength and discipline. Even 5 reps count on tough days.",
      cue: "After waking up",
      craving: "Feel strong and capable",
      response: "Do 10-20 push-ups",
      reward: "Strength XP + HP restore",
    },
    {
      name: "Plank Hold",
      durationMinutes: 3,
      stat: "strength",
      xpBonus: 20,
      hpEffect: "restore",
      mpEffect: "none",
      tip: "Core strength underlies everything. Start at 30 seconds and grow.",
      cue: "Before your morning shower",
      craving: "Core stability and power",
      response: "Hold a plank for 30–60 seconds",
      reward: "Core strength XP",
    },
    {
      name: "Bodyweight Squats",
      durationMinutes: 5,
      stat: "strength",
      xpBonus: 22,
      hpEffect: "restore",
      mpEffect: "none",
      tip: "Leg strength supports your entire body. High-value compound movement.",
      cue: "During a TV or work break",
      craving: "Active energy release",
      response: "Do 20 squats",
      reward: "Leg strength XP + energy boost",
    },
  ],
  sense: [
    {
      name: "Daily Meditation",
      durationMinutes: 5,
      stat: "sense",
      xpBonus: 18,
      hpEffect: "none",
      mpEffect: "restore",
      tip: "5 minutes of stillness rewires your stress response over time.",
      cue: "After morning coffee or tea",
      craving: "Mental clarity and calm",
      response: "Breathe and observe thoughts without judgment",
      reward: "MP restore + Sense XP",
    },
    {
      name: "Gratitude Journal",
      durationMinutes: 3,
      stat: "sense",
      xpBonus: 15,
      hpEffect: "none",
      mpEffect: "restore",
      tip: "Trains your brain to notice the positive. Three entries is enough.",
      cue: "Before sleep",
      craving: "Peace of mind and perspective",
      response: "Write 3 things you're grateful for",
      reward: "Emotional clarity + MP restore",
    },
    {
      name: "Screen-Free Window",
      durationMinutes: 20,
      stat: "sense",
      xpBonus: 20,
      hpEffect: "none",
      mpEffect: "restore",
      tip: "Screen-free windows give your focus system a real reset.",
      cue: "After dinner",
      craving: "Mental rest and presence",
      response: "No screens for 20 minutes — walk, read, or sit",
      reward: "Deep focus reset + MP restore",
    },
  ],
  vitality: [
    {
      name: "Drink 8 Glasses of Water",
      durationMinutes: 1,
      stat: "vitality",
      xpBonus: 12,
      hpEffect: "restore",
      mpEffect: "none",
      tip: "Most people are chronically dehydrated. Hydration is the cheapest performance habit.",
      cue: "Every 2 hours — set a reminder",
      craving: "Energy and cognitive clarity",
      response: "Drink a full glass of water",
      reward: "HP protect + Vitality XP",
    },
    {
      name: "Sleep Before 11pm",
      durationMinutes: 1,
      stat: "vitality",
      xpBonus: 20,
      hpEffect: "restore",
      mpEffect: "protect",
      tip: "Consistent sleep timing is more powerful than sleep duration for recovery.",
      cue: "9:30pm alarm as wind-down signal",
      craving: "Full energy and recovery",
      response: "Begin sleep routine — dim lights, put phone away",
      reward: "HP + MP restore overnight",
    },
    {
      name: "10-Minute Walk",
      durationMinutes: 10,
      stat: "vitality",
      xpBonus: 15,
      hpEffect: "protect",
      mpEffect: "none",
      tip: "Short walks after meals improve blood sugar and metabolism significantly.",
      cue: "After lunch or dinner",
      craving: "Post-meal energy and clarity",
      response: "Walk around the block",
      reward: "HP protect + mood boost",
    },
  ],
  agility: [
    {
      name: "Full-Body Mobility Stretch",
      durationMinutes: 5,
      stat: "agility",
      xpBonus: 16,
      hpEffect: "protect",
      mpEffect: "none",
      tip: "Joint health compounds over years. 5 minutes now prevents injury later.",
      cue: "After waking up",
      craving: "Body feels free and fluid",
      response: "Full-body stretch flow — hips, shoulders, spine",
      reward: "Agility XP + HP protect",
    },
    {
      name: "Sun Salutation",
      durationMinutes: 5,
      stat: "agility",
      xpBonus: 18,
      hpEffect: "protect",
      mpEffect: "restore",
      tip: "12 poses that warm every joint. Works at any level of flexibility.",
      cue: "Morning, before breakfast",
      craving: "Energized and centered start",
      response: "3 rounds of sun salutation",
      reward: "Agility XP + MP restore",
    },
    {
      name: "Thoracic Rotation",
      durationMinutes: 3,
      stat: "agility",
      xpBonus: 14,
      hpEffect: "protect",
      mpEffect: "none",
      tip: "Undoes hours of sitting posture. Best habit for anyone at a desk.",
      cue: "Mid-day screen break",
      craving: "Back pain relief + posture",
      response: "10 thoracic rotations each side",
      reward: "Posture XP + HP protect",
    },
  ],
};

const BAD_HABIT_SOLUTIONS: Array<{ patterns: string[]; solution: BadHabitSolution }> = [
  {
    patterns: ["scroll", "phone", "social media", "tiktok", "instagram", "doom scroll"],
    solution: {
      replacement: "Read 2 pages of a book",
      replacementCue: "When in bed, charge phone across the room before lying down",
      tip: "Distance creates friction. Friction breaks habits. Make the bad habit harder to start.",
      category: "digital",
    },
  },
  {
    patterns: ["procrastinat", "delay", "avoid", "putting off"],
    solution: {
      replacement: "Use a 5-minute focus sprint — start the task anyway",
      replacementCue: "When you feel the urge to delay, set a timer and open the task",
      tip: "Motivation follows action. You can't wait for it to arrive — you have to move first.",
      category: "procrastination",
    },
  },
  {
    patterns: ["junk food", "snack", "chips", "fast food", "sugar", "sweets"],
    solution: {
      replacement: "Eat a piece of fruit or a handful of nuts first",
      replacementCue: "Before reaching for junk, eat your healthier option first — then decide",
      tip: "The first bite is psychological. Change the first bite and the craving often fades.",
      category: "food",
    },
  },
  {
    patterns: ["skip workout", "skip gym", "skip exercise", "miss workout"],
    solution: {
      replacement: "Do a 2-minute micro workout — just put on your clothes",
      replacementCue: "When you think 'I'll skip it', just put on your workout clothes",
      tip: "Starting is the only barrier. Once dressed, you almost always follow through.",
      category: "general",
    },
  },
  {
    patterns: ["smoking", "cigarette", "vaping", "nicotine"],
    solution: {
      replacement: "Take 5 deep breaths and drink a full glass of water",
      replacementCue: "When craving hits, hold breath for 4 seconds then exhale slowly",
      tip: "A craving lasts 3–5 minutes. Breathwork rides it out and satisfies the same urge.",
      category: "substance",
    },
  },
  {
    patterns: ["alcohol", "drinking", "beer", "wine"],
    solution: {
      replacement: "Sparkling water with lime — replicate the ritual",
      replacementCue: "At 'drinking time', pour sparkling water in a glass with lime",
      tip: "The ritual is often as powerful as the substance. Recreate the ceremony.",
      category: "substance",
    },
  },
  {
    patterns: ["oversleep", "sleep too much", "snooze", "alarm"],
    solution: {
      replacement: "Alarm across the room + immediate light exposure",
      replacementCue: "When alarm rings, count 5-4-3-2-1 and physically get up",
      tip: "The 5-second rule: count down and move before your brain argues.",
      category: "sleep",
    },
  },
  {
    patterns: ["negative self-talk", "self-critical", "beating myself", "harsh inner"],
    solution: {
      replacement: "Say one factual, neutral statement about yourself",
      replacementCue: "When a harsh thought arises, pause and restate it neutrally",
      tip: "You can't fight negative thoughts — replace them with neutral ones first.",
      category: "social",
    },
  },
];

export const aiCoachService = {
  getRecommendations(stat: string): HabitRecommendation[] {
    return HABIT_RECS[stat] ?? HABIT_RECS.strength;
  },

  analyzeBadHabit(name: string, category?: string): BadHabitSolution {
    const key = name.toLowerCase().trim();
    for (const { patterns, solution } of BAD_HABIT_SOLUTIONS) {
      if (patterns.some((p) => key.includes(p) || p.includes(key.slice(0, 6)))) {
        return solution;
      }
    }
    const catFallbacks: Record<string, BadHabitSolution> = {
      digital: {
        replacement: "Take a 10-minute offline break instead",
        replacementCue: "Before opening the app, set a 10-minute timer for something offline",
        tip: "Every offline moment is a win against the algorithm.",
        category: "digital",
      },
      substance: {
        replacement: "Breathe deeply and drink water",
        replacementCue: "When the urge hits, drink a full glass of water first",
        tip: "Hydration changes your body chemistry and weakens cravings.",
        category: "substance",
      },
      food: {
        replacement: "Eat something nutritious first",
        replacementCue: "Before reaching for the bad option, eat the replacement first",
        tip: "You can't white-knuckle cravings — redirect them.",
        category: "food",
      },
      procrastination: {
        replacement: "Work on it for just 2 minutes",
        replacementCue: "When feeling avoidance, open the task and set a 2-minute timer",
        tip: "Motivation follows action. Not the other way around.",
        category: "procrastination",
      },
      sleep: {
        replacement: "Begin a wind-down routine 30 min before target sleep time",
        replacementCue: "At your trigger time, dim lights and put phone away",
        tip: "Your body needs signals that sleep is coming.",
        category: "sleep",
      },
      social: {
        replacement: "Pause and choose your response consciously",
        replacementCue: "When the pattern arises, take one full breath before reacting",
        tip: "Awareness of the trigger is the first step to breaking the loop.",
        category: "social",
      },
    };
    if (category && catFallbacks[category]) return catFallbacks[category];
    return {
      replacement: "Replace with a small, positive action",
      replacementCue: "When the urge hits, pause 10 seconds and choose your replacement",
      tip: "Awareness of the trigger is the first step. You're already ahead.",
      category: category ?? "general",
    };
  },
};

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
      name: "Daily Walk",
      durationMinutes: 20,
      stat: "strength",
      xpBonus: 25,
      hpEffect: "restore",
      mpEffect: "none",
      tip: "A 20-minute walk daily improves mood, energy, and cardiovascular health. Simple and powerful.",
      cue: "After lunch or dinner",
      craving: "Fresh air and movement",
      response: "Step outside and walk for 20 minutes",
      reward: "HP restore + Strength XP",
    },
    {
      name: "No Junk Food Today",
      durationMinutes: 5,
      stat: "strength",
      xpBonus: 22,
      hpEffect: "protect",
      mpEffect: "none",
      tip: "One clean eating day builds discipline. You don't need a perfect diet — just a better one.",
      cue: "When you feel hungry or a craving hits",
      craving: "Self-control and health",
      response: "Choose a whole food option instead of processed food",
      reward: "Discipline XP + HP protect",
    },
    {
      name: "Morning Push-Ups",
      durationMinutes: 5,
      stat: "strength",
      xpBonus: 20,
      hpEffect: "restore",
      mpEffect: "none",
      tip: "10 push-ups after waking up signals your body it's time to be strong. Even 5 reps count.",
      cue: "Right after getting out of bed",
      craving: "Feel strong to start the day",
      response: "Do 10-20 push-ups",
      reward: "Strength XP + energized start",
    },
  ],
  sense: [
    {
      name: "Daily Reading",
      durationMinutes: 15,
      stat: "sense",
      xpBonus: 20,
      hpEffect: "none",
      mpEffect: "restore",
      tip: "Reading 10-15 pages a day grows your knowledge and expands how you see the world.",
      cue: "Before bed or during lunch",
      craving: "Mental stimulation and growth",
      response: "Read 10 pages of a book",
      reward: "Sense XP + MP restore",
    },
    {
      name: "Think Positively",
      durationMinutes: 5,
      stat: "sense",
      xpBonus: 15,
      hpEffect: "none",
      mpEffect: "restore",
      tip: "Catch one negative thought today and reframe it. Your mindset is a muscle you can train.",
      cue: "When a negative thought comes up",
      craving: "Peace of mind and resilience",
      response: "Write or say a positive reframe out loud",
      reward: "Clarity + MP restore",
    },
    {
      name: "Gratitude Note",
      durationMinutes: 3,
      stat: "sense",
      xpBonus: 18,
      hpEffect: "none",
      mpEffect: "restore",
      tip: "Writing 3 things you are grateful for shifts your brain toward abundance. Takes under 3 minutes.",
      cue: "Before sleep",
      craving: "Peace and perspective at day's end",
      response: "Write 3 things you are grateful for",
      reward: "Emotional clarity + MP restore",
    },
  ],
  vitality: [
    {
      name: "Drink More Water",
      durationMinutes: 5,
      stat: "vitality",
      xpBonus: 18,
      hpEffect: "restore",
      mpEffect: "none",
      tip: "Most people are mildly dehydrated without knowing it. 8 glasses a day changes your energy levels.",
      cue: "Every morning when you wake up",
      craving: "Energy and clear-headedness",
      response: "Drink a full glass of water immediately, track 8 total",
      reward: "HP restore + Vitality XP",
    },
    {
      name: "Eat Healthier",
      durationMinutes: 15,
      stat: "vitality",
      xpBonus: 22,
      hpEffect: "restore",
      mpEffect: "none",
      tip: "Add one vegetable or fruit to your next meal. Small upgrades compound into big health changes.",
      cue: "When preparing or ordering food",
      craving: "Feel nourished and light",
      response: "Add a vegetable or choose the healthier option",
      reward: "HP restore + Vitality XP",
    },
    {
      name: "Early Bedtime",
      durationMinutes: 10,
      stat: "vitality",
      xpBonus: 20,
      hpEffect: "restore",
      mpEffect: "restore",
      tip: "Going to bed 30 minutes earlier this week will transform your energy and mood within days.",
      cue: "When the clock hits 9:30 PM",
      craving: "Deep rest and recovery",
      response: "Start your wind-down: dim lights, put down phone",
      reward: "Full HP + MP restore overnight",
    },
  ],
  agility: [
    {
      name: "Cold Shower",
      durationMinutes: 5,
      stat: "agility",
      xpBonus: 22,
      hpEffect: "restore",
      mpEffect: "restore",
      tip: "Even 30 seconds of cold water builds mental toughness and boosts alertness. Start small.",
      cue: "At the end of your regular shower",
      craving: "Mental sharpness and resilience",
      response: "Turn the water cold for the last 30-60 seconds",
      reward: "HP + MP boost + Agility XP",
    },
    {
      name: "Try Something New",
      durationMinutes: 15,
      stat: "agility",
      xpBonus: 20,
      hpEffect: "none",
      mpEffect: "restore",
      tip: "Doing one new thing a day -- a route, a food, a skill -- keeps your mind adaptable and sharp.",
      cue: "During a free moment in your day",
      craving: "Excitement and novelty",
      response: "Do or learn one small thing you have never done before",
      reward: "Agility XP + curiosity boost",
    },
    {
      name: "Morning Stretch",
      durationMinutes: 10,
      stat: "agility",
      xpBonus: 18,
      hpEffect: "restore",
      mpEffect: "none",
      tip: "5-10 minutes of stretching after waking up unlocks your body and eases the whole day.",
      cue: "Right after getting out of bed",
      craving: "Loose body and energized feeling",
      response: "Stretch your neck, shoulders, hips, and legs",
      reward: "HP restore + Agility XP",
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
      tip: "A craving lasts 3-5 minutes. Breathwork rides it out and satisfies the same urge.",
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

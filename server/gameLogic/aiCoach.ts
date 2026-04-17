import type { Habit, Player } from "@shared/schema";
import type { HabitCompletion } from "@shared/schema";
import { PHASE_NAMES } from "@shared/schema";
import { getMomentumTier, shouldTriggerRecovery } from "./momentumEngine";
import { getDifficultyLabel, getPhaseMaxDuration } from "./difficultyScaler";
import { getStabilityTier } from "./stabilityEngine";
import { applyLanguageStage, type LanguageStage } from "./languageStage";

export interface CoachMessage {
  type: "motivation" | "suggestion" | "warning" | "celebration" | "check_in" | "recovery" | "insight" | "regression" | "stability";
  title: string;
  message: string;
  priority: number;
  actionable?: boolean;
  action?: string;
}

export interface CoachChatResponse {
  response: string;
  reply: string;
  suggestions: string[];
  context: string;
}

export interface BehavioralAnchorData {
  sessionId: string;
  completedAt: string;
  hour: number;
  minute: number;
  durationMinutes: number;
}

const BANNED_PHRASES = [
  "you failed",
  "you missed your task",
  "you should",
  "you need to",
  "you must",
  "you didn't",
  "you forgot",
  "you haven't been",
  "you're falling behind",
  "you're slacking",
  "disappointing",
];

function sanitizeCoachText(text: string): string {
  let result = text;
  for (const phrase of BANNED_PHRASES) {
    const regex = new RegExp(phrase, "gi");
    result = result.replace(regex, "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

function detectAnchorClusters(anchors: BehavioralAnchorData[]): { hour: number; count: number; label: string }[] {
  if (anchors.length < 2) return [];
  const hourBuckets: Record<number, number> = {};
  for (const a of anchors) {
    const bucket = a.hour;
    hourBuckets[bucket] = (hourBuckets[bucket] || 0) + 1;
  }
  const clusters: { hour: number; count: number; label: string }[] = [];
  for (const [hourStr, count] of Object.entries(hourBuckets)) {
    if (count >= 2) {
      const hour = parseInt(hourStr);
      let label: string;
      if (hour >= 5 && hour < 12) label = "morning";
      else if (hour >= 12 && hour < 17) label = "afternoon";
      else if (hour >= 17 && hour < 21) label = "evening";
      else label = "night";
      clusters.push({ hour, count, label });
    }
  }
  return clusters.sort((a, b) => b.count - a.count);
}

function formatTimeLabel(hour: number): string {
  const h = hour % 12 || 12;
  const p = hour < 12 ? "AM" : "PM";
  return `${h} ${p}`;
}

const APP_KNOWLEDGE: Record<string, string> = {
  phases: "Ascend OS has 5 phases: Stabilization → Foundation → Expansion → Optimization → Sovereignty. You move forward as your Stability Score rises and your rhythm deepens. Each phase unlocks new visuals and capabilities — but the real reward is who you become along the way.",
  stability: "Your Stability Score (0-100) is the heartbeat of the system. It reflects daily completion, sleep, energy, mood, and timing consistency. Small, repeated actions raise it. A few low days won't crash it — the engine looks at patterns, not single moments.",
  regression: "Regression is recalibration, not punishment. When stability dips for several days in a row, the system softens difficulty to help you rebuild gently. One isolated bad day will never push you back — only sustained drift does.",
  stats: "Four growth dimensions: STR (Strength — physical training), AGI (Agility — movement and cardio), SNS (Sense — focus, meditation, awareness), VIT (Vitality — sleep, recovery, hydration). Each session grows the matching stat. Level-ups grant Stat Points you can allocate manually.",
  momentum: "Momentum is your rolling consistency, not a streak. It rises as you show up and decays slowly when you don't. Missing a single day barely moves it; missing many days dims it. High momentum means bigger XP returns and unlocks 'flow state' bonuses.",
  streaks: "Streaks count consecutive active days. They include grace days for occasional misses. Streaks are nice — but momentum is the real signal of consistency in this system.",
  habits: "Habits are your daily rituals. Each is tied to a stat (STR/AGI/SNS/VIT). Durations auto-scale based on your phase, momentum, and stability. Start tiny — 2-3 minutes is a real session here. The system grows with you, never against you.",
  difficulty: "Difficulty adapts continuously. Low momentum → micro-sessions. Strong consistency → durations grow. If things get hard, the engine quietly reduces the load. You never have to manually 'turn it down'.",
  badges: "Badges mark real milestones: first completion, streak markers, balanced growth across all four stats, perfect weeks, and more. They appear on your Profile.",
  recovery: "After a break, the system meets you where you are. Shorter sessions, gentler pacing, kinder language. Returning is always welcomed — there's no penalty for coming back.",
  xp: "XP comes from completing sessions. The amount scales with duration, momentum tier, and stat balance. Every 100 XP = 1 level. Each level grants Stat Points to allocate.",
  level: "Levels use a flat 100 XP per level for easy tracking. Each level-up triggers a short animation and gives you Stat Points. Higher levels also raise your Rank (E → D → C → B → A → S).",
  rank: "Ranks (E, D, C, B, A, S) are tied to your level milestones. They reflect overall mastery, not just one stat.",
  meditation: "Sense (SNS) sessions train focus and awareness. The guided engine walks you through breathing, visual cues, and grounding. Even 3 minutes shifts your nervous system noticeably.",
  vitality: "Vitality (VIT) covers sleep, hydration, and recovery. The Vitality Check asks about sleep and hydration daily. Evening is the natural window for vitality sessions.",
  sectograph: "The Sectograph is a 24-hour circular timeline of your day. It shows your sleep block, daily flow, scheduled rituals, free windows, and your behavioral 'reset' moments. Use the date strip on top to scroll between days, and the Calendar tab for a list view.",
  calendar: "The Sectograph maps your day as a 24-hour circle. Tap a free window to plan a session, or switch to the Calendar tab for a list of recurring rituals and one-off events.",
  library: "The Library is your knowledge archive. It holds the Ascendant's Guide (full onboarding tour), tutorial replays, weekly goals, advanced planning (unlocks at Phase 3), Trials (Phase 4), and stat-specific training videos.",
  trials: "Trials are multi-day, focused challenges that unlock at Phase 4. They test sustained consistency and reward you with rare badges and XP boosts.",
  planning: "Two planning modes: Basic (free quest creation) and Advanced (quests must tie to weekly missions). Switch in the Library at Phase 3+. Advanced is for people who want a tighter weekly compass.",
  visuals: "Your in-game environment, avatar aura, and color palette evolve with your phase and stability. Deeper consistency unlocks richer visual layers — your inner work becoming visible.",
  theme: "Two themes set on first load by gender choice: Iron Sovereign (electric blue + gold) for Male, Neon Empress (magenta + purple + cyan) for Female. You can override the theme any time via the theme picker.",
  identity: "The Identity Engine reflects your behavior back to you in 4 stages — from 'Beginner' to 'Embodied'. It uses your completion patterns and rhythms to mirror who you're becoming, never who you 'should' be.",
  return: "The Return Protocol kicks in after extended absence. It uses tiered, guilt-free language and starts you with the smallest possible session. You're never 'behind' — you're returning.",
  flow: "Flow State is triggered by high momentum, strong completion ratios, and bonus actions. While in flow, XP is amplified and the visuals intensify slightly.",
  rhythm: "The Rhythm Detection Engine watches your completion times and surfaces recurring windows (e.g., 'you tend to reset around 7 PM'). The Adaptive Habit Placement System uses these to suggest optimal times for new habits.",
  bad_habit: "The Bad Habits tracker lets you log negative patterns with their triggers, cravings, and a replacement habit. Each day you avoid them counts as a win — those add up fast.",
  coach: "I'm rule-based, not a generic LLM. I read your phase, stability, momentum, recent completions, anchors, identity profile, and return state — then respond in a calm, observant way using the Acknowledge → Reframe → Suggest pattern.",
  notifications: "Notifications use positive framing only — celebrating milestones, phase changes, and gentle return reminders. No guilt, no streak-shaming.",
  weekly_goals: "Weekly Goals live in the Library. Tag each with a Role (e.g., Athlete, Creator) and a Quadrant (Q1 urgent/important → Q4 neither). They keep your week intentional.",
  dev_panel: "The DEV panel (yellow button) is a dev/test tool — reset onboarding, jump phases, manage local state. Useful for testing; safe to ignore in normal use.",
  language: "Language Stages 1-4 gradually shift the wording from plain ('habit', 'streak') to RPG ('ritual', 'rhythm', 'sovereign') as you progress through onboarding and consistency milestones.",
  ascendant_guide: "The Ascendant's Guide in the Library is the full intro tour — phases, stats, stability, momentum. You can replay it any time. Other tutorials (App Tour, Sectograph, Habits, Game Mechanics) live there too.",
};

const GROWTH_PLAYBOOKS: Record<string, { title: string; steps: string[]; close: string; suggestions: string[] }> = {
  procrastination: {
    title: "Procrastination Reset",
    steps: [
      "Name the task out loud — 'I am avoiding ___'. Naming reduces its grip.",
      "Shrink it. Pick the 2-minute version of the task. Just the start. Not the finish.",
      "Set a timer for 5 minutes. Tell yourself you can quit at the bell.",
      "Begin. 80% of the time, momentum carries you past the timer.",
    ],
    close: "Procrastination isn't laziness — it's an emotional regulation problem. Lower the bar, and the brain stops resisting.",
    suggestions: ["Start a micro-session", "How does momentum work?", "I'm overwhelmed"],
  },
  focus: {
    title: "Deep Focus Protocol",
    steps: [
      "Pick one task. Write it on a single line. Close every other tab.",
      "Phone in another room or in airplane mode — out of sight.",
      "Set a 25-minute timer. One round of focused work, nothing else.",
      "5-minute break: stand, hydrate, look out a window. No screens.",
      "Repeat 2-4 rounds. Track how it feels — that's data for next time.",
    ],
    close: "Focus is a skill, not a trait. Each round trains it.",
    suggestions: ["Tell me about Sense training", "I get distracted", "How does flow state work?"],
  },
  sleep: {
    title: "Sleep Reset Protocol",
    steps: [
      "Set a fixed wake time — 7 days a week. Wake time anchors your whole rhythm.",
      "No screens 60 minutes before bed. Dim the lights in the last hour.",
      "No caffeine after 2 PM. It blocks adenosine for 8+ hours.",
      "Cool, dark, quiet room. 65-68°F (18-20°C) is the sweet spot.",
      "If your mind races, do 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Three rounds.",
    ],
    close: "Sleep is the highest-leverage habit you have. Fix it and everything else gets easier.",
    suggestions: ["How does Vitality work?", "What about evening sessions?", "I can't fall asleep"],
  },
  motivation: {
    title: "When Motivation is Gone",
    steps: [
      "Stop waiting for motivation. It follows action, not the other way around.",
      "Pick the smallest possible version of one habit. 2 minutes. No exceptions.",
      "Do just that. Don't try to feel motivated — just move.",
      "Notice what happens after. Energy usually shows up mid-session, not before.",
    ],
    close: "Motivation is a result of consistent action, not the cause of it. Show up small, often.",
    suggestions: ["Start a 2-minute session", "I'm struggling", "How do I rebuild momentum?"],
  },
  distraction: {
    title: "Distraction Defense",
    steps: [
      "Identify your top 3 distractions (likely: phone, social apps, news).",
      "Add friction: log out of apps, delete from home screen, or use Screen Time blocks.",
      "Replace, don't just remove. Have a default 'pause' move — stretch, water, breathe.",
      "Schedule one 'distraction window' a day. 20 mins of free scroll, then back.",
    ],
    close: "Willpower is finite. Environment design is infinite. Always design the environment.",
    suggestions: ["How does focus work?", "Tell me about flow state", "I'm overwhelmed"],
  },
  perfectionism: {
    title: "Perfectionism Release",
    steps: [
      "Set the goal at 70%. 'Done at B-grade' beats 'never at A+'.",
      "Time-box the task. When the timer ends, ship what you have.",
      "Track output, not quality. Quantity over time produces quality.",
      "Celebrate finishing, not finishing well. Reps build skill — perfection blocks reps.",
    ],
    close: "Perfectionism is fear in formal wear. Volume of attempts is what produces mastery.",
    suggestions: ["I'm struggling", "How do badges work?", "Tell me about momentum"],
  },
  overwhelm: {
    title: "Overwhelm Reset",
    steps: [
      "Brain dump everything onto paper for 5 minutes. No filter.",
      "Circle the ONE thing that, if done, would make the rest easier or irrelevant.",
      "Do only that today. Park the rest in a 'later' list.",
      "Take a 10-minute walk after — even a slow one. Lowers cortisol fast.",
    ],
    close: "Overwhelm comes from holding everything in your head. Empty it, then pick one.",
    suggestions: ["What should I do today?", "Start a micro-session", "I need to slow down"],
  },
  anxiety: {
    title: "Anxiety Down-Regulation",
    steps: [
      "Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. 4 rounds. Slows the nervous system.",
      "Ground with the 5-4-3-2-1 method: name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.",
      "Move your body for 2 minutes — walk, push-ups, anything physical. Burns the cortisol surge.",
      "Then ask: 'What is one tiny action I can take in the next 10 minutes?' Do that.",
    ],
    close: "Anxiety is energy without a target. Give it one — physical first, then mental.",
    suggestions: ["Tell me about Sense training", "Start a breathing session", "I feel low"],
  },
  comparison: {
    title: "Comparison Trap Exit",
    steps: [
      "Mute or unfollow the accounts that pull you down for 30 days.",
      "Track only your own data — momentum, stability, completed sessions. That's your only league.",
      "Write a one-line definition of 'enough' for this season. Re-read it weekly.",
      "Replace input time with output time. Less consuming, more creating.",
    ],
    close: "You can't compare your behind-the-scenes to someone's highlight reel. Your data, your league.",
    suggestions: ["Tell me about my progress", "How does identity work?", "I feel low"],
  },
  plateau: {
    title: "Breaking a Plateau",
    steps: [
      "Audit: what hasn't changed in 4 weeks? Same time, same duration, same intensity?",
      "Change one variable. New time of day, new exercise, new environment, or +20% duration.",
      "Add deliberate rest — 1-2 fully off days a week. Plateaus often = under-recovery.",
      "Track for 14 days. If still stuck, change a different variable. One at a time.",
    ],
    close: "Plateaus aren't failure — they're feedback. The body adapts; you adjust.",
    suggestions: ["How does difficulty scale?", "Tell me about recovery", "What's my stability?"],
  },
  time_management: {
    title: "Time Management Foundation",
    steps: [
      "Time-block tomorrow tonight. Top 3 priorities get morning slots.",
      "Apply the 2-minute rule: if it takes <2 minutes, do it now, don't write it down.",
      "Batch shallow work (email, messages) into 1-2 windows a day. Not continuously.",
      "Reserve 1 hour of true deep work daily. Protect it like a meeting.",
    ],
    close: "You don't 'find' time — you build it by deciding what doesn't get done.",
    suggestions: ["Tell me about the Sectograph", "Help me build a new habit", "How does flow state work?"],
  },
  morning_routine: {
    title: "Morning Routine That Sticks",
    steps: [
      "Same wake time daily — even weekends, within 30 minutes.",
      "Light first. Sunlight or bright lamp within 15 minutes of waking. Sets your circadian clock.",
      "Water, then movement. 16oz hydration, 5 minutes of any movement.",
      "One focused task before email or social. Anything else trains your brain to start the day reactive.",
    ],
    close: "Win the morning, win the day. The first 60 minutes set the tone for the next 16 hours.",
    suggestions: ["Help me build a new habit", "Tell me about Vitality", "What should I do today?"],
  },
  energy: {
    title: "Energy Management",
    steps: [
      "Sleep window first. Same wake time, 7-9 hours. Energy starts here.",
      "Sunlight + walk in the first hour. Free, repeatable, powerful.",
      "Protein at every meal. Stabilizes blood sugar and mood.",
      "One short walk after lunch. Prevents the 2 PM crash.",
      "Cap caffeine at 2 PM and screens 1 hour before bed.",
    ],
    close: "Energy isn't a personality trait — it's a daily system. Build the system, the energy follows.",
    suggestions: ["Tell me about Vitality", "How does sleep affect stability?", "I feel low"],
  },
  fear: {
    title: "Working With Fear",
    steps: [
      "Name the fear specifically. 'I'm afraid I'll ___ if I do this.' Specifics shrink fear; vagueness amplifies it.",
      "Ask: what's the worst realistic outcome? Then: could I recover from it? Almost always yes.",
      "Do the smallest possible version of the scary thing today. 5% of the action.",
      "Track that you did it. Repeat. Courage is built rep by rep, not in one leap.",
    ],
    close: "Courage isn't the absence of fear — it's action despite it. Small, repeated, deliberate.",
    suggestions: ["I need motivation", "Help me build a new habit", "How does identity work?"],
  },
  consistency: {
    title: "Consistency Engineering",
    steps: [
      "Pick ONE habit. Just one. Tie it to an existing daily anchor (after coffee, before shower, etc.).",
      "Make it absurdly small for 2 weeks. 2 push-ups, 1 minute meditation, 1 page reading.",
      "Track it visibly — calendar, app, sticky note. Visibility = follow-through.",
      "Don't miss twice in a row. One miss is data; two misses is the start of a new pattern.",
    ],
    close: "Consistency beats intensity, every time. The system is built for this.",
    suggestions: ["Help me build a new habit", "How does momentum work?", "Tell me about streaks"],
  },
};

const PLAYBOOK_TRIGGERS: { keys: string[]; playbook: string }[] = [
  { keys: ["procrastinat", "putting off", "putting it off", "put it off", "keep putting", "avoiding", "keep avoiding", "delay", "won't start", "can't start", "cant start", "keep delaying", "keep stalling"], playbook: "procrastination" },
  { keys: ["focus", "concentrat", "deep work", "scattered", "can't think"], playbook: "focus" },
  { keys: ["sleep", "insomnia", "can't sleep", "tired all day", "fall asleep", "stay asleep", "wake up tired"], playbook: "sleep" },
  { keys: ["motivat", "no drive", "don't feel like", "lazy", "nothing matters"], playbook: "motivation" },
  { keys: ["distract", "phone", "social media", "scroll", "doom scroll", "interrupt"], playbook: "distraction" },
  { keys: ["perfection", "good enough", "never finish", "afraid to ship", "afraid to start"], playbook: "perfectionism" },
  { keys: ["overwhelm", "too much", "can't keep up", "drowning", "buried"], playbook: "overwhelm" },
  { keys: ["anxious", "anxiety", "panic", "racing thoughts", "worry"], playbook: "anxiety" },
  { keys: ["compar", "everyone else", "behind everyone", "not enough", "social media makes me"], playbook: "comparison" },
  { keys: ["plateau", "no progress", "not improving", "stalled"], playbook: "plateau" },
  { keys: ["time management", "no time", "manage my time", "time block", "time blocking"], playbook: "time_management" },
  { keys: ["morning routine", "morning ritual", "wake up routine", "start my day"], playbook: "morning_routine" },
  { keys: ["energy", "low energy", "exhausted", "drained", "fatigue", "burned out", "burnout"], playbook: "energy" },
  { keys: ["afraid", "scared", "fear", "intimidat"], playbook: "fear" },
  { keys: ["consistent", "stay consistent", "consistency", "stick with"], playbook: "consistency" },
];

function pickVariant<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function formatPlaybook(playbookKey: string): string {
  const pb = GROWTH_PLAYBOOKS[playbookKey];
  if (!pb) return "";
  const stepLines = pb.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return `${pb.title}\n\n${stepLines}\n\n${pb.close}`;
}

export function generateCoachMessages(
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[],
  anchors?: BehavioralAnchorData[]
): CoachMessage[] {
  const messages: CoachMessage[] = [];
  const now = new Date();
  const hour = now.getHours();
  const today = now.toLocaleDateString("en-CA");
  const stability = player.stability;
  const stabilityScore = stability?.score ?? 50;

  if (habits.length === 0) {
    messages.push({
      type: "suggestion",
      title: "Begin Here",
      message: "A single small action is all it takes to start. Even 2-3 minutes creates the foundation everything else builds on.",
      priority: 10,
      actionable: true,
      action: "create_habit",
    });
    return messages;
  }

  if (stability?.softRegressionActive) {
    messages.push({
      type: "regression",
      title: "Recalibration Active",
      message: "Stability dipped recently. The system has eased difficulty to help you rebuild. Short, consistent sessions will restore your rhythm naturally.",
      priority: 10,
    });
  }

  const stabilityTier = getStabilityTier(stabilityScore);
  if (stabilityScore < 40 && (stability?.consecutiveLowDays ?? 0) >= 3) {
    messages.push({
      type: "stability",
      title: "Stability Check",
      message: `Stability at ${stabilityScore}/100. A few low days in a row — this is where a single micro-session makes the most difference. One action today shifts the pattern.`,
      priority: 9,
    });
  } else if (stabilityScore >= 70) {
    messages.push({
      type: "stability",
      title: `${stabilityTier.label} Stability`,
      message: `Stability at ${stabilityScore}/100. Your consistency is compounding. ${player.phase < 5 ? "This rhythm leads to the next phase." : "Sovereignty is sustained through this kind of steadiness."}`,
      priority: 4,
    });
  }

  const todayCompletions = recentCompletions.filter(c => {
    const d = new Date(c.completedAt!);
    return d.toLocaleDateString("en-CA") === today;
  });
  const completedHabitIds = new Set(todayCompletions.map(c => c.habitId));
  const activeHabits = habits.filter(h => h.active);
  const remainingHabits = activeHabits.filter(h => !completedHabitIds.has(h.id));

  if (remainingHabits.length === 0 && activeHabits.length > 0) {
    messages.push({
      type: "celebration",
      title: "All Complete",
      message: "Every session done for today. Rest is part of the system — let tomorrow's strength build from tonight's recovery.",
      priority: 9,
    });
  } else if (remainingHabits.length > 0) {
    const recoveryHabits = remainingHabits.filter(h => {
      const recovery = shouldTriggerRecovery(h, today);
      return recovery.trigger;
    });

    if (recoveryHabits.length > 0) {
      const worst = recoveryHabits.reduce((a, b) => {
        const aMissed = shouldTriggerRecovery(a, today).missedDays;
        const bMissed = shouldTriggerRecovery(b, today).missedDays;
        return aMissed > bMissed ? a : b;
      });
      const recovery = shouldTriggerRecovery(worst, today);
      messages.push({
        type: "recovery",
        title: "Gentle Restart",
        message: `"${worst.name}" has been resting for ${recovery.missedDays} days. ${recovery.suggestion} Returning to it — even briefly — restores the connection.`,
        priority: 9,
        actionable: true,
        action: "micro_session",
      });
    }

    if (hour >= 6 && hour < 12) {
      const bestFirst = remainingHabits.sort((a, b) => b.momentum - a.momentum)[0];
      messages.push({
        type: "motivation",
        title: "Morning Rhythm",
        message: `${remainingHabits.length} session${remainingHabits.length > 1 ? "s" : ""} ahead. "${bestFirst.name}" has the strongest momentum — starting there builds on what's already working.`,
        priority: 7,
      });
    } else if (hour >= 12 && hour < 18) {
      messages.push({
        type: "suggestion",
        title: "Midday Window",
        message: `${remainingHabits.length} session${remainingHabits.length > 1 ? "s" : ""} remaining. A short session now keeps the rhythm steady.`,
        priority: 6,
      });
    } else if (hour >= 18) {
      const hasVitality = remainingHabits.some(h => h.stat === "vitality");
      const note = hasVitality ? " Evening is natural territory for recovery sessions." : "";
      messages.push({
        type: "suggestion",
        title: "Evening Window",
        message: `${remainingHabits.length} session${remainingHabits.length > 1 ? "s" : ""} remaining.${note} Even a few minutes preserves what you've built.`,
        priority: 8,
        actionable: true,
        action: "quick_complete",
      });
    }
  }

  const highMomentumHabits = habits.filter(h => h.momentum >= 0.7);
  if (highMomentumHabits.length > 0) {
    const best = highMomentumHabits.reduce((a, b) => a.momentum > b.momentum ? a : b);
    const tier = getMomentumTier(best.momentum);
    messages.push({
      type: "celebration",
      title: `${tier.label} Momentum`,
      message: `"${best.name}" at ${Math.round(best.momentum * 100)}% momentum. ${best.currentStreak > 0 ? `${best.currentStreak} days in rhythm.` : ""} This consistency compounds.`,
      priority: 5,
    });
  }

  const strugglingHabits = habits.filter(h => h.active && h.momentum < 0.2 && h.totalCompletions > 3);
  for (const habit of strugglingHabits.slice(0, 1)) {
    messages.push({
      type: "suggestion",
      title: "Micro-Session Available",
      message: `"${habit.name}" could use attention. Difficulty has been eased. ${Math.max(2, Math.round(habit.baseDurationMinutes * 0.6))} minutes reconnects the thread.`,
      priority: 6,
      actionable: true,
      action: "micro_session",
    });
  }

  const statsUsed = new Set(habits.filter(h => h.totalCompletions > 0).map(h => h.stat));
  const allStats = ["strength", "agility", "sense", "vitality"];
  const missingStats = allStats.filter(s => !statsUsed.has(s as any));
  if (missingStats.length > 0 && habits.length >= 2) {
    const statLabels: Record<string, string> = {
      strength: "Strength (physical)",
      agility: "Agility (flexibility)",
      sense: "Sense (focus/meditation)",
      vitality: "Vitality (recovery)",
    };
    messages.push({
      type: "insight",
      title: "Growth Balance",
      message: `${statLabels[missingStats[0]]} is unexplored. Adding even a small session rounds out your development and strengthens overall stability.`,
      priority: 4,
    });
  }

  if (anchors && anchors.length > 0) {
    const clusters = detectAnchorClusters(anchors);
    if (clusters.length > 0) {
      const top = clusters[0];
      messages.push({
        type: "insight",
        title: "Pattern Noticed",
        message: `Your resets tend to happen in the ${top.label}, around ${formatTimeLabel(top.hour)}. This may be your natural reset window — the system adapts to these rhythms.`,
        priority: 3,
      });
    }
  }

  if (hour >= 20 || hour < 6) {
    const hasVitalityHabit = habits.some(h => h.stat === "vitality");
    messages.push({
      type: "check_in",
      title: "Rest Protocol",
      message: hasVitalityHabit
        ? "Good sleep strengthens your Vitality and stability. Both feed into tomorrow's readiness."
        : "Recovery is part of growth. The system recognizes rest as an active contribution.",
      priority: 2,
    });
  }

  return messages.sort((a, b) => {
    if (a.actionable && !b.actionable) return -1;
    if (!a.actionable && b.actionable) return 1;
    return b.priority - a.priority;
  });
}

export function getDurationSuggestion(habit: Habit, playerPhase: number): { suggested: number; reason: string } {
  const maxDuration = getPhaseMaxDuration(playerPhase);

  if (habit.momentum < 0.15 && habit.totalCompletions > 5) {
    const micro = Math.max(2, Math.round(habit.baseDurationMinutes * 0.5));
    return { suggested: micro, reason: "Micro-session to gently rebuild momentum" };
  }

  if (habit.currentStreak === 0 && habit.totalCompletions > 3) {
    const reduced = Math.max(2, Math.round(habit.baseDurationMinutes * 0.6));
    return { suggested: reduced, reason: "Shorter restart — ease back in" };
  }

  if (habit.momentum >= 0.7 && habit.currentStreak >= 14) {
    const increased = Math.min(maxDuration, Math.round(habit.currentDurationMinutes * 1.1));
    return { suggested: increased, reason: "Your consistency supports a slight increase" };
  }

  return { suggested: habit.currentDurationMinutes, reason: "Current duration is working well" };
}

export function getMotivationNudge(momentum: number, streak: number, missedDays: number): string {
  if (missedDays >= 5) {
    return "Momentum cooled over several days. The system has adjusted to make reentry gentle. Even 2 minutes today restores the thread.";
  }
  if (missedDays >= 3) {
    return "A few days away. Momentum dipped but hasn't reset — it adjusts gradually. A micro-session brings you back into rhythm.";
  }
  if (missedDays === 1) {
    return "Momentum cooled yesterday. Returning today restores your rhythm.";
  }

  const tier = getMomentumTier(momentum);
  if (tier.tier === "blazing") {
    return `Blazing momentum at ${Math.round(momentum * 100)}%. Your consistency is transforming into something lasting.`;
  }
  if (tier.tier === "strong") {
    return "Strong momentum. Each session deepens the pattern.";
  }
  if (streak >= 30) {
    return "30+ days. This isn't just a habit anymore — it's becoming part of who you are.";
  }
  if (streak >= 14) {
    return "Two weeks of rhythm. The pattern is forming. Each day reinforces it.";
  }
  if (streak >= 7) {
    return "One week in. Your rhythm is forming.";
  }
  if (streak >= 3) {
    return "Three days in rhythm. Small steps compound over time.";
  }
  return "Every rhythm begins with a single action. One session today starts the pattern.";
}

export function getHomeInsight(
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[],
  languageStage: LanguageStage = 4,
  anchors?: BehavioralAnchorData[]
): { title: string; message: string; action?: string } {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA");
  const hour = now.getHours();
  const stabilityScore = player.stability?.score ?? 50;

  const todayCompletions = recentCompletions.filter(c => {
    const d = new Date(c.completedAt!);
    return d.toLocaleDateString("en-CA") === today;
  });
  const completedHabitIds = new Set(todayCompletions.map(c => c.habitId));
  const activeHabits = habits.filter(h => h.active);
  const remainingHabits = activeHabits.filter(h => !completedHabitIds.has(h.id));

  const ls = (text: string) => applyLanguageStage(text, languageStage);

  if (activeHabits.length === 0) {
    return {
      title: "Coach",
      message: ls("One small step begins everything."),
      action: "create_habit",
    };
  }

  if (remainingHabits.length === 0) {
    const doneMessages = [
      "All sessions complete. Rest builds tomorrow's strength.",
      "You showed up today. That compounds over time.",
      "Recovery is part of the system. Let it work.",
    ];
    return {
      title: "Coach",
      message: ls(doneMessages[todayCompletions.length % doneMessages.length]),
    };
  }

  if (player.stability?.softRegressionActive) {
    return {
      title: "Coach",
      message: ls("A short session now rebuilds momentum gently."),
      action: "start_habit",
    };
  }

  const next = remainingHabits.sort((a, b) => b.momentum - a.momentum)[0];
  const completedCount = todayCompletions.length;

  if (anchors && anchors.length > 0) {
    const clusters = detectAnchorClusters(anchors);
    if (clusters.length > 0 && Math.abs(clusters[0].hour - hour) <= 1) {
      return {
        title: "Coach",
        message: ls("This is around the time your resets naturally happen. Good moment to begin."),
        action: "start_habit",
      };
    }
  }

  const dayIndex = now.getDate() % 4;

  if (completedCount === 0) {
    const startMessages = [
      "Begin with a small action.",
      `A ${next.currentDurationMinutes}-minute session shifts your state.`,
      "One action starts the rhythm.",
      hour < 12 ? "Morning sessions set the tone." : "Any moment is the right moment to continue.",
    ];
    return {
      title: "Coach",
      message: ls(startMessages[dayIndex]),
      action: "start_habit",
    };
  }

  const flowMessages = [
    "A short session now keeps the rhythm steady.",
    `${remainingHabits.length} session${remainingHabits.length > 1 ? "s" : ""} left. Keep the flow.`,
    stabilityScore >= 70 ? "Your consistency is compounding." : "Each action strengthens your stability.",
  ];
  return {
    title: "Coach",
    message: ls(flowMessages[completedCount % flowMessages.length]),
    action: "start_habit",
  };
}

function buildResponse(text: string, suggestions: string[], context: string, languageStage: LanguageStage): CoachChatResponse {
  const ls = (t: string) => sanitizeCoachText(applyLanguageStage(t, languageStage));
  const finalText = ls(text);
  return {
    response: finalText,
    reply: finalText,
    suggestions: suggestions.map(s => applyLanguageStage(s, languageStage)),
    context,
  };
}

export function handleCoachChat(
  question: string,
  player: Player,
  habits: Habit[],
  recentCompletions: HabitCompletion[],
  languageStage: LanguageStage = 4,
  anchors?: BehavioralAnchorData[]
): CoachChatResponse {
  const q = question.toLowerCase().trim();
  const stabilityScore = player.stability?.score ?? 50;
  const phaseName = PHASE_NAMES[player.phase] || `Phase ${player.phase}`;

  // 1) Greetings / small talk
  if (/\b(hi|hey|hello|yo|sup|good morning|good evening|what's up|whats up)\b/.test(q) && q.length < 25) {
    const greetings = [
      `Hey. Level ${player.level}, Stability ${stabilityScore}/100. What's on your mind today?`,
      `I'm here. You're in ${phaseName} — anything you want to work through?`,
      `Hello. Tell me what you're navigating today. I can answer questions about the app, give you guided practices, or just think through something with you.`,
    ];
    return buildResponse(
      pickVariant(greetings, q),
      ["What should I do today?", "Help me build a habit", "I'm struggling with focus", "How does stability work?"],
      "greeting",
      languageStage
    );
  }

  // 2) Thanks / acknowledgement
  if (/\b(thanks|thank you|appreciate|cheers)\b/.test(q)) {
    const acks = [
      "Anytime. Your follow-through is what does the work — I just point.",
      "Glad it lands. Come back when you need to think out loud.",
      "Noted. Keep the rhythm steady — that's what compounds.",
    ];
    return buildResponse(pickVariant(acks, q), ["What should I do today?", "I need motivation", "Tell me about momentum"], "ack", languageStage);
  }

  // 3) Identity / "who are you"
  if (/\b(who are you|what are you|are you ai|what can you do)\b/.test(q)) {
    return buildResponse(
      "I'm your Ascend Coach. I read your phase, stability, momentum, recent completions, and behavioral anchors — then respond using an Acknowledge → Reframe → Suggest pattern. I can answer questions about the app, give you guided practices for things like focus, sleep, motivation, and procrastination, or just walk through a challenge with you. What do you want to dig into?",
      ["What should I do today?", "Help me with focus", "How does stability work?", "I'm struggling"],
      "identity",
      languageStage
    );
  }

  // 4) Multi-step growth playbooks (highest-value path)
  for (const trigger of PLAYBOOK_TRIGGERS) {
    if (trigger.keys.some(k => q.includes(k))) {
      const pb = GROWTH_PLAYBOOKS[trigger.playbook];
      return buildResponse(formatPlaybook(trigger.playbook), pb.suggestions, `playbook:${trigger.playbook}`, languageStage);
    }
  }

  // 5) App knowledge — exact and fuzzy topic match
  for (const [topic, knowledge] of Object.entries(APP_KNOWLEDGE)) {
    if (q.includes(topic) || matchesTopic(q, topic)) {
      return buildResponse(knowledge, getFollowUpSuggestions(topic, languageStage), topic, languageStage);
    }
  }

  // 6) Build / break habits intent
  if (q.includes("build") && (q.includes("habit") || q.includes("ritual") || q.includes("routine"))) {
    return buildResponse(
      "Building a habit, the way that actually sticks:\n\n1. Pick ONE habit. One. Ambition kills habits — focus protects them.\n2. Make it tiny. 2 minutes max for the first 2 weeks. The rep matters, not the size.\n3. Tie it to an existing anchor (after coffee, before shower, after lunch).\n4. Open the Habits page → 'Build a New Habit' tab and add it. The system will scale duration as your momentum grows.\n5. Don't miss twice in a row. One miss is data; two is a new pattern.",
      ["I want to break a bad habit", "How does momentum work?", "What habits should I add?"],
      "build_habit",
      languageStage
    );
  }
  if ((q.includes("break") || q.includes("stop") || q.includes("quit") || q.includes("kick")) && (q.includes("habit") || q.includes("addiction") || q.includes("vice"))) {
    return buildResponse(
      "Breaking a bad habit, step by step:\n\n1. Open Habits page → 'Break a Bad Habit' tab. Add the habit, the trigger, the craving, and a replacement.\n2. Identify the cue. When does the urge hit? Time, place, emotion, person?\n3. Add friction. Make the bad habit harder to do (delete the app, move the snacks, change the route).\n4. Replace, don't just remove. Have a 30-second alternative ready for the moment of urge.\n5. Each day you avoid it, check it in. Streaks here count too.",
      ["Help me build a new habit", "I'm struggling with cravings", "How does identity work?"],
      "break_habit",
      languageStage
    );
  }

  // 7) Progression / level / "where am I"
  if ((q.includes("how") && (q.includes("level") || q.includes("progress"))) || q.includes("where am i") || q.includes("status")) {
    const nextPhaseNote = player.phase < 5 ? ` Steady stability leads toward ${PHASE_NAMES[player.phase + 1]}.` : " Sovereignty is sustained through the same steadiness that got you here.";
    return buildResponse(
      `You're at Level ${player.level} in ${phaseName}. Stability: ${stabilityScore}/100.${nextPhaseNote} The path is the same as it's always been — show up small, often.`,
      ["How does stability work?", "Tell me about momentum", "What are phases?"],
      "progression",
      languageStage
    );
  }

  // 8) Regression
  if (q.includes("regress") || q.includes("lost phase") || q.includes("went down") || q.includes("demoted")) {
    return buildResponse(
      "Regression is recalibration, not punishment. The system eases difficulty when stability dips for several days running, creating space to rebuild. A single session today starts the climb back. Phases come and go — your rhythm is the durable thing.",
      ["How do I rebuild?", "What's my stability?", "Tell me about phases"],
      "regression",
      languageStage
    );
  }

  // 9) "I'm struggling / it's hard / help" — context-aware
  if (q.includes("struggling") || q.includes("can't") || q.includes("difficult") || (q.includes("help") && q.length < 30)) {
    const lowestMomentum = habits.length > 0 ? habits.reduce((a, b) => a.momentum < b.momentum ? a : b) : null;
    let reply = "Hard stretches are built into this — they're not failure, they're feedback.\n\n";
    reply += "The engine has already softened things to meet you where you are. A micro-session (2-3 minutes) keeps the connection alive without draining you.\n\n";
    if (lowestMomentum) {
      reply += `\"${lowestMomentum.name}\" could use a gentle return — try just ${Math.max(2, Math.round(lowestMomentum.baseDurationMinutes * 0.5))} minutes today.`;
    }
    if (stabilityScore < 50) {
      reply += `\n\nStability is at ${stabilityScore}/100 — consistency matters more than intensity right now.`;
    }
    return buildResponse(reply, ["Start a micro-session", "I feel overwhelmed", "I'm losing motivation", "How does recovery work?"], "help", languageStage);
  }

  // 10) "What should I do" / "what's next"
  if ((q.includes("what") && (q.includes("do") || q.includes("should") || q.includes("next"))) || q.includes("what now")) {
    const today = new Date().toLocaleDateString("en-CA");
    const completedToday = new Set(
      recentCompletions.filter(c => new Date(c.completedAt!).toLocaleDateString("en-CA") === today).map(c => c.habitId)
    );
    const remaining = habits.filter(h => h.active && !completedToday.has(h.id));

    if (remaining.length === 0) {
      return buildResponse(
        habits.length === 0
          ? "No active habits yet. Open the Habits page and add your first one — keep it tiny. 2 minutes counts here."
          : "All sessions complete for today. Rest now. Recovery is what makes tomorrow's effort sustainable.",
        ["Help me build a new habit", "What's my stability?", "Tell me about my progress"],
        "completed",
        languageStage
      );
    }

    const sorted = [...remaining].sort((a, b) => b.momentum - a.momentum);
    const hour = new Date().getHours();
    const vitalityFirst = hour >= 20 && sorted.some(h => h.stat === "vitality");

    if (vitalityFirst) {
      const vHabit = sorted.find(h => h.stat === "vitality")!;
      return buildResponse(
        `Evening is natural territory for recovery. \"${vHabit.name}\" (${vHabit.currentDurationMinutes} min) fits this window. ${remaining.length} session${remaining.length > 1 ? "s" : ""} remaining.`,
        ["How does Vitality work?", "Tell me about sleep", "How does momentum work?"],
        "next_action",
        languageStage
      );
    }

    let anchorNote = "";
    if (anchors && anchors.length > 0) {
      const clusters = detectAnchorClusters(anchors);
      if (clusters.length > 0 && Math.abs(clusters[0].hour - hour) <= 1) {
        anchorNote = " This is close to your natural reset time — good moment to act.";
      }
    }
    return buildResponse(
      `${remaining.length} session${remaining.length > 1 ? "s" : ""} remaining. Start with \"${sorted[0].name}\" — strongest momentum (${Math.round(sorted[0].momentum * 100)}%), so you'll build on what's already working.${anchorNote}`,
      ["How does momentum work?", "I'm struggling", "Tell me about my stats"],
      "next_action",
      languageStage
    );
  }

  // 11) Mood / feelings
  if (q.includes("mood") || q.includes("feel") || q.includes("tired") || q.includes("energy") || q.includes("stress") || q.includes("sad") || q.includes("low") || q.includes("down")) {
    if (q.includes("tired") || q.includes("low") || q.includes("bad") || q.includes("stress") || q.includes("sad") || q.includes("down")) {
      const replies = [
        "Low days happen. The system reads them — that's why difficulty has already softened. A 2-3 minute session keeps the thread without draining you. Showing up matters more than performing today.",
        "Heavy days are part of the cycle, not a sign you've broken something. Try the smallest version of one habit today. Movement, even tiny, shifts the chemistry.",
        "When energy is low, the move is to lower the bar, not raise the discipline. Pick one micro-action. Done is the goal.",
      ];
      return buildResponse(pickVariant(replies, q), ["Start a 2-minute session", "I need motivation", "How does recovery work?"], "mood_low", languageStage);
    }
    return buildResponse(
      "Checking in with how you feel is part of the practice. Strong day → lean in with longer sessions. Off day → micro-sessions to keep the rhythm. The system adapts either way.",
      ["What should I do today?", "How does stability work?", "Tell me about momentum"],
      "mood",
      languageStage
    );
  }

  // 12) Anchors / rhythm
  if (q.includes("anchor") || q.includes("reset") || q.includes("pattern") || q.includes("rhythm") || q.includes("when do i")) {
    if (anchors && anchors.length > 0) {
      const clusters = detectAnchorClusters(anchors);
      if (clusters.length > 0) {
        const top = clusters[0];
        return buildResponse(
          `Your resets cluster in the ${top.label}, around ${formatTimeLabel(top.hour)}. That's your natural rhythm emerging. The system uses these anchors to predict when you're most likely to engage and to suggest habit placement.`,
          ["Tell me about the Sectograph", "How does AHPS work?", "What's my stability?"],
          "anchors",
          languageStage
        );
      }
      return buildResponse(
        `${anchors.length} reset marker${anchors.length > 1 ? "s" : ""} recorded. As more accumulate, your rhythm patterns will emerge.`,
        ["What's next for today?", "How does the Sectograph work?", "Tell me about phases"],
        "anchors",
        languageStage
      );
    }
    return buildResponse(
      "Resets will start appearing on your timeline as you complete sessions. Over time they reveal your natural rhythm — when you reliably show up.",
      ["How does the Sectograph work?", "What's next?", "Tell me about stability"],
      "anchors",
      languageStage
    );
  }

  // 13) "Give me advice" / "advice on X" / "help me with X"
  if (q.includes("advice") || q.startsWith("help me with") || q.startsWith("how do i ")) {
    return buildResponse(
      "I can give guided practices for: focus, procrastination, sleep, motivation, distraction, perfectionism, overwhelm, anxiety, comparison, plateaus, time management, morning routines, energy, fear, and consistency. Which one is biting you right now?",
      ["I'm procrastinating", "I can't focus", "I'm exhausted", "I'm overwhelmed", "I'm stuck"],
      "advice_menu",
      languageStage
    );
  }

  // 14) Improve / get better at X
  if (q.includes("improve") || q.includes("get better") || q.includes("level up my") || q.includes("work on")) {
    return buildResponse(
      "To improve a specific area: name it, pick the one habit that most directly trains it, then make that habit small enough you can do it 6 days a week. The system handles scaling — you handle showing up. Tell me what area you're targeting and I'll give you a step-by-step plan.",
      ["I want to focus better", "I want better sleep", "I want more energy", "I'm procrastinating"],
      "improve",
      languageStage
    );
  }

  // 15) Fallback — engaged, never the same line twice
  const avgMomentum = habits.length > 0 ? habits.reduce((sum, h) => sum + h.momentum, 0) / habits.length : 0;
  const fallbacks = [
    `You're in ${phaseName} at Level ${player.level}, Stability ${stabilityScore}/100, Momentum ${Math.round(avgMomentum * 100)}%. I can answer questions about the app, give you guided practices, or think through a personal challenge. Tell me a bit more about what you're after.`,
    `I want to be useful here — give me a little more to work with. Are you asking about how something in the app works, looking for advice on a personal challenge, or trying to figure out what to do today?`,
    `Not 100% sure what you're aiming at. I can break down any system in the app (stability, momentum, phases, stats), or walk you through challenges like focus, sleep, motivation, procrastination. What's on your mind?`,
  ];
  return buildResponse(
    pickVariant(fallbacks, q),
    ["What should I do today?", "Help me with focus", "I'm struggling", "How does stability work?"],
    "general",
    languageStage
  );
}

function matchesTopic(question: string, topic: string): boolean {
  const topicKeywords: Record<string, string[]> = {
    phases: ["phase", "unlock", "advance", "evolve", "evolution"],
    stability: ["stability", "stable", "stability score", "score"],
    regression: ["regress", "drop", "lost phase", "went down", "demote"],
    stats: ["stat", "str", "agi", "sen", "vit", "strength", "agility", "sense", "vitality"],
    momentum: ["momentum", "multiplier", "consistency"],
    streaks: ["streak", "grace", "miss", "forgive"],
    habits: ["habit", "routine", "daily"],
    difficulty: ["difficulty", "duration", "scale", "adjust", "harder", "easier"],
    badges: ["badge", "achievement", "reward", "earn"],
    recovery: ["recovery", "come back", "restart", "missed", "break"],
    xp: ["xp", "experience", "points", "earn"],
    meditation: ["meditat", "mindful", "breath", "focus", "sense training"],
    vitality: ["vitality", "sleep", "recover", "health", "evening", "bedtime"],
    calendar: ["calendar", "schedule", "sectograph", "time"],
    trials: ["trial", "challenge"],
    visuals: ["visual", "environment", "aura", "particle", "world", "avatar", "theme"],
  };

  const keywords = topicKeywords[topic] || [];
  return keywords.some(kw => question.includes(kw));
}

function getStagedSuggestions(suggestions: string[], stage: LanguageStage): string[] {
  return suggestions.map(s => applyLanguageStage(s, stage));
}

function getFollowUpSuggestions(topic: string, stage: LanguageStage): string[] {
  const followUps: Record<string, string[]> = {
    phases: ["How does stability work?", "What causes regression?", "Tell me about visuals"],
    stability: ["How do phases work?", "What causes regression?", "How do I improve stability?"],
    regression: ["How does stability work?", "How do I rebuild?", "Tell me about phases"],
    stats: ["How do phases work?", "What badges can I earn?", "Tell me about difficulty"],
    momentum: ["How do streaks work?", "What drives my XP?", "How do I recover momentum?"],
    streaks: ["How does momentum work?", "Tell me about grace days", "Tell me about recovery"],
    habits: ["How does difficulty scale?", "How do I earn XP?", "Tell me about stability"],
    difficulty: ["How does stability work?", "Tell me about micro-sessions", "Tell me about phases"],
    badges: ["How do I earn more badges?", "What's my progress?", "Tell me about streaks"],
    recovery: ["How does momentum work?", "What's a micro-session?", "How does stability help?"],
    xp: ["How does momentum affect XP?", "Tell me about daily bonuses", "Tell me about badges"],
    meditation: ["How does Sense work?", "Tell me about difficulty scaling", "Tell me about vitality"],
    vitality: ["When should I schedule vitality?", "How does sleep affect stability?", "Tell me about meditation"],
    calendar: ["How do habits work?", "Tell me about the schedule", "What's next for today?"],
    trials: ["How do I unlock trials?", "What are phases?", "Tell me about badges"],
    visuals: ["How do phases work?", "What changes at each phase?", "Tell me about stability"],
  };
  const raw = followUps[topic] || ["How does stability work?", "What's next for today?", "Tell me about phases"];
  return raw.map(s => applyLanguageStage(s, stage));
}

export type BreathPhase = 1 | 2 | 3 | 4;

export interface BreathPattern {
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
}

export interface BreathingSessionFeedback {
  difficulty: "easy" | "normal" | "difficult";
  maintainedRhythm: "yes" | "mostly" | "no";
  mindWandered: "rarely" | "sometimes" | "often";
}

export interface BreathSessionRecord {
  date: string;
  phase: BreathPhase;
  pattern: BreathPattern;
  durationSeconds: number;
  feedback: BreathingSessionFeedback;
  score: number;
  isPerfect: boolean;
}

export interface BreathingProfile {
  phase: BreathPhase;
  pattern: BreathPattern;
  durationSeconds: number;
  sessionsCompleted: number;
  history: BreathSessionRecord[];
  streak: number;
  lastSessionDate: string | null;
  xpTotal: number;
  phaseUnlockedAt: Partial<Record<BreathPhase, string>>;
}

export interface BreathPhaseDefinition {
  label: string;
  defaultPattern: BreathPattern;
  baseDuration: number;
  maxDuration: number;
  description: string;
  focus: string;
  unlockCondition?: {
    minSessions: number;
    minPositivePercent: number;
  };
}

export const BREATHING_PHASES: Record<BreathPhase, BreathPhaseDefinition> = {
  1: {
    label: "Beginner",
    defaultPattern: { inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 6 },
    baseDuration: 123,
    maxDuration: 153,
    description: "4-4-6 rhythm. Building consistency.",
    focus: "Consistency",
    unlockCondition: { minSessions: 5, minPositivePercent: 80 },
  },
  2: {
    label: "Developing",
    defaultPattern: { inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 8 },
    baseDuration: 180,
    maxDuration: 240,
    description: "4-4-8 rhythm. Extended exhale, diaphragm focus.",
    focus: "Diaphragmatic breathing",
    unlockCondition: { minSessions: 5, minPositivePercent: 80 },
  },
  3: {
    label: "Advanced",
    defaultPattern: { inhaleSeconds: 5, holdSeconds: 5, exhaleSeconds: 8 },
    baseDuration: 240,
    maxDuration: 300,
    description: "5-5-8 rhythm. Deeper hold, sustained focus.",
    focus: "Rhythm & awareness",
    unlockCondition: { minSessions: 7, minPositivePercent: 70 },
  },
  4: {
    label: "Adaptive",
    defaultPattern: { inhaleSeconds: 5, holdSeconds: 5, exhaleSeconds: 8 },
    baseDuration: 300,
    maxDuration: 480,
    description: "Dynamic patterns tuned to your performance.",
    focus: "Full breath mastery",
  },
};

export const DEFAULT_PROFILE: BreathingProfile = {
  phase: 1,
  pattern: BREATHING_PHASES[1].defaultPattern,
  durationSeconds: BREATHING_PHASES[1].baseDuration,
  sessionsCompleted: 0,
  history: [],
  streak: 0,
  lastSessionDate: null,
  xpTotal: 0,
  phaseUnlockedAt: { 1: new Date().toISOString().split("T")[0] },
};

export function calculateSessionScore(feedback: BreathingSessionFeedback): number {
  let score = 0;
  if (feedback.difficulty === "easy") score += 40;
  else if (feedback.difficulty === "normal") score += 25;
  else score += 8;
  if (feedback.maintainedRhythm === "yes") score += 35;
  else if (feedback.maintainedRhythm === "mostly") score += 20;
  else score += 5;
  if (feedback.mindWandered === "rarely") score += 25;
  else if (feedback.mindWandered === "sometimes") score += 15;
  else score += 5;
  return score;
}

export function isPerfectSession(feedback: BreathingSessionFeedback): boolean {
  return (
    feedback.difficulty === "easy" &&
    feedback.maintainedRhythm === "yes" &&
    feedback.mindWandered === "rarely"
  );
}

export function getXpForSession(
  profile: BreathingProfile,
  feedback: BreathingSessionFeedback,
  isStreakDay: boolean
): { base: number; streakBonus: number; perfectBonus: number; total: number } {
  const base = 10 + (profile.phase - 1) * 3;
  const streakBonus = isStreakDay ? 5 : 0;
  const perfectBonus = isPerfectSession(feedback) ? 8 : 0;
  return { base, streakBonus, perfectBonus, total: base + streakBonus + perfectBonus };
}

export function getPhaseProgress(profile: BreathingProfile): {
  sessionsForPhase: number;
  neededForNextPhase: number | null;
  percentToNext: number;
  eligibleForUnlock: boolean;
} {
  const phaseDef = BREATHING_PHASES[profile.phase];
  const condition = phaseDef.unlockCondition;

  if (!condition || profile.phase >= 4) {
    return {
      sessionsForPhase: profile.sessionsCompleted,
      neededForNextPhase: null,
      percentToNext: 100,
      eligibleForUnlock: false,
    };
  }

  const phaseHistory = profile.history.filter((s) => s.phase === profile.phase);
  const phaseCount = phaseHistory.length;

  const lookback = Math.min(phaseCount, condition.minSessions);
  const recent = phaseHistory.slice(-lookback);
  const positiveCount = recent.filter(
    (s) => s.feedback.difficulty !== "difficult"
  ).length;
  const positivePercent = lookback > 0 ? (positiveCount / lookback) * 100 : 0;

  const meetsCount = phaseCount >= condition.minSessions;
  const meetsPositive = positivePercent >= condition.minPositivePercent;
  const eligible = meetsCount && meetsPositive;

  return {
    sessionsForPhase: phaseCount,
    neededForNextPhase: condition.minSessions,
    percentToNext: Math.min(100, (phaseCount / condition.minSessions) * 100),
    eligibleForUnlock: eligible,
  };
}

export function applyAdaptiveAdjustment(
  profile: BreathingProfile,
  score: number
): { pattern: BreathPattern; durationSeconds: number } {
  const phaseDef = BREATHING_PHASES[profile.phase];
  let { pattern, durationSeconds } = profile;

  if (score >= 85) {
    const maxExhale = profile.phase <= 2
      ? phaseDef.defaultPattern.exhaleSeconds + 2
      : 12;
    if (pattern.exhaleSeconds < maxExhale) {
      pattern = { ...pattern, exhaleSeconds: pattern.exhaleSeconds + 1 };
    } else if (durationSeconds < phaseDef.maxDuration) {
      durationSeconds = Math.min(durationSeconds + 30, phaseDef.maxDuration);
    }
  } else if (score < 40) {
    if (pattern.holdSeconds > 2) {
      pattern = { ...pattern, holdSeconds: pattern.holdSeconds - 1 };
    } else if (durationSeconds > phaseDef.baseDuration) {
      durationSeconds = Math.max(durationSeconds - 30, phaseDef.baseDuration);
    }
  }

  return { pattern, durationSeconds };
}

export interface SessionResult {
  updatedProfile: BreathingProfile;
  score: number;
  isPerfect: boolean;
  xp: { base: number; streakBonus: number; perfectBonus: number; total: number };
  phaseUnlocked: BreathPhase | null;
}

export function recordBreathingSession(
  profile: BreathingProfile,
  feedback: BreathingSessionFeedback
): SessionResult {
  const today = new Date().toISOString().split("T")[0];
  const score = calculateSessionScore(feedback);
  const perfect = isPerfectSession(feedback);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().split("T")[0];

  const wasYesterday = profile.lastSessionDate === yDate;
  const isToday = profile.lastSessionDate === today;
  const newStreak = isToday ? profile.streak : (wasYesterday ? profile.streak + 1 : 1);
  const isStreakDay = newStreak > 1 && !isToday;

  const xp = getXpForSession(profile, feedback, isStreakDay);

  const record: BreathSessionRecord = {
    date: today,
    phase: profile.phase,
    pattern: profile.pattern,
    durationSeconds: profile.durationSeconds,
    feedback,
    score,
    isPerfect: perfect,
  };

  const history = [...profile.history, record].slice(-10);

  const progress = getPhaseProgress({ ...profile, history });

  let phaseUnlocked: BreathPhase | null = null;
  let newPhase = profile.phase;
  let newPattern = applyAdaptiveAdjustment(profile, score).pattern;
  let newDuration = applyAdaptiveAdjustment(profile, score).durationSeconds;

  if (progress.eligibleForUnlock && profile.phase < 4) {
    phaseUnlocked = (profile.phase + 1) as BreathPhase;
    newPhase = phaseUnlocked;
    newPattern = BREATHING_PHASES[newPhase].defaultPattern;
    newDuration = BREATHING_PHASES[newPhase].baseDuration;
  }

  const updatedProfile: BreathingProfile = {
    phase: newPhase,
    pattern: newPattern,
    durationSeconds: newDuration,
    sessionsCompleted: profile.sessionsCompleted + 1,
    history,
    streak: newStreak,
    lastSessionDate: today,
    xpTotal: profile.xpTotal + xp.total,
    phaseUnlockedAt: {
      ...profile.phaseUnlockedAt,
      ...(phaseUnlocked ? { [phaseUnlocked]: today } : {}),
    },
  };

  return { updatedProfile, score, isPerfect: perfect, xp, phaseUnlocked };
}

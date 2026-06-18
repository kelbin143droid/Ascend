export type AgilityDifficulty = "easy" | "same" | "challenging";
export type AgilityLimiter = "shoulders" | "back" | "hips" | "hamstrings" | "ankles" | "everything";
export type AgilityStage = 1 | 2 | 3 | 4 | 5;

export interface AgilityProgressProfile {
  stage: AgilityStage;
  focus: AgilityLimiter;
  holdBonusSeconds: number;
  easyStreak: number;
  sameStreak: number;
  hardStreak: number;
  sessionsCompleted: number;
}

const KEY = "ascend_agility_progress_profile_v1";

const DEFAULT_PROFILE: AgilityProgressProfile = {
  stage: 1,
  focus: "everything",
  holdBonusSeconds: 0,
  easyStreak: 0,
  sameStreak: 0,
  hardStreak: 0,
  sessionsCompleted: 0,
};

export const AGILITY_STAGE_LABELS: Record<AgilityStage, string> = {
  1: "Mobility Reset",
  2: "Mobility Flow",
  3: "Flexibility Foundation",
  4: "Yoga Flow",
  5: "Athletic Mobility",
};

export function getAgilityProgressProfile(): AgilityProgressProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    /* noop */
  }
  return { ...DEFAULT_PROFILE };
}

export function saveAgilityProgressProfile(profile: AgilityProgressProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* noop */
  }
}

function clampStage(stage: number): AgilityStage {
  return Math.min(5, Math.max(1, stage)) as AgilityStage;
}

export function applyAgilityFeedback(input: {
  difficulty: AgilityDifficulty;
  limiter?: AgilityLimiter | null;
}): AgilityProgressProfile {
  const current = getAgilityProgressProfile();
  let next: AgilityProgressProfile = {
    ...current,
    sessionsCompleted: current.sessionsCompleted + 1,
  };

  if (input.difficulty === "easy") {
    const easyStreak = current.easyStreak + 1;
    next = { ...next, easyStreak, sameStreak: 0, hardStreak: 0 };
    if (easyStreak >= 2) {
      if (next.holdBonusSeconds < 8) next.holdBonusSeconds += 4;
      else next.stage = clampStage(next.stage + 1);
      next.easyStreak = 0;
    }
  } else if (input.difficulty === "same") {
    const sameStreak = current.sameStreak + 1;
    next = { ...next, easyStreak: 0, sameStreak, hardStreak: 0 };
    if (sameStreak >= 3) {
      next.holdBonusSeconds = Math.min(8, next.holdBonusSeconds + 2);
      next.sameStreak = 0;
    }
  } else {
    next = {
      ...next,
      focus: input.limiter ?? "everything",
      easyStreak: 0,
      sameStreak: 0,
      hardStreak: current.hardStreak + 1,
    };
    if (next.hardStreak >= 2 && next.stage > 1) {
      next.stage = clampStage(next.stage - 1);
      next.hardStreak = 0;
    }
    next.holdBonusSeconds = Math.max(-4, next.holdBonusSeconds - 3);
  }

  saveAgilityProgressProfile(next);
  return next;
}

export type PhysicalCircuitDifficulty = "easy" | "same" | "challenging";
export type PhysicalCircuitLimiter = "push" | "legs" | "core" | "cardio" | "everything";
export type PushVariation = "wall" | "knee" | "standard" | "tempo";
export type CardioMode = "march" | "jog" | "step_jacks";

export interface PhysicalCircuitProfile {
  pushVariation: PushVariation;
  repsBonus: number;
  plankBonusSeconds: number;
  restBonusSeconds: number;
  cardioSeconds: number;
  cardioMode: CardioMode;
  easyStreak: number;
  sameStreak: number;
  hardStreak: number;
  sessionsCompleted: number;
  initialized: boolean;
}

const KEY = "ascend_physical_circuit_profile_v1";

const DEFAULT_PROFILE: PhysicalCircuitProfile = {
  pushVariation: "knee",
  repsBonus: 0,
  plankBonusSeconds: 0,
  restBonusSeconds: 0,
  cardioSeconds: 0,
  cardioMode: "jog",
  easyStreak: 0,
  sameStreak: 0,
  hardStreak: 0,
  sessionsCompleted: 0,
  initialized: false,
};

export const PUSH_VARIATION_COPY: Record<PushVariation, {
  label: string;
  shortLabel: string;
  videoSrc: string;
  instructionNoun: string;
}> = {
  wall: {
    label: "Wall Push-ups",
    shortLabel: "Wall",
    videoSrc: "/videos/wall_pushups_loop.mp4",
    instructionNoun: "wall push-ups",
  },
  knee: {
    label: "Knee Push-ups",
    shortLabel: "Knee",
    videoSrc: "/videos/pushups_loop.mp4",
    instructionNoun: "knee push-ups",
  },
  standard: {
    label: "Push-ups",
    shortLabel: "Standard",
    videoSrc: "/videos/pushups_loop.mp4",
    instructionNoun: "push-ups",
  },
  tempo: {
    label: "Slow Push-ups",
    shortLabel: "Slow",
    videoSrc: "/videos/pushups_loop.mp4",
    instructionNoun: "slow push-ups",
  },
};

export function getPhysicalCircuitProfile(): PhysicalCircuitProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    /* noop */
  }
  return { ...DEFAULT_PROFILE };
}

export function savePhysicalCircuitProfile(profile: PhysicalCircuitProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* noop */
  }
}

export function isPhysicalCircuitProfileInitialized(): boolean {
  return getPhysicalCircuitProfile().initialized;
}

export function initializePhysicalCircuitProfile(pushVariation: PushVariation): PhysicalCircuitProfile {
  const next = {
    ...getPhysicalCircuitProfile(),
    pushVariation,
    initialized: true,
  };
  savePhysicalCircuitProfile(next);
  return next;
}

function upgradePush(variation: PushVariation): PushVariation {
  if (variation === "wall") return "knee";
  if (variation === "knee") return "standard";
  if (variation === "standard") return "tempo";
  return "tempo";
}

function downgradePush(variation: PushVariation): PushVariation {
  if (variation === "tempo") return "standard";
  if (variation === "standard") return "knee";
  if (variation === "knee") return "wall";
  return "wall";
}

function reduceCardio(profile: PhysicalCircuitProfile): PhysicalCircuitProfile {
  if (profile.cardioMode !== "march") return { ...profile, cardioMode: "march" };
  return { ...profile, cardioSeconds: Math.max(0, profile.cardioSeconds - 10) };
}

export function applyPhysicalCircuitFeedback(input: {
  difficulty: PhysicalCircuitDifficulty;
  limiter?: PhysicalCircuitLimiter | null;
}): PhysicalCircuitProfile {
  const current = getPhysicalCircuitProfile();
  let next: PhysicalCircuitProfile = {
    ...current,
    initialized: true,
    sessionsCompleted: current.sessionsCompleted + 1,
  };

  if (input.difficulty === "easy") {
    const easyStreak = current.easyStreak + 1;
    next = { ...next, easyStreak, sameStreak: 0, hardStreak: 0 };
    if (easyStreak >= 2) {
      if (next.repsBonus < 4) next.repsBonus += 2;
      else if (next.plankBonusSeconds < 10) next.plankBonusSeconds += 5;
      else if (next.pushVariation !== "tempo") next.pushVariation = upgradePush(next.pushVariation);
      else next.cardioSeconds = Math.min(45, Math.max(20, next.cardioSeconds + 5));
      next.easyStreak = 0;
    }
  } else if (input.difficulty === "same") {
    const sameStreak = current.sameStreak + 1;
    next = { ...next, easyStreak: 0, sameStreak, hardStreak: 0 };
    if (sameStreak >= 3) {
      if (next.repsBonus < 3) next.repsBonus += 1;
      else next.plankBonusSeconds = Math.min(10, next.plankBonusSeconds + 5);
      next.sameStreak = 0;
    }
  } else {
    const hardStreak = current.hardStreak + 1;
    next = { ...next, easyStreak: 0, sameStreak: 0, hardStreak };
    switch (input.limiter) {
      case "push":
        next.pushVariation = downgradePush(next.pushVariation);
        next.repsBonus = Math.max(-2, next.repsBonus - 1);
        break;
      case "legs":
        next.repsBonus = Math.max(-3, next.repsBonus - 2);
        break;
      case "core":
        next.plankBonusSeconds = Math.max(-10, next.plankBonusSeconds - 5);
        break;
      case "cardio":
        next = reduceCardio(next);
        break;
      case "everything":
      default:
        next.pushVariation = downgradePush(next.pushVariation);
        next.repsBonus = Math.max(-3, next.repsBonus - 2);
        next.plankBonusSeconds = Math.max(-10, next.plankBonusSeconds - 5);
        next.restBonusSeconds = Math.min(10, next.restBonusSeconds + 5);
        next = reduceCardio(next);
        break;
    }
  }

  if (next.sessionsCompleted >= 1 && next.cardioSeconds === 0) {
    next.cardioSeconds = 20;
    next.cardioMode = "jog";
  }

  savePhysicalCircuitProfile(next);
  return next;
}

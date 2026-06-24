export type PhysicalCircuitDifficulty = "easy" | "same" | "challenging";
export type PhysicalCircuitLimiter = "push" | "legs" | "core" | "cardio" | "everything";
export type PushVariation = "wall" | "knee" | "standard" | "tempo";
export type SquatVariation = "chair" | "supported" | "standard";
export type CoreVariation = "dead_bug" | "crunch" | "situp";
export type PlankVariation = "wall" | "knee" | "standard";
export type CardioMode = "march" | "jog" | "step_jacks";

export interface PhysicalCircuitProfile {
  pushVariation: PushVariation;
  squatVariation: SquatVariation;
  coreVariation: CoreVariation;
  plankVariation: PlankVariation;
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
  squatVariation: "supported",
  coreVariation: "crunch",
  plankVariation: "knee",
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

export interface ExerciseVariationCopy {
  label: string;
  shortLabel: string;
  videoSrc: string;
  instructionNoun: string;
  formCue: string;
}

export const PUSH_VARIATION_COPY: Record<PushVariation, ExerciseVariationCopy> = {
  wall: {
    label: "Wall Push-ups",
    shortLabel: "Wall",
    videoSrc: "/videos/wall_pushups_loop.mp4",
    instructionNoun: "wall push-ups",
    formCue: "Keep your body straight and press away from the wall.",
  },
  knee: {
    label: "Knee Push-ups",
    shortLabel: "Knee",
    videoSrc: "/videos/pushups_loop.mp4",
    instructionNoun: "knee push-ups",
    formCue: "Keep a straight line from your knees through your shoulders.",
  },
  standard: {
    label: "Push-ups",
    shortLabel: "Standard",
    videoSrc: "/videos/pushups_loop.mp4",
    instructionNoun: "push-ups",
    formCue: "Lower with control and stop before your form breaks.",
  },
  tempo: {
    label: "Slow Push-ups",
    shortLabel: "Slow",
    videoSrc: "/videos/pushups_loop.mp4",
    instructionNoun: "slow push-ups",
    formCue: "Lower for three seconds, then press up with control.",
  },
};

export const SQUAT_VARIATION_COPY: Record<SquatVariation, ExerciseVariationCopy> = {
  chair: {
    label: "Chair Squats", shortLabel: "Chair", videoSrc: "/videos/squats_loop.mp4",
    instructionNoun: "chair squats", formCue: "Tap the chair lightly, then stand tall.",
  },
  supported: {
    label: "Supported Squats", shortLabel: "Supported", videoSrc: "/videos/squats_loop.mp4",
    instructionNoun: "supported squats", formCue: "Hold a stable surface and use a comfortable range.",
  },
  standard: {
    label: "Squats", shortLabel: "Standard", videoSrc: "/videos/squats_loop.mp4",
    instructionNoun: "squats", formCue: "Keep your chest up and knees tracking over your toes.",
  },
};

export const CORE_VARIATION_COPY: Record<CoreVariation, ExerciseVariationCopy> = {
  dead_bug: {
    label: "Dead Bugs", shortLabel: "Dead Bug", videoSrc: "/videos/abs_crunch_loop.mp4",
    instructionNoun: "dead bugs", formCue: "Keep your lower back gently pressed into the floor.",
  },
  crunch: {
    label: "Crunches", shortLabel: "Crunch", videoSrc: "/videos/abs_crunch_loop.mp4",
    instructionNoun: "crunches", formCue: "Lift your shoulders with your core, not your neck.",
  },
  situp: {
    label: "Sit-ups", shortLabel: "Sit-up", videoSrc: "/videos/abs_crunch_loop.mp4",
    instructionNoun: "sit-ups", formCue: "Curl up smoothly and lower with control.",
  },
};

export const PLANK_VARIATION_COPY: Record<PlankVariation, ExerciseVariationCopy> = {
  wall: {
    label: "Wall Plank", shortLabel: "Wall", videoSrc: "/videos/plank_hold_loop.mp4",
    instructionNoun: "wall plank", formCue: "Lean into the wall with a straight, braced body.",
  },
  knee: {
    label: "Knee Plank", shortLabel: "Knee", videoSrc: "/videos/plank_hold_loop.mp4",
    instructionNoun: "knee plank", formCue: "Keep a straight line from your knees through your shoulders.",
  },
  standard: {
    label: "Forearm Plank", shortLabel: "Standard", videoSrc: "/videos/plank_hold_loop.mp4",
    instructionNoun: "forearm plank", formCue: "Brace your core and keep a straight line head to heels.",
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

export interface PhysicalCircuitStartingChoices {
  pushVariation: Exclude<PushVariation, "tempo">;
  squatVariation: SquatVariation;
  coreVariation: CoreVariation;
  plankVariation: PlankVariation;
}

export function initializePhysicalCircuitProfile(
  choices: PhysicalCircuitStartingChoices | PushVariation,
): PhysicalCircuitProfile {
  const normalized: PhysicalCircuitStartingChoices = typeof choices === "string"
    ? {
        pushVariation: choices === "tempo" ? "standard" : choices,
        squatVariation: "supported",
        coreVariation: "crunch",
        plankVariation: "knee",
      }
    : choices;
  const next = {
    ...getPhysicalCircuitProfile(),
    ...normalized,
    initialized: true,
  };
  savePhysicalCircuitProfile(next);
  return next;
}

function downgradeSquat(variation: SquatVariation): SquatVariation {
  if (variation === "standard") return "supported";
  if (variation === "supported") return "chair";
  return "chair";
}

function downgradeCore(variation: CoreVariation): CoreVariation {
  if (variation === "situp") return "crunch";
  if (variation === "crunch") return "dead_bug";
  return "dead_bug";
}

function downgradePlank(variation: PlankVariation): PlankVariation {
  if (variation === "standard") return "knee";
  if (variation === "knee") return "wall";
  return "wall";
}

function upgradeSquat(variation: SquatVariation): SquatVariation {
  if (variation === "chair") return "supported";
  if (variation === "supported") return "standard";
  return "standard";
}

function upgradeCore(variation: CoreVariation): CoreVariation {
  if (variation === "dead_bug") return "crunch";
  if (variation === "crunch") return "situp";
  return "situp";
}

function upgradePlank(variation: PlankVariation): PlankVariation {
  if (variation === "wall") return "knee";
  if (variation === "knee") return "standard";
  return "standard";
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
      else if (next.squatVariation !== "standard") next.squatVariation = upgradeSquat(next.squatVariation);
      else if (next.coreVariation !== "situp") next.coreVariation = upgradeCore(next.coreVariation);
      else if (next.plankVariation !== "standard") next.plankVariation = upgradePlank(next.plankVariation);
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
        next.squatVariation = downgradeSquat(next.squatVariation);
        next.repsBonus = Math.max(-3, next.repsBonus - 2);
        break;
      case "core":
        next.coreVariation = downgradeCore(next.coreVariation);
        next.plankVariation = downgradePlank(next.plankVariation);
        next.plankBonusSeconds = Math.max(-10, next.plankBonusSeconds - 5);
        break;
      case "cardio":
        next = reduceCardio(next);
        break;
      case "everything":
      default:
        next.pushVariation = downgradePush(next.pushVariation);
        next.squatVariation = downgradeSquat(next.squatVariation);
        next.coreVariation = downgradeCore(next.coreVariation);
        next.plankVariation = downgradePlank(next.plankVariation);
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

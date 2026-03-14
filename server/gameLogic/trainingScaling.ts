import type { TrainingScaling, CategoryScaling } from "@shared/schema";

const STREAK_TO_UPGRADE = 3;
const MISSED_TO_DOWNGRADE = 3;

const PHASE_TIER_CAPS: Record<number, number> = {
  1: 3,
  2: 5,
  3: 5,
  4: 5,
  5: 5,
};

const XP_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.1,
  3: 1.2,
  4: 1.3,
  5: 1.5,
};

export function getMaxTier(phase: number): number {
  return PHASE_TIER_CAPS[phase] ?? 3;
}

export function getXPMultiplier(tier: number): number {
  return XP_MULTIPLIERS[tier] ?? 1.0;
}

function defaultCategoryScaling(): CategoryScaling {
  return {
    tier: 1,
    completionStreak: 0,
    missedDays: 0,
    sessionsCompleted: 0,
    lastSessionDate: null,
  };
}

export function ensureTrainingScaling(raw: any): TrainingScaling {
  const defaults = {
    strength: defaultCategoryScaling(),
    agility: defaultCategoryScaling(),
    meditation: defaultCategoryScaling(),
    vitality: defaultCategoryScaling(),
  };
  if (!raw || typeof raw !== "object") return defaults;
  for (const key of ["strength", "agility", "meditation", "vitality"] as const) {
    if (!raw[key] || typeof raw[key] !== "object") {
      raw[key] = defaultCategoryScaling();
    }
  }
  return raw as TrainingScaling;
}

export function processSessionCompletion(
  scaling: TrainingScaling,
  category: keyof TrainingScaling,
  phase: number,
): TrainingScaling {
  const cat = { ...scaling[category] };
  const today = new Date().toISOString().split("T")[0];
  const maxTier = getMaxTier(phase);

  cat.sessionsCompleted += 1;
  cat.completionStreak += 1;
  cat.missedDays = 0;
  cat.lastSessionDate = today;

  if (cat.completionStreak >= STREAK_TO_UPGRADE && cat.tier < maxTier) {
    cat.tier = Math.min(cat.tier + 1, maxTier);
    cat.completionStreak = 0;
  }

  return { ...scaling, [category]: cat };
}

export function processMissedDay(
  scaling: TrainingScaling,
  category: keyof TrainingScaling,
): TrainingScaling {
  const cat = { ...scaling[category] };

  cat.missedDays += 1;
  cat.completionStreak = 0;

  if (cat.missedDays >= MISSED_TO_DOWNGRADE && cat.tier > 1) {
    cat.tier = Math.max(cat.tier - 1, 1);
    cat.missedDays = 0;
  }

  return { ...scaling, [category]: cat };
}

export function checkAndProcessMissedDays(
  scaling: TrainingScaling,
): TrainingScaling {
  const today = new Date().toISOString().split("T")[0];
  let updated = { ...scaling };

  for (const category of ["strength", "agility", "meditation", "vitality"] as const) {
    const cat = updated[category];
    if (cat.lastSessionDate && cat.lastSessionDate !== today) {
      const last = new Date(cat.lastSessionDate);
      const now = new Date(today);
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        const newMissed = diffDays - 1;
        const catCopy = { ...cat, missedDays: cat.missedDays + newMissed, completionStreak: 0 };
        if (catCopy.missedDays >= MISSED_TO_DOWNGRADE && catCopy.tier > 1) {
          catCopy.tier = Math.max(catCopy.tier - 1, 1);
          catCopy.missedDays = 0;
        }
        updated = { ...updated, [category]: catCopy };
      }
    }
  }

  return updated;
}

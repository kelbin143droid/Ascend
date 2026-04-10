import { Wind, Heart, Droplets, Zap, Clock, type LucideIcon } from "lucide-react";

export interface OnboardingDayConfig {
  title: string;
  subtitle: string;
  sessionId: string;
  sessions: string[];
  xpReward: number;
  icon: LucideIcon;
  category: string;
  color: string;
  description: string;
  duration: string;
}

export const ONBOARDING_CONFIG: Record<number, OnboardingDayConfig> = {
  1: {
    title: "Reset",
    subtitle: "Breathing exercises to center yourself",
    sessionId: "calm-breathing",
    sessions: ["calm-breathing"],
    xpReward: 5,
    icon: Wind,
    category: "BREATHING",
    color: "#8A5CFF",
    description: "Guided 4-2-6 breathing to reset your nervous system. This is your only task for today.",
    duration: "2 min",
  },
  2: {
    title: "Light Movement",
    subtitle: "Gentle stretches and mobility exercises",
    sessionId: "light-movement",
    sessions: ["light-movement"],
    xpReward: 5,
    icon: Heart,
    category: "MOVEMENT",
    color: "#EC4899",
    description: "Move your body for 3–5 minutes. Small movement wakes everything up.",
    duration: "3–5 min",
  },
  3: {
    title: "Hydration & Reflection",
    subtitle: "Nourish your body and mind",
    sessionId: "hydration-check",
    sessions: ["hydration-check", "quick-reflection"],
    xpReward: 5,
    icon: Droplets,
    category: "VITALITY",
    color: "#06B6D4",
    description: "Drink water, check in with your body, then take a quiet moment to reflect on what you noticed.",
    duration: "2–3 min",
  },
  4: {
    title: "Light Cardio",
    subtitle: "Boost your energy with light exercise",
    sessionId: "focus-block",
    sessions: ["focus-block"],
    xpReward: 5,
    icon: Zap,
    category: "CARDIO",
    color: "#F59E0B",
    description: "Three short cardio bursts — jog, jump, box. Gets your blood moving.",
    duration: "~1 min",
  },
  5: {
    title: "Sectograph Introduction",
    subtitle: "Visualize and organize your day",
    sessionId: "plan-tomorrow",
    sessions: ["plan-tomorrow"],
    xpReward: 5,
    icon: Clock,
    category: "PLANNING",
    color: "#6366F1",
    description: "Place one action into tomorrow's timeline. Reflect on this week's patterns.",
    duration: "1–2 min",
  },
};

export const TOTAL_ONBOARDING_DAYS = 5;
export const XP_PER_DAY = 5;
export const TOTAL_ONBOARDING_XP = TOTAL_ONBOARDING_DAYS * XP_PER_DAY;

export const LOCK_HOURS = 8;

export function getOnboardingLockInfo(onboardingDay: number, completedDays: number[]): {
  locked: boolean;
  unlockAt: number;
} {
  if (onboardingDay <= 1) return { locked: false, unlockAt: 0 };
  const prevDay = onboardingDay - 1;
  if (!completedDays.includes(prevDay)) return { locked: false, unlockAt: 0 };
  const tsKey = `ascend_ob_day${prevDay}_ts`;
  const ts = parseInt(localStorage.getItem(tsKey) || "0", 10);
  if (!ts) return { locked: false, unlockAt: 0 };
  const unlockAt = ts + LOCK_HOURS * 60 * 60 * 1000;
  return { locked: Date.now() < unlockAt, unlockAt };
}

export function getPostDay5LockInfo(): { locked: boolean; unlockAt: number } {
  const ts = parseInt(localStorage.getItem("ascend_ob_day5_ts") || "0", 10);
  if (!ts) return { locked: false, unlockAt: 0 };
  const unlockAt = ts + LOCK_HOURS * 60 * 60 * 1000;
  return { locked: Date.now() < unlockAt, unlockAt };
}

export function clearOnboardingTimestamps(): void {
  for (let d = 1; d <= TOTAL_ONBOARDING_DAYS; d++) {
    localStorage.removeItem(`ascend_ob_day${d}_ts`);
  }
}

import { Wind, Heart, Droplets, Zap, Clock, type LucideIcon } from "lucide-react";

export interface OnboardingDayConfig {
  title: string;
  subtitle: string;
  sessionId: string;
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
    xpReward: 5,
    icon: Droplets,
    category: "VITALITY",
    color: "#06B6D4",
    description: "Drink water, check in with your body, and note one honest observation.",
    duration: "1–2 min",
  },
  4: {
    title: "Light Cardio",
    subtitle: "Boost your energy with light exercise",
    sessionId: "focus-block",
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

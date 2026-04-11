import type { StatName } from "@shared/schema";

export const POST_DAYS_KEY = (id: string) => `ascend_dev_postdays_${id}`;
export const HABITS_TUTORIAL_KEY = "ascend_habits_tutorial_done";

export function getPostOnboardingDays(playerId: string): number {
  return parseInt(localStorage.getItem(POST_DAYS_KEY(playerId)) || "0", 10);
}

export function getDisplayDay(
  playerId: string,
  onboardingDay: number,
  isComplete: boolean
): number {
  if (!isComplete) return onboardingDay;
  return 6 + getPostOnboardingDays(playerId);
}

export function isHabitsTutorialDone(): boolean {
  return localStorage.getItem(HABITS_TUTORIAL_KEY) === "true";
}

export function markHabitsTutorialDone(): void {
  localStorage.setItem(HABITS_TUTORIAL_KEY, "true");
  window.dispatchEvent(new CustomEvent("ascend:habits-tutorial-done"));
}

const PROGRESSION_CACHE_KEY = "ascend_progression_v1";
const STAT_INTRO_KEY = "ascend_stat_intro_seen";
const XP_PER_LEVEL = 100;

export interface CachedProgression {
  level: number;
  exp: number;
  maxExp: number;
  totalExp: number;
  rank: string;
  statPoints: number;
  stats: Record<StatName, number>;
  statXP: Record<StatName, number>;
  bonusStats: Record<StatName, number>;
  lastUpdated: number;
}

export function getLevelFromTotalXP(totalXP: number): { level: number; remainingXP: number; xpForNext: number } {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const remainingXP = totalXP % XP_PER_LEVEL;
  return { level, remainingXP, xpForNext: XP_PER_LEVEL };
}

export interface StatProgression {
  level: number;
  currentXP: number;
  xpForNext: number;
  percent: number;
}

export function getStatProgression(statXP: number): StatProgression {
  const level = Math.floor(statXP / XP_PER_LEVEL) + 1;
  const currentXP = statXP % XP_PER_LEVEL;
  return { level, currentXP, xpForNext: XP_PER_LEVEL, percent: (currentXP / XP_PER_LEVEL) * 100 };
}

export function computeXPForHabit(durationMinutes: number, streak: number): number {
  let min = 10, max = 15;
  if (durationMinutes > 10) { min = 60; max = 100; }
  else if (durationMinutes > 3) { min = 25; max = 40; }
  const base = Math.floor(Math.random() * (max - min + 1)) + min;
  const streakTiers: [number, number][] = [[30, 2.0], [14, 1.5], [7, 1.25], [3, 1.1]];
  const multiplier = streakTiers.find(([days]) => streak >= days)?.[1] ?? 1;
  return Math.floor(base * multiplier);
}

export function syncPlayerToCache(player: {
  level: number; exp: number; maxExp: number; totalExp?: number; rank: string;
  statPoints?: number; stats?: any; statXP?: any; bonusStats?: any;
}): void {
  const empty = { strength: 0, agility: 0, sense: 0, vitality: 0 };
  try {
    const cached: CachedProgression = {
      level: player.level,
      exp: player.exp,
      maxExp: player.maxExp,
      totalExp: player.totalExp ?? 0,
      rank: player.rank,
      statPoints: player.statPoints ?? 0,
      stats: player.stats ?? empty,
      statXP: player.statXP ?? empty,
      bonusStats: player.bonusStats ?? empty,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(PROGRESSION_CACHE_KEY, JSON.stringify(cached));
  } catch {}
}

export function getCachedProgression(): CachedProgression | null {
  try {
    const raw = localStorage.getItem(PROGRESSION_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedProgression) : null;
  } catch { return null; }
}

export function clearProgressionCache(): void {
  try { localStorage.removeItem(PROGRESSION_CACHE_KEY); } catch {}
}

export function isStatIntroSeen(): boolean {
  return localStorage.getItem(STAT_INTRO_KEY) === "true";
}

export function markStatIntroSeen(): void {
  try { localStorage.setItem(STAT_INTRO_KEY, "true"); } catch {}
}

export const STAT_POINT_COST = 1;

import type { Player, Habit } from "@shared/schema";
import type { HabitCompletion } from "@shared/schema";
import { PHASE_STAT_CAPS, PHASE_NAMES } from "@shared/schema";

export interface PhaseRequirements {
  minStabilityScore: number;
  minCompletionRate: number;
  windowDays: number;
  minLevel: number;
  minAvgStat: number;
  description: string;
}

export const PHASE_REQUIREMENTS: Record<number, PhaseRequirements> = {
  2: {
    minStabilityScore: 55,
    minCompletionRate: 0.57,
    windowDays: 7,
    minLevel: 3,
    minAvgStat: 5,
    description: "Stability Score 55+ with 57%+ completion over 7 days",
  },
  3: {
    minStabilityScore: 65,
    minCompletionRate: 0.7,
    windowDays: 14,
    minLevel: 10,
    minAvgStat: 15,
    description: "Stability Score 65+ with 70%+ consistency over 14 days",
  },
  4: {
    minStabilityScore: 75,
    minCompletionRate: 0.75,
    windowDays: 21,
    minLevel: 20,
    minAvgStat: 35,
    description: "Stability Score 75+ with 75%+ consistency over 21 days",
  },
  5: {
    minStabilityScore: 85,
    minCompletionRate: 0.8,
    windowDays: 45,
    minLevel: 35,
    minAvgStat: 55,
    description: "Stability Score 85+ with 80%+ sustained consistency over 45 days",
  },
};

export const PHASE_PLANNING_UNLOCK = 3;
export const PHASE_TRIALS_UNLOCK = 4;

export function getStatCapForPhase(phase: number): number {
  return PHASE_STAT_CAPS[phase] || PHASE_STAT_CAPS[1];
}

export function getAverageStat(stats: { strength: number; agility: number; sense: number; vitality: number }): number {
  return (stats.strength + stats.agility + stats.sense + stats.vitality) / 4;
}

function calculateCompletionRate(
  completions: HabitCompletion[],
  habits: Habit[],
  windowDays: number
): number {
  if (habits.length === 0) return 0;

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - windowDays);

  const relevantCompletions = completions.filter(c => {
    const d = new Date(c.completedAt!);
    return d >= windowStart;
  });

  const activeHabits = habits.filter(h => h.active);
  if (activeHabits.length === 0) return 0;

  const dailyCompletionCounts: Record<string, Set<string>> = {};
  relevantCompletions.forEach(c => {
    const day = new Date(c.completedAt!).toLocaleDateString("en-CA");
    if (!dailyCompletionCounts[day]) dailyCompletionCounts[day] = new Set();
    dailyCompletionCounts[day].add(c.habitId);
  });

  let totalPossible = windowDays * activeHabits.length;
  let totalCompleted = 0;

  for (const day of Object.keys(dailyCompletionCounts)) {
    totalCompleted += dailyCompletionCounts[day].size;
  }

  return totalPossible > 0 ? totalCompleted / totalPossible : 0;
}

function calculateWeightedCompletionRate(
  completions: HabitCompletion[],
  habits: Habit[],
  windowDays: number
): number {
  if (habits.length === 0) return 0;

  const now = new Date();
  const activeHabits = habits.filter(h => h.active);
  if (activeHabits.length === 0) return 0;

  let weightedCompleted = 0;
  let weightedPossible = 0;

  for (let i = 0; i < windowDays; i++) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - i);
    const dayStr = dayDate.toLocaleDateString("en-CA");

    const recencyWeight = 1 - (i / windowDays) * 0.5;

    const dayCompletions = new Set(
      completions
        .filter(c => new Date(c.completedAt!).toLocaleDateString("en-CA") === dayStr)
        .map(c => c.habitId)
    );

    weightedCompleted += dayCompletions.size * recencyWeight;
    weightedPossible += activeHabits.length * recencyWeight;
  }

  return weightedPossible > 0 ? weightedCompleted / weightedPossible : 0;
}

function calculateStreakResilience(
  completions: HabitCompletion[],
  windowDays: number
): number {
  const now = new Date();
  const days: boolean[] = [];

  for (let i = 0; i < windowDays; i++) {
    const dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() - i);
    const dayStr = dayDate.toLocaleDateString("en-CA");
    days.push(
      completions.some(c => new Date(c.completedAt!).toLocaleDateString("en-CA") === dayStr)
    );
  }

  let recoveries = 0;
  let gaps = 0;

  for (let i = 1; i < days.length - 1; i++) {
    if (!days[i] && days[i - 1]) {
      gaps++;
    }
    if (days[i] && !days[i + 1]) {
      recoveries++;
    }
  }

  if (gaps === 0) return 1.0;
  return Math.min(1.0, recoveries / gaps);
}

export interface PhaseCheckResult {
  eligible: boolean;
  nextPhase: number;
  currentPhaseName: string;
  nextPhaseName: string;
  requirements: PhaseRequirements;
  current: {
    level: number;
    avgStat: number;
    completionRate: number;
    streakResilience: number;
    stabilityScore: number;
    windowDays: number;
  };
  missing: string[];
  progress: number;
}

export function checkPhaseEligibility(
  player: Player,
  habits: Habit[],
  completions: HabitCompletion[]
): PhaseCheckResult | null {
  const nextPhase = player.phase + 1;
  if (nextPhase > 5) return null;

  const requirements = PHASE_REQUIREMENTS[nextPhase];
  if (!requirements) return null;

  const avgStat = getAverageStat(player.stats);
  const stabilityScore = player.stability?.score ?? 50;

  const useWeighted = nextPhase >= 4;
  const completionRate = useWeighted
    ? calculateWeightedCompletionRate(completions, habits, requirements.windowDays)
    : calculateCompletionRate(completions, habits, requirements.windowDays);

  const streakResilience = calculateStreakResilience(completions, requirements.windowDays);

  const adjustedRate = completionRate * (0.8 + streakResilience * 0.2);

  const missing: string[] = [];

  if (player.level < requirements.minLevel) {
    missing.push(`Level ${requirements.minLevel} required (current: ${player.level})`);
  }
  if (avgStat < requirements.minAvgStat) {
    missing.push(`Avg stat ${requirements.minAvgStat} required (current: ${Math.floor(avgStat)})`);
  }
  if (adjustedRate < requirements.minCompletionRate) {
    missing.push(
      `${Math.round(requirements.minCompletionRate * 100)}% completion rate over ${requirements.windowDays} days required (current: ${Math.round(adjustedRate * 100)}%)`
    );
  }
  if (stabilityScore < requirements.minStabilityScore) {
    missing.push(
      `Stability Score ${requirements.minStabilityScore} required (current: ${stabilityScore})`
    );
  }

  const levelProgress = Math.min(1, player.level / requirements.minLevel);
  const statProgress = Math.min(1, avgStat / requirements.minAvgStat);
  const rateProgress = Math.min(1, adjustedRate / requirements.minCompletionRate);
  const stabilityProgress = Math.min(1, stabilityScore / requirements.minStabilityScore);
  const overallProgress = (levelProgress + statProgress + rateProgress + stabilityProgress) / 4;

  return {
    eligible: missing.length === 0,
    nextPhase,
    currentPhaseName: PHASE_NAMES[player.phase] || "Unknown",
    nextPhaseName: PHASE_NAMES[nextPhase] || "Unknown",
    requirements,
    current: {
      level: player.level,
      avgStat: Math.floor(avgStat),
      completionRate: Math.round(adjustedRate * 100) / 100,
      streakResilience: Math.round(streakResilience * 100) / 100,
      stabilityScore,
      windowDays: requirements.windowDays,
    },
    missing,
    progress: Math.round(overallProgress * 100) / 100,
  };
}

export function getPhaseVisualConfig(phase: number): {
  color: string;
  glowColor: string;
  particleIntensity: number;
  auraLayers: number;
  environmentTier: string;
  label: string;
} {
  switch (phase) {
    case 1:
      return {
        color: "#94a3b8",
        glowColor: "#94a3b840",
        particleIntensity: 0.2,
        auraLayers: 0,
        environmentTier: "minimal",
        label: PHASE_NAMES[1],
      };
    case 2:
      return {
        color: "#22c55e",
        glowColor: "#22c55e40",
        particleIntensity: 0.4,
        auraLayers: 1,
        environmentTier: "growing",
        label: PHASE_NAMES[2],
      };
    case 3:
      return {
        color: "#3b82f6",
        glowColor: "#3b82f640",
        particleIntensity: 0.6,
        auraLayers: 2,
        environmentTier: "dynamic",
        label: PHASE_NAMES[3],
      };
    case 4:
      return {
        color: "#a855f7",
        glowColor: "#a855f740",
        particleIntensity: 0.8,
        auraLayers: 3,
        environmentTier: "advanced",
        label: PHASE_NAMES[4],
      };
    case 5:
      return {
        color: "#ffd700",
        glowColor: "#ffd70040",
        particleIntensity: 1.0,
        auraLayers: 4,
        environmentTier: "epic",
        label: PHASE_NAMES[5],
      };
    default:
      return {
        color: "#6b7280",
        glowColor: "#6b728040",
        particleIntensity: 0.1,
        auraLayers: 0,
        environmentTier: "minimal",
        label: "Unknown",
      };
  }
}

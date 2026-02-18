import { PHASE_STAT_CAPS } from "@shared/schema";

export interface PhaseRequirements {
  minLevel: number;
  minAvgStat: number;
  minStreak: number;
}

export const PHASE_REQUIREMENTS: Record<number, PhaseRequirements> = {
  2: { minLevel: 5, minAvgStat: 10, minStreak: 7 },
  3: { minLevel: 15, minAvgStat: 25, minStreak: 14 },
  4: { minLevel: 30, minAvgStat: 50, minStreak: 14 },
  5: { minLevel: 50, minAvgStat: 75, minStreak: 14 },
};

export const PHASE_PLANNING_UNLOCK = 3;
export const PHASE_TRIALS_UNLOCK = 4;

export function getStatCapForPhase(phase: number): number {
  return PHASE_STAT_CAPS[phase] || PHASE_STAT_CAPS[1];
}

export function getAverageStat(stats: { strength: number; agility: number; sense: number; vitality: number }): number {
  return (stats.strength + stats.agility + stats.sense + stats.vitality) / 4;
}

export interface PhaseCheckResult {
  eligible: boolean;
  nextPhase: number;
  requirements: PhaseRequirements;
  current: { level: number; avgStat: number; streak: number };
  missing: string[];
}

export function checkPhaseEligibility(
  currentPhase: number,
  level: number,
  stats: { strength: number; agility: number; sense: number; vitality: number },
  streak: number
): PhaseCheckResult | null {
  const nextPhase = currentPhase + 1;
  if (nextPhase > 5) return null;

  const requirements = PHASE_REQUIREMENTS[nextPhase];
  if (!requirements) return null;

  const avgStat = getAverageStat(stats);
  const missing: string[] = [];

  if (level < requirements.minLevel) {
    missing.push(`Level ${requirements.minLevel} required (current: ${level})`);
  }
  if (avgStat < requirements.minAvgStat) {
    missing.push(`Avg stat ${requirements.minAvgStat} required (current: ${Math.floor(avgStat)})`);
  }
  if (streak < requirements.minStreak) {
    missing.push(`${requirements.minStreak}-day streak required (current: ${streak})`);
  }

  return {
    eligible: missing.length === 0,
    nextPhase,
    requirements,
    current: { level, avgStat: Math.floor(avgStat), streak },
    missing,
  };
}

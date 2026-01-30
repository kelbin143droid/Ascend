import { RANK_LEVEL_THRESHOLDS, RANK_UNLOCK_DATA, RANK_STAT_CAPS } from "@shared/schema";
import type { RankHistoryEntry } from "@shared/schema";

const RANK_ORDER = ["E", "D", "C", "B", "A", "S"];

export function getRankForLevel(level: number): string {
  for (const [rank, thresholds] of Object.entries(RANK_LEVEL_THRESHOLDS)) {
    if (level >= thresholds.min && level <= thresholds.max) {
      return rank;
    }
  }
  return "S";
}

export function isRankHigher(newRank: string, oldRank: string): boolean {
  const newIndex = RANK_ORDER.indexOf(newRank);
  const oldIndex = RANK_ORDER.indexOf(oldRank);
  return newIndex > oldIndex;
}

export function checkRankUp(
  currentLevel: number,
  currentRank: string
): { newRank: string; unlockData: typeof RANK_UNLOCK_DATA[string] } | null {
  const expectedRank = getRankForLevel(currentLevel);
  
  if (isRankHigher(expectedRank, currentRank)) {
    const unlockData = RANK_UNLOCK_DATA[expectedRank];
    if (unlockData) {
      return { newRank: expectedRank, unlockData };
    }
  }
  
  return null;
}

export function createRankHistoryEntry(rank: string, attribute: string): RankHistoryEntry {
  return {
    rank,
    unlocked: attribute,
    date: new Date().toISOString().split('T')[0],
  };
}

export function getStatCapForRank(rank: string): number {
  return RANK_STAT_CAPS[rank] || 25;
}

const STATS_KEY = "ascend_stats_v2";

export interface GameStats {
  hp: number;
  mana: number;
  missedSleepDays: number;
  missedBreathingDays: number;
  lastCheckedDate: string;
  consecutiveSleepGood: number;
  consecutiveBreathingDone: number;
}

export const MANA_MAX = 50;

const DEFAULT_STATS: GameStats = {
  hp: 100,
  mana: MANA_MAX,
  missedSleepDays: 0,
  missedBreathingDays: 0,
  lastCheckedDate: "",
  consecutiveSleepGood: 0,
  consecutiveBreathingDone: 0,
};

export function getStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_STATS };
}

function saveStats(s: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {}
}

export function recordSleepCheck(sleptWell: boolean): GameStats {
  const s = getStats();
  if (sleptWell) {
    s.missedSleepDays = 0;
    s.consecutiveSleepGood = Math.min(s.consecutiveSleepGood + 1, 7);
    if (s.consecutiveSleepGood >= 3) {
      s.hp = Math.min(100, s.hp + 0.5);
    }
  } else {
    s.consecutiveSleepGood = 0;
    s.missedSleepDays++;
    if (s.missedSleepDays >= 2) {
      s.hp = Math.max(0, +(s.hp - 1).toFixed(2));
      s.missedSleepDays = 0;
    }
  }
  saveStats(s);
  return s;
}

export function recordBreathingSession(completed: boolean): GameStats {
  const s = getStats();
  if (completed) {
    s.missedBreathingDays = 0;
    s.consecutiveBreathingDone = Math.min(s.consecutiveBreathingDone + 1, 7);
    if (s.consecutiveBreathingDone >= 3) {
      s.mana = Math.min(MANA_MAX, s.mana + 0.5);
    }
  } else {
    s.consecutiveBreathingDone = 0;
    s.missedBreathingDays++;
    if (s.missedBreathingDays >= 2) {
      s.mana = Math.max(0, +(s.mana - 1).toFixed(2));
      s.missedBreathingDays = 0;
    }
  }
  saveStats(s);
  return s;
}

export function applyDailyDecay(completedFlowIds: string[]): GameStats {
  const s = getStats();
  const today = new Date().toISOString().split("T")[0];
  if (s.lastCheckedDate === today) return s;

  const breathingCompleted = completedFlowIds.includes("phase1_meditation");
  recordBreathingSession(breathingCompleted);

  const fresh = getStats();
  fresh.lastCheckedDate = today;
  saveStats(fresh);
  return fresh;
}

export function getHPColor(hp: number): string {
  if (hp >= 75) return "#22c55e";
  if (hp >= 40) return "#f59e0b";
  return "#ef4444";
}

export function getManaColor(mana: number): string {
  if (mana >= 75) return "#3b82f6";
  if (mana >= 40) return "#a855f7";
  return "#7c3aed";
}

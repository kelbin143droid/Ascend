const STATS_KEY = "ascend_stats_v2";
const LEVEL_APPLIED_KEY = "ascend_stats_level_applied";

export const STATS_CHANGED_EVENT = "ascend:stats-changed";

export interface GameStats {
  hp: number;
  mana: number;
  missedSleepDays: number;
  missedBreathingDays: number;
  lastCheckedDate: string;
  consecutiveSleepGood: number;
  consecutiveBreathingDone: number;
}

export const HP_BASE = 100;
export const MANA_MAX = 50;
export const LEVEL_SCALE_PER_LEVEL = 0.10;

export function getMaxHP(level: number): number {
  const lvl = Math.max(1, Math.floor(level || 1));
  return Math.round(HP_BASE * (1 + LEVEL_SCALE_PER_LEVEL * (lvl - 1)));
}

export function getMaxMana(level: number): number {
  const lvl = Math.max(1, Math.floor(level || 1));
  return Math.round(MANA_MAX * (1 + LEVEL_SCALE_PER_LEVEL * (lvl - 1)));
}

const DEFAULT_STATS: GameStats = {
  hp: HP_BASE,
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(STATS_CHANGED_EVENT));
    }
  } catch {}
}

export function applyLevelUpStats(newLevel: number): { hp: number; mana: number; maxHp: number; maxMana: number } | null {
  try {
    const lvl = Math.max(1, Math.floor(newLevel || 1));
    const lastApplied = parseInt(localStorage.getItem(LEVEL_APPLIED_KEY) || "0", 10) || 0;
    if (lvl <= lastApplied) {
      return null;
    }
    const s = getStats();
    const maxHp = getMaxHP(lvl);
    const maxMana = getMaxMana(lvl);
    s.hp = maxHp;
    s.mana = maxMana;
    saveStats(s);
    localStorage.setItem(LEVEL_APPLIED_KEY, String(lvl));
    return { hp: s.hp, mana: s.mana, maxHp, maxMana };
  } catch {
    return null;
  }
}

export function initLevelBaseline(level: number): void {
  try {
    const lvl = Math.max(1, Math.floor(level || 1));
    const lastApplied = parseInt(localStorage.getItem(LEVEL_APPLIED_KEY) || "0", 10) || 0;

    if (lvl > lastApplied) {
      // Level has increased beyond what was last recorded — fill HP/Mana to
      // the new max without showing the level-up animation (silent catch-up).
      // This covers: first-ever launch, page reload after leveling up, and
      // any case where the XP/level was awarded server-side between sessions.
      applyLevelUpStats(lvl);
      return;
    }

    // LEVEL_APPLIED_KEY already equals the current level, but may have been
    // written by an older version of initLevelBaseline that set the key
    // without actually filling the stats.  Detect this by checking whether
    // HP and Mana are still sitting at the original base defaults — if so,
    // they were never initialized for this level and we correct them now.
    if (lvl > 1) {
      const s = getStats();
      if (s.hp <= HP_BASE && s.mana <= MANA_MAX) {
        const maxHp = getMaxHP(lvl);
        const maxMana = getMaxMana(lvl);
        s.hp = maxHp;
        s.mana = maxMana;
        saveStats(s);
      }
    }
  } catch {}
}

function getCurrentLevel(): number {
  try {
    return parseInt(localStorage.getItem(LEVEL_APPLIED_KEY) || "1", 10) || 1;
  } catch {
    return 1;
  }
}

export function recordSleepCheck(sleptWell: boolean): GameStats {
  const s = getStats();
  const maxHp = getMaxHP(getCurrentLevel());
  if (sleptWell) {
    s.missedSleepDays = 0;
    s.consecutiveSleepGood = Math.min(s.consecutiveSleepGood + 1, 7);
    if (s.consecutiveSleepGood >= 3) {
      s.hp = Math.min(maxHp, s.hp + 0.5);
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
  const maxMana = getMaxMana(getCurrentLevel());
  if (completed) {
    s.missedBreathingDays = 0;
    s.consecutiveBreathingDone = Math.min(s.consecutiveBreathingDone + 1, 7);
    if (s.consecutiveBreathingDone >= 3) {
      s.mana = Math.min(maxMana, s.mana + 0.5);
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

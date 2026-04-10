import { getStats, applyDailyDecay, recordBreathingSession, type GameStats } from "./statsSystem";

const FLOW_DATE_KEY = "ascend_light_movement_completed";
const COMPLETED_IDS_KEY = "ascend_completed_flow_ids";

export interface UserState {
  flowCompletedToday: boolean;
  completedFlowIds: string[];
  stats: GameStats;
}

export function getUserState(): UserState {
  const today = new Date().toISOString().split("T")[0];
  const completedDate = localStorage.getItem(FLOW_DATE_KEY) ?? "";
  const flowCompletedToday = completedDate === today;

  let completedFlowIds: string[] = [];
  try {
    const raw = localStorage.getItem(COMPLETED_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) completedFlowIds = parsed.ids ?? [];
    }
  } catch {}

  const stats = getStats();
  return { flowCompletedToday, completedFlowIds, stats };
}

export function markFlowCompleted(completedIds: string[]): GameStats {
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem(FLOW_DATE_KEY, today);
  localStorage.setItem(COMPLETED_IDS_KEY, JSON.stringify({ date: today, ids: completedIds }));

  const breathingDone = completedIds.includes("phase1_meditation");
  recordBreathingSession(breathingDone);

  return applyDailyDecay(completedIds);
}

export function getFlowCompletedToday(): boolean {
  const today = new Date().toISOString().split("T")[0];
  return (localStorage.getItem(FLOW_DATE_KEY) ?? "") === today;
}

import { getStats, applyDailyDecay, recordBreathingSession, type GameStats } from "./statsSystem";

const FLOW_DATE_KEY = "ascend_light_movement_completed";
const COMPLETED_IDS_KEY = "ascend_completed_flow_ids";
const SECTOGRAPH_TUTORIAL_KEY = "ascend_sectograph_tutorial_done";
const SECTOGRAPH_TUTORIAL_STEP_KEY = "ascend_sectograph_tutorial_step";
const DAY5_SLEEP_KEY = "ascend_day5_sleep_scheduled";
const DAY5_FLOW_KEY = "ascend_day5_flow_scheduled";

export interface UserState {
  flowCompletedToday: boolean;
  completedFlowIds: string[];
  stats: GameStats;
  sectographTutorialDone: boolean;
  sectographTutorialStep: number;
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
  const sectographTutorialDone = isSectographTutorialDone();
  const sectographTutorialStep = getSectographTutorialStep();

  return { flowCompletedToday, completedFlowIds, stats, sectographTutorialDone, sectographTutorialStep };
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

export function isSectographTutorialDone(): boolean {
  return localStorage.getItem(SECTOGRAPH_TUTORIAL_KEY) === "true";
}

export function markSectographTutorialDone(): void {
  localStorage.setItem(SECTOGRAPH_TUTORIAL_KEY, "true");
  localStorage.setItem(SECTOGRAPH_TUTORIAL_STEP_KEY, "3");
}

export function getSectographTutorialStep(): number {
  const raw = localStorage.getItem(SECTOGRAPH_TUTORIAL_STEP_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export function setSectographTutorialStep(step: number): void {
  localStorage.setItem(SECTOGRAPH_TUTORIAL_STEP_KEY, String(step));
}

export function isDayFiveSleepScheduled(): boolean {
  return localStorage.getItem(DAY5_SLEEP_KEY) === "true";
}

export function isDayFiveFlowScheduled(): boolean {
  return localStorage.getItem(DAY5_FLOW_KEY) === "true";
}

export function markDayFiveSleepScheduled(): void {
  localStorage.setItem(DAY5_SLEEP_KEY, "true");
  window.dispatchEvent(new CustomEvent("ascend:day5-sleep-scheduled"));
}

export function markDayFiveFlowScheduled(): void {
  localStorage.setItem(DAY5_FLOW_KEY, "true");
  window.dispatchEvent(new CustomEvent("ascend:day5-flow-scheduled"));
}

export function isDayFiveTutorialDone(): boolean {
  return isDayFiveSleepScheduled() && isDayFiveFlowScheduled();
}

export function clearDayFiveTutorial(): void {
  localStorage.removeItem(DAY5_SLEEP_KEY);
  localStorage.removeItem(DAY5_FLOW_KEY);
}

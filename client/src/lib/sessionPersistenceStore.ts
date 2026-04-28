const SESSION_KEY = "ascend_session_checkpoint";
const FLOW_KEY = "ascend_flow_checkpoint";
const MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours — discard stale sessions

export interface SessionCheckpoint {
  activityId: string;
  stepIdx: number;
  stepPhase: "ready" | "running" | "getready" | "done";
  timerRemaining: number;
  stepsCompleted: number[];
  stepsSkipped: number[];
  repsPerStep: Record<number, number>;
  savedAt: number;
}

export interface FlowCheckpoint {
  activityIdx: number;
  completedIds: string[];
  savedAt: number;
}

export function saveSession(c: SessionCheckpoint): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(c));
  } catch {}
}

export function loadSession(): SessionCheckpoint | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as SessionCheckpoint;
    if (Date.now() - c.savedAt > MAX_AGE_MS) {
      clearSession();
      return null;
    }
    return c;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

export function saveFlow(c: FlowCheckpoint): void {
  try {
    localStorage.setItem(FLOW_KEY, JSON.stringify(c));
  } catch {}
}

export function loadFlow(): FlowCheckpoint | null {
  try {
    const raw = localStorage.getItem(FLOW_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as FlowCheckpoint;
    if (Date.now() - c.savedAt > MAX_AGE_MS) {
      clearFlow();
      return null;
    }
    return c;
  } catch {
    return null;
  }
}

export function clearFlow(): void {
  try { localStorage.removeItem(FLOW_KEY); } catch {}
}

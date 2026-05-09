import { useState, useEffect, useCallback } from "react";

const PREFIX = "ascend_completed_ids_";

function todayKey(): string {
  return PREFIX + new Date().toISOString().split("T")[0];
}

function readIds(): Set<string> {
  try {
    const raw = localStorage.getItem(todayKey());
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>): void {
  try {
    localStorage.setItem(todayKey(), JSON.stringify([...ids]));
  } catch { /* noop */ }
}

export function useSessionProgress() {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => readIds());

  const markComplete = useCallback((activityId: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.add(activityId);
      writeIds(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onFocus      = () => setCompletedIds(readIds());
    const onVisibility = () => {
      if (document.visibilityState === "visible") setCompletedIds(readIds());
    };
    const onComplete = (e: Event) => {
      const detail = (e as CustomEvent<{ activityId: string }>).detail;
      if (detail?.activityId) markComplete(detail.activityId);
    };
    const onReset = () => {
      try { localStorage.removeItem(todayKey()); } catch { /* noop */ }
      setCompletedIds(new Set());
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("ascend:activity-completed", onComplete);
    window.addEventListener("ascend:sessions-reset", onReset);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("ascend:activity-completed", onComplete);
      window.removeEventListener("ascend:sessions-reset", onReset);
    };
  }, [markComplete]);

  return { completedIds, markComplete };
}

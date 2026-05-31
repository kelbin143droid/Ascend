import { useState, useEffect, useCallback, useRef } from "react";

const PREFIX = "ascend_completed_ids_";

function dateKey(): string {
  return new Date().toISOString().split("T")[0];
}

function todayKey(): string {
  return PREFIX + dateKey();
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

  // Track the active date so we can detect midnight rollovers in long-lived tabs.
  const activeDateRef = useRef(dateKey());

  const refresh = useCallback(() => {
    const today = dateKey();
    if (today !== activeDateRef.current) {
      // Day has changed — clear stale state and start fresh.
      activeDateRef.current = today;
      setCompletedIds(new Set());
    } else {
      setCompletedIds(readIds());
    }
  }, []);

  const markComplete = useCallback((activityId: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.add(activityId);
      writeIds(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onFocus      = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onComplete = (e: Event) => {
      const detail = (e as CustomEvent<{ activityId?: string; activityIds?: string[] }>).detail;
      const ids = detail?.activityIds?.length ? detail.activityIds : detail?.activityId ? [detail.activityId] : [];
      if (!ids.length) return;
      setCompletedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        writeIds(next);
        return next;
      });
    };
    const onReset = () => {
      try { localStorage.removeItem(todayKey()); } catch { /* noop */ }
      setCompletedIds(new Set());
    };

    // Poll once per minute to catch midnight rollover even without a focus event.
    const rolloverInterval = setInterval(() => {
      if (dateKey() !== activeDateRef.current) refresh();
    }, 60_000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("ascend:activity-completed", onComplete);
    window.addEventListener("ascend:sessions-reset", onReset);
    return () => {
      clearInterval(rolloverInterval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("ascend:activity-completed", onComplete);
      window.removeEventListener("ascend:sessions-reset", onReset);
    };
  }, [markComplete, refresh]);

  return { completedIds, markComplete };
}

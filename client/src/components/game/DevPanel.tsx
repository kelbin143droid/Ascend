import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, RotateCcw, Info } from "lucide-react";

interface DevStatus {
  onboardingDay: number;
  onboardingCompleted: boolean;
  streak: number;
  phase: number;
  level: number;
  stabilityScore: number;
  stabilityState: string;
  totalCompletions: number;
  totalActiveHabits: number;
  distinctActiveDays: number;
  lastActiveDate: string | null;
  daysSinceLastActivity: number;
  tabUnlocks: Record<string, { unlockDay: number; unlocked: boolean }>;
}

interface SimulateResult {
  success: boolean;
  daysSimulated: number;
  completionsCreated: number;
  newOnboardingDay: number;
  newStreak: number;
  distinctActiveDays: number;
}

export function DevPanel() {
  const { player } = useGame();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DevStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [daysInput, setDaysInput] = useState(1);

  const fetchStatus = async () => {
    if (!player?.id) return;
    try {
      const res = await fetch(`/api/player/${player.id}/dev/status`);
      if (res.ok) setStatus(await res.json());
    } catch {}
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchStatus();
  };

  const dispatchDay7Event = (done: boolean) => {
    window.dispatchEvent(new CustomEvent("ascend:day7done", { detail: { done } }));
  };

  const simulateDays = async (days: number, completeHabits: boolean) => {
    if (!player?.id || loading) return;
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch(`/api/player/${player.id}/dev/simulate-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, completeHabits }),
      });
      if (res.ok) {
        const data: SimulateResult = await res.json();
        // When first reaching Day 7 (not already done), clear so the follow-through shows
        const alreadyDone = localStorage.getItem("ascend_day7_followthrough_done") === "true";
        if (data.newOnboardingDay >= 7 && !alreadyDone) {
          localStorage.removeItem("ascend_day7_followthrough_done");
          localStorage.removeItem("ascend_day7_completed_date");
          localStorage.removeItem("ascend_day7_session_completed");
          localStorage.removeItem("ascend_light_movement_completed");
          dispatchDay7Event(false);
        }
        setLastResult(`+${data.daysSimulated}d → Day ${data.newOnboardingDay}, ${data.completionsCreated} completions, streak ${data.newStreak}`);
        queryClient.invalidateQueries();
        fetchStatus();
      } else {
        setLastResult("Error simulating");
      }
    } catch {
      setLastResult("Error simulating");
    }
    setLoading(false);
  };

  const goBackDay = async () => {
    if (!player?.id || loading) return;
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch(`/api/player/${player.id}/dev/go-back-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        // If going back below Day 7, restore the Day 7 screen so it shows again
        if (data.newOnboardingDay < 7) {
          localStorage.removeItem("ascend_day7_followthrough_done");
          localStorage.removeItem("ascend_day7_completed_date");
          localStorage.removeItem("ascend_day7_session_completed");
          localStorage.removeItem("ascend_light_movement_completed");
          dispatchDay7Event(false);
        }
        setLastResult(`← Day ${data.newOnboardingDay}, removed ${data.removedCompletions} completions`);
        queryClient.invalidateQueries();
        fetchStatus();
      } else {
        setLastResult("Error going back");
      }
    } catch {
      setLastResult("Error going back");
    }
    setLoading(false);
  };

  const goForwardDay = async () => {
    if (!player?.id || loading) return;
    await simulateDays(1, true);
  };

  const resetProgress = async () => {
    if (!player?.id || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/player/${player.id}/reset-progress`, { method: "POST" });
      localStorage.removeItem("ascend_day7_followthrough_done");
      localStorage.removeItem("ascend_day7_completed_date");
      localStorage.removeItem("ascend_day7_session_completed");
      localStorage.removeItem("ascend_light_movement_completed");
      dispatchDay7Event(false);
      if (res.ok) {
        setLastResult("Progress reset to Day 1");
      } else {
        setLastResult("Reset partial — refresh if needed");
      }
      queryClient.invalidateQueries();
      fetchStatus();
    } catch {
      setLastResult("Error resetting");
      queryClient.invalidateQueries();
    }
    setLoading(false);
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  const skipDay7Screen = () => {
    const yesterday = getYesterdayStr();
    localStorage.setItem("ascend_day7_followthrough_done", "true");
    localStorage.setItem("ascend_day7_completed_date", yesterday);
    localStorage.setItem("ascend_day7_session_completed", "true");
    localStorage.removeItem("ascend_light_movement_completed");
    dispatchDay7Event(true);
    setLastResult("Day 7 skipped → Day 8 home");
    queryClient.invalidateQueries();
  };

  const jumpToDay8 = async () => {
    if (!player?.id || loading) return;
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch(`/api/player/${player.id}/dev/status`);
      const currentStatus: DevStatus = res.ok ? await res.json() : null;
      const currentDay = currentStatus?.onboardingDay ?? 0;
      if (currentDay < 7) {
        const daysNeeded = 7 - currentDay;
        const simRes = await fetch(`/api/player/${player.id}/dev/simulate-day`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: daysNeeded, completeHabits: true }),
        });
        if (!simRes.ok) { setLastResult("Error simulating to Day 7"); setLoading(false); return; }
      }
      const yesterday = getYesterdayStr();
      localStorage.setItem("ascend_day7_followthrough_done", "true");
      localStorage.setItem("ascend_day7_completed_date", yesterday);
      localStorage.setItem("ascend_day7_session_completed", "true");
      localStorage.removeItem("ascend_light_movement_completed");
      dispatchDay7Event(true);
      setLastResult(`Jumped to Day 8 home`);
      queryClient.invalidateQueries();
      fetchStatus();
    } catch {
      setLastResult("Error jumping to Day 8");
    }
    setLoading(false);
  };

  const restoreDay7Screen = () => {
    localStorage.removeItem("ascend_day7_followthrough_done");
    localStorage.removeItem("ascend_day7_completed_date");
    localStorage.removeItem("ascend_day7_session_completed");
    localStorage.removeItem("ascend_light_movement_completed");
    dispatchDay7Event(false);
    setLastResult("Day 7 screen restored");
    queryClient.invalidateQueries();
  };

  const resetToday = async () => {
    if (!player?.id || loading) return;
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch(`/api/player/${player.id}/dev/reset-today`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        localStorage.removeItem("ascend_day7_session_completed");
        localStorage.removeItem("ascend_light_movement_completed");
        setLastResult(`Today reset — ${data.removed} session(s) cleared`);
        queryClient.invalidateQueries();
        fetchStatus();
      } else {
        setLastResult("Error resetting today");
      }
    } catch {
      setLastResult("Error resetting today");
    }
    setLoading(false);
  };

  if (!player?.id) return null;

  return (
    <div
      className="fixed bottom-20 right-3 z-[60]"
      style={{ maxWidth: "280px" }}
    >
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
        style={{
          backgroundColor: "rgba(234,179,8,0.15)",
          border: "1px solid rgba(234,179,8,0.3)",
          color: "rgba(234,179,8,0.9)",
        }}
        data-testid="button-dev-panel-toggle"
      >
        <Zap className="w-3 h-3" />
        DEV
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {open && (
        <div
          className="absolute bottom-10 right-0 rounded-xl p-4 w-72"
          style={{
            backgroundColor: "rgba(15,15,20,0.97)",
            border: "1px solid rgba(234,179,8,0.2)",
            backdropFilter: "blur(12px)",
          }}
          data-testid="dev-panel"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(234,179,8,0.8)" }}>
              Test Tools
            </span>
            <button onClick={fetchStatus} className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Info className="w-3 h-3 inline mr-0.5" />refresh
            </button>
          </div>

          {status && (
            <div className="space-y-1.5 mb-3">
              <div className="grid grid-cols-2 gap-1.5">
                <StatusItem label="Day" value={String(status.onboardingDay)} />
                <StatusItem label="Streak" value={String(status.streak)} />
                <StatusItem label="Phase" value={String(status.phase)} />
                <StatusItem label="Level" value={String(status.level)} />
                <StatusItem label="Stability" value={`${status.stabilityScore}`} />
                <StatusItem label="State" value={status.stabilityState} />
                <StatusItem label="Active Days" value={String(status.distinctActiveDays)} />
                <StatusItem label="Last Active" value={status.lastActiveDate ?? "never"} />
              </div>

              <div className="mt-2">
                <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Tab Unlocks
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(status.tabUnlocks).map(([tab, info]) => (
                    <span
                      key={tab}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: info.unlocked ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                        color: info.unlocked ? "rgba(34,197,94,0.8)" : "rgba(255,255,255,0.25)",
                        border: `1px solid ${info.unlocked ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {tab} (d{info.unlockDay})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2 mb-1">
              <button
                onClick={goBackDay}
                disabled={loading}
                className="flex-1 text-[10px] font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                style={{
                  backgroundColor: loading ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.2)",
                  color: loading ? "rgba(168,85,247,0.4)" : "rgba(168,85,247,0.9)",
                }}
                data-testid="button-prev-day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous Day
              </button>
              <button
                onClick={goForwardDay}
                disabled={loading}
                className="flex-1 text-[10px] font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                style={{
                  backgroundColor: loading ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  color: loading ? "rgba(34,197,94,0.4)" : "rgba(34,197,94,0.9)",
                }}
                data-testid="button-next-day"
              >
                Next Day
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={resetToday}
              disabled={loading}
              className="w-full text-[10px] font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
              style={{
                backgroundColor: loading ? "rgba(34,211,238,0.04)" : "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.2)",
                color: loading ? "rgba(34,211,238,0.35)" : "rgba(34,211,238,0.85)",
              }}
              data-testid="button-reset-today"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Today's Sessions
            </button>

            <div className="flex items-center gap-2">
              <label className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Days:</label>
              <input
                type="number"
                min={1}
                max={30}
                value={daysInput}
                onChange={e => setDaysInput(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                className="w-12 text-center text-xs rounded px-1 py-0.5"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.8)",
                }}
                data-testid="input-dev-days"
              />
              <div className="flex gap-1">
                {[1, 3, 7].map(d => (
                  <button
                    key={d}
                    onClick={() => setDaysInput(d)}
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: daysInput === d ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.04)",
                      color: daysInput === d ? "rgba(234,179,8,0.8)" : "rgba(255,255,255,0.3)",
                      border: `1px solid ${daysInput === d ? "rgba(234,179,8,0.2)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => simulateDays(daysInput, true)}
                disabled={loading}
                className="flex-1 text-[10px] font-medium py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: loading ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  color: loading ? "rgba(34,197,94,0.4)" : "rgba(34,197,94,0.9)",
                }}
                data-testid="button-simulate-with-habits"
              >
                +{daysInput}d with habits
              </button>
              <button
                onClick={() => simulateDays(daysInput, false)}
                disabled={loading}
                className="flex-1 text-[10px] font-medium py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: loading ? "rgba(59,130,246,0.05)" : "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  color: loading ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.9)",
                }}
                data-testid="button-simulate-guided-only"
              >
                +{daysInput}d guided only
              </button>
            </div>

            <button
              onClick={jumpToDay8}
              disabled={loading}
              className="w-full text-[10px] font-medium py-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: loading ? "rgba(34,211,238,0.04)" : "rgba(34,211,238,0.12)",
                border: "1px solid rgba(34,211,238,0.2)",
                color: loading ? "rgba(34,211,238,0.4)" : "rgba(34,211,238,0.9)",
              }}
              data-testid="button-jump-day8"
            >
              Jump to Day 8 →
            </button>

            <div className="flex gap-2">
              <button
                onClick={skipDay7Screen}
                className="flex-1 text-[10px] font-medium py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: "rgba(234,179,8,0.08)",
                  border: "1px solid rgba(234,179,8,0.15)",
                  color: "rgba(234,179,8,0.8)",
                }}
                data-testid="button-skip-day7"
              >
                Skip Day 7
              </button>
              <button
                onClick={restoreDay7Screen}
                className="flex-1 text-[10px] font-medium py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: "rgba(234,179,8,0.04)",
                  border: "1px solid rgba(234,179,8,0.1)",
                  color: "rgba(234,179,8,0.5)",
                }}
                data-testid="button-restore-day7"
              >
                Show Day 7
              </button>
            </div>

            <button
              onClick={resetProgress}
              disabled={loading}
              className="w-full text-[10px] font-medium py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
              style={{
                backgroundColor: loading ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: loading ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.8)",
              }}
              data-testid="button-reset-progress"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Day 1
            </button>
          </div>

          {lastResult && (
            <div
              className="mt-2 text-[10px] px-2 py-1.5 rounded"
              style={{
                backgroundColor: "rgba(234,179,8,0.06)",
                border: "1px solid rgba(234,179,8,0.12)",
                color: "rgba(234,179,8,0.7)",
              }}
              data-testid="text-dev-result"
            >
              {lastResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded px-2 py-1"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <p className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</p>
      <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{value}</p>
    </div>
  );
}

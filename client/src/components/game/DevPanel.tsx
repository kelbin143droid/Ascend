import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, RotateCcw, Info, SkipForward } from "lucide-react";
import { clearOnboardingTimestamps } from "@/features/onboarding/onboardingConfig";

const DAY_SESSION_MAP: Record<number, { sessionId: string; stat: string; durationMinutes: number }> = {
  1: { sessionId: "calm-breathing",  stat: "sense",   durationMinutes: 2 },
  2: { sessionId: "light-movement",  stat: "agility", durationMinutes: 3 },
  3: { sessionId: "hydration-check", stat: "vitality", durationMinutes: 1 },
  4: { sessionId: "focus-block",     stat: "sense",   durationMinutes: 3 },
  5: { sessionId: "plan-tomorrow",   stat: "vitality", durationMinutes: 1 },
};

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

  const simulateDays = async (days: number, completeHabits: boolean) => {
    if (!player?.id || loading) return;
    setLoading(true);
    setLastResult(null);
    clearOnboardingTimestamps();
    sessionStorage.removeItem("ascend_just_completed_day");
    try {
      const res = await fetch(`/api/player/${player.id}/dev/simulate-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, completeHabits }),
      });
      if (res.ok) {
        const data: SimulateResult = await res.json();
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
    clearOnboardingTimestamps();
    sessionStorage.removeItem("ascend_just_completed_day");
    try {
      const res = await fetch(`/api/player/${player.id}/dev/go-back-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
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
    clearOnboardingTimestamps();
    sessionStorage.removeItem("ascend_just_completed_day");
    localStorage.removeItem("ascend_day3_hydration_done");
    try {
      const res = await fetch(`/api/player/${player.id}/reset-progress`, { method: "POST" });
      localStorage.removeItem("ascend_light_movement_completed");
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

  const jumpToDaily = async () => {
    if (!player?.id || loading) return;
    setLoading(true);
    setLastResult(null);
    clearOnboardingTimestamps();
    sessionStorage.removeItem("ascend_just_completed_day");
    localStorage.removeItem("ascend_day3_hydration_done");
    try {
      const res = await fetch(`/api/player/${player.id}/dev/status`);
      const currentStatus: DevStatus = res.ok ? await res.json() : null;
      const currentDay = currentStatus?.onboardingDay ?? 0;
      if (currentDay < 5) {
        const daysNeeded = 5 - currentDay;
        const simRes = await fetch(`/api/player/${player.id}/dev/simulate-day`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: daysNeeded, completeHabits: true }),
        });
        if (!simRes.ok) { setLastResult("Error simulating to Day 5"); setLoading(false); return; }
      }
      localStorage.removeItem("ascend_light_movement_completed");
      setLastResult("Jumped to Daily Flow home");
      queryClient.invalidateQueries();
      fetchStatus();
    } catch {
      setLastResult("Error jumping to Daily Flow");
    }
    setLoading(false);
  };

  const skipSession = async () => {
    if (!player?.id || loading) return;
    setLoading(true);
    setLastResult(null);
    clearOnboardingTimestamps();
    sessionStorage.removeItem("ascend_just_completed_day");
    localStorage.removeItem("ascend_day3_hydration_done");
    try {
      const currentStatus: DevStatus | null = status ?? await (async () => {
        const r = await fetch(`/api/player/${player.id}/dev/status`);
        return r.ok ? r.json() : null;
      })();
      const day = currentStatus?.onboardingDay ?? 1;
      const sessionInfo = DAY_SESSION_MAP[day];
      if (!sessionInfo) {
        setLastResult(`No session to skip on Day ${day}`);
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/player/${player.id}/complete-guided-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionInfo),
      });
      if (res.ok) {
        if (day === 2) localStorage.removeItem("ascend_light_movement_completed");
        setLastResult(`Session skipped — Day ${day} (${sessionInfo.sessionId})`);
        queryClient.invalidateQueries();
        fetchStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        setLastResult(`Skip failed: ${err.error ?? res.status}`);
      }
    } catch {
      setLastResult("Error skipping session");
    }
    setLoading(false);
  };

  const resetToday = async () => {
    if (!player?.id || loading) return;
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch(`/api/player/${player.id}/dev/reset-today`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        localStorage.removeItem("ascend_light_movement_completed");
        window.dispatchEvent(new CustomEvent("ascend:sessions-reset"));
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

            <div className="flex gap-2">
              <button
                onClick={skipSession}
                disabled={loading}
                className="flex-1 text-[10px] font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                style={{
                  backgroundColor: loading ? "rgba(234,179,8,0.04)" : "rgba(234,179,8,0.12)",
                  border: "1px solid rgba(234,179,8,0.25)",
                  color: loading ? "rgba(234,179,8,0.35)" : "rgba(234,179,8,0.9)",
                }}
                data-testid="button-skip-session"
              >
                <SkipForward className="w-3 h-3" />
                Skip Session
              </button>
              <button
                onClick={resetToday}
                disabled={loading}
                className="flex-1 text-[10px] font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                style={{
                  backgroundColor: loading ? "rgba(34,211,238,0.04)" : "rgba(34,211,238,0.1)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  color: loading ? "rgba(34,211,238,0.35)" : "rgba(34,211,238,0.85)",
                }}
                data-testid="button-reset-today"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Today
              </button>
            </div>

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
              onClick={jumpToDaily}
              disabled={loading}
              className="w-full text-[10px] font-medium py-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: loading ? "rgba(34,211,238,0.04)" : "rgba(34,211,238,0.12)",
                border: "1px solid rgba(34,211,238,0.2)",
                color: loading ? "rgba(34,211,238,0.4)" : "rgba(34,211,238,0.9)",
              }}
              data-testid="button-jump-daily-flow"
            >
              Jump to Daily Flow →
            </button>

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

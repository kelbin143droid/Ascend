import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronUp, ChevronDown, Zap, RotateCcw, SkipForward, TrendingUp, Flame } from "lucide-react";

interface DevStatus {
  streak: number;
  phase: number;
  level: number;
  stabilityScore: number;
}

export function DevPanel() {
  const { player, levelUp } = useGame();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DevStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!player?.id) return;
    try {
      const res = await fetch(`/api/player/${player.id}/dev/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus({
          streak: data.streak,
          phase: data.phase,
          level: data.level,
          stabilityScore: data.stabilityScore,
        });
      }
    } catch {}
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchStatus();
  };

  const skipToNextDay = async () => {
    if (!player?.id || loading) return;
    setLoading(true);
    setLastResult(null);
    sessionStorage.removeItem("ascend_just_completed_day");
    try {
      const res = await fetch(`/api/player/${player.id}/dev/simulate-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 1, completeHabits: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastResult(`Skipped to next day — streak ${data.newStreak}`);
        queryClient.invalidateQueries();
        fetchStatus();
      } else {
        setLastResult("Error skipping day");
      }
    } catch {
      setLastResult("Error skipping day");
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

  const triggerLevelUp = () => {
    levelUp();
    setLastResult("Level up triggered");
  };

  const triggerStreakAnim = () => {
    const streak = player?.streak ?? status?.streak ?? 7;
    window.dispatchEvent(
      new CustomEvent("ascend:show-streak-animation", { detail: { streak } })
    );
    setLastResult(`Streak animation shown (${streak} days)`);
  };

  const resetToIntro = () => {
    localStorage.clear();
    sessionStorage.clear();
    setLastResult("Wiping data — reloading…");
    setTimeout(() => window.location.reload(), 300);
  };

  if (!player?.id) return null;

  return (
    <div className="fixed z-[60]" style={{ bottom: "84px", right: "20px", maxWidth: "260px" }}>
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
          className="absolute bottom-10 right-0 rounded-xl p-4 w-64"
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
              refresh
            </button>
          </div>

          {(status || player) && (
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <StatusItem label="Level" value={String(status?.level ?? player?.level ?? "—")} />
              <StatusItem label="Streak" value={String(status?.streak ?? player?.streak ?? "—")} />
              <StatusItem label="Phase" value={String(status?.phase ?? player?.phase ?? "—")} />
              <StatusItem label="Stability" value={String(status?.stabilityScore ?? "—")} />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={skipToNextDay}
                disabled={loading}
                className="flex-1 text-[10px] font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                style={{
                  backgroundColor: loading ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  color: loading ? "rgba(34,197,94,0.4)" : "rgba(34,197,94,0.9)",
                }}
                data-testid="button-skip-next-day"
              >
                <SkipForward className="w-3 h-3" />
                Skip Day
              </button>
              <button
                onClick={resetToday}
                disabled={loading}
                className="flex-1 text-[10px] font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
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

            <div className="flex gap-2">
              <button
                onClick={triggerLevelUp}
                className="flex-1 text-[10px] font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                style={{
                  backgroundColor: "rgba(0,200,255,0.12)",
                  border: "1px solid rgba(0,200,255,0.25)",
                  color: "rgba(0,200,255,0.9)",
                }}
                data-testid="button-trigger-level-up"
              >
                <TrendingUp className="w-3 h-3" />
                Level Up
              </button>
              <button
                onClick={triggerStreakAnim}
                className="flex-1 text-[10px] font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                style={{
                  backgroundColor: "rgba(249,115,22,0.12)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  color: "rgba(249,115,22,0.9)",
                }}
                data-testid="button-trigger-streak-anim"
              >
                <Flame className="w-3 h-3" />
                Streak Anim
              </button>
            </div>

            <button
              onClick={resetToIntro}
              className="w-full text-[10px] font-medium py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
              style={{
                backgroundColor: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.3)",
                color: "rgba(251,191,36,0.9)",
              }}
              data-testid="button-reset-to-intro"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Intro (full wipe)
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

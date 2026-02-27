import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Play, Calendar, Sparkles, Zap, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { PHASE_NAMES } from "@shared/schema";

interface HomeData {
  phase: { number: number; name: string };
  stability: { score: number; label: string };
  flow: { value: number; label: string; trending: "rising" | "steady" | "cooling" };
  insight: string;
  todaysFocus: string;
  nextAction: { habitId: string; name: string; stat: string; durationMinutes: number } | null;
  completedToday: number;
  totalActive: number;
}

const STAT_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

export default function HomePage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [, setLocation] = useLocation();
  const [glowPulse, setGlowPulse] = useState(false);
  const [flowAnimating, setFlowAnimating] = useState(false);
  const [prevFlowValue, setPrevFlowValue] = useState<number | null>(null);

  const { data: homeData, isLoading } = useQuery<HomeData>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/home`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const phase = homeData?.phase || { number: player?.phase ?? 1, name: PHASE_NAMES[player?.phase ?? 1] || "Stabilization" };
  const stability = homeData?.stability || { score: player?.stability?.score ?? 50, label: "Developing" };
  const flow = homeData?.flow || { value: 0, label: "Awaiting Action", trending: "steady" as const };
  const insight = homeData?.insight || "Momentum begins with a small action.";
  const todaysFocus = homeData?.todaysFocus || "Start your first habit to activate Flow.";
  const nextAction = homeData?.nextAction;

  useEffect(() => {
    if (prevFlowValue !== null && flow.value !== prevFlowValue) {
      setFlowAnimating(true);
      if (flow.value > prevFlowValue) {
        setGlowPulse(true);
        setTimeout(() => setGlowPulse(false), 1200);
      }
      setTimeout(() => setFlowAnimating(false), 800);
    }
    setPrevFlowValue(flow.value);
  }, [flow.value, prevFlowValue]);

  const handleStartAction = () => {
    setLocation("/habits");
  };

  const flowColor = flow.value >= 70 ? "#22c55e" : flow.value >= 30 ? "#f59e0b" : colors.primary;

  return (
    <SystemLayout>
      <div
        className="flex flex-col gap-4 py-2 max-w-md mx-auto w-full relative"
        data-testid="home-page"
      >
        {glowPulse && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-10"
            style={{
              background: `radial-gradient(ellipse at center, ${colors.primary}15 0%, transparent 70%)`,
              animation: "glowPulse 1.2s ease-out forwards",
            }}
          />
        )}

        <div
          data-testid="phase-card"
          className="rounded-xl px-4 py-3 relative overflow-hidden"
          style={{
            backgroundColor: `${colors.surface || colors.background}cc`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>
                Phase {phase.number}
              </div>
              <div className="text-lg font-display font-bold" style={{ color: colors.text }}>
                {phase.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-bold" style={{ color: colors.primary }}>
                {stability.score}
              </div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                {stability.label}
              </div>
            </div>
          </div>
        </div>

        <div
          data-testid="flow-meter"
          className="rounded-xl p-4"
          style={{
            backgroundColor: `${colors.surface || colors.background}cc`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: flowColor }} />
              <span className="text-xs font-display font-bold uppercase tracking-wider" style={{ color: colors.text }}>
                Flow State
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {flow.trending === "rising" && <TrendingUp size={12} className="text-green-400" />}
              {flow.trending === "cooling" && <TrendingDown size={12} className="text-amber-400" />}
              {flow.trending === "steady" && <Minus size={12} style={{ color: colors.textMuted }} />}
              <span className="text-[11px] font-medium" style={{ color: flowColor }}>
                {flow.label}
              </span>
            </div>
          </div>

          <div className="relative h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.surfaceBorder}60` }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${flow.value}%`,
                background: `linear-gradient(90deg, ${flowColor}80, ${flowColor})`,
                boxShadow: flow.value > 30 ? `0 0 8px ${flowColor}40` : undefined,
                transition: flowAnimating ? "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" : "width 0.7s ease",
              }}
              data-testid="flow-bar"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>0</span>
            <span className="text-xs font-mono font-bold" style={{ color: flowColor }}>{flow.value}</span>
            <span className="text-[9px] font-mono" style={{ color: colors.textMuted }}>100</span>
          </div>
        </div>

        <div
          data-testid="coach-insight-card"
          className="rounded-xl px-4 py-3"
          style={{
            backgroundColor: `${colors.primary}08`,
            border: `1px solid ${colors.primary}20`,
          }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: colors.primary }} />
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
              {insight}
            </p>
          </div>
        </div>

        <div
          data-testid="todays-focus-card"
          className="rounded-xl px-4 py-3"
          style={{
            backgroundColor: `${colors.surface || colors.background}cc`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Target size={12} style={{ color: colors.textMuted }} />
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: colors.textMuted }}>
              Today's Focus
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: colors.text }}>
            {todaysFocus}
          </p>
          {homeData && homeData.totalActive > 0 && (
            <div className="mt-1.5 text-[10px] font-mono" style={{ color: colors.textMuted }}>
              {homeData.completedToday}/{homeData.totalActive} complete
            </div>
          )}
        </div>

        <button
          data-testid="button-start-next-action"
          onClick={handleStartAction}
          className="w-full py-3.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98]"
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
            boxShadow: `0 0 20px ${colors.primaryGlow}40`,
          }}
        >
          {nextAction ? (
            <span className="flex items-center justify-center gap-2">
              <Play size={16} />
              Start Next Action
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Play size={16} />
              {homeData?.totalActive === 0 ? "Create First Habit" : "All Done Today"}
            </span>
          )}
        </button>

        <button
          data-testid="button-view-schedule"
          onClick={() => setLocation("/schedule")}
          className="w-full py-2.5 rounded-xl font-display text-xs uppercase tracking-wider transition-all"
          style={{
            backgroundColor: "transparent",
            color: colors.textMuted,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Calendar size={14} />
            View Schedule
          </span>
        </button>
      </div>

      <style>{`
        @keyframes glowPulse {
          0% { opacity: 0; transform: scale(0.95); }
          30% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.02); }
        }
      `}</style>
    </SystemLayout>
  );
}

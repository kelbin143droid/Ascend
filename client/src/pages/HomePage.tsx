import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useLocation } from "wouter";
import { Play, Calendar, Sparkles, Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PHASE_NAMES } from "@shared/schema";

interface HomeData {
  phase: { number: number; name: string };
  stability: { score: number; label: string };
  flow: { value: number; label: string; trending: "rising" | "steady" | "cooling" };
  insight: string;
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
  const flow = homeData?.flow || { value: 0, label: "Starting", trending: "steady" as const };
  const insight = homeData?.insight || "Start a quick session to build momentum today.";
  const nextAction = homeData?.nextAction;

  const handleStartAction = () => {
    if (nextAction) {
      setLocation("/habits");
    } else {
      setLocation("/habits");
    }
  };

  const flowColor = flow.value >= 60 ? "#22c55e" : flow.value >= 30 ? "#f59e0b" : colors.primary;

  return (
    <SystemLayout>
      <div className="flex flex-col gap-5 py-2 max-w-md mx-auto w-full" data-testid="home-page">

        <div
          data-testid="phase-card"
          className="rounded-xl p-5 relative overflow-hidden"
          style={{
            backgroundColor: `${colors.surface || colors.background}cc`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: colors.textMuted }}>
                Phase {phase.number}
              </div>
              <div className="text-xl font-display font-bold" style={{ color: colors.text }}>
                {phase.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold" style={{ color: colors.primary }}>
                {stability.score}
              </div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Stability: {stability.label}
              </div>
            </div>
          </div>

          {homeData && (
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
              <span data-testid="text-completed-today">{homeData.completedToday}/{homeData.totalActive} today</span>
            </div>
          )}
        </div>

        <div
          data-testid="flow-meter"
          className="rounded-xl p-5"
          style={{
            backgroundColor: `${colors.surface || colors.background}cc`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: flowColor }} />
              <span className="text-sm font-display font-bold uppercase tracking-wider" style={{ color: colors.text }}>
                Flow State
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {flow.trending === "rising" && <TrendingUp size={14} className="text-green-400" />}
              {flow.trending === "cooling" && <TrendingDown size={14} className="text-amber-400" />}
              {flow.trending === "steady" && <Minus size={14} style={{ color: colors.textMuted }} />}
              <span className="text-xs" style={{ color: colors.textMuted }}>{flow.label}</span>
            </div>
          </div>

          <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.surfaceBorder}60` }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${flow.value}%`,
                background: `linear-gradient(90deg, ${flowColor}80, ${flowColor})`,
                boxShadow: flow.value > 30 ? `0 0 8px ${flowColor}40` : undefined,
              }}
              data-testid="flow-bar"
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>0</span>
            <span className="text-sm font-mono font-bold" style={{ color: flowColor }}>{flow.value}</span>
            <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>100</span>
          </div>
        </div>

        <div
          data-testid="coach-insight-card"
          className="rounded-xl p-4"
          style={{
            backgroundColor: `${colors.primary}08`,
            border: `1px solid ${colors.primary}20`,
          }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: colors.primary }} />
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
              {insight}
            </p>
          </div>
        </div>

        <button
          data-testid="button-start-next-action"
          onClick={handleStartAction}
          className="w-full py-4 rounded-xl font-display font-bold text-base uppercase tracking-wider transition-all active:scale-[0.98]"
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
            boxShadow: `0 0 20px ${colors.primaryGlow}40`,
          }}
        >
          {nextAction ? (
            <span className="flex items-center justify-center gap-2">
              <Play size={18} />
              Start Next Action
              <span className="text-xs opacity-75 ml-1">
                {nextAction.name} · {nextAction.durationMinutes}m
              </span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Play size={18} />
              {homeData?.totalActive === 0 ? "Create First Habit" : "All Done Today"}
            </span>
          )}
        </button>

        <button
          data-testid="button-view-schedule"
          onClick={() => setLocation("/schedule")}
          className="w-full py-3 rounded-xl font-display text-sm uppercase tracking-wider transition-all"
          style={{
            backgroundColor: "transparent",
            color: colors.textMuted,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Calendar size={16} />
            View Schedule
          </span>
        </button>
      </div>
    </SystemLayout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useLocation } from "wouter";
import { Play, Plus, Wind, Droplets, Brain, Heart } from "lucide-react";

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

const RECOMMENDED_HABITS = [
  { id: "calm-breathing", name: "Calm Breathing", duration: "2 min", icon: Wind, stat: "sense" },
  { id: "light-movement", name: "Light Movement", duration: "5 min", icon: Heart, stat: "agility" },
  { id: "hydration-check", name: "Hydration Check", duration: "", icon: Droplets, stat: "vitality" },
  { id: "quick-reflection", name: "Quick Reflection", duration: "1 min", icon: Brain, stat: "sense" },
];

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

  const { data: homeData } = useQuery<HomeData>({
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

  const nextAction = homeData?.nextAction;
  const hasHabits = homeData ? homeData.totalActive > 0 : false;
  const allDone = homeData ? homeData.completedToday >= homeData.totalActive && homeData.totalActive > 0 : false;

  const handleStart = () => {
    setLocation("/habits");
  };

  const handleRecommendedHabit = () => {
    setLocation("/habits");
  };

  return (
    <SystemLayout>
      <div
        className="flex flex-col gap-6 py-6 px-1 max-w-md mx-auto w-full"
        data-testid="home-page"
      >
        <div className="pt-4">
          <p className="text-lg font-display font-medium leading-relaxed" style={{ color: colors.text }}>
            {allDone
              ? "Great work today. Rest up."
              : "Let's start small today."}
          </p>
          {homeData && hasHabits && !allDone && (
            <p className="text-xs mt-1.5" style={{ color: colors.textMuted }}>
              {homeData.completedToday}/{homeData.totalActive} complete
            </p>
          )}
        </div>

        {!hasHabits && (
          <div data-testid="recommended-habits">
            <p className="text-[11px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: colors.textMuted }}>
              Recommended
            </p>
            <div className="flex flex-col gap-2">
              {RECOMMENDED_HABITS.map((habit) => {
                const accentColor = STAT_COLORS[habit.stat] || colors.primary;
                return (
                  <button
                    key={habit.id}
                    data-testid={`button-recommended-${habit.id}`}
                    onClick={handleRecommendedHabit}
                    className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]"
                    style={{
                      backgroundColor: `${colors.surface || colors.background}cc`,
                      border: `1px solid ${colors.surfaceBorder}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      <habit.icon size={18} style={{ color: accentColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: colors.text }}>
                        {habit.name}
                      </div>
                      {habit.duration && (
                        <div className="text-[11px]" style={{ color: colors.textMuted }}>
                          {habit.duration}
                        </div>
                      )}
                    </div>
                    <Play size={14} style={{ color: colors.textMuted }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {hasHabits && !allDone && nextAction && (
          <div
            data-testid="next-action-card"
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: `${colors.surface || colors.background}cc`,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.15em] font-bold mb-1" style={{ color: colors.textMuted }}>
              Up next
            </p>
            <p className="text-sm font-medium" style={{ color: colors.text }}>
              {nextAction.name}
              <span className="ml-2 text-xs" style={{ color: colors.textMuted }}>
                {nextAction.durationMinutes}m
              </span>
            </p>
          </div>
        )}

        <button
          data-testid="button-start"
          onClick={handleStart}
          className="w-full py-4 rounded-xl font-display font-bold text-base uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
            boxShadow: `0 0 24px ${colors.primaryGlow}30`,
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Play size={18} />
            {allDone ? "View Habits" : "Start"}
          </span>
        </button>

        <button
          data-testid="button-create-custom-habit"
          onClick={() => setLocation("/habits")}
          className="w-full py-2 text-xs tracking-wide transition-all"
          style={{ color: colors.textMuted }}
        >
          Create custom habit (optional)
        </button>
      </div>
    </SystemLayout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Play, Wind, Droplets, Brain, Heart } from "lucide-react";

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

const JOURNEY_START_KEY = "ascend_journey_start";

function getJourneyDay(): number {
  let start = localStorage.getItem(JOURNEY_START_KEY);
  if (!start) {
    start = new Date().toISOString().split("T")[0];
    localStorage.setItem(JOURNEY_START_KEY, start);
  }
  const startDate = new Date(start + "T00:00:00");
  const now = new Date();
  const diff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

export default function HomePage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [, setLocation] = useLocation();
  const [selectedHabitId, setSelectedHabitId] = useState(RECOMMENDED_HABITS[0].id);

  const journeyDay = useMemo(() => getJourneyDay(), []);

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

  const selectedHabit = RECOMMENDED_HABITS.find(h => h.id === selectedHabitId) || RECOMMENDED_HABITS[0];
  const otherHabits = RECOMMENDED_HABITS.filter(h => h.id !== selectedHabitId);
  const primaryAccent = STAT_COLORS[selectedHabit.stat] || colors.primary;

  const startLabel = hasHabits
    ? (allDone ? "View Habits" : (nextAction ? `Start ${nextAction.name}` : "Start"))
    : `Start ${selectedHabit.name}`;

  const handleStart = () => {
    setLocation("/habits");
  };

  const handleSelectHabit = (habitId: string) => {
    setSelectedHabitId(habitId);
  };

  return (
    <SystemLayout>
      <div
        className="flex flex-col gap-5 py-6 px-1 max-w-md mx-auto w-full"
        data-testid="home-page"
      >
        <div className="pt-4">
          <p className="text-lg font-display font-medium leading-relaxed" style={{ color: colors.text }}>
            {allDone ? "Great work today. Rest up." : "Let's start small today."}
          </p>
          <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
            {hasHabits && !allDone
              ? `Day ${journeyDay} · ${homeData!.completedToday}/${homeData!.totalActive} complete`
              : `Day ${journeyDay} · Beginning your journey`}
          </p>
        </div>

        {!hasHabits && (
          <>
            <div data-testid="start-here-section">
              <p className="text-[11px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: colors.textMuted }}>
                Start Here
              </p>
              <button
                data-testid={`button-primary-habit-${selectedHabit.id}`}
                onClick={handleStart}
                className="flex items-center gap-4 w-full rounded-xl px-5 py-4 text-left transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: `${primaryAccent}10`,
                  border: `1px solid ${primaryAccent}30`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${primaryAccent}20` }}
                >
                  <selectedHabit.icon size={24} style={{ color: primaryAccent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium" style={{ color: colors.text }}>
                    {selectedHabit.name}
                  </div>
                  {selectedHabit.duration && (
                    <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                      {selectedHabit.duration}
                    </div>
                  )}
                </div>
              </button>
            </div>

            <div data-testid="other-options-section">
              <p className="text-[11px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: colors.textMuted }}>
                Other Options
              </p>
              <div className="flex flex-col gap-1.5">
                {otherHabits.map((habit) => {
                  const accentColor = STAT_COLORS[habit.stat] || colors.primary;
                  return (
                    <button
                      key={habit.id}
                      data-testid={`button-option-${habit.id}`}
                      onClick={() => handleSelectHabit(habit.id)}
                      className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-all active:scale-[0.98]"
                      style={{
                        backgroundColor: `${colors.surface || colors.background}99`,
                        border: `1px solid ${colors.surfaceBorder}`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${accentColor}12` }}
                      >
                        <habit.icon size={14} style={{ color: accentColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium" style={{ color: colors.text }}>
                          {habit.name}
                        </div>
                      </div>
                      {habit.duration && (
                        <span className="text-[10px]" style={{ color: colors.textMuted }}>
                          {habit.duration}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
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
          className="w-full py-4 rounded-xl font-display font-bold text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
            boxShadow: `0 0 24px ${colors.primaryGlow}30`,
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Play size={16} />
            {startLabel}
          </span>
        </button>

        {!hasHabits && (
          <button
            data-testid="button-create-custom-habit"
            onClick={() => setLocation("/habits")}
            className="w-full py-2 text-xs tracking-wide transition-all"
            style={{ color: colors.textMuted }}
          >
            Create custom habit (optional)
          </button>
        )}
      </div>
    </SystemLayout>
  );
}

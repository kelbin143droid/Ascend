import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { Play, Wind, Droplets, Brain, Heart, Plus, BookOpen, Trophy } from "lucide-react";

interface HomeData {
  phase: { number: number; name: string };
  stability: { score: number; label: string };
  flow: { value: number; label: string; trending: "rising" | "steady" | "cooling" };
  insight: string;
  todaysFocus: string;
  nextAction: { habitId: string; name: string; stat: string; durationMinutes: number } | null;
  completedToday: number;
  totalActive: number;
  onboardingDay: number;
  hasCompletedHabitToday: boolean;
  lastCompletionDate: string | null;
}

const RECOMMENDED_HABITS = [
  { id: "calm-breathing", name: "Calm Breathing", duration: "2 min", durationText: "2 minutes", icon: Wind, stat: "sense" },
  { id: "light-movement", name: "Light Movement", duration: "5 min", durationText: "5 minutes", icon: Heart, stat: "agility" },
  { id: "hydration-check", name: "Hydration Check", duration: "", durationText: "a moment", icon: Droplets, stat: "vitality" },
  { id: "quick-reflection", name: "Quick Reflection", duration: "1 min", durationText: "1 minute", icon: Brain, stat: "sense" },
];

const STAT_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

const DAILY_REFLECTIONS: Record<number, { subtitle: string; motivation: string }> = {
  1: { subtitle: "Beginning your journey.", motivation: "Small actions build momentum." },
  2: { subtitle: "Consistency starts here.", motivation: "Repeat yesterday's success." },
  3: { subtitle: "You're building a routine.", motivation: "Make it yours." },
  4: { subtitle: "Stability is forming.", motivation: "Progress comes from showing up." },
  5: { subtitle: "You're ready for a little more.", motivation: "Growth expands naturally." },
  6: { subtitle: "You understand the rhythm.", motivation: "Your actions shape your system." },
  7: { subtitle: "First growth cycle complete.", motivation: "You've proven consistency." },
};

export default function HomePage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [, setLocation] = useLocation();
  const [selectedHabitId, setSelectedHabitId] = useState(RECOMMENDED_HABITS[0].id);
  const [showCompletionGlow, setShowCompletionGlow] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [prevCompletedToday, setPrevCompletedToday] = useState<number | null>(null);

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

  const onboardingDay = homeData?.onboardingDay ?? 1;
  const hasCompletedToday = homeData?.hasCompletedHabitToday ?? false;
  const nextAction = homeData?.nextAction;
  const hasHabits = homeData ? homeData.totalActive > 0 : false;
  const allDone = homeData ? homeData.completedToday >= homeData.totalActive && homeData.totalActive > 0 : false;

  const reflection = DAILY_REFLECTIONS[onboardingDay] || DAILY_REFLECTIONS[7];

  useEffect(() => {
    if (homeData && prevCompletedToday !== null && homeData.completedToday > prevCompletedToday) {
      setShowCompletionGlow(true);
      const timer = setTimeout(() => setShowCompletionGlow(false), 2000);
      return () => clearTimeout(timer);
    }
    if (homeData) {
      setPrevCompletedToday(homeData.completedToday);
    }
  }, [homeData?.completedToday]);

  useEffect(() => {
    if (onboardingDay >= 4) {
      const timer = setTimeout(() => setShowEncouragement(true), 800);
      return () => clearTimeout(timer);
    }
  }, [onboardingDay]);

  const selectedHabit = RECOMMENDED_HABITS.find(h => h.id === selectedHabitId) || RECOMMENDED_HABITS[0];
  const otherHabits = RECOMMENDED_HABITS.filter(h => h.id !== selectedHabitId);
  const primaryAccent = STAT_COLORS[selectedHabit.stat] || colors.primary;

  const startLabel = hasHabits
    ? (allDone ? "View Habits" : (nextAction ? `Start ${nextAction.name}` : "Start"))
    : `Start ${selectedHabit.name}`;

  const earlyOnboarding = onboardingDay <= 3;
  const microCommitText = hasHabits
    ? (nextAction ? `Takes only ${nextAction.durationMinutes} minute${nextAction.durationMinutes !== 1 ? "s" : ""}` : null)
    : earlyOnboarding ? "Complete anytime today." : `Takes only ${selectedHabit.durationText}`;

  const handleStart = () => {
    if (!hasHabits) {
      setLocation(`/guided-session/${selectedHabitId}`);
    } else {
      setLocation("/habits");
    }
  };

  const handleSelectHabit = (habitId: string) => {
    setSelectedHabitId(habitId);
  };

  const showCustomHabitHighlight = onboardingDay >= 3;
  const showAddHabitSuggestion = onboardingDay >= 5 && hasCompletedToday && hasHabits;
  const showLearnTooltip = onboardingDay >= 6;
  const showMilestoneBanner = onboardingDay >= 7;

  return (
    <SystemLayout>
      <style>{`
        @keyframes subtleGlow {
          0%, 100% { box-shadow: 0 0 8px var(--glow-color, rgba(59,130,246,0.15)); }
          50% { box-shadow: 0 0 20px var(--glow-color, rgba(59,130,246,0.3)); }
        }
        @keyframes completionPulse {
          0% { opacity: 0; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes encourageFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="flex flex-col gap-5 py-6 px-1 max-w-md mx-auto w-full relative"
        data-testid="home-page"
      >
        {showCompletionGlow && (
          <div
            data-testid="completion-glow-overlay"
            className="absolute inset-0 rounded-2xl pointer-events-none z-10"
            style={{
              animation: "completionPulse 2s ease-out forwards",
              background: `radial-gradient(circle at center, ${colors.primary}15 0%, transparent 70%)`,
            }}
          />
        )}

        {showMilestoneBanner && (
          <div
            data-testid="milestone-banner"
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              backgroundColor: `${colors.primary}12`,
              border: `1px solid ${colors.primary}25`,
              animation: "fadeSlideIn 0.6s ease-out",
            }}
          >
            <Trophy size={18} style={{ color: colors.primary }} />
            <div>
              <p className="text-sm font-medium" style={{ color: colors.text }}>
                First Growth Cycle Complete.
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                You've built a foundation of consistency.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4" style={{ animation: showEncouragement ? "encourageFade 0.5s ease-out" : undefined }}>
          <p className="text-lg font-display font-medium leading-relaxed" style={{ color: colors.text }}>
            {allDone ? "Great work today. Rest up." : "Let's start small today."}
          </p>
          <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
            {hasHabits && !allDone
              ? `Day ${onboardingDay} · ${homeData!.completedToday}/${homeData!.totalActive} complete`
              : `Day ${onboardingDay} · ${reflection.subtitle}`}
          </p>
          <p className="text-[10px] mt-0.5 italic" style={{ color: `${colors.textMuted}aa` }}>
            {reflection.motivation}
          </p>
        </div>

        {showCompletionGlow && (
          <div
            data-testid="completion-feedback"
            className="rounded-lg px-3 py-2 text-center"
            style={{
              backgroundColor: `${colors.primary}10`,
              animation: "fadeSlideIn 0.4s ease-out",
            }}
          >
            <p className="text-xs font-medium" style={{ color: colors.primary }}>
              Action completed. Momentum increased.
            </p>
          </div>
        )}

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
                  animation: "subtleGlow 3s ease-in-out infinite",
                  ["--glow-color" as string]: `${primaryAccent}25`,
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
                  <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                    {earlyOnboarding ? "Complete anytime today" : selectedHabit.duration || "Quick check"}
                  </div>
                </div>
              </button>
            </div>

            <div data-testid="other-options-section">
              <p className="text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: `${colors.textMuted}88` }}>
                Other Options
              </p>
              <div className="flex flex-col gap-1">
                {otherHabits.map((habit) => {
                  const accentColor = STAT_COLORS[habit.stat] || colors.primary;
                  return (
                    <button
                      key={habit.id}
                      data-testid={`button-option-${habit.id}`}
                      onClick={() => handleSelectHabit(habit.id)}
                      className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left transition-all active:scale-[0.98]"
                      style={{
                        backgroundColor: `${colors.surface || colors.background}60`,
                        border: `1px solid ${colors.surfaceBorder}50`,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${accentColor}10` }}
                      >
                        <habit.icon size={12} style={{ color: `${accentColor}99` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px]" style={{ color: `${colors.text}cc` }}>
                          {habit.name}
                        </div>
                      </div>
                      {habit.duration && (
                        <span className="text-[9px]" style={{ color: `${colors.textMuted}77` }}>
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

        {showAddHabitSuggestion && !allDone && (
          <div
            data-testid="add-habit-suggestion"
            className="rounded-lg px-3 py-2.5 flex items-center gap-2"
            style={{
              backgroundColor: `${colors.primary}08`,
              border: `1px solid ${colors.primary}15`,
              animation: "fadeSlideIn 0.5s ease-out",
            }}
          >
            <Plus size={14} style={{ color: colors.primary }} />
            <p className="text-[11px]" style={{ color: colors.textMuted }}>
              Add another small habit?
            </p>
            <button
              data-testid="button-add-habit-suggestion"
              onClick={() => setLocation("/habits")}
              className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded"
              style={{ color: colors.primary, backgroundColor: `${colors.primary}10` }}
            >
              Browse
            </button>
          </div>
        )}

        <div className="flex flex-col items-center gap-1">
          {microCommitText && !allDone && (
            <p
              data-testid="micro-commit-text"
              className="text-[10px] tracking-wide"
              style={{ color: `${colors.textMuted}99` }}
            >
              {microCommitText}
            </p>
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
        </div>

        {!hasHabits && (
          <button
            data-testid="button-create-custom-habit"
            onClick={() => setLocation("/habits")}
            className="w-full py-2 text-xs tracking-wide transition-all"
            style={{
              color: showCustomHabitHighlight ? colors.textMuted : `${colors.textMuted}66`,
              fontWeight: showCustomHabitHighlight ? 500 : 400,
            }}
          >
            {showCustomHabitHighlight ? "Create custom habit" : "Create custom habit (optional)"}
          </button>
        )}

        {showLearnTooltip && (
          <button
            data-testid="button-learn-growth"
            onClick={() => setLocation("/coach")}
            className="flex items-center justify-center gap-1.5 w-full py-2 transition-all"
            style={{
              color: `${colors.textMuted}99`,
              animation: "fadeSlideIn 0.6s ease-out",
            }}
          >
            <BookOpen size={12} />
            <span className="text-[10px] tracking-wide">Learn how growth works</span>
          </button>
        )}
      </div>
    </SystemLayout>
  );
}

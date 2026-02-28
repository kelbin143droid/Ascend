import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { Play, Wind, Droplets, Brain, Heart, Plus, BookOpen, Trophy, Activity } from "lucide-react";
import { Day3IntroFlow } from "@/components/game/Day3IntroFlow";
import { Day4IntroFlow } from "@/components/game/Day4IntroFlow";
import { Day5IntroFlow } from "@/components/game/Day5IntroFlow";
import { Day6RevealModal } from "@/components/game/Day6RevealModal";
import { Day7TransitionModal } from "@/components/game/Day7TransitionModal";
import { NotificationBanner } from "@/components/game/NotificationBanner";
import { ReminderPrompt } from "@/components/game/ReminderPrompt";

interface HomeData {
  phase: { number: number; name: string };
  stability: { score: number; label: string };
  flow: { value: number; label: string; trending: "rising" | "steady" | "cooling" };
  growthState: string;
  momentum: number;
  insight: string;
  todaysFocus: string;
  nextAction: { habitId: string; name: string; stat: string; durationMinutes: number } | null;
  completedToday: number;
  totalActive: number;
  onboardingDay: number;
  hasCompletedHabitToday: boolean;
  lastCompletionDate: string | null;
  notification: { type: "momentum" | "recovery" | "milestone"; message: string } | null;
  suggestedReminderTime: string | null;
  lastCompletionTime: string | null;
  isOnboardingComplete: boolean;
  streak: number;
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
  4: { subtitle: "Rhythm forming", motivation: "Consistency creates structure naturally." },
  5: { subtitle: "Momentum growing", motivation: "Growth expands naturally." },
  6: { subtitle: "System awareness unlocked.", motivation: "Your consistency has been building all along." },
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
  const [showDay3Intro, setShowDay3Intro] = useState(false);
  const [dismissedNotification, setDismissedNotification] = useState(false);
  const [showReminderPrompt, setShowReminderPrompt] = useState(false);
  const [showDay4Intro, setShowDay4Intro] = useState(false);
  const [showDay5Intro, setShowDay5Intro] = useState(false);
  const [showDay6Reveal, setShowDay6Reveal] = useState(false);
  const [day6MeterVisible, setDay6MeterVisible] = useState(false);
  const [showDay7Transition, setShowDay7Transition] = useState(false);

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

  useEffect(() => {
    if (!homeData || onboardingDay !== 3) return;
    const today = new Date().toISOString().split("T")[0];
    const seenKey = "ascend_day3_intro_seen";
    const alreadySeen = localStorage.getItem(seenKey);
    if (alreadySeen === today) return;
    const prevCompleted = homeData.lastCompletionDate && homeData.lastCompletionDate !== today;
    if (prevCompleted && !homeData.hasCompletedHabitToday) {
      localStorage.setItem(seenKey, today);
      setShowDay3Intro(true);
    }
  }, [homeData, onboardingDay]);

  useEffect(() => {
    if (!homeData || onboardingDay !== 3 || !homeData.hasCompletedHabitToday) return;
    const reminderPref = localStorage.getItem("ascend_reminder_preference");
    const promptShown = localStorage.getItem("ascend_reminder_prompt_shown");
    if (!reminderPref && !promptShown) {
      const timer = setTimeout(() => {
        localStorage.setItem("ascend_reminder_prompt_shown", "true");
        setShowReminderPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [homeData?.hasCompletedHabitToday, onboardingDay]);

  useEffect(() => {
    if (!homeData || onboardingDay !== 4) return;
    const today = new Date().toISOString().split("T")[0];
    const seenKey = "ascend_day4_intro_seen";
    const alreadySeen = localStorage.getItem(seenKey);
    if (alreadySeen === today) return;
    const prevCompleted = homeData.lastCompletionDate && homeData.lastCompletionDate !== today;
    if (prevCompleted && !homeData.hasCompletedHabitToday) {
      localStorage.setItem(seenKey, today);
      setShowDay4Intro(true);
    }
  }, [homeData, onboardingDay]);

  useEffect(() => {
    if (!homeData || onboardingDay !== 5) return;
    const today = new Date().toISOString().split("T")[0];
    const seenKey = "ascend_day5_intro_seen";
    const alreadySeen = localStorage.getItem(seenKey);
    if (alreadySeen === today) return;
    const prevCompleted = homeData.lastCompletionDate && homeData.lastCompletionDate !== today;
    if (prevCompleted && !homeData.hasCompletedHabitToday) {
      localStorage.setItem(seenKey, today);
      setShowDay5Intro(true);
    }
  }, [homeData, onboardingDay]);

  useEffect(() => {
    if (!homeData || onboardingDay !== 6) return;
    const seenKey = "ascend_day6_reveal_seen";
    if (localStorage.getItem(seenKey) === "true") {
      setDay6MeterVisible(true);
      return;
    }
    setShowDay6Reveal(true);
  }, [homeData, onboardingDay]);

  const handleDay6RevealContinue = () => {
    localStorage.setItem("ascend_day6_reveal_seen", "true");
    setShowDay6Reveal(false);
    setTimeout(() => setDay6MeterVisible(true), 300);
  };

  useEffect(() => {
    if (!homeData || onboardingDay < 7) return;
    const seenKey = "ascend_day7_transition_seen";
    if (localStorage.getItem(seenKey) === "true") return;
    setShowDay7Transition(true);
  }, [homeData, onboardingDay]);

  const handleDay7TransitionContinue = () => {
    localStorage.setItem("ascend_day7_transition_seen", "true");
    setShowDay7Transition(false);
  };

  const selectedHabit = RECOMMENDED_HABITS.find(h => h.id === selectedHabitId) || RECOMMENDED_HABITS[0];
  const otherHabits = RECOMMENDED_HABITS.filter(h => h.id !== selectedHabitId);
  const primaryAccent = STAT_COLORS[selectedHabit.stat] || colors.primary;

  const isTrainingMode = onboardingDay >= 7 || homeData?.isOnboardingComplete;
  const showCustomHabitHighlight = onboardingDay >= 3;
  const showAddHabitSuggestion = onboardingDay >= 5 && hasCompletedToday && hasHabits;
  const showLearnTooltip = onboardingDay >= 6 && !isTrainingMode;
  const showMilestoneBanner = false;

  const startLabel = isTrainingMode
    ? (allDone ? "View Habits" : (nextAction ? `Complete ${nextAction.name}` : "Complete Today's Training"))
    : hasHabits
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

        {!dismissedNotification && homeData?.notification && (
          <NotificationBanner
            notification={homeData.notification}
            onDismiss={() => setDismissedNotification(true)}
          />
        )}

        <div className="pt-4" style={{ animation: showEncouragement ? "encourageFade 0.5s ease-out" : undefined }}>
          <p className="text-lg font-display font-medium leading-relaxed" style={{ color: colors.text }}>
            {isTrainingMode
              ? (allDone ? "Great work today. Rest up." : "Today's Training")
              : (allDone ? "Great work today. Rest up." : "Let's start small today.")}
          </p>
          <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
            {isTrainingMode
              ? (hasHabits && !allDone
                ? `${homeData!.completedToday}/${homeData!.totalActive} complete`
                : "Consistency builds strength.")
              : (hasHabits && !allDone
                ? `Day ${onboardingDay} · ${homeData!.completedToday}/${homeData!.totalActive} complete`
                : `Day ${onboardingDay} · ${reflection.subtitle}`)}
          </p>
          {homeData?.growthState && (
            <p
              data-testid="text-growth-state"
              className="text-[11px] mt-1 font-medium"
              style={{ color: colors.primary }}
            >
              {homeData.growthState}
            </p>
          )}
          {!isTrainingMode && (
            <p className="text-[10px] mt-0.5 italic" style={{ color: `${colors.textMuted}aa` }}>
              {reflection.motivation}
            </p>
          )}
        </div>

        {isTrainingMode && (
          <div
            data-testid="training-status-card"
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: `${colors.surface || colors.background}cc`,
              border: `1px solid ${colors.surfaceBorder}`,
              animation: "subtleGlow 4s ease-in-out infinite",
              ["--glow-color" as string]: `${colors.primary}12`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} style={{ color: colors.primary }} />
              <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.primary }}>
                Training Status: Active
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-lg font-bold font-mono" style={{ color: colors.text }}>
                  {homeData?.streak ?? 0}
                </span>
                <span className="text-[10px] ml-1" style={{ color: colors.textMuted }}>
                  day streak
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    Momentum
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: colors.primary }}>
                    {homeData?.momentum ?? 0}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${colors.surfaceBorder}50` }}
                >
                  <div
                    data-testid="training-momentum-bar"
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(homeData?.momentum ?? 0, 100)}%`,
                      background: `linear-gradient(90deg, ${colors.primary}80, ${colors.primary})`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {onboardingDay >= 6 && !isTrainingMode && day6MeterVisible && (
          <div
            data-testid="momentum-meter"
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: `${colors.surface || colors.background}cc`,
              border: `1px solid ${colors.surfaceBorder}`,
              animation: "fadeSlideIn 0.8s ease-out",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.textMuted }}>
                Momentum
              </span>
              <span className="text-[10px] font-mono" style={{ color: colors.primary }}>
                {homeData?.momentum ?? 0}
              </span>
            </div>
            <div
              className="relative h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: `${colors.surfaceBorder}50` }}
            >
              <div
                data-testid="momentum-bar"
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(homeData?.momentum ?? 0, 100)}%`,
                  background: `linear-gradient(90deg, ${colors.primary}80, ${colors.primary})`,
                  boxShadow: (homeData?.momentum ?? 0) > 20 ? `0 0 6px ${colors.primary}30` : undefined,
                }}
              />
            </div>
            <p className="text-[9px] mt-1.5" style={{ color: `${colors.textMuted}88` }}>
              Built through consistency
            </p>
          </div>
        )}

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

        {homeData && (
          <div
            data-testid="phase-card"
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{
              backgroundColor: `${colors.surface || colors.background}88`,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] font-bold" style={{ color: colors.textMuted }}>
                {homeData.phase.name}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: `${colors.textMuted}99` }}>
                Stability: {homeData.stability.label}
              </p>
            </div>
            {homeData.flow && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
                  Flow
                </p>
                <p className="text-xs font-mono font-medium" style={{ color: colors.primary }}>
                  {homeData.flow.label}
                </p>
              </div>
            )}
          </div>
        )}

        {homeData?.insight && (
          <div
            data-testid="coach-insight-card"
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: `${colors.primary}08`,
              border: `1px solid ${colors.primary}15`,
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] font-bold mb-1" style={{ color: `${colors.primary}99` }}>
              Coach
            </p>
            <p className="text-xs leading-relaxed" style={{ color: `${colors.text}cc` }}>
              {homeData.insight}
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

        {hasHabits && !allDone && (
          <button
            data-testid="button-view-schedule"
            onClick={() => setLocation("/schedule")}
            className="w-full py-2.5 rounded-xl text-xs tracking-[0.1em] uppercase transition-all active:scale-[0.98]"
            style={{
              color: colors.textMuted,
              backgroundColor: `${colors.surface || colors.background}60`,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
          >
            View Schedule
          </button>
        )}

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

      <Day3IntroFlow
        visible={showDay3Intro}
        lastHabitName={selectedHabit.name}
        onComplete={(choice) => {
          setShowDay3Intro(false);
          if (choice === "repeat") {
            setLocation(`/guided-session/${selectedHabitId}`);
          }
        }}
      />

      <Day4IntroFlow
        visible={showDay4Intro}
        lastCompletionTime={homeData?.lastCompletionTime ?? null}
        onComplete={() => setShowDay4Intro(false)}
        onSetReminder={(timeWindow) => {
          localStorage.setItem("ascend_reminder_preference", timeWindow);
        }}
      />

      <Day5IntroFlow
        visible={showDay5Intro}
        onComplete={() => setShowDay5Intro(false)}
      />

      <ReminderPrompt
        visible={showReminderPrompt}
        onSelect={(preference) => {
          localStorage.setItem("ascend_reminder_preference", preference);
          setShowReminderPrompt(false);
        }}
        onDismiss={() => setShowReminderPrompt(false)}
      />

      <Day6RevealModal
        visible={showDay6Reveal}
        onContinue={handleDay6RevealContinue}
      />

      <Day7TransitionModal
        visible={showDay7Transition}
        onContinue={handleDay7TransitionContinue}
      />
    </SystemLayout>
  );
}

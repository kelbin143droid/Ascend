import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { Play, Wind, Droplets, Brain, Heart, Plus, BookOpen, Trophy, Activity, Clock, Calendar, BarChart3 } from "lucide-react";
import { Day3IntroFlow } from "@/components/game/Day3IntroFlow";
import { Day4IntroFlow } from "@/components/game/Day4IntroFlow";
import { Day5IntroFlow } from "@/components/game/Day5IntroFlow";
import { Day6RevealModal } from "@/components/game/Day6RevealModal";
import { Day7TransitionModal } from "@/components/game/Day7TransitionModal";
import { NotificationBanner } from "@/components/game/NotificationBanner";
import { ReminderPrompt } from "@/components/game/ReminderPrompt";
import { ReturnProtocolScreen } from "@/components/game/ReturnProtocolScreen";

interface HomeData {
  phase: { number: number; name: string };
  stability: {
    score: number;
    label: string;
    state: "stabilizing" | "stable" | "expanding";
    stateInfo: { label: string; description: string; color: string; icon: string };
    recoveryModeActive: boolean;
    disruptionDetected: boolean;
    habitLimit: number;
    unlockedFeatures: string[];
    coachTone: "gentle" | "encouraging" | "challenging";
    expansionReady: boolean;
    consecutiveActiveDays: number;
    trend: "improving" | "stable" | "declining";
  };
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
  recoveryMessage: string | null;
  returnProtocol: {
    active: boolean;
    tier: "short" | "extended" | "long";
    daysSinceLastActivity: number;
    coachMessage: string | null;
    resetRitual: {
      steps: { id: string; type: "breathing" | "reflection" | "affirmation"; title: string; instruction: string; durationSeconds: number }[];
      totalDurationSeconds: number;
    } | null;
    simplifyMode: {
      habitLoadReduction: number;
      focusDurationMultiplier: number;
      hideAnalytics: boolean;
      hideWeeklyPlanning: boolean;
      durationDays: number;
    } | null;
    softRestart: boolean;
    hideProgress: boolean;
  } | null;
  identity: {
    stage: "early" | "developing" | "stabilized" | "advanced";
    stageLabel: string;
    stageDescription: string;
    reflection: { message: string; stage: string; category: string; source: string } | null;
    reflectionAnchor: { message: string; stage: string; category: string; source: string } | null;
    metrics: {
      totalActiveDays: number;
      longestStreak: number;
      weeksEngaged: number;
      recoveryCount: number;
    };
  } | null;
}

const RECOMMENDED_HABITS = [
  { id: "calm-breathing", name: "Calm Breathing", duration: "2 min", durationText: "2 minutes", icon: Wind, stat: "sense" },
  { id: "light-movement", name: "Light Movement", duration: "5 min", durationText: "5 minutes", icon: Heart, stat: "agility" },
  { id: "hydration-check", name: "Hydration Check", duration: "", durationText: "a moment", icon: Droplets, stat: "vitality" },
  { id: "quick-reflection", name: "Quick Reflection", duration: "1 min", durationText: "1 minute", icon: Brain, stat: "sense" },
];

interface OnboardingStep {
  sessionId: string;
  name: string;
  description: string;
  coachMessage: string;
  duration: string;
  icon: typeof Wind;
  buttonLabel: string;
}

const ONBOARDING_STEPS: Record<number, OnboardingStep> = {
  1: {
    sessionId: "calm-breathing",
    name: "2-Minute Reset",
    description: "Slow breathing to reset your system.",
    coachMessage: "Begin with one small action.",
    duration: "2 minutes",
    icon: Wind,
    buttonLabel: "Begin Today's Reset",
  },
  2: {
    sessionId: "light-movement",
    name: "Light Movement",
    description: "Move your body for 3–5 minutes.",
    coachMessage: "Small movement wakes the system.",
    duration: "3–5 minutes",
    icon: Heart,
    buttonLabel: "Begin Today's Moment",
  },
  3: {
    sessionId: "hydration-check",
    name: "Hydration Check",
    description: "Drink water and check in with your body.",
    coachMessage: "Small signals matter.",
    duration: "1 minute",
    icon: Droplets,
    buttonLabel: "Begin Today's Moment",
  },
  4: {
    sessionId: "quick-reflection",
    name: "Quick Reflection",
    description: "Answer a short reflection question.",
    coachMessage: "What helped you show up today?",
    duration: "1 minute",
    icon: Brain,
    buttonLabel: "Begin Today's Practice",
  },
  5: {
    sessionId: "focus-block",
    name: "Focus Block",
    description: "Spend 3 minutes in uninterrupted focus.",
    coachMessage: "Focus builds momentum.",
    duration: "3 minutes",
    icon: Clock,
    buttonLabel: "Begin Today's Practice",
  },
  6: {
    sessionId: "plan-tomorrow",
    name: "Plan Tomorrow",
    description: "Choose a time for tomorrow's practice.",
    coachMessage: "Structure protects consistency.",
    duration: "1 minute",
    icon: Calendar,
    buttonLabel: "Begin Today's Step",
  },
  7: {
    sessionId: "weekly-reflection",
    name: "Weekly Reflection",
    description: "Review your first week.",
    coachMessage: "You showed up for 7 days. Consistency builds strength.",
    duration: "2 minutes",
    icon: BarChart3,
    buttonLabel: "Begin Reflection",
  },
};

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
  const { t } = useLanguage();
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
  const [returnProtocolDismissed, setReturnProtocolDismissed] = useState(false);

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

  const isTrainingMode = (onboardingDay >= 7 && homeData?.isOnboardingComplete) || (homeData?.isOnboardingComplete && hasHabits);
  const isOnboardingFlow = onboardingDay <= 7 && !isTrainingMode;
  const isOnboarding = !isTrainingMode;

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

  if (isOnboardingFlow) {
    const step = ONBOARDING_STEPS[onboardingDay] || ONBOARDING_STEPS[1];
    const StepIcon = step.icon;
    const reflection = DAILY_REFLECTIONS[onboardingDay] || DAILY_REFLECTIONS[1];

    return (
      <SystemLayout>
        <style>{`
          @keyframes subtleGlow {
            0%, 100% { box-shadow: 0 0 8px var(--glow-color, rgba(59,130,246,0.15)); }
            50% { box-shadow: 0 0 20px var(--glow-color, rgba(59,130,246,0.3)); }
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div
          className="flex flex-col gap-6 py-8 px-1 max-w-md mx-auto w-full"
          data-testid="home-page"
        >
          <div className="pt-2">
            <p className="text-lg font-display font-medium leading-relaxed" style={{ color: colors.text }}>
              Day {onboardingDay}
            </p>
            <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
              {reflection.subtitle}
            </p>
          </div>

          <div
            data-testid="onboarding-step-card"
            className="rounded-xl px-5 py-4"
            style={{
              backgroundColor: `${colors.primary}06`,
              border: `1px solid ${colors.primary}12`,
              animation: "fadeSlideIn 0.4s ease-out",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${colors.primary}12` }}
              >
                <StepIcon size={16} style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm font-display font-medium" style={{ color: colors.text }}>
                  {step.name}
                </p>
                <p className="text-[10px]" style={{ color: colors.textMuted }}>
                  {step.duration}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: `${colors.text}aa` }}>
              {step.description}
            </p>
          </div>

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
              {step.coachMessage}
            </p>
          </div>

          <p
            data-testid="micro-commit-text"
            className="text-xs text-center tracking-wide"
            style={{ color: `${colors.textMuted}99` }}
          >
            {reflection.motivation}
          </p>

          <div className="flex flex-col items-center gap-1">
            <button
              data-testid="button-start"
              onClick={() => setLocation(`/guided-session/${step.sessionId}`)}
              className="w-full py-4 rounded-xl font-display font-bold text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
              style={{
                backgroundColor: colors.primary,
                color: colors.background,
                boxShadow: `0 0 24px ${colors.primaryGlow}30`,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Play size={16} />
                {step.buttonLabel}
              </span>
            </button>
          </div>
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

  const startLabel = allDone
    ? t("View Habits")
    : (nextAction ? `Complete ${nextAction.name}` : t("Complete Today's Power Growth"));

  const microCommitText = hasHabits
    ? (nextAction ? `Takes only ${nextAction.durationMinutes} minute${nextAction.durationMinutes !== 1 ? "s" : ""}` : null)
    : `Takes only ${selectedHabit.durationText}`;

  if (homeData?.returnProtocol && !returnProtocolDismissed) {
    return (
      <ReturnProtocolScreen
        data={homeData.returnProtocol}
        onComplete={() => setReturnProtocolDismissed(true)}
      />
    );
  }

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

        {!dismissedNotification && homeData?.notification && (
          <NotificationBanner
            notification={homeData.notification}
            onDismiss={() => setDismissedNotification(true)}
          />
        )}

        <div className="pt-4">
          <p className="text-lg font-display font-medium leading-relaxed" style={{ color: colors.text }}>
            {allDone ? "Great work today. Rest up." : t("Today's Power Growth")}
          </p>
          <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
            {hasHabits && !allDone
              ? `${homeData!.completedToday}/${homeData!.totalActive} complete`
              : "Consistency builds strength."}
          </p>
        </div>

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
              {t("Power Growth")}: Active
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
                  {t("Momentum")}
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
              {t("Action completed. Momentum increased.")}
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
              <p className="text-[10px] mt-0.5 flex items-center gap-1.5" style={{ color: `${colors.textMuted}99` }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: homeData.stability.stateInfo?.color ?? colors.textMuted }} />
                {homeData.stability.stateInfo?.label ?? homeData.stability.label}
                {homeData.stability.trend === "improving" && <span style={{ color: "#22c55e", fontSize: "8px" }}>▲</span>}
                {homeData.stability.trend === "declining" && <span style={{ color: "#ef4444", fontSize: "8px" }}>▼</span>}
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

        {homeData?.stability?.recoveryModeActive && homeData?.recoveryMessage && (
          <div
            data-testid="recovery-mode-banner"
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: "rgba(168,85,247,0.06)",
              border: "1px solid rgba(168,85,247,0.15)",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#a855f7" }}>
                <div className="w-full h-full rounded-full animate-pulse" style={{ backgroundColor: "#a855f7" }} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.12em] font-bold" style={{ color: "rgba(168,85,247,0.8)" }}>
                Recovery Mode
              </p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: `${colors.text}bb` }}>
              {homeData.recoveryMessage}
            </p>
            <p className="text-[9px] mt-2" style={{ color: `${colors.textMuted}66` }}>
              Expectations simplified · Habit limit: {homeData.stability.habitLimit}
            </p>
          </div>
        )}

        {homeData?.stability?.expansionReady && !homeData?.stability?.recoveryModeActive && (
          <div
            data-testid="expansion-ready-banner"
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.15)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
              <p className="text-[10px] uppercase tracking-[0.12em] font-bold" style={{ color: "rgba(34,197,94,0.8)" }}>
                Expansion Ready
              </p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: `${colors.text}cc` }}>
              Your stability has been strong for multiple weeks. Advanced features and deeper insights are now available.
            </p>
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

        {homeData?.identity?.reflection && (
          <div
            data-testid="identity-reflection-card"
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: "rgba(139,92,246,0.05)",
              border: "1px solid rgba(139,92,246,0.1)",
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-[0.12em] font-bold" style={{ color: "rgba(139,92,246,0.7)" }}>
                {homeData.identity.reflection.category === "anchor" ? "Reflection" : "Identity"}
              </p>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(139,92,246,0.08)",
                  color: "rgba(139,92,246,0.6)",
                }}
                data-testid="text-identity-stage"
              >
                {homeData.identity.stageLabel}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: `${colors.text}bb` }}>
              {homeData.identity.reflection.message}
            </p>
          </div>
        )}

        {homeData?.identity?.reflectionAnchor && (
          <div
            data-testid="identity-anchor-card"
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: "rgba(99,102,241,0.04)",
              border: "1px dashed rgba(99,102,241,0.12)",
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] font-bold mb-1.5" style={{ color: "rgba(99,102,241,0.6)" }}>
              Reflect
            </p>
            <p className="text-xs leading-relaxed italic" style={{ color: `${colors.text}99` }}>
              "{homeData.identity.reflectionAnchor.message}"
            </p>
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
      </div>
    </SystemLayout>
  );
}

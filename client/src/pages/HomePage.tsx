import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Play, Wind, Droplets, Brain, Heart, Clock, Calendar, BarChart3, Dumbbell, CheckCircle2, Eye, Zap } from "lucide-react";
import { Day3IntroFlow } from "@/components/game/Day3IntroFlow";
import { Day4IntroFlow } from "@/components/game/Day4IntroFlow";
import { Day5IntroFlow } from "@/components/game/Day5IntroFlow";
import { Day6RevealModal } from "@/components/game/Day6RevealModal";
import { Day7FollowThrough } from "@/components/game/Day7FollowThrough";
import { NotificationBanner } from "@/components/game/NotificationBanner";
import { ReminderPrompt } from "@/components/game/ReminderPrompt";
import { ReturnProtocolScreen } from "@/components/game/ReturnProtocolScreen";
import { DailyFlowEngine } from "@/components/game/DailyFlowEngine";
import { buildPhase1Activities, type CategoryTiers } from "@/lib/activityEngine";
import { AnimatePresence } from "framer-motion";

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
  completedGuidedSessionsToday: string[];
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
    name: "Light Cardio Session",
    description: "Three short cardio bursts — jog, jump, box. Gets your blood moving.",
    coachMessage: "Cardio sharpens focus and builds real energy.",
    duration: "~1 minute",
    icon: Clock,
    buttonLabel: "Begin Today's Practice",
  },
  6: {
    sessionId: "plan-tomorrow",
    name: "Time Placement",
    description: "Place one action into tomorrow's timeline. See your day before it starts.",
    coachMessage: "Deciding when to act — before the moment — is a skill.",
    duration: "1 minute",
    icon: Calendar,
    buttonLabel: "Begin Today's Step",
  },
  7: {
    sessionId: "weekly-reflection",
    name: "Follow-Through",
    description: "Return to the time you planned yesterday. Two minutes — as promised.",
    coachMessage: "Every time you meet your intention, you become someone who does.",
    duration: "2 minutes",
    icon: BarChart3,
    buttonLabel: "Begin Your Planned Step",
  },
};

const STAT_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

const STAT_ICONS: Record<string, typeof Dumbbell> = {
  strength: Dumbbell,
  agility: Wind,
  sense: Brain,
  vitality: Heart,
};

const STAT_LABELS: Record<string, string> = {
  strength: "Strength",
  agility: "Agility",
  sense: "Focus",
  vitality: "Vitality",
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

const FLOW_ACTIVITIES = [
  { label: "Reset", sublabel: "2 min breathing", icon: Brain, color: "#3b82f6" },
  { label: "Strength", sublabel: "3–5 min circuit", icon: Dumbbell, color: "#ef4444" },
  { label: "Mobility", sublabel: "2–3 min", icon: Wind, color: "#22c55e" },
  { label: "Vitality Check", sublabel: "hydration · sleep · nutrition", icon: Heart, color: "#f59e0b" },
];

export default function HomePage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const { t } = useLanguage();
  const colors = backgroundTheme.colors;
  const [, setLocation] = useLocation();
  const [selectedHabitId, setSelectedHabitId] = useState(RECOMMENDED_HABITS[0].id);
  const [showDay3Intro, setShowDay3Intro] = useState(false);
  const [dismissedNotification, setDismissedNotification] = useState(false);
  const [showReminderPrompt, setShowReminderPrompt] = useState(false);
  const [showDay4Intro, setShowDay4Intro] = useState(false);
  const [showDay5Intro, setShowDay5Intro] = useState(false);
  const [showDay6Reveal, setShowDay6Reveal] = useState(false);
  const [day6MeterVisible, setDay6MeterVisible] = useState(false);
  const [day7Done, setDay7Done] = useState(() => localStorage.getItem("ascend_day7_followthrough_done") === "true");
  const [returnProtocolDismissed, setReturnProtocolDismissed] = useState(false);
  const [flowActive, setFlowActive] = useState(false);
  const [flowCompletedToday, setFlowCompletedToday] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    return localStorage.getItem("ascend_light_movement_completed") === today;
  });

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

  const { data: scalingData } = useQuery<{ trainingScaling: Record<string, { tier: number; completionStreak: number; missedDays: number; sessionsCompleted: number }> }>({
    queryKey: ["training-scaling", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/training-scaling`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 10000,
  });

  const { data: playerData } = useQuery<any>({
    queryKey: ["/api/player", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
  });

  const onboardingDay = homeData?.onboardingDay ?? 1;
  const isOnboardingComplete = homeData?.isOnboardingComplete ?? false;
  const selectedHabit = RECOMMENDED_HABITS.find(h => h.id === selectedHabitId) || RECOMMENDED_HABITS[0];

  const isTrainingMode = isOnboardingComplete;
  const isOnboardingFlow = onboardingDay <= 7 && !isTrainingMode;

  // Keep day7Done state in sync when DevPanel modifies localStorage
  useEffect(() => {
    const handler = (e: Event) => setDay7Done((e as CustomEvent<{ done: boolean }>).detail.done);
    window.addEventListener("ascend:day7done", handler);
    return () => window.removeEventListener("ascend:day7done", handler);
  }, []);

  useEffect(() => {
    if (!homeData || onboardingDay !== 3) return;
    const today = new Date().toISOString().split("T")[0];
    const seenKey = "ascend_day3_intro_seen";
    if (localStorage.getItem(seenKey) === today) return;
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
    if (localStorage.getItem(seenKey) === today) return;
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
    if (localStorage.getItem(seenKey) === today) return;
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

  if (isOnboardingComplete && !day7Done && homeData) {
    return (
      <SystemLayout>
        <Day7FollowThrough
          onComplete={() => {
            localStorage.setItem("ascend_day7_followthrough_done", "true");
            setDay7Done(true);
          }}
          xpData={playerData ? {
            level: playerData.level ?? 1,
            current: playerData.exp ?? 0,
            max: playerData.maxExp ?? 100,
          } : undefined}
        />
      </SystemLayout>
    );
  }

  if (isOnboardingFlow) {
    const step = ONBOARDING_STEPS[onboardingDay] || ONBOARDING_STEPS[1];
    const StepIcon = step.icon;
    const reflection = DAILY_REFLECTIONS[onboardingDay] || DAILY_REFLECTIONS[1];

    return (
      <SystemLayout>
        <style>{`
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
            {homeData?.completedGuidedSessionsToday?.includes(step.sessionId) ? (
              <div
                data-testid="session-completed-indicator"
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2"
                style={{
                  backgroundColor: `${colors.primary}14`,
                  border: `1px solid ${colors.primary}30`,
                }}
              >
                <CheckCircle2 size={16} style={{ color: colors.primary }} />
                <span
                  className="text-sm font-display font-medium tracking-wide"
                  style={{ color: colors.primary }}
                >
                  Session completed today
                </span>
              </div>
            ) : (
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
            )}
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
      </SystemLayout>
    );
  }

  if (homeData?.returnProtocol && !returnProtocolDismissed) {
    return (
      <ReturnProtocolScreen
        data={homeData.returnProtocol}
        onComplete={() => setReturnProtocolDismissed(true)}
      />
    );
  }

  const tiers: CategoryTiers = {
    strength: scalingData?.trainingScaling?.strength?.tier ?? 1,
    agility: scalingData?.trainingScaling?.agility?.tier ?? 1,
    meditation: scalingData?.trainingScaling?.meditation?.tier ?? 1,
    vitality: scalingData?.trainingScaling?.vitality?.tier ?? 1,
  };
  const activities = buildPhase1Activities(onboardingDay, tiers);
  const totalMins = Math.ceil(activities.reduce((sum, a) => sum + a.duration, 0) / 60);

  const statLevels = playerData?.statLevels ?? {
    strength: { level: 1 },
    agility: { level: 1 },
    sense: { level: 1 },
    vitality: { level: 1 },
  };

  const consecutiveDays = homeData?.stability?.consecutiveActiveDays ?? homeData?.streak ?? 0;
  const phaseName = homeData?.phase?.name ?? "Phase 1 — Stabilization";

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const suggestedHour = currentMin > 30 ? currentHour + 1 : currentHour;
  const suggestedStart = `${suggestedHour > 12 ? suggestedHour - 12 : suggestedHour}:${currentMin > 30 ? "00" : "30"} ${suggestedHour >= 12 ? "PM" : "AM"}`;
  const suggestedEnd = `${(suggestedHour + (totalMins > 30 ? 1 : 0)) > 12 ? (suggestedHour + (totalMins > 30 ? 1 : 0)) - 12 : (suggestedHour + (totalMins > 30 ? 1 : 0))}:${((currentMin > 30 ? 0 : 30) + totalMins) % 60 < 10 ? "0" : ""}${((currentMin > 30 ? 0 : 30) + totalMins) % 60} ${(suggestedHour + (totalMins > 30 ? 1 : 0)) >= 12 ? "PM" : "AM"}`;

  const handleFlowComplete = (completedIds: string[], _bonusAwarded: boolean) => {
    if (completedIds.length > 0) {
      setFlowCompletedToday(true);
      localStorage.setItem("ascend_light_movement_completed", new Date().toISOString().split("T")[0]);
    }
    setFlowActive(false);
  };

  return (
    <SystemLayout>
      <AnimatePresence>
        {flowActive && player && (
          <DailyFlowEngine
            activities={activities}
            playerId={player.id}
            onComplete={handleFlowComplete}
            onCancel={() => setFlowActive(false)}
          />
        )}
      </AnimatePresence>

      <div
        className="flex flex-col gap-5 py-6 px-1 max-w-md mx-auto w-full"
        data-testid="home-page"
      >
        {!dismissedNotification && homeData?.notification && (
          <NotificationBanner
            notification={homeData.notification}
            onDismiss={() => setDismissedNotification(true)}
          />
        )}

        <div className="pt-2" data-testid="daily-status-section">
          {playerData?.name && (
            <p className="text-[10px] uppercase tracking-[0.12em] mb-1" style={{ color: colors.textMuted }}>
              {playerData.name}
            </p>
          )}
          <div className="flex items-baseline gap-3">
            <p className="text-lg font-display font-medium leading-relaxed" style={{ color: colors.text }}>
              Phase: Stabilization
            </p>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
              data-testid="text-player-level"
            >
              Lv {playerData?.level ?? 1}
            </span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
            Day {consecutiveDays} of Consistency
          </p>

          {/* XP Bar — revealed after onboarding as evidence of progress */}
          {(() => {
            const currentXP = playerData?.exp ?? 0;
            const maxXP = playerData?.maxExp ?? 100;
            const pct = Math.min(100, Math.round((currentXP / maxXP) * 100));
            return (
              <div className="mt-4" data-testid="xp-progress-section">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: colors.textMuted }}>
                    Level {playerData?.level ?? 1}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                    {currentXP} / {maxXP} XP
                  </span>
                </div>
                <div
                  className="w-full h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${colors.primary}18` }}
                  data-testid="xp-bar-track"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: colors.primary,
                      opacity: 0.7,
                    }}
                    data-testid="xp-bar-fill"
                  />
                </div>
                <p className="text-[10px] mt-2 italic" style={{ color: `${colors.textMuted}88` }}>
                  This is the result of what you've already done.
                </p>
              </div>
            );
          })()}
        </div>

        <div
          data-testid="training-flow-card"
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: `${colors.surface || colors.background}cc`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: colors.primary }} />
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.primary }}>
                  Today's Flow
                </span>
              </div>
              <span className="text-[10px]" style={{ color: colors.textMuted }}>
                ~{totalMins} min
              </span>
            </div>

            <div className="space-y-1.5">
              {FLOW_ACTIVITIES.map((act, i) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.label}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg"
                    data-testid={`flow-step-${i}`}
                    style={{
                      backgroundColor: flowCompletedToday
                        ? "#22c55e08"
                        : `${act.color}06`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: flowCompletedToday ? "#22c55e18" : `${act.color}18`,
                      }}
                    >
                      {flowCompletedToday ? (
                        <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                      ) : (
                        <Icon size={14} style={{ color: act.color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm block leading-tight"
                        style={{ color: flowCompletedToday ? colors.textMuted : colors.text }}
                      >
                        {act.label}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: `${colors.textMuted}88` }}
                      >
                        {act.sublabel}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-mono shrink-0"
                      style={{ color: flowCompletedToday ? "#22c55e80" : `${act.color}80` }}
                    >
                      {i + 1}/4
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-4 pb-4 pt-2">
            {flowCompletedToday ? (
              <div
                className="w-full py-3 rounded-xl text-center text-sm font-bold"
                style={{
                  backgroundColor: "#22c55e10",
                  color: "#22c55e",
                  border: "1px solid #22c55e25",
                }}
                data-testid="text-flow-completed"
              >
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  Flow completed today
                </span>
              </div>
            ) : (
              <button
                data-testid="button-begin-flow"
                onClick={() => setFlowActive(true)}
                className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                  boxShadow: `0 0 24px ${colors.primaryGlow}30`,
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Play size={16} />
                  Begin Daily Flow
                </span>
              </button>
            )}
          </div>
        </div>

        <div
          data-testid="consistency-coach-card"
          className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{
            backgroundColor: `${colors.primary}08`,
            border: `1px solid ${colors.primary}12`,
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${colors.primary}18` }}
          >
            <Brain size={12} style={{ color: colors.primary }} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.12em] font-bold mb-0.5" style={{ color: `${colors.primary}80` }}>
              Coach
            </p>
            <p className="text-xs leading-relaxed" style={{ color: `${colors.text}cc` }}>
              Consistency is becoming your baseline.
            </p>
          </div>
        </div>

        <div
          data-testid="suggested-time-card"
          className="rounded-xl px-4 py-3"
          style={{
            backgroundColor: `${colors.primary}06`,
            border: `1px solid ${colors.primary}12`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock size={12} style={{ color: colors.primary }} />
            <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: `${colors.primary}99` }}>
              Suggested Time
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: `${colors.text}cc` }}>
            You have a {totalMins}‑minute window around {suggestedStart}.
          </p>
          <button
            className="mt-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
            style={{ color: colors.primary }}
            onClick={() => setLocation("/schedule")}
            data-testid="button-view-sectograph"
          >
            <Eye size={12} />
            View in Sectograph
          </button>
        </div>

        <div
          data-testid="progress-snapshot-card"
          className="rounded-xl px-4 py-4"
          style={{
            backgroundColor: `${colors.surface || colors.background}cc`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={12} style={{ color: colors.textMuted }} />
            <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.textMuted }}>
              Quick Progress
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(["strength", "agility", "sense", "vitality"] as const).map((stat) => {
              const Icon = STAT_ICONS[stat];
              const color = STAT_COLORS[stat];
              const level = statLevels[stat]?.level ?? 1;
              return (
                <div
                  key={stat}
                  className="text-center p-2 rounded-lg"
                  style={{
                    backgroundColor: `${color}08`,
                    border: `1px solid ${color}15`,
                  }}
                  data-testid={`stat-snapshot-${stat}`}
                >
                  <Icon size={16} className="mx-auto mb-1" style={{ color }} />
                  <div className="text-lg font-bold font-mono" style={{ color: colors.text }}>
                    {level}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    {STAT_LABELS[stat]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
      </div>

    </SystemLayout>
  );
}

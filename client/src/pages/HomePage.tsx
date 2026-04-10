import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Play, Wind, Brain, Heart, Clock, BarChart3, Dumbbell, Eye, Zap, CheckCircle2 } from "lucide-react";
import { NotificationBanner } from "@/components/game/NotificationBanner";
import { ReturnProtocolScreen } from "@/components/game/ReturnProtocolScreen";
import { DailyFlowEngine } from "@/components/game/DailyFlowEngine";
import { SystemLayout } from "@/components/game/SystemLayout";
import { buildPhase1Activities, type CategoryTiers } from "@/lib/activityEngine";
import { AnimatePresence, motion } from "framer-motion";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";

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
  completedDays: number[];
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
  onboardingDayCompleted?: boolean;
}

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

const FLOW_ACTIVITIES = [
  { label: "Reset", sublabel: "2 min breathing", icon: Brain, color: "#3b82f6" },
  { label: "Strength", sublabel: "3–5 min circuit", icon: Dumbbell, color: "#ef4444" },
  { label: "Mobility", sublabel: "2–3 min", icon: Wind, color: "#22c55e" },
  { label: "Vitality Check", sublabel: "hydration · sleep · nutrition", icon: Heart, color: "#f59e0b" },
];

export default function HomePage() {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [, setLocation] = useLocation();

  const [dismissedNotification, setDismissedNotification] = useState(false);
  const [returnProtocolDismissed, setReturnProtocolDismissed] = useState(false);
  const [flowActive, setFlowActive] = useState(false);

  // Lazy-initialize from sessionStorage so the value is correct on the VERY FIRST
  // render — before any effects run. Prevents the dashboard from flashing while the
  // onboarding completion screen should be showing.
  const [justCompletedDayId, setJustCompletedDayId] = useState<number | null>(() => {
    const raw = sessionStorage.getItem("ascend_just_completed_day");
    if (raw) {
      const day = parseInt(raw, 10);
      sessionStorage.removeItem("ascend_just_completed_day");
      if (!isNaN(day) && day >= 1 && day <= 5) return day;
    }
    return null;
  });

  // Store the DATE the flow was completed, not a boolean.
  // flowCompletedToday is derived by comparing this date to today, so it
  // automatically becomes false on a new calendar day — even without remounting.
  const [flowCompletedDate, setFlowCompletedDate] = useState(
    () => localStorage.getItem("ascend_light_movement_completed") ?? ""
  );

  const { data: homeData, isLoading: homeLoading } = useQuery<HomeData>({
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

  // Derived fresh every render — correct across day boundaries and DevPanel resets
  const todayStr = new Date().toISOString().split("T")[0];
  const flowCompletedToday = flowCompletedDate === todayStr;

  // Listen for DevPanel "Reset Today's Sessions" so the flow-completed state clears immediately
  useEffect(() => {
    const handler = () => setFlowCompletedDate("");
    window.addEventListener("ascend:sessions-reset", handler);
    return () => window.removeEventListener("ascend:sessions-reset", handler);
  }, []);

  // Block all renders until homeData is loaded — prevents a flash of Day 1
  // onboarding for returning users whose onboardingDay defaults to 1 before fetch.
  if (!homeData || homeLoading) {
    return (
      <div
        style={{ minHeight: "100dvh", backgroundColor: "#06060f" }}
        data-testid="home-loading"
      />
    );
  }

  // Return protocol takes top priority
  if (homeData?.returnProtocol && !returnProtocolDismissed) {
    return (
      <ReturnProtocolScreen
        data={homeData.returnProtocol}
        onComplete={() => setReturnProtocolDismissed(true)}
      />
    );
  }

  // ── Onboarding gate ─────────────────────────────────────────────────────────
  // Render OnboardingFlow when:
  //   (a) onboarding is not yet complete, OR
  //   (b) a day was just finished this navigation (completion screen needed even
  //       if isOnboardingComplete is now true after Day 5)
  const lastCompletedDay = homeData.completedDays.length > 0
    ? homeData.completedDays[homeData.completedDays.length - 1]
    : null;
  const completionScreenPending =
    justCompletedDayId !== null &&
    lastCompletedDay !== null &&
    justCompletedDayId === lastCompletedDay;

  if (!isOnboardingComplete || completionScreenPending) {
    return (
      <OnboardingFlow
        homeData={homeData}
        justCompletedDay={completionScreenPending ? justCompletedDayId : null}
        onClearJustCompleted={() => setJustCompletedDayId(null)}
      />
    );
  }

  // ── Post-onboarding main dashboard ──────────────────────────────────────────
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

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const suggestedHour = currentMin > 30 ? currentHour + 1 : currentHour;
  const suggestedStart = `${suggestedHour > 12 ? suggestedHour - 12 : suggestedHour}:${currentMin > 30 ? "00" : "30"} ${suggestedHour >= 12 ? "PM" : "AM"}`;
  const suggestedEnd = `${(suggestedHour + (totalMins > 30 ? 1 : 0)) > 12 ? (suggestedHour + (totalMins > 30 ? 1 : 0)) - 12 : (suggestedHour + (totalMins > 30 ? 1 : 0))}:${((currentMin > 30 ? 0 : 30) + totalMins) % 60 < 10 ? "0" : ""}${((currentMin > 30 ? 0 : 30) + totalMins) % 60} ${(suggestedHour + (totalMins > 30 ? 1 : 0)) >= 12 ? "PM" : "AM"}`;

  const handleFlowComplete = (completedIds: string[], _bonusAwarded: boolean) => {
    if (completedIds.length > 0) {
      const dateStr = new Date().toISOString().split("T")[0];
      localStorage.setItem("ascend_light_movement_completed", dateStr);
      setFlowCompletedDate(dateStr);
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
            isOnboardingComplete={isOnboardingComplete}
          />
        )}
      </AnimatePresence>

      <div
        className="flex flex-col gap-4 py-6 px-1 max-w-md mx-auto w-full"
        data-testid="home-page"
      >
        {!dismissedNotification && homeData?.notification && (
          <NotificationBanner
            notification={homeData.notification}
            onDismiss={() => setDismissedNotification(true)}
          />
        )}

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="pt-2" data-testid="daily-status-section">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] mb-0.5" style={{ color: colors.textMuted }}>
                {playerData?.name || "AWAKENED"}
              </p>
              <p className="text-lg font-display font-medium leading-tight" style={{ color: colors.text }}>
                Phase: {homeData?.phase?.name ?? "Stabilization"}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                Day {consecutiveDays} of Consistency
              </p>
            </div>
            <span
              className="text-sm font-mono font-bold px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: `${colors.primary}15`, color: colors.primary, border: `1px solid ${colors.primary}25` }}
              data-testid="text-player-level"
            >
              Lv {playerData?.level ?? 1}
            </span>
          </div>

          {/* XP Bar */}
          {(() => {
            const withinLevelXP = playerData?.exp ?? 0;
            const maxXP = playerData?.maxExp ?? 100;
            const totalXP = playerData?.totalExp ?? 0;
            const pct = Math.min(100, Math.round((withinLevelXP / maxXP) * 100));
            return (
              <div className="mt-3" data-testid="xp-progress-section">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                    Level {playerData?.level ?? 1}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                    {totalXP.toLocaleString()} XP
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${colors.primary}18` }}
                  data-testid="xp-bar-track"
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: colors.primary, boxShadow: `0 0 8px ${colors.primaryGlow}` }}
                    data-testid="xp-bar-fill"
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── PRIMARY ACTION ─────────────────────────────────────── */}
        {flowCompletedToday ? (
          <div
            className="w-full py-3.5 rounded-xl text-center text-sm font-bold"
            style={{ backgroundColor: "#22c55e10", color: "#22c55e", border: "1px solid #22c55e28" }}
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
            className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
            style={{
              backgroundColor: colors.primary,
              color: colors.background,
              boxShadow: `0 0 28px ${colors.primaryGlow}35`,
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Play size={16} />
              Begin Daily Flow
            </span>
          </button>
        )}

        {/* ── TODAY'S FLOW ───────────────────────────────────────── */}
        <div
          data-testid="training-flow-card"
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: `${colors.surface || colors.background}cc`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
        >
          <div className="px-4 pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={13} style={{ color: colors.primary }} />
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.primary }}>
                  Today's Flow
                </span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: flowCompletedToday ? "#22c55e" : colors.textMuted }}>
                {flowCompletedToday ? "4 / 4 done" : `~${totalMins} min`}
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
                    style={{ backgroundColor: flowCompletedToday ? "#22c55e08" : `${act.color}06` }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: flowCompletedToday ? "#22c55e18" : `${act.color}18` }}
                    >
                      {flowCompletedToday ? (
                        <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                      ) : (
                        <Icon size={14} style={{ color: act.color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm block leading-tight" style={{ color: flowCompletedToday ? colors.textMuted : colors.text }}>
                        {act.label}
                      </span>
                      <span className="text-[10px]" style={{ color: `${colors.textMuted}88` }}>
                        {act.sublabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── INSIGHTS ───────────────────────────────────────────── */}
        <div
          data-testid="coach-insight-card"
          className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.primary}14` }}
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
              {homeData?.insight ?? "Consistency is becoming your baseline."}
            </p>
          </div>
        </div>

        <div
          data-testid="suggested-time-card"
          className="rounded-xl px-4 py-3"
          style={{ backgroundColor: `${colors.primary}06`, border: `1px solid ${colors.primary}12` }}
        >
          <div className="flex items-center gap-2 mb-1.5">
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

        {homeData?.identity?.reflection && (
          <div
            data-testid="identity-reflection-card"
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.1)" }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-[0.12em] font-bold" style={{ color: "rgba(139,92,246,0.7)" }}>
                {homeData.identity.reflection.category === "anchor" ? "Reflection" : "Identity"}
              </p>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(139,92,246,0.08)", color: "rgba(139,92,246,0.6)" }}
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

        {/* ── STATS ──────────────────────────────────────────────── */}
        <div
          data-testid="progress-snapshot-card"
          className="rounded-xl px-4 py-4"
          style={{ backgroundColor: `${colors.surface || colors.background}cc`, border: `1px solid ${colors.surfaceBorder}` }}
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
                  style={{ backgroundColor: `${color}08`, border: `1px solid ${color}15` }}
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
      </div>
    </SystemLayout>
  );
}

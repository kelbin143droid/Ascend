import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useEffect, useState } from "react";
import { NotificationBanner } from "@/components/game/NotificationBanner";
import { ReturnProtocolScreen, type AwayModeReason } from "@/components/game/ReturnProtocolScreen";
import { Day6Home } from "@/components/game/Day6Home";
import { RiveHome } from "@/components/game/RiveHome";

const RETURN_PROTOCOL_DONE_PREFIX = "ascend_return_protocol_done";
const AWAY_MODE_PREFIX = "ascend_away_mode";

interface AwayModeState {
  active: boolean;
  reason: AwayModeReason;
  startedAt: string;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function returnProtocolStorageKey(playerId: string | number | undefined) {
  return playerId ? `${RETURN_PROTOCOL_DONE_PREFIX}_${playerId}` : null;
}

function wasReturnProtocolHandledToday(playerId: string | number | undefined) {
  const key = returnProtocolStorageKey(playerId);
  if (!key) return false;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    return JSON.parse(raw)?.date === todayKey();
  } catch {
    return false;
  }
}

function markReturnProtocolHandledToday(playerId: string | number | undefined, tier?: string | null) {
  const key = returnProtocolStorageKey(playerId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({ date: todayKey(), tier: tier ?? null }));
  } catch {}
}

function awayModeStorageKey(playerId: string | number | undefined) {
  return playerId ? `${AWAY_MODE_PREFIX}_${playerId}` : null;
}

function readAwayMode(playerId: string | number | undefined): AwayModeState | null {
  const key = awayModeStorageKey(playerId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AwayModeState;
    return parsed?.active ? parsed : null;
  } catch {
    return null;
  }
}

function writeAwayMode(playerId: string | number | undefined, reason: AwayModeReason) {
  const key = awayModeStorageKey(playerId);
  if (!key) return null;
  const next: AwayModeState = { active: true, reason, startedAt: new Date().toISOString() };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
  return next;
}

function clearAwayMode(playerId: string | number | undefined) {
  const key = awayModeStorageKey(playerId);
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

function awayReasonLabel(reason: AwayModeReason) {
  const labels: Record<AwayModeReason, string> = {
    sick: "Sick",
    injured: "Injured",
    emergency: "Emergency",
    travel: "Travel",
    mental_reset: "Mental reset",
    busy_season: "Busy season",
  };
  return labels[reason];
}

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
      steps: { id: string; type: "reflection" | "affirmation"; title: string; instruction: string; durationSeconds: number }[];
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

export default function HomePage() {
  const { player } = useGame();

  const [dismissedNotification, setDismissedNotification] = useState(false);
  const [returnProtocolDismissed, setReturnProtocolDismissed] = useState(() =>
    wasReturnProtocolHandledToday(player?.id)
  );
  const [awayMode, setAwayMode] = useState<AwayModeState | null>(() => readAwayMode(player?.id));
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

  useEffect(() => {
    setReturnProtocolDismissed(wasReturnProtocolHandledToday(player?.id));
    setAwayMode(readAwayMode(player?.id));
  }, [player?.id]);

  const handleReturnProtocolComplete = () => {
    markReturnProtocolHandledToday(player?.id, homeData?.returnProtocol?.tier);
    setReturnProtocolDismissed(true);
  };

  const handleAwayMode = (reason: AwayModeReason) => {
    const next = writeAwayMode(player?.id, reason);
    markReturnProtocolHandledToday(player?.id, homeData?.returnProtocol?.tier);
    setAwayMode(next);
    setReturnProtocolDismissed(true);
  };

  const handleResumeFromAway = () => {
    clearAwayMode(player?.id);
    markReturnProtocolHandledToday(player?.id, homeData?.returnProtocol?.tier);
    setAwayMode(null);
    setReturnProtocolDismissed(true);
  };

  // Show Rive splash while data is loading or onboarding is not yet complete
  if (!homeData || homeLoading || !homeData.isOnboardingComplete) {
    return <RiveHome />;
  }

  if (homeData?.returnProtocol && !returnProtocolDismissed && !awayMode?.active) {
    return (
      <ReturnProtocolScreen
        data={homeData.returnProtocol}
        onComplete={handleReturnProtocolComplete}
        onAwayMode={handleAwayMode}
      />
    );
  }

  return (
    <>
      {!awayMode?.active && !dismissedNotification && homeData?.notification && localStorage.getItem("ascend_app_tutorial_seen") === "1" && (
        <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto px-4 pt-3">
          <NotificationBanner
            notification={homeData.notification}
            onDismiss={() => setDismissedNotification(true)}
          />
        </div>
      )}
      {awayMode?.active && (
        <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto px-4 pt-3 pointer-events-none">
          <div
            className="pointer-events-auto rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{
              background: "rgba(6,12,24,0.94)",
              border: "1px solid rgba(34,197,94,0.25)",
              boxShadow: "0 12px 34px rgba(0,0,0,0.35), 0 0 28px rgba(34,197,94,0.10)",
              backdropFilter: "blur(18px)",
            }}
            data-testid="away-mode-banner"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "#22c55e" }}>
                Away Mode
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(230,238,255,0.78)" }}>
                {awayReasonLabel(awayMode.reason)} · prompts paused
              </p>
            </div>
            <button
              onClick={handleResumeFromAway}
              className="rounded-xl px-3 py-2 text-xs font-bold active:scale-95"
              style={{
                background: "rgba(34,197,94,0.14)",
                border: "1px solid rgba(34,197,94,0.28)",
                color: "#86efac",
              }}
              data-testid="button-resume-from-away-mode"
            >
              Resume
            </button>
          </div>
        </div>
      )}
      <Day6Home
        homeData={homeData}
        playerData={playerData ?? null}
        player={player!}
        scalingData={scalingData ?? null}
      />
    </>
  );
}

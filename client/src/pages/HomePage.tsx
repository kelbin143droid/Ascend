import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useState } from "react";
import { NotificationBanner } from "@/components/game/NotificationBanner";
import { ReturnProtocolScreen } from "@/components/game/ReturnProtocolScreen";
import { Day6Home } from "@/components/game/Day6Home";
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

export default function HomePage() {
  const { player } = useGame();

  const [dismissedNotification, setDismissedNotification] = useState(false);
  const [returnProtocolDismissed, setReturnProtocolDismissed] = useState(false);

  const [justCompletedDayId, setJustCompletedDayId] = useState<number | null>(() => {
    const raw = sessionStorage.getItem("ascend_just_completed_day");
    if (raw) {
      const day = parseInt(raw, 10);
      sessionStorage.removeItem("ascend_just_completed_day");
      if (!isNaN(day) && day >= 1 && day <= 5) return day;
    }
    return null;
  });

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

  if (!homeData || homeLoading) {
    return (
      <div
        style={{ minHeight: "100dvh", backgroundColor: "#06060f" }}
        data-testid="home-loading"
      />
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

  const isOnboardingComplete = homeData?.isOnboardingComplete ?? false;
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

  return (
    <>
      {!dismissedNotification && homeData?.notification && (
        <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto px-4 pt-3">
          <NotificationBanner
            notification={homeData.notification}
            onDismiss={() => setDismissedNotification(true)}
          />
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

import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useEffect, useState } from "react";
import { NotificationBanner } from "@/components/game/NotificationBanner";
import { ReturnProtocolScreen } from "@/components/game/ReturnProtocolScreen";
import { Day6Home } from "@/components/game/Day6Home";
import {
  isNativePlatform,
  requestNotificationPermissions,
  scheduleNotification,
} from "@/lib/notificationService";

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
  // Permission is requested on explicit user action (bell tap) — no mount-time prompt.
  const [bellStatus, setBellStatus] = useState<string>("");
  const [bellTapCount, setBellTapCount] = useState(0);

  const handleTestNotification = async () => {
    setBellTapCount((n) => n + 1);
    setBellStatus("Tap registered — checking platform…");
    console.log("[HomePage] Bell tapped — requesting notification permission");

    if (!isNativePlatform()) {
      setBellStatus("Web preview: notifications only fire on the Android build.");
      return;
    }
    setBellStatus("Asking Android for permission…");
    const granted = await requestNotificationPermissions();
    if (!granted) {
      setBellStatus("Permission denied. Enable it in Android Settings → Apps → Solo Quest RPG → Notifications.");
      console.warn("[HomePage] Permission denied — cannot send test notification");
      return;
    }
    setBellStatus("Permission OK. Scheduling test notification…");
    const fireAt = new Date(Date.now() + 1_000);
    const result = await scheduleNotification(
      "Solo Quest RPG — Test",
      "If you can read this, notifications work!",
      fireAt,
    );
    console.log("[HomePage] Test notification scheduled:", result);
    if (result.scheduled) {
      setBellStatus(`Scheduled (id ${result.notificationId}). Notification should appear within 1s.`);
    } else {
      setBellStatus(`Schedule failed: ${result.reason ?? "unknown"}`);
    }
  };

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

  return (
    <>
      {!dismissedNotification && homeData?.notification && localStorage.getItem("ascend_app_tutorial_seen") === "1" && (
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
      <button
        type="button"
        onClick={handleTestNotification}
        data-testid="button-test-notification"
        aria-label="Send a test notification"
        title="Send a test notification"
        style={{
          position: "fixed",
          bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
          left: "calc(16px + env(safe-area-inset-left, 0px))",
          zIndex: 2147483647,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.18)",
          background:
            bellTapCount > 0
              ? "linear-gradient(135deg,#22c55e,#0ea5e9)"
              : "linear-gradient(135deg,#0ea5e9,#8b5cf6)",
          color: "#fff",
          fontSize: 22,
          lineHeight: 1,
          boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
          cursor: "pointer",
          pointerEvents: "auto",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "rgba(255,255,255,0.2)",
          WebkitUserSelect: "none",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        {bellTapCount === 0 ? "🔔" : `🔔${bellTapCount}`}
      </button>
      {bellStatus && (
        <div
          data-testid="text-bell-status"
          onClick={() => setBellStatus("")}
          style={{
            position: "fixed",
            bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
            left: "calc(80px + env(safe-area-inset-left, 0px))",
            right: "calc(16px + env(safe-area-inset-right, 0px))",
            maxWidth: 320,
            zIndex: 2147483647,
            background: "rgba(11,16,32,0.95)",
            color: "#fff",
            fontSize: 12,
            lineHeight: 1.35,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
            pointerEvents: "auto",
          }}
        >
          {bellStatus}
        </div>
      )}
    </>
  );
}

import React, { Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { GameProvider, useGame } from "@/context/GameContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageStageProvider } from "@/context/LanguageStageContext";
import { RolesProvider } from "@/context/RolesContext";
import { WeeklyGoalsProvider, useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { TasksProvider } from "@/context/TasksContext";
import {
  initNotifications,
  isNativePlatform,
  listPendingNotifications,
} from "@/lib/notificationService";
import { syncWindDownNotification, subscribeSleepMode } from "@/lib/sleepModeStore";
import { installNativeFetchBase } from "@/lib/apiBase";
import HomePage from "@/pages/HomePage";
import StatusPage from "@/pages/StatusPage";
import TrainPage from "@/pages/TrainPage";
import CoachPage from "@/pages/CoachPage";
import InventoryPage from "@/pages/InventoryPage";
import SurvivalPage from "@/pages/SurvivalPage";

// Heavy 3D scenes — code-split so the initial mobile bundle stays small.
const DungeonPage = React.lazy(() => import("@/pages/DungeonPage"));
const Game3DPage = React.lazy(() => import("@/pages/Game3DPage"));
const HousingPage = React.lazy(() => import("@/pages/HousingPage"));
import ProfilePage from "@/pages/ProfilePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import LibraryPage from "@/pages/LibraryPage";
import WeeklyPlanningPage from "@/pages/WeeklyPlanningPage";
import TrialsPage from "@/pages/TrialsPage";
import CalendarPage from "@/pages/CalendarPage";
import SectographPage from "@/pages/SectographPage";
import HabitsPage from "@/pages/HabitsPage";
import NutritionPage from "@/pages/NutritionPage";
import GuidedSessionPage from "@/pages/GuidedSessionPage";
import WakeFlowPage from "@/pages/WakeFlowPage";
import NightFlowPage from "@/pages/NightFlowPage";
import SleepSettingsPage from "@/pages/SleepSettingsPage";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import FlowApp from "@/pages/FlowApp";
import { VoiceAlertEngine } from "@/components/game/VoiceAlertEngine";
import NotFound from "@/pages/not-found";
import { PhaseUnlockOverlay } from "@/components/game/PhaseUnlockOverlay";
import { IntroWrapper } from "@/components/game/IntroWrapper";

function PlanningProviders({ children }: { children: React.ReactNode }) {
  const { player } = useGame();
  const userId = player?.id || null;
  
  return (
    <RolesProvider userId={userId}>
      <WeeklyGoalsProvider userId={userId}>
        <TasksProvider userId={userId}>
          {children}
        </TasksProvider>
      </WeeklyGoalsProvider>
    </RolesProvider>
  );
}

function PlanningGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/weekly-planning" component={WeeklyPlanningPage} />
      <Route path="/trials" component={TrialsPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/sectograph" component={SectographPage} />
      <Route path="/nutrition" component={NutritionPage} />
      <Route path="/" component={HomePage} />
      <Route path="/schedule" component={StatusPage} />
      <Route path="/train" component={TrainPage} />
      <Route path="/coach" component={CoachPage} />
      <Route path="/arena" component={DungeonPage} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/game3d" component={Game3DPage} />
      <Route path="/housing" component={HousingPage} />
      <Route path="/survival" component={SurvivalPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/habits" component={HabitsPage} />
      <Route path="/wake-flow" component={WakeFlowPage} />
      <Route path="/night-flow" component={NightFlowPage} />
      <Route path="/sleep-settings" component={SleepSettingsPage} />
      <Route path="/notification-settings" component={NotificationSettingsPage} />
      <Route path="/guided-session/:sessionId">
        {(params: { sessionId?: string }) => <GuidedSessionPage key={params?.sessionId ?? "session"} />}
      </Route>
      <Route path="/flow" component={FlowApp} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * One-time migration: cancel any pending per-block `__nightflow` wind-down
 * pings scheduled by older builds of SectographPage. Wind-down notifications
 * now flow exclusively through `syncWindDownNotification()` (cycle math), so
 * leftover legacy pings would cause duplicate reminders. We match by the
 * `extra.source` payload tag the old scheduler set.
 */
async function cancelLegacyWindDownPings(): Promise<void> {
  try {
    const pending = await listPendingNotifications();
    const legacyIds = pending
      .filter((n) => {
        const extra = (n.extra ?? {}) as Record<string, unknown>;
        const src = typeof extra.source === "string" ? extra.source : "";
        return src === "night-flow" || src === "night-flow-minimal";
      })
      .map((n) => ({ id: n.id }));
    if (legacyIds.length === 0) return;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: legacyIds });
  } catch (err) {
    console.warn("[App] legacy wind-down cleanup failed", err);
  }
}

function NativeBootstrap() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isNativePlatform()) return;
    installNativeFetchBase();
    initNotifications()
      .then(() => cancelLegacyWindDownPings())
      .then(() => syncWindDownNotification())
      .catch((err) => console.warn("[App] notification init failed", err));
  }, []);

  // Re-schedule the wind-down ping whenever the user edits sleep settings.
  useEffect(() => {
    const unsub = subscribeSleepMode(() => {
      syncWindDownNotification().catch((err) =>
        console.warn("[App] wind-down sync failed", err),
      );
    });
    return unsub;
  }, []);

  // Route the user when they tap a scheduled notification.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, unknown>>).detail ?? {};
      const route = typeof detail.route === "string" ? detail.route : null;
      const source = typeof detail.source === "string" ? detail.source : null;
      // Sectograph-originated notifications always land on /sectograph,
      // even on older builds where `route` wasn't stored in extra.
      const target =
        route ||
        (source === "wake-alarm" ? "/wake-flow" : null) ||
        (source === "night-flow" ? "/night-flow" : null) ||
        (source && source.startsWith("sectograph") ? "/sectograph" : null);
      if (target) {
        setLocation(target);
      }
    };
    window.addEventListener("ascend:notification-tap", handler as EventListener);
    return () => window.removeEventListener("ascend:notification-tap", handler as EventListener);
  }, [setLocation]);

  return null;
}

function PageFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1020",
        color: "#94a3b8",
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
      }}
    >
      Loading…
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GameProvider>
          <LanguageStageProvider>
            <PlanningProviders>
              <IntroWrapper>
                <PlanningGate>
                  <Suspense fallback={<PageFallback />}>
                    <Router />
                  </Suspense>
                </PlanningGate>
                <PhaseUnlockOverlay />
                <Toaster />
                <NativeBootstrap />
                <VoiceAlertEngine />
              </IntroWrapper>
            </PlanningProviders>
          </LanguageStageProvider>
        </GameProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

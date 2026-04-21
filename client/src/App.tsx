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
import { initNotifications, isNativePlatform } from "@/lib/notificationService";
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
import FlowApp from "@/pages/FlowApp";
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
      <Route path="/guided-session/:sessionId">
        {(params: { sessionId?: string }) => <GuidedSessionPage key={params?.sessionId ?? "session"} />}
      </Route>
      <Route path="/flow" component={FlowApp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function NativeBootstrap() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isNativePlatform()) return;
    installNativeFetchBase();
    initNotifications().catch((err) =>
      console.warn("[App] notification init failed", err),
    );
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
              </IntroWrapper>
            </PlanningProviders>
          </LanguageStageProvider>
        </GameProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

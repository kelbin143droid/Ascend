import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { GameProvider, useGame } from "@/context/GameContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageStageProvider } from "@/context/LanguageStageContext";
import { RolesProvider } from "@/context/RolesContext";
import { WeeklyGoalsProvider, useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { TasksProvider } from "@/context/TasksContext";
import HomePage from "@/pages/HomePage";
import StatusPage from "@/pages/StatusPage";
import TrainPage from "@/pages/TrainPage";
import CoachPage from "@/pages/CoachPage";
import DungeonPage from "@/pages/DungeonPage";
import InventoryPage from "@/pages/InventoryPage";
import Game3DPage from "@/pages/Game3DPage";
import HousingPage from "@/pages/HousingPage";
import SurvivalPage from "@/pages/SurvivalPage";
import ProfilePage from "@/pages/ProfilePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import LibraryPage from "@/pages/LibraryPage";
import WeeklyPlanningPage from "@/pages/WeeklyPlanningPage";
import TrialsPage from "@/pages/TrialsPage";
import CalendarPage from "@/pages/CalendarPage";
import SectographPage from "@/pages/SectographPage";
import HabitsPage from "@/pages/HabitsPage";
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GameProvider>
          <LanguageStageProvider>
            <PlanningProviders>
              <IntroWrapper>
                <PlanningGate>
                  <Router />
                </PlanningGate>
                <PhaseUnlockOverlay />
                <Toaster />
              </IntroWrapper>
            </PlanningProviders>
          </LanguageStageProvider>
        </GameProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

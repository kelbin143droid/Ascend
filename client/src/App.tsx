import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { GameProvider, useGame } from "@/context/GameContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { RolesProvider } from "@/context/RolesContext";
import { WeeklyGoalsProvider, useWeeklyGoals } from "@/context/WeeklyGoalsContext";
import { TasksProvider } from "@/context/TasksContext";
import StatusPage from "@/pages/StatusPage";
import DungeonPage from "@/pages/DungeonPage";
import InventoryPage from "@/pages/InventoryPage";
import Game3DPage from "@/pages/Game3DPage";
import HousingPage from "@/pages/HousingPage";
import SurvivalPage from "@/pages/SurvivalPage";
import ProfilePage from "@/pages/ProfilePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import LibraryPage from "@/pages/LibraryPage";
import WeeklyPlanningPage from "@/pages/WeeklyPlanningPage";
import NotFound from "@/pages/not-found";
import { RankUnlockOverlay } from "@/components/game/RankUnlockOverlay";
import { LevelUpOverlay } from "@/components/game/LevelUpOverlay";
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
  const [location, navigate] = useLocation();
  const { hasGoalsForCurrentWeek, isLoading } = useWeeklyGoals();
  const { player } = useGame();

  useEffect(() => {
    if (!isLoading && player && !hasGoalsForCurrentWeek && location !== "/weekly-planning") {
      navigate("/weekly-planning");
    }
  }, [isLoading, hasGoalsForCurrentWeek, location, navigate, player]);

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/weekly-planning" component={WeeklyPlanningPage} />
      <Route path="/" component={StatusPage} />
      <Route path="/arena" component={DungeonPage} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/game3d" component={Game3DPage} />
      <Route path="/housing" component={HousingPage} />
      <Route path="/survival" component={SurvivalPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GameProvider>
          <PlanningProviders>
            <IntroWrapper>
              <PlanningGate>
                <Router />
              </PlanningGate>
              <LevelUpOverlay />
              <RankUnlockOverlay />
              <Toaster />
            </IntroWrapper>
          </PlanningProviders>
        </GameProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

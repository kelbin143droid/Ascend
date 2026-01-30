import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { GameProvider } from "@/context/GameContext";
import StatusPage from "@/pages/StatusPage";
import DungeonPage from "@/pages/DungeonPage";
import InventoryPage from "@/pages/InventoryPage";
import SkillsPage from "@/pages/SkillsPage";
import Game3DPage from "@/pages/Game3DPage";
import HousingPage from "@/pages/HousingPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={StatusPage} />
      <Route path="/dungeon" component={DungeonPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/skills" component={SkillsPage} />
      <Route path="/game3d" component={Game3DPage} />
      <Route path="/housing" component={HousingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <Router />
        <Toaster />
      </GameProvider>
    </QueryClientProvider>
  );
}

export default App;

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Player, Stats } from "@shared/schema";

interface GameContextType {
  player: Player | null;
  isLoading: boolean;
  addStat: (stat: keyof Stats) => void;
  gainExp: (amount: number) => void;
  modifyHp: (amount: number) => void;
  modifyMp: (amount: number) => void;
  levelUp: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const PLAYER_STORAGE_KEY = "solo_leveling_player_id";

export function GameProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [playerId, setPlayerId] = useState<string | null>(() => {
    return localStorage.getItem(PLAYER_STORAGE_KEY);
  });

  const { data: player, isLoading } = useQuery<Player>({
    queryKey: ["/api/player", playerId],
    queryFn: async () => {
      if (!playerId) throw new Error("No player ID");
      const res = await fetch(`/api/player/${playerId}`);
      if (!res.ok) throw new Error("Failed to fetch player");
      return res.json();
    },
    enabled: !!playerId,
    staleTime: 1000,
  });

  const createPlayerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/player", {
        name: "SUNG JIN-WOO",
        level: 1,
        job: "NONE",
        title: "WOLF SLAYER",
        hp: 100,
        maxHp: 100,
        mp: 10,
        maxMp: 10,
        stats: { strength: 10, agility: 10, sense: 10, vitality: 10, intelligence: 10 },
        availablePoints: 3,
        gold: 0,
        rank: "E",
        exp: 0,
        maxExp: 100,
        inventory: [],
        skills: [
          { id: "shadow_extraction", name: "Shadow Extraction", description: "Extract shadows from defeated enemies", mpCost: 30, cooldown: 60, level: 1, unlocked: true },
          { id: "rulers_authority", name: "Ruler's Authority", description: "Telekinetic control over objects", mpCost: 20, cooldown: 15, level: 1, unlocked: true },
          { id: "shadow_exchange", name: "Shadow Exchange", description: "Swap positions with a shadow soldier", mpCost: 50, cooldown: 120, level: 1, unlocked: false },
          { id: "monarch_domain", name: "Monarch's Domain", description: "Unleash overwhelming shadow aura", mpCost: 100, cooldown: 300, level: 1, unlocked: false },
        ],
      });
      return res.json();
    },
    onSuccess: (newPlayer) => {
      localStorage.setItem(PLAYER_STORAGE_KEY, newPlayer.id);
      setPlayerId(newPlayer.id);
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
    },
  });

  useEffect(() => {
    if (!playerId && !createPlayerMutation.isPending) {
      createPlayerMutation.mutate();
    }
  }, [playerId]);

  const addStatMutation = useMutation({
    mutationFn: async (stat: keyof Stats) => {
      if (!playerId) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${playerId}/add-stat`, { stat });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
    },
  });

  const gainExpMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!playerId) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${playerId}/gain-exp`, { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
    },
  });

  const modifyHpMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!playerId) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${playerId}/modify-hp`, { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
    },
  });

  const modifyMpMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!playerId) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${playerId}/modify-mp`, { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
    },
  });

  const addStat = useCallback((stat: keyof Stats) => {
    addStatMutation.mutate(stat);
  }, [addStatMutation]);

  const gainExp = useCallback((amount: number) => {
    gainExpMutation.mutate(amount);
  }, [gainExpMutation]);

  const modifyHp = useCallback((amount: number) => {
    modifyHpMutation.mutate(amount);
  }, [modifyHpMutation]);

  const modifyMp = useCallback((amount: number) => {
    modifyMpMutation.mutate(amount);
  }, [modifyMpMutation]);

  const levelUp = useCallback(() => {
    gainExpMutation.mutate(player?.maxExp || 100);
  }, [gainExpMutation, player?.maxExp]);

  return (
    <GameContext.Provider value={{ 
      player: player || null, 
      isLoading: isLoading || createPlayerMutation.isPending,
      addStat, 
      gainExp, 
      modifyHp, 
      modifyMp, 
      levelUp 
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

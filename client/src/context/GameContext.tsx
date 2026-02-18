import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Player, Stats, PendingPhaseUnlock, PhaseHistoryEntry } from "@shared/schema";

interface DerivedStats {
  xpMultiplier: number;
  staminaMax: number;
  streakForgiveness: number;
  powerRating: number;
}

interface DisplayStats {
  strength: number;
  agility: number;
  sense: number;
  vitality: number;
}

interface FatigueInfo {
  strength: number;
  agility: number;
  sense: number;
  vitality: number;
}

interface PlayerWithDerived extends Player {
  derived?: DerivedStats;
  displayStats?: DisplayStats;
  fatigueInfo?: FatigueInfo;
  phaseStatCap?: number;
  systemMessage?: string;
  computedStamina?: number;
}

export interface ActiveSession {
  stat: string;
  startTime: number;
  scheduledDuration: number;
}

interface GameContextType {
  player: PlayerWithDerived | null;
  isLoading: boolean;
  systemMessage: string | null;
  activeSession: ActiveSession | null;
  lastXpGain: { amount: number; stat: string } | null;
  replayingPhaseHistory: PhaseHistoryEntry | null;
  gainExp: (amount: number) => void;
  modifyHp: (amount: number) => void;
  modifyMp: (amount: number) => void;
  levelUp: () => void;
  updatePlayer: (updates: Partial<Player>) => void;
  clearSystemMessage: () => void;
  startSession: (stat: string, scheduledDuration: number) => void;
  completeSession: (stat: string, duration: number, xp: number) => void;
  cancelSession: () => void;
  confirmPhaseUnlock: () => void;
  replayPhaseHistory: (entry: PhaseHistoryEntry) => void;
  closePhaseReplay: () => void;
  addLevels: (levels: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const PLAYER_STORAGE_KEY = "solo_leveling_player_id";

export function GameProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [playerId, setPlayerId] = useState<string | null>(() => {
    return localStorage.getItem(PLAYER_STORAGE_KEY);
  });
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [lastXpGain, setLastXpGain] = useState<{ amount: number; stat: string } | null>(null);
  const [replayingPhaseHistory, setReplayingPhaseHistory] = useState<PhaseHistoryEntry | null>(null);
  const messageTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const showSystemMessage = React.useCallback((message: string) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setSystemMessage(message);
    messageTimeoutRef.current = setTimeout(() => setSystemMessage(null), 4000);
  }, []);

  const { data: player, isLoading } = useQuery<PlayerWithDerived>({
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
        name: "",
        level: 1,
        job: "NONE",
        title: "AWAKENED",
        hp: 100,
        maxHp: 100,
        mp: 10,
        maxMp: 10,
        stats: { strength: 1, agility: 1, sense: 1, vitality: 1 },
        gold: 0,
        phase: 1,
        rank: "E",
        exp: 0,
        maxExp: 100,
        inventory: [],
        skills: [
          { id: "basic_attack", name: "Basic Attack", description: "A simple attack that deals minor damage", mpCost: 0, cooldown: 0, level: 1, unlocked: true },
          { id: "dodge", name: "Dodge", description: "Evade incoming attacks", mpCost: 5, cooldown: 5, level: 1, unlocked: false },
          { id: "focus", name: "Focus", description: "Increase accuracy for the next attack", mpCost: 10, cooldown: 10, level: 1, unlocked: false },
          { id: "survival_instinct", name: "Survival Instinct", description: "Temporarily boost all stats when HP is low", mpCost: 20, cooldown: 60, level: 1, unlocked: false },
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

  const gainExpMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!playerId) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${playerId}/gain-exp`, { amount });
      return res.json() as Promise<PlayerWithDerived>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/player", playerId], data);
      if (data.systemMessage) {
        showSystemMessage(data.systemMessage);
      }
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

  const updatePlayerMutation = useMutation({
    mutationFn: async (updates: Partial<Player>) => {
      if (!playerId) throw new Error("No player");
      const res = await apiRequest("PATCH", `/api/player/${playerId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
    },
  });

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

  const updatePlayer = useCallback((updates: Partial<Player>) => {
    updatePlayerMutation.mutate(updates);
  }, [updatePlayerMutation]);

  const clearSystemMessage = useCallback(() => {
    setSystemMessage(null);
  }, []);

  const startSession = useCallback((stat: string, scheduledDuration: number) => {
    setActiveSession({
      stat,
      startTime: Date.now(),
      scheduledDuration,
    });
    showSystemMessage(`${stat.toUpperCase()} session started`);
  }, [showSystemMessage]);

  const completeSessionMutation = useMutation({
    mutationFn: async ({ stat, xp, durationMinutes }: { stat: string; xp: number; durationMinutes: number }) => {
      if (!playerId) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${playerId}/complete-session`, {
        stat,
        xp,
        durationMinutes
      });
      return res.json() as Promise<PlayerWithDerived>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/player", playerId], data);
      if (data.systemMessage) {
        showSystemMessage(data.systemMessage);
      }
    },
  });

  const completeSession = useCallback((stat: string, duration: number, xp: number) => {
    setActiveSession(null);
    setLastXpGain({ amount: xp, stat });
    
    completeSessionMutation.mutate({
      stat,
      xp,
      durationMinutes: duration
    });
    
    setTimeout(() => setLastXpGain(null), 3000);
  }, [completeSessionMutation, showSystemMessage]);

  const cancelSession = useCallback(() => {
    setActiveSession(null);
    showSystemMessage("Session cancelled");
  }, [showSystemMessage]);

  const confirmPhaseUnlockMutation = useMutation({
    mutationFn: async () => {
      if (!playerId) throw new Error("No player");
      const res = await apiRequest("POST", `/api/player/${playerId}/confirm-phase-unlock`, {});
      return res.json() as Promise<PlayerWithDerived>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/player", playerId], data);
      if (data.systemMessage) {
        showSystemMessage(data.systemMessage);
      }
    },
  });

  const confirmPhaseUnlock = useCallback(() => {
    confirmPhaseUnlockMutation.mutate();
  }, [confirmPhaseUnlockMutation]);

  const replayPhaseHistory = useCallback((entry: PhaseHistoryEntry) => {
    setReplayingPhaseHistory(entry);
  }, []);

  const closePhaseReplay = useCallback(() => {
    setReplayingPhaseHistory(null);
  }, []);

  const addLevelsMutation = useMutation({
    mutationFn: async (levels: number) => {
      if (!playerId) throw new Error("No player");
      const xpNeeded = (player?.maxExp || 100) * levels;
      const res = await apiRequest("POST", `/api/player/${playerId}/gain-exp`, { amount: xpNeeded });
      return res.json() as Promise<PlayerWithDerived>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/player", playerId], data);
      if (data.systemMessage) {
        showSystemMessage(data.systemMessage);
      }
    },
  });

  const addLevels = useCallback((levels: number) => {
    addLevelsMutation.mutate(levels);
  }, [addLevelsMutation]);

  return (
    <GameContext.Provider value={{ 
      player: player || null, 
      isLoading: isLoading || createPlayerMutation.isPending,
      systemMessage,
      activeSession,
      lastXpGain,
      replayingPhaseHistory,
      gainExp, 
      modifyHp, 
      modifyMp, 
      levelUp,
      updatePlayer,
      clearSystemMessage,
      startSession,
      completeSession,
      cancelSession,
      confirmPhaseUnlock,
      replayPhaseHistory,
      closePhaseReplay,
      addLevels,
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

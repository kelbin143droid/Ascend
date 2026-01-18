import React, { createContext, useContext, useState } from "react";

type Stats = {
  strength: number;
  agility: number;
  sense: number;
  vitality: number;
  intelligence: number;
};

type Player = {
  name: string;
  level: number;
  job: string;
  title: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: Stats;
  availablePoints: number;
  gold: number;
  rank: string;
};

interface GameContextType {
  player: Player;
  addStat: (stat: keyof Stats) => void;
  gainExp: (amount: number) => void;
}

const defaultPlayer: Player = {
  name: "SUNG JIN-WOO",
  level: 1,
  job: "NONE",
  title: "WOLF SLAYER",
  hp: 100,
  maxHp: 100,
  mp: 10,
  maxMp: 10,
  stats: {
    strength: 10,
    agility: 10,
    sense: 10,
    vitality: 10,
    intelligence: 10,
  },
  availablePoints: 3,
  gold: 0,
  rank: "E",
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player>(defaultPlayer);

  const addStat = (stat: keyof Stats) => {
    if (player.availablePoints > 0) {
      setPlayer((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: prev.stats[stat] + 1,
        },
        availablePoints: prev.availablePoints - 1,
      }));
    }
  };

  const gainExp = (amount: number) => {
    // Simplified level up logic
    setPlayer(prev => ({
        ...prev,
        level: prev.level + 1,
        availablePoints: prev.availablePoints + 3,
        stats: {
            ...prev.stats,
            strength: prev.stats.strength + 1,
            agility: prev.stats.agility + 1
        }
    }))
  }

  return (
    <GameContext.Provider value={{ player, addStat, gainExp }}>
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

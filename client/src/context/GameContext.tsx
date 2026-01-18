import React, { createContext, useContext, useState, useEffect } from "react";

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
  exp: number;
  maxExp: number;
};

interface GameContextType {
  player: Player;
  addStat: (stat: keyof Stats) => void;
  gainExp: (amount: number) => void;
  modifyHp: (amount: number) => void;
  modifyMp: (amount: number) => void;
  levelUp: () => void;
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
  exp: 0,
  maxExp: 100,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player>(defaultPlayer);

  const addStat = (stat: keyof Stats) => {
    if (player.availablePoints > 0) {
      setPlayer((prev) => {
        const newStats = { ...prev.stats, [stat]: prev.stats[stat] + 1 };
        let newMaxHp = prev.maxHp;
        let newMaxMp = prev.maxMp;
        
        if (stat === 'vitality') newMaxHp += 20;
        if (stat === 'intelligence') newMaxMp += 10;

        return {
          ...prev,
          stats: newStats,
          maxHp: newMaxHp,
          maxMp: newMaxMp,
          availablePoints: prev.availablePoints - 1,
        };
      });
    }
  };

  const levelUp = () => {
    setPlayer(prev => ({
      ...prev,
      level: prev.level + 1,
      availablePoints: prev.availablePoints + 5,
      exp: 0,
      maxExp: Math.floor(prev.maxExp * 1.5),
      maxHp: prev.maxHp + 50,
      maxMp: prev.maxMp + 20,
      hp: prev.maxHp + 50,
      mp: prev.maxMp + 20,
    }));
  };

  const gainExp = (amount: number) => {
    setPlayer(prev => {
      const newExp = prev.exp + amount;
      if (newExp >= prev.maxExp) {
        // Handle level up in state update
        return {
          ...prev,
          level: prev.level + 1,
          availablePoints: prev.availablePoints + 5,
          exp: newExp - prev.maxExp,
          maxExp: Math.floor(prev.maxExp * 1.5),
          maxHp: prev.maxHp + 50,
          maxMp: prev.maxMp + 20,
          hp: prev.maxHp + 50,
          mp: prev.maxMp + 20,
        };
      }
      return { ...prev, exp: newExp };
    });
  };

  const modifyHp = (amount: number) => {
    setPlayer(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, Math.max(0, prev.hp + amount))
    }));
  };

  const modifyMp = (amount: number) => {
    setPlayer(prev => ({
      ...prev,
      mp: Math.min(prev.maxMp, Math.max(0, prev.mp + amount))
    }));
  };

  return (
    <GameContext.Provider value={{ player, addStat, gainExp, modifyHp, modifyMp, levelUp }}>
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

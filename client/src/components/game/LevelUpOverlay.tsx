import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { LevelUpAnimation, getMotivationalPhrase } from "./LevelUpAnimation";
import { applyLevelUpStats, initLevelBaseline, getMaxHP, getMaxMana } from "@/lib/statsSystem";

export function LevelUpOverlay() {
  const { player } = useGame();
  const [pendingLevelUp, setPendingLevelUp] = useState<{
    level: number;
    phrase: string;
    maxHp: number;
    maxMana: number;
  } | null>(null);
  const previousLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!player) return;

    const currentLevel = player.level;

    if (previousLevelRef.current === null) {
      previousLevelRef.current = currentLevel;
      initLevelBaseline(currentLevel);
      return;
    }

    if (currentLevel > previousLevelRef.current) {
      const result = applyLevelUpStats(currentLevel);
      const maxHp = result?.maxHp ?? getMaxHP(currentLevel);
      const maxMana = result?.maxMana ?? getMaxMana(currentLevel);
      const phrase = getMotivationalPhrase(currentLevel);
      setPendingLevelUp({ level: currentLevel, phrase, maxHp, maxMana });
    }

    previousLevelRef.current = currentLevel;
  }, [player?.level]);

  const handleComplete = () => {
    setPendingLevelUp(null);
  };

  if (!pendingLevelUp) return null;

  return (
    <LevelUpAnimation
      newLevel={pendingLevelUp.level}
      motivationalPhrase={pendingLevelUp.phrase}
      maxHp={pendingLevelUp.maxHp}
      maxMana={pendingLevelUp.maxMana}
      onComplete={handleComplete}
    />
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { LevelUpAnimation, getMotivationalPhrase } from "./LevelUpAnimation";

export function LevelUpOverlay() {
  const { player } = useGame();
  const [pendingLevelUp, setPendingLevelUp] = useState<{ level: number; phrase: string } | null>(null);
  const previousLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!player) return;

    const currentLevel = player.level;

    if (previousLevelRef.current === null) {
      previousLevelRef.current = currentLevel;
      return;
    }

    if (currentLevel > previousLevelRef.current) {
      const phrase = getMotivationalPhrase(currentLevel);
      setPendingLevelUp({ level: currentLevel, phrase });
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
      onComplete={handleComplete}
    />
  );
}

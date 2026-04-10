import { useState, useCallback } from "react";

export type LevelPhase =
  | "idle"
  | "filling-earned"
  | "filling-levelup"
  | "showing-modal"
  | "done";

export function useLevelSystem(playerId: string | undefined) {
  const [phase, setPhase] = useState<LevelPhase>("idle");

  const startAnimation = useCallback(() => {
    setPhase("filling-earned");
  }, []);

  const onEarnedFillComplete = useCallback(() => {
    setPhase("filling-levelup");
  }, []);

  const onLevelUpFillComplete = useCallback(() => {
    setPhase("showing-modal");
    if (playerId) {
      fetch(`/api/player/${playerId}/onboarding-complete`, { method: "POST" }).catch(() => {});
    }
  }, [playerId]);

  const onModalComplete = useCallback(() => {
    setPhase("done");
  }, []);

  return {
    phase,
    startAnimation,
    onEarnedFillComplete,
    onLevelUpFillComplete,
    onModalComplete,
  };
}

import { useGame } from "@/context/GameContext";
import { PhaseUnlockScreen } from "./PhaseUnlockScreen";
import { PHASE_UNLOCK_DATA } from "@shared/schema";

export function PhaseUnlockOverlay() {
  const { player, confirmPhaseUnlock, replayingPhaseHistory, closePhaseReplay } = useGame();

  if (replayingPhaseHistory) {
    const unlockData = PHASE_UNLOCK_DATA[replayingPhaseHistory.phase];
    if (!unlockData) return null;

    return (
      <PhaseUnlockScreen
        newPhase={replayingPhaseHistory.phase}
        title={unlockData.title}
        description={unlockData.description}
        highlights={unlockData.highlights}
        onConfirm={closePhaseReplay}
        isReplay={true}
      />
    );
  }

  if (!player?.pendingPhaseUnlock) return null;

  const { phase } = player.pendingPhaseUnlock;
  const unlockData = PHASE_UNLOCK_DATA[phase];

  if (!unlockData) return null;

  return (
    <PhaseUnlockScreen
      newPhase={phase}
      title={unlockData.title}
      description={unlockData.description}
      highlights={unlockData.highlights}
      onConfirm={confirmPhaseUnlock}
    />
  );
}

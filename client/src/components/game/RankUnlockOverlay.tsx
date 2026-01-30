import { useGame } from "@/context/GameContext";
import { RankUnlockScreen } from "./RankUnlockScreen";
import { RANK_UNLOCK_DATA } from "@shared/schema";

export function RankUnlockOverlay() {
  const { player, confirmRankUnlock, replayingRankHistory, closeRankReplay } = useGame();

  if (replayingRankHistory) {
    const unlockData = RANK_UNLOCK_DATA[replayingRankHistory.rank];
    if (!unlockData) return null;

    return (
      <RankUnlockScreen
        newRank={replayingRankHistory.rank}
        unlockedAttribute={unlockData.attribute}
        description={unlockData.description}
        highlights={unlockData.highlights}
        onConfirm={closeRankReplay}
        isReplay={true}
      />
    );
  }

  if (!player?.pendingRankUnlock) return null;

  const { rank, attribute } = player.pendingRankUnlock;
  const unlockData = RANK_UNLOCK_DATA[rank];

  if (!unlockData) return null;

  return (
    <RankUnlockScreen
      newRank={rank}
      unlockedAttribute={unlockData.attribute}
      description={unlockData.description}
      highlights={unlockData.highlights}
      onConfirm={confirmRankUnlock}
    />
  );
}

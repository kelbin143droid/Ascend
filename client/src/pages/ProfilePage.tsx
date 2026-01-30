import { useGame } from "@/context/GameContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion } from "framer-motion";
import { Shield, Calendar, Play, User, Trophy } from "lucide-react";
import { RANK_UNLOCK_DATA, RANK_STAT_CAPS } from "@shared/schema";

const RANK_COLORS: Record<string, string> = {
  E: "#6b7280",
  D: "#22c55e",
  C: "#3b82f6",
  B: "#a855f7",
  A: "#f97316",
  S: "#ef4444",
};

export default function ProfilePage() {
  const { player, isLoading, replayRankHistory } = useGame();

  if (isLoading || !player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-primary animate-pulse">Loading...</div>
        </div>
      </SystemLayout>
    );
  }

  const rankHistory = player.rankHistory || [];
  const unlockedAttributes = player.unlockedAttributes || ["strength", "agility", "sense", "vitality"];

  return (
    <SystemLayout>
      <div className="min-h-screen p-4 pb-24" data-testid="profile-page">
        <div className="text-center mb-6">
          <div className="text-xs tracking-[0.3em] text-muted-foreground mb-1">HUNTER PROFILE</div>
          <h1 className="text-2xl font-display font-bold text-primary">
            {player.name || "AWAKENED"}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card/30 border border-primary/20 rounded p-3 text-center">
            <User className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-xs text-muted-foreground">Level</div>
            <div className="text-xl font-mono font-bold text-primary">{player.level}</div>
          </div>
          <div className="bg-card/30 border border-primary/20 rounded p-3 text-center">
            <Shield
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: RANK_COLORS[player.rank] }}
            />
            <div className="text-xs text-muted-foreground">Rank</div>
            <div
              className="text-xl font-display font-bold"
              style={{ color: RANK_COLORS[player.rank] }}
            >
              {player.rank}
            </div>
          </div>
          <div className="bg-card/30 border border-primary/20 rounded p-3 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
            <div className="text-xs text-muted-foreground">Title</div>
            <div className="text-xs font-mono text-primary truncate">{player.title}</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-primary" />
            <h2 className="text-sm font-display tracking-widest text-primary">UNLOCKED ATTRIBUTES</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {unlockedAttributes.map((attr) => (
              <motion.div
                key={attr}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/30 border border-primary/20 rounded px-3 py-2 text-xs flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground uppercase tracking-wider">{attr}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-primary" />
            <h2 className="text-sm font-display tracking-widest text-primary">RANK HISTORY</h2>
          </div>

          {rankHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No rank advancements yet. Keep training to evolve.
            </div>
          ) : (
            <div className="space-y-3">
              {rankHistory.map((entry, index) => {
                const unlockData = RANK_UNLOCK_DATA[entry.rank];
                const rankColor = RANK_COLORS[entry.rank] || "#00ffff";

                return (
                  <motion.div
                    key={`${entry.rank}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card/30 border border-primary/20 rounded p-4"
                    data-testid={`rank-history-${entry.rank}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: rankColor }}
                        >
                          <Shield className="w-5 h-5" style={{ color: rankColor }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-display font-bold text-lg"
                              style={{ color: rankColor }}
                            >
                              {entry.rank}
                            </span>
                            <span className="text-xs text-muted-foreground">RANK</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Unlocked: <span className="text-primary">{entry.unlocked}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {entry.date}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Cap: {RANK_STAT_CAPS[entry.rank]}
                          </div>
                        </div>
                        <button
                          onClick={() => replayRankHistory(entry)}
                          className="p-2 rounded border border-primary/30 hover:bg-primary/10 transition-colors"
                          data-testid={`button-replay-rank-${entry.rank}`}
                        >
                          <Play className="w-4 h-4 text-primary" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <div className="mb-2">NEXT RANK REQUIREMENTS</div>
          {player.rank === "E" && <div>Level 11+ → Rank D</div>}
          {player.rank === "D" && <div>Level 26+ → Rank C</div>}
          {player.rank === "C" && <div>Level 46+ → Rank B (Unlocks: Social)</div>}
          {player.rank === "B" && <div>Level 71+ → Rank A (Unlocks: Skill)</div>}
          {player.rank === "A" && <div>Maximum rank achieved</div>}
        </div>
      </div>
    </SystemLayout>
  );
}

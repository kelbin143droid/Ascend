import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion } from "framer-motion";
import { Shield, Calendar, Play, User, Trophy } from "lucide-react";
import { PHASE_UNLOCK_DATA, PHASE_STAT_CAPS, PHASE_NAMES } from "@shared/schema";

const PHASE_COLORS: Record<number, string> = {
  1: "#6b7280",
  2: "#22c55e",
  3: "#3b82f6",
  4: "#a855f7",
  5: "#ffd700",
};

interface HomeData {
  phase: { number: number; name: string };
  stability: { score: number; label: string };
  flow: { value: number; label: string; trending: "rising" | "steady" | "cooling" };
  growthState: string;
  insight: string;
  todaysFocus: string;
  nextAction: { habitId: string; name: string; stat: string; durationMinutes: number } | null;
  completedToday: number;
  totalActive: number;
}

export default function ProfilePage() {
  const { player, isLoading, replayPhaseHistory } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const { data: homeData } = useQuery<HomeData & { onboardingDay: number }>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/home`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
  });
  const metricsLocked = (homeData?.onboardingDay ?? 1) < 6;

  if (isLoading || !player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-primary animate-pulse">Loading...</div>
        </div>
      </SystemLayout>
    );
  }

  const phaseHistory = player.phaseHistory || [];
  const currentPhase = player.phase || 1;
  const phaseColor = PHASE_COLORS[currentPhase] || "#6b7280";
  const phaseName = PHASE_NAMES[currentPhase] || "Stabilization";

  const growthState = homeData?.growthState || "Beginning";

  return (
    <SystemLayout>
      <div className="min-h-screen p-4 pb-24" data-testid="profile-page">
        <div className="text-center mb-6">
          <div className="text-xs tracking-[0.3em] text-muted-foreground mb-1">ASCENDANT IDENTITY</div>
          <h1 className="text-2xl font-display font-bold text-primary">
            {player.name || "AWAKENED"}
          </h1>
        </div>

        {metricsLocked ? (
          <>
            <div
              data-testid="soft-lock-profile"
              className="rounded-xl px-5 py-5 text-center mb-6"
              style={{
                backgroundColor: "rgba(147,197,253,0.04)",
                border: "1px solid rgba(147,197,253,0.08)",
              }}
            >
              <User className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(147,197,253,0.3)" }} />
              <p className="text-sm leading-relaxed" style={{ color: "rgba(147,197,253,0.7)" }}>
                Your identity is forming through action.
              </p>
              <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Detailed metrics appear as your journey deepens.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-card/30 border border-primary/20 rounded p-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">Level</div>
                <div className="text-2xl font-mono font-bold text-primary" data-testid="text-player-level">{player.level}</div>
              </div>
              <div className="bg-card/30 border border-primary/20 rounded p-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">Phase</div>
                <div className="text-2xl font-display font-bold" style={{ color: phaseColor }} data-testid="text-player-phase">
                  {phaseName}
                </div>
              </div>
            </div>

            <div
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: `${colors.surface || colors.background}cc`,
                border: `1px solid ${colors.surfaceBorder}`,
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: colors.textMuted }}>
                Growth
              </div>
              <div className="text-lg font-display font-bold" style={{ color: colors.primary }} data-testid="text-growth-state">
                {growthState}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-card/30 border border-primary/20 rounded p-3 text-center">
                <User className="w-5 h-5 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">Level</div>
                <div className="text-xl font-mono font-bold text-primary" data-testid="text-player-level">{player.level}</div>
              </div>
              <div className="bg-card/30 border border-primary/20 rounded p-3 text-center">
                <Shield className="w-5 h-5 mx-auto mb-1" style={{ color: phaseColor }} />
                <div className="text-xs text-muted-foreground">Phase</div>
                <div className="text-xl font-display font-bold" style={{ color: phaseColor }} data-testid="text-player-phase">
                  {currentPhase}
                </div>
              </div>
              <div className="bg-card/30 border border-primary/20 rounded p-3 text-center">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                <div className="text-xs text-muted-foreground">Title</div>
                <div className="text-xs font-mono text-primary truncate">{player.title}</div>
              </div>
            </div>

            <div
              className="rounded-xl px-4 py-3 mb-3"
              style={{
                backgroundColor: `${colors.surface || colors.background}cc`,
                border: `1px solid ${colors.surfaceBorder}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>
                    Phase {currentPhase}
                  </div>
                  <div className="text-lg font-display font-bold" style={{ color: colors.text }}>
                    {phaseName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: colors.textMuted }}>
                    Growth
                  </div>
                  <div className="text-base font-display font-bold" style={{ color: colors.primary }} data-testid="text-growth-state">
                    {growthState}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-primary" />
                <h2 className="text-sm font-display tracking-widest text-primary">STAT CAP</h2>
              </div>
              <div className="bg-card/30 border border-primary/20 rounded px-4 py-3 text-center">
                <span className="text-2xl font-mono font-bold" style={{ color: phaseColor }}>
                  {PHASE_STAT_CAPS[currentPhase] || 30}
                </span>
                <span className="text-xs text-muted-foreground ml-2">per stat</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-primary" />
                <h2 className="text-sm font-display tracking-widest text-primary">PHASE HISTORY</h2>
              </div>

              {phaseHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No phase advancements yet. Keep training to evolve.
                </div>
              ) : (
                <div className="space-y-3">
                  {phaseHistory.map((entry, index) => {
                    const unlockData = PHASE_UNLOCK_DATA[entry.phase];
                    const entryColor = PHASE_COLORS[entry.phase] || "#00ffff";

                    return (
                      <motion.div
                        key={`phase-${entry.phase}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card/30 border border-primary/20 rounded p-4"
                        data-testid={`phase-history-${entry.phase}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                              style={{ borderColor: entryColor }}
                            >
                              <Shield className="w-5 h-5" style={{ color: entryColor }} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-lg" style={{ color: entryColor }}>
                                  Phase {entry.phase}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Cap: {PHASE_STAT_CAPS[entry.phase]}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {entry.date}
                              </div>
                            </div>
                            <button
                              onClick={() => replayPhaseHistory(entry)}
                              className="p-2 rounded border border-primary/30 hover:bg-primary/10 transition-colors"
                              data-testid={`button-replay-phase-${entry.phase}`}
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
              <div className="mb-2">NEXT PHASE REQUIREMENTS</div>
              {currentPhase === 1 && <div>Level 5 + Avg Stat 10 + 7-day streak &rarr; Phase 2</div>}
              {currentPhase === 2 && <div>Level 15 + Avg Stat 25 + 14-day streak &rarr; Phase 3</div>}
              {currentPhase === 3 && <div>Level 30 + Avg Stat 50 + 14-day streak &rarr; Phase 4</div>}
              {currentPhase === 4 && <div>Level 50 + Avg Stat 75 + 14-day streak &rarr; Phase 5</div>}
              {currentPhase === 5 && <div>Maximum phase achieved</div>}
            </div>
          </>
        )}
      </div>
    </SystemLayout>
  );
}

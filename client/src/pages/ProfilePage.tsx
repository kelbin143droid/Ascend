import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion } from "framer-motion";
import { Shield, Calendar, Play, Flame, Zap, Star } from "lucide-react";
import { PHASE_UNLOCK_DATA, PHASE_STAT_CAPS, PHASE_NAMES } from "@shared/schema";

const PHASE_COLORS: Record<number, string> = {
  1: "#6b7280",
  2: "#22c55e",
  3: "#3b82f6",
  4: "#a855f7",
  5: "#ffd700",
};

const STAT_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

const RANK_COLORS: Record<string, string> = {
  E: "#6b7280",
  D: "#22c55e",
  C: "#3b82f6",
  B: "#a855f7",
  A: "#ef4444",
  S: "#ffd700",
};

interface HomeData {
  phase: { number: number; name: string };
  stability: { score: number; label: string; state: string };
  growthState: string;
  streak: number;
  onboardingDay: number;
  isOnboardingComplete: boolean;
  identity?: {
    stage: string;
    stageLabel: string;
    reflection?: { message: string };
  };
}

export default function ProfilePage() {
  const { player, isLoading, replayPhaseHistory } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const { data: homeData } = useQuery<HomeData>({
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
  const rank = player.rank || "E";
  const rankColor = RANK_COLORS[rank] || "#6b7280";
  const growthState = homeData?.growthState || "Beginning";
  const streak = homeData?.streak ?? player.streak ?? 0;
  const totalExp = player.totalExp || 0;

  const statLevels = (player as any).statLevels as Record<string, { level: number; currentXP: number; xpForNext: number }> | undefined;
  const stats = [
    { key: "strength", label: "STR" },
    { key: "agility", label: "AGI" },
    { key: "sense", label: "SNS" },
    { key: "vitality", label: "VIT" },
  ];

  return (
    <SystemLayout>
      <div className="min-h-screen p-4 pb-28 space-y-5" data-testid="profile-page">

        {/* Header */}
        <div className="text-center pt-2">
          <div className="text-[9px] tracking-[0.3em] mb-1" style={{ color: colors.textMuted }}>
            ASCENDANT IDENTITY
          </div>
          <h1 className="text-2xl font-display font-bold" style={{ color: colors.text }}>
            {player.name || "AWAKENED"}
          </h1>
          <div
            className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full"
            style={{ backgroundColor: `${rankColor}18`, border: `1px solid ${rankColor}40` }}
          >
            <Star size={10} style={{ color: rankColor }} />
            <span className="text-xs font-bold font-mono tracking-wider" style={{ color: rankColor }}>
              {rank} RANK
            </span>
          </div>
        </div>

        {/* Core stats — always clean */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: `${colors.primary}0d`, border: `1px solid ${colors.primary}25` }}
            data-testid="text-player-level"
          >
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: colors.textMuted }}>Level</div>
            <div className="text-2xl font-mono font-bold" style={{ color: colors.primary }}>{player.level}</div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: `${phaseColor}0d`, border: `1px solid ${phaseColor}25` }}
            data-testid="text-player-phase"
          >
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: colors.textMuted }}>Phase</div>
            <div className="text-2xl font-mono font-bold" style={{ color: phaseColor }}>{currentPhase}</div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: colors.textMuted }}>Title</div>
            <div className="text-xs font-mono font-bold text-amber-400 truncate leading-tight mt-0.5">{player.title || "AWAKENED"}</div>
          </div>
        </div>

        {/* Phase & Growth */}
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${colors.surfaceBorder}` }}
        >
          <div>
            <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: colors.textMuted }}>
              Phase {currentPhase}
            </div>
            <div className="text-base font-display font-bold" style={{ color: colors.text }}>{phaseName}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: colors.textMuted }}>Growth</div>
            <div className="text-base font-display font-bold" style={{ color: colors.primary }} data-testid="text-growth-state">
              {growthState}
            </div>
          </div>
        </div>

        {/* Stat levels */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4" style={{ backgroundColor: colors.primary }} />
            <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.primary }}>STATS</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {stats.map(({ key, label }) => {
              const statColor = STAT_COLORS[key];
              const level = statLevels?.[key]?.level ?? (player.stats as any)?.[key] ?? 1;
              const currentXP = statLevels?.[key]?.currentXP ?? 0;
              const xpForNext = statLevels?.[key]?.xpForNext ?? 100;
              const pct = xpForNext > 0 ? Math.min(currentXP / xpForNext, 1) : 0;
              return (
                <div
                  key={key}
                  className="rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: `${statColor}0d`, border: `1px solid ${statColor}25` }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: `${statColor}cc` }}>{label}</span>
                    <span className="text-base font-mono font-bold" style={{ color: statColor }}>{level}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${statColor}20` }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct * 100}%`, backgroundColor: statColor }}
                    />
                  </div>
                  <div className="text-[8px] mt-1 font-mono" style={{ color: `${statColor}60` }}>
                    {currentXP} / {xpForNext} XP
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements summary */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4" style={{ backgroundColor: colors.primary }} />
            <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.primary }}>ACHIEVEMENTS</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-xl px-3 py-3 flex items-center gap-3"
              style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}
            >
              <Flame size={18} style={{ color: "#f59e0b" }} />
              <div>
                <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: colors.textMuted }}>Streak</div>
                <div className="text-lg font-mono font-bold text-amber-400">{streak}</div>
              </div>
            </div>
            <div
              className="rounded-xl px-3 py-3 flex items-center gap-3"
              style={{ backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}
            >
              <Zap size={18} style={{ color: "#6366f1" }} />
              <div>
                <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: colors.textMuted }}>Total XP</div>
                <div className="text-lg font-mono font-bold" style={{ color: "#6366f1" }}>{totalExp.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat cap */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4" style={{ backgroundColor: colors.primary }} />
            <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.primary }}>STAT CAP</h2>
          </div>
          <div
            className="rounded-xl px-4 py-3 text-center"
            style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${colors.surfaceBorder}` }}
          >
            <span className="text-2xl font-mono font-bold" style={{ color: phaseColor }}>
              {PHASE_STAT_CAPS[currentPhase] || 30}
            </span>
            <span className="text-xs ml-2" style={{ color: colors.textMuted }}>per stat</span>
          </div>
        </div>

        {/* Phase History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4" style={{ backgroundColor: colors.primary }} />
            <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.primary }}>PHASE HISTORY</h2>
          </div>

          {phaseHistory.length === 0 ? (
            <div
              className="rounded-xl px-4 py-5 text-center"
              style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${colors.surfaceBorder}` }}
            >
              <p className="text-sm" style={{ color: colors.textMuted }}>
                No phase advancements yet. Keep training.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {phaseHistory.map((entry, index) => {
                const entryColor = PHASE_COLORS[entry.phase] || "#00ffff";
                return (
                  <motion.div
                    key={`phase-${entry.phase}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${entryColor}30` }}
                    data-testid={`phase-history-${entry.phase}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: entryColor }}
                      >
                        <Shield className="w-4 h-4" style={{ color: entryColor }} />
                      </div>
                      <div>
                        <div className="font-display font-bold" style={{ color: entryColor }}>
                          Phase {entry.phase}
                        </div>
                        <div className="text-[10px]" style={{ color: colors.textMuted }}>
                          Cap {PHASE_STAT_CAPS[entry.phase]}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs" style={{ color: colors.textMuted }}>
                        <Calendar className="w-3 h-3" />
                        {entry.date}
                      </div>
                      <button
                        onClick={() => replayPhaseHistory(entry)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ border: `1px solid ${entryColor}30`, backgroundColor: `${entryColor}10` }}
                        data-testid={`button-replay-phase-${entry.phase}`}
                      >
                        <Play className="w-3.5 h-3.5" style={{ color: entryColor }} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Next phase */}
        <div className="text-center text-xs pb-4" style={{ color: colors.textMuted }}>
          <div className="mb-1.5 text-[9px] uppercase tracking-widest">Next Phase Requirements</div>
          {currentPhase === 1 && <div>Level 5 · Avg Stat 10 · 7-day streak</div>}
          {currentPhase === 2 && <div>Level 15 · Avg Stat 25 · 14-day streak</div>}
          {currentPhase === 3 && <div>Level 30 · Avg Stat 50 · 14-day streak</div>}
          {currentPhase === 4 && <div>Level 50 · Avg Stat 75 · 14-day streak</div>}
          {currentPhase === 5 && <div>Maximum phase achieved</div>}
        </div>
      </div>
    </SystemLayout>
  );
}

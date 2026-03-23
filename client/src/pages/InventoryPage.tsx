import type { ReactNode } from "react";
import { useGame } from "@/context/GameContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";
import { Shield, Star, Flame, Trophy, Zap, Crown } from "lucide-react";
import { PHASE_NAMES, PHASE_STAT_CAPS } from "@shared/schema";

const PHASE_COLORS: Record<number, string> = {
  1: "#6b7280",
  2: "#22c55e",
  3: "#3b82f6",
  4: "#a855f7",
  5: "#ffd700",
};

const RANK_ORDER = ["E", "D", "C", "B", "A", "S"];
const RANK_COLORS: Record<string, string> = {
  E: "#6b7280",
  D: "#22c55e",
  C: "#3b82f6",
  B: "#a855f7",
  A: "#ef4444",
  S: "#ffd700",
};
const RANK_THRESHOLDS: Record<string, string> = {
  E: "Lv 1–4",
  D: "Lv 5–9",
  C: "Lv 10–14",
  B: "Lv 15–19",
  A: "Lv 20–29",
  S: "Lv 30+",
};

interface Badge {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  earned: boolean;
}

function getBadges(player: any, streak: number, totalExp: number): Badge[] {
  const phase = player.phase || 1;
  const level = player.level || 1;
  const phaseHistory = player.phaseHistory || [];

  return [
    {
      id: "first-light",
      icon: <Star size={18} />,
      title: "First Light",
      description: "Began the journey.",
      color: "#f59e0b",
      earned: true,
    },
    {
      id: "consistent",
      icon: <Flame size={18} />,
      title: "Consistent",
      description: "Maintained a 3-day streak.",
      color: "#f97316",
      earned: streak >= 3,
    },
    {
      id: "week-warrior",
      icon: <Flame size={18} />,
      title: "Week Warrior",
      description: "Maintained a 7-day streak.",
      color: "#ef4444",
      earned: streak >= 7,
    },
    {
      id: "xp-100",
      icon: <Zap size={18} />,
      title: "First Power",
      description: "Earned 100 total XP.",
      color: "#6366f1",
      earned: totalExp >= 100,
    },
    {
      id: "xp-500",
      icon: <Zap size={18} />,
      title: "Power Surge",
      description: "Earned 500 total XP.",
      color: "#8b5cf6",
      earned: totalExp >= 500,
    },
    {
      id: "xp-1000",
      icon: <Zap size={18} />,
      title: "Force Awakened",
      description: "Earned 1000 total XP.",
      color: "#a855f7",
      earned: totalExp >= 1000,
    },
    {
      id: "level-5",
      icon: <Trophy size={18} />,
      title: "Rank D Ascent",
      description: "Reached Level 5.",
      color: "#22c55e",
      earned: level >= 5,
    },
    {
      id: "level-10",
      icon: <Trophy size={18} />,
      title: "Rank C Ascent",
      description: "Reached Level 10.",
      color: "#3b82f6",
      earned: level >= 10,
    },
    {
      id: "level-20",
      icon: <Trophy size={18} />,
      title: "Rank A Ascent",
      description: "Reached Level 20.",
      color: "#ef4444",
      earned: level >= 20,
    },
    {
      id: "phase-2",
      icon: <Shield size={18} />,
      title: "Phase II",
      description: "Advanced to Phase 2 — Foundation.",
      color: PHASE_COLORS[2],
      earned: phaseHistory.some((h: any) => h.phase >= 2) || phase >= 2,
    },
    {
      id: "phase-3",
      icon: <Shield size={18} />,
      title: "Phase III",
      description: "Advanced to Phase 3 — Momentum.",
      color: PHASE_COLORS[3],
      earned: phaseHistory.some((h: any) => h.phase >= 3) || phase >= 3,
    },
    {
      id: "phase-4",
      icon: <Shield size={18} />,
      title: "Phase IV",
      description: "Advanced to Phase 4 — Mastery.",
      color: PHASE_COLORS[4],
      earned: phaseHistory.some((h: any) => h.phase >= 4) || phase >= 4,
    },
    {
      id: "phase-5",
      icon: <Crown size={18} />,
      title: "Sovereign",
      description: "Reached Phase 5 — Sovereignty.",
      color: PHASE_COLORS[5],
      earned: phase >= 5,
    },
  ];
}

export default function InventoryPage() {
  const { player, isLoading } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  if (isLoading || !player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary animate-pulse font-display text-sm tracking-widest">Loading...</div>
        </div>
      </SystemLayout>
    );
  }

  const rank = player.rank || "E";
  const rankColor = RANK_COLORS[rank] || "#6b7280";
  const rankIndex = RANK_ORDER.indexOf(rank);
  const totalExp = player.totalExp || 0;
  const streak = player.streak || 0;
  const level = player.level || 1;
  const currentPhase = player.phase || 1;
  const phaseColor = PHASE_COLORS[currentPhase];
  const phaseName = PHASE_NAMES[currentPhase] || "Stabilization";

  const badges = getBadges(player, streak, totalExp);
  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <SystemLayout>
      <div className="min-h-screen p-4 pb-28 space-y-5" data-testid="achievements-page">

        {/* Header */}
        <div className="text-center pt-2">
          <div className="text-[9px] tracking-[0.3em] mb-1" style={{ color: colors.textMuted }}>
            HALL OF RECORDS
          </div>
          <h1 className="text-2xl font-display font-bold" style={{ color: colors.text }}>
            ACHIEVEMENTS
          </h1>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            {earnedBadges.length} of {badges.length} unlocked
          </p>
        </div>

        {/* Title & Rank card */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: `${rankColor}0e`, border: `1px solid ${rankColor}30` }}
        >
          <div className="text-[9px] uppercase tracking-widest mb-3" style={{ color: colors.textMuted }}>Current Standing</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: `${rankColor}80` }}>Title</div>
              <div className="font-display font-bold text-base" style={{ color: colors.text }}>{player.title || "AWAKENED"}</div>
            </div>
            <div
              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center"
              style={{ backgroundColor: `${rankColor}18`, border: `2px solid ${rankColor}50` }}
            >
              <div className="text-xl font-mono font-black" style={{ color: rankColor }}>{rank}</div>
              <div className="text-[8px] tracking-wider" style={{ color: `${rankColor}80` }}>RANK</div>
            </div>
          </div>

          {/* Rank progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[9px] mb-1.5" style={{ color: colors.textMuted }}>
              {RANK_ORDER.map((r, i) => (
                <span
                  key={r}
                  className="font-mono font-bold"
                  style={{ color: i <= rankIndex ? RANK_COLORS[r] : `${colors.textMuted}50` }}
                >
                  {r}
                </span>
              ))}
            </div>
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              {RANK_ORDER.slice(0, rankIndex + 1).map((r, i) => (
                <div
                  key={r}
                  className="absolute top-0 h-full"
                  style={{
                    left: `${(i / RANK_ORDER.length) * 100}%`,
                    width: `${(1 / RANK_ORDER.length) * 100}%`,
                    backgroundColor: RANK_COLORS[r],
                  }}
                />
              ))}
            </div>
            <div className="text-[9px] mt-1" style={{ color: colors.textMuted }}>
              {RANK_THRESHOLDS[rank]}
            </div>
          </div>
        </div>

        {/* Current phase card */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: `${phaseColor}0e`, border: `1px solid ${phaseColor}30` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${phaseColor}18`, border: `1px solid ${phaseColor}40` }}
            >
              <Shield size={18} style={{ color: phaseColor }} />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: colors.textMuted }}>Current Phase</div>
              <div className="font-display font-bold" style={{ color: phaseColor }}>Phase {currentPhase} — {phaseName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: colors.textMuted }}>Stat cap</div>
            <div className="font-mono font-bold text-lg" style={{ color: phaseColor }}>{PHASE_STAT_CAPS[currentPhase] || 30}</div>
          </div>
        </div>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ backgroundColor: "#f59e0b" }} />
              <h2 className="text-[10px] font-display tracking-widest text-amber-400">EARNED</h2>
            </div>
            <div className="space-y-2">
              {earnedBadges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ backgroundColor: `${badge.color}0e`, border: `1px solid ${badge.color}30` }}
                  data-testid={`badge-${badge.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${badge.color}18`, border: `1px solid ${badge.color}40`, color: badge.color }}
                  >
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: colors.text }}>{badge.title}</div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>{badge.description}</div>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${badge.color}25` }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: badge.color }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Locked badges */}
        {lockedBadges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
              <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.textMuted }}>LOCKED</h2>
            </div>
            <div className="space-y-2">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 opacity-40"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  data-testid={`badge-locked-${badge.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}
                  >
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: colors.textMuted }}>{badge.title}</div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>{badge.description}</div>
                  </div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Locked
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SystemLayout>
  );
}

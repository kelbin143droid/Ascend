import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { StatAllocationModal } from "@/components/game/StatAllocationModal";
import { GameIntroModal } from "@/components/game/GameIntroModal";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Calendar, Play, Flame, Zap, Star, User, Bell, Clock, Settings, ChevronRight, Sparkles, PlusCircle } from "lucide-react";
import { PHASE_STAT_CAPS, PHASE_NAMES } from "@shared/schema";
import { isGameUnlocked, syncPlayerToCache } from "@/lib/progressionService";
import { STAT_EMOJIS } from "@/lib/habitStatMap";
import type { StatName } from "@shared/schema";

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
  const [settingsToast, setSettingsToast] = useState<string | null>(null);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);

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

  useEffect(() => {
    if (player) {
      syncPlayerToCache(player as any);
      if (!isGameUnlocked() && player.onboardingCompleted === 1) {
        const timer = setTimeout(() => setShowIntroModal(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [player?.id]);

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
  const statPoints = (player as any).statPoints ?? 0;
  const bonusStats = ((player as any).bonusStats as Record<StatName, number> | null) ?? { strength: 0, agility: 0, sense: 0, vitality: 0 };

  const statLevels = (player as any).statLevels as Record<string, { level: number; currentXP: number; xpForNext: number }> | undefined;
  const stats = [
    { key: "strength", label: "STR" },
    { key: "agility", label: "AGI" },
    { key: "sense", label: "SNS" },
    { key: "vitality", label: "VIT" },
  ];

  const showSettingsToast = (label: string) => {
    setSettingsToast(label);
    setTimeout(() => setSettingsToast(null), 2400);
  };

  const withinLevelXP = (player as any).exp ?? 0;
  const maxXP = (player as any).maxExp ?? 100;
  const xpPct = Math.min(100, Math.round((withinLevelXP / maxXP) * 100));
  const nameInitial = (player.name || "A").charAt(0).toUpperCase();

  const SETTINGS_ITEMS = [
    { icon: User, label: "Edit Profile", key: "edit-profile" },
    { icon: Bell, label: "Notification Preferences", key: "notifications" },
    { icon: Clock, label: "Sectograph Preferences", key: "sectograph" },
    { icon: Settings, label: "App Settings", key: "app-settings" },
  ];

  return (
    <SystemLayout>
      <div className="min-h-screen p-4 pb-28 space-y-5" data-testid="profile-page">

        {/* Modals */}
        <StatAllocationModal open={showAllocModal} onClose={() => setShowAllocModal(false)} />
        <GameIntroModal open={showIntroModal} onClose={() => setShowIntroModal(false)} playerName={player.name} />

        {/* Settings toast */}
        <AnimatePresence>
          {settingsToast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-center"
              style={{
                backgroundColor: "rgba(15,23,42,0.93)",
                border: `1px solid ${colors.surfaceBorder}`,
                backdropFilter: "blur(12px)",
              }}
            >
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {settingsToast} — coming soon
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HEADER with Avatar ─────────────────────────────────── */}
        <div className="text-center pt-4" data-testid="profile-header">
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${rankColor}40, ${rankColor}10)`,
                border: `2px solid ${rankColor}60`,
                boxShadow: `0 0 24px ${rankColor}30`,
              }}
              data-testid="profile-avatar"
            >
              <span className="text-3xl font-display font-bold" style={{ color: rankColor }}>
                {nameInitial}
              </span>
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: rankColor, boxShadow: `0 0 8px ${rankColor}80` }}
            >
              <Star size={10} style={{ color: "#0a0a14" }} />
            </div>
          </div>

          <h1 className="text-2xl font-display font-bold mb-1" style={{ color: colors.text }}>
            {player.name || "AWAKENED"}
          </h1>

          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${colors.primary}15`, color: colors.primary, border: `1px solid ${colors.primary}25` }}
            >
              Lv {player.level}
            </span>
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${rankColor}12`, color: rankColor, border: `1px solid ${rankColor}35` }}
            >
              {rank} Rank
            </span>
            {statPoints > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setShowAllocModal(true)}
                className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                style={{
                  backgroundColor: "rgba(168,85,247,0.15)",
                  color: "#a855f7",
                  border: "1px solid rgba(168,85,247,0.35)",
                  boxShadow: "0 0 8px rgba(168,85,247,0.2)",
                }}
                data-testid="badge-stat-points"
              >
                <Sparkles size={9} />
                {statPoints} pts
              </motion.button>
            )}
          </div>

          {/* XP Progress Bar */}
          <div className="max-w-xs mx-auto">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Level {player.level}
              </span>
              <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                {withinLevelXP} / {maxXP} XP
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.primary}18` }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%`, backgroundColor: colors.primary, boxShadow: `0 0 8px ${colors.primaryGlow}` }}
              />
            </div>
            {statPoints > 0 && (
              <p className="text-[9px] mt-1.5 text-center animate-pulse" style={{ color: "#a855f7" }}>
                ✦ {statPoints} unspent stat point{statPoints !== 1 ? "s" : ""} — tap to allocate
              </p>
            )}
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4" style={{ backgroundColor: colors.primary }} />
              <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.primary }}>STATS</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowIntroModal(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium"
                style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.25)" }}
                data-testid="button-how-stats-work"
              >
                How stats work
              </button>
              <button
                onClick={() => setShowAllocModal(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium"
                style={{
                  backgroundColor: statPoints > 0 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)",
                  color: statPoints > 0 ? "#a855f7" : colors.textMuted,
                  border: `1px solid ${statPoints > 0 ? "rgba(168,85,247,0.35)" : "transparent"}`,
                }}
                data-testid="button-allocate-stats"
              >
                <PlusCircle size={8} />
                {statPoints > 0 ? `Allocate (${statPoints})` : "Allocate"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {stats.map(({ key, label }) => {
              const statColor = STAT_COLORS[key];
              const level = statLevels?.[key]?.level ?? (player.stats as any)?.[key] ?? 1;
              const currentXP = statLevels?.[key]?.currentXP ?? 0;
              const xpForNext = statLevels?.[key]?.xpForNext ?? 100;
              const pct = xpForNext > 0 ? Math.min(currentXP / xpForNext, 1) : 0;
              const bonus = bonusStats[key as StatName] ?? 0;
              const emoji = STAT_EMOJIS[key as StatName];
              return (
                <div
                  key={key}
                  className="rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: `${statColor}0d`, border: `1px solid ${statColor}25` }}
                  data-testid={`stat-card-${key}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{emoji}</span>
                      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: `${statColor}cc` }}>{label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-mono font-bold" style={{ color: statColor }}>{level}</span>
                      {bonus > 0 && (
                        <span className="text-[8px] font-mono" style={{ color: `${statColor}80` }}>+{bonus}</span>
                      )}
                    </div>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${statColor}20` }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct * 100}%`, backgroundColor: statColor }}
                    />
                  </div>
                  <div className="text-[8px] mt-1 font-mono" style={{ color: `${statColor}60` }}>
                    {currentXP} / {xpForNext} XP
                    {bonus > 0 && <span style={{ color: `${statColor}80` }}> · +{bonus} bonus</span>}
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
        <div className="text-center text-xs" style={{ color: colors.textMuted }}>
          <div className="mb-1.5 text-[9px] uppercase tracking-widest">Next Phase Requirements</div>
          {currentPhase === 1 && <div>Level 5 · Avg Stat 10 · 7-day streak</div>}
          {currentPhase === 2 && <div>Level 15 · Avg Stat 25 · 14-day streak</div>}
          {currentPhase === 3 && <div>Level 30 · Avg Stat 50 · 14-day streak</div>}
          {currentPhase === 4 && <div>Level 50 · Avg Stat 75 · 14-day streak</div>}
          {currentPhase === 5 && <div>Maximum phase achieved</div>}
        </div>

        {/* ── SETTINGS ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4" style={{ backgroundColor: colors.primary }} />
            <h2 className="text-[10px] font-display tracking-widest" style={{ color: colors.primary }}>SETTINGS</h2>
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${colors.surfaceBorder}` }}
            data-testid="settings-section"
          >
            {SETTINGS_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  data-testid={`button-settings-${item.key}`}
                  onClick={() => showSettingsToast(item.label)}
                  className="w-full flex items-center justify-between px-4 py-3.5 transition-all active:scale-[0.99]"
                  style={{
                    backgroundColor: `${colors.surface}cc`,
                    borderBottom: i < SETTINGS_ITEMS.length - 1 ? `1px solid ${colors.surfaceBorder}` : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${colors.primary}12`, border: `1px solid ${colors.primary}20` }}
                    >
                      <Icon size={14} style={{ color: colors.primary }} />
                    </div>
                    <span className="text-sm" style={{ color: colors.text }}>{item.label}</span>
                  </div>
                  <ChevronRight size={14} style={{ color: colors.textMuted }} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-4" />
      </div>
    </SystemLayout>
  );
}

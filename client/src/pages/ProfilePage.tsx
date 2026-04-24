import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Calendar, Play, User, Bell, Clock, Settings, ChevronRight } from "lucide-react";
import { PHASE_STAT_CAPS, PHASE_NAMES } from "@shared/schema";
import { syncPlayerToCache } from "@/lib/progressionService";

const PHASE_COLORS: Record<number, string> = {
  1: "#6b7280",
  2: "#22c55e",
  3: "#3b82f6",
  4: "#a855f7",
  5: "#ffd700",
};

interface HomeData {
  phase: { number: number; name: string };
  stability: { score: number; label: string; state: string };
  growthState: string;
  streak: number;
  onboardingDay: number;
  isOnboardingComplete: boolean;
}

export default function ProfilePage() {
  const { player, isLoading, replayPhaseHistory } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [settingsToast, setSettingsToast] = useState<string | null>(null);
  const [, navigate] = useLocation();

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

  const onboardingDay = homeData?.onboardingDay ?? 1;
  const isComplete = homeData?.isOnboardingComplete ?? false;

  useEffect(() => {
    if (player) syncPlayerToCache(player as any);
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
  const growthState = homeData?.growthState || "Beginning";

  const withinLevelXP = (player as any).exp ?? 0;
  const maxXP = (player as any).maxExp ?? 100;
  const xpPct = Math.min(100, Math.round((withinLevelXP / maxXP) * 100));
  const nameInitial = (player.name || "A").charAt(0).toUpperCase();

  const showSettingsToast = (label: string) => {
    setSettingsToast(label);
    setTimeout(() => setSettingsToast(null), 2400);
  };

  const SETTINGS_ITEMS: { icon: any; label: string; key: string; route?: string }[] = [
    { icon: User, label: "Edit Profile", key: "edit-profile" },
    { icon: Bell, label: "Notification Settings", key: "notifications", route: "/notification-settings" },
    { icon: Clock, label: "Sectograph Preferences", key: "sectograph" },
    { icon: Settings, label: "App Settings", key: "app-settings" },
  ];

  return (
    <SystemLayout>
      <div className="min-h-screen p-4 pb-28 space-y-5" data-testid="profile-page">

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

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="text-center pt-4" data-testid="profile-header">
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${colors.primary}40, ${colors.primary}10)`,
                border: `2px solid ${colors.primary}60`,
                boxShadow: `0 0 24px ${colors.primary}30`,
              }}
              data-testid="profile-avatar"
            >
              <span className="text-3xl font-display font-bold" style={{ color: colors.primary }}>
                {nameInitial}
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-display font-bold mb-2" style={{ color: colors.text }}>
            {player.name || "AWAKENED"}
          </h1>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${colors.primary}15`,
                color: colors.primary,
                border: `1px solid ${colors.primary}25`,
              }}
            >
              Lv {player.level}
            </span>
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
                style={{
                  width: `${xpPct}%`,
                  backgroundColor: colors.primary,
                  boxShadow: `0 0 8px ${colors.primary}80`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── PHASE & GROWTH ──────────────────────────────────── */}
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

        {/* ── PHASE HISTORY ───────────────────────────────────── */}
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

        {/* ── NEXT PHASE ──────────────────────────────────────── */}
        <div className="text-center text-xs" style={{ color: colors.textMuted }}>
          <div className="mb-1.5 text-[9px] uppercase tracking-widest">Next Phase Requirements</div>
          {currentPhase === 1 && <div>Level 5 · Avg Stat 10 · 7-day streak</div>}
          {currentPhase === 2 && <div>Level 15 · Avg Stat 25 · 14-day streak</div>}
          {currentPhase === 3 && <div>Level 30 · Avg Stat 50 · 14-day streak</div>}
          {currentPhase === 4 && <div>Level 50 · Avg Stat 75 · 14-day streak</div>}
          {currentPhase === 5 && <div>Maximum phase achieved</div>}
        </div>

        {/* ── SETTINGS ────────────────────────────────────────── */}
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
                  onClick={() => item.route ? navigate(item.route) : showSettingsToast(item.label)}
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

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Sparkles, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import { STAT_COLORS, STAT_ABBREV, STAT_DESCRIPTIONS, STAT_EMOJIS, ALL_STATS } from "@/lib/habitStatMap";
import type { StatName } from "@shared/schema";

interface StatAllocationModalProps {
  open: boolean;
  onClose: () => void;
}

export function StatAllocationModal({ open, onClose }: StatAllocationModalProps) {
  const { player } = useGame();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const queryClient = useQueryClient();

  const [pending, setPending] = useState<Record<StatName, number>>({
    strength: 0, agility: 0, sense: 0, vitality: 0,
  });
  const [confirming, setConfirming] = useState(false);

  const availablePoints = (player?.statPoints ?? 0) - Object.values(pending).reduce((a, b) => a + b, 0);

  const bonusStats = (player?.bonusStats as Record<StatName, number> | null) ?? { strength: 0, agility: 0, sense: 0, vitality: 0 };

  const allocateMutation = useMutation({
    mutationFn: async (allocations: { stat: StatName; amount: number }[]) => {
      const results = [];
      for (const { stat, amount } of allocations) {
        if (amount <= 0) continue;
        const res = await apiRequest("POST", `/api/player/${player?.id}/allocate-stat`, { stat, amount });
        results.push(await res.json());
      }
      return results[results.length - 1];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["player"] });
      queryClient.invalidateQueries({ queryKey: ["home", player?.id] });
      if (data) queryClient.setQueryData(["player"], data);
      setPending({ strength: 0, agility: 0, sense: 0, vitality: 0 });
      setConfirming(false);
      onClose();
    },
  });

  const adjust = (stat: StatName, delta: number) => {
    const current = pending[stat] ?? 0;
    const newVal = Math.max(0, current + delta);
    if (delta > 0 && availablePoints <= 0) return;
    setPending(prev => ({ ...prev, [stat]: newVal }));
  };

  const hasPending = Object.values(pending).some(v => v > 0);
  const totalPending = Object.values(pending).reduce((a, b) => a + b, 0);

  const handleConfirm = () => {
    const allocations = (ALL_STATS as StatName[]).map(stat => ({ stat, amount: pending[stat] }));
    allocateMutation.mutate(allocations);
  };

  const handleClose = () => {
    setPending({ strength: 0, agility: 0, sense: 0, vitality: 0 });
    setConfirming(false);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md rounded-t-2xl p-5 pb-8"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
          onClick={e => e.stopPropagation()}
          data-testid="stat-allocation-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-display font-bold" style={{ color: colors.text }}>
                Allocate Stat Points
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles size={10} style={{ color: colors.primary }} />
                <span className="text-[10px] font-mono" style={{ color: colors.primary }}>
                  {availablePoints} point{availablePoints !== 1 ? "s" : ""} available
                </span>
              </div>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg" style={{ color: colors.textMuted }}>
              <X size={16} />
            </button>
          </div>

          {(player?.statPoints ?? 0) === 0 ? (
            <div
              className="rounded-xl px-4 py-5 text-center mb-4"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${colors.surfaceBorder}` }}
            >
              <p className="text-sm mb-1" style={{ color: colors.text }}>No points to allocate</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                Earn 5 stat points each time you level up. Keep completing habits!
              </p>
            </div>
          ) : (
            <>
              {/* Stat rows */}
              <div className="space-y-3 mb-5">
                {(ALL_STATS as StatName[]).map(stat => {
                  const color = STAT_COLORS[stat];
                  const abbrev = STAT_ABBREV[stat];
                  const emoji = STAT_EMOJIS[stat];
                  const bonus = bonusStats[stat] ?? 0;
                  const pend = pending[stat] ?? 0;

                  return (
                    <div
                      key={stat}
                      className="rounded-xl px-4 py-3"
                      style={{ backgroundColor: `${color}08`, border: `1px solid ${color}20` }}
                      data-testid={`stat-row-${stat}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{emoji}</span>
                          <div>
                            <div className="text-xs font-mono font-bold" style={{ color }}>{abbrev}</div>
                            <div className="text-[9px]" style={{ color: colors.textMuted }}>
                              {bonus > 0 ? `+${bonus} allocated` : "No bonus yet"}
                              {pend > 0 && <span style={{ color }} className="ml-1">+{pend} pending</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => adjust(stat, -1)}
                            disabled={pend <= 0}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: pend > 0 ? `${color}20` : "rgba(255,255,255,0.04)",
                              color: pend > 0 ? color : colors.textMuted,
                              border: `1px solid ${pend > 0 ? color + "40" : "transparent"}`,
                              opacity: pend <= 0 ? 0.4 : 1,
                            }}
                            data-testid={`button-decrease-${stat}`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-mono font-bold w-6 text-center" style={{ color: pend > 0 ? color : colors.textMuted }}>
                            {pend}
                          </span>
                          <button
                            onClick={() => adjust(stat, 1)}
                            disabled={availablePoints <= 0}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: availablePoints > 0 ? `${color}20` : "rgba(255,255,255,0.04)",
                              color: availablePoints > 0 ? color : colors.textMuted,
                              border: `1px solid ${availablePoints > 0 ? color + "40" : "transparent"}`,
                              opacity: availablePoints <= 0 ? 0.4 : 1,
                            }}
                            data-testid={`button-increase-${stat}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirm */}
              <button
                onClick={handleConfirm}
                disabled={!hasPending || allocateMutation.isPending}
                className="w-full py-3 rounded-xl font-display font-bold text-sm transition-all"
                style={{
                  backgroundColor: hasPending ? colors.primary : "rgba(255,255,255,0.05)",
                  color: hasPending ? "#000" : colors.textMuted,
                  opacity: hasPending ? 1 : 0.5,
                  boxShadow: hasPending ? `0 0 16px ${colors.primaryGlow}` : "none",
                }}
                data-testid="button-confirm-allocate"
              >
                {allocateMutation.isPending
                  ? "Applying..."
                  : hasPending
                  ? `Confirm — spend ${totalPending} point${totalPending !== 1 ? "s" : ""}`
                  : "Select points to allocate"}
              </button>
            </>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 mt-3 px-1">
            <Info size={10} className="shrink-0 mt-0.5" style={{ color: colors.textMuted, opacity: 0.5 }} />
            <p className="text-[9px] leading-relaxed" style={{ color: colors.textMuted, opacity: 0.5 }}>
              Bonus stat points supplement your XP-earned stat levels. Both contribute to your total stat power.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

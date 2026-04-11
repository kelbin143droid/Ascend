import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Zap, BarChart2, GitBranch, Award } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { STAT_COLORS, STAT_ABBREV, STAT_EMOJIS, STAT_DESCRIPTIONS, ALL_STATS } from "@/lib/habitStatMap";
import { markStatIntroSeen } from "@/lib/progressionService";
import type { StatName } from "@shared/schema";

interface GameIntroModalProps {
  open: boolean;
  onClose: () => void;
  playerName?: string;
}

const SLIDES = [
  {
    id: "dual-xp",
    icon: GitBranch,
    iconColor: "#6366f1",
    title: "Dual Progression",
    subtitle: "Two XP tracks. One game world.",
    body: "Every habit you complete powers two separate progression tracks simultaneously — your Overall Level and your Stat-Specific XP. Both matter. Both evolve you.",
    detail: null,
  },
  {
    id: "overall-xp",
    icon: Zap,
    iconColor: "#ffd700",
    title: "Overall XP → Level",
    subtitle: "Your character's core power rating.",
    body: "Overall XP accumulates from every habit and session. When you level up, you earn 5 Stat Points — free points you can put into any stat you choose.",
    detail: "100 XP per level · 5 stat points awarded on each level-up",
  },
  {
    id: "stat-xp",
    icon: BarChart2,
    iconColor: "#22c55e",
    title: "Stat-Specific XP",
    subtitle: "Each stat grows from aligned habits.",
    body: "Each habit is tied to a stat — Strength, Agility, Sense, or Vitality. Completing that habit awards XP directly to that stat's own XP bar. Consistency in one area produces compound growth there.",
    detail: null,
  },
  {
    id: "stat-points",
    icon: Award,
    iconColor: "#a855f7",
    title: "Stat Point Allocation",
    subtitle: "Choose your own growth direction.",
    body: "Stat Points let you strategically boost any stat. If you're running low on Vitality, invest there. If you want to max out Strength, put it all in. Your choice reflects your real-world priorities.",
    detail: null,
  },
] as const;

export function GameIntroModal({ open, onClose, playerName }: GameIntroModalProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;

  const handleClose = () => {
    markStatIntroSeen();
    setSlide(0);
    onClose();
  };

  const handleNext = () => {
    if (isLast) { handleClose(); return; }
    setSlide(s => s + 1);
  };

  if (!open) return null;

  const current = SLIDES[slide];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
        data-testid="game-intro-modal"
      >
        <motion.div
          key={slide}
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm rounded-2xl p-6"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
        >
          {/* Close */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === slide ? 16 : 5,
                    height: 5,
                    backgroundColor: i === slide ? colors.primary : `${colors.primary}30`,
                  }}
                />
              ))}
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg" style={{ color: colors.textMuted }}>
              <X size={14} />
            </button>
          </div>

          {/* Icon */}
          <motion.div
            key={`icon-${slide}`}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{
              backgroundColor: `${current.iconColor}15`,
              border: `2px solid ${current.iconColor}30`,
              boxShadow: `0 0 24px ${current.iconColor}20`,
            }}
          >
            <Icon size={24} style={{ color: current.iconColor }} />
          </motion.div>

          {/* Text */}
          <div className="mb-5">
            <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: colors.textMuted }}>
              AI Coach · Stat System Tutorial
            </div>
            <h2 className="text-xl font-display font-bold mb-1" style={{ color: colors.text }}>
              {current.title}
            </h2>
            <p className="text-xs font-mono mb-3" style={{ color: current.iconColor }}>
              {current.subtitle}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
              {current.body}
            </p>
            {current.detail && (
              <div
                className="mt-3 px-3 py-2 rounded-lg text-[10px] font-mono"
                style={{ backgroundColor: `${current.iconColor}08`, color: `${current.iconColor}cc`, border: `1px solid ${current.iconColor}20` }}
              >
                {current.detail}
              </div>
            )}
          </div>

          {/* Stats preview on stat-xp slide */}
          {current.id === "stat-xp" && (
            <div className="grid grid-cols-2 gap-2 mb-5">
              {(ALL_STATS as StatName[]).map(stat => (
                <div
                  key={stat}
                  className="rounded-lg px-3 py-2 flex items-center gap-2"
                  style={{ backgroundColor: `${STAT_COLORS[stat]}10`, border: `1px solid ${STAT_COLORS[stat]}20` }}
                >
                  <span className="text-base">{STAT_EMOJIS[stat]}</span>
                  <div>
                    <div className="text-[9px] font-mono font-bold" style={{ color: STAT_COLORS[stat] }}>{STAT_ABBREV[stat]}</div>
                    <div className="text-[8px] leading-tight" style={{ color: colors.textMuted, opacity: 0.7 }}>
                      {STAT_DESCRIPTIONS[stat].split(".")[0]}.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nav */}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              backgroundColor: colors.primary,
              color: "#000",
              boxShadow: `0 0 16px ${colors.primaryGlow}`,
            }}
            data-testid="button-intro-next"
          >
            {isLast ? (
              <>Got it — let's grow</>
            ) : (
              <>
                Continue
                <ChevronRight size={16} />
              </>
            )}
          </button>

          {playerName && slide === 0 && (
            <p className="text-center text-[10px] mt-3" style={{ color: colors.textMuted }}>
              Your habits power {playerName}'s world.
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

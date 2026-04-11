import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { X, ChevronRight, Sword, Zap, Droplets, Shield, Star, Gamepad2, ArrowLeft } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { markGameUnlocked } from "@/lib/progressionService";

interface GameIntroModalProps {
  open: boolean;
  onClose: () => void;
  playerName?: string;
}

const STAT_ROWS = [
  {
    lifeLabel: "Physical",
    lifeEmoji: "💪",
    lifeColor: "#ef4444",
    arrow: "→",
    gameLabel: "Attack",
    gameEmoji: "⚔️",
    gameColor: "#ef4444",
    gameIcon: Sword,
    desc: "Strength habits power your damage output.",
  },
  {
    lifeLabel: "Agility",
    lifeEmoji: "⚡",
    lifeColor: "#22c55e",
    arrow: "→",
    gameLabel: "Attack Speed",
    gameEmoji: "🌀",
    gameColor: "#22c55e",
    gameIcon: Zap,
    desc: "Agility habits increase how fast you strike.",
  },
  {
    lifeLabel: "Mental",
    lifeEmoji: "🧘",
    lifeColor: "#3b82f6",
    arrow: "→",
    gameLabel: "Mana",
    gameEmoji: "💧",
    gameColor: "#3b82f6",
    gameIcon: Droplets,
    desc: "Sense habits expand your magical resource pool.",
  },
  {
    lifeLabel: "Vitality",
    lifeEmoji: "❤️",
    lifeColor: "#f59e0b",
    arrow: "→",
    gameLabel: "Defense + Health",
    gameEmoji: "🛡️",
    gameColor: "#f59e0b",
    gameIcon: Shield,
    desc: "Vitality habits strengthen your survivability.",
  },
];

export function GameIntroModal({ open, onClose, playerName }: GameIntroModalProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [slide, setSlide] = useState(0);
  const [, navigate] = useLocation();
  const TOTAL = 5;
  const isLast = slide === TOTAL - 1;

  const handleClose = () => {
    markGameUnlocked();
    setSlide(0);
    onClose();
  };

  const handleNext = () => {
    if (isLast) { handleClose(); return; }
    setSlide(s => s + 1);
  };

  const handleOpenGame = () => {
    markGameUnlocked();
    setSlide(0);
    onClose();
    navigate("/game3d");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
        data-testid="game-intro-modal"
      >
        <motion.div
          key={slide}
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
        >
          {/* Progress dots + close */}
          <div className="flex items-center justify-between px-5 pt-4 pb-0">
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === slide ? 18 : 5,
                    height: 5,
                    backgroundColor: i <= slide ? colors.primary : `${colors.primary}25`,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: colors.textMuted }}>
                AI Coach · Day 8
              </span>
              <button onClick={handleClose} className="p-1.5 rounded-lg" style={{ color: colors.textMuted }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ── Slide 0: Welcome ────────────────────────────────── */}
          {slide === 0 && (
            <div className="px-5 pt-5 pb-6">
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
                  border: "2px solid rgba(99,102,241,0.35)",
                  boxShadow: "0 0 32px rgba(99,102,241,0.2)",
                }}
              >
                <span className="text-3xl">⚔️</span>
              </motion.div>

              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: colors.primary }}>
                Productivity Powers Your Character
              </div>
              <h2 className="text-xl font-display font-bold mb-3" style={{ color: colors.text }}>
                Welcome, Hunter.
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                Your real-life discipline fuels your in-game power. Every habit you complete isn't just a life upgrade — it's a direct boost to your character's combat abilities.
              </p>

              {playerName && (
                <div
                  className="mt-4 px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{ backgroundColor: `${colors.primary}0a`, border: `1px solid ${colors.primary}20` }}
                >
                  <Star size={12} style={{ color: colors.primary }} />
                  <span className="text-[11px] font-mono" style={{ color: colors.primary }}>
                    {playerName}'s habits are powering their world.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Slide 1: Stats → Game Stats ─────────────────────── */}
          {slide === 1 && (
            <div className="px-5 pt-5 pb-6">
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: colors.primary }}>
                Stat Conversion System
              </div>
              <h2 className="text-xl font-display font-bold mb-1" style={{ color: colors.text }}>
                Life Stats → Game Power
              </h2>
              <p className="text-xs mb-4" style={{ color: colors.textMuted }}>
                Each real-world stat maps directly to a combat attribute.
              </p>

              <div className="space-y-2.5">
                {STAT_ROWS.map((row, i) => (
                  <motion.div
                    key={row.lifeLabel}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: `${row.lifeColor}08`, border: `1px solid ${row.lifeColor}20` }}
                  >
                    {/* Life stat */}
                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                      <span className="text-base">{row.lifeEmoji}</span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: row.lifeColor }}>
                        {row.lifeLabel}
                      </span>
                    </div>
                    {/* Arrow */}
                    <div className="text-[10px] font-mono shrink-0" style={{ color: colors.textMuted, opacity: 0.5 }}>→</div>
                    {/* Game stat */}
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-sm">{row.gameEmoji}</span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: row.gameColor }}>
                        {row.gameLabel}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── Slide 2: Levels ─────────────────────────────────── */}
          {slide === 2 && (
            <div className="px-5 pt-5 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  backgroundColor: "rgba(245,158,11,0.12)",
                  border: "2px solid rgba(245,158,11,0.3)",
                  boxShadow: "0 0 28px rgba(245,158,11,0.15)",
                }}
              >
                <span className="text-3xl">⭐</span>
              </motion.div>

              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "#f59e0b" }}>
                Dual Level System
              </div>
              <h2 className="text-xl font-display font-bold mb-4" style={{ color: colors.text }}>
                Two Levels. One Purpose.
              </h2>

              <div className="space-y-3">
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
                >
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "#6366f1" }}>
                    Life Level
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: colors.text }}>Reflects real-world growth</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
                    Increases as you build habits, complete sessions, and level up your discipline in the physical world.
                  </div>
                </div>
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}
                >
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>
                    Game Level
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: colors.text }}>Unlocks skills, gear, and evolutions</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
                    Your Life Level powers your Game Level. Higher real-world discipline = stronger in-game character.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Slide 3: Stat Points ────────────────────────────── */}
          {slide === 3 && (
            <div className="px-5 pt-5 pb-6">
              <motion.div
                initial={{ scale: 0, rotate: 15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  backgroundColor: "rgba(168,85,247,0.12)",
                  border: "2px solid rgba(168,85,247,0.3)",
                  boxShadow: "0 0 28px rgba(168,85,247,0.15)",
                }}
              >
                <span className="text-3xl">✦</span>
              </motion.div>

              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "#a855f7" }}>
                Stat Point Allocation
              </div>
              <h2 className="text-xl font-display font-bold mb-3" style={{ color: colors.text }}>
                Allocate Wisely.
              </h2>

              <p className="text-sm leading-relaxed mb-4" style={{ color: colors.textMuted }}>
                Each level grants <span style={{ color: "#a855f7", fontWeight: 700 }}>5 stat points</span>. You choose where they go. Build the character that matches your real-life priorities.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {STAT_ROWS.map(row => (
                  <div
                    key={row.lifeLabel}
                    className="rounded-lg px-2.5 py-2 flex items-center gap-2"
                    style={{ backgroundColor: `${row.lifeColor}0a`, border: `1px solid ${row.lifeColor}20` }}
                  >
                    <span className="text-base">{row.lifeEmoji}</span>
                    <div>
                      <div className="text-[9px] font-mono font-bold leading-none" style={{ color: row.lifeColor }}>
                        {row.lifeLabel}
                      </div>
                      <div className="text-[8px] leading-tight" style={{ color: colors.textMuted, opacity: 0.7 }}>
                        → {row.gameLabel}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-4 px-3 py-2 rounded-lg text-center"
                style={{ backgroundColor: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}
              >
                <span className="text-[10px] font-mono italic" style={{ color: "#a855f7" }}>
                  Train in life. Conquer in the game.
                </span>
              </div>
            </div>
          )}

          {/* ── Slide 4: Game Section Unlock ────────────────────── */}
          {slide === 4 && (
            <div className="px-5 pt-5 pb-6">
              {/* Pulsing unlock banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="rounded-xl p-4 mb-5 text-center"
                style={{
                  background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(99,102,241,0.12))",
                  border: "1px solid rgba(34,211,238,0.35)",
                  boxShadow: "0 0 32px rgba(34,211,238,0.12)",
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-4xl mb-2"
                >
                  🎮
                </motion.div>
                <div
                  className="text-xs font-mono font-bold uppercase tracking-widest mb-1"
                  style={{ color: "#22d3ee" }}
                >
                  ✦ Game Section Unlocked
                </div>
                <div className="text-[10px]" style={{ color: colors.textMuted }}>
                  Day 8 milestone reached
                </div>
              </motion.div>

              <h2 className="text-lg font-display font-bold mb-2" style={{ color: colors.text }}>
                The Arena Awaits.
              </h2>
              <p className="text-sm leading-relaxed mb-5" style={{ color: colors.textMuted }}>
                The <span style={{ color: "#22d3ee", fontWeight: 600 }}>Game Section</span> is now accessible from the sidebar menu. Your real-world stats power your in-game combat. The stronger your discipline, the more powerful your character.
              </p>

              {/* Sidebar pointer illustration */}
              <div
                className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
                style={{ backgroundColor: "rgba(0,0,0,0.25)", border: `1px solid ${colors.surfaceBorder}` }}
              >
                <div className="flex items-center gap-2 text-sm" style={{ color: colors.textMuted }}>
                  <span className="text-[10px] font-mono uppercase tracking-widest">☰ Menu</span>
                  <ChevronRight size={12} style={{ opacity: 0.4 }} />
                </div>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  className="flex items-center gap-2 flex-1"
                >
                  <Gamepad2 size={16} style={{ color: "#22d3ee" }} />
                  <span className="text-xs font-mono font-bold" style={{ color: "#22d3ee" }}>Future Game</span>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.4)" }}
                  >
                    NEW
                  </motion.div>
                </motion.div>
              </div>

              {/* CTA buttons */}
              <button
                onClick={handleOpenGame}
                className="w-full py-3 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 mb-2"
                style={{
                  background: "linear-gradient(135deg, #22d3ee, #6366f1)",
                  color: "#000",
                  boxShadow: "0 0 20px rgba(34,211,238,0.3)",
                }}
                data-testid="button-open-game-section"
              >
                <Gamepad2 size={16} />
                Open Game Section Now
              </button>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl text-sm"
                style={{ color: colors.textMuted }}
                data-testid="button-intro-dismiss"
              >
                I'll explore later
              </button>
            </div>
          )}

          {/* Navigation — slides 0–3 */}
          {slide < 4 && (
            <div className="px-5 pb-5">
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: colors.primary,
                  color: "#000",
                  boxShadow: `0 0 16px ${colors.primaryGlow}`,
                }}
                data-testid="button-intro-next"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

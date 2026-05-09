/**
 * RecommendedPathScreen.tsx
 * Shown after calibration completes. Displays the derived workout level,
 * a short rationale, and lets the user optionally adjust before confirming.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { LEVEL_COLORS, LEVEL_DISPLAY_NAMES, type WorkoutLevel } from "@/lib/workoutPlans";
import type { CalibrationProfile } from "@/lib/calibrationEngine";

interface Props {
  gender: "male" | "female";
  profile: CalibrationProfile;
  onConfirm: (chosenLevel: WorkoutLevel) => void;
}

const LEVEL_ORDER: WorkoutLevel[] = ["entry", "beginner", "intermediate", "advanced"];

const PATH_COPY: Record<WorkoutLevel, { headline: string; body: string }> = {
  entry: {
    headline: "A strong start begins with foundation.",
    body:     "Low-impact movements to build the habit of daily practice and develop your baseline strength.",
  },
  beginner: {
    headline: "Core essentials. Steady progress.",
    body:     "Foundational exercises with guided form, designed to build consistency before intensity.",
  },
  intermediate: {
    headline: "Progressive challenge ahead.",
    body:     "Compound movements and increasing volume to push your capacity and accelerate growth.",
  },
  advanced: {
    headline: "You're ready to ascend.",
    body:     "High-intensity resistance training at full capacity for those with disciplined foundations.",
  },
};

export function RecommendedPathScreen({ gender, profile, onConfirm }: Props) {
  const isFemale  = gender === "female";
  const color     = isFemale ? "#d946ef" : "#0ea5e9";
  const colorAlt  = isFemale ? "#8b5cf6" : "#38bdf8";
  const glow      = isFemale ? "rgba(217,70,239,0.35)" : "rgba(14,165,233,0.35)";
  const glowAlt   = isFemale ? "rgba(139,92,246,0.20)" : "rgba(56,189,248,0.20)";
  const bgGradient = isFemale
    ? "linear-gradient(145deg, #04000e 0%, #080018 50%, #05000f 100%)"
    : "linear-gradient(145deg, #020810 0%, #03101e 50%, #020810 100%)";

  const [chosenLevel, setChosenLevel] = useState<WorkoutLevel>(profile.derivedLevel);
  const [adjustOpen, setAdjustOpen]   = useState(false);

  const isAdjusted  = chosenLevel !== profile.derivedLevel;
  const levelColor  = LEVEL_COLORS[chosenLevel];
  const displayName = LEVEL_DISPLAY_NAMES[chosenLevel];
  const copy        = PATH_COPY[chosenLevel];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden"
      style={{ background: bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55 }}
    >
      {/* Ambient orbs */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "20%", left: "-10%",
          width: 360, height: 360, borderRadius: "50%",
          background: `radial-gradient(circle, ${glowAlt} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: "15%", right: "-10%",
          width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          filter: "blur(55px)",
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
      />

      {/* Top label */}
      <div className="relative z-10 w-full max-w-md px-6 pt-16 flex flex-col items-center gap-3">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span
            className="text-[9px] tracking-[0.32em] uppercase font-mono font-bold"
            style={{ color: `${color}90` }}
          >
            Calibration Complete
          </span>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 w-full max-w-md px-6 flex flex-col justify-center gap-7">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-center"
        >
          <p
            className="text-[10px] uppercase tracking-[0.26em] font-mono mb-3"
            style={{ color: `${color}70` }}
          >
            Recommended Starting Path
          </p>
          <h1
            className="text-4xl font-extrabold mb-2"
            style={{
              color: levelColor,
              fontFamily: "Inter, system-ui, sans-serif",
              textShadow: `0 0 28px ${levelColor}60, 0 0 56px ${levelColor}28`,
              letterSpacing: "0.02em",
            }}
          >
            {displayName}
          </h1>
          {isAdjusted && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[9px] font-mono px-2 py-0.5 rounded-full"
              style={{ color: colorAlt, backgroundColor: `${colorAlt}15`, border: `1px solid ${colorAlt}30` }}
            >
              Manually adjusted
            </motion.span>
          )}
        </motion.div>

        {/* Copy card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={chosenLevel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: `${levelColor}0e`,
              border: `1.5px solid ${levelColor}35`,
            }}
          >
            <p
              className="text-sm font-bold mb-2 leading-snug"
              style={{ color: "#ffffff" }}
            >
              {copy.headline}
            </p>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "rgba(255,255,255,0.50)" }}
            >
              {copy.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Adjust manually toggle */}
        <div>
          <button
            onClick={() => setAdjustOpen((o) => !o)}
            className="flex items-center gap-1.5 mx-auto text-[11px] font-mono transition-all"
            style={{ color: `${color}60` }}
            data-testid="button-adjust-level"
          >
            {adjustOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Adjust manually
          </button>

          <AnimatePresence>
            {adjustOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28 }}
                className="overflow-hidden mt-3"
              >
                <div className="grid grid-cols-4 gap-2">
                  {LEVEL_ORDER.map((lvl) => {
                    const lc   = LEVEL_COLORS[lvl];
                    const dn   = LEVEL_DISPLAY_NAMES[lvl];
                    const isMe = lvl === chosenLevel;
                    const isRec = lvl === profile.derivedLevel;
                    return (
                      <button
                        key={lvl}
                        onClick={() => setChosenLevel(lvl)}
                        data-testid={`button-select-level-${lvl}`}
                        className="rounded-xl py-3 flex flex-col items-center gap-1.5 transition-all active:scale-95"
                        style={{
                          backgroundColor: isMe ? `${lc}20` : "rgba(255,255,255,0.04)",
                          border: `1.5px solid ${isMe ? lc : "rgba(255,255,255,0.08)"}`,
                          boxShadow: isMe ? `0 0 12px ${lc}40` : "none",
                        }}
                      >
                        <span
                          className="text-xs font-bold leading-tight text-center"
                          style={{ color: isMe ? lc : "rgba(255,255,255,0.40)" }}
                        >
                          {dn}
                        </span>
                        {isRec && !isMe && (
                          <span
                            className="text-[8px] font-mono"
                            style={{ color: `${color}70` }}
                          >
                            rec
                          </span>
                        )}
                        {isMe && (
                          <Check size={10} style={{ color: lc }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 w-full max-w-md px-6 pb-12 flex flex-col gap-3">
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          onClick={() => onConfirm(chosenLevel)}
          data-testid="button-begin-path"
          className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.18em] transition-all active:scale-[0.98]"
          style={{
            backgroundColor: levelColor,
            color: "#fff",
            boxShadow: `0 0 28px ${levelColor}50`,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Begin My Path →
        </motion.button>
      </div>
    </motion.div>
  );
}

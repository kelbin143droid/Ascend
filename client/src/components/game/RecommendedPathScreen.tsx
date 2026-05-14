/**
 * RecommendedPathScreen.tsx
 * "SYNC SUCCESSFUL" result screen shown after System Sync calibration.
 * Displays the derived protocol, a monospace system-status report,
 * the prescribed body copy, and lets the user optionally adjust before confirming.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { LEVEL_COLORS, LEVEL_DISPLAY_NAMES, type WorkoutLevel } from "@/lib/workoutPlans";
import type { CalibrationProfile } from "@/lib/calibrationEngine";

interface Props {
  gender:    "male" | "female";
  profile:   CalibrationProfile;
  onConfirm: (chosenLevel: WorkoutLevel) => void;
}

const LEVEL_ORDER: WorkoutLevel[] = ["entry", "beginner", "intermediate", "advanced"];

const PROTOCOL_NAMES: Record<WorkoutLevel, string> = {
  entry:        "FOUNDATION PROTOCOL",
  beginner:     "BUILD PROTOCOL",
  intermediate: "EVOLVE PROTOCOL",
  advanced:     "ASCEND PROTOCOL",
};

const PROTOCOL_RATIONALE: Record<WorkoutLevel, string> = {
  entry:        "Parameters indicate an initializing system. Foundation Protocol maximises long-term retention by anchoring habits before intensity.",
  beginner:     "Parameters indicate a developing system. Build Protocol layers progressive stimulus while protecting recovery bandwidth.",
  intermediate: "Parameters indicate a stable system under load. Evolve Protocol applies compound challenge to accelerate capacity expansion.",
  advanced:     "Parameters indicate a high-output system. Ascend Protocol operates at full-capacity resistance with disciplined recovery cycles.",
};

export function RecommendedPathScreen({ gender, profile, onConfirm }: Props) {
  const isFemale   = gender === "female";
  const bgGradient = isFemale
    ? "linear-gradient(145deg, #04000e 0%, #080018 50%, #05000f 100%)"
    : "linear-gradient(145deg, #020810 0%, #03101e 50%, #020810 100%)";

  // Neon-blue accent (matches CalibrationFlow)
  const color    = "#0ea5e9";
  const colorAlt = "#38bdf8";
  const glow     = "rgba(14,165,233,0.38)";
  const glowAlt  = "rgba(56,189,248,0.20)";

  const [chosenLevel, setChosenLevel] = useState<WorkoutLevel>(profile.derivedLevel);
  const [adjustOpen,  setAdjustOpen]  = useState(false);

  const isAdjusted   = chosenLevel !== profile.derivedLevel;
  const levelColor   = LEVEL_COLORS[chosenLevel];
  const displayName  = LEVEL_DISPLAY_NAMES[chosenLevel];
  const protocolName = PROTOCOL_NAMES[chosenLevel];
  const rationale    = PROTOCOL_RATIONALE[chosenLevel];

  const fmt = (v: number) => String(v).padStart(3, " ");

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center overflow-hidden"
      style={{ background: bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.60 }}
    >
      {/* ── Ambient orbs ── */}
      <motion.div className="absolute pointer-events-none"
        style={{ top: "18%", left: "-10%", width: 360, height: 360, borderRadius: "50%",
          background: `radial-gradient(circle, ${glowAlt} 0%, transparent 70%)`, filter: "blur(60px)" }}
        animate={{ scale: [1, 1.10, 1], opacity: [0.42, 0.72, 0.42] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute pointer-events-none"
        style={{ bottom: "14%", right: "-10%", width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, filter: "blur(55px)" }}
        animate={{ scale: [1, 1.20, 1], opacity: [0.32, 0.60, 0.32] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.8 }} />

      {/* ── Top label ── */}
      <style>{`
        @keyframes xpShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-md px-6 pt-14 flex flex-col items-center gap-3">
        <motion.div className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}>
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}
            animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <span className="text-[9px] tracking-[0.32em] uppercase font-mono font-bold"
            style={{ color: `${color}90` }}>
            System Sync · Result
          </span>
        </motion.div>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 w-full max-w-md px-5 flex flex-col justify-center gap-5 py-4">

        {/* SYNC SUCCESSFUL header */}
        <motion.div className="text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.52 }}>
          <h1
            className="text-[32px] font-extrabold tracking-[0.08em] uppercase"
            style={{
              color,
              fontFamily: "Inter, system-ui, sans-serif",
              textShadow: `0 0 30px ${glow}, 0 0 60px ${glow}50`,
              letterSpacing: "0.10em",
            }}>
            SYNC SUCCESSFUL
          </h1>
          <p className="text-[13px] mt-1.5 leading-snug"
            style={{ color: "rgba(255,255,255,0.60)", fontFamily: "Inter, system-ui, sans-serif" }}>
            System calibrated to your current rhythm.{" "}
            <span style={{ color: colorAlt, fontWeight: 600 }}>Efficiency at 100%.</span>
          </p>
        </motion.div>

        {/* Monospace system-status report */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.44 }}
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${color}28`, background: "rgba(0,0,0,0.40)", backdropFilter: "blur(12px)" }}>

          {/* Report header bar */}
          <div className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: `1px solid ${color}18`, background: `${color}0a` }}>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full"
                  style={{ background: i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : "#22c55e", opacity: 0.7 }} />
              ))}
            </div>
            <span className="text-[9px] font-mono ml-1" style={{ color: `${color}70` }}>
              ASCEND_OS · CALIBRATION_REPORT.log
            </span>
          </div>

          {/* Report body */}
          <div className="px-4 py-4 flex flex-col gap-[5px]">
            <AnimatePresence mode="wait">
              <motion.div key={chosenLevel}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex flex-col gap-[5px]">
                {[
                  { label: "PROTOCOL",       value: protocolName,                          col: color },
                  { label: "LEVEL_REF",      value: displayName.toUpperCase(),             col: levelColor },
                  { label: "STR_OUTPUT",     value: `${fmt(profile.powerOutput)}%`,        col: "rgba(251,191,36,0.90)" },
                  { label: "VIT_RATE",       value: `${fmt(profile.recoveryRate)}%`,       col: "rgba(52,211,153,0.90)" },
                  { label: "SNS_STABILITY",  value: `${fmt(profile.signalStability)}%`,    col: "rgba(167,139,250,0.90)" },
                  { label: "DISC_SYNC",      value: `${fmt(profile.syncRegularity)}%`,     col: "rgba(251,146,60,0.90)" },
                  { label: "STATUS",         value: "OPTIMAL BASELINE CONFIRMED",          col: "#22c55e" },
                ].map(({ label, value, col }) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span className="text-[10px] font-mono shrink-0 w-[100px]"
                      style={{ color: "rgba(255,255,255,0.28)" }}>
                      {`>`} {label}
                    </span>
                    <span className="text-[10px] font-mono font-semibold"
                      style={{ color: col }}>
                      {value}
                    </span>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Divider + body copy */}
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${color}14` }}>
              <p className="text-[10px] font-mono leading-[1.65]"
                style={{ color: "rgba(255,255,255,0.38)" }}>
                Your current parameters are the optimal baseline for sustainable<br />
                growth. All protocols have been adjusted to match your sync level.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Rationale card */}
        <AnimatePresence mode="wait">
          <motion.div key={chosenLevel}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.26 }}
            className="rounded-xl px-4 py-3.5"
            style={{ background: `${levelColor}0c`, border: `1px solid ${levelColor}30` }}>
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>
              {rationale}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Adjust manually toggle */}
        <div>
          <button onClick={() => setAdjustOpen(o => !o)} data-testid="button-adjust-level"
            className="flex items-center gap-1.5 mx-auto text-[11px] font-mono transition-all"
            style={{ color: `${color}55` }}>
            {adjustOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {isAdjusted ? "Protocol adjusted manually" : "Adjust manually"}
          </button>

          <AnimatePresence>
            {adjustOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.26 }}
                className="overflow-hidden mt-3">
                <div className="grid grid-cols-4 gap-2">
                  {LEVEL_ORDER.map(lvl => {
                    const lc    = LEVEL_COLORS[lvl];
                    const dn    = LEVEL_DISPLAY_NAMES[lvl];
                    const isMe  = lvl === chosenLevel;
                    const isRec = lvl === profile.derivedLevel;
                    return (
                      <button key={lvl} onClick={() => setChosenLevel(lvl)}
                        data-testid={`button-select-level-${lvl}`}
                        className="rounded-xl py-3 flex flex-col items-center gap-1.5 transition-all active:scale-95"
                        style={{
                          backgroundColor: isMe ? `${lc}1e` : "rgba(255,255,255,0.03)",
                          border: `1.5px solid ${isMe ? lc : "rgba(255,255,255,0.07)"}`,
                          boxShadow: isMe ? `0 0 14px ${lc}40` : "none",
                        }}>
                        <span className="text-[10px] font-bold leading-tight text-center"
                          style={{ color: isMe ? lc : "rgba(255,255,255,0.35)" }}>
                          {dn}
                        </span>
                        {isRec && !isMe && (
                          <span className="text-[8px] font-mono" style={{ color: `${color}65` }}>
                            rec
                          </span>
                        )}
                        {isMe && <Check size={10} style={{ color: lc }} />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ── CTA ── */}
      <div className="relative z-10 w-full max-w-md px-5 pb-12 flex flex-col gap-3">
        <motion.button
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.4 }}
          onClick={() => onConfirm(chosenLevel)}
          data-testid="button-begin-path"
          className="w-full py-[14px] rounded-2xl font-bold text-[13px] uppercase tracking-[0.20em] transition-all active:scale-[0.98] relative overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${color}, ${colorAlt})`,
            color: "#fff",
            fontFamily: "Inter, system-ui, sans-serif",
            boxShadow: `0 0 30px ${glow}, 0 4px 18px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.18)`,
          }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "xpShimmer 3s linear infinite",
            }} />
          Initialise Protocol  →
        </motion.button>
      </div>
    </motion.div>
  );
}

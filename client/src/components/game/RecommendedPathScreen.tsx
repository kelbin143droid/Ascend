/**
 * RecommendedPathScreen.tsx
 * "SYNC SUCCESSFUL" result screen shown after System Sync calibration.
 * Features an animated radar chart that draws itself from the centre,
 * the required narrative text below it, protocol rationale, and the CTA.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { LEVEL_COLORS, LEVEL_DISPLAY_NAMES, type WorkoutLevel } from "@/lib/workoutPlans";
import type { CalibrationProfile } from "@/lib/calibrationEngine";
import { RadarChart } from "./RadarChart";

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
  entry:        "Parameters indicate an initialising system. Foundation Protocol anchors habits before intensity to maximise long-term retention.",
  beginner:     "Parameters indicate a developing system. Build Protocol layers progressive stimulus while protecting recovery bandwidth.",
  intermediate: "Parameters indicate a stable system under load. Evolve Protocol applies compound challenge to accelerate capacity expansion.",
  advanced:     "Parameters indicate a high-output system. Ascend Protocol operates at full-capacity resistance with disciplined recovery cycles.",
};

export function RecommendedPathScreen({ gender, profile, onConfirm }: Props) {
  const isFemale   = gender === "female";
  const bgGradient = isFemale
    ? "linear-gradient(145deg, #04000e 0%, #080018 50%, #05000f 100%)"
    : "linear-gradient(145deg, #020810 0%, #03101e 50%, #020810 100%)";

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

  // Map calibration slider values → radar axes
  const radarValues = {
    strength:   profile.powerOutput,
    vitality:   profile.recoveryRate,
    sense:      profile.signalStability,
    discipline: profile.syncRegularity,
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto overflow-x-hidden"
      style={{ background: bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.60 }}
    >
      {/* ── Keyframe ── */}
      <style>{`
        @keyframes xpShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* ── Ambient orbs ── */}
      <motion.div className="absolute pointer-events-none"
        style={{ top: "8%", left: "-10%", width: 320, height: 320, borderRadius: "50%",
          background: `radial-gradient(circle, ${glowAlt} 0%, transparent 70%)`, filter: "blur(60px)" }}
        animate={{ scale: [1, 1.10, 1], opacity: [0.38, 0.65, 0.38] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute pointer-events-none"
        style={{ bottom: "8%", right: "-10%", width: 280, height: 280, borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, filter: "blur(55px)" }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.28, 0.55, 0.28] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.8 }} />

      {/* ── Top status label ── */}
      <div className="relative z-10 w-full max-w-md px-6 pt-12 flex flex-col items-center gap-3 shrink-0">
        <motion.div className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.10 }}>
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}
            animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <span className="text-[9px] tracking-[0.32em] uppercase font-mono font-bold"
            style={{ color: `${color}90` }}>
            System Sync · Result
          </span>
        </motion.div>
      </div>

      {/* ── Main scrollable content ── */}
      <div className="relative z-10 w-full max-w-md px-5 flex flex-col items-center gap-4 py-3 pb-6">

        {/* SYNC SUCCESSFUL heading */}
        <motion.div className="text-center"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.48 }}>
          <h1
            className="text-[28px] font-extrabold uppercase tracking-[0.10em]"
            style={{
              color,
              fontFamily: "Inter, system-ui, sans-serif",
              textShadow: `0 0 28px ${glow}, 0 0 56px ${glow}50`,
            }}>
            SYNC SUCCESSFUL
          </h1>
        </motion.div>

        {/* ── Radar chart ── */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.80 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.55, ease: "easeOut" }}>
          <RadarChart
            values={radarValues}
            chartSize={158}
            color={color}
            animate
            delay={520}
          />
        </motion.div>

        {/* Narrative text — directly below chart as spec'd */}
        <motion.div
          className="text-center px-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.40 }}>
          <p className="text-[13px] leading-snug"
            style={{ color: "rgba(255,255,255,0.58)", fontFamily: "Inter, system-ui, sans-serif" }}>
            System calibrated to your current rhythm.{" "}
            <span className="font-semibold" style={{ color: colorAlt }}>
              Efficiency at 100%.
            </span>
          </p>
          <p className="text-[10px] font-mono mt-1.5 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.28)" }}>
            Your current parameters are the optimal baseline for sustainable growth.
            All protocols have been adjusted to match your sync level.
          </p>
        </motion.div>

        {/* Protocol badge */}
        <AnimatePresence mode="wait">
          <motion.div key={`badge-${chosenLevel}`}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24 }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl w-full"
            style={{ background: `${levelColor}0d`, border: `1px solid ${levelColor}30` }}>
            <div className="flex flex-col flex-1">
              <span className="text-[9px] font-mono tracking-[0.20em] uppercase"
                style={{ color: `${levelColor}80` }}>
                Assigned Protocol
              </span>
              <span className="text-[14px] font-bold font-mono tracking-[0.06em]"
                style={{ color: levelColor }}>
                {protocolName}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{ background: `${levelColor}18`, color: levelColor, border: `1px solid ${levelColor}25` }}>
              {displayName}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Rationale */}
        <AnimatePresence mode="wait">
          <motion.p key={`rat-${chosenLevel}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="text-[11px] leading-relaxed text-center px-1"
            style={{ color: "rgba(255,255,255,0.40)" }}>
            {rationale}
          </motion.p>
        </AnimatePresence>

        {/* Adjust manually toggle */}
        <div className="w-full">
          <button onClick={() => setAdjustOpen(o => !o)} data-testid="button-adjust-level"
            className="flex items-center gap-1.5 mx-auto text-[11px] font-mono transition-all"
            style={{ color: `${color}50` }}>
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
                          <span className="text-[8px] font-mono" style={{ color: `${color}65` }}>rec</span>
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

        {/* ── CTA ── */}
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.38 }}
          onClick={() => onConfirm(chosenLevel)}
          data-testid="button-begin-path"
          className="w-full mt-1 py-[14px] rounded-2xl font-bold text-[13px] uppercase tracking-[0.20em] transition-all active:scale-[0.98] relative overflow-hidden"
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

        <div className="pb-4" />
      </div>
    </motion.div>
  );
}

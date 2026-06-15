/**
 * RecommendedPathScreen.tsx
 * "SYNC SUCCESSFUL" result screen — clean, minimal layout.
 * Top: status label + heading + radar chart.
 * Bottom: "Efficiency at 100%" + glowing protocol name + CTA.
 */

import { motion } from "framer-motion";
import { LEVEL_COLORS, LEVEL_DISPLAY_NAMES, type WorkoutLevel } from "@/lib/workoutPlans";
import type { CalibrationProfile } from "@/lib/calibrationEngine";
import { RadarChart } from "./RadarChart";

interface Props {
  gender:    "male" | "female";
  profile:   CalibrationProfile;
  onConfirm: (chosenLevel: WorkoutLevel) => void;
}

const PROTOCOL_WORD: Record<WorkoutLevel, string> = {
  entry:        "FOUNDATION",
  beginner:     "BUILD",
  intermediate: "EVOLVE",
  advanced:     "ASCEND",
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

  const chosenLevel  = profile.derivedLevel;
  const levelColor   = LEVEL_COLORS[chosenLevel];
  const protocolWord = PROTOCOL_WORD[chosenLevel];

  const radarValues = {
    strength:   profile.powerOutput,
    vitality:   profile.recoveryRate,
    sense:      profile.signalStability,
    discipline: profile.syncRegularity,
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center overflow-hidden"
      style={{ background: bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.60 }}
    >
      <style>{`
        @keyframes xpShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes protocolPulse {
          0%, 100% { opacity: 0.85; text-shadow: 0 0 32px var(--lc), 0 0 64px var(--lc60); }
          50%       { opacity: 1;    text-shadow: 0 0 56px var(--lc), 0 0 100px var(--lc60); }
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

      {/* ── Content ── */}
      <div className="relative z-10 flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-2 px-5 py-5">

        {/* Status label */}
        <motion.div className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.10 }}>
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}
            animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <span className="text-[9px] tracking-[0.32em] uppercase font-mono font-bold"
            style={{ color: `${color}90` }}>
            Sync Complete
          </span>
        </motion.div>

        {/* SYNC SUCCESSFUL */}
        <motion.h1
          className="text-[26px] font-extrabold uppercase tracking-[0.10em] text-center"
          style={{
            color,
            fontFamily: "Inter, system-ui, sans-serif",
            textShadow: `0 0 28px ${glow}, 0 0 56px ${glow}50`,
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.48 }}>
          SYSTEM READY
        </motion.h1>

        {/* Radar chart */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.80 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.55, ease: "easeOut" }}>
          <RadarChart
            values={radarValues}
            chartSize={132}
            color={color}
            animate
            delay={520}
          />
        </motion.div>

        {/* Divider */}
        <motion.div
          className="w-full h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}22, transparent)` }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }} />

        {/* Personalized result */}
        <motion.p
          className="text-[17px] font-bold text-center leading-tight"
          style={{ color: "#fff", fontFamily: "Inter, system-ui, sans-serif",
            textShadow: "0 0 20px rgba(255,255,255,0.18)" }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.40 }}>
          Starting Protocol:{" "}
          <span style={{ color: colorAlt, textShadow: `0 0 18px ${glow}` }}>{LEVEL_DISPLAY_NAMES[chosenLevel]}</span>
        </motion.p>

        {/* Protocol word — glowing, large, level-coloured */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.74, duration: 0.48, ease: "easeOut" }}>
          <motion.p
            className="text-[34px] font-black uppercase tracking-[0.08em] text-center"
            style={{
              color: levelColor,
              fontFamily: "Inter, system-ui, sans-serif",
              textShadow: `0 0 40px ${levelColor}, 0 0 80px ${levelColor}60`,
              animation: "protocolPulse 2.8s ease-in-out infinite",
              ["--lc" as any]:   levelColor,
              ["--lc60" as any]: `${levelColor}60`,
            }}>
            {protocolWord}
          </motion.p>
          <p className="text-[11px] font-mono tracking-[0.20em] uppercase"
            style={{ color: `${levelColor}70` }}>
            Protocol Assigned
          </p>
        </motion.div>

        <motion.div
          className="w-full rounded-2xl border px-4 py-2.5 text-center"
          style={{
            borderColor: `${color}35`,
            background: `${color}10`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 24px ${glowAlt}`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.82, duration: 0.4 }}
        >
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.20em]" style={{ color: `${colorAlt}cc` }}>
            First Quest
          </p>
          <p className="mt-1 text-base font-black text-white">30-Second Reset</p>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.90, duration: 0.38 }}
          onClick={() => onConfirm(chosenLevel)}
          data-testid="button-begin-path"
          className="w-full mt-1 py-[15px] rounded-2xl font-bold text-[13px] uppercase tracking-[0.20em] transition-all active:scale-[0.98] relative overflow-hidden"
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
          Start First Quest  →
        </motion.button>

      </div>
    </motion.div>
  );
}

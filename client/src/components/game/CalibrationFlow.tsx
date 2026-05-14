/**
 * CalibrationFlow.tsx
 * "System Sync" calibration — 4 glowing linear sliders.
 * A scanning-line animation sweeps on each question transition.
 * Neon-blue accents throughout; dark cinematic background.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CalibrationAnswers } from "@/lib/calibrationEngine";

interface Props {
  gender: "male" | "female";
  onComplete: (answers: CalibrationAnswers) => void;
}

// ── Question definitions ───────────────────────────────────────────────────────

const QUESTIONS = [
  {
    key:          "powerOutput" as keyof CalibrationAnswers,
    sectionLabel: "Power Output",
    stat:         "Strength",
    prompt:       "What is your current physical output level?",
    stages:       ["Conservation Mode", "Building Phase", "Active Protocol", "High Intensity"],
    low:          "Conservation Mode",
    high:         "High Intensity",
  },
  {
    key:          "recoveryRate" as keyof CalibrationAnswers,
    sectionLabel: "Recovery Rate",
    stat:         "Vitality",
    prompt:       "How efficiently does your system recover?",
    stages:       ["Depleted", "Recovering", "Balanced", "Peak Recovery"],
    low:          "Depleted",
    high:         "Peak Recovery",
  },
  {
    key:          "signalStability" as keyof CalibrationAnswers,
    sectionLabel: "Signal Stability",
    stat:         "Sense",
    prompt:       "Assess your current mental signal clarity.",
    stages:       ["Static Interference", "Unstable Signal", "Steady State", "Clear Channel"],
    low:          "Static Interference",
    high:         "Clear Channel",
  },
  {
    key:          "syncRegularity" as keyof CalibrationAnswers,
    sectionLabel: "Sync Regularity",
    stat:         "Discipline",
    prompt:       "How consistent is your behavioral sync pattern?",
    stages:       ["Irregular", "Intermittent", "Consistent", "Fully Synchronized"],
    low:          "Irregular",
    high:         "Fully Synchronized",
  },
] as const;

function getStage(value: number, stages: readonly string[]): string {
  if (value < 25) return stages[0];
  if (value < 50) return stages[1];
  if (value < 75) return stages[2];
  return stages[3];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CalibrationFlow({ gender, onComplete }: Props) {
  const isFemale   = gender === "female";
  const bgGradient = isFemale
    ? "linear-gradient(145deg, #04000e 0%, #080018 50%, #05000f 100%)"
    : "linear-gradient(145deg, #020810 0%, #03101e 50%, #020810 100%)";

  // Neon-blue accents as specified
  const color    = "#0ea5e9";
  const colorAlt = "#38bdf8";
  const glow     = "rgba(14,165,233,0.40)";
  const glowAlt  = "rgba(56,189,248,0.22)";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scanning,     setScanning]     = useState(false);
  const [direction,    setDirection]    = useState(1);
  const [values, setValues] = useState<Record<string, number>>({
    powerOutput: 50, recoveryRate: 50, signalStability: 50, syncRegularity: 50,
  });
  const advancing = useRef(false);

  const q            = QUESTIONS[currentIndex];
  const currentValue = values[q.key] ?? 50;
  const stageLabel   = getStage(currentValue, q.stages);

  const handleSliderChange = (val: number) => {
    setValues(prev => ({ ...prev, [q.key]: val }));
  };

  const handleConfirm = () => {
    if (advancing.current || scanning) return;
    advancing.current = true;
    setScanning(true);

    setTimeout(() => {
      setScanning(false);
      if (currentIndex < QUESTIONS.length - 1) {
        setDirection(1);
        setCurrentIndex(i => i + 1);
        advancing.current = false;
      } else {
        onComplete({
          powerOutput:     values.powerOutput     ?? 50,
          recoveryRate:    values.recoveryRate     ?? 50,
          signalStability: values.signalStability  ?? 50,
          syncRegularity:  values.syncRegularity   ?? 50,
        });
      }
    }, 780);
  };

  const stars = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.7 + Math.random() * 1.6,
      duration: 2.5 + Math.random() * 4,
      delay: Math.random() * 3,
      opacity: 0.15 + Math.random() * 0.42,
    }))
  ).current;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center overflow-hidden"
      style={{ background: bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55 }}
    >
      {/* ── Custom slider CSS ── */}
      <style>{`
        .sync-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        .sync-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #38bdf8, #0ea5e9);
          border: 2px solid rgba(255,255,255,0.30);
          box-shadow: 0 0 18px rgba(14,165,233,0.55), 0 0 6px #0ea5e9, inset 0 1px 0 rgba(255,255,255,0.25);
          cursor: pointer;
          transition: box-shadow 0.15s, transform 0.1s;
        }
        .sync-slider:active::-webkit-slider-thumb {
          transform: scale(1.18);
          box-shadow: 0 0 32px rgba(14,165,233,0.80), 0 0 12px #0ea5e9;
        }
        .sync-slider::-moz-range-thumb {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #0ea5e9;
          border: 2px solid rgba(255,255,255,0.30);
          box-shadow: 0 0 18px rgba(14,165,233,0.55);
          cursor: pointer;
        }
        .sync-slider::-webkit-slider-runnable-track { border-radius: 3px; }
        .sync-slider::-moz-range-track { border-radius: 3px; height: 5px; }
        @keyframes xpShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* ── Stars ── */}
      {stars.map(s => (
        <motion.div key={s.id} className="absolute rounded-full pointer-events-none"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%`, background: color }}
          animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.2] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: "easeInOut" }} />
      ))}

      {/* ── Ambient orbs ── */}
      <motion.div className="absolute pointer-events-none"
        style={{ top: "18%", left: "-12%", width: 340, height: 340, borderRadius: "50%",
          background: `radial-gradient(circle, ${glowAlt} 0%, transparent 70%)`, filter: "blur(55px)" }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.72, 0.4] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute pointer-events-none"
        style={{ top: "52%", right: "-10%", width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, filter: "blur(60px)" }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.28, 0.58, 0.28] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />

      {/* ── Scanning line ── */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            className="fixed left-0 right-0 z-[200] pointer-events-none"
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${color}50 8%, ${color} 50%, ${color}50 92%, transparent 100%)`,
              boxShadow: `0 0 20px ${glow}, 0 0 50px ${glow}60`,
            }}
            initial={{ top: -4 }}
            animate={{ top: "100vh" }}
            transition={{ duration: 0.76, ease: "linear" }}
          />
        )}
      </AnimatePresence>

      {/* ── Top bar ── */}
      <div className="relative z-10 w-full max-w-md px-6 pt-14 pb-2 flex flex-col items-center gap-4">
        <motion.div className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}>
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}
            animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
          <span className="text-[9px] tracking-[0.32em] uppercase font-mono font-bold"
            style={{ color: `${color}90` }}>
            System Sync · Calibration
          </span>
        </motion.div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {QUESTIONS.map((_, i) => (
            <motion.div key={i} className="rounded-full"
              style={{
                backgroundColor: i < currentIndex ? `${color}70` : i === currentIndex ? color : `${color}20`,
                border: `1px solid ${i === currentIndex ? color : `${color}28`}`,
              }}
              animate={{ width: i === currentIndex ? 22 : 6, height: 6,
                boxShadow: i === currentIndex ? `0 0 10px ${glow}` : "none" }}
              transition={{ duration: 0.3, ease: "easeOut" }} />
          ))}
        </div>
      </div>

      {/* ── Question area ── */}
      <div className="relative z-10 flex-1 w-full max-w-md px-5 flex flex-col justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentIndex} custom={direction}
            initial={{ opacity: 0, x: direction * 52 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -52 }}
            transition={{ duration: 0.30, ease: "easeOut" }}
            className="flex flex-col gap-6">

            {/* Section label + counter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${color}12`, border: `1px solid ${color}28` }}>
                <span className="text-[9px] uppercase tracking-[0.24em] font-mono font-semibold"
                  style={{ color }}>
                  {q.sectionLabel}
                </span>
                <span className="text-[8px] font-mono" style={{ color: `${color}65` }}>
                  · {q.stat}
                </span>
              </div>
              <span className="text-[9px] font-mono" style={{ color: `${color}50` }}>
                {String(currentIndex + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}
              </span>
            </div>

            {/* Prompt */}
            <h2 className="text-[20px] font-bold leading-snug"
              style={{ color: "#ffffff", fontFamily: "Inter, system-ui, sans-serif",
                textShadow: `0 0 28px ${glow}`, letterSpacing: "0.01em" }}>
              {q.prompt}
            </h2>

            {/* Slider card */}
            <div className="rounded-2xl flex flex-col gap-5"
              style={{ background: "rgba(14,165,233,0.04)", border: `1px solid ${color}22`,
                backdropFilter: "blur(14px)", padding: "20px 20px 16px",
                boxShadow: `0 0 40px ${glow}14, inset 0 1px 0 ${color}14` }}>

              {/* Live readout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                    animate={{ boxShadow: [`0 0 6px ${glow}`, `0 0 14px ${glow}`, `0 0 6px ${glow}`] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.span
                    key={stageLabel}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="text-[13px] font-semibold"
                    style={{ color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
                    {stageLabel}
                  </motion.span>
                </div>
                <span className="text-[16px] font-mono font-bold tabular-nums"
                  style={{ color, textShadow: `0 0 10px ${glow}`, letterSpacing: "-0.02em" }}>
                  {currentValue}<span className="text-[10px] ml-0.5" style={{ opacity: 0.6 }}>%</span>
                </span>
              </div>

              {/* Slider */}
              <div className="relative">
                <input
                  type="range" min={0} max={100} value={currentValue}
                  onChange={e => handleSliderChange(parseInt(e.target.value))}
                  className="sync-slider"
                  style={{
                    background: `linear-gradient(to right,
                      ${color}ee 0%, ${color}ee ${currentValue}%,
                      rgba(255,255,255,0.09) ${currentValue}%,
                      rgba(255,255,255,0.09) 100%)`,
                  }}
                  data-testid={`slider-${q.key}`}
                />
                {/* Glow track overlay */}
                <div className="absolute top-0 left-0 h-full pointer-events-none rounded"
                  style={{ width: `${currentValue}%`, height: 5, marginTop: "0px",
                    boxShadow: `0 0 8px ${glow}`, borderRadius: 3 }} />
              </div>

              {/* Endpoint labels */}
              <div className="flex justify-between mt-[-6px]">
                <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {q.low}
                </span>
                <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {q.high}
                </span>
              </div>
            </div>

            {/* Stat mapping badge */}
            <div className="flex items-center gap-2 self-start px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-1 h-1 rounded-full" style={{ background: `${color}80` }} />
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.30)" }}>
                MAPS TO → {q.stat.toUpperCase()} STAT
              </span>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Confirm button ── */}
      <div className="relative z-10 w-full max-w-md px-5 pb-10 flex flex-col gap-3 mt-2">
        <motion.button
          key={`btn-${currentIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          onClick={handleConfirm}
          disabled={scanning}
          data-testid="button-confirm-sync"
          className="w-full py-[14px] rounded-2xl font-bold text-[13px] uppercase tracking-[0.20em] transition-all active:scale-[0.97] relative overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${color}, ${colorAlt})`,
            color: "#fff",
            fontFamily: "Inter, system-ui, sans-serif",
            boxShadow: `0 0 28px ${glow}, 0 4px 16px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.20)`,
            opacity: scanning ? 0.55 : 1,
          }}>
          {/* Shimmer */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "xpShimmer 3s linear infinite",
            }} />
          {currentIndex < QUESTIONS.length - 1 ? "Lock Sync  →" : "Complete Sync  →"}
        </motion.button>

        <p className="text-center text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>
          {currentIndex === QUESTIONS.length - 1
            ? "Finalizing system calibration…"
            : "Adjust slider · Lock to advance"}
        </p>
      </div>
    </motion.div>
  );
}

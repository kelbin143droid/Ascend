/**
 * CalibrationFlow.tsx
 * "System Sync" calibration — single scrolling screen.
 * Live radar chart at the top (with ghost baseline) updates instantly
 * as the user picks tier buttons. Completion triggers a modal overlay
 * before handing off to onComplete.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart } from "@/components/game/RadarChart";
import type { RadarChartValues } from "@/components/game/RadarChart";
import type { CalibrationAnswers } from "@/lib/calibrationEngine";

interface Props {
  gender: "male" | "female";
  onComplete: (answers: CalibrationAnswers) => void;
}

// ── Section / tier data ────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key:       "powerOutput" as keyof CalibrationAnswers,
    radarKey:  "strength"   as keyof RadarChartValues,
    label:     "Power Output",
    stat:      "Strength",
    statColor: "#fbbf24",
    icon:      "⚡",
    prompt:    "Select your highest consistent pushup form:",
    options: [
      { label: "Wall / Incline", sub: "Pushup against a wall or elevated surface", value: 15 },
      { label: "Knee Pushup",    sub: "Full range of motion, knees on ground",      value: 35 },
      { label: "Regular Form",   sub: "Standard floor pushup with good form",        value: 65 },
      { label: "Advanced",       sub: "Clap, decline, or weighted pushups",          value: 90 },
    ],
  },
  {
    key:       "recoveryRate" as keyof CalibrationAnswers,
    radarKey:  "vitality"    as keyof RadarChartValues,
    label:     "Vitality Signal",
    stat:      "Vitality",
    statColor: "#34d399",
    icon:      "💚",
    prompt:    "How is your typical sleep quality and daily hydration?",
    options: [
      { label: "Disrupted",     sub: "Poor sleep, rarely drink enough water",      value: 15 },
      { label: "Light Recovery", sub: "5–6 h sleep, some water through the day",   value: 40 },
      { label: "Solid Rest",    sub: "7 h sleep, consistently staying hydrated",    value: 65 },
      { label: "Peak Vitality", sub: "8+ h quality sleep, fully hydrated daily",   value: 90 },
    ],
  },
  {
    key:       "signalStability" as keyof CalibrationAnswers,
    radarKey:  "sense"           as keyof RadarChartValues,
    label:     "Signal Stability",
    stat:      "Sense",
    statColor: "#a78bfa",
    icon:      "🧠",
    prompt:    "Current daily meditation or mindfulness practice:",
    options: [
      { label: "None / Rarely", sub: "No regular practice",                         value: 10 },
      { label: "5 – 15 min",    sub: "Light, occasional sessions",                  value: 35 },
      { label: "15 – 30 min",   sub: "Regular focused practice",                    value: 65 },
      { label: "30 + min",      sub: "Deep, consistent daily sessions",              value: 90 },
    ],
  },
  {
    key:       "syncRegularity" as keyof CalibrationAnswers,
    radarKey:  "discipline"     as keyof RadarChartValues,
    label:     "Sync Regularity",
    stat:      "Discipline",
    statColor: "#fb923c",
    icon:      "🔄",
    prompt:    "How consistent are your daily routines and habits?",
    options: [
      { label: "Irregular",    sub: "Routines rarely stick",                       value: 10 },
      { label: "Intermittent", sub: "On-and-off consistency",                       value: 35 },
      { label: "Consistent",   sub: "Most days I show up",                          value: 65 },
      { label: "Locked In",    sub: "Strong systems and high follow-through",        value: 90 },
    ],
  },
] as const;

// Ghost baseline: all axes at 50%
const GHOST: RadarChartValues = { strength: 50, vitality: 50, sense: 50, discipline: 50 };

// Protocol display name from powerOutput tier value
function protocolLabel(powerOutput?: number): string {
  if (powerOutput === undefined) return "—";
  if (powerOutput < 25) return "FOUNDATION";
  if (powerOutput < 50) return "BUILD";
  if (powerOutput < 75) return "EVOLVE";
  return "ASCEND";
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CalibrationFlow({ gender, onComplete }: Props) {
  const isFemale   = gender === "female";
  const bgGradient = isFemale
    ? "linear-gradient(145deg, #04000e 0%, #080018 50%, #05000f 100%)"
    : "linear-gradient(145deg, #020810 0%, #03101e 50%, #020810 100%)";

  const color    = "#0ea5e9";
  const colorAlt = "#38bdf8";
  const glow     = "rgba(14,165,233,0.40)";

  // Selected tier values keyed by section key
  const [selections, setSelections] = useState<Partial<Record<keyof CalibrationAnswers, number>>>({});
  const [scanning,   setScanning]   = useState(false);
  const [showModal,  setShowModal]  = useState(false);

  const selectedCount = Object.keys(selections).length;
  const allSelected   = selectedCount === SECTIONS.length;

  // Live radar values — 0 for unselected axes
  const radarValues: RadarChartValues = {
    strength:   selections.powerOutput    ?? 0,
    vitality:   selections.recoveryRate   ?? 0,
    sense:      selections.signalStability ?? 0,
    discipline: selections.syncRegularity  ?? 0,
  };

  const completing = useRef(false);

  const handleSelect = (key: keyof CalibrationAnswers, value: number) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  const handleComplete = () => {
    if (completing.current || scanning || !allSelected) return;
    completing.current = true;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setShowModal(true);
    }, 750);
  };

  const handleModalContinue = () => {
    onComplete({
      powerOutput:     selections.powerOutput     ?? 50,
      recoveryRate:    selections.recoveryRate     ?? 50,
      signalStability: selections.signalStability  ?? 50,
      syncRegularity:  selections.syncRegularity   ?? 50,
    });
  };

  const stars = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: 0.7 + Math.random() * 1.6, duration: 2.5 + Math.random() * 4,
      delay: Math.random() * 3, opacity: 0.15 + Math.random() * 0.42,
    }))
  ).current;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ background: bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55 }}
    >
      <style>{`
        @keyframes xpShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* ── Ambient stars ── */}
      {stars.map(s => (
        <motion.div key={s.id} className="absolute rounded-full pointer-events-none"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%`, background: color }}
          animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.2] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: "easeInOut" }} />
      ))}

      {/* ── Ambient orbs ── */}
      <motion.div className="absolute pointer-events-none"
        style={{ top: "12%", left: "-14%", width: 340, height: 340, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)`,
          filter: "blur(55px)" }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.72, 0.4] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute pointer-events-none"
        style={{ bottom: "8%", right: "-12%", width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          filter: "blur(60px)" }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.28, 0.58, 0.28] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />

      {/* ── Scanning line ── */}
      <AnimatePresence>
        {scanning && (
          <motion.div className="fixed left-0 right-0 z-[200] pointer-events-none"
            style={{ height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${color}50 8%, ${color} 50%, ${color}50 92%, transparent 100%)`,
              boxShadow: `0 0 20px ${glow}, 0 0 50px ${glow}60` }}
            initial={{ top: -4 }}
            animate={{ top: "100vh" }}
            transition={{ duration: 0.74, ease: "linear" }} />
        )}
      </AnimatePresence>

      {/* ════════════════ STICKY HEADER WITH CHART ════════════════ */}
      <div className="relative z-10 flex-shrink-0 flex flex-col items-center pt-10 pb-3 px-4">

        {/* Top label */}
        <motion.div className="flex items-center gap-2 mb-3"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}>
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}
            animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
          <span className="text-[9px] tracking-[0.32em] uppercase font-mono font-bold"
            style={{ color: `${color}90` }}>
            System Sync · Calibration
          </span>
        </motion.div>

        {/* Live radar chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.45, ease: "easeOut" }}
        >
          <RadarChart
            values={radarValues}
            ghostValues={GHOST}
            chartSize={148}
            color={color}
            animate={false}
          />
        </motion.div>

        {/* Status bar: N/4 calibrated · Protocol preview */}
        <motion.div className="flex items-center gap-3 mt-1"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
            {SECTIONS.map((_, i) => (
              <motion.div key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:           i < selectedCount ? 14 : 6,
                  height:          6,
                  backgroundColor: i < selectedCount ? `${color}cc` : `${color}22`,
                  border:          `1px solid ${i < selectedCount ? color : `${color}28`}`,
                  boxShadow:       i < selectedCount ? `0 0 6px ${glow}` : "none",
                }} />
            ))}
            <span className="text-[9px] font-mono ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              {selectedCount}/4
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={protocolLabel(selections.powerOutput)}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-[0.20em]"
              style={{
                color,
                background: `${color}14`,
                border: `1px solid ${color}30`,
                opacity: selections.powerOutput !== undefined ? 1 : 0.35,
              }}>
              {protocolLabel(selections.powerOutput)}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Divider */}
        <div className="w-full max-w-sm h-px mt-3"
          style={{ background: `linear-gradient(90deg, transparent, ${color}25, transparent)` }} />
      </div>

      {/* ════════════════ SCROLLABLE SECTIONS ════════════════ */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-sm mx-auto flex flex-col gap-5 pt-2">
          {SECTIONS.map((section, si) => {
            const selected = selections[section.key];
            return (
              <motion.div key={section.key}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + si * 0.08, ease: "easeOut" }}>

                {/* Section header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-[3px] h-4 rounded-full" style={{ background: section.statColor }} />
                    <span className="text-[11px] font-mono font-bold tracking-[0.18em] uppercase"
                      style={{ color: section.statColor }}>
                      {section.label}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: `${section.statColor}55` }}>
                      · {section.stat}
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    {selected !== undefined && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.16 }}
                        className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                        style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
                        {selected}%
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="text-[11px] mb-2.5" style={{ color: "rgba(255,255,255,0.40)", fontFamily: "Inter, system-ui, sans-serif" }}>
                  {section.prompt}
                </p>

                {/* 2×2 option grid */}
                <div className="grid grid-cols-2 gap-2">
                  {section.options.map((opt) => {
                    const isSelected = selected === opt.value;
                    return (
                      <motion.button
                        key={opt.label}
                        onClick={() => handleSelect(section.key, opt.value)}
                        data-testid={`option-${section.key}-${opt.value}`}
                        whileTap={{ scale: 0.96 }}
                        className="relative flex flex-col gap-0.5 text-left p-3 rounded-xl overflow-hidden transition-all duration-200"
                        style={{
                          background:   isSelected ? `${color}18` : "rgba(255,255,255,0.03)",
                          border:       `1px solid ${isSelected ? color : "rgba(255,255,255,0.08)"}`,
                          boxShadow:    isSelected ? `0 0 18px ${glow}55, inset 0 1px 0 ${color}22` : "none",
                        }}>

                        {/* Selected glow overlay */}
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                              background: `radial-gradient(ellipse at top left, ${color}14 0%, transparent 70%)`,
                            }} />
                        )}

                        {/* Selected check dot */}
                        <div className="flex items-start justify-between">
                          <span className="relative text-[12px] font-semibold leading-tight"
                            style={{
                              color: isSelected ? "#fff" : "rgba(255,255,255,0.60)",
                              fontFamily: "Inter, system-ui, sans-serif",
                              textShadow: isSelected ? `0 0 12px ${glow}` : "none",
                            }}>
                            {opt.label}
                          </span>
                          <motion.div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ml-1 flex items-center justify-center"
                            animate={{
                              backgroundColor: isSelected ? color : "transparent",
                              borderColor:     isSelected ? color : "rgba(255,255,255,0.18)",
                              boxShadow:       isSelected ? `0 0 8px ${glow}` : "none",
                            }}
                            style={{ border: "1px solid rgba(255,255,255,0.18)" }}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </motion.div>
                        </div>

                        <span className="relative text-[9px] leading-tight mt-0.5"
                          style={{ color: isSelected ? `${color}cc` : "rgba(255,255,255,0.28)",
                            fontFamily: "Inter, system-ui, sans-serif" }}>
                          {opt.sub}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ════════════════ FIXED BOTTOM CTA ════════════════ */}
      <div className="relative z-10 flex-shrink-0 px-4 pb-8 pt-3 max-w-sm mx-auto w-full">
        <div className="w-full h-px mb-3"
          style={{ background: `linear-gradient(90deg, transparent, ${color}20, transparent)` }} />

        <motion.button
          onClick={handleComplete}
          disabled={!allSelected || scanning}
          data-testid="button-complete-sync"
          whileTap={{ scale: 0.97 }}
          className="w-full py-[15px] rounded-2xl font-bold text-[13px] uppercase tracking-[0.20em] relative overflow-hidden transition-all duration-300"
          style={{
            background:  allSelected
              ? `linear-gradient(90deg, ${color}, ${colorAlt})`
              : "rgba(255,255,255,0.06)",
            color:       allSelected ? "#fff" : "rgba(255,255,255,0.25)",
            border:      `1px solid ${allSelected ? "transparent" : "rgba(255,255,255,0.10)"}`,
            boxShadow:   allSelected
              ? `0 0 28px ${glow}, 0 4px 16px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.20)`
              : "none",
            fontFamily:  "Inter, system-ui, sans-serif",
          }}>
          {allSelected && (
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "xpShimmer 3s linear infinite",
              }} />
          )}
          {allSelected ? "Complete Sync  →" : `Select all 4 to continue  (${selectedCount}/4)`}
        </motion.button>

        <p className="text-center text-[10px] font-mono mt-2"
          style={{ color: "rgba(255,255,255,0.18)" }}>
          {allSelected ? "All systems calibrated — ready to initialise" : "Ghost polygon shows average baseline"}
        </p>
      </div>

      {/* ════════════════ COMPLETION MODAL ════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-[300] flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}>

            {/* Glow burst */}
            <motion.div className="absolute pointer-events-none"
              style={{ width: 320, height: 320, borderRadius: "50%",
                background: `radial-gradient(circle, ${glow} 0%, transparent 65%)`,
                filter: "blur(40px)" }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 0.6 }}
              transition={{ duration: 0.9, ease: "easeOut" }} />

            <motion.div
              className="relative flex flex-col items-center gap-5 max-w-xs w-full"
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45, ease: "easeOut" }}>

              {/* Status label */}
              <div className="flex items-center gap-2">
                <motion.div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }}
                  animate={{ boxShadow: ["0 0 6px #4ade8088", "0 0 18px #4ade8088", "0 0 6px #4ade8088"] }}
                  transition={{ duration: 1.4, repeat: Infinity }} />
                <span className="text-[9px] tracking-[0.32em] uppercase font-mono font-bold"
                  style={{ color: "#4ade8090" }}>
                  Calibration Complete
                </span>
              </div>

              {/* SYNC SUCCESSFUL heading */}
              <div className="text-center">
                <h2 className="text-[28px] font-black tracking-[0.06em] uppercase"
                  style={{ color: "#fff", textShadow: `0 0 40px ${glow}, 0 0 80px ${glow}60`,
                    fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.08em" }}>
                  SYNC
                </h2>
                <h2 className="text-[28px] font-black tracking-[0.06em] uppercase mt-[-4px]"
                  style={{ color, textShadow: `0 0 40px ${glow}, 0 0 80px ${glow}60`,
                    fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.08em" }}>
                  SUCCESSFUL
                </h2>
              </div>

              {/* Final radar snapshot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.28, duration: 0.4 }}>
                <RadarChart
                  values={radarValues}
                  ghostValues={GHOST}
                  chartSize={140}
                  color={color}
                  animate={true}
                  delay={300}
                />
              </motion.div>

              {/* The required message */}
              <motion.div
                className="text-center px-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}>
                <p className="text-[15px] font-semibold leading-snug"
                  style={{ color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
                  System calibrated to your current rhythm.
                </p>
                <p className="text-[15px] font-semibold"
                  style={{ color, textShadow: `0 0 12px ${glow}` }}>
                  Efficiency at 100%.
                </p>
              </motion.div>

              {/* Protocol badge */}
              <motion.div
                className="px-4 py-2 rounded-full font-mono font-bold text-[11px] tracking-[0.22em]"
                style={{ color, background: `${color}18`, border: `1px solid ${color}40`,
                  boxShadow: `0 0 16px ${glow}40` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}>
                PROTOCOL: {protocolLabel(selections.powerOutput)}
              </motion.div>

              {/* Continue CTA */}
              <motion.button
                onClick={handleModalContinue}
                data-testid="button-initialise-protocol"
                whileTap={{ scale: 0.96 }}
                className="w-full py-[14px] rounded-2xl font-bold text-[13px] uppercase tracking-[0.20em] relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, ${color}, ${colorAlt})`,
                  color: "#fff",
                  fontFamily: "Inter, system-ui, sans-serif",
                  boxShadow: `0 0 28px ${glow}, 0 4px 16px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.20)`,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.80 }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "xpShimmer 3s linear infinite",
                  }} />
                Initialise Protocol  →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

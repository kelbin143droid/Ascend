/**
 * CalibrationFlow.tsx
 * Immersive 5-question calibration sequence shown after onboarding.
 * Each card slides in from the right; selecting an answer auto-advances.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  CalibrationAnswers,
  PhysicalReadiness,
  FocusStability,
  RoutineConsistency,
  EnergyState,
  StartingPace,
} from "@/lib/calibrationEngine";

interface Props {
  gender: "male" | "female";
  onComplete: (answers: CalibrationAnswers) => void;
}

type AnyAnswer = PhysicalReadiness | FocusStability | RoutineConsistency | EnergyState | StartingPace;

interface Question {
  key: keyof CalibrationAnswers;
  sectionLabel: string;
  prompt: string;
  options: { value: AnyAnswer; label: string; sub?: string }[];
}

const QUESTIONS: Question[] = [
  {
    key: "physicalReadiness",
    sectionLabel: "Physical Status",
    prompt: "How active have you been recently?",
    options: [
      { value: "inactive",    label: "Mostly inactive",      sub: "Little to no movement" },
      { value: "somewhat",    label: "Somewhat active",      sub: "Occasional walks or light exercise" },
      { value: "consistent",  label: "Consistently active",  sub: "Regular workouts or sport" },
      { value: "disciplined", label: "Highly disciplined",   sub: "Structured training routine" },
    ],
  },
  {
    key: "energyState",
    sectionLabel: "Energy Levels",
    prompt: "How has your energy been recently?",
    options: [
      { value: "exhausted", label: "Often exhausted",      sub: "Hard to get through the day" },
      { value: "unstable",  label: "Unstable",             sub: "Fluctuates a lot" },
      { value: "balanced",  label: "Mostly balanced",      sub: "Generally good energy" },
      { value: "strong",    label: "Strong and consistent", sub: "Consistent high energy" },
    ],
  },
  {
    key: "focusStability",
    sectionLabel: "Mental State",
    prompt: "How easy is it to stay mentally focused?",
    options: [
      { value: "very_difficult", label: "Very difficult",       sub: "Mind wanders constantly" },
      { value: "inconsistent",   label: "Inconsistent",         sub: "Some days better than others" },
      { value: "manageable",     label: "Usually manageable",   sub: "Can maintain focus with effort" },
      { value: "strong",         label: "Strong focus",         sub: "Rarely distracted" },
    ],
  },
  {
    key: "routineConsistency",
    sectionLabel: "Consistency",
    prompt: "How consistent are your daily routines?",
    options: [
      { value: "struggles",    label: "Struggle to stay consistent", sub: "Routines rarely stick" },
      { value: "starts_stops", label: "Start and stop often",        sub: "Good intention, poor follow-through" },
      { value: "fairly",       label: "Fairly consistent",           sub: "Most days I show up" },
      { value: "structured",   label: "Highly structured",           sub: "Strong systems in place" },
    ],
  },
  {
    key: "startingPace",
    sectionLabel: "Preferred Pace",
    prompt: "How should your journey begin?",
    options: [
      { value: "slow",        label: "Slow and manageable",         sub: "Build gradually, minimize overwhelm" },
      { value: "balanced",    label: "Balanced progression",        sub: "Steady challenge with room to grow" },
      { value: "challenging", label: "Push me harder",              sub: "I want to feel challenged from day one" },
    ],
  },
];

export function CalibrationFlow({ gender, onComplete }: Props) {
  const isFemale   = gender === "female";
  const color      = isFemale ? "#d946ef" : "#0ea5e9";
  const colorAlt   = isFemale ? "#8b5cf6" : "#38bdf8";
  const glow       = isFemale ? "rgba(217,70,239,0.35)" : "rgba(14,165,233,0.35)";
  const glowAlt    = isFemale ? "rgba(139,92,246,0.20)" : "rgba(56,189,248,0.20)";
  const bgGradient = isFemale
    ? "linear-gradient(145deg, #04000e 0%, #080018 50%, #05000f 100%)"
    : "linear-gradient(145deg, #020810 0%, #03101e 50%, #020810 100%)";

  const [currentIndex, setCurrentIndex]   = useState(0);
  const [selectedValue, setSelectedValue] = useState<AnyAnswer | null>(null);
  const [direction, setDirection]         = useState(1); // 1 = right→left, −1 = left→right
  const [answers, setAnswers]             = useState<Partial<CalibrationAnswers>>({});
  const advancing = useRef(false);

  const stars = useRef(
    Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.7 + Math.random() * 1.8,
      duration: 2.5 + Math.random() * 4,
      delay: Math.random() * 3,
      opacity: 0.18 + Math.random() * 0.45,
    }))
  ).current;

  const q = QUESTIONS[currentIndex];

  const handleSelect = (value: AnyAnswer) => {
    if (advancing.current) return;
    setSelectedValue(value);
    advancing.current = true;

    setTimeout(() => {
      const next = { ...answers, [q.key]: value } as Partial<CalibrationAnswers>;
      setAnswers(next);

      if (currentIndex < QUESTIONS.length - 1) {
        setDirection(1);
        setCurrentIndex((i) => i + 1);
        setSelectedValue(null);
        advancing.current = false;
      } else {
        onComplete(next as CalibrationAnswers);
      }
    }, 300);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden"
      style={{ background: bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55 }}
    >
      {/* Ambient stars */}
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: s.size, height: s.size,
            left: `${s.x}%`, top: `${s.y}%`,
            background: s.id % 3 === 0 ? color : s.id % 3 === 1 ? colorAlt : "rgba(255,255,255,0.7)",
          }}
          animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.2] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Left orb */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "25%", left: "-12%",
          width: 340, height: 340, borderRadius: "50%",
          background: `radial-gradient(circle, ${glowAlt} 0%, transparent 70%)`,
          filter: "blur(55px)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Right orb */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "55%", right: "-10%",
          width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* ── Top bar ── */}
      <div className="relative z-10 w-full max-w-md px-6 pt-14 pb-2 flex flex-col items-center gap-4">
        {/* Label */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
          <span
            className="text-[9px] tracking-[0.32em] uppercase font-mono font-bold"
            style={{ color: `${color}90` }}
          >
            System Calibration
          </span>
        </motion.div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {QUESTIONS.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                backgroundColor: i < currentIndex ? `${color}70` : i === currentIndex ? color : `${color}22`,
                border: `1px solid ${i === currentIndex ? color : `${color}30`}`,
              }}
              animate={{
                width:  i === currentIndex ? 22 : 6,
                height: 6,
                boxShadow: i === currentIndex ? `0 0 8px ${glow}` : "none",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          ))}
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="relative z-10 flex-1 w-full max-w-md px-5 flex flex-col justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -48 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="flex flex-col gap-5"
          >
            {/* Section label + number */}
            <div className="flex items-center justify-between">
              <span
                className="text-[9px] uppercase tracking-[0.24em] font-mono font-semibold px-2.5 py-1 rounded-full"
                style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
              >
                {q.sectionLabel}
              </span>
              <span className="text-[9px] font-mono" style={{ color: `${color}55` }}>
                {String(currentIndex + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}
              </span>
            </div>

            {/* Question text */}
            <h2
              className="text-xl font-bold leading-snug"
              style={{
                color: "#ffffff",
                fontFamily: "Inter, system-ui, sans-serif",
                textShadow: `0 0 32px ${glow}`,
                letterSpacing: "0.01em",
              }}
            >
              {q.prompt}
            </h2>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
              {q.options.map((opt, i) => {
                const isSelected = selectedValue === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + i * 0.07, duration: 0.28 }}
                    className="w-full rounded-xl text-left transition-all active:scale-[0.98]"
                    style={{
                      backgroundColor: isSelected ? `${color}1e` : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${isSelected ? color : `rgba(255,255,255,0.08)`}`,
                      padding: "14px 16px",
                      boxShadow: isSelected ? `0 0 16px ${glow}` : "none",
                    }}
                    data-testid={`calibration-option-${opt.value}`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                        style={{
                          border: `1.5px solid ${isSelected ? color : "rgba(255,255,255,0.2)"}`,
                          backgroundColor: isSelected ? color : "transparent",
                        }}
                        animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isSelected && (
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-white"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          />
                        )}
                      </motion.div>
                      <div>
                        <p
                          className="text-sm font-semibold leading-tight"
                          style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.75)" }}
                        >
                          {opt.label}
                        </p>
                        {opt.sub && (
                          <p
                            className="text-[11px] mt-0.5 leading-tight"
                            style={{ color: isSelected ? `${color}cc` : "rgba(255,255,255,0.28)" }}
                          >
                            {opt.sub}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom hint ── */}
      <div className="relative z-10 w-full max-w-md px-6 pb-10">
        <p
          className="text-center text-[10px] font-mono"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          Select to continue
        </p>
      </div>
    </motion.div>
  );
}

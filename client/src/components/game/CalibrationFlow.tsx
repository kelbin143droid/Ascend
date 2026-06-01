/**
 * CalibrationFlow.tsx
 * Lightweight System Sync questionnaire.
 * One focused question at a time keeps onboarding fast while still creating
 * a broad starting profile for the adaptive daily systems.
 */

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowLeft, ArrowRight, Brain, Check, Moon, Repeat2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { deriveCalibrationLevelFromScore, type CalibrationAnswers } from "@/lib/calibrationEngine";
import type { WorkoutLevel } from "@/lib/workoutPlans";

interface Props {
  gender: "male" | "female";
  onComplete: (answers: CalibrationAnswers) => void;
}

type CalibrationOption = {
  label: string;
  sub: string;
  value: number;
};

type CalibrationSection = {
  key: keyof CalibrationAnswers;
  label: string;
  stat: string;
  statColor: string;
  Icon: LucideIcon;
  prompt: string;
  options: CalibrationOption[];
};

const SECTIONS: CalibrationSection[] = [
  {
    key: "powerOutput",
    label: "Power Output",
    stat: "Strength",
    statColor: "#fbbf24",
    Icon: Activity,
    prompt: "How would you describe your current physical activity?",
    options: [
      { label: "Very Low", sub: "Mostly inactive right now", value: 15 },
      { label: "Light", sub: "Some walking or light movement", value: 40 },
      { label: "Moderate", sub: "Exercise a few days per week", value: 65 },
      { label: "Strong", sub: "Training feels normal for me", value: 90 },
    ],
  },
  {
    key: "recoveryRate",
    label: "Vitality Signal",
    stat: "Sleep",
    statColor: "#34d399",
    Icon: Moon,
    prompt: "How has your sleep been lately?",
    options: [
      { label: "Rough", sub: "I wake up tired most days", value: 15 },
      { label: "Light", sub: "Some rest, but inconsistent", value: 40 },
      { label: "Decent", sub: "Usually enough to function", value: 65 },
      { label: "Strong", sub: "I wake up recovered often", value: 90 },
    ],
  },
  {
    key: "signalStability",
    label: "Signal Stability",
    stat: "Sense",
    statColor: "#a78bfa",
    Icon: Brain,
    prompt: "How familiar are you with meditation or breathwork?",
    options: [
      { label: "New", sub: "I am just starting", value: 10 },
      { label: "Tried It", sub: "A few short sessions before", value: 35 },
      { label: "Familiar", sub: "I can settle in sometimes", value: 65 },
      { label: "Very Familiar", sub: "It is part of my routine", value: 90 },
    ],
  },
  {
    key: "syncRegularity",
    label: "Sync Regularity",
    stat: "Discipline",
    statColor: "#fb923c",
    Icon: Repeat2,
    prompt: "How consistent are your daily routines right now?",
    options: [
      { label: "Not Consistent", sub: "My days feel scattered", value: 10 },
      { label: "On And Off", sub: "I restart often", value: 35 },
      { label: "Mostly Consistent", sub: "Most days I show up", value: 65 },
      { label: "Very Consistent", sub: "I follow through reliably", value: 90 },
    ],
  },
];

const PROTOCOL_LABELS: Record<WorkoutLevel, string> = {
  entry: "FOUNDATION",
  beginner: "BUILD",
  intermediate: "EVOLVE",
  advanced: "ASCEND",
};

function protocolLabel(selections: Partial<Record<keyof CalibrationAnswers, number>>): string {
  const values = Object.values(selections).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return "PENDING";
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return PROTOCOL_LABELS[deriveCalibrationLevelFromScore(avg)];
}

export function CalibrationFlow({ gender, onComplete }: Props) {
  const isFemale = gender === "female";
  const color = isFemale ? "#d946ef" : "#22d3ee";
  const colorAlt = isFemale ? "#a78bfa" : "#67e8f9";
  const glow = isFemale ? "rgba(217,70,239,0.34)" : "rgba(34,211,238,0.34)";
  const panelGlow = isFemale ? "rgba(167,139,250,0.22)" : "rgba(103,232,249,0.22)";
  const bgGradient = isFemale
    ? "radial-gradient(circle at 18% 8%, rgba(217,70,239,0.18), transparent 30%), linear-gradient(145deg, #05000d 0%, #080218 48%, #02030b 100%)"
    : "radial-gradient(circle at 18% 8%, rgba(34,211,238,0.16), transparent 30%), linear-gradient(145deg, #020812 0%, #031520 48%, #02040b 100%)";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Partial<Record<keyof CalibrationAnswers, number>>>({});
  const [scanning, setScanning] = useState(false);
  const completing = useRef(false);

  const section = SECTIONS[currentIndex];
  const selected = selections[section.key];
  const selectedCount = Object.values(selections).filter((value) => typeof value === "number").length;
  const isLast = currentIndex === SECTIONS.length - 1;
  const allSelected = selectedCount === SECTIONS.length;
  const Icon = section.Icon;

  const handleSelect = (value: number) => {
    setSelections((prev) => ({ ...prev, [section.key]: value }));
  };

  const handleNext = () => {
    if (typeof selected !== "number" || scanning) return;
    if (!isLast) {
      setCurrentIndex((value) => Math.min(SECTIONS.length - 1, value + 1));
      return;
    }

    const answers = {
      ...selections,
      [section.key]: selected,
    };
    if (completing.current || !allSelected && Object.values(answers).filter((value) => typeof value === "number").length < SECTIONS.length) return;
    completing.current = true;
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      onComplete({
        powerOutput: answers.powerOutput ?? 50,
        recoveryRate: answers.recoveryRate ?? 50,
        signalStability: answers.signalStability ?? 50,
        syncRegularity: answers.syncRegularity ?? 50,
      });
    }, 720);
  };

  const handleBack = () => {
    if (currentIndex === 0 || scanning) return;
    setCurrentIndex((value) => Math.max(0, value - 1));
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden px-4 py-6 text-white"
      style={{ background: bgGradient, fontFamily: "Inter, system-ui, sans-serif" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <style>{`
        @keyframes syncShimmer {
          0% { transform: translateX(-130%) rotate(-18deg); }
          100% { transform: translateX(230%) rotate(-18deg); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(125,211,252,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.14) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-28 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

      <AnimatePresence>
        {scanning && (
          <motion.div
            className="fixed left-0 right-0 z-[200] h-0.5 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              boxShadow: `0 0 28px ${glow}`,
            }}
            initial={{ top: -4 }}
            animate={{ top: "100vh" }}
            transition={{ duration: 0.72, ease: "linear" }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[430px] flex-col">
        <header className="flex-shrink-0 pt-1 text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 16px ${glow}` }} />
            <p className="text-[11px] font-black uppercase tracking-[0.34em] text-cyan-100/70">
              System Sync · Calibration
            </p>
          </div>

          <div className="mx-auto mb-5 flex w-fit items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-cyan-100/24 bg-cyan-100/12 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md">
              {SECTIONS.map((item, index) => {
                const answered = typeof selections[item.key] === "number";
                const active = index === currentIndex;
                return (
                  <span
                    key={item.key}
                    className="h-2.5 w-2.5 rounded-full transition-all"
                    style={{
                      background: answered ? "#facc15" : active ? color : "rgba(255,255,255,0.22)",
                      boxShadow: answered || active ? `0 0 14px ${answered ? "rgba(250,204,21,0.55)" : glow}` : "none",
                      width: active ? 18 : 10,
                    }}
                  />
                );
              })}
              <span className="ml-1 text-[18px] font-black tabular-nums text-white">{selectedCount}/4</span>
            </div>
            <button
              type="button"
              onClick={handleBack}
              disabled={currentIndex === 0 || scanning}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-100/24 bg-white/[0.03] text-cyan-100/80 transition disabled:opacity-35"
              aria-label="Previous question"
            >
              <ArrowLeft size={18} />
            </button>
          </div>
        </header>

        <main className="relative z-10 min-h-0 flex-1 overflow-y-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AnimatePresence mode="wait">
            <motion.section
              key={section.key}
              className="relative overflow-hidden rounded-[28px] border border-cyan-100/22 bg-slate-200/[0.045] px-5 py-6 shadow-[0_26px_90px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md"
              initial={{ opacity: 0, x: 22 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/45 to-transparent" />
              <div className="pointer-events-none absolute inset-y-10 left-0 w-px bg-gradient-to-b from-transparent via-cyan-100/32 to-transparent" />
              <div className="pointer-events-none absolute inset-y-10 right-0 w-px bg-gradient-to-b from-transparent via-cyan-100/18 to-transparent" />

              <div className="mb-6 flex items-center gap-3">
                <Icon className="shrink-0 text-cyan-100" size={30} strokeWidth={2.4} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="text-[30px] font-black uppercase leading-none tracking-[0.02em] text-white">
                      {section.label}
                    </h2>
                    <span className="text-[22px] font-bold text-white/80">· {section.stat}</span>
                  </div>
                  <div className="mt-2 h-1 w-44 rounded-full" style={{ background: `linear-gradient(90deg, ${section.statColor}, ${colorAlt}, transparent)` }} />
                </div>
              </div>

              <p className="mb-7 text-[24px] font-semibold italic leading-tight text-white/82">
                {section.prompt}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {section.options.map((option) => {
                  const isSelected = selected === option.value;
                  return (
                    <motion.button
                      key={option.label}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      data-testid={`option-${section.key}-${option.value}`}
                      whileTap={{ scale: 0.97 }}
                      className="relative min-h-[178px] overflow-hidden rounded-[22px] p-4 text-left transition"
                      style={{
                        background: isSelected ? "rgba(250,204,21,0.10)" : "rgba(255,255,255,0.045)",
                        border: `1.5px solid ${isSelected ? "rgba(250,204,21,0.88)" : "rgba(125,211,252,0.46)"}`,
                        boxShadow: isSelected
                          ? "0 0 28px rgba(250,204,21,0.24), inset 0 1px 0 rgba(255,255,255,0.14)"
                          : `0 0 18px ${panelGlow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
                      }}
                    >
                      <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                      <span
                        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border"
                        style={{
                          borderColor: isSelected ? "rgba(250,204,21,0.92)" : "rgba(125,211,252,0.58)",
                          background: isSelected ? "rgba(250,204,21,0.88)" : "rgba(2,8,18,0.42)",
                          boxShadow: isSelected ? "0 0 22px rgba(250,204,21,0.46)" : `0 0 16px ${glow}`,
                        }}
                      >
                        {isSelected ? <Check size={19} className="text-slate-950" strokeWidth={3} /> : null}
                      </span>

                      <span className="relative block pr-10 text-[25px] font-black leading-tight text-white">
                        {option.label}
                      </span>
                      <span className="relative mt-4 block text-[18px] font-semibold leading-snug text-white/72">
                        {option.sub}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          </AnimatePresence>
        </main>

        <footer className="relative z-10 flex-shrink-0 pb-2 pt-3">
          <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-white/34">
            <span>{protocolLabel(selections)}</span>
            <span>Question {currentIndex + 1} / {SECTIONS.length}</span>
          </div>
          <motion.button
            type="button"
            onClick={handleNext}
            disabled={typeof selected !== "number" || scanning}
            data-testid="button-complete-sync"
            whileTap={{ scale: 0.98 }}
            className="group relative flex min-h-[62px] w-full items-center justify-center overflow-hidden rounded-[31px] border border-cyan-100/45 px-5 py-4 text-[12px] font-black uppercase tracking-[0.24em] text-white transition disabled:cursor-default disabled:opacity-45"
            style={{
              background: typeof selected === "number"
                ? `linear-gradient(90deg, ${color}26, rgba(250,204,21,0.18))`
                : "rgba(255,255,255,0.045)",
              boxShadow: typeof selected === "number"
                ? `0 0 34px ${glow}, inset 0 1px 0 rgba(255,255,255,0.16)`
                : "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <span className="pointer-events-none absolute inset-[7px] rounded-[24px] border border-cyan-100/18" />
            <span className="pointer-events-none absolute -left-24 top-0 h-full w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[syncShimmer_1.1s_ease-out]" />
            <span className="relative z-10 flex items-center gap-3">
              {isLast ? "Complete Sync" : "Continue"}
              <ArrowRight size={18} />
            </span>
          </motion.button>
        </footer>
      </div>
    </motion.div>
  );
}

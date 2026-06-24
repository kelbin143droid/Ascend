import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronLeft, X } from "lucide-react";
import {
  CORE_VARIATION_COPY,
  PLANK_VARIATION_COPY,
  PUSH_VARIATION_COPY,
  SQUAT_VARIATION_COPY,
  type CoreVariation,
  type ExerciseVariationCopy,
  type PhysicalCircuitStartingChoices,
  type PlankVariation,
  type PushVariation,
  type SquatVariation,
} from "@/lib/physicalCircuitProgressStore";

type SetupColors = {
  primary: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textMuted: string;
};

interface Props {
  colors: SetupColors;
  onComplete: (choices: PhysicalCircuitStartingChoices) => void;
  onClose?: () => void;
}

type SetupStep = "push" | "squat" | "core" | "plank";
const STEPS: SetupStep[] = ["push", "squat", "core", "plank"];

const STEP_COPY = {
  push: {
    eyebrow: "Upper body", title: "Choose your push-up",
    description: "Pick the version you can complete with clean, pain-free form.",
    values: ["wall", "knee", "standard"] as const, copy: PUSH_VARIATION_COPY,
  },
  squat: {
    eyebrow: "Lower body", title: "Choose your squat",
    description: "Use support if it helps you move with control and confidence.",
    values: ["chair", "supported", "standard"] as const, copy: SQUAT_VARIATION_COPY,
  },
  core: {
    eyebrow: "Core movement", title: "Choose your core exercise",
    description: "Start with the option that keeps your back and neck comfortable.",
    values: ["dead_bug", "crunch", "situp"] as const, copy: CORE_VARIATION_COPY,
  },
  plank: {
    eyebrow: "Core hold", title: "Choose your plank",
    description: "Choose a position you can hold while breathing normally.",
    values: ["wall", "knee", "standard"] as const, copy: PLANK_VARIATION_COPY,
  },
};

export function PhysicalCircuitSetupModal({ colors, onComplete, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [choices, setChoices] = useState<PhysicalCircuitStartingChoices>({
    pushVariation: "knee",
    squatVariation: "supported",
    coreVariation: "crunch",
    plankVariation: "knee",
  });
  const step = STEPS[stepIndex];
  const config = STEP_COPY[step] as {
    eyebrow: string;
    title: string;
    description: string;
    values: readonly string[];
    copy: Record<string, ExerciseVariationCopy>;
  };
  const selected =
    step === "push" ? choices.pushVariation :
    step === "squat" ? choices.squatVariation :
    step === "core" ? choices.coreVariation :
    choices.plankVariation;

  const choose = (value: string) => {
    const next = { ...choices };
    if (step === "push") next.pushVariation = value as Exclude<PushVariation, "tempo">;
    if (step === "squat") next.squatVariation = value as SquatVariation;
    if (step === "core") next.coreVariation = value as CoreVariation;
    if (step === "plank") next.plankVariation = value as PlankVariation;
    setChoices(next);
    if (stepIndex === STEPS.length - 1) onComplete(next);
    else setStepIndex((index) => index + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10020] flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
      data-testid="physical-circuit-setup-modal"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-md rounded-t-3xl px-5 pb-8 pt-5"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.surfaceBorder}` }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: colors.primary }}>
              Physical setup · {stepIndex + 1}/{STEPS.length}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: colors.textMuted }}>
              {config.eyebrow}
            </div>
            <h2 className="mt-1 text-xl font-black" style={{ color: colors.text }}>{config.title}</h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: colors.textMuted }}>{config.description}</p>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: `${colors.textMuted}15`, color: colors.textMuted }} aria-label="Close">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mb-4 flex gap-1.5" aria-hidden="true">
          {STEPS.map((item, index) => (
            <div key={item} className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: index <= stepIndex ? colors.primary : `${colors.textMuted}25` }} />
          ))}
        </div>

        <div className="space-y-2.5">
          {config.values.map((value) => {
            const copy = config.copy[value];
            const active = selected === value;
            return (
              <button key={value} type="button" onClick={() => choose(value)}
                className="flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: active ? `${colors.primary}18` : `${colors.primary}0b`,
                  border: `1.5px solid ${active ? `${colors.primary}70` : `${colors.primary}22`}`,
                }}
                data-testid={`button-physical-setup-${step}-${value}`}>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                  style={{ backgroundColor: active ? colors.primary : `${colors.primary}16`, color: active ? colors.surface : colors.primary }}>
                  {active ? <Check size={17} /> : <span className="text-xs font-black">{config.values.indexOf(value) + 1}</span>}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: colors.text }}>{copy.label}</div>
                  <div className="mt-0.5 text-[11px] leading-snug" style={{ color: colors.textMuted }}>{copy.formCue}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            disabled={stepIndex === 0} className="flex items-center gap-1 text-xs font-bold disabled:opacity-0"
            style={{ color: colors.textMuted }}>
            <ChevronLeft size={15} /> Back
          </button>
          <span className="text-[10px]" style={{ color: colors.textMuted }}>Same XP for every option</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

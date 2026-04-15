import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Target, TrendingUp, Shield, Zap, ChevronRight, ChevronLeft,
  ArrowRight, RotateCcw, Sparkles, CheckCircle2, X
} from "lucide-react";
import { markHabitsTutorialDone } from "@/lib/progressionService";

interface Props {
  onComplete: () => void;
}

const STEPS = [
  {
    id: "welcome",
    icon: Target,
    iconColor: "#a78bfa",
    title: "Habit System",
    subtitle: "Build intentionally",
    body: "Design the habits that shape who you're becoming. Every action you take consistently becomes part of your identity — and your stats.",
    coachNote: "Start small. One or two strong habits beats scattered effort. Let's walk through the system.",
    visual: "unlock",
  },
  {
    id: "habit-loop",
    icon: RotateCcw,
    iconColor: "#3b82f6",
    title: "The Habit Loop",
    subtitle: "How every habit works",
    body: "Every habit — good or bad — runs on the same four-part loop. Understanding this loop is how you rewire your brain deliberately.",
    coachNote: "The loop doesn't care if it's a good habit or bad one. Use this knowledge to your advantage.",
    visual: "loop",
  },
  {
    id: "build",
    icon: TrendingUp,
    iconColor: "#22c55e",
    title: "Building Good Habits",
    subtitle: "XP, stats, and progression",
    body: "Each habit you complete earns XP toward specific stats. Strength habits grow STR. Meditation grows SEN. Choose habits that match who you want to become.",
    coachNote: "Consistency with a few beats scattered effort across many.",
    visual: "stats",
  },
  {
    id: "break",
    icon: X,
    iconColor: "#ef4444",
    title: "Breaking Bad Habits",
    subtitle: "Replace, don't erase",
    body: "You can't remove a habit — you can only replace it. Identify the trigger and craving behind the pattern, then choose a healthier response that meets the same need.",
    coachNote: "Every day you avoid a bad habit builds a streak. The streak itself becomes a reward.",
    visual: "replace",
  },
  {
    id: "ready",
    icon: Sparkles,
    iconColor: "#a78bfa",
    title: "You're Ready",
    subtitle: "Build your first habit",
    body: "Head to the Build tab to create your first good habit. Then check out Break to start tracking a pattern you want to leave behind.",
    coachNote: "The system works when you do. Let's begin.",
    visual: "cta",
  },
];

function LoopVisual() {
  const nodes = [
    { label: "Cue", desc: "The trigger", color: "#3b82f6", angle: 0 },
    { label: "Craving", desc: "The desire", color: "#8b5cf6", angle: 90 },
    { label: "Response", desc: "The action", color: "#22c55e", angle: 180 },
    { label: "Reward", desc: "The payoff", color: "#f59e0b", angle: 270 },
  ];
  return (
    <div className="relative w-52 h-52 mx-auto" data-testid="visual-habit-loop">
      <div
        className="absolute inset-10 rounded-full"
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 30px rgba(59,130,246,0.08) inset",
        }}
      />
      {nodes.map((n) => {
        const rad = (n.angle - 90) * (Math.PI / 180);
        const r = 76;
        const cx = 104 + r * Math.cos(rad);
        const cy = 104 + r * Math.sin(rad);
        return (
          <div
            key={n.label}
            className="absolute flex flex-col items-center"
            style={{ left: cx - 24, top: cy - 22, width: 48 }}
          >
            <div
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${n.color}20`, color: n.color, border: `1px solid ${n.color}40` }}
            >
              {n.label}
            </div>
            <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{n.desc}</div>
          </div>
        );
      })}
      <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
        <RotateCcw size={20} style={{ color: "rgba(59,130,246,0.4)" }} />
      </div>
    </div>
  );
}

function StatsVisual() {
  const stats = [
    { label: "STR — Strength", color: "#ef4444", xp: 24, example: "Training, Push-ups" },
    { label: "SEN — Sense", color: "#8b5cf6", xp: 18, example: "Meditation, Focus" },
    { label: "AGI — Agility", color: "#22c55e", xp: 21, example: "Stretching, Yoga" },
    { label: "VIT — Vitality", color: "#f59e0b", xp: 30, example: "Sleep, Nutrition" },
  ];
  return (
    <div className="space-y-2 w-full max-w-xs mx-auto" data-testid="visual-stats">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <div className="w-24 text-right shrink-0">
            <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.label}</span>
          </div>
          <div className="flex-1 rounded-full overflow-hidden h-2" style={{ backgroundColor: `${s.color}18` }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${s.xp}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}60` }}
            />
          </div>
          <div className="text-[9px] w-10 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>+{s.xp} XP</div>
        </div>
      ))}
    </div>
  );
}

function ReplaceVisual() {
  return (
    <div className="flex items-center justify-center gap-4" data-testid="visual-replace">
      <div
        className="flex flex-col items-center gap-2 rounded-xl px-4 py-3"
        style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <X size={20} style={{ color: "#ef4444" }} />
        <div className="text-center">
          <p className="text-[9px] font-bold" style={{ color: "#ef4444" }}>Bad Pattern</p>
          <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Same trigger</p>
          <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.3)" }}>Same craving</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ArrowRight size={18} style={{ color: "rgba(255,255,255,0.3)" }} />
        <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>replace</span>
      </div>
      <div
        className="flex flex-col items-center gap-2 rounded-xl px-4 py-3"
        style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
      >
        <CheckCircle2 size={20} style={{ color: "#22c55e" }} />
        <div className="text-center">
          <p className="text-[9px] font-bold" style={{ color: "#22c55e" }}>New Response</p>
          <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Same trigger</p>
          <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.3)" }}>Same craving</p>
        </div>
      </div>
    </div>
  );
}

function UnlockVisual() {
  const statItems = [
    { label: "STR", color: "#ef4444" },
    { label: "AGI", color: "#22c55e" },
    { label: "VIT", color: "#f59e0b" },
    { label: "SEN", color: "#8b5cf6" },
  ];
  return (
    <div className="flex flex-col items-center gap-4" data-testid="visual-unlock">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          backgroundColor: "rgba(167,139,250,0.12)",
          border: "1px solid rgba(167,139,250,0.3)",
          boxShadow: "0 0 30px rgba(167,139,250,0.2)",
        }}
      >
        <Target size={28} style={{ color: "#a78bfa" }} />
      </motion.div>
      <div className="flex gap-2">
        {statItems.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="text-[9px] font-bold px-2 py-1 rounded-lg"
            style={{
              backgroundColor: `${s.color}15`,
              color: s.color,
              border: `1px solid ${s.color}30`,
            }}
          >
            {s.label}
          </motion.div>
        ))}
      </div>
      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
        Real habits → Real stats → Real growth
      </p>
    </div>
  );
}

function CtaVisual() {
  return (
    <div className="flex gap-3 justify-center" data-testid="visual-cta">
      {[
        { label: "Build", sublabel: "Good habits", color: "#22c55e", icon: TrendingUp },
        { label: "Break", sublabel: "Bad patterns", color: "#ef4444", icon: X },
      ].map(({ label, sublabel, color, icon: Icon }) => (
        <motion.div
          key={label}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: label === "Break" ? 0.1 : 0 }}
          className="flex flex-col items-center gap-2 rounded-xl px-5 py-4"
          style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25` }}
        >
          <Icon size={22} style={{ color }} />
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color }}>{label}</p>
            <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{sublabel}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function Day7HabitsTutorial({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      markHabitsTutorialDone();
      onComplete();
    }
  };

  const goPrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(5,7,15,0.97)", backdropFilter: "blur(8px)" }}
      data-testid="day7-habits-tutorial"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(167,139,250,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 90%)",
        }}
      />

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  backgroundColor: i === step
                    ? current.iconColor
                    : i < step
                    ? `${current.iconColor}50`
                    : "rgba(255,255,255,0.1)",
                }}
                data-testid={`tutorial-step-dot-${i}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            {step + 1} / {STEPS.length}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${current.iconColor}18`,
                    border: `1px solid ${current.iconColor}35`,
                    boxShadow: `0 0 20px ${current.iconColor}20`,
                  }}
                >
                  <Icon size={22} style={{ color: current.iconColor }} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.15em] font-bold mb-0.5" style={{ color: `${current.iconColor}90` }}>
                    {current.subtitle}
                  </p>
                  <h2 className="text-lg font-bold leading-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
                    {current.title}
                  </h2>
                </div>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                {current.body}
              </p>

              <div className="my-2">
                {current.visual === "unlock" && <UnlockVisual />}
                {current.visual === "loop" && <LoopVisual />}
                {current.visual === "stats" && <StatsVisual />}
                {current.visual === "replace" && <ReplaceVisual />}
                {current.visual === "cta" && <CtaVisual />}
              </div>

              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}
                data-testid="coach-bubble"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(167,139,250,0.18)", border: "1px solid rgba(167,139,250,0.25)" }}
                >
                  <Brain size={12} style={{ color: "#a78bfa" }} />
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {current.coachNote}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={goPrev}
              className="px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.45)",
              }}
              data-testid="button-tutorial-prev"
            >
              <ChevronLeft size={15} />
              Back
            </button>
          )}
          <button
            onClick={goNext}
            className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              backgroundColor: current.iconColor,
              color: "#05070f",
              boxShadow: `0 0 24px ${current.iconColor}40`,
            }}
            data-testid="button-tutorial-next"
          >
            {step === STEPS.length - 1 ? (
              <>Enter Habits <ChevronRight size={15} /></>
            ) : (
              <>Next <ChevronRight size={15} /></>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

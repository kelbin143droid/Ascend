import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Target, Brain, X } from "lucide-react";

const TUTORIAL_KEY = "ascend_app_tutorial_seen";

const STEPS = [
  {
    icon: Home,
    color: "#0ea5e9",
    tab: "HOME",
    tabIndex: 0,
    title: "Mission Control",
    desc: "Your daily hub. Launch your flow sessions, track XP, and see your progress each day.",
  },
  {
    icon: Target,
    color: "#22c55e",
    tab: "HABITS",
    tabIndex: 2,
    title: "Habit System",
    desc: "Build powerful habits and break bad ones. Each habit trains a stat and earns XP.",
  },
  {
    icon: Brain,
    color: "#a855f7",
    tab: "COACH",
    tabIndex: 3,
    title: "AI Coach",
    desc: "Your personal guide. Ask anything — get insights, strategies, and daily motivation.",
  },
  {
    icon: User,
    color: "#f59e0b",
    tab: "PROFILE",
    tabIndex: 1,
    title: "Your Stats",
    desc: "Track your level, XP, HP & MP bars, and stat points. Allocate points to grow stronger.",
  },
];

export function AppTutorialOverlay() {
  const [visible, setVisible] = useState(
    () => localStorage.getItem(TUTORIAL_KEY) !== "1"
  );
  const [step, setStep] = useState(0);

  const dismiss = () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  // 4 equal tabs across the bottom nav, highlight position
  const tabXPercents = [12.5, 37.5, 62.5, 87.5];
  const tabX = tabXPercents[current.tabIndex];

  return (
    <div className="fixed inset-0 z-[200]" style={{ pointerEvents: "all" }}>
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={dismiss}
      />

      {/* Floating tutorial card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: "90px", width: "min(320px, calc(100vw - 32px))" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
        >
          {/* Card */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "rgba(6,6,18,0.97)",
              border: `1px solid ${current.color}45`,
              boxShadow: `0 0 48px ${current.color}18, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${current.color}18`,
                    border: `1px solid ${current.color}35`,
                  }}
                >
                  <Icon size={16} style={{ color: current.color }} />
                </div>
                <div>
                  <p
                    className="text-[9px] uppercase tracking-[0.2em] font-bold mb-0.5"
                    style={{ color: current.color }}
                  >
                    {current.tab}
                  </p>
                  <p
                    className="text-sm font-bold leading-tight"
                    style={{ color: "#f0f0ff", fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {current.title}
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg shrink-0"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                <X size={14} />
              </button>
            </div>

            <p
              className="text-xs leading-relaxed mb-4"
              style={{ color: "rgba(255,255,255,0.55)", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {current.desc}
            </p>

            {/* Progress dots + button */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 items-center">
                {STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    animate={{
                      width: i === step ? 18 : 6,
                      backgroundColor: i === step ? current.color : "rgba(255,255,255,0.15)",
                    }}
                    transition={{ duration: 0.25 }}
                    style={{ height: 6 }}
                  />
                ))}
              </div>
              <motion.button
                onClick={next}
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{
                  backgroundColor: current.color,
                  color: "#000",
                  letterSpacing: "0.06em",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
                whileTap={{ scale: 0.96 }}
              >
                {step < STEPS.length - 1 ? "NEXT →" : "DONE ✓"}
              </motion.button>
            </div>
          </div>

          {/* Arrow pointing down to nav */}
          <div className="flex justify-center mt-1">
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
                <path d="M9 11 L0 0 L18 0 Z" fill={current.color} opacity="0.65" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Tab highlight ring */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="absolute"
          style={{
            bottom: 6,
            left: `calc(${tabX}% - 30px)`,
            width: 60,
            height: 58,
            borderRadius: 14,
            border: `2px solid ${current.color}`,
            boxShadow: `0 0 18px ${current.color}55, inset 0 0 18px ${current.color}12`,
            pointerEvents: "none",
          }}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.75 }}
          transition={{ duration: 0.28 }}
        />
      </AnimatePresence>
    </div>
  );
}

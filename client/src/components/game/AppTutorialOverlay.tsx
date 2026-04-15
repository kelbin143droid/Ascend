import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, User, Target, Brain, X,
  BarChart3, BookOpen, Trophy, Clock, Gamepad2, Menu,
} from "lucide-react";

const TUTORIAL_KEY = "ascend_app_tutorial_seen";

type StepType = "nav" | "sidebar";

interface Step {
  type: StepType;
  icon: any;
  color: string;
  sectionLabel: string;
  title: string;
  desc: string;
  tabIndex?: number;
}

const STEPS: Step[] = [
  {
    type: "nav",
    icon: Home,
    color: "#0ea5e9",
    sectionLabel: "HOME",
    tabIndex: 0,
    title: "Mission Control",
    desc: "Your daily hub. Launch your flow sessions, track XP, and see your progress each day.",
  },
  {
    type: "nav",
    icon: Target,
    color: "#22c55e",
    sectionLabel: "HABITS",
    tabIndex: 2,
    title: "Habit System",
    desc: "Build powerful habits and break bad ones. Each habit trains a stat and earns XP.",
  },
  {
    type: "nav",
    icon: Brain,
    color: "#a855f7",
    sectionLabel: "COACH",
    tabIndex: 3,
    title: "AI Coach",
    desc: "Your personal guide. Ask anything — get insights, strategies, and daily motivation.",
  },
  {
    type: "nav",
    icon: User,
    color: "#f59e0b",
    sectionLabel: "PROFILE",
    tabIndex: 1,
    title: "Your Stats",
    desc: "Track your level, XP, HP & MP bars, and stat points. Allocate points to grow stronger.",
  },
  {
    type: "sidebar",
    icon: Menu,
    color: "#e2e8f0",
    sectionLabel: "MENU",
    title: "Sidebar Menu",
    desc: "Tap the ☰ icon in the top-left corner to open the Ascend OS navigation panel and explore powerful extra tools.",
  },
  {
    type: "sidebar",
    icon: BarChart3,
    color: "#38bdf8",
    sectionLabel: "ANALYTICS",
    title: "Analytics",
    desc: "Track your performance over time. View weekly charts, habit streaks, XP growth, and trends across every stat.",
  },
  {
    type: "sidebar",
    icon: BookOpen,
    color: "#34d399",
    sectionLabel: "LIBRARY",
    title: "Library",
    desc: "Browse habit guides, workout routines, and wellness templates curated to support every stage of your journey.",
  },
  {
    type: "sidebar",
    icon: Trophy,
    color: "#fbbf24",
    sectionLabel: "ACHIEVEMENTS",
    title: "Achievements",
    desc: "Your trophy room. Earn badges and unlock milestones as you build consistency and reach new levels.",
  },
  {
    type: "sidebar",
    icon: Clock,
    color: "#c084fc",
    sectionLabel: "SECTOGRAPH",
    title: "Sectograph",
    desc: "Your visual daily clock. Schedule habits and plan your entire day hour-by-hour in a radial time view.",
  },
  {
    type: "sidebar",
    icon: Gamepad2,
    color: "#22d3ee",
    sectionLabel: "FUTURE GAME",
    title: "Future Game",
    desc: "Your RPG character is powered by real-life actions:\n• STR (Strength) — grows from physical training\n• AGI (Agility) — grows from movement & flexibility\n• VIT (Vitality) — grows from sleep & wellness habits\n• SEN (Sense) — grows from meditation & focus\n\nComplete daily habits to level up your stats and unlock the full game experience.",
  },
];

const NAV_TAB_CENTERS = [12.5, 37.5, 62.5, 87.5];

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
  const isSidebar = current.type === "sidebar";

  const tabX = !isSidebar && current.tabIndex !== undefined
    ? NAV_TAB_CENTERS[current.tabIndex]
    : 0;

  return (
    <div className="fixed inset-0 z-[200]" style={{ pointerEvents: "all" }}>
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.82)", backdropFilter: "blur(3px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={dismiss}
      />

      {/* ── SIDEBAR BUTTON RING (for sidebar steps) ── */}
      {isSidebar && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`ring-${step}`}
            className="absolute"
            style={{
              top: 10,
              left: 10,
              width: 54,
              height: 54,
              borderRadius: 12,
              border: `2px solid ${current.color}`,
              boxShadow: `0 0 20px ${current.color}55, inset 0 0 16px ${current.color}12`,
              pointerEvents: "none",
            }}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.28 }}
          />
        </AnimatePresence>
      )}

      {/* ── NAV TAB RING (for nav steps) ── */}
      {!isSidebar && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`ring-${step}`}
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
      )}

      {/* ── TUTORIAL CARD ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="absolute left-1/2 -translate-x-1/2"
          style={
            isSidebar
              ? { top: "50%", transform: "translate(-50%, -50%)", width: "min(340px, calc(100vw - 32px))" }
              : { bottom: "90px", width: "min(320px, calc(100vw - 32px))" }
          }
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
        >
          {/* Sidebar connector line pointing to top-left menu button */}
          {isSidebar && (
            <div
              className="flex items-center gap-1.5 mb-2 pl-1"
              style={{ color: `${current.color}80` }}
            >
              <motion.div
                animate={{ x: [0, -3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ fontSize: 10, fontFamily: "monospace" }}
              >
                ↖ tap the ☰ icon
              </motion.div>
            </div>
          )}

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
                    {current.sectionLabel}
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
              className="text-xs leading-relaxed mb-4 whitespace-pre-line"
              style={{ color: "rgba(255,255,255,0.55)", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {current.desc}
            </p>

            {/* Progress dots + button */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 items-center flex-wrap" style={{ maxWidth: "60%" }}>
                {STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    animate={{
                      width: i === step ? 14 : 5,
                      backgroundColor: i === step ? current.color : "rgba(255,255,255,0.15)",
                    }}
                    transition={{ duration: 0.25 }}
                    style={{ height: 5 }}
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

          {/* Arrow for nav steps (points down to nav tab) */}
          {!isSidebar && (
            <div className="flex justify-center mt-1" style={{ marginLeft: `calc(${tabX}% - 50%)` }}>
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
                  <path d="M9 11 L0 0 L18 0 Z" fill={current.color} opacity="0.65" />
                </svg>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

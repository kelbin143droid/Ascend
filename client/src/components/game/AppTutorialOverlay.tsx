import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, User, Target, Brain, X,
  BarChart3, BookOpen, Trophy, Clock, Gamepad2, Menu, ChevronRight,
} from "lucide-react";

const TUTORIAL_KEY = "ascend_app_tutorial_seen";

type StepKind = "nav" | "sidebar-intro" | "sidebar-item";

interface BaseStep {
  kind: StepKind;
  icon: any;
  color: string;
  sectionLabel: string;
  title: string;
  desc: string;
}

interface NavStep extends BaseStep { kind: "nav"; tabIndex: number; }
interface SidebarIntroStep extends BaseStep { kind: "sidebar-intro"; }
interface SidebarItemStep extends BaseStep { kind: "sidebar-item"; itemIndex: number; }

type Step = NavStep | SidebarIntroStep | SidebarItemStep;

const SIDEBAR_ITEMS = [
  { icon: BarChart3, color: "#38bdf8", label: "Analytics" },
  { icon: BookOpen, color: "#34d399", label: "Library" },
  { icon: Trophy, color: "#fbbf24", label: "Achievements" },
  { icon: Clock, color: "#c084fc", label: "Sectograph" },
  { icon: Gamepad2, color: "#22d3ee", label: "Future Game" },
];

const STEPS: Step[] = [
  {
    kind: "nav", tabIndex: 0,
    icon: Home, color: "#0ea5e9", sectionLabel: "HOME", title: "Mission Control",
    desc: "Your daily hub. Launch your flow sessions, track XP, and see your progress each day.",
  },
  {
    kind: "nav", tabIndex: 2,
    icon: Target, color: "#22c55e", sectionLabel: "HABITS", title: "Habit System",
    desc: "Build powerful habits and break bad ones. Each habit trains a real-life stat and earns XP.",
  },
  {
    kind: "nav", tabIndex: 3,
    icon: Brain, color: "#a855f7", sectionLabel: "COACH", title: "AI Coach",
    desc: "Your personal guide. Ask anything — get insights, strategies, and daily motivation.",
  },
  {
    kind: "nav", tabIndex: 1,
    icon: User, color: "#f59e0b", sectionLabel: "PROFILE", title: "Your Progress",
    desc: "Track your level, XP bar, current phase, and journey history.",
  },
  {
    kind: "sidebar-intro",
    icon: Menu, color: "#e2e8f0", sectionLabel: "MENU", title: "Full Navigation",
    desc: "Tap the ☰ icon in the top-left to open the full navigation panel. Here's what's inside:",
  },
  {
    kind: "sidebar-item", itemIndex: 0,
    icon: BarChart3, color: "#38bdf8", sectionLabel: "ANALYTICS", title: "Analytics",
    desc: "Track your performance over time — weekly charts, habit streaks, XP growth, and trends across every stat.",
  },
  {
    kind: "sidebar-item", itemIndex: 1,
    icon: BookOpen, color: "#34d399", sectionLabel: "LIBRARY", title: "Library",
    desc: "Browse habit guides, workout routines, and wellness templates curated for your journey.",
  },
  {
    kind: "sidebar-item", itemIndex: 2,
    icon: Trophy, color: "#fbbf24", sectionLabel: "ACHIEVEMENTS", title: "Achievements",
    desc: "Your trophy room. Earn badges and unlock milestones as you build consistency and reach new levels.",
  },
  {
    kind: "sidebar-item", itemIndex: 3,
    icon: Clock, color: "#c084fc", sectionLabel: "SECTOGRAPH", title: "Sectograph",
    desc: "Your visual daily clock. Schedule habits and plan your entire day hour-by-hour in a radial time view.",
  },
  {
    kind: "sidebar-item", itemIndex: 4,
    icon: Gamepad2, color: "#22d3ee", sectionLabel: "FUTURE GAME", title: "Future Game",
    desc: "Your RPG character is powered by real actions.\n• STR grows from training\n• AGI grows from movement\n• VIT grows from sleep & wellness\n• SEN grows from meditation\n\nComplete daily habits → power up your character.",
  },
];

const NAV_TAB_CENTERS = [12.5, 37.5, 62.5, 87.5];
const SIDEBAR_INTRO_INDEX = 4;

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

  useEffect(() => {
    return () => { /* cleanup if needed */ };
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isNav = current.kind === "nav";
  const isSidebarIntro = current.kind === "sidebar-intro";
  const isSidebarItem = current.kind === "sidebar-item";
  const isAnyCard = isNav || isSidebarIntro || isSidebarItem;

  const tabX = isNav ? NAV_TAB_CENTERS[(current as NavStep).tabIndex] : 0;
  const activeItemIndex = isSidebarItem ? (current as SidebarItemStep).itemIndex : -1;

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{ pointerEvents: "all" }}
      data-tutorial-active="1"
    >
      {/* ── FULL DARK BACKDROP ── */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.84)", backdropFilter: "blur(3px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={dismiss}
      />

      {/* ── NAV TAB RING — glowing highlight ── */}
      {isNav && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`ring-nav-${step}`}
            className="absolute pointer-events-none"
            style={{
              bottom: 4,
              left: `calc(${tabX}% - 34px)`,
              width: 68,
              height: 62,
              borderRadius: 16,
              border: `2px solid ${current.color}`,
              boxShadow: `0 0 28px ${current.color}80, 0 0 14px ${current.color}50, inset 0 0 20px ${current.color}20`,
              backgroundColor: `${current.color}08`,
            }}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: [1, 0.75, 1], scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              scale: { duration: 0.28 },
              opacity: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        </AnimatePresence>
      )}

      {/* ── NAV TAB ARROW — bounces directly above the active tab ── */}
      {isNav && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`arrow-nav-${step}`}
            className="absolute pointer-events-none"
            style={{
              bottom: 70,
              left: `${tabX}%`,
              transform: "translateX(-50%)",
            }}
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
              <path d="M12 14 L0 0 L24 0 Z" fill={current.color} opacity="0.95" />
            </svg>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── SIDEBAR BUTTON RING + ARROW (sidebar-intro step only) ── */}
      {isSidebarIntro && (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key="ring-sidebar-btn"
              className="absolute pointer-events-none"
              style={{
                top: 10, left: 10,
                width: 54, height: 54,
                borderRadius: 12,
                border: `2px solid ${current.color}`,
                boxShadow: `0 0 24px ${current.color}60, inset 0 0 14px ${current.color}12`,
              }}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: [1, 0.6, 1], scale: 1 }}
              transition={{
                scale: { duration: 0.28 },
                opacity: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          </AnimatePresence>
          <motion.div
            className="absolute pointer-events-none"
            style={{ top: "28%", left: "22%" }}
            animate={{ x: [-5, 3, -5], y: [-5, 3, -5] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M4 4 L32 4 L4 32 Z" fill={current.color} opacity="0.55" />
              <path d="M8 8 L28 8 L8 28 Z" fill={current.color} opacity="0.25" />
            </svg>
          </motion.div>
        </>
      )}

      {/* ── TUTORIAL CARD (all step types, always centered) ── */}
      {isAnyCard && (
        <div
          className="absolute"
          style={{
            bottom: isNav ? "96px" : "auto",
            top: (isSidebarIntro || isSidebarItem) ? "50%" : "auto",
            left: "50%",
            transform: (isSidebarIntro || isSidebarItem)
              ? "translate(-50%, -50%)"
              : "translateX(-50%)",
            width: "min(340px, calc(100vw - 32px))",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <div
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: "rgba(6,6,18,0.97)",
                  border: `1px solid ${current.color}45`,
                  boxShadow: `0 0 44px ${current.color}18, 0 8px 32px rgba(0,0,0,0.65)`,
                }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${current.color}18`,
                        border: `1px solid ${current.color}35`,
                      }}
                    >
                      <Icon size={15} style={{ color: current.color }} />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-0.5" style={{ color: current.color }}>
                        {current.sectionLabel}
                      </p>
                      <p className="text-sm font-bold leading-tight" style={{ color: "#f0f0ff" }}>
                        {current.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={dismiss}
                    className="p-1.5 rounded-lg shrink-0"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                    data-testid="button-tutorial-dismiss"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Sidebar-item: mini sidebar preview list */}
                {(isSidebarItem || isSidebarIntro) && (
                  <div
                    className="rounded-xl overflow-hidden mb-3"
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: "rgba(0,0,0,0.35)",
                    }}
                  >
                    {SIDEBAR_ITEMS.map((item, i) => {
                      const SIcon = item.icon;
                      const isActive = i === activeItemIndex;
                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-2.5 px-3 py-2.5"
                          style={{
                            backgroundColor: isActive ? `${item.color}18` : "transparent",
                            borderBottom: i < SIDEBAR_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            transition: "background-color 0.2s",
                          }}
                        >
                          <SIcon
                            size={14}
                            style={{ color: isActive ? item.color : "rgba(255,255,255,0.22)" }}
                          />
                          <span
                            className="text-xs font-medium flex-1"
                            style={{ color: isActive ? item.color : "rgba(255,255,255,0.28)" }}
                          >
                            {item.label}
                          </span>
                          {isActive && (
                            <motion.div
                              animate={{ x: [0, -3, 0] }}
                              transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <ChevronRight size={12} style={{ color: item.color, opacity: 0.8 }} />
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Description */}
                <p
                  className="text-xs leading-relaxed mb-3 whitespace-pre-line"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  {current.desc}
                </p>

                {/* Progress dots + NEXT button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1 items-center flex-wrap flex-1">
                    {STEPS.map((_, i) => (
                      <motion.div
                        key={i}
                        className="rounded-full"
                        animate={{
                          width: i === step ? 12 : 4,
                          backgroundColor:
                            i === step
                              ? current.color
                              : i < step
                              ? `${current.color}55`
                              : "rgba(255,255,255,0.12)",
                        }}
                        transition={{ duration: 0.22 }}
                        style={{ height: 4, flexShrink: 0 }}
                      />
                    ))}
                  </div>
                  <motion.button
                    onClick={next}
                    className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0"
                    style={{
                      backgroundColor: current.color,
                      color: "#000",
                      letterSpacing: "0.06em",
                    }}
                    whileTap={{ scale: 0.96 }}
                    data-testid="button-tutorial-next"
                  >
                    {step < STEPS.length - 1 ? "NEXT →" : "DONE ✓"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

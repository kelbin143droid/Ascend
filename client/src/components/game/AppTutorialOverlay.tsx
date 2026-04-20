import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, User, Target, Brain, X, Heart, Zap,
  BarChart3, BookOpen, Trophy, Clock, Gamepad2, Menu,
} from "lucide-react";
import { getHPColor, getManaColor, MANA_MAX } from "@/lib/statsSystem";

const TUTORIAL_KEY = "ascend_app_tutorial_seen";

type StepKind = "nav" | "sidebar-intro" | "sidebar-item" | "home-intro";

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
interface SidebarItemStep extends BaseStep { kind: "sidebar-item"; itemIndex: number; testId: string; }
interface HomeIntroStep extends BaseStep { kind: "home-intro"; targetTestId?: string; }

type Step = NavStep | SidebarIntroStep | SidebarItemStep | HomeIntroStep;

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
    desc: "The ☰ menu at the top-left opens your full navigation panel. Tap NEXT to see what's inside.",
  },
  {
    kind: "sidebar-item", itemIndex: 0, testId: "sidebar-analytics",
    icon: BarChart3, color: "#38bdf8", sectionLabel: "ANALYTICS", title: "Analytics",
    desc: "Track your performance over time — weekly charts, habit streaks, XP growth, and trends across every stat.",
  },
  {
    kind: "sidebar-item", itemIndex: 1, testId: "sidebar-library",
    icon: BookOpen, color: "#34d399", sectionLabel: "LIBRARY", title: "Library",
    desc: "Browse habit guides, workout routines, and wellness templates curated for your journey.",
  },
  {
    kind: "sidebar-item", itemIndex: 2, testId: "sidebar-achievements",
    icon: Trophy, color: "#fbbf24", sectionLabel: "ACHIEVEMENTS", title: "Achievements",
    desc: "Your trophy room. Earn badges and unlock milestones as you build consistency and reach new levels.",
  },
  {
    kind: "sidebar-item", itemIndex: 3, testId: "sidebar-sectograph",
    icon: Clock, color: "#c084fc", sectionLabel: "SECTOGRAPH", title: "Sectograph",
    desc: "A circular time wheel for your day.\n\n→ Drag habits onto time slots\n→ Spot gaps and overlaps instantly\n→ Plan around your energy peaks",
  },
  {
    kind: "sidebar-item", itemIndex: 4, testId: "sidebar-future-game",
    icon: Gamepad2, color: "#22d3ee", sectionLabel: "FUTURE GAME", title: "Future Game",
    desc: "Your RPG character is powered by real actions.\n• STR grows from training\n• AGI grows from movement\n• VIT grows from sleep & wellness\n• SEN grows from meditation\n\nComplete daily habits → power up your character.",
  },
  {
    kind: "home-intro", targetTestId: "button-begin-flow",
    icon: Home, color: "#0ea5e9", sectionLabel: "DAILY FLOW", title: "Begin Daily Flow",
    desc: "Tap this to start your guided daily session — sleep check, vitality, breathwork, training, and reflection in one flow.",
  },
  {
    kind: "home-intro", targetTestId: "stat-bars-card",
    icon: Heart, color: "#22c55e", sectionLabel: "HP & MANA", title: "Vitality & Meditation",
    desc: "HP = physical vitality. Refills with sleep, food, and movement.\n\nMP = mental focus. Refills with meditation and breathwork.\n\nKeep both full — they power your RPG stats.",
  },
];

const NAV_TAB_CENTERS = [12.5, 37.5, 62.5, 87.5];

const SIDEBAR_W = 288;
const ITEM_H_FALLBACK = 48;

function dispatchSidebarOpen() {
  window.dispatchEvent(new CustomEvent("ascend:tutorial-sidebar-open"));
}
function dispatchSidebarClose() {
  window.dispatchEvent(new CustomEvent("ascend:tutorial-sidebar-close"));
}

export function AppTutorialOverlay() {
  const [visible, setVisible] = useState(
    () => localStorage.getItem(TUTORIAL_KEY) !== "1"
  );
  const [step, setStep] = useState(0);
  const [itemRect, setItemRect] = useState<{ top: number; height: number } | null>(null);
  const [homeRect, setHomeRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const cur = STEPS[step];
    if (cur.kind === "sidebar-item") {
      let cancelled = false;
      const measure = () => {
        const el = document.querySelector<HTMLElement>(`[data-testid="${(cur as SidebarItemStep).testId}"]`);
        if (el && !cancelled) {
          const r = el.getBoundingClientRect();
          setItemRect({ top: r.top, height: r.height });
        }
      };
      const t1 = setTimeout(measure, 50);
      const t2 = setTimeout(measure, 350);
      window.addEventListener("resize", measure);
      return () => {
        cancelled = true;
        clearTimeout(t1);
        clearTimeout(t2);
        window.removeEventListener("resize", measure);
      };
    }
    setItemRect(null);

    if (cur.kind === "home-intro" && (cur as HomeIntroStep).targetTestId) {
      const targetId = (cur as HomeIntroStep).targetTestId!;
      let cancelled = false;
      const measure = () => {
        const el = document.querySelector<HTMLElement>(`[data-testid="${targetId}"]`);
        if (el && !cancelled) {
          // Bring target into view if it's off-screen so the pointer makes sense.
          const r0 = el.getBoundingClientRect();
          if (r0.top < 16 || r0.bottom > window.innerHeight - 16) {
            try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
          }
          // Re-measure after potential scroll.
          requestAnimationFrame(() => {
            if (cancelled) return;
            const r = el.getBoundingClientRect();
            setHomeRect({ top: r.top, left: r.left, width: r.width, height: r.height });
          });
        }
      };
      const t1 = setTimeout(measure, 60);
      const t2 = setTimeout(measure, 380);
      const t3 = setTimeout(measure, 750);
      window.addEventListener("resize", measure);
      window.addEventListener("scroll", measure, true);
      return () => {
        cancelled = true;
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure, true);
      };
    }
    setHomeRect(null);
  }, [step, visible]);

  const dismiss = () => {
    const cur = STEPS[step];
    if (cur.kind === "sidebar-item" || cur.kind === "sidebar-intro") {
      dispatchSidebarClose();
    }
    localStorage.setItem(TUTORIAL_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    const cur = STEPS[step];
    if (!cur) {
      try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch {}
      setVisible(false);
      return;
    }
    if (step < STEPS.length - 1) {
      const nextKind = STEPS[step + 1].kind;
      if (cur.kind === "sidebar-intro") {
        dispatchSidebarOpen();
      }
      if (cur.kind === "sidebar-item" && nextKind === "home-intro") {
        dispatchSidebarClose();
      }
      setStep((s) => s + 1);
    } else {
      if (cur.kind === "sidebar-item" || cur.kind === "sidebar-intro") {
        dispatchSidebarClose();
      }
      localStorage.setItem(TUTORIAL_KEY, "1");
      setVisible(false);
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  if (!current) {
    // Step index drifted past the end (stale state after STEPS changed). Bail
    // out gracefully instead of crashing the whole app.
    if (typeof window !== "undefined") {
      try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch {}
    }
    return null;
  }
  const Icon = current.icon;
  const isNav = current.kind === "nav";
  const isSidebarIntro = current.kind === "sidebar-intro";
  const isSidebarItem = current.kind === "sidebar-item";
  const isHomeIntro = current.kind === "home-intro";

  const tabX = isNav ? NAV_TAB_CENTERS[(current as NavStep).tabIndex] : 0;
  const activeItemIndex = isSidebarItem ? (current as SidebarItemStep).itemIndex : -1;
  const itemY = isSidebarItem ? (itemRect?.top ?? 0) : 0;
  const itemH = isSidebarItem ? (itemRect?.height ?? ITEM_H_FALLBACK) : ITEM_H_FALLBACK;

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{ pointerEvents: "all" }}
      data-tutorial-active="1"
    >
      {/* ── FULL BACKDROP for non-sidebar-item, non-nav, non-home-target steps ── */}
      {!isSidebarItem && !isNav && !(isHomeIntro && homeRect) && (
        <motion.div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* ── HOME-INTRO SPOTLIGHT — cutout dim around target, target stays visible ── */}
      {isHomeIntro && homeRect && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`spotlight-home-${step}`}
            className="absolute pointer-events-none"
            style={{
              top: homeRect.top - 8,
              left: homeRect.left - 8,
              width: homeRect.width + 16,
              height: homeRect.height + 16,
              borderRadius: 14,
              border: `2px solid ${current.color}`,
              backgroundColor: "transparent",
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.62), 0 0 32px ${current.color}70, inset 0 0 18px ${current.color}22`,
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          />
        </AnimatePresence>
      )}

      {/* ── HOME-INTRO ARROW — points at target from card side ── */}
      {isHomeIntro && homeRect && (() => {
        const cardOnTop = homeRect.top > window.innerHeight / 2;
        const arrowTop = cardOnTop ? homeRect.top - 34 : homeRect.top + homeRect.height + 12;
        const arrowLeft = homeRect.left + homeRect.width / 2;
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key={`arrow-home-${step}`}
              className="absolute pointer-events-none"
              style={{
                top: arrowTop,
                left: arrowLeft,
                transform: "translateX(-50%)",
              }}
              animate={{ y: cardOnTop ? [0, 7, 0] : [0, -7, 0] }}
              transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="26" height="18" viewBox="0 0 26 18" fill="none" style={{ filter: `drop-shadow(0 0 6px ${current.color}aa)` }}>
                {cardOnTop ? (
                  <path d="M13 18 L0 0 L26 0 Z" fill={current.color} />
                ) : (
                  <path d="M13 0 L0 18 L26 18 Z" fill={current.color} />
                )}
              </svg>
            </motion.div>
          </AnimatePresence>
        );
      })()}

      {/* ── NAV-STEP BACKDROP — dims everything except the active tab ── */}
      {isNav && (
        <>
          {/* Above the nav bar */}
          <motion.div
            className="absolute"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 64,
              backgroundColor: "rgba(0,0,0,0.82)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          {/* Nav bar, left of active tab */}
          <motion.div
            className="absolute"
            style={{
              bottom: 0,
              left: 0,
              width: `${Math.max(0, tabX - 12.5)}%`,
              height: 64,
              backgroundColor: "rgba(0,0,0,0.82)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          {/* Nav bar, right of active tab */}
          <motion.div
            className="absolute"
            style={{
              bottom: 0,
              left: `${tabX + 12.5}%`,
              right: 0,
              height: 64,
              backgroundColor: "rgba(0,0,0,0.82)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        </>
      )}

      {/* ── NAV TAB SPOTLIGHT — covers exact tab area, dims everything else ── */}
      {isNav && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`spotlight-nav-${step}`}
            className="absolute pointer-events-none"
            style={{
              bottom: 0,
              left: `${tabX - 12.5}%`,
              width: "25%",
              height: 64,
              borderRadius: 8,
              border: `2px solid ${current.color}`,
              backgroundColor: "transparent",
              boxShadow: `0 0 32px ${current.color}70`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
      )}

      {/* ── NAV TAB ARROW — bounces down toward highlighted tab ── */}
      {isNav && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`arrow-nav-${step}`}
            className="absolute pointer-events-none"
            style={{
              bottom: 72,
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

      {/* ── SIDEBAR-ITEM SPOTLIGHT — transparent box, shadow dims everything else ── */}
      {isSidebarItem && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`spotlight-sidebar-${activeItemIndex}`}
            className="absolute pointer-events-none"
            style={{
              top: itemY,
              left: 0,
              width: SIDEBAR_W,
              height: itemH,
              borderRadius: 4,
              border: `2px solid ${current.color}`,
              backgroundColor: `${current.color}08`,
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.76), 0 0 32px ${current.color}60, inset 0 0 16px ${current.color}18`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
      )}

      {/* ── SIDEBAR-ITEM ARROW — bounces left at right edge of sidebar ── */}
      {isSidebarItem && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`arrow-sidebar-${activeItemIndex}`}
            className="absolute pointer-events-none"
            style={{
              top: itemY + itemH / 2 - 10,
              left: SIDEBAR_W + 6,
            }}
            animate={{ x: [0, -6, 0] }}
            transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
              <path
                d="M18 10 L6 10 M6 10 L11 5 M6 10 L11 15"
                stroke={current.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── SIDEBAR BUTTON RING (sidebar-intro step) ── */}
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

      {/* ── TUTORIAL CARD ── */}
      <div
        className="absolute"
        style={(() => {
          if (isSidebarItem) return { bottom: 90, left: 16, right: 16 };
          if (isNav) return { bottom: 120, left: "50%", transform: "translateX(-50%)", width: "min(340px, calc(100vw - 32px))" };
          if (isHomeIntro && homeRect) {
            // Place card opposite the target so the actual UI stays visible.
            const cardOnTop = homeRect.top > window.innerHeight / 2;
            return cardOnTop
              ? { top: 16, left: "50%", transform: "translateX(-50%)", width: "min(340px, calc(100vw - 32px))" }
              : { bottom: 86, left: "50%", transform: "translateX(-50%)", width: "min(340px, calc(100vw - 32px))" };
          }
          return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(340px, calc(100vw - 32px))" };
        })()}
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
                boxShadow: `0 0 44px ${current.color}18, 0 8px 32px rgba(0,0,0,0.75)`,
              }}
            >
              {/* Header */}
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

              {/* Visual preview — shown for HP & MANA step. Colors match Day6Home. */}
              {current.sectionLabel === "HP & MANA" && (() => {
                const hpVal = 82;
                const mpVal = Math.round(MANA_MAX * 0.65);
                const hpC = getHPColor(hpVal);
                const mpC = getManaColor(mpVal);
                return (
                  <div
                    className="mb-3 p-3 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {/* HP bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <Heart size={12} style={{ color: hpC }} fill={hpC} />
                      <span className="text-[9px] font-bold tracking-wider" style={{ color: hpC, width: 22 }}>HP</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${hpC}26` }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${hpVal}%`,
                            background: hpC,
                            boxShadow: `0 0 8px ${hpC}99`,
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{hpVal}/100</span>
                    </div>
                    {/* MP bar */}
                    <div className="flex items-center gap-2">
                      <Zap size={12} style={{ color: mpC }} fill={mpC} />
                      <span className="text-[9px] font-bold tracking-wider" style={{ color: mpC, width: 22 }}>MP</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${mpC}26` }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(mpVal / MANA_MAX) * 100}%`,
                            background: mpC,
                            boxShadow: `0 0 8px ${mpC}99`,
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{mpVal}/{MANA_MAX}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              <p
                className="text-xs leading-relaxed mb-3 whitespace-pre-line"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {current.desc}
              </p>

              {/* Progress dots + button */}
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
    </div>
  );
}

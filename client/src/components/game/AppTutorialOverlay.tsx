import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Play } from "lucide-react";

const TUTORIAL_KEY = "ascend_app_tutorial_seen";
const CTA_TESTID   = "mission-card-current";

interface CtaRect { top: number; left: number; width: number; height: number; }

export function AppTutorialOverlay() {
  const [visible, setVisible] = useState(
    () => localStorage.getItem(TUTORIAL_KEY) !== "1"
  );
  const [step, setStep] = useState<0 | 1>(0);
  const [ctaRect, setCtaRect] = useState<CtaRect | null>(null);

  useEffect(() => {
    if (step !== 1 || !visible) { setCtaRect(null); return; }
    let cancelled = false;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-testid="${CTA_TESTID}"]`);
      if (el && !cancelled) {
        const r = el.getBoundingClientRect();
        setCtaRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    const t1 = setTimeout(measure, 60);
    const t2 = setTimeout(measure, 340);
    const t3 = setTimeout(measure, 700);
    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      window.removeEventListener("resize", measure);
    };
  }, [step, visible]);

  const dismiss = () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{ pointerEvents: "all" }}
      data-tutorial-active="1"
    >
      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════════════════════
            STEP 0 — MISSION BRIEFING
            Full-screen cinematic card. No dismiss X — user must accept.
        ══════════════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <motion.div
            key="awakening"
            className="absolute inset-0 flex items-center justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.94)", backdropFilter: "blur(10px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.52, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.10 }}
              className="w-full max-w-sm rounded-3xl p-8 text-center"
              style={{
                backgroundColor: "rgba(4,4,18,0.99)",
                border: "1px solid rgba(14,165,233,0.28)",
                boxShadow: "0 0 80px rgba(14,165,233,0.10), 0 40px 80px rgba(0,0,0,0.85)",
              }}
            >
              {/* Pulsing icon */}
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  backgroundColor: "rgba(14,165,233,0.09)",
                  border: "1.5px solid rgba(14,165,233,0.32)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 0px rgba(14,165,233,0)",
                    "0 0 44px rgba(14,165,233,0.36)",
                    "0 0 0px rgba(14,165,233,0)",
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Zap size={38} style={{ color: "#0ea5e9" }} />
              </motion.div>

              {/* Mission badge */}
              <p
                className="text-[9px] uppercase tracking-[0.34em] font-bold mb-2.5"
                style={{ color: "rgba(14,165,233,0.65)" }}
              >
                Mission 01 · Active
              </p>

              {/* Title */}
              <h2
                className="text-[22px] font-extrabold mb-3 leading-snug"
                style={{ color: "#eef2ff", letterSpacing: "0.01em" }}
              >
                Your Journey Begins
              </h2>

              {/* Mission brief — action-focused, no feature explanation */}
              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                Tap your first mission card to start. Three short activities —
                guided from start to finish. Everything unlocks from there.
              </p>

              {/* Single CTA — no alternative */}
              <motion.button
                onClick={() => setStep(1)}
                className="w-full py-4 rounded-2xl text-[13px] font-extrabold uppercase tracking-[0.18em]"
                style={{
                  backgroundColor: "#0ea5e9",
                  color: "#001828",
                  boxShadow: "0 0 32px rgba(14,165,233,0.32)",
                }}
                whileTap={{ scale: 0.97 }}
                data-testid="button-tutorial-accept-mission"
              >
                Accept Mission →
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1 — MISSION CARD SPOTLIGHT
            Spotlights the current mission card, floating card gives
            one instruction. Dismissing completes the tutorial.
        ══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <motion.div
            key="spotlight"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {/* Transparent base (allows pointer events to pass through to button) */}
            <div className="absolute inset-0" />

            {ctaRect && (
              <>
                {/* Cutout spotlight ring — box-shadow scrim */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    top:    ctaRect.top    - 8,
                    left:   ctaRect.left   - 8,
                    width:  ctaRect.width  + 16,
                    height: ctaRect.height + 16,
                    borderRadius: 20,
                    border: "2px solid rgba(14,165,233,0.92)",
                    boxShadow:
                      "0 0 0 9999px rgba(0,0,0,0.78), " +
                      "0 0 44px rgba(14,165,233,0.48), " +
                      "inset 0 0 20px rgba(14,165,233,0.08)",
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28 }}
                />

                {/* Gentle pulse ring */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    top:    ctaRect.top    - 8,
                    left:   ctaRect.left   - 8,
                    width:  ctaRect.width  + 16,
                    height: ctaRect.height + 16,
                    borderRadius: 20,
                    border: "1.5px solid rgba(14,165,233,0.45)",
                  }}
                  animate={{ scale: [1, 1.05, 1], opacity: [0.45, 0, 0.45] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Floating instruction card — below button if room, else above */}
                {(() => {
                  const spaceBelow = window.innerHeight - (ctaRect.top + ctaRect.height);
                  const below = spaceBelow >= 172;
                  return (
                    <motion.div
                      className="absolute left-4 right-4"
                      style={
                        below
                          ? { top:    ctaRect.top + ctaRect.height + 14 }
                          : { bottom: window.innerHeight - ctaRect.top + 14 }
                      }
                      initial={{ opacity: 0, y: below ? -10 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: 0.18 }}
                    >
                      <div
                        className="rounded-2xl p-4"
                        style={{
                          backgroundColor: "rgba(4,4,18,0.97)",
                          border: "1px solid rgba(14,165,233,0.32)",
                          boxShadow: "0 0 40px rgba(14,165,233,0.09), 0 12px 40px rgba(0,0,0,0.72)",
                        }}
                      >
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: "rgba(14,165,233,0.13)",
                              border: "1px solid rgba(14,165,233,0.26)",
                            }}
                          >
                            <Play size={13} style={{ color: "#0ea5e9" }} />
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.24em] font-bold leading-none mb-0.5" style={{ color: "#0ea5e9" }}>
                              Mission 01
                            </p>
                            <p className="text-sm font-bold leading-tight" style={{ color: "#eef2ff" }}>
                              Your First Mission
                            </p>
                          </div>
                        </div>

                        <p className="text-[11px] leading-relaxed mb-3.5" style={{ color: "rgba(255,255,255,0.42)" }}>
                          Tap the highlighted card to begin. Each mission unlocks the next — Breath · Movement · Strength, guided step by step.
                        </p>

                        <motion.button
                          onClick={dismiss}
                          className="w-full py-3 rounded-xl text-[12px] font-bold uppercase tracking-[0.14em]"
                          style={{
                            backgroundColor: "#0ea5e9",
                            color: "#001828",
                          }}
                          whileTap={{ scale: 0.97 }}
                          data-testid="button-tutorial-next"
                        >
                          Got it — I'm ready
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })()}
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

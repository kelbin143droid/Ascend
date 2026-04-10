import { useState, useEffect, useCallback, type FC } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Zap, ArrowRight, CheckCircle2, Circle, Lock, Clock } from "lucide-react";
import { isDayFiveSleepScheduled, isDayFiveFlowScheduled } from "@/lib/userState";

interface Day5CoachTutorialProps {
  onComplete: () => void;
}

type Phase = "intro" | "tasks" | "done";

const ACCENT = "#6366f1";
const SLEEP_COLOR = "#3b82f6";
const FLOW_COLOR = "#a855f7";

export function Day5CoachTutorial({ onComplete }: Day5CoachTutorialProps) {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sleepDone, setSleepDone] = useState(() => isDayFiveSleepScheduled());
  const [flowDone, setFlowDone] = useState(() => isDayFiveFlowScheduled());
  const bothDone = sleepDone && flowDone;

  const syncState = useCallback(() => {
    const s = isDayFiveSleepScheduled();
    const f = isDayFiveFlowScheduled();
    setSleepDone(s);
    setFlowDone(f);
  }, []);

  useEffect(() => {
    const onSleep = () => setSleepDone(true);
    const onFlow = () => setFlowDone(true);
    window.addEventListener("ascend:day5-sleep-scheduled", onSleep);
    window.addEventListener("ascend:day5-flow-scheduled", onFlow);
    return () => {
      window.removeEventListener("ascend:day5-sleep-scheduled", onSleep);
      window.removeEventListener("ascend:day5-flow-scheduled", onFlow);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(syncState, 800);
    return () => clearInterval(id);
  }, [syncState]);

  useEffect(() => {
    if (bothDone && phase === "tasks") {
      const t = setTimeout(() => setPhase("done"), 400);
      return () => clearTimeout(t);
    }
  }, [bothDone, phase]);

  return (
    <div
      data-testid="day5-coach-tutorial"
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "linear-gradient(160deg, #06060f 0%, #0d0d1f 60%, #06060f 100%)",
      }}
    >
      <style>{`
        @keyframes d5cPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes d5cGlow {
          0%, 100% { box-shadow: 0 0 20px ${ACCENT}30; }
          50% { box-shadow: 0 0 40px ${ACCENT}60; }
        }
        @keyframes d5cFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes d5cScanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${ACCENT}08 0%, transparent 60%),
                       radial-gradient(ellipse at 70% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-full px-5 pb-safe pb-8 pt-safe pt-10 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">

          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col h-full justify-center items-center gap-8 text-center"
            >
              <div className="relative flex items-center justify-center">
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 120, height: 120, border: `1px solid ${ACCENT}25` }}
                  animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.15, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 90, height: 90, border: `1px solid ${ACCENT}35` }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}20, rgba(168,85,247,0.15))`,
                    border: `2px solid ${ACCENT}50`,
                    animation: "d5cGlow 2.5s ease-in-out infinite",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${ACCENT}20 2px, ${ACCENT}20 4px)`,
                      animation: "d5cScanline 4s linear infinite",
                    }}
                  />
                  <span style={{ fontSize: 32 }}>🧬</span>
                </div>
              </div>

              <div className="space-y-3">
                <div
                  className="inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold mb-2"
                  style={{ backgroundColor: `${ACCENT}15`, color: `${ACCENT}cc`, border: `1px solid ${ACCENT}30` }}
                >
                  Day 5 · System Orientation
                </div>
                <h1
                  className="text-2xl font-bold leading-snug"
                  style={{ color: "#F5F5FF", fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Your foundation is ready.<br />
                  <span style={{ color: ACCENT }}>Now, map the system.</span>
                </h1>
                <p
                  className="text-sm leading-relaxed max-w-xs mx-auto"
                  style={{ color: "rgba(245,245,255,0.5)", fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Before you unlock the next phase, you need to anchor two critical routines into your timeline.
                </p>
              </div>

              <div
                className="w-full rounded-2xl p-4 space-y-2"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}08, transparent)`,
                  border: `1px solid ${ACCENT}20`,
                }}
              >
                <p
                  className="text-[11px] uppercase tracking-widest font-bold"
                  style={{ color: `${ACCENT}80` }}
                >
                  Coach Note
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(245,245,255,0.65)", fontStyle: "italic", fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  "Rhythm without a map is noise. You've built the habit. Now place it in time — so your system knows when to activate."
                </p>
              </div>

              <button
                data-testid="button-d5-coach-begin"
                onClick={() => setPhase("tasks")}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, rgba(168,85,247,0.9))`,
                  color: "#fff",
                  boxShadow: `0 8px 24px ${ACCENT}40`,
                }}
              >
                Show me what to do
                <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {phase === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col h-full gap-6"
            >
              <div className="pt-2">
                <p
                  className="text-[10px] uppercase tracking-widest font-bold mb-1"
                  style={{ color: `${ACCENT}80` }}
                >
                  Day 5 · Timeline Setup
                </p>
                <h2
                  className="text-xl font-bold"
                  style={{ color: "#F5F5FF", fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Add two blocks to your Sectograph
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(245,245,255,0.45)", fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Open your timeline and place each block. Come back when both are set.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <TaskCard
                  icon={Moon}
                  iconColor={SLEEP_COLOR}
                  label="Sleep Schedule"
                  description="Add a Sleep block to define your rest window."
                  done={sleepDone}
                  testId="d5-task-sleep"
                />
                <TaskCard
                  icon={Zap}
                  iconColor={FLOW_COLOR}
                  label="Daily Flow Session"
                  description="Add your Daily Flow block for tomorrow's training window."
                  done={flowDone}
                  locked={!sleepDone}
                  testId="d5-task-flow"
                />
              </div>

              {!bothDone && (
                <div className="flex flex-col gap-3 mt-auto">
                  <button
                    data-testid="button-d5-open-timeline"
                    onClick={() => navigate("/sectograph?day5=1")}
                    className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}, rgba(168,85,247,0.9))`,
                      color: "#fff",
                      boxShadow: `0 8px 24px ${ACCENT}40`,
                    }}
                  >
                    <Clock size={18} />
                    Open Your Timeline
                  </button>
                  <p
                    className="text-center text-xs"
                    style={{ color: "rgba(245,245,255,0.3)", fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {!sleepDone
                      ? "Start with your Sleep block — it unlocks the Daily Flow step"
                      : "Great! Now add your Daily Flow block to finish"}
                  </p>
                </div>
              )}

              {bothDone && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-auto"
                >
                  <div
                    className="w-full rounded-2xl p-4 mb-4 text-center"
                    style={{
                      background: "rgba(34,197,94,0.06)",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    <p className="text-sm font-bold" style={{ color: "#22c55e" }}>
                      Both blocks placed. Your timeline is anchored.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col h-full justify-center items-center gap-8 text-center"
            >
              <div className="relative flex items-center justify-center">
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 130, height: 130, border: "1px solid rgba(34,197,94,0.2)" }}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
                <motion.div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
                    border: "2px solid rgba(34,197,94,0.5)",
                    boxShadow: "0 0 40px rgba(34,197,94,0.3)",
                  }}
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 16 }}
                >
                  <CheckCircle2 size={44} color="#22c55e" />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="space-y-3 px-4"
              >
                <div
                  className="inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold"
                  style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "rgba(34,197,94,0.9)", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  Foundation Complete
                </div>
                <h2
                  className="text-2xl font-bold leading-snug"
                  style={{ color: "#F5F5FF", fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Your system is now<br />
                  <span style={{ color: "#22c55e" }}>fully anchored.</span>
                </h2>
                <p
                  className="text-sm leading-relaxed max-w-xs mx-auto"
                  style={{ color: "rgba(245,245,255,0.5)", fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  Sleep and Daily Flow are placed in your timeline. Day 6 is ready to unlock.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                data-testid="button-d5-complete-foundation"
                onClick={onComplete}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff",
                  boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
                }}
              >
                Complete My Foundation
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

interface TaskCardProps {
  icon: FC<{ size?: number; color?: string }>;
  iconColor: string;
  label: string;
  description: string;
  done: boolean;
  locked?: boolean;
  testId: string;
}

function TaskCard({ icon: Icon, iconColor, label, description, done, locked, testId }: TaskCardProps) {
  return (
    <motion.div
      data-testid={testId}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: locked ? 0.4 : 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full flex items-center gap-4 p-4 rounded-2xl"
      style={{
        background: done
          ? "rgba(34,197,94,0.06)"
          : locked
          ? "rgba(255,255,255,0.02)"
          : `${iconColor}08`,
        border: done
          ? "1px solid rgba(34,197,94,0.2)"
          : locked
          ? "1px solid rgba(255,255,255,0.06)"
          : `1px solid ${iconColor}25`,
        transition: "all 0.3s ease",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: done ? "rgba(34,197,94,0.12)" : locked ? "rgba(255,255,255,0.04)" : `${iconColor}15`,
          border: done ? "1px solid rgba(34,197,94,0.3)" : `1px solid ${iconColor}25`,
        }}
      >
        {locked ? (
          <Lock size={18} color="rgba(245,245,255,0.25)" />
        ) : (
          <Icon size={20} color={done ? "#22c55e" : iconColor} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold"
          style={{
            color: done ? "#22c55e" : locked ? "rgba(245,245,255,0.3)" : "#F5F5FF",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {label}
        </p>
        <p
          className="text-xs mt-0.5 leading-snug"
          style={{ color: done ? "rgba(34,197,94,0.7)" : "rgba(245,245,255,0.4)", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          {done ? "Placed in timeline ✓" : description}
        </p>
      </div>

      <div className="shrink-0">
        {done ? (
          <CheckCircle2 size={20} color="#22c55e" />
        ) : (
          <Circle size={20} color={locked ? "rgba(245,245,255,0.15)" : `${iconColor}50`} />
        )}
      </div>
    </motion.div>
  );
}

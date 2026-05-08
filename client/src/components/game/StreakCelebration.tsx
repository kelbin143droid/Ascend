import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100];

const MILESTONE_DATA: Record<number, { label: string; message: string; color: string; glow: string }> = {
  3:   { label: "3-Day Streak",   message: "The momentum begins.",            color: "#f97316", glow: "rgba(249,115,22,0.4)" },
  7:   { label: "One Week",       message: "Seven days of showing up.",       color: "#fb923c", glow: "rgba(251,146,60,0.4)" },
  14:  { label: "Two Weeks",      message: "Halfway to a new habit.",         color: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  21:  { label: "21-Day Streak",  message: "A habit is forming within you.",  color: "#eab308", glow: "rgba(234,179,8,0.4)" },
  30:  { label: "30-Day Streak",  message: "A full month. You are forged.",   color: "#ef4444", glow: "rgba(239,68,68,0.45)" },
  60:  { label: "60 Days",        message: "Two months of iron discipline.",   color: "#dc2626", glow: "rgba(220,38,38,0.45)" },
  100: { label: "100-Day Legend", message: "Triple digits. You are elite.",   color: "#b91c1c", glow: "rgba(185,28,28,0.5)" },
};

function getFallbackMilestoneData(streak: number) {
  const prev = [...STREAK_MILESTONES].reverse().find(m => streak >= m) ?? 3;
  return MILESTONE_DATA[prev] ?? MILESTONE_DATA[3];
}

const CELEBRATE_KEY = "ascend_last_streak_celebrated";

function getLastCelebrated(): number {
  try { return parseInt(localStorage.getItem(CELEBRATE_KEY) ?? "0", 10); } catch { return 0; }
}
function setLastCelebrated(n: number) {
  try { localStorage.setItem(CELEBRATE_KEY, String(n)); } catch {}
}

interface StreakCelebrationProps {
  streak: number;
  onComplete: () => void;
}

export function StreakCelebration({ streak, onComplete }: StreakCelebrationProps) {
  const [visible, setVisible] = useState(true);
  const data = MILESTONE_DATA[streak] ?? getFallbackMilestoneData(streak);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onComplete, 350);
  }, [onComplete]);

  useEffect(() => {
    const t = setTimeout(dismiss, 3500);
    return () => clearTimeout(t);
  }, [dismiss]);

  const particles = Array.from({ length: 12 }, (_, i) => i);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[110] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
          onClick={dismiss}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${data.glow.replace("0.4", "0.1")} 0%, transparent 60%)`,
            }}
          />

          {particles.map((i) => {
            const angle = (i / particles.length) * 360;
            const radius = 110 + Math.random() * 40;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            const size = 3 + Math.random() * 4;
            const delay = Math.random() * 0.6;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: data.color,
                  boxShadow: `0 0 ${size * 2}px ${data.color}`,
                  left: "calc(50% - 2px)",
                  top: "calc(50% - 2px)",
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: [0, x * 0.5, x],
                  y: [0, y * 0.5 - 30, y],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0.5],
                }}
                transition={{
                  duration: 1.4,
                  delay,
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: 0.8,
                }}
              />
            );
          })}

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center gap-5 px-8 py-10"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [-4, 4, -4] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl select-none"
              style={{ filter: `drop-shadow(0 0 24px ${data.color})` }}
            >
              🔥
            </motion.div>

            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="text-[11px] tracking-[0.3em] uppercase font-mono"
                style={{ color: `${data.color}cc` }}
              >
                {data.label}
              </span>
              <div
                className="text-8xl font-black font-display"
                style={{
                  color: data.color,
                  textShadow: `0 0 30px ${data.glow}, 0 0 60px ${data.glow.replace("0.4", "0.2")}`,
                  lineHeight: 1,
                }}
              >
                {streak}
              </div>
              <span
                className="text-[11px] tracking-[0.25em] uppercase font-mono mt-1"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                days
              </span>
            </motion.div>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.45 }}
              className="h-px w-32 rounded-full"
              style={{ backgroundColor: `${data.color}55` }}
            />

            <motion.p
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.45 }}
              className="text-sm text-center max-w-xs font-mono italic"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              "{data.message}"
            </motion.p>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="text-[10px] uppercase tracking-widest mt-2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Tap to continue
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StreakCelebrationOverlay() {
  const { player } = useGame();
  const prevStreakRef = useRef<number | null>(null);
  const [activeStreak, setActiveStreak] = useState<number | null>(null);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const streak = (e as CustomEvent<{ streak: number }>).detail?.streak ?? player?.streak ?? 0;
      setActiveStreak(streak);
    };
    window.addEventListener("ascend:show-streak-animation", handleEvent);
    return () => window.removeEventListener("ascend:show-streak-animation", handleEvent);
  }, [player?.streak]);

  useEffect(() => {
    if (!player) return;
    const streak = player.streak ?? 0;
    if (prevStreakRef.current === null) {
      prevStreakRef.current = streak;
      return;
    }
    if (streak > prevStreakRef.current) {
      const isMilestone = STREAK_MILESTONES.includes(streak);
      const lastCelebrated = getLastCelebrated();
      if (isMilestone && streak !== lastCelebrated) {
        setLastCelebrated(streak);
        setActiveStreak(streak);
      }
    }
    prevStreakRef.current = streak;
  }, [player?.streak]);

  if (activeStreak === null) return null;

  return (
    <StreakCelebration
      streak={activeStreak}
      onComplete={() => setActiveStreak(null)}
    />
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle } from "lucide-react";
import { PHASE_STAT_CAPS, PHASE_NAMES } from "@shared/schema";

interface PhaseUnlockScreenProps {
  newPhase: number;
  title: string;
  description: string;
  highlights: string[];
  onConfirm: () => void;
  isReplay?: boolean;
}

const PHASE_COLORS: Record<number, string> = {
  1: "#6b7280",
  2: "#22c55e",
  3: "#3b82f6",
  4: "#a855f7",
  5: "#ffd700",
};

const PHASE_SUBTITLES: Record<number, string> = {
  1: "Stabilization — your journey begins.",
  2: "Foundation — consistency builds momentum.",
  3: "Expansion — deeper practice emerges.",
  4: "Optimization — sustained growth takes shape.",
  5: "Sovereignty — long-term mastery achieved.",
};

export function PhaseUnlockScreen({
  newPhase,
  title,
  description,
  highlights,
  onConfirm,
  isReplay = false,
}: PhaseUnlockScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const phaseColor = PHASE_COLORS[newPhase] || "#00ffff";
  const statCap = PHASE_STAT_CAPS[newPhase] || 30;

  useEffect(() => {
    const timer1 = setTimeout(() => setShowContent(true), 500);
    const timer2 = setTimeout(() => setShowHighlights(true), 1200);
    const timer3 = setTimeout(() => setShowButton(true), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
        data-testid="phase-unlock-screen"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="phase-unlock-title"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: 0.1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
            style={{
              background: `radial-gradient(circle, ${phaseColor} 0%, transparent 70%)`,
            }}
          />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex flex-col items-center text-center px-8 max-w-md"
        >
          {isReplay && (
            <div className="absolute top-0 right-0 -mt-8 text-xs text-muted-foreground tracking-widest">
              REPLAY
            </div>
          )}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="relative mb-6"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 20px ${phaseColor}40`,
                  `0 0 40px ${phaseColor}60`,
                  `0 0 20px ${phaseColor}40`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: phaseColor }}
            >
              <Shield
                className="w-12 h-12"
                style={{ color: phaseColor }}
              />
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div 
                  id="phase-unlock-title"
                  className="text-xs tracking-[0.3em] text-muted-foreground"
                  data-testid="text-phase-advanced"
                >
                  PHASE ADVANCED
                </div>

                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl font-display font-black"
                  style={{ color: phaseColor }}
                  data-testid="text-new-phase"
                >
                  {PHASE_NAMES[newPhase]?.toUpperCase() || `PHASE ${newPhase}`}
                </motion.div>

                <div className="text-sm text-muted-foreground italic">
                  {PHASE_SUBTITLES[newPhase] || "Growth continues."}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="pt-4 space-y-2"
                >
                  <div className="text-xs tracking-widest text-muted-foreground">
                    {title.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    {description}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showHighlights && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 space-y-2 w-full"
              >
                {highlights.map((highlight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="flex items-center gap-2 text-xs text-left"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{highlight}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showButton && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onConfirm}
                className="mt-8 px-8 py-3 border text-sm tracking-widest font-medium transition-all hover:bg-white/5"
                style={{
                  borderColor: phaseColor,
                  color: phaseColor,
                }}
                data-testid="button-confirm-phase"
              >
                [ BEGIN INTEGRATION ]
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

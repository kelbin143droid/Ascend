import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LevelUpAnimationProps {
  newLevel: number;
  motivationalPhrase: string;
  maxHp?: number;
  maxMana?: number;
  onComplete: () => void;
}

const LEVEL_PHRASES: Record<number, string> = {
  2: "The first step is taken. The path opens.",
  3: "Momentum begins to favor you.",
  4: "Your rhythm is finding its beat.",
  5: "Five days strong. The system sees you.",
  6: "Old habits begin to lose their grip.",
  7: "A week of will. Discipline is sprouting.",
  8: "You are showing up for yourself now.",
  9: "Ritual is becoming reflex.",
  10: "Double digits. The shift is real.",
  11: "You are no longer who you were last week.",
  12: "Consistency is your new superpower.",
  13: "The grind is shaping you, quietly.",
  14: "Two weeks. Your body remembers.",
  15: "You have crossed the line of curiosity.",
  16: "Effort compounds. You are proof.",
  17: "Others talk. You execute.",
  18: "Your future self is taking notes.",
  19: "Resistance is becoming routine.",
  20: "Twenty levels of choosing yourself.",
  21: "You are building someone formidable.",
  22: "Precision sharpens with each rep.",
  23: "The fog of doubt is thinning.",
  24: "Quiet wins are stacking high.",
  25: "Quarter century reached. Hold the line.",
  26: "Your standards have permanently risen.",
  27: "Comfort no longer commands you.",
  28: "Strength is no longer occasional.",
  29: "You have outgrown your old excuses.",
  30: "Thirty. You are forged, not flickering.",
  31: "Discipline now lives in your bones.",
  32: "Few stay this long. You did.",
  33: "Mastery is patient. So are you.",
  34: "You move with purpose now.",
  35: "Your rhythm is undeniable.",
  36: "The system bends to your consistency.",
  37: "You have built your own gravity.",
  38: "Pressure is now fuel, not friction.",
  39: "Your edge is sharpening, daily.",
  40: "Forty levels deep. Welcome to the few.",
  41: "Your habits are your legacy.",
  42: "Calm power. Quiet confidence.",
  43: "You are running a longer race.",
  44: "Most quit before this. You did not.",
  45: "Your potential is becoming inevitable.",
  46: "Identity has shifted. Permanently.",
  47: "You are not lucky. You are built.",
  48: "Ascending without applause. Respect.",
  49: "On the brink of fifty. Hold.",
  50: "Half a hundred. You are elite territory.",
};

const BRACKETS: { max: number; phrases: string[] }[] = [
  {
    max: 10,
    phrases: [
      "The journey of a thousand miles begins.",
      "Every step forward counts.",
      "Discipline starts with the first rep.",
      "You have chosen the path.",
      "Small gains compound into greatness.",
    ],
  },
  {
    max: 25,
    phrases: [
      "Consistency builds champions.",
      "The grind is shaping you.",
      "Progress, not perfection.",
      "Your dedication is paying off.",
      "Weakness is leaving the body.",
    ],
  },
  {
    max: 50,
    phrases: [
      "You are no longer a beginner.",
      "The foundation is solid.",
      "Others talk. You execute.",
      "Your potential is becoming reality.",
      "The system recognizes your effort.",
    ],
  },
  {
    max: 75,
    phrases: [
      "Few make it this far.",
      "Your discipline is exceptional.",
      "The path rewards the persistent.",
      "You have outpaced the masses.",
      "Excellence is becoming ritual.",
    ],
  },
  {
    max: 100,
    phrases: [
      "Elite territory reached.",
      "You stand among the dedicated.",
      "The summit is in sight.",
      "Mastery awaits the relentless.",
      "Your legacy is being written.",
    ],
  },
  {
    max: Infinity,
    phrases: [
      "You have transcended limits.",
      "Ascension mode: Active.",
      "Beyond mortal boundaries.",
      "The system bows to your will.",
      "You are the exception.",
      "Legends are forged in discipline.",
    ],
  },
];

export function getMotivationalPhrase(level: number): string {
  if (LEVEL_PHRASES[level]) return LEVEL_PHRASES[level];
  const bracket = BRACKETS.find((b) => level <= b.max) || BRACKETS[BRACKETS.length - 1];
  const phrases = bracket.phrases;
  const index = (level - 1) % phrases.length;
  return phrases[index];
}

export function LevelUpAnimation({ newLevel, motivationalPhrase, maxHp, maxMana, onComplete }: LevelUpAnimationProps) {
  const [displayLevel, setDisplayLevel] = useState(Math.max(1, newLevel - 1));
  const [xpProgress, setXpProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  }, [onComplete]);

  useEffect(() => {
    const levelDuration = 800;
    const startTime = Date.now();
    const startLevel = Math.max(1, newLevel - 1);

    const levelInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / levelDuration, 1);
      const currentLevel = Math.floor(startLevel + progress * (newLevel - startLevel));
      setDisplayLevel(currentLevel);

      if (progress >= 1) {
        setDisplayLevel(newLevel);
        clearInterval(levelInterval);
      }
    }, 50);

    return () => clearInterval(levelInterval);
  }, [newLevel]);

  useEffect(() => {
    const xpDuration = 1200;
    const startTime = Date.now();

    const xpInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / xpDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setXpProgress(eased * 100);

      if (progress >= 1) {
        clearInterval(xpInterval);
      }
    }, 16);

    return () => clearInterval(xpInterval);
  }, []);

  useEffect(() => {
    const autoCloseTimer = setTimeout(() => {
      handleDismiss();
    }, 2200);

    return () => clearTimeout(autoCloseTimer);
  }, [handleDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={handleDismiss}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        >
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(0,200,255,0.08) 0%, transparent 60%)",
            }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(0,200,255,0.15) 0%, transparent 70%)",
            }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center gap-6 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-xs tracking-[0.3em] text-cyan-400/80 uppercase font-mono"
            >
              Level Up
            </motion.div>

            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <div 
                className="text-7xl font-display font-black text-white"
                style={{
                  textShadow: "0 0 40px rgba(0,200,255,0.5), 0 0 80px rgba(0,200,255,0.3)",
                }}
              >
                {displayLevel}
              </div>
            </motion.div>

            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "200px", opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(0,200,255,0.2)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${xpProgress}%`,
                  background: "linear-gradient(90deg, #00c8ff, #00ffff)",
                  boxShadow: "0 0 10px rgba(0,200,255,0.6)",
                }}
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-sm text-gray-400 text-center max-w-xs font-mono italic"
            >
              "{motivationalPhrase}"
            </motion.div>

            {(maxHp !== undefined || maxMana !== undefined) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.45 }}
                className="flex gap-3 mt-1"
                data-testid="level-up-stat-boost"
              >
                {maxHp !== undefined && (
                  <div
                    className="flex flex-col items-center px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.35)",
                      minWidth: 78,
                    }}
                  >
                    <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: "rgba(34,197,94,0.8)" }}>
                      HP +10%
                    </span>
                    <span className="text-sm font-bold font-mono" style={{ color: "#22c55e" }}>
                      {maxHp}
                    </span>
                  </div>
                )}
                {maxMana !== undefined && (
                  <div
                    className="flex flex-col items-center px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(59,130,246,0.08)",
                      border: "1px solid rgba(59,130,246,0.35)",
                      minWidth: 78,
                    }}
                  >
                    <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: "rgba(59,130,246,0.85)" }}>
                      MP +10%
                    </span>
                    <span className="text-sm font-bold font-mono" style={{ color: "#3b82f6" }}>
                      {maxMana}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="text-[10px] text-gray-500 tracking-wider uppercase mt-4"
            >
              Tap to continue
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

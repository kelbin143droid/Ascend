import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LevelUpAnimationProps {
  newLevel: number;
  motivationalPhrase: string;
  onComplete: () => void;
}

export function getMotivationalPhrase(level: number): string {
  const brackets: { max: number; phrases: string[] }[] = [
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
        "Excellence is becoming habit.",
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

  const bracket = brackets.find((b) => level <= b.max) || brackets[brackets.length - 1];
  const phrases = bracket.phrases;
  const index = Math.floor(Math.random() * phrases.length);
  return phrases[index];
}

export function LevelUpAnimation({ newLevel, motivationalPhrase, onComplete }: LevelUpAnimationProps) {
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

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface IntroScreenProps {
  onBeginAscension: () => void;
}

export function IntroScreen({ onBeginAscension }: IntroScreenProps) {
  const { theme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleBeginAscension = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      onBeginAscension();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(180deg, #000000 0%, #0a0a1a 50%, #000000 100%)" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: theme.colors.primary,
                boxShadow: `0 0 6px ${theme.colors.primary}`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, transparent 0%, ${theme.colors.primary}08 50%, transparent 100%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <motion.div
          className="relative z-10 text-center px-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <motion.div
            className="text-xs tracking-[0.5em] mb-4 uppercase"
            style={{ color: theme.colors.primary }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            System Initiated
          </motion.div>

          <motion.h1
            className="text-3xl md:text-4xl font-display font-bold mb-2"
            style={{ color: theme.colors.primary }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            AWAKENED HUNTER
          </motion.h1>

          <motion.h2
            className="text-xl md:text-2xl font-display mb-8"
            style={{ color: theme.colors.primary, opacity: 0.7 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            SYSTEM
          </motion.h2>

          <motion.div
            className="h-px w-32 mx-auto mb-8"
            style={{ background: `linear-gradient(90deg, transparent, ${theme.colors.primary}, transparent)` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          />

          <motion.p
            className="text-sm md:text-base mb-12 max-w-md mx-auto leading-relaxed"
            style={{ color: "rgba(255,255,255,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 1 }}
          >
            You have been chosen. The System has recognized your potential.
            <br />
            <span style={{ color: theme.colors.primary }}>Your awakening begins now.</span>
          </motion.p>

          <motion.button
            onClick={handleBeginAscension}
            className="relative px-10 py-4 text-lg font-display tracking-widest uppercase overflow-hidden group"
            style={{
              background: "transparent",
              border: `2px solid ${theme.colors.primary}`,
              color: theme.colors.primary,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            data-testid="button-begin-ascension"
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: theme.colors.primary }}
              initial={{ x: "-100%" }}
              whileHover={{ x: "0%" }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative z-10 group-hover:text-black transition-colors duration-300">
              Begin Ascension
            </span>
            
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: `0 0 30px ${theme.colors.primary}40, inset 0 0 30px ${theme.colors.primary}20`,
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        </motion.div>

        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            style={{ transformOrigin: "bottom", background: theme.colors.primary }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

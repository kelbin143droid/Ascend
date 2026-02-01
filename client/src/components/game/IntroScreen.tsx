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
        style={{ background: "linear-gradient(180deg, #000008 0%, #000a18 50%, #000008 100%)" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Circuit line patterns */}
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0" />
              <stop offset="50%" stopColor={theme.colors.primary} stopOpacity="0.5" />
              <stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[...Array(20)].map((_, i) => (
            <motion.line
              key={`h-${i}`}
              x1="0"
              y1={`${(i + 1) * 5}%`}
              x2="100%"
              y2={`${(i + 1) * 5}%`}
              stroke="url(#circuitGradient)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 2, delay: i * 0.1 }}
            />
          ))}
          {[...Array(15)].map((_, i) => (
            <motion.line
              key={`v-${i}`}
              x1={`${(i + 1) * 7}%`}
              y1="0"
              x2={`${(i + 1) * 7}%`}
              y2="100%"
              stroke="url(#circuitGradient)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.2 }}
              transition={{ duration: 2, delay: i * 0.05 }}
            />
          ))}
        </svg>

        {/* Title */}
        <motion.h1
          className="absolute top-16 text-4xl md:text-5xl font-display font-bold tracking-[0.2em]"
          style={{ color: theme.colors.primary }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          INITIATION
        </motion.h1>

        {/* Subtitle text */}
        <motion.p
          className="absolute top-32 md:top-36 text-sm md:text-base max-w-md text-center px-8 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.5)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          You have been chosen to awaken as a Hunter. The System recognizes your potential. 
          <span style={{ color: theme.colors.primary }}> Accept the call and begin your ascension.</span>
        </motion.p>

        {/* Central portal/ring */}
        <div className="relative flex items-center justify-center" style={{ width: "300px", height: "300px" }}>
          {/* Outer glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "280px",
              height: "280px",
              background: `radial-gradient(circle, ${theme.colors.primary}15 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Outer ring */}
          <motion.div
            className="absolute rounded-full border-2"
            style={{
              width: "240px",
              height: "240px",
              borderColor: `${theme.colors.primary}60`,
              boxShadow: `0 0 30px ${theme.colors.primary}30, inset 0 0 30px ${theme.colors.primary}10`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle ring with segments */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "200px",
              height: "200px",
              border: `1px solid ${theme.colors.primary}40`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "160px",
              height: "160px",
              border: `2px solid ${theme.colors.primary}80`,
              boxShadow: `0 0 20px ${theme.colors.primary}40`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          />

          {/* Core glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "120px",
              height: "120px",
              background: `radial-gradient(circle, ${theme.colors.primary}30 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Human silhouette */}
          <motion.div
            className="absolute flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            <svg width="60" height="100" viewBox="0 0 60 100" fill="none">
              <ellipse cx="30" cy="12" rx="10" ry="12" fill={`${theme.colors.primary}90`} />
              <path
                d="M30 24 L30 55 M30 35 L15 50 M30 35 L45 50 M30 55 L18 85 M30 55 L42 85"
                stroke={`${theme.colors.primary}90`}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>

          {/* Crosshair lines */}
          {[0, 90, 180, 270].map((angle) => (
            <motion.div
              key={angle}
              className="absolute"
              style={{
                width: "2px",
                height: "40px",
                background: `linear-gradient(to bottom, transparent, ${theme.colors.primary}, transparent)`,
                transform: `rotate(${angle}deg) translateY(-130px)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.5 + angle * 0.002, duration: 0.5 }}
            />
          ))}

          {/* Radiating lines */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`ray-${i}`}
              className="absolute"
              style={{
                width: "1px",
                height: "60px",
                background: `linear-gradient(to bottom, ${theme.colors.primary}40, transparent)`,
                transform: `rotate(${i * 30}deg) translateY(-170px)`,
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 0.4, scaleY: 1 }}
              transition={{ delay: 1.8 + i * 0.05, duration: 0.5 }}
            />
          ))}
        </div>

        {/* Begin Ascension Button */}
        <motion.button
          onClick={handleBeginAscension}
          className="absolute bottom-24 flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          data-testid="button-begin-ascension"
        >
          {/* Left bracket */}
          <motion.span
            className="text-2xl font-mono"
            style={{ color: theme.colors.primary }}
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            &lt;
          </motion.span>

          <div
            className="relative px-8 py-3 font-display tracking-[0.3em] uppercase text-lg"
            style={{
              background: `linear-gradient(180deg, ${theme.colors.primary}10 0%, ${theme.colors.primary}05 100%)`,
              border: `1px solid ${theme.colors.primary}60`,
              color: theme.colors.primary,
              boxShadow: `0 0 20px ${theme.colors.primary}20, inset 0 0 20px ${theme.colors.primary}10`,
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent, ${theme.colors.primary}20, transparent)`,
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <span className="relative z-10">Begin Ascension</span>
          </div>

          {/* Right bracket */}
          <motion.span
            className="text-2xl font-mono"
            style={{ color: theme.colors.primary }}
            animate={{ x: [2, -2, 2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            &gt;
          </motion.span>
        </motion.button>

        {/* Bottom tech text */}
        <motion.div
          className="absolute bottom-10 text-xs tracking-[0.4em] font-mono"
          style={{ color: `${theme.colors.primary}40` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
        >
          SYSTEM BUILD V2.0.26
        </motion.div>

        {/* Transition overlay */}
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            style={{ transformOrigin: "center", background: theme.colors.primary }}
            initial={{ scale: 0, borderRadius: "100%" }}
            animate={{ scale: 3, borderRadius: "0%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

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
        style={{ background: "#020810" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Dark vignette overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 20%, #000 80%)",
          }}
        />

        {/* Radiating circuit lines from center */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }}>
          <defs>
            <linearGradient id="rayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.8" />
              <stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0" />
            </linearGradient>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.3" />
              <stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Radiating lines from center */}
          {[...Array(36)].map((_, i) => {
            const angle = i * 10;
            const length = 400 + Math.random() * 200;
            const x2 = 50 + Math.cos((angle * Math.PI) / 180) * length;
            const y2 = 50 + Math.sin((angle * Math.PI) / 180) * length;
            return (
              <motion.line
                key={`radial-${i}`}
                x1="50%"
                y1="50%"
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={theme.colors.primary}
                strokeWidth="1"
                strokeOpacity="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: i * 0.03 }}
              />
            );
          })}

          {/* Horizontal tech lines */}
          {[...Array(8)].map((_, i) => {
            const y = 15 + i * 10;
            return (
              <motion.line
                key={`hline-${i}`}
                x1="0"
                y1={`${y}%`}
                x2="100%"
                y2={`${y}%`}
                stroke={theme.colors.primary}
                strokeWidth="1"
                strokeOpacity="0.15"
                strokeDasharray="20 40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
              />
            );
          })}

          {/* Vertical tech lines */}
          {[...Array(12)].map((_, i) => {
            const x = 8 + i * 8;
            return (
              <motion.line
                key={`vline-${i}`}
                x1={`${x}%`}
                y1="0"
                x2={`${x}%`}
                y2="100%"
                stroke={theme.colors.primary}
                strokeWidth="1"
                strokeOpacity="0.1"
                strokeDasharray="10 30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
              />
            );
          })}
        </svg>

        {/* Title */}
        <motion.h1
          className="absolute top-12 md:top-16 text-4xl md:text-5xl font-display font-bold tracking-[0.15em]"
          style={{ 
            color: theme.colors.primary,
            textShadow: `0 0 30px ${theme.colors.primary}50`,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          INITIATION
        </motion.h1>

        {/* Subtitle text */}
        <motion.p
          className="absolute top-28 md:top-32 text-xs md:text-sm max-w-sm text-center px-6 leading-relaxed"
          style={{ color: "rgba(180,200,220,0.6)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          You have been chosen to awaken as a Hunter. The System recognizes your potential. 
          <span style={{ color: theme.colors.primary }}> Accept the call and begin your ascension.</span>
        </motion.p>

        {/* Central portal/ring - larger and more detailed */}
        <div className="relative flex items-center justify-center" style={{ width: "320px", height: "320px" }}>
          {/* Outer ambient glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "350px",
              height: "350px",
              background: `radial-gradient(circle, ${theme.colors.primary}20 0%, ${theme.colors.primary}08 40%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* Outer segmented ring */}
          <svg className="absolute" width="280" height="280" viewBox="0 0 280 280">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <motion.circle
              cx="140"
              cy="140"
              r="130"
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth="2"
              strokeDasharray="20 8"
              filter="url(#glow)"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
          </svg>

          {/* Second ring with different pattern */}
          <svg className="absolute" width="240" height="240" viewBox="0 0 240 240">
            <motion.circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth="1.5"
              strokeDasharray="40 20 10 20"
              strokeOpacity="0.6"
              initial={{ rotate: 0 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
          </svg>

          {/* Inner detailed ring */}
          <svg className="absolute" width="200" height="200" viewBox="0 0 200 200">
            <motion.circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth="3"
              strokeOpacity="0.8"
              filter="url(#glow)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            />
            {/* Tick marks around the ring */}
            {[...Array(24)].map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              const x1 = 100 + Math.cos(angle) * 82;
              const y1 = 100 + Math.sin(angle) * 82;
              const x2 = 100 + Math.cos(angle) * 90;
              const y2 = 100 + Math.sin(angle) * 90;
              return (
                <motion.line
                  key={`tick-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={theme.colors.primary}
                  strokeWidth={i % 4 === 0 ? 2 : 1}
                  strokeOpacity={i % 4 === 0 ? 1 : 0.5}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 + i * 0.02 }}
                />
              );
            })}
          </svg>

          {/* Core inner ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "140px",
              height: "140px",
              border: `2px solid ${theme.colors.primary}`,
              boxShadow: `0 0 40px ${theme.colors.primary}60, inset 0 0 40px ${theme.colors.primary}20`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          />

          {/* Core glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "100px",
              height: "100px",
              background: `radial-gradient(circle, ${theme.colors.primary}50 0%, ${theme.colors.primary}20 50%, transparent 80%)`,
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          {/* Human silhouette - darker/shadowed */}
          <motion.div
            className="absolute flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            <svg width="50" height="90" viewBox="0 0 50 90" fill="none">
              <ellipse cx="25" cy="10" rx="8" ry="10" fill="#0a1525" stroke={theme.colors.primary} strokeWidth="1" strokeOpacity="0.5" />
              <path
                d="M25 20 L25 50 M25 30 L12 45 M25 30 L38 45 M25 50 L15 80 M25 50 L35 80"
                stroke="#0a1525"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M25 20 L25 50 M25 30 L12 45 M25 30 L38 45 M25 50 L15 80 M25 50 L35 80"
                stroke={theme.colors.primary}
                strokeWidth="1"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
            </svg>
          </motion.div>

          {/* Crosshair lines extending outward */}
          {[0, 90, 180, 270].map((angle) => (
            <motion.div
              key={angle}
              className="absolute"
              style={{
                width: "2px",
                height: "80px",
                background: `linear-gradient(to bottom, ${theme.colors.primary}80, ${theme.colors.primary}20, transparent)`,
                transform: `rotate(${angle}deg) translateY(-160px)`,
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 1.5 + angle * 0.001, duration: 0.8 }}
            />
          ))}

          {/* Additional radiating energy lines */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`energy-${i}`}
              className="absolute"
              style={{
                width: "1px",
                height: "100px",
                background: `linear-gradient(to bottom, ${theme.colors.primary}40, transparent)`,
                transform: `rotate(${i * 45 + 22.5}deg) translateY(-180px)`,
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 0.5, scaleY: 1 }}
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

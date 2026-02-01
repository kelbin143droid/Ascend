import React, { useState, useMemo } from "react";
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

  const stars = useMemo(() => 
    [...Array(80)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    })), []
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#0a1520" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Dark gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, #102030 0%, #0a1520 50%, #050a10 100%)",
          }}
        />

        {/* Subtle stars */}
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: "rgba(150,200,255,0.6)",
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
            }}
          />
        ))}

        {/* Title */}
        <motion.h1
          className="absolute top-12 md:top-16 text-4xl md:text-5xl font-display font-bold tracking-[0.15em]"
          style={{ 
            color: theme.colors.primary,
            textShadow: `0 0 40px ${theme.colors.primary}60`,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          INITIATION
        </motion.h1>

        {/* Subtitle text */}
        <motion.p
          className="absolute top-28 md:top-32 text-sm md:text-base max-w-sm text-center px-6 leading-relaxed font-display font-bold"
          style={{ 
            color: "#d4a843",
            textShadow: "0 0 20px rgba(212, 168, 67, 0.4)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          The System Invites You To Awaken Your True Potential.
        </motion.p>

        {/* Central portal */}
        <div className="relative flex items-center justify-center" style={{ width: "340px", height: "340px" }}>

          {/* Outer ring layer */}
          <svg className="absolute" width="300" height="300" viewBox="0 0 300 300">
            <defs>
              <filter id="glow1">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <motion.g
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: -360, opacity: 1 }}
              transition={{ rotate: { duration: 80, repeat: Infinity, ease: "linear" }, opacity: { duration: 1, delay: 0.3 } }}
              style={{ transformOrigin: "150px 150px" }}
            >
              {[...Array(36)].map((_, i) => {
                const angle = (i * 10 * Math.PI) / 180;
                const innerR = 115;
                const outerR = i % 2 === 0 ? 135 : 125;
                const x1 = 150 + Math.cos(angle) * innerR;
                const y1 = 150 + Math.sin(angle) * innerR;
                const x2 = 150 + Math.cos(angle) * outerR;
                const y2 = 150 + Math.sin(angle) * outerR;
                return (
                  <line
                    key={`mid-seg-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={theme.colors.primary}
                    strokeWidth={i % 2 === 0 ? 2 : 1}
                    strokeOpacity={0.6}
                  />
                );
              })}
              <circle
                cx="150"
                cy="150"
                r="125"
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="1.5"
                strokeOpacity="0.5"
              />
              <circle
                cx="150"
                cy="150"
                r="115"
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="1"
                strokeOpacity="0.3"
              />
            </motion.g>
          </svg>

          {/* Inner ring with tick marks */}
          <svg className="absolute" width="240" height="240" viewBox="0 0 240 240">
            <motion.g
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 360, opacity: 1 }}
              transition={{ rotate: { duration: 60, repeat: Infinity, ease: "linear" }, opacity: { duration: 1, delay: 0.5 } }}
              style={{ transformOrigin: "120px 120px" }}
            >
              {[...Array(48)].map((_, i) => {
                const angle = (i * 7.5 * Math.PI) / 180;
                const innerR = 85;
                const outerR = i % 4 === 0 ? 100 : 92;
                const x1 = 120 + Math.cos(angle) * innerR;
                const y1 = 120 + Math.sin(angle) * innerR;
                const x2 = 120 + Math.cos(angle) * outerR;
                const y2 = 120 + Math.sin(angle) * outerR;
                return (
                  <line
                    key={`inner-seg-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={theme.colors.primary}
                    strokeWidth={i % 4 === 0 ? 2 : 0.8}
                    strokeOpacity={i % 4 === 0 ? 0.8 : 0.4}
                  />
                );
              })}
              <circle
                cx="120"
                cy="120"
                r="95"
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="2"
                strokeOpacity="0.7"
                filter="url(#glow1)"
              />
            </motion.g>
          </svg>

          {/* Core circle */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "160px",
              height: "160px",
              border: `2px solid ${theme.colors.primary}`,
              boxShadow: `0 0 60px ${theme.colors.primary}50, inset 0 0 60px ${theme.colors.primary}30`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          />

          {/* Bright core glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "180px",
              height: "180px",
              background: `radial-gradient(circle, rgba(255,255,255,0.4) 0%, ${theme.colors.primary}60 20%, ${theme.colors.primary}30 50%, transparent 80%)`,
              filter: "blur(2px)",
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Inner bright spot */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "80px",
              height: "80px",
              background: `radial-gradient(circle, rgba(255,255,255,0.6) 0%, ${theme.colors.primary}80 40%, transparent 100%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Crosshair lines */}
          {[0, 90, 180, 270].map((angle) => (
            <motion.div
              key={`cross-${angle}`}
              className="absolute"
              style={{
                width: "2px",
                height: "30px",
                background: theme.colors.primary,
                boxShadow: `0 0 8px ${theme.colors.primary}`,
                transform: `rotate(${angle}deg) translateY(-95px)`,
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 0.8, scaleY: 1 }}
              transition={{ delay: 1.2 + angle * 0.001, duration: 0.5 }}
            />
          ))}

          {/* Human silhouette - realistic body shape */}
          <motion.div
            className="absolute flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <motion.svg 
              width="55" 
              height="105" 
              viewBox="0 0 55 105" 
              fill="none"
              animate={{
                y: [0, -2, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {/* Realistic human silhouette */}
              <defs>
                <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#080e14" />
                  <stop offset="100%" stopColor="#040608" />
                </linearGradient>
              </defs>
              
              {/* Complete human body as single path for smooth shape */}
              <path
                d="M27.5 0
                   C33 0 37 4 37 9
                   C37 14 33 18 27.5 18
                   C22 18 18 14 18 9
                   C18 4 22 0 27.5 0
                   Z"
                fill="url(#bodyGradient)"
              />
              
              {/* Neck and shoulders */}
              <path
                d="M24 17 L24 20 L12 24 Q8 26 8 32 L8 34 Q8 36 10 36 L14 35 L16 50 
                   L20 52 L20 55 L22 55 L22 52 L24 50 L24 22 L27.5 21 L31 22 L31 50 
                   L33 52 L33 55 L35 55 L35 52 L39 50 L41 35 L45 36 Q47 36 47 34 L47 32 
                   Q47 26 43 24 L31 20 L31 17 Z"
                fill="url(#bodyGradient)"
              />
              
              {/* Torso */}
              <path
                d="M20 55
                   L18 58
                   Q16 60 17 65
                   L19 70
                   L20 75
                   L22 75
                   L24 72
                   L27.5 72
                   L31 72
                   L33 75
                   L35 75
                   L36 70
                   L38 65
                   Q39 60 37 58
                   L35 55
                   Z"
                fill="url(#bodyGradient)"
              />
              
              {/* Left leg */}
              <path
                d="M22 75
                   L20 80
                   L19 88
                   L18 95
                   Q17 100 19 102
                   L23 102
                   Q25 100 25 97
                   L26 88
                   L27 80
                   L27.5 75
                   Z"
                fill="url(#bodyGradient)"
              />
              
              {/* Right leg */}
              <path
                d="M33 75
                   L35 80
                   L36 88
                   L37 95
                   Q38 100 36 102
                   L32 102
                   Q30 100 30 97
                   L29 88
                   L28 80
                   L27.5 75
                   Z"
                fill="url(#bodyGradient)"
              />
            </motion.svg>
          </motion.div>
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

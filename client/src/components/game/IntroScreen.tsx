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
          className="absolute top-28 md:top-32 text-xs md:text-sm max-w-sm text-center px-6 leading-relaxed"
          style={{ color: "rgba(150,180,210,0.7)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          You have been chosen to awaken as a Hunter. The System recognizes your potential. 
          <span style={{ color: theme.colors.primary }}> Accept the call and begin your ascension.</span>
        </motion.p>

        {/* Central portal */}
        <div className="relative flex items-center justify-center" style={{ width: "340px", height: "340px" }}>
          
          {/* Outer tech ring with segments */}
          <svg className="absolute" width="340" height="340" viewBox="0 0 340 340">
            <defs>
              <filter id="glow1">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Outer segmented ring with radiating lines */}
            <motion.g
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 360, opacity: 1 }}
              transition={{ rotate: { duration: 120, repeat: Infinity, ease: "linear" }, opacity: { duration: 1 } }}
              style={{ transformOrigin: "170px 170px" }}
            >
              {[...Array(24)].map((_, i) => {
                const angle = (i * 15 * Math.PI) / 180;
                const innerR = 145;
                const outerR = 165;
                const x1 = 170 + Math.cos(angle) * innerR;
                const y1 = 170 + Math.sin(angle) * innerR;
                const x2 = 170 + Math.cos(angle) * outerR;
                const y2 = 170 + Math.sin(angle) * outerR;
                return (
                  <line
                    key={`outer-seg-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={theme.colors.primary}
                    strokeWidth={i % 3 === 0 ? 3 : 1.5}
                    strokeOpacity={i % 3 === 0 ? 0.9 : 0.5}
                    filter="url(#glow1)"
                  />
                );
              })}
              <circle
                cx="170"
                cy="170"
                r="155"
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="1"
                strokeOpacity="0.4"
              />
            </motion.g>
          </svg>

          {/* Second ring layer */}
          <svg className="absolute" width="300" height="300" viewBox="0 0 300 300">
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

          {/* Inner glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "140px",
              height: "140px",
              background: `radial-gradient(circle, ${theme.colors.primary}50 0%, ${theme.colors.primary}20 50%, transparent 80%)`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 3, repeat: Infinity }}
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
              width="60" 
              height="110" 
              viewBox="0 0 60 110" 
              fill="none"
              animate={{
                y: [0, -2, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {/* Full body silhouette path */}
              <path
                d="M30 0
                   C38 0 44 6 44 14
                   C44 22 38 28 30 28
                   C22 28 16 22 16 14
                   C16 6 22 0 30 0
                   Z
                   M30 28
                   L30 30
                   C36 30 42 34 44 40
                   L48 55
                   C49 58 48 60 46 60
                   L44 60
                   C42 60 40 58 40 56
                   L38 48
                   L38 70
                   L42 95
                   C43 100 40 105 36 105
                   L34 105
                   C32 105 30 102 30 100
                   L30 75
                   L30 100
                   C30 102 28 105 26 105
                   L24 105
                   C20 105 17 100 18 95
                   L22 70
                   L22 48
                   L20 56
                   C20 58 18 60 16 60
                   L14 60
                   C12 60 11 58 12 55
                   L16 40
                   C18 34 24 30 30 30
                   Z"
                fill="#0a1520"
                stroke={theme.colors.primary}
                strokeWidth="0.5"
                strokeOpacity="0.3"
              />
              
              {/* Subtle inner glow effect on silhouette */}
              <path
                d="M30 0
                   C38 0 44 6 44 14
                   C44 22 38 28 30 28
                   C22 28 16 22 16 14
                   C16 6 22 0 30 0
                   Z
                   M30 28
                   L30 30
                   C36 30 42 34 44 40
                   L48 55
                   C49 58 48 60 46 60
                   L44 60
                   C42 60 40 58 40 56
                   L38 48
                   L38 70
                   L42 95
                   C43 100 40 105 36 105
                   L34 105
                   C32 105 30 102 30 100
                   L30 75
                   L30 100
                   C30 102 28 105 26 105
                   L24 105
                   C20 105 17 100 18 95
                   L22 70
                   L22 48
                   L20 56
                   C20 58 18 60 16 60
                   L14 60
                   C12 60 11 58 12 55
                   L16 40
                   C18 34 24 30 30 30
                   Z"
                fill="#0c1825"
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

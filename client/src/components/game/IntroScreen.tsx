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
    [...Array(150)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    })), []
  );

  const particles = useMemo(() =>
    [...Array(30)].map((_, i) => ({
      id: i,
      angle: Math.random() * 360,
      distance: 80 + Math.random() * 100,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    })), []
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#000" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Deep space background gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, #0a1628 0%, #050d18 40%, #000 100%)",
          }}
        />

        {/* Nebula clouds */}
        <motion.div
          className="absolute"
          style={{
            width: "600px",
            height: "600px",
            left: "10%",
            top: "20%",
            background: `radial-gradient(ellipse, ${theme.colors.primary}08 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute"
          style={{
            width: "400px",
            height: "400px",
            right: "5%",
            bottom: "30%",
            background: "radial-gradient(ellipse, rgba(100,50,150,0.1) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        {/* Stars */}
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: "#fff",
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
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
          style={{ color: "rgba(180,200,220,0.6)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          You have been chosen to awaken as a Hunter. The System recognizes your potential. 
          <span style={{ color: theme.colors.primary }}> Accept the call and begin your ascension.</span>
        </motion.p>

        {/* Central portal */}
        <div className="relative flex items-center justify-center" style={{ width: "320px", height: "320px" }}>
          
          {/* Dimensional vortex effect - outer */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "300px",
              height: "300px",
              background: `conic-gradient(from 0deg, transparent, ${theme.colors.primary}15, transparent, ${theme.colors.primary}10, transparent)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Particles being pulled into portal */}
          {particles.map((p) => (
            <motion.div
              key={`particle-${p.id}`}
              className="absolute rounded-full"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: theme.colors.primary,
                boxShadow: `0 0 ${p.size * 2}px ${theme.colors.primary}`,
              }}
              animate={{
                x: [
                  Math.cos((p.angle * Math.PI) / 180) * p.distance,
                  0,
                ],
                y: [
                  Math.sin((p.angle * Math.PI) / 180) * p.distance,
                  0,
                ],
                opacity: [0.8, 0],
                scale: [1, 0.2],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeIn",
              }}
            />
          ))}

          {/* Outer portal ring */}
          <svg className="absolute" width="280" height="280" viewBox="0 0 280 280">
            <defs>
              <filter id="portalGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
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
              strokeDasharray="15 10"
              filter="url(#portalGlow)"
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 360, opacity: 1 }}
              transition={{ rotate: { duration: 40, repeat: Infinity, ease: "linear" }, opacity: { duration: 1 } }}
              style={{ transformOrigin: "center" }}
            />
          </svg>

          {/* Middle ring */}
          <svg className="absolute" width="220" height="220" viewBox="0 0 220 220">
            <motion.circle
              cx="110"
              cy="110"
              r="100"
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth="1.5"
              strokeOpacity="0.5"
              initial={{ rotate: 0 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
          </svg>

          {/* Inner glowing ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "160px",
              height: "160px",
              border: `2px solid ${theme.colors.primary}`,
              boxShadow: `0 0 50px ${theme.colors.primary}50, 0 0 100px ${theme.colors.primary}30, inset 0 0 50px ${theme.colors.primary}20`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 1.2 }}
          />

          {/* Portal core - dimensional rift */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "120px",
              height: "120px",
              background: `radial-gradient(circle, ${theme.colors.primary}40 0%, ${theme.colors.primary}15 40%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Inner vortex */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "80px",
              height: "80px",
              background: `conic-gradient(from 0deg, transparent, ${theme.colors.primary}30, transparent, ${theme.colors.primary}20, transparent)`,
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Human figure being drawn in */}
          <motion.div
            className="absolute flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.3, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
            }}
            transition={{ delay: 1, duration: 1.5 }}
          >
            <motion.svg 
              width="55" 
              height="100" 
              viewBox="0 0 55 100" 
              fill="none"
              animate={{
                y: [0, -3, 0],
                filter: [
                  `drop-shadow(0 0 8px ${theme.colors.primary}50)`,
                  `drop-shadow(0 0 15px ${theme.colors.primary}80)`,
                  `drop-shadow(0 0 8px ${theme.colors.primary}50)`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Head */}
              <ellipse cx="27.5" cy="12" rx="10" ry="12" fill="#0c1a2a" stroke={theme.colors.primary} strokeWidth="1.5" strokeOpacity="0.7" />
              
              {/* Neck */}
              <path d="M27.5 24 L27.5 28" stroke="#0c1a2a" strokeWidth="6" strokeLinecap="round" />
              <path d="M27.5 24 L27.5 28" stroke={theme.colors.primary} strokeWidth="1" strokeOpacity="0.6" />
              
              {/* Torso */}
              <path d="M27.5 28 Q27.5 35 27.5 50" stroke="#0c1a2a" strokeWidth="14" strokeLinecap="round" />
              <ellipse cx="27.5" cy="38" rx="12" ry="14" fill="#0c1a2a" stroke={theme.colors.primary} strokeWidth="1" strokeOpacity="0.5" />
              
              {/* Arms */}
              <path d="M15 32 Q10 42 8 52" stroke="#0c1a2a" strokeWidth="6" strokeLinecap="round" />
              <path d="M15 32 Q10 42 8 52" stroke={theme.colors.primary} strokeWidth="1" strokeOpacity="0.5" />
              <path d="M40 32 Q45 42 47 52" stroke="#0c1a2a" strokeWidth="6" strokeLinecap="round" />
              <path d="M40 32 Q45 42 47 52" stroke={theme.colors.primary} strokeWidth="1" strokeOpacity="0.5" />
              
              {/* Legs */}
              <path d="M22 50 Q18 65 15 85" stroke="#0c1a2a" strokeWidth="7" strokeLinecap="round" />
              <path d="M22 50 Q18 65 15 85" stroke={theme.colors.primary} strokeWidth="1" strokeOpacity="0.5" />
              <path d="M33 50 Q37 65 40 85" stroke="#0c1a2a" strokeWidth="7" strokeLinecap="round" />
              <path d="M33 50 Q37 65 40 85" stroke={theme.colors.primary} strokeWidth="1" strokeOpacity="0.5" />

              {/* Energy aura effect */}
              <motion.ellipse 
                cx="27.5" 
                cy="45" 
                rx="20" 
                ry="35" 
                fill="none" 
                stroke={theme.colors.primary} 
                strokeWidth="1"
                strokeOpacity="0.3"
                animate={{
                  ry: [35, 40, 35],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.svg>
          </motion.div>

          {/* Energy wisps being pulled toward figure */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`wisp-${i}`}
              className="absolute"
              style={{
                width: "2px",
                height: "20px",
                background: `linear-gradient(to bottom, ${theme.colors.primary}, transparent)`,
                borderRadius: "2px",
              }}
              animate={{
                y: [-80, 0],
                x: [Math.sin(i * 60 * Math.PI / 180) * 60, 0],
                opacity: [0.6, 0],
                scale: [1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeIn",
              }}
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

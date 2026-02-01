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

  // Scattered particles/fragments
  const particles = useMemo(() => 
    [...Array(100)].map((_, i) => {
      const colors = ["#00bfff", "#ff1493", "#ff6b35", "#9370db", "#40e0d0", "#ffffff"];
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 4,
        type: Math.random() > 0.5 ? "triangle" : "square",
      };
    }), []
  );

  // Swirling energy particles around portal
  const portalParticles = useMemo(() =>
    [...Array(40)].map((_, i) => ({
      id: i,
      angle: (i / 40) * 360,
      distance: 100 + Math.random() * 40,
      size: 2 + Math.random() * 4,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 3,
    })), []
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#0a0a15" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Deep space background */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 60%, #1a1a35 0%, #0a0a15 50%, #050508 100%)",
          }}
        />

        {/* Scattered debris particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              clipPath: p.type === "triangle" 
                ? "polygon(50% 0%, 0% 100%, 100% 100%)" 
                : "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
              transform: `rotate(${p.rotation}deg)`,
              opacity: 0.7,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.random() > 0.5 ? 10 : -10, 0],
              rotate: [p.rotation, p.rotation + 180, p.rotation + 360],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Title */}
        <motion.h1
          className="absolute top-10 md:top-14 text-4xl md:text-5xl font-display font-bold tracking-[0.15em] z-20"
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
          className="absolute top-24 md:top-28 text-sm md:text-base max-w-sm text-center px-6 leading-relaxed font-display font-bold z-20"
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

        {/* Central portal and figure container */}
        <div className="relative flex items-center justify-center" style={{ width: "350px", height: "400px" }}>
          
          {/* Outer swirling energy */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "320px",
              height: "320px",
              background: `conic-gradient(from 0deg, transparent, rgba(100,180,255,0.1), transparent, rgba(180,100,255,0.1), transparent)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Swirling particles around portal */}
          {portalParticles.map((p) => (
            <motion.div
              key={`portal-p-${p.id}`}
              className="absolute rounded-full"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: "rgba(200,220,255,0.8)",
                boxShadow: "0 0 6px rgba(200,220,255,0.8)",
              }}
              animate={{
                x: [
                  Math.cos((p.angle * Math.PI) / 180) * p.distance,
                  Math.cos(((p.angle + 180) * Math.PI) / 180) * p.distance,
                  Math.cos((p.angle * Math.PI) / 180) * p.distance,
                ],
                y: [
                  Math.sin((p.angle * Math.PI) / 180) * p.distance,
                  Math.sin(((p.angle + 180) * Math.PI) / 180) * p.distance,
                  Math.sin((p.angle * Math.PI) / 180) * p.distance,
                ],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: p.duration * 2,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Portal outer ring - swirling energy */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "260px",
              height: "260px",
              background: `conic-gradient(from 0deg, 
                rgba(100,180,255,0.3), 
                rgba(255,255,255,0.5), 
                rgba(180,100,255,0.3), 
                rgba(255,255,255,0.5), 
                rgba(100,180,255,0.3))`,
              filter: "blur(8px)",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* Portal middle glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "220px",
              height: "220px",
              background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(150,200,255,0.6) 40%, rgba(100,150,255,0.3) 70%, transparent 100%)",
              filter: "blur(3px)",
            }}
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Portal bright core */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "160px",
              height: "160px",
              background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(200,230,255,0.9) 30%, rgba(150,200,255,0.5) 60%, transparent 100%)",
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          {/* Human figure - ascending pose with arms raised */}
          <motion.div
            className="absolute z-10"
            style={{ bottom: "20px" }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1.5 }}
          >
            <motion.svg 
              width="90" 
              height="180" 
              viewBox="0 0 90 180" 
              fill="none"
              animate={{
                y: [0, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                filter: "drop-shadow(0 0 15px rgba(100,150,255,0.5))",
              }}
            >
              <defs>
                <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1a2a40" />
                  <stop offset="50%" stopColor="#0f1825" />
                  <stop offset="100%" stopColor="#0a1015" />
                </linearGradient>
                <linearGradient id="glowEdge" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(100,180,255,0.3)" />
                  <stop offset="50%" stopColor="rgba(150,200,255,0.5)" />
                  <stop offset="100%" stopColor="rgba(100,180,255,0.3)" />
                </linearGradient>
              </defs>
              
              {/* Head */}
              <ellipse cx="45" cy="22" rx="12" ry="14" fill="url(#bodyGrad)" stroke="url(#glowEdge)" strokeWidth="1" />
              
              {/* Neck */}
              <rect x="41" y="35" width="8" height="8" fill="url(#bodyGrad)" />
              
              {/* Torso */}
              <path
                d="M30 43 
                   Q28 48 28 55 
                   L28 85 
                   Q28 95 35 100 
                   L40 102 
                   L45 103 
                   L50 102 
                   L55 100 
                   Q62 95 62 85 
                   L62 55 
                   Q62 48 60 43 
                   L55 42 
                   Q45 40 35 42 
                   Z"
                fill="url(#bodyGrad)"
                stroke="url(#glowEdge)"
                strokeWidth="0.5"
              />
              
              {/* Left arm - raised up */}
              <path
                d="M30 45
                   Q22 42 18 30
                   L15 15
                   Q14 8 18 5
                   L22 5
                   Q26 8 25 15
                   L26 28
                   Q27 38 30 43"
                fill="url(#bodyGrad)"
                stroke="url(#glowEdge)"
                strokeWidth="0.5"
              />
              
              {/* Left hand */}
              <path
                d="M18 5 L14 0 M18 5 L17 1 M18 5 L20 2 M18 5 L22 3 M18 5 L24 5"
                stroke="#1a2a40"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Right arm - raised up */}
              <path
                d="M60 45
                   Q68 42 72 30
                   L75 15
                   Q76 8 72 5
                   L68 5
                   Q64 8 65 15
                   L64 28
                   Q63 38 60 43"
                fill="url(#bodyGrad)"
                stroke="url(#glowEdge)"
                strokeWidth="0.5"
              />
              
              {/* Right hand */}
              <path
                d="M72 5 L76 0 M72 5 L73 1 M72 5 L70 2 M72 5 L68 3 M72 5 L66 5"
                stroke="#1a2a40"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Left leg */}
              <path
                d="M40 102
                   L38 120
                   L36 140
                   L35 155
                   Q34 165 37 172
                   L43 172
                   Q46 168 45 160
                   L45 140
                   L45 115
                   L45 103"
                fill="url(#bodyGrad)"
                stroke="url(#glowEdge)"
                strokeWidth="0.5"
              />
              
              {/* Right leg */}
              <path
                d="M50 102
                   L52 120
                   L54 140
                   L55 155
                   Q56 165 53 172
                   L47 172
                   Q44 168 45 160
                   L45 140
                   L45 115
                   L45 103"
                fill="url(#bodyGrad)"
                stroke="url(#glowEdge)"
                strokeWidth="0.5"
              />

              {/* Energy aura around figure */}
              <motion.ellipse
                cx="45"
                cy="90"
                rx="35"
                ry="70"
                fill="none"
                stroke="rgba(100,180,255,0.2)"
                strokeWidth="2"
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.svg>
          </motion.div>
        </div>

        {/* Begin Ascension Button */}
        <motion.button
          onClick={handleBeginAscension}
          className="absolute bottom-20 flex items-center gap-3 z-20"
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
              background: `linear-gradient(180deg, ${theme.colors.primary}15 0%, ${theme.colors.primary}08 100%)`,
              border: `1px solid ${theme.colors.primary}70`,
              color: theme.colors.primary,
              boxShadow: `0 0 25px ${theme.colors.primary}30, inset 0 0 25px ${theme.colors.primary}15`,
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent, ${theme.colors.primary}25, transparent)`,
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
          className="absolute bottom-8 text-xs tracking-[0.4em] font-mono z-20"
          style={{ color: `${theme.colors.primary}50` }}
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
            style={{ transformOrigin: "center", background: "white" }}
            initial={{ scale: 0, borderRadius: "100%" }}
            animate={{ scale: 3, borderRadius: "0%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

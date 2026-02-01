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
            style={{ bottom: "0px" }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1.5 }}
          >
            <motion.svg 
              width="120" 
              height="220" 
              viewBox="0 0 120 220" 
              fill="none"
              animate={{
                y: [0, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                filter: "drop-shadow(0 0 25px rgba(100,150,255,0.5))",
              }}
            >
              <defs>
                <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#15202d" />
                  <stop offset="100%" stopColor="#080c12" />
                </linearGradient>
              </defs>
              
              {/* Head */}
              <ellipse cx="60" cy="18" rx="12" ry="14" fill="url(#bodyGrad)" />
              
              {/* Neck */}
              <path d="M54 30 Q60 34 66 30 L64 38 Q60 40 56 38 Z" fill="url(#bodyGrad)" />
              
              {/* Torso - with natural curves */}
              <path
                d="M40 42
                   Q38 46 38 55
                   L40 75
                   Q42 90 45 100
                   Q48 108 52 112
                   L60 114
                   L68 112
                   Q72 108 75 100
                   Q78 90 80 75
                   L82 55
                   Q82 46 80 42
                   Q72 38 60 38
                   Q48 38 40 42
                   Z"
                fill="url(#bodyGrad)"
              />
              
              {/* Left arm raised */}
              <path
                d="M40 44
                   Q32 42 26 34
                   Q20 26 16 16
                   Q14 10 18 6
                   Q22 4 26 8
                   Q30 14 32 22
                   Q34 30 36 38
                   Q38 42 40 44
                   Z"
                fill="url(#bodyGrad)"
              />
              
              {/* Left hand with fingers */}
              <path
                d="M18 6 Q16 2 14 0 M18 6 Q18 2 17 0 M18 6 Q20 3 21 1 M18 6 Q23 4 25 3 M18 6 Q26 7 28 7"
                stroke="#15202d"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              
              {/* Right arm raised */}
              <path
                d="M80 44
                   Q88 42 94 34
                   Q100 26 104 16
                   Q106 10 102 6
                   Q98 4 94 8
                   Q90 14 88 22
                   Q86 30 84 38
                   Q82 42 80 44
                   Z"
                fill="url(#bodyGrad)"
              />
              
              {/* Right hand with fingers */}
              <path
                d="M102 6 Q104 2 106 0 M102 6 Q102 2 103 0 M102 6 Q100 3 99 1 M102 6 Q97 4 95 3 M102 6 Q94 7 92 7"
                stroke="#15202d"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              
              {/* Hips */}
              <path
                d="M45 100
                   Q42 106 42 112
                   Q42 118 46 122
                   L60 124
                   L74 122
                   Q78 118 78 112
                   Q78 106 75 100
                   Q68 108 60 108
                   Q52 108 45 100
                   Z"
                fill="url(#bodyGrad)"
              />
              
              {/* Left thigh with curve */}
              <path
                d="M46 122
                   Q42 128 40 138
                   Q38 148 38 158
                   Q38 164 42 168
                   L50 168
                   Q54 164 54 158
                   Q54 148 54 138
                   Q54 128 54 122
                   L60 124
                   L46 122
                   Z"
                fill="url(#bodyGrad)"
              />
              
              {/* Left calf */}
              <path
                d="M42 168
                   Q38 176 38 186
                   Q38 196 40 204
                   Q42 210 46 212
                   L52 212
                   Q54 208 54 202
                   Q54 192 52 182
                   Q50 172 50 168
                   Z"
                fill="url(#bodyGrad)"
              />
              
              {/* Right thigh with curve */}
              <path
                d="M74 122
                   Q78 128 80 138
                   Q82 148 82 158
                   Q82 164 78 168
                   L70 168
                   Q66 164 66 158
                   Q66 148 66 138
                   Q66 128 66 122
                   L60 124
                   L74 122
                   Z"
                fill="url(#bodyGrad)"
              />
              
              {/* Right calf */}
              <path
                d="M78 168
                   Q82 176 82 186
                   Q82 196 80 204
                   Q78 210 74 212
                   L68 212
                   Q66 208 66 202
                   Q66 192 68 182
                   Q70 172 70 168
                   Z"
                fill="url(#bodyGrad)"
              />

              {/* Energy aura around figure */}
              <motion.ellipse
                cx="60"
                cy="110"
                rx="50"
                ry="90"
                fill="none"
                stroke="rgba(100,180,255,0.12)"
                strokeWidth="2"
                animate={{
                  opacity: [0.08, 0.2, 0.08],
                  scale: [1, 1.03, 1],
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

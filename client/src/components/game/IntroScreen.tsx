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

  // Tech ring segments
  const outerSegments = useMemo(() => 
    [...Array(24)].map((_, i) => ({
      id: i,
      angle: (i / 24) * 360,
      length: 30 + Math.random() * 40,
    })), []
  );

  const middleSegments = useMemo(() => 
    [...Array(16)].map((_, i) => ({
      id: i,
      angle: (i / 16) * 360 + 11.25,
      length: 20 + Math.random() * 30,
    })), []
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#0a1420" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Dark gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, #0f2035 0%, #0a1420 40%, #050a10 100%)",
          }}
        />

        {/* Title */}
        <motion.h1
          className="absolute top-10 md:top-14 text-4xl md:text-5xl font-display font-bold tracking-[0.15em] z-20"
          style={{ 
            color: "#4dc3ff",
            textShadow: "0 0 40px rgba(77,195,255,0.5)",
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

        {/* Central tech portal */}
        <div className="relative flex items-center justify-center" style={{ width: "400px", height: "400px" }}>
          
          {/* Outermost tech ring with segments */}
          <motion.svg 
            className="absolute" 
            width="380" 
            height="380" 
            viewBox="0 0 380 380"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Outer ring */}
            <motion.circle
              cx="190"
              cy="190"
              r="175"
              fill="none"
              stroke="#2a5a7a"
              strokeWidth="2"
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "190px 190px" }}
            />
            
            {/* Outer tech segments */}
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "190px 190px" }}
            >
              {outerSegments.map((seg) => {
                const angleRad = (seg.angle * Math.PI) / 180;
                const x1 = 190 + Math.cos(angleRad) * 160;
                const y1 = 190 + Math.sin(angleRad) * 160;
                const x2 = 190 + Math.cos(angleRad) * (160 + seg.length);
                const y2 = 190 + Math.sin(angleRad) * (160 + seg.length);
                return (
                  <line
                    key={seg.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#4dc3ff"
                    strokeWidth="2"
                    filter="url(#glow)"
                    opacity="0.7"
                  />
                );
              })}
            </motion.g>
          </motion.svg>

          {/* Second ring layer */}
          <motion.svg 
            className="absolute" 
            width="320" 
            height="320" 
            viewBox="0 0 320 320"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            {/* Middle ring */}
            <motion.circle
              cx="160"
              cy="160"
              r="145"
              fill="none"
              stroke="#3a7a9a"
              strokeWidth="3"
              strokeDasharray="20 10"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "160px 160px" }}
            />
            
            {/* Middle tech segments */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "160px 160px" }}
            >
              {middleSegments.map((seg) => {
                const angleRad = (seg.angle * Math.PI) / 180;
                const x1 = 160 + Math.cos(angleRad) * 120;
                const y1 = 160 + Math.sin(angleRad) * 120;
                const x2 = 160 + Math.cos(angleRad) * (120 + seg.length);
                const y2 = 160 + Math.sin(angleRad) * (120 + seg.length);
                return (
                  <line
                    key={seg.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#4dc3ff"
                    strokeWidth="1.5"
                    filter="url(#glow)"
                    opacity="0.6"
                  />
                );
              })}
            </motion.g>
          </motion.svg>

          {/* Inner ring */}
          <motion.svg 
            className="absolute" 
            width="260" 
            height="260" 
            viewBox="0 0 260 260"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
          >
            <circle
              cx="130"
              cy="130"
              r="115"
              fill="none"
              stroke="#4dc3ff"
              strokeWidth="2"
              opacity="0.5"
            />
            <motion.circle
              cx="130"
              cy="130"
              r="100"
              fill="none"
              stroke="#4dc3ff"
              strokeWidth="1"
              strokeDasharray="8 8"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "130px 130px" }}
              opacity="0.4"
            />
          </motion.svg>

          {/* Glowing core */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "180px",
              height: "180px",
              background: "radial-gradient(circle, rgba(77,195,255,0.4) 0%, rgba(40,120,180,0.2) 40%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Bright inner core */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "120px",
              height: "120px",
              background: "radial-gradient(circle, rgba(150,220,255,0.5) 0%, rgba(77,195,255,0.3) 50%, transparent 80%)",
            }}
            animate={{
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Human silhouette - standing pose */}
          <motion.div
            className="absolute z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
          >
            <motion.svg 
              width="70" 
              height="160" 
              viewBox="0 0 70 160" 
              fill="none"
              animate={{
                y: [0, -3, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <defs>
                <linearGradient id="silhouetteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1a2a3a" />
                  <stop offset="100%" stopColor="#0a1520" />
                </linearGradient>
              </defs>
              
              {/* Human silhouette - anatomically curved */}
              <path
                d="M35 0
                   C44 0 50 8 50 18
                   C50 28 44 35 35 35
                   C26 35 20 28 20 18
                   C20 8 26 0 35 0
                   Z"
                fill="url(#silhouetteGrad)"
              />
              
              {/* Neck */}
              <path
                d="M30 33 L30 40 Q35 42 40 40 L40 33"
                fill="url(#silhouetteGrad)"
              />
              
              {/* Torso with natural curves */}
              <path
                d="M22 40
                   Q18 42 16 48
                   L14 60
                   Q14 70 16 80
                   Q18 88 22 94
                   L28 96
                   Q32 97 35 97
                   Q38 97 42 96
                   L48 94
                   Q52 88 54 80
                   Q56 70 56 60
                   L54 48
                   Q52 42 48 40
                   Q42 38 35 38
                   Q28 38 22 40
                   Z"
                fill="url(#silhouetteGrad)"
              />
              
              {/* Left arm */}
              <path
                d="M16 48
                   Q12 50 10 56
                   L8 70
                   Q6 80 6 88
                   Q6 92 8 94
                   L12 94
                   Q14 92 14 88
                   L16 74
                   Q18 64 18 56
                   L16 48
                   Z"
                fill="url(#silhouetteGrad)"
              />
              
              {/* Right arm */}
              <path
                d="M54 48
                   Q58 50 60 56
                   L62 70
                   Q64 80 64 88
                   Q64 92 62 94
                   L58 94
                   Q56 92 56 88
                   L54 74
                   Q52 64 52 56
                   L54 48
                   Z"
                fill="url(#silhouetteGrad)"
              />
              
              {/* Hips */}
              <path
                d="M24 94
                   Q22 98 22 102
                   L24 106
                   Q30 108 35 108
                   Q40 108 46 106
                   L48 102
                   Q48 98 46 94
                   L42 96
                   Q38 97 35 97
                   Q32 97 28 96
                   L24 94
                   Z"
                fill="url(#silhouetteGrad)"
              />
              
              {/* Left leg with curves */}
              <path
                d="M24 106
                   Q20 110 19 118
                   Q18 128 18 138
                   Q18 148 20 154
                   L28 154
                   Q30 148 30 140
                   Q30 130 31 122
                   Q32 114 34 108
                   L35 108
                   Q32 108 24 106
                   Z"
                fill="url(#silhouetteGrad)"
              />
              
              {/* Right leg with curves */}
              <path
                d="M46 106
                   Q50 110 51 118
                   Q52 128 52 138
                   Q52 148 50 154
                   L42 154
                   Q40 148 40 140
                   Q40 130 39 122
                   Q38 114 36 108
                   L35 108
                   Q38 108 46 106
                   Z"
                fill="url(#silhouetteGrad)"
              />
              
              {/* Feet */}
              <path d="M18 152 L16 158 L30 158 L30 154 L20 154 Z" fill="url(#silhouetteGrad)" />
              <path d="M52 152 L54 158 L40 158 L40 154 L50 154 Z" fill="url(#silhouetteGrad)" />
            </motion.svg>
          </motion.div>

          {/* Vertical scan line */}
          <motion.div
            className="absolute w-px h-48"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(77,195,255,0.6), transparent)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 2 }}
          />
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
            style={{ color: "#4dc3ff" }}
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            &lt;
          </motion.span>

          <div
            className="relative px-8 py-3 font-display tracking-[0.3em] uppercase text-lg"
            style={{
              background: "linear-gradient(180deg, rgba(77,195,255,0.15) 0%, rgba(77,195,255,0.05) 100%)",
              border: "1px solid rgba(77,195,255,0.5)",
              color: "#4dc3ff",
              boxShadow: "0 0 25px rgba(77,195,255,0.2), inset 0 0 25px rgba(77,195,255,0.1)",
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(77,195,255,0.2), transparent)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <span className="relative z-10">Begin Ascension</span>
          </div>

          <motion.span
            className="text-2xl font-mono"
            style={{ color: "#4dc3ff" }}
            animate={{ x: [2, -2, 2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            &gt;
          </motion.span>
        </motion.button>

        {/* Bottom tech text */}
        <motion.div
          className="absolute bottom-8 text-xs tracking-[0.4em] font-mono z-20"
          style={{ color: "rgba(77,195,255,0.4)" }}
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
            style={{ transformOrigin: "center", background: "#4dc3ff" }}
            initial={{ scale: 0, borderRadius: "100%" }}
            animate={{ scale: 3, borderRadius: "0%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

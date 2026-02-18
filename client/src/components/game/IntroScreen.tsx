import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Check } from "lucide-react";

interface IntroScreenProps {
  onBeginAscension: () => void;
}

export function IntroScreen({ onBeginAscension }: IntroScreenProps) {
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
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Dark blue gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to bottom, 
                #0a0f1a 0%, 
                #0d1424 25%, 
                #111a2e 50%,
                #0d1424 75%,
                #0a0f1a 100%
              )
            `,
          }}
        />

        {/* Subtle glow behind card */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "500px",
              height: "400px",
              background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>

        {/* Main card container */}
        <motion.div
          className="relative z-10 flex flex-col items-center px-8 py-12 mx-4"
          style={{
            background: "linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)",
            borderRadius: "16px",
            border: "1px solid rgba(99,102,241,0.3)",
            boxShadow: "0 0 60px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
            maxWidth: "400px",
            width: "100%",
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {/* Shield icon with checkmark */}
          <motion.div
            className="relative mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{
                width: "80px",
                height: "80px",
              }}
            >
              {/* Glow behind shield */}
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)",
                  filter: "blur(15px)",
                }}
              />
              {/* Shield */}
              <Shield 
                size={64} 
                strokeWidth={1.5}
                style={{ 
                  color: "#8b5cf6",
                  filter: "drop-shadow(0 0 10px rgba(139,92,246,0.5))",
                }}
              />
              {/* Checkmark inside shield */}
              <Check 
                size={28} 
                strokeWidth={3}
                className="absolute"
                style={{ 
                  color: "#a78bfa",
                  marginTop: "-4px",
                }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-3xl md:text-4xl font-display font-bold tracking-wide text-center mb-4"
            style={{ 
              color: "#a78bfa",
              textShadow: "0 0 30px rgba(167,139,250,0.5)",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            SOLO LIFE PRO
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-center text-sm md:text-base mb-8 px-4"
            style={{ 
              color: "rgba(148,163,184,0.9)",
              lineHeight: "1.6",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            Gamify your existence. Track habits. Earn XP. Advance through phases.
          </motion.p>

          {/* Initialize System Button */}
          <motion.button
            onClick={handleBeginAscension}
            className="w-full max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-testid="button-begin-ascension"
          >
            <div
              className="relative flex items-center justify-center gap-2 px-6 py-3 font-display tracking-wider uppercase text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                color: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(124,58,237,0.4), 0 0 40px rgba(99,102,241,0.2)",
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
              />
              <Zap size={18} className="relative z-10" />
              <span className="relative z-10">INITIALIZE SYSTEM</span>
            </div>
          </motion.button>

          {/* Secure connection text */}
          <motion.p
            className="mt-4 text-xs tracking-widest uppercase"
            style={{ color: "rgba(100,116,139,0.7)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
          >
            SECURE CONNECTION REQUIRED
          </motion.p>
        </motion.div>

        {/* System version at bottom */}
        <motion.p
          className="absolute bottom-8 text-xs tracking-wider"
          style={{ color: "rgba(100,116,139,0.5)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          SYSTEM VERSION 2.0.4 // BUILD: NEON_GENESIS
        </motion.p>

        {/* Transition overlay */}
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            style={{ 
              transformOrigin: "center", 
              background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" 
            }}
            initial={{ scale: 0, borderRadius: "100%" }}
            animate={{ scale: 3, borderRadius: "0%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

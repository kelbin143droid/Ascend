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
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Positive, uplifting gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to bottom, 
                #1a2a4a 0%, 
                #2a4a6a 25%, 
                #3a5a7a 50%,
                #4a6a8a 75%,
                #3a5070 100%
              )
            `,
          }}
        />

        {/* Soft light rays from center */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "600px",
              height: "600px",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: "rgba(255,255,255,0.6)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Title */}
        <motion.h1
          className="absolute top-12 md:top-16 text-3xl md:text-4xl font-display font-bold tracking-[0.2em] z-20"
          style={{ 
            color: "#ffffff",
            textShadow: "0 0 30px rgba(255,255,255,0.5)",
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          WELCOME
        </motion.h1>

        {/* Central portal frame */}
        <motion.div 
          className="relative flex items-center justify-center"
          style={{ width: "280px", height: "280px" }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          {/* Outer glow */}
          <div
            className="absolute rounded-full"
            style={{
              width: "260px",
              height: "260px",
              background: "radial-gradient(circle, rgba(100,180,255,0.2) 0%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />

          {/* Portal ring - outer */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "240px",
              height: "240px",
              border: "4px solid rgba(100,180,255,0.4)",
              boxShadow: "0 0 20px rgba(100,180,255,0.3), inset 0 0 20px rgba(100,180,255,0.1)",
            }}
          />

          {/* Portal ring - glowing inner edge */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "220px",
              height: "220px",
              border: "3px solid #6dd3ff",
              boxShadow: "0 0 15px rgba(109,211,255,0.6), 0 0 30px rgba(109,211,255,0.3)",
            }}
            animate={{
              boxShadow: [
                "0 0 15px rgba(109,211,255,0.6), 0 0 30px rgba(109,211,255,0.3)",
                "0 0 25px rgba(109,211,255,0.8), 0 0 40px rgba(109,211,255,0.4)",
                "0 0 15px rgba(109,211,255,0.6), 0 0 30px rgba(109,211,255,0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Bright inner circle */}
          <div
            className="absolute rounded-full"
            style={{
              width: "200px",
              height: "200px",
              background: "radial-gradient(circle, rgba(150,200,255,0.3) 0%, rgba(100,150,200,0.1) 100%)",
            }}
          />

          {/* Floating particles around portal */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: "4px",
                height: "4px",
                background: "#6dd3ff",
                boxShadow: "0 0 8px #6dd3ff",
              }}
              animate={{
                x: [
                  Math.cos((i / 8) * Math.PI * 2) * 90,
                  Math.cos((i / 8) * Math.PI * 2 + Math.PI) * 95,
                  Math.cos((i / 8) * Math.PI * 2) * 90,
                ],
                y: [
                  Math.sin((i / 8) * Math.PI * 2) * 90,
                  Math.sin((i / 8) * Math.PI * 2 + Math.PI) * 95,
                  Math.sin((i / 8) * Math.PI * 2) * 90,
                ],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 4 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="mt-6 text-center text-lg font-display z-20"
          style={{ 
            color: "rgba(255,255,255,0.8)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          Begin Your Journey
        </motion.p>

        {/* Accept Button */}
        <motion.button
          onClick={handleBeginAscension}
          className="mt-8 z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          data-testid="button-begin-ascension"
        >
          <div
            className="relative px-12 py-3 font-display tracking-[0.2em] uppercase text-lg font-bold"
            style={{
              background: "linear-gradient(180deg, rgba(100,180,255,0.3) 0%, rgba(80,150,220,0.2) 100%)",
              border: "2px solid #6dd3ff",
              color: "#ffffff",
              boxShadow: "0 0 20px rgba(109,211,255,0.3), inset 0 0 15px rgba(109,211,255,0.1)",
              borderRadius: "4px",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <span className="relative z-10">START</span>
          </div>
        </motion.button>

        {/* Transition overlay */}
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            style={{ transformOrigin: "center", background: "#ffffff" }}
            initial={{ scale: 0, borderRadius: "100%" }}
            animate={{ scale: 3, borderRadius: "0%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

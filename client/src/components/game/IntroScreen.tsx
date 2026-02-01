import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroScreenProps {
  onBeginAscension: () => void;
}

export function IntroScreen({ onBeginAscension }: IntroScreenProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleBeginAscension = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      onBeginAscension();
    }, 800);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Clean gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)",
          }}
        />

        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Title */}
        <motion.h1
          className="absolute top-16 text-2xl md:text-3xl font-display font-medium tracking-[0.2em] z-20"
          style={{ 
            color: "#a0a8b8",
          }}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          WELCOME
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="absolute top-24 md:top-26 text-sm font-light tracking-wide z-20"
          style={{ color: "#6a7080" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Begin your journey
        </motion.p>

        {/* Portal container */}
        <motion.div 
          className="relative flex items-center justify-center"
          style={{ width: "300px", height: "300px" }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Outer ring - subtle */}
          <div
            className="absolute rounded-full"
            style={{
              width: "280px",
              height: "280px",
              background: "transparent",
              border: "1px solid rgba(120,130,150,0.2)",
            }}
          />

          {/* Inner ring with subtle glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "240px",
              height: "240px",
              border: "2px solid rgba(100,120,180,0.4)",
              boxShadow: "0 0 30px rgba(100,120,180,0.1), inset 0 0 30px rgba(100,120,180,0.05)",
            }}
          />

          {/* Inner area with subtle space theme */}
          <div
            className="absolute rounded-full overflow-hidden"
            style={{
              width: "230px",
              height: "230px",
              background: "radial-gradient(circle at 30% 30%, rgba(40,50,80,0.5) 0%, rgba(15,15,30,0.95) 70%)",
            }}
          >
            {/* Subtle stars */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${1 + Math.random()}px`,
                  height: `${1 + Math.random()}px`,
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  background: "#ffffff",
                  opacity: 0.3 + Math.random() * 0.4,
                }}
                animate={{
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Center icon - minimal */}
          <motion.div
            className="absolute z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "rgba(30,40,60,0.8)",
                border: "1px solid rgba(100,120,180,0.4)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              {/* Simple arrow/start icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M8 5L19 12L8 19V5Z"
                  fill="rgba(140,160,200,0.8)"
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>

        {/* Get Started Button */}
        <motion.button
          onClick={handleBeginAscension}
          className="mt-8 z-20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          data-testid="button-begin-ascension"
        >
          <div
            style={{
              padding: "12px 40px",
              background: "linear-gradient(180deg, rgba(80,100,160,0.3) 0%, rgba(60,80,140,0.2) 100%)",
              border: "1px solid rgba(100,120,180,0.4)",
              borderRadius: "8px",
              color: "#a8b8d0",
              fontSize: "14px",
              fontWeight: "500",
              letterSpacing: "0.1em",
            }}
          >
            Get Started
          </div>
        </motion.button>

        {/* Skip text */}
        <motion.div
          className="mt-4 text-xs z-20 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ color: "#505868" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          Skip for now
        </motion.div>

        {/* Transition overlay */}
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            style={{ background: "#1a1a2e" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

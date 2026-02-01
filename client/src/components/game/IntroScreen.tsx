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
        {/* Dark fantasy background with mountains */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to bottom, 
                #0a1520 0%, 
                #0f2030 30%, 
                #1a3045 50%,
                #0f2530 70%,
                #0a1520 100%
              )
            `,
          }}
        />

        {/* Mountain silhouettes */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute bottom-0 w-full h-2/3" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice">
            {/* Far mountains */}
            <path
              d="M0 200 L0 140 L40 100 L80 130 L120 80 L160 120 L200 70 L240 110 L280 60 L320 100 L360 80 L400 120 L400 200 Z"
              fill="#1a2a3a"
              opacity="0.6"
            />
            {/* Near mountains */}
            <path
              d="M0 200 L0 160 L50 120 L100 150 L150 100 L200 140 L250 90 L300 130 L350 110 L400 150 L400 200 Z"
              fill="#0f1a25"
              opacity="0.8"
            />
          </svg>
        </div>

        {/* Title */}
        <motion.h1
          className="absolute top-12 md:top-16 text-3xl md:text-4xl font-display font-bold tracking-[0.2em] z-20"
          style={{ 
            color: "#4dc3ff",
            textShadow: "0 0 30px rgba(77,195,255,0.5)",
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          INITIATION
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
              background: "radial-gradient(circle, rgba(77,195,255,0.15) 0%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />

          {/* Portal ring - outer */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "240px",
              height: "240px",
              border: "4px solid #2a6080",
              boxShadow: "0 0 20px rgba(77,195,255,0.3), inset 0 0 20px rgba(77,195,255,0.1)",
            }}
          />

          {/* Portal ring - glowing inner edge */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "220px",
              height: "220px",
              border: "3px solid #4dc3ff",
              boxShadow: "0 0 15px rgba(77,195,255,0.6), 0 0 30px rgba(77,195,255,0.3)",
            }}
            animate={{
              boxShadow: [
                "0 0 15px rgba(77,195,255,0.6), 0 0 30px rgba(77,195,255,0.3)",
                "0 0 25px rgba(77,195,255,0.8), 0 0 40px rgba(77,195,255,0.4)",
                "0 0 15px rgba(77,195,255,0.6), 0 0 30px rgba(77,195,255,0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Dark inner circle */}
          <div
            className="absolute rounded-full"
            style={{
              width: "200px",
              height: "200px",
              background: "radial-gradient(circle, #0a1825 0%, #050d15 100%)",
            }}
          />

          {/* Center icon - quest/sword icon */}
          <motion.div
            className="absolute z-10"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <div
              className="relative"
              style={{
                width: "70px",
                height: "70px",
                background: "linear-gradient(135deg, #2a4a60 0%, #1a2a3a 100%)",
                border: "3px solid #c9a227",
                borderRadius: "8px",
                transform: "rotate(45deg)",
                boxShadow: "0 0 15px rgba(201,162,39,0.4), inset 0 0 10px rgba(0,0,0,0.5)",
              }}
            >
              {/* Sword icon inside */}
              <svg
                className="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%) rotate(-45deg)",
                  width: "40px",
                  height: "40px",
                }}
                viewBox="0 0 24 24"
                fill="none"
              >
                {/* Sword blade */}
                <path
                  d="M12 2 L14 4 L14 14 L12 16 L10 14 L10 4 Z"
                  fill="#4dc3ff"
                  stroke="#6dd3ff"
                  strokeWidth="0.5"
                />
                {/* Sword guard */}
                <path
                  d="M8 14 L16 14 L16 15 L8 15 Z"
                  fill="#c9a227"
                />
                {/* Sword handle */}
                <path
                  d="M11 15 L13 15 L13 20 L11 20 Z"
                  fill="#8b6914"
                />
                {/* Pommel */}
                <circle cx="12" cy="21" r="1.5" fill="#c9a227" />
              </svg>
            </div>
          </motion.div>

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: "3px",
                height: "3px",
                background: "#4dc3ff",
                boxShadow: "0 0 6px #4dc3ff",
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
              background: "linear-gradient(180deg, #1a3a50 0%, #0f2535 100%)",
              border: "2px solid #4dc3ff",
              color: "#4dc3ff",
              boxShadow: "0 0 20px rgba(77,195,255,0.3), inset 0 0 15px rgba(77,195,255,0.1)",
              borderRadius: "4px",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(77,195,255,0.2), transparent)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <span className="relative z-10">ACCEPT!</span>
          </div>
        </motion.button>

        {/* Decline text */}
        <motion.div
          className="mt-4 text-sm tracking-[0.15em] font-display z-20 cursor-pointer opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: "#8aa" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          DECLINE
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

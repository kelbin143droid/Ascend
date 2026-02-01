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
        {/* Dark background with mountains */}
        <div 
          className="absolute inset-0"
          style={{
            background: "#101820",
          }}
        />

        {/* Mountain silhouettes */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute bottom-0 w-full" style={{ height: "60%" }} viewBox="0 0 400 150" preserveAspectRatio="xMidYMax slice">
            {/* Far mountains - blue tint */}
            <path
              d="M0 150 L0 100 L30 70 L60 90 L100 50 L140 80 L180 40 L220 70 L260 30 L300 60 L340 45 L380 70 L400 55 L400 150 Z"
              fill="#1a2832"
            />
            {/* Mid mountains */}
            <path
              d="M0 150 L0 110 L40 85 L80 100 L130 70 L180 95 L230 60 L280 85 L330 75 L380 95 L400 80 L400 150 Z"
              fill="#141e26"
            />
            {/* Near mountains */}
            <path
              d="M0 150 L0 125 L50 105 L100 120 L160 100 L220 115 L280 95 L340 115 L400 105 L400 150 Z"
              fill="#0e1418"
            />
          </svg>
        </div>

        {/* Title */}
        <motion.h1
          className="absolute top-14 text-3xl md:text-4xl font-display font-bold tracking-[0.15em] z-20"
          style={{ 
            color: "#5ad4ff",
            textShadow: "0 0 20px rgba(90,212,255,0.5)",
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          INITIATION
        </motion.h1>

        {/* Portal container */}
        <motion.div 
          className="relative flex items-center justify-center"
          style={{ width: "340px", height: "340px" }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          {/* Dark outer ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: "320px",
              height: "320px",
              background: "#1a2530",
              border: "10px solid #1e2a35",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.8)",
            }}
          />

          {/* Cyan glow ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "270px",
              height: "270px",
              border: "3px solid #4dcfff",
              boxShadow: "0 0 12px rgba(77,207,255,0.7), 0 0 25px rgba(77,207,255,0.4), inset 0 0 12px rgba(77,207,255,0.2)",
            }}
            animate={{
              boxShadow: [
                "0 0 12px rgba(77,207,255,0.7), 0 0 25px rgba(77,207,255,0.4), inset 0 0 12px rgba(77,207,255,0.2)",
                "0 0 18px rgba(77,207,255,0.9), 0 0 35px rgba(77,207,255,0.5), inset 0 0 18px rgba(77,207,255,0.3)",
                "0 0 12px rgba(77,207,255,0.7), 0 0 25px rgba(77,207,255,0.4), inset 0 0 12px rgba(77,207,255,0.2)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          {/* Inner universe background */}
          <div
            className="absolute rounded-full overflow-hidden"
            style={{
              width: "260px",
              height: "260px",
              background: "radial-gradient(ellipse at 30% 20%, rgba(80,60,120,0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(40,80,120,0.3) 0%, transparent 40%), radial-gradient(circle, #0a0a18 0%, #050510 100%)",
            }}
          >
            {/* Stars */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: i % 5 === 0 ? "#aaccff" : i % 3 === 0 ? "#ffddaa" : "#ffffff",
                  boxShadow: i % 5 === 0 ? "0 0 4px #aaccff" : "none",
                }}
                animate={{
                  opacity: [0.3, 0.9, 0.3],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
            {/* Nebula clouds */}
            <div
              className="absolute"
              style={{
                width: "100%",
                height: "100%",
                background: "radial-gradient(ellipse at 25% 35%, rgba(100,50,150,0.15) 0%, transparent 40%), radial-gradient(ellipse at 75% 60%, rgba(50,100,150,0.12) 0%, transparent 35%)",
              }}
            />
          </div>

          {/* Diamond icon in center */}
          <motion.div
            className="absolute z-10"
            initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
            animate={{ opacity: 1, scale: 1, rotate: 45 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div
              style={{
                width: "55px",
                height: "55px",
                background: "linear-gradient(135deg, #2a4055 0%, #1a2a38 100%)",
                border: "3px solid #c9a227",
                borderRadius: "6px",
                boxShadow: "0 0 12px rgba(201,162,39,0.4), inset 0 0 8px rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Dagger icon */}
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                style={{ transform: "rotate(-45deg)" }}
              >
                {/* Blade */}
                <path
                  d="M12 2 L14 5 L13.5 15 L12 17 L10.5 15 L10 5 Z"
                  fill="#5ad4ff"
                />
                {/* Guard */}
                <rect x="8" y="15" width="8" height="2" rx="0.5" fill="#c9a227" />
                {/* Handle */}
                <rect x="10.5" y="17" width="3" height="4" fill="#8b6914" />
                {/* Pommel */}
                <circle cx="12" cy="22" r="1.2" fill="#c9a227" />
              </svg>
            </div>
          </motion.div>
        </motion.div>

        {/* Accept Button */}
        <motion.button
          onClick={handleBeginAscension}
          className="mt-6 z-20"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          data-testid="button-begin-ascension"
        >
          <div
            style={{
              padding: "10px 50px",
              background: "linear-gradient(180deg, #1a3545 0%, #122530 100%)",
              border: "2px solid #4dcfff",
              borderRadius: "3px",
              color: "#4dcfff",
              fontSize: "16px",
              fontWeight: "bold",
              letterSpacing: "0.15em",
              boxShadow: "0 0 15px rgba(77,207,255,0.25)",
            }}
          >
            ACCEPT!
          </div>
        </motion.button>

        {/* Decline */}
        <motion.div
          className="mt-3 text-xs tracking-[0.1em] z-20 cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: "#607080" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          DECLINE
        </motion.div>

        {/* Transition overlay */}
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            style={{ transformOrigin: "center", background: "#4dcfff" }}
            initial={{ scale: 0, borderRadius: "100%" }}
            animate={{ scale: 3, borderRadius: "0%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

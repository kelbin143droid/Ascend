import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { User } from "lucide-react";

interface PlayerInfoScreenProps {
  onComplete: (data: { name: string }) => void;
}

export function PlayerInfoScreen({ onComplete }: PlayerInfoScreenProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (name.trim().length > 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        onComplete({ name: name.trim() });
      }, 800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim().length > 0) {
      handleSubmit();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ 
        background: `
          linear-gradient(to bottom, 
            #1a2a4a 0%, 
            #2a4a6a 25%, 
            #3a5a7a 50%,
            #4a6a8a 75%,
            #3a5070 100%
          )
        `
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isSubmitting ? 0 : 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Soft background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            background: "rgba(255,255,255,0.5)",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <motion.div
        className="relative z-10 w-full max-w-md px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ 
              background: "rgba(255,255,255,0.1)",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(255,255,255,0.2)",
                "0 0 30px rgba(255,255,255,0.3)",
                "0 0 20px rgba(255,255,255,0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <User className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-display mb-2 text-white">
            What's your name?
          </h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            Let us know what to call you
          </p>
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full px-4 py-4 text-lg text-center font-display bg-white/10 border-2 rounded-lg focus:outline-none transition-all"
            style={{
              borderColor: name ? "rgba(109,211,255,0.8)" : "rgba(255,255,255,0.2)",
              color: "#ffffff",
            }}
            data-testid="input-player-name"
            autoFocus
          />
          <motion.div
            className="absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full"
            style={{ background: "#6dd3ff" }}
            initial={{ width: 0 }}
            animate={{ width: name ? "80%" : "0%" }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={name.trim().length === 0}
          className="w-full py-4 font-display tracking-wider uppercase rounded-lg transition-all"
          style={{
            background: name.trim().length > 0 
              ? "linear-gradient(180deg, rgba(109,211,255,0.8) 0%, rgba(80,180,240,0.8) 100%)" 
              : "rgba(255,255,255,0.1)",
            color: name.trim().length > 0 ? "#000" : "rgba(255,255,255,0.3)",
            cursor: name.trim().length > 0 ? "pointer" : "not-allowed",
            boxShadow: name.trim().length > 0 ? "0 0 20px rgba(109,211,255,0.4)" : "none",
          }}
          whileHover={name.trim().length > 0 ? { scale: 1.02 } : {}}
          whileTap={name.trim().length > 0 ? { scale: 0.98 } : {}}
          data-testid="button-continue"
        >
          Continue
        </motion.button>
      </motion.div>

      {isSubmitting && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(26,42,74,1)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="text-xl font-display tracking-widest text-white"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            GETTING READY...
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

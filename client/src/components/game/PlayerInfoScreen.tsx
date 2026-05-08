import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface PlayerInfoScreenProps {
  onComplete: (data: { name: string }) => void;
}

export function PlayerInfoScreen({ onComplete }: PlayerInfoScreenProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accent = theme?.colors?.primary ?? "#8b5cf6";
  const accentGlow = `${accent}35`;

  const particles = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      y: 10 + Math.random() * 85,
      size: 1 + Math.random() * 2.2,
      duration: 6 + Math.random() * 6,
      delay: Math.random() * 5,
      driftX: (Math.random() - 0.5) * 40,
      driftY: -(20 + Math.random() * 50),
    }))
  ).current;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 700);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    if (name.trim().length === 0) return;
    setIsSubmitting(true);
    setTimeout(() => onComplete({ name: name.trim() }), 900);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #020810 0%, #030d1c 40%, #040a16 70%, #020810 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isSubmitting ? 0 : 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "35%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 560,
          height: 400,
          background: `radial-gradient(ellipse, ${accentGlow} 0%, transparent 70%)`,
          filter: "blur(65px)",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: accent,
            opacity: 0.5,
            boxShadow: `0 0 ${p.size * 2}px ${accentGlow}`,
          }}
          animate={{
            y: [0, p.driftY, 0],
            x: [0, p.driftX, 0],
            opacity: [0, 0.55, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Scan sweep */}
      <motion.div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}25, transparent)`,
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 7, repeat: Infinity, repeatDelay: 6, ease: "linear" }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-sm px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.p
            className="text-[9px] tracking-[0.35em] uppercase font-mono mb-5"
            style={{ color: `${accent}70` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            ASCEND OS · OPERATOR SETUP
          </motion.p>

          {/* Terminal icon */}
          <motion.div
            className="mx-auto mb-6"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 130 }}
            style={{ width: 60, height: 60 }}
          >
            <motion.div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}14 0%, ${accent}08 100%)`,
                border: `1px solid ${accent}40`,
                borderRadius: "15px",
              }}
              animate={{
                boxShadow: [
                  `0 0 14px ${accentGlow}`,
                  `0 0 28px ${accentGlow}`,
                  `0 0 14px ${accentGlow}`,
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.span
                className="font-mono text-2xl font-bold select-none"
                style={{ color: accent, lineHeight: 1 }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              >
                _
              </motion.span>
            </motion.div>
          </motion.div>

          <motion.h2
            className="text-xl font-display font-bold mb-2"
            style={{
              color: "#e2e8f0",
              letterSpacing: "0.02em",
              textShadow: `0 0 30px ${accentGlow}`,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.55 }}
          >
            What shall the system call you?
          </motion.h2>

          <motion.p
            className="text-xs font-mono"
            style={{ color: "rgba(148,163,184,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            Your designation will be encoded into the system.
          </motion.p>
        </div>

        {/* Input */}
        <motion.div
          className="relative mb-7"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.55 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="ENTER DESIGNATION"
            maxLength={20}
            className="w-full px-4 py-4 text-base text-center font-mono focus:outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.035)",
              border: `1px solid ${focused || name ? `${accent}55` : "rgba(255,255,255,0.08)"}`,
              borderRadius: "12px",
              color: "#e2e8f0",
              letterSpacing: "0.18em",
              boxShadow: focused
                ? `0 0 24px ${accentGlow}, inset 0 0 16px ${accentGlow}`
                : "none",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
            data-testid="input-player-name"
          />
          {/* Glowing underline */}
          <motion.div
            className="absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            animate={{ width: name ? "88%" : focused ? "38%" : "0%" }}
            transition={{ duration: 0.35 }}
          />
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.55 }}
        >
          <motion.button
            onClick={handleSubmit}
            disabled={name.trim().length === 0}
            className="w-full py-4 font-mono tracking-[0.18em] uppercase text-sm font-bold rounded-xl relative overflow-hidden"
            style={{
              background: name.trim()
                ? `linear-gradient(135deg, ${accent}aa 0%, ${accent}dd 100%)`
                : "rgba(255,255,255,0.05)",
              color: name.trim() ? "#ffffff" : "rgba(255,255,255,0.2)",
              border: `1px solid ${name.trim() ? `${accent}55` : "rgba(255,255,255,0.06)"}`,
              cursor: name.trim() ? "pointer" : "not-allowed",
              boxShadow: name.trim() ? `0 0 28px ${accentGlow}` : "none",
              transition: "all 0.35s",
            }}
            whileHover={name.trim() ? { scale: 1.02 } : {}}
            whileTap={name.trim() ? { scale: 0.97 } : {}}
            data-testid="button-continue"
          >
            {name.trim() && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                }}
                animate={{ x: ["-110%", "110%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
            )}
            <span className="relative z-10">CONFIRM IDENTITY</span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Submitting overlay */}
      {isSubmitting && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4"
          style={{ background: "linear-gradient(180deg, #020810, #030d1c)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeIn" }}
        >
          <motion.p
            className="text-[10px] font-mono tracking-[0.3em] uppercase"
            style={{ color: `${accent}90` }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ENCODING DESIGNATION...
          </motion.p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{ width: 6, height: 6, background: accent }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

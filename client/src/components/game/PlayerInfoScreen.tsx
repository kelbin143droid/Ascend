import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface PlayerInfoScreenProps {
  onComplete: (data: { name: string }) => void;
}

export function PlayerInfoScreen({ onComplete }: PlayerInfoScreenProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const prevLength = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const accent = theme?.colors?.primary ?? "#8b5cf6";
  const accentGlow = `${accent}35`;
  const accentMid = `${accent}55`;

  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      y: 10 + Math.random() * 85,
      size: 0.6 + Math.random() * 1.6,
      duration: 11 + Math.random() * 11,
      delay: Math.random() * 8,
      driftX: (Math.random() - 0.5) * 40,
      driftY: -(12 + Math.random() * 50),
      opacity: 0.1 + Math.random() * 0.28,
    }))
  ).current;

  const nebulae = useRef(
    [
      { top: "20%", left: "10%", w: 360, h: 240, dx: [0, 24, -16, 0], dy: [0, -18, 12, 0], dur: 30 },
      { top: "65%", left: "55%", w: 300, h: 200, dx: [0, -20, 18, 0], dy: [0, 14, -10, 0], dur: 36 },
      { top: "45%", left: "30%", w: 280, h: 180, dx: [0, 16, -22, 0], dy: [0, -12, 18, 0], dur: 26 },
    ]
  ).current;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 700);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (newName.length > prevLength.current) {
      setRippleKey((k) => k + 1);
    }
    prevLength.current = newName.length;
    setName(newName);
  };

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
      {/* Nebula fog */}
      {nebulae.map((n, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: n.top,
            left: n.left,
            width: n.w,
            height: n.h,
            background: `radial-gradient(ellipse, ${accentGlow} 0%, transparent 70%)`,
            filter: "blur(52px)",
            borderRadius: "50%",
            opacity: 0.55,
          }}
          animate={{ x: n.dx, y: n.dy, opacity: [0.4, 0.75, 0.5, 0.4] }}
          transition={{ duration: n.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Ambient glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "35%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 580, height: 420,
          background: `radial-gradient(ellipse, ${accentGlow} 0%, transparent 70%)`,
          filter: "blur(70px)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            background: accent,
            boxShadow: `0 0 ${p.size * 2}px ${accentGlow}`,
          }}
          animate={{ y: [0, p.driftY, 0], x: [0, p.driftX, 0], opacity: [0, p.opacity, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Scan sweep */}
      <motion.div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}22, ${accent}35, ${accent}22, transparent)`,
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 7, ease: "linear" }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-sm px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.p
            className="text-[9px] tracking-[0.35em] uppercase font-mono mb-5"
            style={{ color: `${accent}65` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            ASCEND · OPERATOR SETUP
          </motion.p>

          {/* Terminal icon */}
          <motion.div
            className="mx-auto mb-6"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.72, type: "spring", stiffness: 110, damping: 14 }}
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
                  `0 0 10px ${accentGlow}`,
                  `0 0 22px ${accentGlow}`,
                  `0 0 10px ${accentGlow}`,
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
            className="text-xl font-display font-bold mb-3"
            style={{
              color: "#e2e8f0",
              letterSpacing: "0.02em",
              textShadow: `0 0 30px ${accentGlow}`,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            What shall the system call you?
          </motion.h2>

          <motion.p
            className="text-xs font-mono"
            style={{ color: "rgba(148,163,184,0.38)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.18, duration: 0.6 }}
          >
            Your designation will be encoded into the system.
          </motion.p>
        </div>

        {/* Input */}
        <motion.div
          className="relative mb-7"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Holographic outer pulse ring when focused */}
          <AnimatePresence>
            {focused && (
              <motion.div
                key="focus-ring"
                className="absolute pointer-events-none"
                style={{
                  inset: -3,
                  borderRadius: "15px",
                  border: `1px solid ${accent}45`,
                }}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.98, 1, 0.98] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>

          {/* Per-keystroke ripple ring */}
          <AnimatePresence>
            {rippleKey > 0 && (
              <motion.div
                key={rippleKey}
                className="absolute pointer-events-none"
                style={{
                  inset: -1,
                  borderRadius: "13px",
                  border: `1px solid ${accent}70`,
                }}
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 1.04 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="ENTER DESIGNATION"
            maxLength={20}
            className="w-full px-4 py-4 text-base text-center font-mono focus:outline-none"
            style={{
              background: focused
                ? `linear-gradient(180deg, rgba(${accent === "#8b5cf6" ? "139,92,246" : "14,165,233"},0.06) 0%, rgba(255,255,255,0.025) 100%)`
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${focused || name ? `${accent}60` : "rgba(255,255,255,0.08)"}`,
              borderRadius: "12px",
              color: "#e2e8f0",
              letterSpacing: "0.18em",
              boxShadow: focused
                ? `0 0 28px ${accentGlow}, inset 0 0 20px ${accentGlow}, 0 0 0 1px ${accent}20`
                : name
                ? `0 0 12px ${accentGlow}`
                : "none",
              transition: "border-color 0.3s, box-shadow 0.35s, background 0.3s",
            }}
            data-testid="input-player-name"
          />

          {/* Glowing underline */}
          <motion.div
            className="absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            animate={{ width: name ? "90%" : focused ? "42%" : "0%" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />

          {/* Corner accents when focused */}
          <AnimatePresence>
            {focused && (
              <>
                {[
                  { top: -1, left: -1, borderTop: "1.5px solid", borderLeft: "1.5px solid", borderRadius: "12px 0 0 0" },
                  { top: -1, right: -1, borderTop: "1.5px solid", borderRight: "1.5px solid", borderRadius: "0 12px 0 0" },
                  { bottom: -1, left: -1, borderBottom: "1.5px solid", borderLeft: "1.5px solid", borderRadius: "0 0 0 12px" },
                  { bottom: -1, right: -1, borderBottom: "1.5px solid", borderRight: "1.5px solid", borderRadius: "0 0 12px 0" },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    className="absolute pointer-events-none"
                    style={{
                      ...s,
                      width: 12, height: 12,
                      borderColor: `${accent}80`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.55, duration: 0.65 }}
        >
          <motion.button
            onClick={handleSubmit}
            disabled={name.trim().length === 0}
            className="w-full py-4 font-mono tracking-[0.18em] uppercase text-sm font-bold rounded-xl relative overflow-hidden"
            style={{
              background: name.trim()
                ? `linear-gradient(135deg, ${accent}aa 0%, ${accent}ee 100%)`
                : "rgba(255,255,255,0.04)",
              color: name.trim() ? "#ffffff" : "rgba(255,255,255,0.18)",
              border: `1px solid ${name.trim() ? `${accent}60` : "rgba(255,255,255,0.06)"}`,
              cursor: name.trim() ? "pointer" : "not-allowed",
              boxShadow: name.trim() ? `0 0 32px ${accentGlow}, 0 4px 20px ${accentGlow}` : "none",
              transition: "all 0.38s",
            }}
            whileHover={name.trim() ? { scale: 1.02 } : {}}
            whileTap={name.trim() ? { scale: 0.97 } : {}}
            data-testid="button-continue"
          >
            {name.trim() && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
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

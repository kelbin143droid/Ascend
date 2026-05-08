import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

function useTypewriter(text: string, charDelay = 42, startDelay = 1800) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, charDelay);
    }, startDelay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [text, charDelay, startDelay]);
  return displayed;
}

const TAGLINE = "System link established. Awaiting initialization...";
const TITLE_LETTERS = "ASCEND OS".split("");

interface IntroScreenProps {
  onBeginAscension: () => void;
}

export function IntroScreen({ onBeginAscension }: IntroScreenProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tagline = useTypewriter(TAGLINE, 42, 1900);

  const particles = useRef(
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: 4 + Math.random() * 92,
      y: 15 + Math.random() * 75,
      size: 1 + Math.random() * 2.5,
      duration: 6 + Math.random() * 7,
      delay: Math.random() * 5,
      driftX: (Math.random() - 0.5) * 50,
      driftY: -(25 + Math.random() * 55),
      opacity: 0.25 + Math.random() * 0.45,
    }))
  ).current;

  const handleBeginAscension = () => {
    setIsTransitioning(true);
    setTimeout(onBeginAscension, 1000);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
      >
        {/* Deep space background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #020810 0%, #030d1c 35%, #040a16 65%, #020810 100%)",
          }}
        />

        {/* Large ambient glow orbs */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: "28%", left: "50%", transform: "translate(-50%, -50%)",
            width: 640, height: 440,
            background: "radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)",
            filter: "blur(70px)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: "70%", left: "15%",
            width: 320, height: 320,
            background: "radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: "60%", right: "10%",
            width: 260, height: 260,
            background: "radial-gradient(ellipse, rgba(67,56,202,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />

        {/* Ambient floating particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.id % 3 === 0
                ? "rgba(99,102,241,0.7)"
                : p.id % 3 === 1
                ? "rgba(139,92,246,0.65)"
                : "rgba(167,139,250,0.55)",
              boxShadow: `0 0 ${p.size * 2}px rgba(139,92,246,0.4)`,
            }}
            animate={{
              y: [0, p.driftY, 0],
              x: [0, p.driftX, 0],
              opacity: [0, p.opacity, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Horizontal scan sweep */}
        <motion.div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.35) 30%, rgba(99,102,241,0.5) 50%, rgba(139,92,246,0.35) 70%, transparent 100%)",
          }}
          animate={{ top: ["-2%", "102%"] }}
          transition={{ duration: 6, repeat: Infinity, repeatDelay: 5, ease: "linear" }}
        />

        {/* Main card */}
        <motion.div
          className="relative z-10 flex flex-col items-center px-8 py-12 mx-4"
          style={{
            background: "linear-gradient(160deg, rgba(12,18,38,0.88) 0%, rgba(7,11,26,0.94) 100%)",
            borderRadius: "22px",
            border: "1px solid rgba(99,102,241,0.22)",
            boxShadow: "0 0 80px rgba(99,102,241,0.12), 0 0 160px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
            maxWidth: 400,
            width: "100%",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 1.0, ease: "easeOut" }}
        >
          {/* Pulsing card glow */}
          <motion.div
            className="absolute inset-0 rounded-[22px] pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 0px rgba(99,102,241,0)",
                "0 0 30px rgba(99,102,241,0.18)",
                "0 0 0px rgba(99,102,241,0)",
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* HUD corner brackets */}
          {[
            { top: 12, left: 12, borderTop: "1.5px solid", borderLeft: "1.5px solid" },
            { top: 12, right: 12, borderTop: "1.5px solid", borderRight: "1.5px solid" },
            { bottom: 12, left: 12, borderBottom: "1.5px solid", borderLeft: "1.5px solid" },
            { bottom: 12, right: 12, borderBottom: "1.5px solid", borderRight: "1.5px solid" },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none"
              style={{
                ...s,
                width: 18,
                height: 18,
                borderColor: "rgba(99,102,241,0.5)",
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.5, type: "spring" }}
            />
          ))}

          {/* Logo */}
          <motion.div
            className="relative mb-8 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 120 }}
          >
            {/* Outer rotating dashed ring */}
            <motion.div
              className="absolute"
              style={{
                width: 104,
                height: 104,
                borderRadius: "50%",
                border: "1px dashed rgba(99,102,241,0.3)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner counter-rotating ring */}
            <motion.div
              className="absolute"
              style={{
                width: 82,
                height: 82,
                borderRadius: "50%",
                border: "1px solid rgba(139,92,246,0.25)",
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            />
            {/* Cardinal dots */}
            {[0, 90, 180, 270].map((deg, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "rgba(139,92,246,0.7)",
                  transformOrigin: "50px 50px",
                  transform: `rotate(${deg}deg) translateY(-50px)`,
                  boxShadow: "0 0 4px rgba(139,92,246,0.8)",
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
            {/* Center ambient glow */}
            <motion.div
              className="absolute"
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Icon box */}
            <motion.div
              style={{
                width: 54,
                height: 54,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)",
                borderRadius: "14px",
                border: "1px solid rgba(139,92,246,0.4)",
                position: "relative",
              }}
              animate={{
                boxShadow: [
                  "0 0 15px rgba(139,92,246,0.3)",
                  "0 0 30px rgba(139,92,246,0.5)",
                  "0 0 15px rgba(139,92,246,0.3)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap
                size={26}
                style={{
                  color: "#a78bfa",
                  filter: "drop-shadow(0 0 8px rgba(167,139,250,0.9))",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Title — staggered letter reveal */}
          <div className="flex items-center mb-2" style={{ gap: "1px" }}>
            {TITLE_LETTERS.map((char, i) => (
              <motion.span
                key={i}
                className="font-display font-black text-[2rem]"
                style={{
                  color: char === " " ? "transparent" : "#e2e8f0",
                  textShadow: char !== " " ? "0 0 28px rgba(139,92,246,0.65), 0 0 60px rgba(99,102,241,0.3)" : "none",
                  display: "inline-block",
                  width: char === " " ? "14px" : "auto",
                  letterSpacing: "0.04em",
                }}
                initial={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.5 + i * 0.065, duration: 0.5, ease: "easeOut" }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Protocol label */}
          <motion.p
            className="text-[9px] tracking-[0.35em] uppercase font-mono mb-7"
            style={{ color: "rgba(99,102,241,0.65)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.7 }}
          >
            AWAKENED SYSTEM PROTOCOL
          </motion.p>

          {/* Typewriter tagline */}
          <motion.div
            className="mb-8 min-h-[44px] text-center px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.5 }}
          >
            <p className="text-sm font-mono leading-relaxed" style={{ color: "rgba(148,163,184,0.75)" }}>
              {tagline}
              {tagline.length < TAGLINE.length && (
                <motion.span
                  style={{ color: "rgba(139,92,246,0.9)", marginLeft: 1 }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                >
                  ▋
                </motion.span>
              )}
            </p>
          </motion.div>

          {/* Initialize button */}
          <motion.button
            onClick={handleBeginAscension}
            className="w-full max-w-xs relative overflow-hidden"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.7 }}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.97 }}
            data-testid="button-begin-ascension"
          >
            <motion.div
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 font-mono tracking-[0.18em] uppercase text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #3730a3 0%, #4c1d95 40%, #5b21b6 100%)",
                color: "#e9d5ff",
                borderRadius: "12px",
                border: "1px solid rgba(139,92,246,0.45)",
              }}
              animate={{
                boxShadow: [
                  "0 0 20px rgba(139,92,246,0.25), 0 4px 24px rgba(99,102,241,0.2)",
                  "0 0 40px rgba(139,92,246,0.45), 0 4px 36px rgba(99,102,241,0.35)",
                  "0 0 20px rgba(139,92,246,0.25), 0 4px 24px rgba(99,102,241,0.2)",
                ],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-0 rounded-[12px] pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                }}
                animate={{ x: ["-110%", "110%"] }}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.8, ease: "linear" }}
              />
              <Zap size={16} className="relative z-10" style={{ color: "#c4b5fd" }} />
              <span className="relative z-10">INITIALIZE SYSTEM</span>
            </motion.div>
          </motion.button>

          <motion.p
            className="mt-4 text-[9px] tracking-[0.22em] uppercase font-mono"
            style={{ color: "rgba(100,116,139,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6, duration: 0.6 }}
          >
            SECURE CONNECTION ESTABLISHED
          </motion.p>
        </motion.div>

        {/* Version footer */}
        <motion.p
          className="absolute bottom-8 text-[10px] tracking-wider font-mono"
          style={{ color: "rgba(100,116,139,0.35)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 0.6 }}
        >
          ASCEND OS v2.0 // BUILD: NEON_GENESIS
        </motion.p>

        {/* Transition overlay */}
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeIn" }}
            style={{ background: "linear-gradient(180deg, #020810 0%, #030d1c 100%)" }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

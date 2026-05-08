import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

function useTypewriter(text: string, charDelay = 42, startDelay = 1800) {
  const [displayed, setDisplayed] = React.useState("");
  React.useEffect(() => {
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
  const [isActivating, setIsActivating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tagline = useTypewriter(TAGLINE, 42, 1900);

  const particles = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: 4 + Math.random() * 92,
      y: 15 + Math.random() * 75,
      size: 0.8 + Math.random() * 2.2,
      duration: 7 + Math.random() * 9,
      delay: Math.random() * 6,
      driftX: (Math.random() - 0.5) * 60,
      driftY: -(20 + Math.random() * 65),
      opacity: 0.2 + Math.random() * 0.5,
      colorIndex: i % 4,
    }))
  ).current;

  const nebulae = useRef(
    [
      { x: 12, y: 18, w: 420, h: 280, color: "rgba(99,102,241,0.055)", dx: [0, 28, -18, 0], dy: [0, -22, 14, 0], dur: 32 },
      { x: 55, y: 60, w: 380, h: 260, color: "rgba(139,92,246,0.045)", dx: [0, -22, 30, 0], dy: [0, 18, -12, 0], dur: 38 },
      { x: 70, y: 10, w: 300, h: 220, color: "rgba(67,56,202,0.040)", dx: [0, 20, -14, 0], dy: [0, 15, -20, 0], dur: 28 },
    ]
  ).current;

  const streaks = useRef(
    [
      { delay: 4, dur: 1.4, repeatDelay: 14, top: "22%", rotate: -28, w: 180, opacity: 0.18 },
      { delay: 11, dur: 1.1, repeatDelay: 19, top: "68%", rotate: 18, w: 140, opacity: 0.13 },
    ]
  ).current;

  const activationRings = useRef(
    [
      { size: 120, delay: 0, dur: 0.55 },
      { size: 220, delay: 0.1, dur: 0.65 },
      { size: 360, delay: 0.2, dur: 0.75 },
    ]
  ).current;

  const handleBeginAscension = () => {
    if (isActivating || isTransitioning) return;
    setIsActivating(true);
    setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(onBeginAscension, 950);
    }, 650);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 0.95, ease: "easeInOut" }}
      >
        {/* Deep space background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #020810 0%, #030d1c 35%, #040a16 65%, #020810 100%)",
          }}
        />

        {/* Nebula fog layers */}
        {nebulae.map((n, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: n.w,
              height: n.h,
              background: `radial-gradient(ellipse, ${n.color} 0%, transparent 70%)`,
              filter: "blur(55px)",
              borderRadius: "50%",
            }}
            animate={{ x: n.dx, y: n.dy, opacity: [0.6, 1, 0.7, 0.6] }}
            transition={{ duration: n.dur, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Large ambient glow orbs */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: "28%", left: "50%", transform: "translate(-50%, -50%)",
            width: 640, height: 440,
            background: "radial-gradient(ellipse, rgba(99,102,241,0.11) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)",
            filter: "blur(70px)",
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
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
              background: p.colorIndex === 0
                ? "rgba(99,102,241,0.75)"
                : p.colorIndex === 1
                ? "rgba(139,92,246,0.65)"
                : p.colorIndex === 2
                ? "rgba(167,139,250,0.55)"
                : "rgba(196,181,253,0.45)",
              boxShadow: `0 0 ${p.size * 2.5}px rgba(139,92,246,0.35)`,
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

        {/* Energy streaks */}
        {streaks.map((s, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              top: s.top,
              left: "-10%",
              width: s.w,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(99,102,241,0.8), transparent)",
              rotate: `${s.rotate}deg`,
              transformOrigin: "left center",
            }}
            animate={{ x: ["0%", "140vw"], opacity: [0, s.opacity, s.opacity, 0] }}
            transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, repeatDelay: s.repeatDelay, ease: "linear" }}
          />
        ))}

        {/* Horizontal scan sweep */}
        <motion.div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.3) 30%, rgba(99,102,241,0.45) 50%, rgba(139,92,246,0.3) 70%, transparent 100%)",
          }}
          animate={{ top: ["-2%", "102%"] }}
          transition={{ duration: 7, repeat: Infinity, repeatDelay: 6, ease: "linear" }}
        />

        {/* Main card */}
        <motion.div
          className="relative z-10 flex flex-col items-center px-8 py-12 mx-4"
          style={{
            background: "linear-gradient(160deg, rgba(12,18,38,0.90) 0%, rgba(7,11,26,0.96) 100%)",
            borderRadius: "22px",
            border: "1px solid rgba(99,102,241,0.22)",
            boxShadow: "0 0 80px rgba(99,102,241,0.13), 0 0 160px rgba(139,92,246,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
            maxWidth: 400,
            width: "100%",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
          }}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 1.0, ease: "easeOut" }}
        >
          {/* Pulsing card glow */}
          <motion.div
            className="absolute inset-0 rounded-[22px] pointer-events-none"
            animate={{
              boxShadow: isActivating
                ? [
                    "0 0 60px rgba(139,92,246,0.55), inset 0 0 40px rgba(99,102,241,0.18)",
                    "0 0 100px rgba(139,92,246,0.8), inset 0 0 60px rgba(99,102,241,0.28)",
                    "0 0 0px rgba(99,102,241,0)",
                  ]
                : [
                    "0 0 0px rgba(99,102,241,0)",
                    "0 0 30px rgba(99,102,241,0.18)",
                    "0 0 0px rgba(99,102,241,0)",
                  ],
            }}
            transition={isActivating
              ? { duration: 0.65, ease: "easeOut" }
              : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            }
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
                borderColor: isActivating ? "rgba(167,139,250,0.9)" : "rgba(99,102,241,0.5)",
                transition: "border-color 0.3s",
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
            <motion.div
              className="absolute"
              style={{
                width: 104, height: 104, borderRadius: "50%",
                border: "1px dashed rgba(99,102,241,0.3)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute"
              style={{
                width: 82, height: 82, borderRadius: "50%",
                border: "1px solid rgba(139,92,246,0.25)",
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            />
            {[0, 90, 180, 270].map((deg, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: 3, height: 3, borderRadius: "50%",
                  background: "rgba(139,92,246,0.7)",
                  transformOrigin: "50px 50px",
                  transform: `rotate(${deg}deg) translateY(-50px)`,
                  boxShadow: "0 0 4px rgba(139,92,246,0.8)",
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
            <motion.div
              className="absolute"
              style={{
                width: 68, height: 68, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              style={{
                width: 54, height: 54,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)",
                borderRadius: "14px",
                border: "1px solid rgba(139,92,246,0.4)",
                position: "relative",
              }}
              animate={{
                boxShadow: [
                  "0 0 15px rgba(139,92,246,0.3)",
                  "0 0 32px rgba(139,92,246,0.55)",
                  "0 0 15px rgba(139,92,246,0.3)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap size={26} style={{ color: "#a78bfa", filter: "drop-shadow(0 0 8px rgba(167,139,250,0.9))" }} />
            </motion.div>
          </motion.div>

          {/* Title */}
          <div className="flex items-center mb-2.5" style={{ gap: "1px" }}>
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
            className="text-[9px] tracking-[0.35em] uppercase font-mono mb-8"
            style={{ color: "rgba(99,102,241,0.6)" }}
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
            <p className="text-sm font-mono leading-relaxed" style={{ color: "rgba(148,163,184,0.68)" }}>
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
            whileTap={{ scale: 0.96 }}
            data-testid="button-begin-ascension"
            style={{ borderRadius: "12px" }}
          >
            {/* Activation rings burst */}
            <AnimatePresence>
              {isActivating && activationRings.map((ring, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    top: "50%", left: "50%",
                    width: ring.size, height: ring.size,
                    borderRadius: "50%",
                    border: "1px solid rgba(167,139,250,0.8)",
                    transform: "translate(-50%, -50%)",
                  }}
                  initial={{ scale: 0.2, opacity: 0.9 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: ring.dur, delay: ring.delay, ease: "easeOut" }}
                />
              ))}
            </AnimatePresence>

            <motion.div
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 font-mono tracking-[0.18em] uppercase text-sm font-bold"
              style={{
                background: isActivating
                  ? "linear-gradient(135deg, #4c1d95 0%, #5b21b6 40%, #6d28d9 100%)"
                  : "linear-gradient(135deg, #3730a3 0%, #4c1d95 40%, #5b21b6 100%)",
                color: "#e9d5ff",
                borderRadius: "12px",
                border: `1px solid ${isActivating ? "rgba(167,139,250,0.7)" : "rgba(139,92,246,0.45)"}`,
                transition: "background 0.3s, border-color 0.3s",
              }}
              animate={{
                boxShadow: isActivating
                  ? [
                      "0 0 40px rgba(139,92,246,0.6), 0 4px 40px rgba(99,102,241,0.5)",
                      "0 0 80px rgba(167,139,250,0.9), 0 4px 60px rgba(139,92,246,0.7)",
                    ]
                  : [
                      "0 0 20px rgba(139,92,246,0.25), 0 4px 24px rgba(99,102,241,0.2)",
                      "0 0 42px rgba(139,92,246,0.48), 0 4px 38px rgba(99,102,241,0.38)",
                      "0 0 20px rgba(139,92,246,0.25), 0 4px 24px rgba(99,102,241,0.2)",
                    ],
              }}
              transition={isActivating
                ? { duration: 0.55, ease: "easeOut" }
                : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
              }
            >
              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-0 rounded-[12px] pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
                }}
                animate={{ x: ["-110%", "110%"] }}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.0, ease: "linear" }}
              />
              <Zap size={16} className="relative z-10" style={{ color: "#c4b5fd" }} />
              <span className="relative z-10">INITIALIZE SYSTEM</span>
            </motion.div>
          </motion.button>

          <motion.p
            className="mt-4 text-[9px] tracking-[0.22em] uppercase font-mono"
            style={{ color: "rgba(100,116,139,0.38)" }}
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
          style={{ color: "rgba(100,116,139,0.3)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 0.6 }}
        >
          ASCEND OS v2.0 // BUILD: NEON_GENESIS
        </motion.p>

        {/* Activation flash overlay */}
        <AnimatePresence>
          {isActivating && (
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.12, 0] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(167,139,250,1) 0%, transparent 70%)" }}
            />
          )}
        </AnimatePresence>

        {/* Transition overlay */}
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.85, ease: "easeIn" }}
            style={{ background: "linear-gradient(180deg, #020810 0%, #030d1c 100%)" }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

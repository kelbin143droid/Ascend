import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

const TITLE_LETTERS = "ASCEND".split("");

interface IntroScreenProps {
  onBeginAscension: () => void;
}

export function IntroScreen({ onBeginAscension }: IntroScreenProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const particles = useRef(
    Array.from({ length: 38 }, (_, i) => ({
      id: i,
      x: 2 + Math.random() * 96,
      y: 2 + Math.random() * 96,
      size: 0.8 + Math.random() * 2.2,
      duration: 10 + Math.random() * 16,
      delay: Math.random() * 10,
      driftX: (Math.random() - 0.5) * 60,
      driftY: -(10 + Math.random() * 60),
      opacity: 0.12 + Math.random() * 0.35,
      colorIndex: i % 5,
    }))
  ).current;

  const streaks = useRef([
    { delay: 3,  dur: 1.2, repeatDelay: 13, top: "18%",  rotate: -22, w: 220, opacity: 0.22 },
    { delay: 9,  dur: 1.0, repeatDelay: 18, top: "72%",  rotate: 15,  w: 180, opacity: 0.16 },
    { delay: 16, dur: 1.3, repeatDelay: 22, top: "44%",  rotate: -8,  w: 150, opacity: 0.13 },
  ]).current;

  const activationRings = useRef([
    { size: 140, delay: 0,   dur: 0.55 },
    { size: 260, delay: 0.1, dur: 0.65 },
    { size: 420, delay: 0.2, dur: 0.80 },
  ]).current;

  const handleBeginAscension = () => {
    if (isActivating || isTransitioning) return;
    setIsActivating(true);
    setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(onBeginAscension, 950);
    }, 700);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
      >
        {/* ── DEEP SPACE BACKGROUND ── */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, #050d20 0%, #030912 45%, #010509 100%)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)",
          }}
        />

        {/* ── AMBIENT GLOW ORBS ── */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: "30%", left: "50%", transform: "translate(-50%, -50%)",
            width: 700, height: 500,
            background:
              "radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, rgba(139,92,246,0.09) 35%, transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: "65%", left: "18%",
            width: 360, height: 360,
            background: "radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: "55%", right: "12%",
            width: 280, height: 280,
            background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />

        {/* ── FLOATING PARTICLES ── */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background:
                p.colorIndex === 0 ? "rgba(6,182,212,0.90)"
                : p.colorIndex === 1 ? "rgba(139,92,246,0.80)"
                : p.colorIndex === 2 ? "rgba(167,139,250,0.70)"
                : p.colorIndex === 3 ? "rgba(34,211,238,0.80)"
                : "rgba(196,181,253,0.55)",
              boxShadow:
                p.colorIndex <= 1
                  ? `0 0 ${p.size * 3}px rgba(6,182,212,0.30)`
                  : `0 0 ${p.size * 2}px rgba(139,92,246,0.25)`,
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

        {/* ── ENERGY STREAKS ── */}
        {streaks.map((s, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              top: s.top,
              left: "-10%",
              width: s.w,
              height: 1.5,
              background:
                i % 2 === 0
                  ? "linear-gradient(90deg, transparent, rgba(6,182,212,0.7), rgba(34,211,238,0.9), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(167,139,250,0.8), transparent)",
              rotate: `${s.rotate}deg`,
              transformOrigin: "left center",
            }}
            animate={{ x: ["0%", "140vw"], opacity: [0, s.opacity, s.opacity, 0] }}
            transition={{
              duration: s.dur,
              delay: s.delay,
              repeat: Infinity,
              repeatDelay: s.repeatDelay,
              ease: "linear",
            }}
          />
        ))}

        {/* Horizontal scan sweep */}
        <motion.div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.25) 30%, rgba(34,211,238,0.40) 50%, rgba(6,182,212,0.25) 70%, transparent 100%)",
          }}
          animate={{ top: ["-2%", "102%"] }}
          transition={{ duration: 8, repeat: Infinity, repeatDelay: 7, ease: "linear" }}
        />

        {/* ── CENTER CONTENT ── */}
        <motion.div
          className="relative z-10 flex flex-col items-center px-6"
          style={{ maxWidth: 420, width: "100%" }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 1.1, ease: "easeOut" }}
        >

          {/* ── HUD CORNER BRACKETS (full-screen feel) ── */}
          {[
            { position: "fixed", top: 24, left: 24, borderTop: "1.5px solid", borderLeft: "1.5px solid" },
            { position: "fixed", top: 24, right: 24, borderTop: "1.5px solid", borderRight: "1.5px solid" },
            { position: "fixed", bottom: 24, left: 24, borderBottom: "1.5px solid", borderLeft: "1.5px solid" },
            { position: "fixed", bottom: 24, right: 24, borderBottom: "1.5px solid", borderRight: "1.5px solid" },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="pointer-events-none"
              style={{
                ...s as React.CSSProperties,
                width: 22,
                height: 22,
                borderColor: isActivating ? "rgba(34,211,238,0.9)" : "rgba(6,182,212,0.45)",
                transition: "border-color 0.3s",
                zIndex: 20,
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.09, duration: 0.5, type: "spring" }}
            />
          ))}

          {/* ── SYSTEM SIGIL ── */}
          <motion.div
            className="relative flex items-center justify-center mb-10"
            style={{ width: 160, height: 160 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.9, type: "spring", stiffness: 100 }}
          >
            {/* Outer energy ring — slow rotate */}
            <motion.div
              className="absolute"
              style={{
                width: 152, height: 152, borderRadius: "50%",
                border: "1px solid rgba(6,182,212,0.30)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            />
            {/* Outer tick marks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <motion.div
                key={`tick-${i}`}
                className="absolute"
                style={{
                  width: i % 2 === 0 ? 5 : 3,
                  height: i % 2 === 0 ? 5 : 3,
                  borderRadius: "50%",
                  background: i % 2 === 0 ? "rgba(6,182,212,0.75)" : "rgba(139,92,246,0.55)",
                  transformOrigin: "80px 80px",
                  transform: `rotate(${deg}deg) translateY(-75px)`,
                  boxShadow: i % 2 === 0 ? "0 0 5px rgba(6,182,212,0.9)" : "0 0 4px rgba(139,92,246,0.7)",
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}

            {/* Mid ring — counter-rotate, dashed */}
            <motion.div
              className="absolute"
              style={{
                width: 122, height: 122, borderRadius: "50%",
                border: "1px dashed rgba(139,92,246,0.35)",
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            {/* Mid ring accent dots */}
            {[0, 120, 240].map((deg, i) => (
              <motion.div
                key={`mdot-${i}`}
                className="absolute"
                style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "rgba(6,182,212,0.85)",
                  transformOrigin: "64px 64px",
                  transform: `rotate(${deg}deg) translateY(-60px)`,
                  boxShadow: "0 0 8px rgba(6,182,212,1)",
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.65 }}
              />
            ))}

            {/* Inner ring */}
            <motion.div
              className="absolute"
              style={{
                width: 96, height: 96, borderRadius: "50%",
                border: "1px solid rgba(6,182,212,0.18)",
                background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            {/* Ambient glow core */}
            <motion.div
              className="absolute"
              style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(6,182,212,0.22) 0%, rgba(139,92,246,0.18) 50%, transparent 70%)",
                filter: "blur(10px)",
              }}
              animate={{
                scale: isActivating ? [1, 2.5] : [1, 1.22, 1],
                opacity: isActivating ? [0.8, 0] : [0.6, 1, 0.6],
              }}
              transition={isActivating
                ? { duration: 0.65, ease: "easeOut" }
                : { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }
            />

            {/* Core icon box */}
            <motion.div
              style={{
                width: 62, height: 62,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.18) 100%)",
                borderRadius: "18px",
                border: "1.5px solid rgba(6,182,212,0.50)",
                position: "relative",
                backdropFilter: "blur(10px)",
              }}
              animate={{
                boxShadow: isActivating
                  ? [
                      "0 0 30px rgba(6,182,212,0.60), 0 0 60px rgba(6,182,212,0.30), inset 0 0 20px rgba(6,182,212,0.15)",
                      "0 0 80px rgba(6,182,212,0.90), 0 0 140px rgba(6,182,212,0.50), inset 0 0 40px rgba(6,182,212,0.30)",
                    ]
                  : [
                      "0 0 16px rgba(6,182,212,0.30), inset 0 0 10px rgba(6,182,212,0.08)",
                      "0 0 36px rgba(6,182,212,0.55), 0 0 60px rgba(139,92,246,0.20), inset 0 0 18px rgba(6,182,212,0.14)",
                      "0 0 16px rgba(6,182,212,0.30), inset 0 0 10px rgba(6,182,212,0.08)",
                    ],
              }}
              transition={isActivating
                ? { duration: 0.6, ease: "easeOut" }
                : { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <Zap
                size={30}
                style={{
                  color: "#22d3ee",
                  filter: "drop-shadow(0 0 10px rgba(6,182,212,1)) drop-shadow(0 0 4px rgba(34,211,238,0.8))",
                }}
              />
            </motion.div>
          </motion.div>

          {/* ── ASCEND TITLE ── */}
          <div className="relative flex items-center justify-center mb-3" style={{ gap: "3px" }}>
            {/* Title bloom behind */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: 340, height: 80,
                background: "radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, rgba(139,92,246,0.08) 50%, transparent 75%)",
                filter: "blur(20px)",
                top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {TITLE_LETTERS.map((char, i) => (
              <motion.span
                key={i}
                style={{
                  color: "#f0f9ff",
                  textShadow:
                    "0 0 40px rgba(6,182,212,0.80), 0 0 80px rgba(6,182,212,0.40), 0 0 120px rgba(139,92,246,0.30), 0 2px 0 rgba(0,0,0,0.60)",
                  display: "inline-block",
                  letterSpacing: "0.10em",
                  fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                  fontSize: "3.4rem",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
                initial={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                animate={{
                  opacity: 1, y: 0, filter: "blur(0px)",
                }}
                transition={{
                  delay: 0.7 + i * 0.10,
                  duration: 0.65,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {char}
              </motion.span>
            ))}
            {/* Shimmer sweep over title */}
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ borderRadius: 4 }}
            >
              <motion.div
                style={{
                  position: "absolute",
                  top: 0, bottom: 0,
                  width: "40%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(6,182,212,0.28), rgba(255,255,255,0.18), rgba(6,182,212,0.28), transparent)",
                  skewX: "-15deg",
                }}
                animate={{ left: ["-50%", "140%"] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4, ease: "easeInOut", delay: 3.5 }}
              />
            </motion.div>
          </div>

          {/* ── PROTOCOL LABEL ── */}
          <motion.p
            className="text-[9px] font-mono mb-10 tracking-[0.50em] uppercase"
            style={{ color: "rgba(6,182,212,0.55)", letterSpacing: "0.50em" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.9 }}
          >
            AWAKENED SYSTEM PROTOCOL
          </motion.p>

          {/* Energy wave rings (behind the content, radiate from center) */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: 280, height: 280, borderRadius: "50%",
              border: "1px solid rgba(6,182,212,0.10)",
              top: "38%", left: "50%", transform: "translate(-50%, -50%)",
            }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: 340, height: 340, borderRadius: "50%",
              border: "1px solid rgba(139,92,246,0.08)",
              top: "38%", left: "50%", transform: "translate(-50%, -50%)",
            }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />

          {/* ── AWAKEN SYSTEM BUTTON ── */}
          <motion.button
            onClick={handleBeginAscension}
            className="w-full relative overflow-hidden"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.2, duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ scale: 1.022 }}
            whileTap={{ scale: 0.965 }}
            data-testid="button-begin-ascension"
            style={{ borderRadius: "16px", maxWidth: 340 }}
          >
            {/* Activation burst rings */}
            <AnimatePresence>
              {isActivating && activationRings.map((ring, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    top: "50%", left: "50%",
                    width: ring.size, height: ring.size,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(6,182,212,0.85)",
                    transform: "translate(-50%, -50%)",
                  }}
                  initial={{ scale: 0.2, opacity: 0.9 }}
                  animate={{ scale: 2.0, opacity: 0 }}
                  transition={{ duration: ring.dur, delay: ring.delay, ease: "easeOut" }}
                />
              ))}
            </AnimatePresence>

            <motion.div
              className="flex items-center justify-center gap-3 px-6 py-4 font-mono tracking-[0.20em] uppercase text-sm font-bold relative"
              style={{
                background: isActivating
                  ? "linear-gradient(135deg, #0e7490 0%, #6d28d9 100%)"
                  : "linear-gradient(135deg, #0891b2 0%, #0e7490 30%, #5b21b6 70%, #7c3aed 100%)",
                color: "#e0f7ff",
                borderRadius: "16px",
                border: isActivating
                  ? "1px solid rgba(6,182,212,0.80)"
                  : "1px solid rgba(6,182,212,0.45)",
                transition: "background 0.3s, border-color 0.3s",
              }}
              animate={{
                boxShadow: isActivating
                  ? [
                      "0 0 50px rgba(6,182,212,0.70), 0 0 80px rgba(139,92,246,0.50), 0 6px 40px rgba(6,182,212,0.50)",
                      "0 0 100px rgba(6,182,212,1.0), 0 0 160px rgba(139,92,246,0.80), 0 6px 60px rgba(6,182,212,0.70)",
                    ]
                  : [
                      "0 0 24px rgba(6,182,212,0.30), 0 0 50px rgba(139,92,246,0.18), 0 6px 28px rgba(0,0,0,0.50)",
                      "0 0 50px rgba(6,182,212,0.60), 0 0 90px rgba(139,92,246,0.35), 0 6px 40px rgba(0,0,0,0.60)",
                      "0 0 24px rgba(6,182,212,0.30), 0 0 50px rgba(139,92,246,0.18), 0 6px 28px rgba(0,0,0,0.50)",
                    ],
              }}
              transition={isActivating
                ? { duration: 0.6, ease: "easeOut" }
                : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
              }
            >
              {/* Edge top-light */}
              <div
                className="absolute top-0 left-[15%] right-[15%] h-px pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.55), rgba(34,211,238,0.70), rgba(6,182,212,0.55), transparent)" }}
              />
              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ borderRadius: "16px", overflow: "hidden" }}
              >
                <motion.div
                  style={{
                    position: "absolute",
                    top: 0, bottom: 0,
                    width: "35%",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(6,182,212,0.22), transparent)",
                    skewX: "-12deg",
                  }}
                  animate={{ left: ["-45%", "140%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.5, ease: "linear", delay: 4 }}
                />
              </motion.div>
              <Zap
                size={17}
                className="relative z-10 shrink-0"
                style={{ color: "#67e8f9", filter: "drop-shadow(0 0 6px rgba(6,182,212,0.9))" }}
              />
              <span className="relative z-10">AWAKEN SYSTEM</span>
            </motion.div>
          </motion.button>

          {/* ── BOTTOM LABEL ── */}
          <motion.p
            className="mt-6 text-[9px] tracking-[0.28em] uppercase font-mono"
            style={{ color: "rgba(100,116,139,0.32)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 0.6 }}
          >
            ASCEND v2.0 // NEON GENESIS
          </motion.p>
        </motion.div>

        {/* ── ACTIVATION FLASH ── */}
        <AnimatePresence>
          {isActivating && (
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.18, 0] }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.8) 0%, rgba(139,92,246,0.4) 40%, transparent 70%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* ── TRANSITION OVERLAY ── */}
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.90, ease: "easeIn" }}
            style={{ background: "radial-gradient(ellipse at 50% 50%, #020d18 0%, #010509 100%)" }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

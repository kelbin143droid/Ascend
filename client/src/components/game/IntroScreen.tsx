import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface IntroScreenProps {
  onBeginAscension: () => void;
}

export function IntroScreen({ onBeginAscension }: IntroScreenProps) {
  const [isActivating, setIsActivating]   = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleBegin = () => {
    if (isActivating || isTransitioning) return;
    setIsActivating(true);
    setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(onBeginAscension, 900);
    }, 650);
  };

  // Subtle floating particles over the background
  const particles = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i, x: 3 + Math.random() * 94, y: 3 + Math.random() * 94,
      size: 0.8 + Math.random() * 1.8, dur: 11 + Math.random() * 14,
      delay: Math.random() * 10, dy: -(8 + Math.random() * 40),
      op: 0.10 + Math.random() * 0.30, c: i % 3,
    }))
  ).current;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-hidden"
        style={{ userSelect: "none" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      >
        {/* ── BACKGROUND NEBULA IMAGE ── */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, #04122a 0%, #020812 50%, #010408 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(/assets/images/intro-bg.png)",
          backgroundSize: "cover", backgroundPosition: "center top",
          backgroundRepeat: "no-repeat", opacity: 0.88,
        }} />

        {/* Vignette overlay — deeper at edges */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,0,0,0.55) 100%)",
        }} />

        {/* Subtle particle field */}
        {particles.map(p => (
          <motion.div key={p.id} style={{
            position: "absolute", borderRadius: "50%", pointerEvents: "none",
            width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
            background: p.c === 0 ? "rgba(6,182,212,0.9)" : p.c === 1 ? "rgba(167,139,250,0.7)" : "rgba(34,211,238,0.8)",
          }} animate={{ y: [0, p.dy, 0], opacity: [0, p.op, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
        ))}

        {/* ── HUD CORNER BRACKETS ── */}
        {[
          { top: 22, left: 22, borderTop: "1.5px solid", borderLeft: "1.5px solid" },
          { top: 22, right: 22, borderTop: "1.5px solid", borderRight: "1.5px solid" },
          { bottom: 22, left: 22, borderBottom: "1.5px solid", borderLeft: "1.5px solid" },
          { bottom: 22, right: 22, borderBottom: "1.5px solid", borderRight: "1.5px solid" },
        ].map((s, i) => (
          <motion.div key={i} style={{
            position: "fixed", width: 22, height: 22, pointerEvents: "none", zIndex: 20,
            ...s as React.CSSProperties,
            borderColor: isActivating ? "rgba(34,211,238,0.95)" : "rgba(6,182,212,0.50)",
            transition: "border-color 0.3s",
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }} />
        ))}

        {/* ── MAIN LAYOUT — flex column, full height ── */}
        <div style={{
          position: "relative", zIndex: 10,
          height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center",
          paddingTop: "clamp(40px, 7vh, 72px)",
          paddingBottom: "clamp(28px, 5vh, 52px)",
        }}>

          {/* ── SIGIL — top, smaller ── */}
          <motion.div style={{
            position: "relative", display: "flex", alignItems: "center",
            justifyContent: "center", width: 110, height: 110, flexShrink: 0,
          }} initial={{ opacity: 0, y: -20, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.85, type: "spring", stiffness: 90 }}>

            {/* Outer slow ring */}
            <motion.div style={{
              position: "absolute", width: 104, height: 104, borderRadius: "50%",
              border: "1px solid rgba(6,182,212,0.35)",
            }} animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} />

            {/* Tick dots */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <div key={i} style={{
                position: "absolute",
                width: i % 2 === 0 ? 4 : 3, height: i % 2 === 0 ? 4 : 3,
                borderRadius: "50%",
                background: i % 2 === 0 ? "rgba(6,182,212,0.85)" : "rgba(139,92,246,0.65)",
                transformOrigin: "55px 55px",
                transform: `rotate(${deg}deg) translateY(-51px)`,
                boxShadow: i % 2 === 0 ? "0 0 5px rgba(6,182,212,1)" : "0 0 4px rgba(139,92,246,0.8)",
              }} />
            ))}

            {/* Mid counter-rotate dashed */}
            <motion.div style={{
              position: "absolute", width: 84, height: 84, borderRadius: "50%",
              border: "1px dashed rgba(139,92,246,0.38)",
            }} animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />

            {/* Ambient glow */}
            <motion.div style={{
              position: "absolute", width: 58, height: 58, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(6,182,212,0.28) 0%, rgba(139,92,246,0.18) 50%, transparent 70%)",
              filter: "blur(8px)",
            }} animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }} />

            {/* Core icon */}
            <motion.div style={{
              width: 48, height: 48, borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(139,92,246,0.22) 100%)",
              border: "1.5px solid rgba(6,182,212,0.55)",
              backdropFilter: "blur(8px)",
            }} animate={{
              boxShadow: [
                "0 0 14px rgba(6,182,212,0.35), inset 0 0 8px rgba(6,182,212,0.10)",
                "0 0 36px rgba(6,182,212,0.65), 0 0 60px rgba(139,92,246,0.22), inset 0 0 16px rgba(6,182,212,0.16)",
                "0 0 14px rgba(6,182,212,0.35), inset 0 0 8px rgba(6,182,212,0.10)",
              ],
            }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Zap size={24} style={{ color: "#22d3ee", filter: "drop-shadow(0 0 8px rgba(6,182,212,1))" }} />
            </motion.div>
          </motion.div>

          {/* ── TITLE "ASCEND" — 3-D layered text ── */}
          <motion.div style={{
            marginTop: "clamp(14px, 2.5vh, 28px)",
            position: "relative", flexShrink: 0,
          }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8, ease: "easeOut" }}>

            {/* Bloom behind title */}
            <motion.div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: 380, height: 90,
              background: "radial-gradient(ellipse, rgba(6,182,212,0.22) 0%, rgba(0,100,200,0.15) 45%, transparent 72%)",
              filter: "blur(22px)", pointerEvents: "none",
            }} animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3.5, repeat: Infinity }} />

            <h1 style={{
              margin: 0, padding: 0,
              fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
              fontSize: "clamp(3.2rem, 13vw, 5rem)",
              fontWeight: 900,
              letterSpacing: "0.18em",
              color: "#a8f0ff",
              position: "relative",
              textShadow: [
                "0 1px 0 rgba(0,220,255,0.95)",
                "0 2px 0 rgba(0,190,240,0.85)",
                "0 3px 0 rgba(0,160,220,0.75)",
                "0 4px 0 rgba(0,130,200,0.65)",
                "0 5px 0 rgba(0,100,170,0.55)",
                "0 6px 0 rgba(0,70,140,0.45)",
                "0 8px 12px rgba(0,0,0,0.65)",
                "0 0 30px rgba(6,210,255,0.75)",
                "0 0 70px rgba(6,182,212,0.45)",
              ].join(", "),
            }}>
              ASCEND
            </h1>
          </motion.div>

          {/* ── SUBTITLE ── */}
          <motion.p style={{
            marginTop: "clamp(8px, 1.5vh, 16px)", marginBottom: 0,
            textAlign: "center",
            fontSize: "clamp(14px, 4vw, 18px)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            textShadow: "0 0 20px rgba(6,182,212,0.50), 0 1px 3px rgba(0,0,0,0.70)",
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.02em",
            maxWidth: 340, paddingLeft: 24, paddingRight: 24,
            flexShrink: 0,
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.7 }}>
            Reach Your Potential. One Small Win at a Time.
          </motion.p>

          {/* ── PORTAL IMAGE — grows to fill remaining space ── */}
          <motion.div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", minHeight: 0,
            marginTop: "clamp(8px, 1.5vh, 18px)",
            marginBottom: "clamp(8px, 1.5vh, 18px)",
            position: "relative",
          }} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}>

            {/* Portal outer glow ring */}
            <motion.div style={{
              position: "absolute",
              width: "min(88vw, 380px)", height: "min(88vw, 380px)",
              borderRadius: "50%",
              boxShadow: "0 0 60px rgba(6,182,212,0.35), 0 0 120px rgba(6,182,212,0.18)",
              pointerEvents: "none",
            }} animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />

            <img
              src="/assets/images/intro-portal.png"
              alt="portal"
              style={{
                width: "min(88vw, 380px)", height: "min(88vw, 380px)",
                objectFit: "cover", borderRadius: "50%",
                filter: "drop-shadow(0 0 32px rgba(6,182,212,0.55)) drop-shadow(0 0 8px rgba(0,0,0,0.80))",
              }}
            />

            {/* Activation burst rings */}
            <AnimatePresence>
              {isActivating && [140, 260, 400].map((sz, i) => (
                <motion.div key={i} style={{
                  position: "absolute", borderRadius: "50%",
                  width: sz, height: sz,
                  border: "1.5px solid rgba(6,182,212,0.85)",
                  top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                }} initial={{ scale: 0.3, opacity: 0.9 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.55 + i * 0.12, delay: i * 0.10, ease: "easeOut" }} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* ── TAP TO BEGIN BUTTON ── */}
          <motion.button
            onClick={handleBegin}
            style={{
              flexShrink: 0,
              width: "min(76vw, 300px)",
              padding: "13px 32px",
              borderRadius: "10px",
              background: "rgba(1,12,28,0.72)",
              border: "1.5px solid rgba(6,182,212,0.60)",
              color: "rgba(255,255,255,0.92)",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "clamp(15px, 4.5vw, 19px)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              position: "relative", overflow: "hidden",
            }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.96 }}
            data-testid="button-begin-ascension"
          >
            {/* Top edge highlight */}
            <div style={{
              position: "absolute", top: 0, left: "12%", right: "12%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.70), rgba(34,211,238,0.85), rgba(6,182,212,0.70), transparent)",
              pointerEvents: "none",
            }} />
            {/* Glow pulse */}
            <motion.div style={{
              position: "absolute", inset: 0, borderRadius: "10px", pointerEvents: "none",
              boxShadow: "inset 0 0 0px rgba(6,182,212,0)",
            }} animate={{
              boxShadow: [
                "0 0 18px rgba(6,182,212,0.25), 0 0 40px rgba(6,182,212,0.10)",
                "0 0 34px rgba(6,182,212,0.50), 0 0 70px rgba(6,182,212,0.22)",
                "0 0 18px rgba(6,182,212,0.25), 0 0 40px rgba(6,182,212,0.10)",
              ],
            }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />

            <span style={{ position: "relative", zIndex: 1 }}>Tap to Begin</span>
          </motion.button>

          {/* ── BOTTOM-RIGHT STAR ── */}
          <motion.div style={{
            position: "fixed", bottom: 26, right: 26, zIndex: 20,
            color: "rgba(6,182,212,0.70)",
            fontSize: 18,
            textShadow: "0 0 10px rgba(6,182,212,0.9)",
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}>
            ✦
          </motion.div>
        </div>

        {/* ── ACTIVATION FLASH ── */}
        <AnimatePresence>
          {isActivating && (
            <motion.div
              style={{
                position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none",
                background: "radial-gradient(ellipse at 50% 55%, rgba(6,182,212,0.65) 0%, rgba(139,92,246,0.35) 40%, transparent 70%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.22, 0] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

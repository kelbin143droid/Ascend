import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface IntroScreenProps {
  onBeginAscension: () => void;
}

export function IntroScreen({ onBeginAscension }: IntroScreenProps) {
  const [isActivating, setIsActivating]     = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleBegin = () => {
    if (isActivating || isTransitioning) return;
    setIsActivating(true);
    setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(onBeginAscension, 900);
    }, 650);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-hidden"
        style={{ userSelect: "none" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isTransitioning ? 0 : 1 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      >
        {/* ── BACKGROUND ── */}
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

        {/* Vignette */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,0,0,0.60) 100%)",
        }} />

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
            borderColor: isActivating ? "rgba(34,211,238,0.95)" : "rgba(6,182,212,0.45)",
            transition: "border-color 0.3s",
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }} />
        ))}

        {/* ── MAIN LAYOUT ── */}
        <div style={{
          position: "relative", zIndex: 10,
          height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center",
          paddingTop: "clamp(44px, 8vh, 80px)",
          paddingBottom: "clamp(36px, 6vh, 60px)",
        }}>

          {/* ── SIGIL — single clean ring, no clutter ── */}
          <motion.div style={{
            position: "relative", display: "flex", alignItems: "center",
            justifyContent: "center", width: 96, height: 96, flexShrink: 0,
          }} initial={{ opacity: 0, y: -18, scale: 0.65 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.9, type: "spring", stiffness: 80 }}>

            {/* Single outer ring — slow, confident */}
            <motion.div style={{
              position: "absolute", width: 92, height: 92, borderRadius: "50%",
              border: "1px solid rgba(6,182,212,0.40)",
            }} animate={{ rotate: 360 }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear" }} />

            {/* Subtle ambient glow */}
            <motion.div style={{
              position: "absolute", width: 62, height: 62, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)",
              filter: "blur(10px)",
            }} animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />

            {/* Core icon tile */}
            <motion.div style={{
              width: 46, height: 46, borderRadius: "11px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.20) 100%)",
              border: "1.5px solid rgba(6,182,212,0.50)",
              backdropFilter: "blur(10px)",
            }} animate={{
              boxShadow: [
                "0 0 12px rgba(6,182,212,0.30), inset 0 0 6px rgba(6,182,212,0.08)",
                "0 0 32px rgba(6,182,212,0.60), 0 0 55px rgba(139,92,246,0.18), inset 0 0 14px rgba(6,182,212,0.14)",
                "0 0 12px rgba(6,182,212,0.30), inset 0 0 6px rgba(6,182,212,0.08)",
              ],
            }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
              <Zap size={22} style={{ color: "#22d3ee", filter: "drop-shadow(0 0 7px rgba(6,182,212,1))" }} />
            </motion.div>
          </motion.div>

          {/* ── TITLE "ASCEND" ── */}
          <motion.div style={{
            marginTop: "clamp(18px, 3vh, 32px)",
            position: "relative", flexShrink: 0,
          }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.85, ease: "easeOut" }}>

            {/* Bloom behind title */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 340, height: 80,
              background: "radial-gradient(ellipse, rgba(6,182,212,0.20) 0%, rgba(0,100,200,0.12) 50%, transparent 72%)",
              filter: "blur(24px)", pointerEvents: "none",
            }} />

            <h1 style={{
              margin: 0, padding: 0,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(3rem, 12vw, 4.8rem)",
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: "#b8f4ff",
              position: "relative",
              textShadow: [
                "0 1px 0 rgba(0,225,255,0.95)",
                "0 2px 0 rgba(0,195,245,0.85)",
                "0 3px 0 rgba(0,165,225,0.75)",
                "0 4px 0 rgba(0,130,200,0.65)",
                "0 5px 0 rgba(0,95,165,0.55)",
                "0 6px 0 rgba(0,65,130,0.45)",
                "0 9px 14px rgba(0,0,0,0.70)",
                "0 0 28px rgba(6,215,255,0.70)",
                "0 0 65px rgba(6,182,212,0.40)",
              ].join(", "),
            }}>
              ASCEND
            </h1>
          </motion.div>

          {/* ── SUBTITLE — lighter weight, fixed line ── */}
          <motion.p style={{
            marginTop: "clamp(10px, 1.8vh, 18px)", marginBottom: 0,
            textAlign: "center",
            fontSize: "clamp(16px, 4.6vw, 20px)",
            fontWeight: 600,
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.04em",
            maxWidth: 320, paddingLeft: 24, paddingRight: 24,
            flexShrink: 0, lineHeight: 1.6,
            margin: 0,
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.75 }}>
            <span style={{
              color: "#ffd47a",
              textShadow: "0 0 22px rgba(255,180,60,0.55), 0 1px 3px rgba(0,0,0,0.70)",
            }}>Reach Your Potential.</span>
            <br />
            <span style={{
              color: "rgba(255,255,255,0.90)",
              textShadow: "0 0 18px rgba(6,182,212,0.40), 0 1px 3px rgba(0,0,0,0.65)",
            }}>One Small Win at a Time.</span>
          </motion.p>

          {/* ── CENTER ANCHOR — ambient glow orb + scan line ── */}
          <motion.div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            width: "100%", minHeight: 0,
            position: "relative",
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 1.2 }}>

            {/* Large ambient orb — purely atmospheric */}
            <motion.div style={{
              width: "min(70vw, 260px)", height: "min(70vw, 260px)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(6,182,212,0.09) 0%, rgba(99,102,241,0.06) 45%, transparent 72%)",
              filter: "blur(38px)",
              pointerEvents: "none",
            }} animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

            {/* Horizontal scan line with system data */}
            <div style={{
              position: "absolute",
              display: "flex", alignItems: "center", gap: 10,
              pointerEvents: "none",
            }}>
              <div style={{ width: "clamp(30px, 8vw, 52px)", height: "1px", background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.50))" }} />
              <motion.span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(11px, 2.8vw, 13px)",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "rgba(6,182,212,0.75)",
                whiteSpace: "nowrap",
              }} animate={{ opacity: [0.55, 0.95, 0.55] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
                GAMIFIED LIFE SYSTEM
              </motion.span>
              <div style={{ width: "clamp(30px, 8vw, 52px)", height: "1px", background: "linear-gradient(90deg, rgba(6,182,212,0.50), transparent)" }} />
            </div>
          </motion.div>

          {/* ── BUTTON AREA ── */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>

            {/* Small version label above button */}
            <motion.span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(8px, 2vw, 10px)",
              letterSpacing: "0.18em",
              color: "rgba(6,182,212,0.45)",
              textTransform: "uppercase",
            }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.7 }}>
              v1.0 · AWAKENED SYSTEM
            </motion.span>

            {/* CTA button */}
            <motion.button
              onClick={handleBegin}
              style={{
                width: "min(74vw, 290px)",
                padding: "14px 32px",
                borderRadius: "10px",
                background: "rgba(1,10,24,0.75)",
                border: "1.5px solid rgba(6,182,212,0.55)",
                color: "rgba(255,255,255,0.90)",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "clamp(15px, 4.2vw, 18px)",
                fontWeight: 600,
                letterSpacing: "0.08em",
                cursor: "pointer",
                backdropFilter: "blur(10px)",
                position: "relative", overflow: "hidden",
              }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.65, duration: 0.75 }}
              whileHover={{ scale: 1.022 }} whileTap={{ scale: 0.965 }}
              data-testid="button-begin-ascension"
            >
              {/* Top edge highlight */}
              <div style={{
                position: "absolute", top: 0, left: "14%", right: "14%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.65), rgba(34,211,238,0.90), rgba(6,182,212,0.65), transparent)",
                pointerEvents: "none",
              }} />
              {/* Breathing glow */}
              <motion.div style={{
                position: "absolute", inset: 0, borderRadius: "10px", pointerEvents: "none",
              }} animate={{
                boxShadow: [
                  "0 0 16px rgba(6,182,212,0.20), 0 0 36px rgba(6,182,212,0.08)",
                  "0 0 30px rgba(6,182,212,0.45), 0 0 65px rgba(6,182,212,0.18)",
                  "0 0 16px rgba(6,182,212,0.20), 0 0 36px rgba(6,182,212,0.08)",
                ],
              }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />

              <span style={{ position: "relative", zIndex: 1 }}>Tap to Begin</span>
            </motion.button>
          </div>
        </div>

        {/* ── ACTIVATION FLASH ── */}
        <AnimatePresence>
          {isActivating && (
            <motion.div
              style={{
                position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none",
                background: "radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.55) 0%, rgba(139,92,246,0.28) 45%, transparent 72%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.25, 0] }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

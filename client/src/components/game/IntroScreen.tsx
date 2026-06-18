import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroScreenProps {
  onBeginAscension: () => void;
}

export function IntroScreen({ onBeginAscension }: IntroScreenProps) {
  const [isActivating, setIsActivating]       = useState(false);
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
          background: "radial-gradient(ellipse at 50% 40%, #07092a 0%, #03051a 55%, #010210 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(/assets/images/intro-bg.png)",
          backgroundSize: "cover", backgroundPosition: "center center",
          backgroundRepeat: "no-repeat", opacity: 0.92,
        }} />

        {/* Inner radial darkening to frame the content */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.50) 100%)",
        }} />

        {/* ── HUD CORNER BRACKETS ── */}
        {[
          { top: 20, left: 20, borderTop: "1.5px solid", borderLeft: "1.5px solid" },
          { top: 20, right: 20, borderTop: "1.5px solid", borderRight: "1.5px solid" },
          { bottom: 20, left: 20, borderBottom: "1.5px solid", borderLeft: "1.5px solid" },
          { bottom: 20, right: 20, borderBottom: "1.5px solid", borderRight: "1.5px solid" },
        ].map((s, i) => (
          <motion.div key={i} style={{
            position: "fixed", width: 24, height: 24, pointerEvents: "none", zIndex: 20,
            ...s as React.CSSProperties,
            borderColor: isActivating ? "rgba(34,211,238,0.95)" : "rgba(6,182,212,0.50)",
            transition: "border-color 0.3s",
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.07, duration: 0.6 }} />
        ))}

        {/* ── MAIN LAYOUT ── */}
        <div style={{
          position: "relative", zIndex: 10,
          height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center",
          paddingTop: "clamp(52px, 10vh, 96px)",
          paddingBottom: "clamp(36px, 6vh, 60px)",
        }}>

          {/* ── ASCEND TITLE — chrome metallic glossy ── */}
          <motion.div style={{ position: "relative", flexShrink: 0 }}
            initial={{ opacity: 0, y: -22, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}>

            {/* Wide bloom behind title */}
            <motion.div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 420, height: 110,
              background: "radial-gradient(ellipse, rgba(6,182,212,0.28) 0%, rgba(80,120,255,0.14) 50%, transparent 72%)",
              filter: "blur(28px)", pointerEvents: "none",
            }} animate={{ opacity: [0.65, 1, 0.65] }} transition={{ duration: 4, repeat: Infinity }} />

            <h1 style={{
              margin: 0, padding: 0,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(3.4rem, 13.5vw, 5.2rem)",
              fontWeight: 900,
              letterSpacing: "0.14em",
              position: "relative",
              /* Chrome/metallic gradient via background-clip */
              background: "linear-gradient(180deg, #ffffff 0%, #b8f0ff 22%, #5dd8f8 48%, #2bb5e8 68%, #1a7ab5 85%, #0d4a80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 2px 0 rgba(0,160,220,0.8)) drop-shadow(0 4px 0 rgba(0,100,180,0.6)) drop-shadow(0 8px 18px rgba(0,0,0,0.75)) drop-shadow(0 0 40px rgba(6,200,255,0.55))",
            }}>
              ASCEND
            </h1>
          </motion.div>

          {/* ── GAMIFIED LEVELING LIFE SYSTEM — horizontal bar ── */}
          <motion.div style={{
            marginTop: "clamp(14px, 2.5vh, 24px)",
            width: "100%", display: "flex", alignItems: "center",
            gap: 0, flexShrink: 0,
          }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}>

            {/* Left decorative line */}
            <div style={{ flex: 1, height: "1px", position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.25) 40%, rgba(6,182,212,0.65) 100%)",
              }} />
              {/* Small tick marks */}
              {[15, 35, 55, 72, 86].map((pct, i) => (
                <div key={i} style={{
                  position: "absolute", top: -2, left: `${pct}%`,
                  width: i === 4 ? 4 : 2, height: i === 4 ? 5 : 4,
                  background: `rgba(6,182,212,${0.3 + i * 0.12})`,
                }} />
              ))}
            </div>

            {/* Text pill */}
            <div style={{
              padding: "6px 18px",
              background: "linear-gradient(180deg, rgba(6,182,212,0.12) 0%, rgba(2,80,140,0.18) 100%)",
              border: "1px solid rgba(6,182,212,0.45)",
              borderRadius: "4px",
              backdropFilter: "blur(8px)",
              position: "relative", overflow: "hidden",
              flexShrink: 0,
            }}>
              {/* Top sheen */}
              <div style={{
                position: "absolute", top: 0, left: "8%", right: "8%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.50), transparent)",
              }} />
              <motion.span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(9px, 2.6vw, 12px)",
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: "#f5c842",
                whiteSpace: "nowrap",
                display: "block",
                textShadow: "0 0 14px rgba(245,180,30,0.70), 0 1px 2px rgba(0,0,0,0.60)",
              }} animate={{ opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                GAMIFIED LEVELING LIFE SYSTEM
              </motion.span>
            </div>

            {/* Right decorative line */}
            <div style={{ flex: 1, height: "1px", position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, rgba(6,182,212,0.65) 0%, rgba(6,182,212,0.25) 60%, transparent 100%)",
              }} />
              {[14, 28, 45, 65, 85].map((pct, i) => (
                <div key={i} style={{
                  position: "absolute", top: -2, left: `${pct}%`,
                  width: i === 0 ? 4 : 2, height: i === 0 ? 5 : 4,
                  background: `rgba(6,182,212,${0.55 - i * 0.10})`,
                }} />
              ))}
            </div>
          </motion.div>

          {/* ── CENTER SPACE — atmospheric orb ── */}
          <motion.div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", minHeight: 0, position: "relative",
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 1.4 }}>
            <motion.div style={{
              width: "min(65vw, 240px)", height: "min(65vw, 240px)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(120,80,200,0.10) 0%, rgba(6,182,212,0.06) 45%, transparent 72%)",
              filter: "blur(42px)", pointerEvents: "none",
            }} animate={{ scale: [1, 1.15, 1], opacity: [0.60, 0.95, 0.60] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
          </motion.div>

          {/* ── BUTTON AREA ── */}
          <div style={{
            flexShrink: 0, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 10, width: "100%",
          }}>
            {/* Version label */}
            <motion.span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(8px, 2vw, 10px)",
              letterSpacing: "0.18em",
              color: "rgba(6,182,212,0.50)",
            }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.7 }}>
              V1.0 · AWAKENED SYSTEM
            </motion.span>

            {/* CTA — glossy HUD button with side connectors */}
            <motion.div style={{ position: "relative", width: "min(78vw, 310px)" }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.65, duration: 0.75 }}>

              {/* Left connector tab */}
              <div style={{
                position: "absolute", left: -14, top: "50%", transform: "translateY(-50%)",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                {[12, 8, 5].map((w, i) => (
                  <div key={i} style={{
                    width: w, height: 2,
                    background: `rgba(6,182,212,${0.7 - i * 0.15})`,
                    alignSelf: i === 1 ? "flex-end" : "flex-start",
                  }} />
                ))}
              </div>

              {/* Right connector tab */}
              <div style={{
                position: "absolute", right: -14, top: "50%", transform: "translateY(-50%)",
                display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end",
              }}>
                {[12, 8, 5].map((w, i) => (
                  <div key={i} style={{
                    width: w, height: 2,
                    background: `rgba(6,182,212,${0.7 - i * 0.15})`,
                    alignSelf: i === 1 ? "flex-start" : "flex-end",
                  }} />
                ))}
              </div>

              <motion.button
                onClick={handleBegin}
                style={{
                  width: "100%",
                  padding: "15px 32px",
                  borderRadius: "8px",
                  background: "linear-gradient(180deg, rgba(80,210,240,0.22) 0%, rgba(6,140,200,0.28) 50%, rgba(4,80,160,0.32) 100%)",
                  border: "1.5px solid rgba(6,182,212,0.65)",
                  color: "rgba(255,255,255,0.95)",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "clamp(16px, 4.5vw, 20px)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  backdropFilter: "blur(14px)",
                  position: "relative", overflow: "hidden",
                  boxShadow: "0 0 0 0 transparent",
                }}
                whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.965 }}
                data-testid="button-begin-ascension"
              >
                {/* Top gloss sheen */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "45%",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)",
                  borderRadius: "8px 8px 0 0", pointerEvents: "none",
                }} />
                {/* Top edge bright line */}
                <div style={{
                  position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                  background: "linear-gradient(90deg, transparent, rgba(140,230,255,0.90), rgba(255,255,255,0.70), rgba(140,230,255,0.90), transparent)",
                  pointerEvents: "none",
                }} />
                {/* Breathing outer glow */}
                <motion.div style={{
                  position: "absolute", inset: 0, borderRadius: "8px", pointerEvents: "none",
                }} animate={{
                  boxShadow: [
                    "0 0 18px rgba(6,182,212,0.28), 0 0 40px rgba(6,182,212,0.10)",
                    "0 0 36px rgba(6,182,212,0.55), 0 0 70px rgba(80,200,255,0.22)",
                    "0 0 18px rgba(6,182,212,0.28), 0 0 40px rgba(6,182,212,0.10)",
                  ],
                }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />

                <span style={{ position: "relative", zIndex: 1 }}>Tap to Begin</span>
              </motion.button>
            </motion.div>
          </div>

          {/* ── BOTTOM-RIGHT STAR ── */}
          <motion.div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 20,
            color: "rgba(6,182,212,0.65)", fontSize: 16,
            textShadow: "0 0 10px rgba(6,182,212,0.90)",
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}>
            ✦
          </motion.div>
        </div>

        {/* ── ACTIVATION FLASH ── */}
        <AnimatePresence>
          {isActivating && (
            <motion.div style={{
              position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none",
              background: "radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.55) 0%, rgba(120,80,200,0.25) 45%, transparent 72%)",
            }} initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.30, 0] }}
              transition={{ duration: 0.65, ease: "easeOut" }} />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

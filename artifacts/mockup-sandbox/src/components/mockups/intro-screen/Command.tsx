import "./_group.css";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { Zap } from "lucide-react";

const LETTERS = "ASCEND".split("");

export function Command() {
  const [active, setActive] = useState(false);
  const particles = useRef(
    Array.from({ length: 36 }, (_, i) => ({
      id: i, x: 3 + Math.random() * 94, y: 3 + Math.random() * 94,
      size: 1 + Math.random() * 2.2, dur: 10 + Math.random() * 16,
      delay: Math.random() * 10, dx: (Math.random() - 0.5) * 60,
      dy: -(12 + Math.random() * 55), op: 0.15 + Math.random() * 0.35,
      c: i % 5,
    }))
  ).current;

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 38%, #050d20 0%, #030912 45%, #010509 100%)",
    }}>
      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 28%, rgba(0,0,0,0.75) 100%)",
      }} />

      {/* Ambient glow orbs */}
      <motion.div style={{
        position: "absolute", top: "28%", left: "50%",
        transform: "translate(-50%,-50%)", width: 720, height: 520,
        background: "radial-gradient(ellipse, rgba(6,182,212,0.09) 0%, rgba(139,92,246,0.11) 35%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none",
      }} animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />

      {/* Subtle hex grid overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpolygon points='28,2 54,15 54,44 28,57 2,44 2,15' fill='none' stroke='%2306b6d4' stroke-width='0.8'/%3E%3C/svg%3E")`,
        backgroundSize: "56px 100px",
      }} />

      {/* Floating particles */}
      {particles.map(p => (
        <motion.div key={p.id} style={{
          position: "absolute", borderRadius: "50%", pointerEvents: "none",
          width: p.size, height: p.size,
          left: `${p.x}%`, top: `${p.y}%`,
          background: p.c === 0 ? "rgba(6,182,212,0.9)" : p.c === 1 ? "rgba(139,92,246,0.8)"
            : p.c === 2 ? "rgba(167,139,250,0.7)" : p.c === 3 ? "rgba(34,211,238,0.8)" : "rgba(196,181,253,0.55)",
          boxShadow: p.c <= 1 ? `0 0 ${p.size * 3}px rgba(6,182,212,0.3)` : `0 0 ${p.size * 2}px rgba(139,92,246,0.25)`,
        }} animate={{ y: [0, p.dy, 0], x: [0, p.dx, 0], opacity: [0, p.op, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
      ))}

      {/* Scan line */}
      <motion.div style={{
        position: "absolute", left: 0, right: 0, height: 1, pointerEvents: "none",
        background: "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.22) 30%, rgba(34,211,238,0.38) 50%, rgba(6,182,212,0.22) 70%, transparent 100%)",
      }} animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 7, ease: "linear" }} />

      {/* ── HUD CORNER BRACKETS (with inner tick) ── */}
      {[
        { top: 24, left: 24, bt: "1.5px solid", bl: "1.5px solid" },
        { top: 24, right: 24, bt: "1.5px solid", br: "1.5px solid" },
        { bottom: 24, left: 24, bb: "1.5px solid", bl: "1.5px solid" },
        { bottom: 24, right: 24, bb: "1.5px solid", br: "1.5px solid" },
      ].map((b, i) => (
        <motion.div key={i} style={{
          position: "fixed", width: 24, height: 24, pointerEvents: "none", zIndex: 20,
          ...b as any,
          borderColor: active ? "rgba(34,211,238,0.95)" : "rgba(6,182,212,0.5)",
          transition: "border-color 0.3s",
        }} initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.09, duration: 0.5, type: "spring" }} />
      ))}

      {/* ── CENTER CONTENT ── */}
      <motion.div style={{
        position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", padding: "0 24px", maxWidth: 400, width: "100%",
      }} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 1.1, ease: "easeOut" }}>

        {/* ── SIGIL — hexagonal outer frame ── */}
        <motion.div style={{
          position: "relative", display: "flex", alignItems: "center",
          justifyContent: "center", width: 164, height: 164, marginBottom: 32,
        }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.9, type: "spring", stiffness: 100 }}>

          {/* Hex outer frame (SVG, slow spin) */}
          <motion.svg style={{ position: "absolute", width: 158, height: 158 }}
            animate={{ rotate: 360 }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }}>
            <polygon points="79,4 150,41.5 150,116.5 79,154 8,116.5 8,41.5"
              fill="none" stroke="rgba(6,182,212,0.28)" strokeWidth="1" />
          </motion.svg>

          {/* Outer ring with tick dots */}
          <motion.div style={{
            position: "absolute", width: 140, height: 140, borderRadius: "50%",
            border: "1px solid rgba(6,182,212,0.22)",
          }} animate={{ rotate: -360 }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }} />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <div key={i} style={{
              position: "absolute", width: i % 2 === 0 ? 5 : 3, height: i % 2 === 0 ? 5 : 3,
              borderRadius: "50%",
              background: i % 2 === 0 ? "rgba(6,182,212,0.8)" : "rgba(139,92,246,0.6)",
              transformOrigin: "82px 82px",
              transform: `rotate(${deg}deg) translateY(-70px)`,
              boxShadow: i % 2 === 0 ? "0 0 5px rgba(6,182,212,0.9)" : "0 0 4px rgba(139,92,246,0.7)",
            }} />
          ))}

          {/* Mid dashed ring */}
          <motion.div style={{
            position: "absolute", width: 112, height: 112, borderRadius: "50%",
            border: "1px dashed rgba(139,92,246,0.30)",
          }} animate={{ rotate: 360 }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }} />

          {/* Ambient glow */}
          <motion.div style={{
            position: "absolute", width: 76, height: 76, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.26) 0%, rgba(139,92,246,0.20) 50%, transparent 70%)",
            filter: "blur(10px)",
          }} animate={{ scale: [1, 1.22, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />

          {/* Core: hexagonal icon box */}
          <motion.div style={{
            width: 62, height: 62,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, rgba(6,182,212,0.16) 0%, rgba(139,92,246,0.20) 100%)",
            clipPath: "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
            border: "none", position: "relative", backdropFilter: "blur(10px)",
          }} animate={{
            boxShadow: [
              "0 0 20px rgba(6,182,212,0.35), inset 0 0 12px rgba(6,182,212,0.10)",
              "0 0 45px rgba(6,182,212,0.65), 0 0 70px rgba(139,92,246,0.25), inset 0 0 22px rgba(6,182,212,0.16)",
              "0 0 20px rgba(6,182,212,0.35), inset 0 0 12px rgba(6,182,212,0.10)",
            ],
          }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Zap size={28} style={{ color: "#22d3ee", filter: "drop-shadow(0 0 10px rgba(6,182,212,1))" }} />
          </motion.div>
        </motion.div>

        {/* ── TITLE — gradient text, tighter spacing ── */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 12 }}>
          {/* Title bloom */}
          <motion.div style={{
            position: "absolute", width: 360, height: 86,
            background: "radial-gradient(ellipse, rgba(6,182,212,0.14) 0%, rgba(139,92,246,0.09) 50%, transparent 75%)",
            filter: "blur(20px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3.5, repeat: Infinity }} />

          {LETTERS.map((ch, i) => (
            <motion.span key={i} style={{
              display: "inline-block",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "3.5rem", fontWeight: 900, lineHeight: 1,
              letterSpacing: "0.12em",
              background: `linear-gradient(180deg, #e0f9ff 0%, #67e8f9 40%, #c4b5fd 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 18px rgba(6,182,212,0.6))",
            }} initial={{ opacity: 0, y: -22, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "drop-shadow(0 0 18px rgba(6,182,212,0.6))" }}
              transition={{ delay: 0.7 + i * 0.10, duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}>
              {ch}
            </motion.span>
          ))}
        </div>

        {/* Headline */}
        <motion.h1 style={{
          marginBottom: 12, textAlign: "center", fontSize: 28, fontWeight: 900,
          lineHeight: 1.2, letterSpacing: "0.01em", color: "white",
          textShadow: "0 0 34px rgba(6,182,212,0.38)", maxWidth: 320,
          fontFamily: "'Rajdhani', sans-serif",
        }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.7 }}>
          Turn your real life into a leveling system.
        </motion.h1>

        <motion.p style={{
          marginBottom: 20, maxWidth: 310, textAlign: "center", fontSize: 13,
          fontWeight: 500, lineHeight: 1.65, color: "rgba(148,163,184,0.78)",
          fontFamily: "'Rajdhani', sans-serif",
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.15, duration: 0.7 }}>
          Build habits, train your stats, plan your day,<br />and grow through small daily quests.
        </motion.p>

        {/* ── PROTOCOL LABEL — framed ── */}
        <motion.div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.9 }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.45))" }} />
          <span style={{
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
            color: "rgba(6,182,212,0.6)", letterSpacing: "0.48em", textTransform: "uppercase",
          }}>AWAKENED SYSTEM PROTOCOL</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(6,182,212,0.45), transparent)" }} />
        </motion.div>

        {/* ── CTA BUTTON — sharper, stronger edge light ── */}
        <motion.button onClick={() => setActive(true)}
          style={{
            width: "100%", maxWidth: 340, position: "relative", overflow: "hidden",
            borderRadius: 16, cursor: "pointer", border: "none", padding: 0,
            background: "none",
          }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.65, duration: 0.85 }}
          whileHover={{ scale: 1.022 }} whileTap={{ scale: 0.965 }}>

          <motion.div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "16px 24px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.22em", textTransform: "uppercase", fontSize: 13, fontWeight: 700,
            color: "#e0f7ff", borderRadius: 16,
            background: "linear-gradient(135deg, #0891b2 0%, #0e7490 30%, #5b21b6 70%, #7c3aed 100%)",
            border: "1.5px solid rgba(6,182,212,0.55)",
          }} animate={{
            boxShadow: [
              "0 0 24px rgba(6,182,212,0.32), 0 0 52px rgba(139,92,246,0.20), 0 6px 28px rgba(0,0,0,0.55)",
              "0 0 52px rgba(6,182,212,0.62), 0 0 92px rgba(139,92,246,0.38), 0 6px 42px rgba(0,0,0,0.65)",
              "0 0 24px rgba(6,182,212,0.32), 0 0 52px rgba(139,92,246,0.20), 0 6px 28px rgba(0,0,0,0.55)",
            ],
          }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
            {/* Top edge highlight — sharper than original */}
            <div style={{
              position: "absolute", top: 0, left: "10%", right: "10%", height: "1.5px",
              background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.65), rgba(34,211,238,0.85), rgba(6,182,212,0.65), transparent)",
              pointerEvents: "none",
            }} />
            {/* Bottom subtle glow edge */}
            <div style={{
              position: "absolute", bottom: 0, left: "20%", right: "20%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.40), transparent)",
              pointerEvents: "none",
            }} />
            {/* Shimmer */}
            <motion.div style={{
              position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden", pointerEvents: "none",
            }}>
              <motion.div style={{
                position: "absolute", top: 0, bottom: 0, width: "38%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.20), rgba(6,182,212,0.24), transparent)",
                skewX: "-12deg",
              }} animate={{ left: ["-48%", "145%"] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.8, ease: "linear", delay: 4 }} />
            </motion.div>
            <Zap size={17} style={{ color: "#67e8f9", filter: "drop-shadow(0 0 6px rgba(6,182,212,0.9))", position: "relative", zIndex: 1 }} />
            <span style={{ position: "relative", zIndex: 1 }}>BEGIN</span>
          </motion.div>
        </motion.button>

        {/* Footer */}
        <motion.p style={{
          marginTop: 24, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase",
          fontFamily: "'JetBrains Mono', monospace", color: "rgba(100,116,139,0.35)",
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.9, duration: 0.6 }}>
          ASCEND v2.0 // NEON GENESIS
        </motion.p>
      </motion.div>
    </div>
  );
}

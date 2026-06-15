import "./_group.css";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { Zap } from "lucide-react";

const LETTERS = "ASCEND".split("");

export function Nova() {
  const [active, setActive] = useState(false);
  const particles = useRef(
    Array.from({ length: 44 }, (_, i) => ({
      id: i, x: 2 + Math.random() * 96, y: 2 + Math.random() * 96,
      size: 0.8 + Math.random() * 2.8, dur: 9 + Math.random() * 18,
      delay: Math.random() * 12, dx: (Math.random() - 0.5) * 70,
      dy: -(10 + Math.random() * 65), op: 0.12 + Math.random() * 0.40,
      c: i % 5,
    }))
  ).current;

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 35%, #060e22 0%, #04071a 40%, #010309 100%)",
    }}>
      {/* Vignette — deeper */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 22%, rgba(0,0,0,0.82) 100%)",
      }} />

      {/* Violet deep glow — new vs original */}
      <motion.div style={{
        position: "absolute", top: "55%", left: "50%",
        transform: "translate(-50%,-50%)", width: 800, height: 400,
        background: "radial-gradient(ellipse, rgba(109,40,217,0.10) 0%, rgba(6,182,212,0.05) 50%, transparent 75%)",
        filter: "blur(90px)", pointerEvents: "none",
      }} animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }} />

      {/* Top ambient — cyan */}
      <motion.div style={{
        position: "absolute", top: "25%", left: "50%",
        transform: "translate(-50%,-50%)", width: 600, height: 450,
        background: "radial-gradient(ellipse, rgba(6,182,212,0.10) 0%, rgba(139,92,246,0.08) 45%, transparent 70%)",
        filter: "blur(75px)", pointerEvents: "none",
      }} animate={{ scale: [1, 1.07, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />

      {/* Particles — denser */}
      {particles.map(p => (
        <motion.div key={p.id} style={{
          position: "absolute", borderRadius: "50%", pointerEvents: "none",
          width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
          background: p.c === 0 ? "rgba(6,182,212,0.92)" : p.c === 1 ? "rgba(139,92,246,0.82)"
            : p.c === 2 ? "rgba(167,139,250,0.72)" : p.c === 3 ? "rgba(34,211,238,0.85)" : "rgba(196,181,253,0.58)",
          boxShadow: p.c <= 1 ? `0 0 ${p.size * 4}px rgba(6,182,212,0.35)` : `0 0 ${p.size * 3}px rgba(139,92,246,0.28)`,
        }} animate={{ y: [0, p.dy, 0], x: [0, p.dx, 0], opacity: [0, p.op, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
      ))}

      {/* Energy streaks */}
      {[
        { delay: 3, dur: 1.2, repeat: 13, top: "18%", rotate: -20, w: 220, op: 0.22 },
        { delay: 9, dur: 1.0, repeat: 18, top: "73%", rotate: 14, w: 190, op: 0.17 },
        { delay: 16, dur: 1.3, repeat: 22, top: "44%", rotate: -7, w: 160, op: 0.14 },
      ].map((s, i) => (
        <motion.div key={i} style={{
          position: "absolute", top: s.top, left: "-10%", width: s.w, height: 1.5,
          background: i % 2 === 0
            ? "linear-gradient(90deg, transparent, rgba(6,182,212,0.7), rgba(34,211,238,0.9), transparent)"
            : "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(167,139,250,0.8), transparent)",
          rotate: `${s.rotate}deg`, transformOrigin: "left center", pointerEvents: "none",
        }} animate={{ x: ["0%", "140vw"], opacity: [0, s.op, s.op, 0] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, repeatDelay: s.repeat, ease: "linear" }} />
      ))}

      {/* Scan line */}
      <motion.div style={{
        position: "absolute", left: 0, right: 0, height: 1, pointerEvents: "none",
        background: "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.28) 30%, rgba(34,211,238,0.44) 50%, rgba(6,182,212,0.28) 70%, transparent 100%)",
      }} animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 7, ease: "linear" }} />

      {/* HUD brackets */}
      {[
        { top: 24, left: 24, bt: "1.5px solid", bl: "1.5px solid" },
        { top: 24, right: 24, bt: "1.5px solid", br: "1.5px solid" },
        { bottom: 24, left: 24, bb: "1.5px solid", bl: "1.5px solid" },
        { bottom: 24, right: 24, bb: "1.5px solid", br: "1.5px solid" },
      ].map((b, i) => (
        <motion.div key={i} style={{
          position: "fixed", width: 22, height: 22, pointerEvents: "none", zIndex: 20,
          ...b as any,
          borderColor: active ? "rgba(34,211,238,0.95)" : "rgba(6,182,212,0.48)",
          transition: "border-color 0.3s",
        }} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.09, duration: 0.5, type: "spring" }} />
      ))}

      {/* ── CENTER CONTENT ── */}
      <motion.div style={{
        position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", padding: "0 24px", maxWidth: 400, width: "100%",
      }} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 1.1, ease: "easeOut" }}>

        {/* ── SIGIL — circular core, power arc ── */}
        <motion.div style={{
          position: "relative", display: "flex", alignItems: "center",
          justifyContent: "center", width: 164, height: 164, marginBottom: 28,
        }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.9, type: "spring", stiffness: 100 }}>

          {/* Outer ring slow rotate */}
          <motion.div style={{
            position: "absolute", width: 152, height: 152, borderRadius: "50%",
            border: "1px solid rgba(6,182,212,0.28)",
          }} animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />

          {/* Tick dots */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <motion.div key={i} style={{
              position: "absolute", width: i % 2 === 0 ? 5 : 3, height: i % 2 === 0 ? 5 : 3,
              borderRadius: "50%",
              background: i % 2 === 0 ? "rgba(6,182,212,0.75)" : "rgba(139,92,246,0.55)",
              transformOrigin: "80px 80px", transform: `rotate(${deg}deg) translateY(-75px)`,
              boxShadow: i % 2 === 0 ? "0 0 5px rgba(6,182,212,0.9)" : "0 0 4px rgba(139,92,246,0.7)",
            }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }} />
          ))}

          {/* Mid counter-rotate */}
          <motion.div style={{
            position: "absolute", width: 122, height: 122, borderRadius: "50%",
            border: "1px dashed rgba(139,92,246,0.32)",
          }} animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />

          {/* Power arc — new element */}
          <motion.svg style={{ position: "absolute", width: 110, height: 110 }}>
            <motion.circle cx="55" cy="55" r="48" fill="none"
              stroke="rgba(6,182,212,0.55)" strokeWidth="2.5"
              strokeLinecap="round" strokeDasharray="60 242"
              animate={{ strokeDashoffset: [0, -302] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          </motion.svg>

          {/* Glow core */}
          <motion.div style={{
            position: "absolute", width: 80, height: 80, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.28) 0%, rgba(139,92,246,0.22) 50%, transparent 70%)",
            filter: "blur(12px)",
          }} animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }} />

          {/* Core — circle container (not rounded square) */}
          <motion.div style={{
            width: 60, height: 60, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(139,92,246,0.18) 100%)",
            border: "1.5px solid rgba(6,182,212,0.52)", backdropFilter: "blur(10px)",
          }} animate={{
            boxShadow: [
              "0 0 16px rgba(6,182,212,0.32), inset 0 0 10px rgba(6,182,212,0.08)",
              "0 0 40px rgba(6,182,212,0.58), 0 0 65px rgba(139,92,246,0.22), inset 0 0 18px rgba(6,182,212,0.15)",
              "0 0 16px rgba(6,182,212,0.32), inset 0 0 10px rgba(6,182,212,0.08)",
            ],
          }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Zap size={28} style={{ color: "#22d3ee", filter: "drop-shadow(0 0 10px rgba(6,182,212,1)) drop-shadow(0 0 4px rgba(34,211,238,0.8))" }} />
          </motion.div>
        </motion.div>

        {/* ── TITLE — wider spacing, staggered glow pulse ── */}
        <div style={{
          position: "relative", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 2, marginBottom: 14,
        }}>
          <motion.div style={{
            position: "absolute", width: 360, height: 80,
            background: "radial-gradient(ellipse, rgba(6,182,212,0.13) 0%, rgba(139,92,246,0.09) 50%, transparent 75%)",
            filter: "blur(22px)", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          }} animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 3.5, repeat: Infinity }} />

          {LETTERS.map((ch, i) => (
            <motion.span key={i} style={{
              display: "inline-block",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "3.4rem", fontWeight: 900, lineHeight: 1,
              letterSpacing: "0.18em",
              color: "#f0f9ff",
            }} initial={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              animate={{
                opacity: 1, y: 0, filter: "blur(0px)",
                textShadow: [
                  `0 0 38px rgba(6,182,212,${0.5 + i * 0.05}), 0 0 70px rgba(6,182,212,0.25), 0 2px 0 rgba(0,0,0,0.55)`,
                  `0 0 60px rgba(6,182,212,${0.8 + i * 0.03}), 0 0 110px rgba(139,92,246,0.30), 0 2px 0 rgba(0,0,0,0.55)`,
                  `0 0 38px rgba(6,182,212,${0.5 + i * 0.05}), 0 0 70px rgba(6,182,212,0.25), 0 2px 0 rgba(0,0,0,0.55)`,
                ],
              }}
              transition={{
                opacity: { delay: 0.7 + i * 0.10, duration: 0.65 },
                y: { delay: 0.7 + i * 0.10, duration: 0.65 },
                filter: { delay: 0.7 + i * 0.10, duration: 0.65 },
                textShadow: { duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" },
              }}>
              {ch}
            </motion.span>
          ))}
        </div>

        {/* Headline */}
        <motion.h1 style={{
          marginBottom: 10, textAlign: "center", fontSize: 27, fontWeight: 900,
          lineHeight: 1.22, color: "white",
          textShadow: "0 0 34px rgba(6,182,212,0.36)",
          fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.01em", maxWidth: 320,
        }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.7 }}>
          Turn your real life into a leveling system.
        </motion.h1>

        {/* Subtext — italic system-log feel */}
        <motion.p style={{
          marginBottom: 18, maxWidth: 308, textAlign: "center", fontSize: 13,
          fontWeight: 400, lineHeight: 1.65, color: "rgba(148,163,184,0.72)",
          fontFamily: "'JetBrains Mono', monospace", fontStyle: "italic",
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.15, duration: 0.7 }}>
          Build habits, train your stats, plan your day, and grow through small daily quests.
        </motion.p>

        {/* ── PROTOCOL LABEL — >>> style ── */}
        <motion.p style={{
          fontSize: 9, fontFamily: "'JetBrains Mono', monospace", marginBottom: 22,
          color: "rgba(6,182,212,0.58)", letterSpacing: "0.46em", textTransform: "uppercase",
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.9 }}>
          {">>> AWAKENED SYSTEM PROTOCOL <<<"}
        </motion.p>

        {/* ── CTA — full-width pill, bottom-light radiates down ── */}
        <motion.button onClick={() => setActive(true)}
          style={{
            width: "100%", maxWidth: 360, position: "relative",
            overflow: "visible", borderRadius: 50, cursor: "pointer",
            border: "none", padding: 0, background: "none",
          }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.65, duration: 0.85 }}
          whileHover={{ scale: 1.022 }} whileTap={{ scale: 0.965 }}>

          {/* Bottom-radiate glow — below the button, bleeds down */}
          <motion.div style={{
            position: "absolute", bottom: -22, left: "15%", right: "15%", height: 28,
            background: "radial-gradient(ellipse, rgba(6,182,212,0.45) 0%, rgba(139,92,246,0.22) 55%, transparent 80%)",
            filter: "blur(14px)", pointerEvents: "none",
          }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.6, repeat: Infinity }} />

          <motion.div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "15px 24px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.22em", textTransform: "uppercase", fontSize: 13, fontWeight: 700,
            color: "#e0f7ff", borderRadius: 50,
            background: "linear-gradient(135deg, #0891b2 0%, #0e7490 30%, #5b21b6 70%, #7c3aed 100%)",
            border: "1px solid rgba(6,182,212,0.48)",
          }} animate={{
            boxShadow: [
              "0 0 22px rgba(6,182,212,0.28), 0 0 48px rgba(139,92,246,0.16), 0 5px 26px rgba(0,0,0,0.48)",
              "0 0 48px rgba(6,182,212,0.56), 0 0 88px rgba(139,92,246,0.32), 0 5px 38px rgba(0,0,0,0.58)",
              "0 0 22px rgba(6,182,212,0.28), 0 0 48px rgba(139,92,246,0.16), 0 5px 26px rgba(0,0,0,0.48)",
            ],
          }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
            {/* Top edge */}
            <div style={{
              position: "absolute", top: 0, left: "12%", right: "12%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.60), rgba(34,211,238,0.78), rgba(6,182,212,0.60), transparent)",
              pointerEvents: "none",
            }} />
            {/* Shimmer */}
            <motion.div style={{
              position: "absolute", inset: 0, borderRadius: 50, overflow: "hidden", pointerEvents: "none",
            }}>
              <motion.div style={{
                position: "absolute", top: 0, bottom: 0, width: "38%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(6,182,212,0.22), transparent)",
                skewX: "-12deg",
              }} animate={{ left: ["-48%", "145%"] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.8, ease: "linear", delay: 4 }} />
            </motion.div>
            <Zap size={17} style={{ color: "#67e8f9", filter: "drop-shadow(0 0 6px rgba(6,182,212,0.9))", position: "relative", zIndex: 1 }} />
            <span style={{ position: "relative", zIndex: 1 }}>BEGIN</span>
          </motion.div>
        </motion.button>

        {/* Footer — with status dot */}
        <motion.div style={{
          marginTop: 32, display: "flex", alignItems: "center", gap: 8,
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 2.9, duration: 0.6 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: "rgba(100,116,139,0.33)" }}>
            ASCEND v2.0 // NEON GENESIS
          </span>
          <motion.span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22d3ee", display: "inline-block", boxShadow: "0 0 6px rgba(6,182,212,0.9)" }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
          <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: "rgba(6,182,212,0.42)" }}>
            ONLINE
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface GenderSelectScreenProps {
  onSelect: (gender: "male" | "female") => void;
}

function MaleIcon({ color, accentGold }: { color: string; accentGold: string }) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="25" stroke={accentGold} strokeWidth="2" fill={`${color}15`} />
      <circle cx="28" cy="28" r="25" stroke={accentGold} strokeWidth="0.5" opacity="0.4" strokeDasharray="2 4" />
      <path
        d="M28 13 L36 22 L32 36 L24 36 L20 22 Z"
        fill={`${color}30`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M28 13 L32 22 L36 22 M28 13 L24 22 L20 22 M32 22 L28 36 L24 22" stroke={color} strokeWidth="0.8" opacity="0.7" />
      <circle cx="28" cy="6" r="1.6" fill={accentGold} />
      <circle cx="50" cy="28" r="1.6" fill={accentGold} />
      <circle cx="28" cy="50" r="1.6" fill={accentGold} />
      <circle cx="6" cy="28" r="1.6" fill={accentGold} />
      <circle cx="28" cy="24" r="2" fill={color} opacity="0.9" />
    </svg>
  );
}

function FemaleIcon({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="24" stroke={color} strokeWidth="1.5" fill={`${color}18`} />
      <path
        d="M26 14 C26 14 32 18 34 24 C36 30 32 36 26 38 C20 36 16 30 18 24 C20 18 26 14 26 14 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M20 20 C22 16 30 16 32 20" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <circle cx="26" cy="26" r="5" fill={`${color}30`} stroke={color} strokeWidth="1.2" />
      <path
        d="M22 22 L24 26 L26 22 L28 26 L30 22"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle cx="26" cy="14" r="1.5" fill={color} opacity="0.8" />
      <circle cx="36" cy="20" r="1.5" fill={color} opacity="0.8" />
      <circle cx="36" cy="32" r="1.5" fill={color} opacity="0.8" />
      <circle cx="16" cy="20" r="1.5" fill={color} opacity="0.8" />
      <circle cx="16" cy="32" r="1.5" fill={color} opacity="0.8" />
    </svg>
  );
}

function GenderCard({
  gender,
  selected,
  onClick,
}: {
  gender: "male" | "female";
  selected: boolean;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const isMale = gender === "male";
  const color = isMale ? "#3FB6FF" : "#d946ef";
  const accentGold = "#E8B964";
  const label = isMale ? "Male" : "Female";
  const subtitle = isMale ? "IRON SOVEREIGN" : "NEON EMPRESS";

  const burstParticles = useRef(
    Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      return {
        id: i,
        dx: Math.cos(angle) * (55 + Math.random() * 35),
        dy: Math.sin(angle) * (55 + Math.random() * 35),
        size: 2 + Math.random() * 3.5,
      };
    })
  ).current;

  const handleClick = () => {
    setBurstKey((k) => k + 1);
    onClick();
  };

  return (
    <motion.div
      animate={{ y: selected ? [0, -7, 0, -4, 0] : 0 }}
      transition={selected
        ? { duration: 5.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }
        : { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
      }
      style={{ flex: 1, minWidth: 0 }}
    >
      <motion.button
        onClick={handleClick}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        aria-label={`Select ${label} — ${subtitle}`}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: selected ? 1.03 : 1,
          boxShadow: selected
            ? isMale
              ? `0 0 40px ${color}70, 0 0 80px ${color}28, 0 8px 32px rgba(0,0,0,0.5), inset 0 0 30px ${accentGold}18`
              : `0 0 40px ${color}70, 0 0 80px ${color}28, 0 8px 32px rgba(0,0,0,0.5)`
            : pressed
            ? `0 0 24px ${color}50, 0 4px 16px rgba(0,0,0,0.4)`
            : `0 4px 16px rgba(0,0,0,0.35)`,
        }}
        transition={{ duration: 0.3 }}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "20px 12px 18px",
          borderRadius: "20px",
          border: isMale && selected
            ? `2px solid ${accentGold}cc`
            : `2px solid ${selected ? `${color}cc` : `${color}45`}`,
          background: selected
            ? isMale
              ? `linear-gradient(180deg, ${color}26 0%, rgba(8,20,30,0.88) 50%, ${accentGold}12 100%)`
              : `linear-gradient(180deg, ${color}24 0%, rgba(10,5,22,0.88) 55%, ${color}10 100%)`
            : `linear-gradient(180deg, rgba(12,18,36,0.72) 0%, rgba(6,8,20,0.84) 100%)`,
          cursor: "pointer",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          position: "relative",
          overflow: "hidden",
          transition: "border-color 0.3s, background 0.3s",
        }}
      >
        {/* Top sheen line */}
        <div
          style={{
            position: "absolute",
            top: 0, left: "10%", right: "10%",
            height: "1px",
            background: selected
              ? `linear-gradient(90deg, transparent, ${isMale ? accentGold : color}60, transparent)`
              : `linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)`,
            borderRadius: "50%",
            transition: "background 0.3s",
          }}
        />

        {/* Selection radial overlay — layered depth */}
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "18px",
              background: isMale
                ? `radial-gradient(ellipse at 50% 20%, ${color}20 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, ${accentGold}12 0%, transparent 55%), radial-gradient(ellipse at 80% 60%, ${color}10 0%, transparent 50%)`
                : `radial-gradient(ellipse at 50% 20%, ${color}18 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${color}12 0%, transparent 55%)`,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Ambient inner glow pulse when selected */}
        {selected && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: "18px" }}
            animate={{
              boxShadow: [
                `inset 0 0 0px ${color}00`,
                `inset 0 0 24px ${color}22`,
                `inset 0 0 0px ${color}00`,
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Particle burst on select */}
        <AnimatePresence>
          {burstKey > 0 &&
            burstParticles.map((bp) => (
              <motion.div
                key={`${burstKey}-${bp.id}`}
                className="absolute pointer-events-none rounded-full"
                style={{
                  width: bp.size,
                  height: bp.size,
                  background: color,
                  boxShadow: `0 0 ${bp.size * 2}px ${color}`,
                  left: "50%",
                  top: "40%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: bp.dx, y: bp.dy, opacity: 0, scale: 0.2 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            ))}
        </AnimatePresence>

        {/* Icon */}
        <motion.div
          style={{ position: "relative", zIndex: 1 }}
          animate={selected ? { scale: [1, 1.07, 1] } : { scale: 1 }}
          transition={{ duration: 2.0, repeat: selected ? Infinity : 0, ease: "easeInOut" }}
        >
          {isMale ? <MaleIcon color={color} accentGold={accentGold} /> : <FemaleIcon color={color} />}
        </motion.div>

        {/* Labels */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#ffffff",
              fontFamily: "Inter, system-ui, sans-serif",
              letterSpacing: "0.02em",
              marginBottom: "4px",
              textShadow: selected ? `0 0 20px ${color}60` : "none",
              transition: "text-shadow 0.3s",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: isMale ? accentGold : color,
              fontFamily: "Inter, system-ui, sans-serif",
              opacity: selected ? 1 : 0.8,
              transition: "opacity 0.25s",
            }}
          >
            {subtitle}
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

export function GenderSelectScreen({ onSelect }: GenderSelectScreenProps) {
  const [selected, setSelected] = useState<"male" | "female" | null>(null);
  const [exiting, setExiting] = useState(false);

  const particles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 3 + Math.random() * 94,
      y: 10 + Math.random() * 80,
      size: 0.6 + Math.random() * 1.5,
      duration: 10 + Math.random() * 11,
      delay: Math.random() * 8,
      driftY: -(12 + Math.random() * 44),
      driftX: (Math.random() - 0.5) * 28,
      color: i % 2 === 0 ? "rgba(63,182,255,0.32)" : "rgba(217,70,239,0.32)",
    }))
  ).current;

  const nebulae = useRef(
    [
      { top: "12%", left: "5%", w: 280, h: 180, color: "rgba(63,182,255,0.055)", dx: [0, 22, -14, 0], dy: [0, -15, 10, 0], dur: 34 },
      { top: "60%", left: "60%", w: 320, h: 200, color: "rgba(217,70,239,0.050)", dx: [0, -18, 24, 0], dy: [0, 12, -16, 0], dur: 40 },
      { top: "75%", left: "10%", w: 240, h: 160, color: "rgba(139,92,246,0.045)", dx: [0, 16, -10, 0], dy: [0, -10, 14, 0], dur: 28 },
    ]
  ).current;

  const handleContinue = () => {
    if (!selected || exiting) return;
    setExiting(true);
    setTimeout(() => onSelect(selected), 700);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.7 }}
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Background image */}
      <img
        src="/gender-select-bg-new.png"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          userSelect: "none",
          pointerEvents: "none",
        }}
        draggable={false}
      />

      {/* Gradient overlay — richer depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.06) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.62) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Nebula fog layers */}
      {nebulae.map((n, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: n.top, left: n.left,
            width: n.w, height: n.h,
            background: `radial-gradient(ellipse, ${n.color} 0%, transparent 70%)`,
            filter: "blur(50px)",
            borderRadius: "50%",
          }}
          animate={{ x: n.dx, y: n.dy, opacity: [0.5, 0.9, 0.6, 0.5] }}
          transition={{ duration: n.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Ambient particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          animate={{ y: [0, p.driftY, 0], x: [0, p.driftX, 0], opacity: [0, 0.75, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      {/* Scan sweep */}
      <motion.div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.18), rgba(255,255,255,0.12), transparent)",
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 9, repeat: Infinity, repeatDelay: 8, ease: "linear" }}
      />

      {/* UI layout */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
          padding: "52px 24px 48px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", width: "100%" }}>
          <motion.p
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.45)",
              marginBottom: "10px",
              textTransform: "uppercase",
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            ASCEND OS · STYLE SYNC
          </motion.p>
          <motion.h1
            style={{
              fontSize: "clamp(1.8rem, 7vw, 2.4rem)",
              fontWeight: 900,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              background: "linear-gradient(90deg, #22d3ee 0%, #d946ef 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: "0 0 8px",
              lineHeight: 1.1,
            }}
            initial={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.52, duration: 0.78, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            CHOOSE YOUR STYLE
          </motion.h1>
          <motion.p
            style={{
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.52)",
              letterSpacing: "0.02em",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.78, duration: 0.65 }}
          >
            Pick the visual system you want to start with
          </motion.p>
        </div>

        {/* Cards */}
        <motion.div
          style={{
            display: "flex",
            gap: "14px",
            width: "100%",
            maxWidth: "420px",
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68, duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <GenderCard gender="male" selected={selected === "male"} onClick={() => setSelected("male")} />
          <GenderCard gender="female" selected={selected === "female"} onClick={() => setSelected("female")} />
        </motion.div>

        {/* Bottom action */}
        <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.button
                key="confirm"
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                onClick={handleContinue}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background:
                    selected === "male"
                      ? "linear-gradient(90deg, #3FB6FF 0%, #1E88E5 50%, #E8B964 100%)"
                      : "linear-gradient(90deg, #d946ef 0%, #8b5cf6 100%)",
                  color: selected === "male" ? "#06121A" : "#fff",
                  boxShadow:
                    selected === "male"
                      ? "0 0 48px rgba(63,182,255,0.55), 0 4px 28px rgba(232,185,100,0.35), 0 8px 32px rgba(0,0,0,0.4)"
                      : "0 0 48px rgba(217,70,239,0.55), 0 4px 28px rgba(217,70,239,0.35), 0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                APPLY SYSTEM STYLE
                <ArrowRight size={16} />
              </motion.button>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  fontSize: "0.63rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.36)",
                }}
              >
                TAP A CARD TO CHOOSE YOUR STYLE
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

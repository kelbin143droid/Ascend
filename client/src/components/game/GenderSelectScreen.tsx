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
    Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      return {
        id: i,
        dx: Math.cos(angle) * (50 + Math.random() * 30),
        dy: Math.sin(angle) * (50 + Math.random() * 30),
        size: 2 + Math.random() * 3,
      };
    })
  ).current;

  const handleClick = () => {
    setBurstKey((k) => k + 1);
    onClick();
  };

  return (
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
            ? `0 0 36px ${color}80, 0 0 70px ${color}30, inset 0 0 28px ${accentGold}20`
            : `0 0 36px ${color}80, 0 0 70px ${color}30`
          : pressed
          ? `0 0 22px ${color}55`
          : `0 0 0px transparent`,
      }}
      transition={{ duration: 0.25 }}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "20px 12px 18px",
        borderRadius: "20px",
        border: isMale && selected
          ? `2px solid ${accentGold}`
          : `2px solid ${selected ? color : `${color}55`}`,
        background: selected
          ? isMale
            ? `linear-gradient(160deg, ${color}22 0%, rgba(8,20,26,0.85) 60%, ${accentGold}15 100%)`
            : `linear-gradient(160deg, ${color}22 0%, ${color}08 100%)`
          : `linear-gradient(160deg, rgba(10,14,30,0.7) 0%, rgba(6,8,20,0.82) 100%)`,
        cursor: "pointer",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.25s, background 0.25s",
      }}
    >
      {/* Selection radial overlay */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "18px",
            background: isMale
              ? `radial-gradient(ellipse at 50% 25%, ${color}22 0%, transparent 65%), radial-gradient(ellipse at 50% 100%, ${accentGold}14 0%, transparent 55%)`
              : `radial-gradient(ellipse at 50% 25%, ${color}18 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Pulsing border glow when selected */}
      {selected && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: "18px" }}
          animate={{
            boxShadow: [
              `inset 0 0 0px ${color}00`,
              `inset 0 0 20px ${color}20`,
              `inset 0 0 0px ${color}00`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
              animate={{ x: bp.dx, y: bp.dy, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          ))}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        style={{ position: "relative", zIndex: 1 }}
        animate={selected ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 1.8, repeat: selected ? Infinity : 0 }}
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
            opacity: 0.95,
          }}
        >
          {subtitle}
        </div>
      </div>
    </motion.button>
  );
}

export function GenderSelectScreen({ onSelect }: GenderSelectScreenProps) {
  const [selected, setSelected] = useState<"male" | "female" | null>(null);
  const [exiting, setExiting] = useState(false);

  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: 3 + Math.random() * 94,
      y: 10 + Math.random() * 80,
      size: 1 + Math.random() * 2,
      duration: 6 + Math.random() * 7,
      delay: Math.random() * 5,
      driftY: -(20 + Math.random() * 50),
      driftX: (Math.random() - 0.5) * 30,
      color: i % 2 === 0 ? "rgba(63,182,255,0.5)" : "rgba(217,70,239,0.5)",
    }))
  ).current;

  const handleContinue = () => {
    if (!selected || exiting) return;
    setExiting(true);
    setTimeout(() => onSelect(selected), 650);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.65 }}
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

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          animate={{
            y: [0, p.driftY, 0],
            x: [0, p.driftX, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Scan sweep */}
      <motion.div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 7, ease: "linear" }}
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
              color: "rgba(255,255,255,0.5)",
              marginBottom: "10px",
              textTransform: "uppercase",
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            ASCEND OS · INITIALIZATION
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
            transition={{ delay: 0.35, duration: 0.7 }}
          >
            CHOOSE YOUR PATH
          </motion.h1>
          <motion.p
            style={{
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.02em",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Your system theme adapts to you
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
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
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
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
                      ? "0 0 44px rgba(63,182,255,0.55), 0 4px 24px rgba(232,185,100,0.35)"
                      : "0 0 44px rgba(217,70,239,0.55), 0 4px 24px rgba(217,70,239,0.35)",
                }}
              >
                INITIALIZE SYSTEM
                <ArrowRight size={16} />
              </motion.button>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                TAP A CARD TO CHOOSE YOUR PATH
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

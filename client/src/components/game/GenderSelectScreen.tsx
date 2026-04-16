import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface GenderSelectScreenProps {
  onSelect: (gender: "male" | "female") => void;
}

function MaleIcon({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="24" stroke={color} strokeWidth="1.5" fill={`${color}18`} />
      <path
        d="M26 14 L30 20 L38 20 L32 26 L34 34 L26 30 L18 34 L20 26 L14 20 L22 20 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="26" r="7" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M19 19 L33 33 M33 19 L19 33" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <path
        d="M26 8 L28 12 L26 10 L24 12 Z M44 26 L40 24 L42 26 L40 28 Z M26 44 L24 40 L26 42 L28 40 Z M8 26 L12 28 L10 26 L12 24 Z"
        fill={color}
        opacity="0.7"
      />
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
      <path
        d="M20 20 C22 16 30 16 32 20"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
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
  const isMale = gender === "male";
  const color = isMale ? "#22d3ee" : "#d946ef";
  const label = isMale ? "Male" : "Female";
  const subtitle = isMale ? "IRON SOVEREIGN" : "NEON EMPRESS";

  return (
    <motion.button
      onClick={onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      aria-label={`Select ${label} — ${subtitle}`}
      whileTap={{ scale: 0.96 }}
      animate={{
        boxShadow: selected
          ? `0 0 32px ${color}70, 0 0 64px ${color}30`
          : pressed
          ? `0 0 20px ${color}50`
          : `0 0 0px transparent`,
      }}
      transition={{ duration: 0.2 }}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "20px 12px 18px",
        borderRadius: "18px",
        border: `2px solid ${selected ? color : `${color}60`}`,
        background: selected
          ? `linear-gradient(160deg, ${color}22 0%, ${color}08 100%)`
          : `linear-gradient(160deg, rgba(10,14,30,0.75) 0%, rgba(6,8,20,0.85) 100%)`,
        cursor: "pointer",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "border-color 0.2s, background 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "16px",
            background: `radial-gradient(ellipse at 50% 30%, ${color}20 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        {isMale ? <MaleIcon color={color} /> : <FemaleIcon color={color} />}
      </div>
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
            color: color,
            fontFamily: "Inter, system-ui, sans-serif",
            opacity: 0.85,
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

  const handleContinue = () => {
    if (!selected || exiting) return;
    setExiting(true);
    setTimeout(() => onSelect(selected), 600);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.6 }}
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Full-screen background — always covers the viewport */}
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

      {/* Dark gradient overlay to ensure text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.20) 70%, rgba(0,0,0,0.50) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* UI layout — flex column that fills the screen */}
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
          <p
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "10px",
              textTransform: "uppercase",
            }}
          >
            ASCEND OS · INITIALIZATION
          </p>
          <h1
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
          >
            CHOOSE YOUR PATH
          </h1>
          <p
            style={{
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.65)",
              letterSpacing: "0.02em",
            }}
          >
            Your system theme adapts to you
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            width: "100%",
            maxWidth: "420px",
          }}
        >
          <GenderCard
            gender="male"
            selected={selected === "male"}
            onClick={() => setSelected("male")}
          />
          <GenderCard
            gender="female"
            selected={selected === "female"}
            onClick={() => setSelected("female")}
          />
        </div>

        {/* Bottom action */}
        <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.button
                key="confirm"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
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
                      ? "linear-gradient(90deg, #22d3ee 0%, #0ea5e9 100%)"
                      : "linear-gradient(90deg, #d946ef 0%, #8b5cf6 100%)",
                  color: selected === "male" ? "#010c14" : "#fff",
                  boxShadow:
                    selected === "male"
                      ? "0 0 44px rgba(34,211,238,0.55), 0 4px 24px rgba(34,211,238,0.35)"
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
                  color: "rgba(255,255,255,0.45)",
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

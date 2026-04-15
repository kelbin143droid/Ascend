import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { setGender, type Gender } from "@/lib/userState";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  onSelect: (gender: Gender) => void;
}

const MALE = {
  gender: "male" as Gender,
  label: "Hunter",
  tag: "MALE",
  description: "Electric. Tactical. Relentless.",
  icon: "⚡",
  gradient: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #2563eb 70%, #4f8ef7 100%)",
  glow: "rgba(79,142,247,0.55)",
  glowSoft: "rgba(30,58,138,0.35)",
  border: "rgba(79,142,247,0.6)",
  accent: "#4f8ef7",
  accentDim: "rgba(79,142,247,0.2)",
  particles: ["#4f8ef7","#00d4ff","#7c3aed"],
  bg: "#050815",
};

const FEMALE = {
  gender: "female" as Gender,
  label: "Mage",
  tag: "FEMALE",
  description: "Fierce. Mystical. Unstoppable.",
  icon: "✨",
  gradient: "linear-gradient(135deg, #581c87 0%, #7e22ce 40%, #a855f7 70%, #e040fb 100%)",
  glow: "rgba(224,64,251,0.55)",
  glowSoft: "rgba(88,28,135,0.35)",
  border: "rgba(224,64,251,0.6)",
  accent: "#e040fb",
  accentDim: "rgba(224,64,251,0.2)",
  particles: ["#e040fb","#f472b6","#a855f7"],
  bg: "#0d0614",
};

export function GenderSelectScreen({ onSelect }: Props) {
  const [chosen, setChosen] = useState<Gender | null>(null);
  const [leaving, setLeaving] = useState(false);
  const { setBackgroundTheme } = useTheme();

  const handlePick = (g: Gender) => {
    if (leaving) return;
    setChosen(g);
    setGender(g);
    // Apply gender-matched theme immediately
    setBackgroundTheme(g === "male" ? "cyber-hunter" : "arcane-fable");
    setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onSelect(g), 500);
    }, 700);
  };

  const cfg = chosen === "male" ? MALE : chosen === "female" ? FEMALE : null;

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="gender-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            minHeight: "100dvh",
            backgroundColor: cfg?.bg ?? "#06060f",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 24px 48px",
            position: "relative",
            overflow: "hidden",
            transition: "background-color 0.6s ease",
          }}
        >
          {/* Ambient bg glow — reacts to chosen */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: chosen === "male"
                ? "radial-gradient(ellipse at 20% 30%, rgba(30,58,138,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(79,142,247,0.15) 0%, transparent 50%)"
                : chosen === "female"
                ? "radial-gradient(ellipse at 20% 30%, rgba(88,28,135,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(224,64,251,0.15) 0%, transparent 50%)"
                : "radial-gradient(ellipse at 50% 40%, rgba(60,20,100,0.18) 0%, transparent 65%)",
              transition: "background 0.8s ease",
              pointerEvents: "none",
            }}
          />

          {/* Floating particles */}
          <style>{`
            @keyframes floatUp { 0%{transform:translateY(0) scale(1);opacity:0.7} 100%{transform:translateY(-90px) scale(0.4);opacity:0} }
            @keyframes gsFlicker { 0%,100%{opacity:0.6} 50%{opacity:1} }
            @keyframes scanline { from{top:-10%} to{top:110%} }
          `}</style>

          {[...Array(8)].map((_, i) => {
            const colors = cfg?.particles ?? ["#7c3aed","#a855f7","#6366f1"];
            const color = colors[i % colors.length];
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  bottom: `${10 + (i % 4) * 18}%`,
                  left: `${8 + i * 11}%`,
                  width: 4 + (i % 3),
                  height: 4 + (i % 3),
                  borderRadius: "50%",
                  backgroundColor: color,
                  animation: `floatUp ${2.5 + i * 0.4}s ease-in ${i * 0.35}s infinite`,
                  opacity: 0.5,
                  filter: `blur(${i % 2 === 0 ? 1 : 0}px)`,
                }}
              />
            );
          })}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: 40, position: "relative", zIndex: 1 }}
          >
            <div
              style={{
                display: "inline-block",
                fontSize: 10,
                letterSpacing: "0.28em",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 16,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              ASCEND OS · CHARACTER SETUP
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#f5f5ff",
                margin: 0,
                lineHeight: 1.1,
                fontFamily: "Inter, system-ui, sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              Choose Your
              <br />
              <span
                style={{
                  background: cfg
                    ? cfg.gradient
                    : "linear-gradient(135deg, #7c3aed, #e040fb)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  transition: "all 0.5s ease",
                }}
              >
                Path
              </span>
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.35)",
                marginTop: 10,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Your theme adapts to your choice
            </p>
          </motion.div>

          {/* Cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: "100%",
              maxWidth: 340,
              position: "relative",
              zIndex: 1,
            }}
          >
            {[MALE, FEMALE].map((card, idx) => {
              const isChosen = chosen === card.gender;
              const isOther = chosen !== null && chosen !== card.gender;
              return (
                <motion.button
                  key={card.gender}
                  data-testid={`button-gender-${card.gender}`}
                  initial={{ opacity: 0, x: idx === 0 ? -30 : 30 }}
                  animate={{
                    opacity: isOther ? 0.28 : 1,
                    x: 0,
                    scale: isChosen ? 1.03 : 1,
                  }}
                  transition={{ delay: 0.2 + idx * 0.12, duration: 0.4, type: "spring", stiffness: 200, damping: 18 }}
                  onClick={() => handlePick(card.gender)}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    padding: "20px 22px",
                    borderRadius: 20,
                    background: isChosen
                      ? `linear-gradient(135deg, ${card.accentDim}, rgba(255,255,255,0.04))`
                      : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${isChosen ? card.border : "rgba(255,255,255,0.1)"}`,
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: isChosen
                      ? `0 0 40px ${card.glow}, 0 0 80px ${card.glowSoft}, inset 0 1px 0 rgba(255,255,255,0.08)`
                      : "0 2px 12px rgba(0,0,0,0.3)",
                    overflow: "hidden",
                    transition: "all 0.35s ease",
                  }}
                >
                  {/* Animated border shimmer when chosen */}
                  {isChosen && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "60%",
                        height: "100%",
                        background: `linear-gradient(90deg, transparent, ${card.accentDim}, transparent)`,
                        animation: "scanline 1.2s ease-in-out",
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* Icon circle */}
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: isChosen ? card.gradient : "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      flexShrink: 0,
                      boxShadow: isChosen ? `0 0 24px ${card.glow}` : "none",
                      transition: "all 0.4s ease",
                    }}
                  >
                    {card.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 7,
                          fontWeight: 800,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: isChosen ? card.accent : "rgba(255,255,255,0.3)",
                          fontFamily: "Inter, system-ui, sans-serif",
                          transition: "color 0.3s",
                        }}
                      >
                        {card.tag}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: isChosen ? "#fff" : "rgba(255,255,255,0.75)",
                        fontFamily: "Inter, system-ui, sans-serif",
                        letterSpacing: "-0.3px",
                        marginBottom: 4,
                        transition: "color 0.3s",
                      }}
                    >
                      {card.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: isChosen ? card.accent : "rgba(255,255,255,0.35)",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontStyle: "italic",
                        transition: "color 0.3s",
                      }}
                    >
                      {card.description}
                    </div>
                  </div>

                  {/* Checkmark */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      border: `2px solid ${isChosen ? card.accent : "rgba(255,255,255,0.15)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      backgroundColor: isChosen ? card.accent : "transparent",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isChosen && (
                      <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                        <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* CTA hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: chosen ? 0 : 0.3 }}
            style={{
              marginTop: 32,
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              textAlign: "center",
              fontFamily: "Inter, system-ui, sans-serif",
              letterSpacing: "0.05em",
              position: "relative",
              zIndex: 1,
            }}
          >
            Tap a path to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

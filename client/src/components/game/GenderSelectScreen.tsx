import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface GenderSelectScreenProps {
  onSelect: (gender: "male" | "female") => void;
}

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  size: 0.8 + Math.random() * 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  dur: 2 + Math.random() * 4,
  delay: Math.random() * 3,
  opacity: 0.2 + Math.random() * 0.6,
}));

function MaleIcon({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="26" fill={`${color}18`} />
      {/* Shield body */}
      <path
        d="M26 10L12 16v10c0 8.5 6 16.4 14 18.5C34 42.4 40 34.5 40 26V16L26 10z"
        fill={`${color}22`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Center gear */}
      <circle cx="26" cy="25" r="4.5" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="26" cy="25" r="2.2" fill={color} fillOpacity="0.7" />
      {/* Wing left */}
      <path
        d="M17 22 C13 20, 10 22, 11 26 C12 28, 15 27, 17 26"
        fill={`${color}30`}
        stroke={color}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Wing right */}
      <path
        d="M35 22 C39 20, 42 22, 41 26 C40 28, 37 27, 35 26"
        fill={`${color}30`}
        stroke={color}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Bottom cogs */}
      <path d="M21 32 L20 35 M26 33 L26 36 M31 32 L32 35" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function FemaleIcon({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="26" fill={`${color}18`} />
      {/* 4-pointed star / sparkle */}
      <path
        d="M26 10 L28.5 23.5 L42 26 L28.5 28.5 L26 42 L23.5 28.5 L10 26 L23.5 23.5 Z"
        fill={`${color}28`}
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Small sparkle top-right */}
      <path
        d="M36 14 L37 18 L41 19 L37 20 L36 24 L35 20 L31 19 L35 18 Z"
        fill={color}
        fillOpacity="0.6"
        stroke={color}
        strokeWidth="0.6"
      />
      {/* Center glow dot */}
      <circle cx="26" cy="26" r="3" fill={color} fillOpacity="0.8" />
    </svg>
  );
}

function NeonCard({
  gender,
  color,
  label,
  subLabel,
  selected,
  onClick,
}: {
  gender: "male" | "female";
  color: string;
  label: string;
  subLabel: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="relative flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl overflow-hidden"
      style={{
        minHeight: 200,
        padding: "28px 16px 24px",
        background: selected
          ? `linear-gradient(160deg, ${color}14 0%, rgba(0,0,20,0.85) 100%)`
          : "rgba(2,4,20,0.7)",
        border: `2px solid ${selected ? color : `${color}38`}`,
        boxShadow: selected
          ? `0 0 40px ${color}55, 0 0 80px ${color}20, inset 0 0 30px ${color}0a`
          : `0 0 14px ${color}12`,
        transition: "all 0.3s ease",
      }}
    >
      {/* Animated corner accents */}
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => {
        const [v, h] = pos.split("-");
        return (
          <svg
            key={pos}
            width="22" height="22"
            viewBox="0 0 22 22"
            className="absolute"
            style={{
              top: v === "top" ? 6 : "auto",
              bottom: v === "bottom" ? 6 : "auto",
              left: h === "left" ? 6 : "auto",
              right: h === "right" ? 6 : "auto",
              opacity: selected ? 1 : 0.35,
              transition: "opacity 0.3s",
            }}
          >
            <path
              d={
                pos === "top-left"    ? "M0 14 L0 0 L14 0" :
                pos === "top-right"   ? "M8 0 L22 0 L22 14" :
                pos === "bottom-left" ? "M0 8 L0 22 L14 22" :
                                        "M8 22 L22 22 L22 8"
              }
              stroke={color}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}

      {/* Scan line pulse */}
      {selected && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${color}08 50%, transparent 100%)`,
          }}
          animate={{ y: [-200, 200] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Icon badge */}
      <motion.div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 80,
          height: 80,
          background: `radial-gradient(circle, ${color}20 0%, rgba(0,0,0,0.6) 70%)`,
          border: `1px solid ${color}50`,
        }}
        animate={
          selected
            ? { boxShadow: [`0 0 12px ${color}40`, `0 0 28px ${color}90`, `0 0 12px ${color}40`] }
            : { boxShadow: `0 0 6px ${color}20` }
        }
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        {gender === "male" ? <MaleIcon color={color} /> : <FemaleIcon color={color} />}
      </motion.div>

      {/* Text */}
      <div className="text-center">
        <p
          className="text-xl font-bold text-white mb-1"
          style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.01em" }}
        >
          {label}
        </p>
        <p
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{ color }}
        >
          {subLabel}
        </p>
      </div>

      {/* Selected check */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: color }}
          >
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1.5 4.5L4.5 7.5L9.5 1.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function GenderSelectScreen({ onSelect }: GenderSelectScreenProps) {
  const [selected, setSelected] = useState<"male" | "female" | null>(null);
  const [exiting, setExiting] = useState(false);

  const handleContinue = () => {
    if (!selected || exiting) return;
    setExiting(true);
    setTimeout(() => onSelect(selected), 700);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 30% 20%, #0a1628 0%, #020408 40%, #0d0318 70%, #020110 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.7 }}
    >
      {/* Stars */}
      {STARS.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: s.size,
            height: s.size,
            background: "#fff",
            left: `${s.x}%`,
            top: `${s.y}%`,
          }}
          animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.3] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
        />
      ))}

      {/* Nebula glow — cyan left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-5%", left: "-10%",
          width: "60%", height: "55%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(6,182,212,0.18) 0%, rgba(14,165,233,0.06) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* Nebula glow — purple/magenta right */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "5%", right: "-10%",
          width: "55%", height: "60%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(139,92,246,0.20) 0%, rgba(217,70,239,0.08) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* Center nebula */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "30%", left: "25%",
          width: "50%", height: "40%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(88,28,220,0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* HUD grid at bottom */}
      <svg
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        width="100%" height="200"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        style={{ opacity: 0.18 }}
      >
        {/* Perspective grid lines */}
        {Array.from({ length: 9 }, (_, i) => {
          const x = (i / 8) * 400;
          return (
            <line key={`v${i}`} x1={x} y1={0} x2={(i - 4) * 10 + 200} y2={200}
              stroke="#22d3ee" strokeWidth="0.8" />
          );
        })}
        {Array.from({ length: 7 }, (_, i) => {
          const y = (i / 6) * 200;
          const spread = (i / 6) * 180;
          return (
            <line key={`h${i}`} x1={200 - spread} y1={y} x2={200 + spread} y2={y}
              stroke="#22d3ee" strokeWidth="0.6" />
          );
        })}
      </svg>

      {/* Content */}
      <motion.div
        className="relative z-10 w-full px-6"
        style={{ maxWidth: 440 }}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        {/* Header label */}
        <p
          className="text-center text-[10px] tracking-[0.30em] uppercase mb-4"
          style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          ASCEND OS · INITIALIZATION
        </p>

        {/* Large gradient title */}
        <h1
          className="text-center font-black uppercase mb-2 leading-none"
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(2rem, 9vw, 3.4rem)",
            letterSpacing: "-0.01em",
            background: "linear-gradient(90deg, #22d3ee 0%, #a855f7 55%, #d946ef 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
            filter: "drop-shadow(0 0 28px rgba(34,211,238,0.35))",
          }}
        >
          CHOOSE YOUR PATH
        </h1>

        <p
          className="text-center text-sm mb-8"
          style={{ color: "rgba(255,255,255,0.42)", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Your system theme adapts to you
        </p>

        {/* Cards */}
        <div className="flex gap-4 mb-6">
          <NeonCard
            gender="male"
            color="#22d3ee"
            label="Male"
            subLabel="IRON SOVEREIGN"
            selected={selected === "male"}
            onClick={() => setSelected("male")}
          />
          <NeonCard
            gender="female"
            color="#d946ef"
            label="Female"
            subLabel="NEON EMPRESS"
            selected={selected === "female"}
            onClick={() => setSelected("female")}
          />
        </div>

        {/* Continue button */}
        <AnimatePresence>
          {selected && (
            <motion.button
              key="continue"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              onClick={handleContinue}
              className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 uppercase tracking-widest"
              style={{
                background: selected === "male"
                  ? "linear-gradient(90deg, #22d3ee, #0ea5e9)"
                  : "linear-gradient(90deg, #d946ef, #8b5cf6)",
                color: selected === "male" ? "#020c14" : "#fff",
                letterSpacing: "0.15em",
                boxShadow: selected === "male"
                  ? "0 0 40px rgba(34,211,238,0.5), 0 4px 20px rgba(34,211,238,0.3)"
                  : "0 0 40px rgba(217,70,239,0.5), 0 4px 20px rgba(217,70,239,0.3)",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
              whileTap={{ scale: 0.97 }}
            >
              INITIALIZE SYSTEM
              <ArrowRight size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

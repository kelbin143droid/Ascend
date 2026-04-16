import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface GenderSelectScreenProps {
  onSelect: (gender: "male" | "female") => void;
}

function CardZone({
  gender,
  color,
  top,
  left,
  selected,
  onClick,
}: {
  gender: "male" | "female";
  color: string;
  top: string;
  left: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const active = selected || hovered;

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      aria-label={gender === "male" ? "Select Male — Iron Sovereign" : "Select Female — Neon Empress"}
      className="absolute focus:outline-none"
      animate={{
        boxShadow: selected
          ? `0 0 50px ${color}60, 0 0 100px ${color}20, inset 0 0 40px ${color}12`
          : hovered
          ? `0 0 30px ${color}40, 0 0 60px ${color}15, inset 0 0 20px ${color}08`
          : "0 0 0px transparent",
        background: selected
          ? `rgba(${gender === "male" ? "34,211,238" : "217,70,239"},0.10)`
          : hovered
          ? `rgba(${gender === "male" ? "34,211,238" : "217,70,239"},0.06)`
          : "rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.2 }}
      style={{
        top,
        left,
        width: "43%",
        height: "44%",
        borderRadius: "16px",
        border: "none",
        cursor: "pointer",
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Selected ring — thin, matches card border in image */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              border: `2px solid ${color}`,
              boxShadow: `0 0 12px ${color}80`,
              borderRadius: "16px",
            }}
          />
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
    setTimeout(() => onSelect(selected), 600);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-hidden"
      style={{ background: "#010208" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.6 }}
    >
      {/*
        Clamp the square to min(100vw, 100vh - 76px) so the 1:1 image
        never overflows the viewport vertically.
      */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: "min(100vw, calc(100vh - 76px))",
          height: "min(100vw, calc(100vh - 76px))",
        }}
      >
        {/* Background image */}
        <img
          src="/gender-select-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center" }}
          draggable={false}
        />

        {/* Male card zone */}
        <CardZone
          gender="male"
          color="#22d3ee"
          top="36%"
          left="5%"
          selected={selected === "male"}
          onClick={() => setSelected("male")}
        />

        {/* Female card zone */}
        <CardZone
          gender="female"
          color="#d946ef"
          top="36%"
          left="52%"
          selected={selected === "female"}
          onClick={() => setSelected("female")}
        />
      </div>

      {/* Button / hint below the image */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-6 pb-6">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.button
              key="confirm"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={handleContinue}
              className="w-full max-w-sm py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2"
              style={{
                fontSize: "0.85rem",
                letterSpacing: "0.14em",
                fontFamily: "Inter, system-ui, sans-serif",
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
              whileTap={{ scale: 0.97 }}
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
              className="text-center text-xs tracking-widest uppercase"
              style={{
                color: "rgba(255,255,255,0.25)",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Tap a card to choose your path
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

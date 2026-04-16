import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface GenderSelectScreenProps {
  onSelect: (gender: "male" | "female") => void;
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
        never overflows the viewport vertically. The 76px reserves space
        for the button / hint below the image.
      */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: "min(100vw, calc(100vh - 76px))",
          height: "min(100vw, calc(100vh - 76px))",
        }}
      >
        {/* Background image — fills the square container */}
        <img
          src="/gender-select-bg.jpg"
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center" }}
          draggable={false}
        />

        {/* ── MALE click zone (left card) — fully invisible ── */}
        <button
          onClick={() => setSelected("male")}
          aria-label="Select Male — Iron Sovereign"
          className="absolute focus:outline-none"
          style={{
            top: "36%",
            left: "5%",
            width: "43%",
            height: "44%",
            background: "transparent",
            border: "none",
            boxShadow: "none",
          }}
        />

        {/* ── FEMALE click zone (right card) — fully invisible ── */}
        <button
          onClick={() => setSelected("female")}
          aria-label="Select Female — Neon Empress"
          className="absolute focus:outline-none"
          style={{
            top: "36%",
            left: "52%",
            width: "43%",
            height: "44%",
            background: "transparent",
            border: "none",
            boxShadow: "none",
          }}
        />
      </div>

      {/* ── Area below the image (dark strip at bottom of screen) ── */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-6 pb-6">
        <AnimatePresence>
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
                background: selected === "male"
                  ? "linear-gradient(90deg, #22d3ee 0%, #0ea5e9 100%)"
                  : "linear-gradient(90deg, #d946ef 0%, #8b5cf6 100%)",
                color: selected === "male" ? "#010c14" : "#fff",
                boxShadow: selected === "male"
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
              style={{ color: "rgba(255,255,255,0.25)", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Tap a card to choose your path
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

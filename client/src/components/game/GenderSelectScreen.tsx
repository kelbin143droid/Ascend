import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, ArrowRight } from "lucide-react";

interface GenderSelectScreenProps {
  onSelect: (gender: "male" | "female") => void;
}

export function GenderSelectScreen({ onSelect }: GenderSelectScreenProps) {
  const [selected, setSelected] = useState<"male" | "female" | null>(null);
  const [exiting, setExiting] = useState(false);

  const handleContinue = () => {
    if (!selected || exiting) return;
    setExiting(true);
    setTimeout(() => onSelect(selected), 700);
  };

  const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    size: 1 + Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    dur: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #030a14 0%, #050010 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.7 }}
    >
      {/* Stars */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: "rgba(255,255,255,0.75)",
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{ opacity: [0.15, 0.75, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay }}
        />
      ))}

      {/* Ambient glows */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%", left: "10%", width: 280, height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "10%", right: "5%", width: 260, height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(217,70,239,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-sm px-6"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <p
            className="text-[10px] tracking-[0.28em] uppercase mb-3"
            style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Inter, system-ui, sans-serif" }}
          >
            ASCEND OS · INITIALIZATION
          </p>
          <h2
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.02em" }}
          >
            Choose Your Path
          </h2>
          <p
            className="text-sm"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Your system theme adapts to you
          </p>
        </div>

        {/* Cards */}
        <div className="flex gap-4 mb-8">
          {/* Male Card */}
          <motion.button
            onClick={() => setSelected("male")}
            className="flex-1 rounded-2xl p-5 flex flex-col items-center gap-3"
            style={{
              background: selected === "male"
                ? "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(245,158,11,0.08))"
                : "rgba(0,20,40,0.55)",
              border: selected === "male"
                ? "2px solid rgba(14,165,233,0.7)"
                : "1px solid rgba(14,165,233,0.2)",
              boxShadow: selected === "male" ? "0 0 32px rgba(14,165,233,0.28)" : "none",
              transition: "all 0.25s ease",
            }}
            whileTap={{ scale: 0.96 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(14,165,233,0.3), rgba(245,158,11,0.15))",
                border: "1px solid rgba(14,165,233,0.4)",
              }}
              animate={
                selected === "male"
                  ? { boxShadow: ["0 0 8px rgba(14,165,233,0.3)", "0 0 22px rgba(14,165,233,0.6)", "0 0 8px rgba(14,165,233,0.3)"] }
                  : {}
              }
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <Shield size={28} style={{ color: "#0ea5e9" }} />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                Male
              </p>
              <p className="text-[10px] font-medium tracking-wider" style={{ color: "rgba(14,165,233,0.75)" }}>
                IRON SOVEREIGN
              </p>
            </div>
            <AnimatePresence>
              {selected === "male" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#0ea5e9" }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Female Card */}
          <motion.button
            onClick={() => setSelected("female")}
            className="flex-1 rounded-2xl p-5 flex flex-col items-center gap-3"
            style={{
              background: selected === "female"
                ? "linear-gradient(135deg, rgba(217,70,239,0.2), rgba(6,182,212,0.08))"
                : "rgba(20,0,30,0.55)",
              border: selected === "female"
                ? "2px solid rgba(217,70,239,0.7)"
                : "1px solid rgba(217,70,239,0.2)",
              boxShadow: selected === "female" ? "0 0 32px rgba(217,70,239,0.28)" : "none",
              transition: "all 0.25s ease",
            }}
            whileTap={{ scale: 0.96 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(217,70,239,0.3), rgba(6,182,212,0.15))",
                border: "1px solid rgba(217,70,239,0.4)",
              }}
              animate={
                selected === "female"
                  ? { boxShadow: ["0 0 8px rgba(217,70,239,0.3)", "0 0 22px rgba(217,70,239,0.6)", "0 0 8px rgba(217,70,239,0.3)"] }
                  : {}
              }
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <Sparkles size={28} style={{ color: "#d946ef" }} />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                Female
              </p>
              <p className="text-[10px] font-medium tracking-wider" style={{ color: "rgba(217,70,239,0.75)" }}>
                NEON EMPRESS
              </p>
            </div>
            <AnimatePresence>
              {selected === "female" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#d946ef" }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Continue button */}
        <AnimatePresence>
          {selected && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={handleContinue}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: selected === "male"
                  ? "linear-gradient(135deg, #0ea5e9, #f59e0b)"
                  : "linear-gradient(135deg, #d946ef, #8b5cf6)",
                color: "#fff",
                boxShadow: selected === "male"
                  ? "0 0 32px rgba(14,165,233,0.35)"
                  : "0 0 32px rgba(217,70,239,0.35)",
                letterSpacing: "0.1em",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
              whileTap={{ scale: 0.97 }}
            >
              CONTINUE
              <ArrowRight size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

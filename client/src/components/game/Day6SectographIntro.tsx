import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Check } from "lucide-react";

const ACCENT = "#3b82f6";

const TIME_BLOCKS = [
  {
    id: "morning",
    label: "Morning",
    range: "6 AM – 11 AM",
    emoji: "🌅",
    color: "#f59e0b",
    description: "Fresh start, clear mind.",
  },
  {
    id: "midday",
    label: "Midday",
    range: "11 AM – 3 PM",
    emoji: "☀️",
    color: "#3b82f6",
    description: "Peak energy, high focus.",
  },
  {
    id: "evening",
    label: "Evening",
    range: "3 PM – 8 PM",
    emoji: "🌆",
    color: "#8b5cf6",
    description: "Wind down, reflect, reset.",
  },
];

type Phase = "select" | "placed" | "complete" | "marked";

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export function Day6SectographIntro({ onComplete, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>("select");
  const [selected, setSelected] = useState<string | null>(null);

  const selectedBlock = TIME_BLOCKS.find(b => b.id === selected);

  const handleSelect = (id: string) => {
    if (phase !== "select") return;
    setSelected(id);
    const block = TIME_BLOCKS.find(b => b.id === id)!;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    localStorage.setItem(
      "ascend_planned_action_time",
      JSON.stringify({ slot: id, label: block.label, range: block.range, date: tomorrow.toISOString().split("T")[0] })
    );
    setTimeout(() => setPhase("placed"), 600);
  };

  const handleConfirm = () => setPhase("complete");

  const handleFinish = () => {
    localStorage.setItem("ascend_light_movement_completed", new Date().toISOString().split("T")[0]);
    setPhase("marked");
  };

  // Auto-exit the "marked" state after a brief pause
  useEffect(() => {
    if (phase !== "marked") return;
    const t = setTimeout(() => onComplete(), 1600);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "linear-gradient(160deg, #060d1a 0%, #0b1628 60%, #060d1a 100%)" }}
      data-testid="day6-sectograph-intro"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-5 pb-4">
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: `${ACCENT}99` }} />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: `${ACCENT}99` }}>
            Day 6 · Time Awareness
          </span>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          data-testid="button-cancel-day6"
        >
          <X size={15} className="text-white/50" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-safe pb-8 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* SELECT PHASE */}
          {phase === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6 h-full"
            >
              {/* Tomorrow label */}
              <div className="text-center mt-2">
                <span
                  className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${ACCENT}15`, color: `${ACCENT}cc` }}
                >
                  Tomorrow
                </span>
              </div>

              {/* Instruction */}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white leading-snug">
                  Tap a moment where your<br />next action can happen.
                </h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Choose one. Just one.
                </p>
              </div>

              {/* Time blocks */}
              <div className="flex flex-col gap-3 mt-2">
                {TIME_BLOCKS.map((block, i) => (
                  <motion.button
                    key={block.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
                    onClick={() => handleSelect(block.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: `${block.color}0f`,
                      border: `1px solid ${block.color}25`,
                    }}
                    data-testid={`button-time-block-${block.id}`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${block.color}18` }}
                    >
                      {block.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-bold text-base">{block.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: `${block.color}bb` }}>{block.range}</div>
                      <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{block.description}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PLACED PHASE */}
          {phase === "placed" && selectedBlock && (
            <motion.div
              key="placed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col items-center justify-center gap-8 h-full"
            >
              {/* Pulsing selected block */}
              <div className="relative flex items-center justify-center">
                {/* Outer pulse rings */}
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 140, height: 140, backgroundColor: `${selectedBlock.color}08`, border: `1px solid ${selectedBlock.color}20` }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 108, height: 108, backgroundColor: `${selectedBlock.color}10`, border: `1px solid ${selectedBlock.color}30` }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0.3, 0.8] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                />
                {/* Core block */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  className="relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1"
                  style={{
                    backgroundColor: `${selectedBlock.color}22`,
                    border: `2px solid ${selectedBlock.color}60`,
                    boxShadow: `0 0 30px ${selectedBlock.color}40`,
                  }}
                >
                  <span className="text-3xl">{selectedBlock.emoji}</span>
                </motion.div>
              </div>

              {/* Selected info */}
              <div className="text-center space-y-1">
                <div className="text-white font-bold text-lg">{selectedBlock.label}</div>
                <div className="text-sm" style={{ color: `${selectedBlock.color}cc` }}>{selectedBlock.range}</div>
              </div>

              {/* Confirmation message */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-center px-6"
              >
                <p className="text-white text-lg font-bold leading-snug">
                  You placed your next action<br />before it began.
                </p>
                <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                  This is how intention forms.
                </p>
              </motion.div>

              {/* Continue button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                onClick={handleConfirm}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97]"
                style={{ backgroundColor: selectedBlock.color, color: "#fff" }}
                data-testid="button-day6-confirm"
              >
                Continue
              </motion.button>
            </motion.div>
          )}

          {/* COMPLETE PHASE */}
          {phase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center gap-8 h-full text-center"
            >
              {/* Check icon with glow */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 14 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${ACCENT}18`,
                  border: `2px solid ${ACCENT}50`,
                  boxShadow: `0 0 40px ${ACCENT}35`,
                }}
              >
                <Check size={36} style={{ color: ACCENT }} />
              </motion.div>

              {/* Completion text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="space-y-3 px-4"
              >
                <p className="text-white text-2xl font-bold leading-tight">
                  Step complete.
                </p>
                <p className="text-white text-xl font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Your time is now intentional.
                </p>
                <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {selectedBlock ? `${selectedBlock.label} — ${selectedBlock.range}` : ""}
                </p>
              </motion.div>

              {/* Finish button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                onClick={handleFinish}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97]"
                style={{ backgroundColor: ACCENT, color: "#fff" }}
                data-testid="button-day6-finish"
              >
                Finish
              </motion.button>
            </motion.div>
          )}

          {/* MARKED PHASE — brief "day marked complete" confirmation */}
          {phase === "marked" && (
            <motion.div
              key="marked"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center gap-6 h-full text-center"
              data-testid="day6-marked-complete"
            >
              {/* Expanding ring + check */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 110, height: 110, border: `1px solid ${ACCENT}30` }}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1.35, opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: `${ACCENT}20`,
                    border: `2px solid ${ACCENT}60`,
                    boxShadow: `0 0 36px ${ACCENT}40`,
                  }}
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                >
                  <Check size={34} style={{ color: ACCENT }} strokeWidth={2.5} />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45 }}
                className="space-y-1"
              >
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: `${ACCENT}80` }}>
                  Day 6 complete
                </p>
                <p className="text-xl font-bold text-white">
                  Marked.
                </p>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}

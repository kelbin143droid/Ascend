import { motion } from "framer-motion";
import type { LevelPhase } from "@/hooks/useLevelSystem";

interface XPProgressBarProps {
  phase: LevelPhase;
  earnedXP: number;
  maxXP: number;
  onEarnedFillComplete: () => void;
  onLevelUpFillComplete: () => void;
}

export function XPProgressBar({
  phase,
  earnedXP,
  maxXP,
  onEarnedFillComplete,
  onLevelUpFillComplete,
}: XPProgressBarProps) {
  const isGolden =
    phase === "filling-levelup" ||
    phase === "showing-modal" ||
    phase === "done";

  const earnedPct = Math.min(100, (earnedXP / maxXP) * 100);

  const targetPct =
    phase === "idle"
      ? 0
      : phase === "filling-earned"
      ? earnedPct
      : 100;

  const displayCurrent =
    phase === "idle" ? 0 : phase === "filling-earned" ? earnedXP : maxXP;

  const handleAnimationComplete = () => {
    if (phase === "filling-earned") onEarnedFillComplete();
    else if (phase === "filling-levelup") onLevelUpFillComplete();
  };

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 700,
            color: isGolden ? "rgba(255,215,0,0.7)" : "rgba(138,92,255,0.8)",
            transition: "color 0.4s ease",
          }}
        >
          {isGolden ? "⚡ LEVEL UP" : "XP Progress"}
        </span>
        <span
          style={{
            fontSize: 12,
            fontFamily: "monospace",
            fontWeight: 700,
            color: isGolden
              ? "rgba(255,215,0,0.85)"
              : "rgba(245,245,255,0.6)",
            transition: "color 0.4s ease",
          }}
        >
          {displayCurrent} / {maxXP}
        </span>
      </div>

      <div
        style={{
          height: 14,
          borderRadius: 7,
          background: "rgba(255,255,255,0.05)",
          border: isGolden
            ? "1px solid rgba(255,215,0,0.2)"
            : "1px solid rgba(138,92,255,0.15)",
          overflow: "hidden",
          position: "relative",
          transition: "border-color 0.4s ease",
        }}
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${targetPct}%` }}
          transition={{
            duration: phase === "filling-earned" ? 1.0 : 1.6,
            ease: phase === "filling-earned" ? "easeOut" : [0.25, 0.46, 0.45, 0.94],
          }}
          onAnimationComplete={handleAnimationComplete}
          style={{
            height: "100%",
            borderRadius: 7,
            background: isGolden
              ? "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24, #fde68a)"
              : "linear-gradient(90deg, #6d28d9, #8b5cf6, #a78bfa)",
            boxShadow: isGolden
              ? "0 0 18px rgba(255,215,0,0.9), 0 0 40px rgba(255,165,0,0.4)"
              : "0 0 14px rgba(139,92,246,0.7)",
            transition: "background 0.5s ease, box-shadow 0.5s ease",
          }}
        />

        {isGolden && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              inset: 0,
              width: "50%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            }}
          />
        )}
      </div>

      {isGolden && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 10,
            color: "rgba(255,215,0,0.55)",
            textAlign: "center",
            marginTop: 8,
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Threshold reached — initializing rank advance
        </motion.p>
      )}
    </div>
  );
}

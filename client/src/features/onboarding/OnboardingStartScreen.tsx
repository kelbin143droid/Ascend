import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { ONBOARDING_CONFIG } from "./onboardingConfig";

interface OnboardingStartScreenProps {
  day: number;
  onBegin: () => void;
  onBack: () => void;
}

export function OnboardingStartScreen({ day, onBegin, onBack }: OnboardingStartScreenProps) {
  const config = ONBOARDING_CONFIG[day];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div
      data-testid="onboarding-start-screen"
      style={{
        minHeight: "100dvh",
        backgroundColor: "#06060F",
        display: "flex",
        flexDirection: "column",
        padding: "0 0 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${config.color}18 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* Back button */}
      <div style={{ padding: "52px 24px 0", position: "relative", zIndex: 1 }}>
        <button
          data-testid="button-back"
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: "rgba(245,245,255,0.45)",
            fontSize: 13,
            cursor: "pointer",
            padding: "4px 0",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
          maxWidth: 360,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Day badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 20,
            padding: "5px 14px",
            background: `${config.color}15`,
            border: `1px solid ${config.color}30`,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: config.color,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Day {day} · {config.category}
          </span>
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `${config.color}18`,
            border: `1.5px solid ${config.color}35`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            boxShadow: `0 0 32px ${config.color}30`,
          }}
        >
          <Icon size={36} color={config.color} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#F5F5FF",
            margin: "0 0 8px",
            textAlign: "center",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.15,
          }}
        >
          {config.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: 14,
            color: "rgba(245,245,255,0.45)",
            margin: "0 0 32px",
            textAlign: "center",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {config.subtitle}
        </motion.p>

        {/* Description card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            width: "100%",
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "16px 18px",
            marginBottom: 32,
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: "rgba(245,245,255,0.7)",
              lineHeight: 1.65,
              margin: "0 0 12px",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {config.description}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: config.color,
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "rgba(245,245,255,0.35)",
                fontFamily: "Inter, system-ui, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Duration: {config.duration}
            </span>
          </div>
        </motion.div>

        {/* XP preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 28,
            color: "rgba(245,245,255,0.4)",
            fontSize: 12,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <span style={{ color: "#A78BFA", fontWeight: 700 }}>+{config.xpReward} XP</span>
          on completion
        </motion.div>

        {/* Begin button */}
        <motion.button
          data-testid="button-begin-session"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={onBegin}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: 18,
            background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
            border: "none",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "Inter, system-ui, sans-serif",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: `0 4px 28px ${config.color}40`,
            letterSpacing: "0.03em",
          }}
          whileTap={{ scale: 0.97 }}
        >
          Launch Session
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { ONBOARDING_CONFIG, TOTAL_ONBOARDING_DAYS, TOTAL_ONBOARDING_XP } from "./onboardingConfig";

interface OnboardingCompleteScreenProps {
  streak: number;
  onEnter: () => void;
}

export function OnboardingCompleteScreen({ streak, onEnter }: OnboardingCompleteScreenProps) {
  return (
    <div
      data-testid="onboarding-complete-screen"
      style={{
        minHeight: "100dvh",
        backgroundColor: "#06060F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 24px 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(138,92,255,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "15%",
          right: "-10%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1 }}>
        {/* Star burst icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8A5CFF, #EC4899)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 40px rgba(138,92,255,0.5)",
          }}
        >
          <Sparkles size={32} color="#fff" />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(138,92,255,0.8)",
              marginBottom: 8,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600,
            }}
          >
            Foundation Built
          </p>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#F5F5FF",
              lineHeight: 1.15,
              margin: "0 0 12px",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Awakening Complete.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(245,245,255,0.5)",
              lineHeight: 1.6,
              margin: 0,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            You've completed all 5 days. Your system is initialized.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "14px 16px",
              background: "rgba(138,92,255,0.08)",
              border: "1px solid rgba(138,92,255,0.2)",
              textAlign: "center",
            }}
            data-testid="text-total-xp"
          >
            <p style={{ fontSize: 22, fontWeight: 800, color: "#A78BFA", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
              {TOTAL_ONBOARDING_XP}
            </p>
            <p style={{ fontSize: 10, color: "rgba(245,245,255,0.4)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Inter, system-ui, sans-serif" }}>
              XP Earned
            </p>
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "14px 16px",
              background: "rgba(6,182,212,0.08)",
              border: "1px solid rgba(6,182,212,0.2)",
              textAlign: "center",
            }}
            data-testid="text-complete-streak"
          >
            <p style={{ fontSize: 22, fontWeight: 800, color: "#22D3EE", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
              {streak}
            </p>
            <p style={{ fontSize: 10, color: "rgba(245,245,255,0.4)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Inter, system-ui, sans-serif" }}>
              Day Streak
            </p>
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "14px 16px",
              background: "rgba(236,72,153,0.08)",
              border: "1px solid rgba(236,72,153,0.2)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 22, fontWeight: 800, color: "#F472B6", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
              5
            </p>
            <p style={{ fontSize: 10, color: "rgba(245,245,255,0.4)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Inter, system-ui, sans-serif" }}>
              Days Done
            </p>
          </div>
        </motion.div>

        {/* Day list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "4px 0",
            marginBottom: 28,
          }}
        >
          {Array.from({ length: TOTAL_ONBOARDING_DAYS }, (_, i) => i + 1).map((day) => {
            const config = ONBOARDING_CONFIG[day];
            const DayIcon = config.icon;
            return (
              <div
                key={day}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 16px",
                  borderBottom: day < TOTAL_ONBOARDING_DAYS ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
                data-testid={`complete-day-${day}`}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: `${config.color}18`,
                    border: `1px solid ${config.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <DayIcon size={15} color={config.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(245,245,255,0.85)", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
                    {config.title}
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(245,245,255,0.35)", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
                    Day {day} · +{config.xpReward} XP
                  </p>
                </div>
                <CheckCircle2 size={16} color="#22c55e" />
              </div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.button
          data-testid="button-enter-ascend"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          onClick={onEnter}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: 18,
            background: "linear-gradient(135deg, #8A5CFF, #EC4899)",
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
            boxShadow: "0 4px 32px rgba(138,92,255,0.4)",
            letterSpacing: "0.03em",
          }}
          whileTap={{ scale: 0.97 }}
        >
          Enter Ascend OS
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}

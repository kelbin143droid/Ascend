import { motion } from "framer-motion";
import { CheckCircle2, Flame, Star } from "lucide-react";
import { ONBOARDING_CONFIG, TOTAL_ONBOARDING_XP } from "./onboardingConfig";

interface OnboardingCompletionScreenProps {
  day: number;
  streak: number;
  earnedXP: number;
  onContinue: () => void;
}

export function OnboardingCompletionScreen({
  day,
  streak,
  earnedXP,
  onContinue,
}: OnboardingCompletionScreenProps) {
  const config = ONBOARDING_CONFIG[day];
  const nextDay = day + 1;
  const nextConfig = day < 5 ? ONBOARDING_CONFIG[nextDay] : null;
  const xpPct = Math.min(100, Math.round((earnedXP / TOTAL_ONBOARDING_XP) * 100));
  const DayIcon = config?.icon;

  return (
    <div
      data-testid="onboarding-completion-screen"
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
          top: "25%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${config?.color ?? "#8A5CFF"}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1 }}>
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 15 }}
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 32px rgba(34,197,94,0.4)",
          }}
        >
          <CheckCircle2 size={32} color="#fff" />
        </motion.div>

        {/* Day label + title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ textAlign: "center", marginBottom: 24 }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(34,197,94,0.8)",
              margin: "0 0 6px",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600,
            }}
          >
            Day {day} Complete
          </p>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#F5F5FF",
              margin: "0 0 6px",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {config?.title ?? `Day ${day}`}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(245,245,255,0.45)",
              margin: 0,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {config?.subtitle}
          </p>
        </motion.div>

        {/* Reward badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ display: "flex", gap: 10, marginBottom: 24 }}
        >
          <div
            data-testid="text-xp-earned"
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "14px 12px",
              background: "rgba(138,92,255,0.1)",
              border: "1px solid rgba(138,92,255,0.25)",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 4 }}>
              <Star size={14} color="#A78BFA" />
              <span style={{ fontSize: 20, fontWeight: 800, color: "#A78BFA", fontFamily: "Inter, system-ui, sans-serif" }}>
                +5
              </span>
            </div>
            <p style={{ fontSize: 10, color: "rgba(245,245,255,0.4)", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Inter, system-ui, sans-serif" }}>
              XP Earned
            </p>
          </div>
          <div
            data-testid="text-streak-count"
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "14px 12px",
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.25)",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 4 }}>
              <Flame size={14} color="#FB923C" />
              <span style={{ fontSize: 20, fontWeight: 800, color: "#FB923C", fontFamily: "Inter, system-ui, sans-serif" }}>
                {streak}
              </span>
            </div>
            <p style={{ fontSize: 10, color: "rgba(245,245,255,0.4)", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Inter, system-ui, sans-serif" }}>
              Day Streak
            </p>
          </div>
        </motion.div>

        {/* XP progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "16px",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "rgba(245,245,255,0.5)", fontFamily: "Inter, system-ui, sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Onboarding XP
            </span>
            <span style={{ fontSize: 11, color: "rgba(138,92,255,0.8)", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600 }}>
              {earnedXP} / {TOTAL_ONBOARDING_XP} XP
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "rgba(138,92,255,0.15)",
              overflow: "hidden",
            }}
            data-testid="xp-progress-bar"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ delay: 0.45, duration: 0.6, ease: "easeOut" }}
              style={{
                height: "100%",
                borderRadius: 4,
                background: "linear-gradient(90deg, #8A5CFF, #EC4899)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map((d) => (
              <span
                key={d}
                style={{
                  fontSize: 9,
                  color: d <= day ? "rgba(138,92,255,0.8)" : "rgba(245,245,255,0.2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: d <= day ? 700 : 400,
                }}
              >
                D{d}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Next day preview */}
        {nextConfig && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{
              borderRadius: 14,
              background: `${nextConfig.color}08`,
              border: `1px solid ${nextConfig.color}20`,
              padding: "12px 16px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
            data-testid="next-day-preview"
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${nextConfig.color}18`,
                border: `1px solid ${nextConfig.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <nextConfig.icon size={16} color={nextConfig.color} />
            </div>
            <div>
              <p style={{ fontSize: 10, color: "rgba(245,245,255,0.35)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Inter, system-ui, sans-serif" }}>
                Tomorrow — Day {nextDay}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(245,245,255,0.8)", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
                {nextConfig.title}
              </p>
            </div>
          </motion.div>
        )}

        {/* Continue button */}
        <motion.button
          data-testid="button-continue"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: 18,
            background: "linear-gradient(135deg, #8A5CFF, #EC4899)",
            border: "none",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "Inter, system-ui, sans-serif",
            cursor: "pointer",
            boxShadow: "0 4px 28px rgba(138,92,255,0.35)",
            letterSpacing: "0.03em",
          }}
          whileTap={{ scale: 0.97 }}
        >
          {day < 5 ? "Continue" : "Complete Onboarding"}
        </motion.button>
      </div>
    </div>
  );
}

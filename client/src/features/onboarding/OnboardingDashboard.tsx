import { motion } from "framer-motion";
import { CheckCircle2, Lock, ChevronRight, Zap } from "lucide-react";
import { ONBOARDING_CONFIG, TOTAL_ONBOARDING_DAYS } from "./onboardingConfig";

interface OnboardingDashboardProps {
  onboardingDay: number;
  completedDays: number[];
  streak: number;
  onStartDay: (day: number) => void;
}

export function OnboardingDashboard({
  onboardingDay,
  completedDays,
  streak,
  onStartDay,
}: OnboardingDashboardProps) {
  const earnedXP = completedDays.length * 5;

  return (
    <div
      data-testid="onboarding-dashboard"
      style={{
        minHeight: "100dvh",
        backgroundColor: "#06060F",
        display: "flex",
        flexDirection: "column",
        padding: "52px 20px 100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow accents */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: "-20%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(138,92,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "20%",
          left: "-15%",
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 380, width: "100%", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 28 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(138,92,255,0.7)",
                  margin: "0 0 4px",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 600,
                }}
              >
                Awakening Protocol
              </p>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#F5F5FF",
                  margin: 0,
                  fontFamily: "Inter, system-ui, sans-serif",
                  lineHeight: 1.2,
                }}
              >
                5-Day Foundation
              </h1>
            </div>
            {streak > 0 && (
              <div
                style={{
                  borderRadius: 12,
                  padding: "8px 12px",
                  background: "rgba(249,115,22,0.1)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  textAlign: "center",
                }}
                data-testid="text-dashboard-streak"
              >
                <p style={{ fontSize: 16, fontWeight: 800, color: "#FB923C", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
                  {streak}
                </p>
                <p style={{ fontSize: 9, color: "rgba(245,245,255,0.35)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Inter, system-ui, sans-serif" }}>
                  Streak
                </p>
              </div>
            )}
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {Array.from({ length: TOTAL_ONBOARDING_DAYS }, (_, i) => {
              const dayNum = i + 1;
              const isDone = completedDays.includes(dayNum);
              const isCurrent = dayNum === onboardingDay && !isDone;
              const config = ONBOARDING_CONFIG[dayNum];
              return (
                <div
                  key={dayNum}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: isDone
                      ? config.color
                      : isCurrent
                      ? `${config.color}55`
                      : "rgba(255,255,255,0.08)",
                    transition: "background 0.3s ease",
                  }}
                  data-testid={`progress-dot-${dayNum}`}
                />
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: "rgba(245,245,255,0.3)", margin: "8px 0 0", fontFamily: "Inter, system-ui, sans-serif" }}>
            {completedDays.length} of {TOTAL_ONBOARDING_DAYS} days complete · {earnedXP} XP earned
          </p>
        </motion.div>

        {/* Day cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: TOTAL_ONBOARDING_DAYS }, (_, i) => {
            const dayNum = i + 1;
            const config = ONBOARDING_CONFIG[dayNum];
            const isDone = completedDays.includes(dayNum);
            const isCurrent = dayNum === onboardingDay && !isDone;
            const isLocked = dayNum > onboardingDay;
            const Icon = config.icon;

            return (
              <motion.div
                key={dayNum}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                data-testid={`day-card-${dayNum}`}
                style={{
                  borderRadius: 16,
                  padding: isCurrent ? "0" : "14px 16px",
                  background: isDone
                    ? "rgba(34,197,94,0.05)"
                    : isCurrent
                    ? "rgba(0,0,0,0)"
                    : "rgba(255,255,255,0.03)",
                  border: isDone
                    ? "1px solid rgba(34,197,94,0.18)"
                    : isCurrent
                    ? `1.5px solid ${config.color}50`
                    : "1px solid rgba(255,255,255,0.06)",
                  opacity: isLocked ? 0.45 : 1,
                  overflow: "hidden",
                  boxShadow: isCurrent
                    ? `0 0 24px ${config.color}18, inset 0 0 20px ${config.color}06`
                    : "none",
                }}
              >
                {/* Current day — expanded card */}
                {isCurrent ? (
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${config.color}10, rgba(0,0,0,0) 60%)`,
                      padding: "18px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background: `${config.color}20`,
                          border: `1.5px solid ${config.color}40`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: `0 0 14px ${config.color}25`,
                        }}
                      >
                        <Icon size={22} color={config.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.12em",
                              color: config.color,
                              fontFamily: "Inter, system-ui, sans-serif",
                            }}
                          >
                            Day {dayNum} · Today
                          </span>
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: config.color,
                              boxShadow: `0 0 6px ${config.color}`,
                            }}
                          />
                        </div>
                        <h3
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "#F5F5FF",
                            margin: "0 0 2px",
                            fontFamily: "Inter, system-ui, sans-serif",
                          }}
                        >
                          {config.title}
                        </h3>
                        <p style={{ fontSize: 12, color: "rgba(245,245,255,0.45)", margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
                          {config.subtitle}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: "rgba(245,245,255,0.35)",
                          fontFamily: "Inter, system-ui, sans-serif",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Zap size={11} color="rgba(245,245,255,0.3)" />
                        +{config.xpReward} XP · {config.duration}
                      </span>
                      <button
                        data-testid={`button-start-day-${dayNum}`}
                        onClick={() => onStartDay(dayNum)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 18px",
                          borderRadius: 12,
                          background: `linear-gradient(135deg, ${config.color}, ${config.color}bb)`,
                          border: "none",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "Inter, system-ui, sans-serif",
                          cursor: "pointer",
                          boxShadow: `0 4px 16px ${config.color}40`,
                          letterSpacing: "0.02em",
                        }}
                      >
                        Start Session
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Completed or locked day — compact row */
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        background: isDone ? "rgba(34,197,94,0.12)" : `${config.color}10`,
                        border: `1px solid ${isDone ? "rgba(34,197,94,0.25)" : `${config.color}20`}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isLocked ? (
                        <Lock size={14} color="rgba(245,245,255,0.2)" />
                      ) : (
                        <Icon size={16} color={isDone ? "#22c55e" : config.color} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isDone ? "rgba(245,245,255,0.6)" : isLocked ? "rgba(245,245,255,0.2)" : "rgba(245,245,255,0.75)",
                          margin: 0,
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      >
                        {config.title}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: isDone ? "rgba(34,197,94,0.6)" : "rgba(245,245,255,0.2)",
                          margin: 0,
                          fontFamily: "Inter, system-ui, sans-serif",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {isDone ? `+${config.xpReward} XP earned` : isLocked ? "Locked" : ""}
                      </p>
                    </div>
                    {isDone && <CheckCircle2 size={18} color="#22c55e" />}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Coach note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 24,
            borderRadius: 14,
            padding: "12px 16px",
            background: "rgba(138,92,255,0.06)",
            border: "1px solid rgba(138,92,255,0.12)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "rgba(245,245,255,0.45)",
              margin: 0,
              lineHeight: 1.6,
              fontFamily: "Inter, system-ui, sans-serif",
              fontStyle: "italic",
            }}
          >
            {completedDays.length === 0
              ? "Begin with one small action. That's enough."
              : completedDays.length < 4
              ? "Consistency is becoming your baseline."
              : "One more day. The foundation is almost complete."}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

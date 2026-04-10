import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, ArrowRight, Clock } from "lucide-react";
import { ONBOARDING_CONFIG, TOTAL_ONBOARDING_DAYS, TOTAL_ONBOARDING_XP, getPostDay5LockInfo } from "./onboardingConfig";
import { useGame } from "@/context/GameContext";
import { useLevelSystem } from "@/hooks/useLevelSystem";
import { XPProgressBar } from "@/components/game/XPProgressBar";
import { LevelUpModal } from "@/components/game/LevelUpModal";

interface OnboardingCompleteScreenProps {
  streak: number;
  onEnter: () => void;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, ms);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function OnboardingCompleteScreen({ streak, onEnter }: OnboardingCompleteScreenProps) {
  const { player } = useGame();
  const [now, setNow] = useState(Date.now());
  const { phase, startAnimation, onEarnedFillComplete, onLevelUpFillComplete, onModalComplete } =
    useLevelSystem(player?.id);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase === "done") {
      onEnter();
    }
  }, [phase, onEnter]);

  const lockInfo = getPostDay5LockInfo();
  const isLocked = lockInfo.locked && now < lockInfo.unlockAt;
  const remainingMs = Math.max(0, lockInfo.unlockAt - now);

  const handleEnterClick = () => {
    startAnimation();
  };

  const isAnimating = phase !== "idle";

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
      {/* Level-up modal — sits on top of everything */}
      <LevelUpModal
        visible={phase === "showing-modal"}
        onComplete={onModalComplete}
      />

      {/* Background glows */}
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
          background: isAnimating
            ? "radial-gradient(circle, rgba(255,165,0,0.12) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(138,92,255,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
          transition: "background 1s ease",
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

      <AnimatePresence mode="wait">
        {/* ── ANIMATION BRIDGE SCREEN ─────────────────────────────────── */}
        {isAnimating ? (
          <motion.div
            key="xp-bridge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            style={{
              width: "100%",
              maxWidth: 360,
              position: "relative",
              zIndex: 1,
              textAlign: "center",
            }}
          >
            {/* Animated icon — shifts to gold */}
            <motion.div
              animate={{
                background:
                  phase === "filling-levelup" || phase === "showing-modal" || phase === "done"
                    ? "linear-gradient(135deg, #d97706, #f59e0b)"
                    : "linear-gradient(135deg, #8A5CFF, #EC4899)",
                boxShadow:
                  phase === "filling-levelup" || phase === "showing-modal" || phase === "done"
                    ? "0 0 60px rgba(255,165,0,0.5)"
                    : "0 0 40px rgba(138,92,255,0.5)",
              }}
              transition={{ duration: 0.8 }}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 28px",
              }}
            >
              <Sparkles size={32} color="#fff" />
            </motion.div>

            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(245,245,255,0.35)",
                marginBottom: 10,
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 600,
              }}
            >
              System Initialization
            </p>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#F5F5FF",
                lineHeight: 1.2,
                margin: "0 0 8px",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {phase === "filling-levelup" || phase === "showing-modal" || phase === "done"
                ? "Threshold Reached"
                : "Processing XP"}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "rgba(245,245,255,0.4)",
                margin: "0 0 40px",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {phase === "filling-levelup" || phase === "showing-modal" || phase === "done"
                ? "Rank advancement in progress..."
                : "Calculating earned experience..."}
            </p>

            {/* The animated XP bar */}
            <div
              style={{
                padding: "24px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                marginBottom: 24,
              }}
            >
              <div style={{ marginBottom: 20, textAlign: "left" }}>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(245,245,255,0.3)",
                    margin: "0 0 6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  Level 1 → Level 2
                </p>
              </div>
              <XPProgressBar
                phase={phase}
                earnedXP={TOTAL_ONBOARDING_XP}
                maxXP={100}
                onEarnedFillComplete={onEarnedFillComplete}
                onLevelUpFillComplete={onLevelUpFillComplete}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {[
                { label: "Days", value: `${TOTAL_ONBOARDING_DAYS}` },
                { label: "Streak", value: `${streak}` },
                { label: "XP", value: `${TOTAL_ONBOARDING_XP}` },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "10px 8px",
                    borderRadius: 12,
                    background: "rgba(138,92,255,0.06)",
                    border: "1px solid rgba(138,92,255,0.12)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#A78BFA",
                      margin: 0,
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    {item.value}
                  </p>
                  <p
                    style={{
                      fontSize: 9,
                      color: "rgba(245,245,255,0.3)",
                      margin: "2px 0 0",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── NORMAL COMPLETION SCREEN ─────────────────────────────── */
          <motion.div
            key="completion-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1 }}
          >
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
              style={{ display: "flex", gap: 12, marginBottom: 28 }}
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
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#A78BFA",
                    margin: 0,
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {TOTAL_ONBOARDING_XP}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(245,245,255,0.4)",
                    margin: "2px 0 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
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
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#22D3EE",
                    margin: 0,
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {streak}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(245,245,255,0.4)",
                    margin: "2px 0 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
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
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#F472B6",
                    margin: 0,
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  5
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(245,245,255,0.4)",
                    margin: "2px 0 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
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
                      borderBottom:
                        day < TOTAL_ONBOARDING_DAYS
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
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
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "rgba(245,245,255,0.85)",
                          margin: 0,
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      >
                        {config.title}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: "rgba(245,245,255,0.35)",
                          margin: 0,
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      >
                        Day {day} · +{config.xpReward} XP
                      </p>
                    </div>
                    <CheckCircle2 size={16} color="#22c55e" />
                  </div>
                );
              })}
            </motion.div>

            {/* CTA — locked or ready */}
            {isLocked ? (
              <motion.div
                data-testid="lock-timer-ascend"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                style={{
                  width: "100%",
                  padding: "17px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={18} color="rgba(245,245,255,0.4)" />
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: "rgba(245,245,255,0.6)",
                      fontFamily: "Inter, system-ui, sans-serif",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {formatCountdown(remainingMs)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(245,245,255,0.35)",
                    margin: 0,
                    fontFamily: "Inter, system-ui, sans-serif",
                    textAlign: "center",
                  }}
                >
                  Ascend OS unlocks in a few hours.{"\n"}Let the foundation settle.
                </p>
              </motion.div>
            ) : (
              <motion.button
                data-testid="button-enter-ascend"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                onClick={handleEnterClick}
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

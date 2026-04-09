import { useEffect, useState } from "react";

const NEXT_DAY_LABELS: Record<number, string> = {
  1: "Light Movement",
  2: "Hydration & Reflection",
  3: "Light Cardio Session",
  4: "Plan & Reflect",
  5: "Daily Flow Begins",
};

interface OnboardingCompletionScreenProps {
  day: number;
  xp: number;
  xpGoal: number;
  streak: number;
}

export function OnboardingCompletionScreen({
  day,
  xp,
  xpGoal,
  streak,
}: OnboardingCompletionScreenProps) {
  const [fillWidth, setFillWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  const targetFill = Math.min((xp / xpGoal) * 100, 100);
  const nextLabel = NEXT_DAY_LABELS[day];

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60);
    const t2 = setTimeout(() => setFillWidth(targetFill), 350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [targetFill]);

  return (
    <div
      data-testid="onboarding-completion-screen"
      style={{
        minHeight: "100dvh",
        backgroundColor: "#06060f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px 80px",
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "linear-gradient(160deg, rgba(139,92,246,0.12) 0%, rgba(10,10,20,0.95) 100%)",
          border: "1px solid rgba(139,92,246,0.28)",
          borderRadius: 20,
          padding: "40px 28px 32px",
          boxShadow: "0 0 48px rgba(139,92,246,0.1), 0 8px 32px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Check mark */}
        <div
          aria-hidden="true"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "rgba(139,92,246,0.18)",
            border: "1.5px solid rgba(139,92,246,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
            boxShadow: "0 0 24px rgba(139,92,246,0.2)",
          }}
        >
          <span style={{ fontSize: 22, color: "#a78bfa", lineHeight: 1 }}>✓</span>
        </div>

        {/* Title */}
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: 26,
            fontWeight: 800,
            color: "#f5f5ff",
            letterSpacing: "-0.5px",
            textAlign: "center",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
          data-testid="completion-title"
        >
          Day {day} complete.
        </h1>

        <p
          style={{
            margin: "0 0 26px",
            fontSize: 15,
            color: "rgba(245,245,255,0.45)",
            textAlign: "center",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          You showed up.
        </p>

        {/* Reward badges */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <span
            data-testid="badge-xp"
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              backgroundColor: "rgba(139,92,246,0.18)",
              border: "1px solid rgba(139,92,246,0.4)",
              color: "#a78bfa",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.04em",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            +5 XP
          </span>
          <span
            data-testid="badge-streak"
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              backgroundColor: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.22)",
              color: "rgba(34,211,238,0.85)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.04em",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {streak > 0 ? `${streak} day streak` : "+1 Streak"}
          </span>
        </div>

        {/* XP Progress */}
        <div style={{ width: "100%", marginBottom: 20 }}>
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
                fontWeight: 700,
                color: "rgba(245,245,255,0.3)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              XP Progress
            </span>
            <span
              data-testid="xp-label"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(167,139,250,0.8)",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {xp} / {xpGoal} XP
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={xp}
            aria-valuemin={0}
            aria-valuemax={xpGoal}
            aria-label={`XP progress: ${xp} of ${xpGoal}`}
            style={{
              width: "100%",
              height: 8,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              data-testid="xp-bar-fill"
              style={{
                height: "100%",
                width: `${fillWidth}%`,
                borderRadius: 999,
                background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                boxShadow: "0 0 10px rgba(139,92,246,0.5)",
                transition: "width 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            />
          </div>
        </div>

        {/* Next day / Day 5 final message */}
        {day < 5 ? (
          <div
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              textAlign: "center",
            }}
            data-testid="next-day-label"
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "rgba(245,245,255,0.38)",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              Tomorrow:{" "}
              <span
                style={{
                  color: "rgba(245,245,255,0.7)",
                  fontWeight: 600,
                }}
              >
                {nextLabel}
              </span>
            </p>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              backgroundColor: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              textAlign: "center",
            }}
            data-testid="daily-flow-unlock-label"
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "rgba(167,139,250,0.85)",
                fontWeight: 600,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              Daily Flow unlocks tomorrow
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

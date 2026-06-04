// Concept: Dawn / Dusk — Time-Aware Atmosphere
//
// UNDEREXPLORED AXIS: The screen is temporally blind — it looks identical at 6am and 11pm.
// But the context of WHEN you open the app completely changes what you need:
//   Morning → energising launch, "the day is ahead of you"
//   Midday  → direct, you're in it, no preamble
//   Evening → reflective close, acknowledging what happened
//
// This variant reads the real clock and shifts the environment, color temperature,
// language framing, and visual weight accordingly.
// Hypothesis: matching the screen's emotional register to the time of day
// reduces friction between your real context and the app's demands.

import { useState } from "react";

type Period = "morning" | "midday" | "evening";

function getPeriod(hour: number): Period {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "midday";
  return "evening";
}

const THEMES = {
  morning: {
    bg: "linear-gradient(180deg, #0a1628 0%, #1a2d1a 60%, #0d1f0d 100%)",
    accent: "#fbbf24",
    accentGlow: "rgba(251,191,36,0.18)",
    accentDim: "rgba(251,191,36,0.08)",
    accentBorder: "rgba(251,191,36,0.3)",
    horizon: "linear-gradient(180deg, rgba(251,191,36,0.12) 0%, transparent 60%)",
    orb: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.25) 0%, transparent 55%)",
    greeting: "Begin your day",
    sub: "Your system is ready. First mission awaits.",
    btnBg: "linear-gradient(135deg, #d97706, #b45309)",
    labelColor: "#fde68a",
    timeLabel: "MORNING",
    icon: "☀️",
  },
  midday: {
    bg: "linear-gradient(180deg, #070d14 0%, #0d1a24 60%, #060d10 100%)",
    accent: "#0ea5e9",
    accentGlow: "rgba(14,165,233,0.18)",
    accentDim: "rgba(14,165,233,0.08)",
    accentBorder: "rgba(14,165,233,0.35)",
    horizon: "linear-gradient(180deg, rgba(14,165,233,0.1) 0%, transparent 60%)",
    orb: "radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.2) 0%, transparent 55%)",
    greeting: "You're in it",
    sub: "1 mission done. Keep the momentum going.",
    btnBg: "linear-gradient(135deg, #0284c7, #7c3aed)",
    labelColor: "#7dd3fc",
    timeLabel: "MIDDAY",
    icon: "⚡",
  },
  evening: {
    bg: "linear-gradient(180deg, #080510 0%, #120820 60%, #070510 100%)",
    accent: "#a78bfa",
    accentGlow: "rgba(167,139,250,0.18)",
    accentDim: "rgba(167,139,250,0.08)",
    accentBorder: "rgba(167,139,250,0.3)",
    horizon: "linear-gradient(180deg, rgba(167,139,250,0.12) 0%, transparent 60%)",
    orb: "radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.22) 0%, transparent 55%)",
    greeting: "Close out today",
    sub: "3 missions remain. Finish strong or carry forward.",
    btnBg: "linear-gradient(135deg, #7c3aed, #4c1d95)",
    labelColor: "#ddd6fe",
    timeLabel: "EVENING",
    icon: "🌙",
  },
};

const PERIODS: Period[] = ["morning", "midday", "evening"];

export function DawnDusk() {
  const realHour = new Date().getHours();
  const [period, setPeriod] = useState<Period>(getPeriod(realHour));
  const t = THEMES[period];

  const nextPeriod = () => {
    const idx = PERIODS.indexOf(period);
    setPeriod(PERIODS[(idx + 1) % PERIODS.length]);
  };

  return (
    <div style={{
      background: t.bg,
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#c8dde8",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      transition: "background 0.8s ease",
      position: "relative", overflow: "hidden",
    }}>

      {/* Atmospheric horizon glow */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 200,
        background: t.orb,
        pointerEvents: "none", zIndex: 0,
        transition: "background 0.8s ease",
      }} />

      <div style={{ width: "100%", maxWidth: 430, position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 10px",
        }}>
          {/* Time label + period switcher */}
          <button onClick={nextPeriod} style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "4px 12px 4px 8px",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            <span style={{ fontSize: 10, color: t.labelColor, letterSpacing: "0.12em", fontWeight: 700 }}>{t.timeLabel}</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginLeft: 2 }}>↻</span>
          </button>
          {/* XP mini pill */}
          <div style={{
            background: t.accentDim,
            border: `1px solid ${t.accentBorder}`,
            borderRadius: 20, padding: "4px 12px",
            fontSize: 12, fontWeight: 700, color: t.accent,
            transition: "all 0.5s ease",
          }}>Lv.1 · 15 XP</div>
        </div>

        {/* ── Greeting — shifts by time ── */}
        <div style={{ padding: "20px 20px 6px" }}>
          <div style={{
            fontSize: 28, fontWeight: 800, color: "#e8f4ff",
            lineHeight: 1.2, letterSpacing: "-0.02em",
            transition: "all 0.5s ease",
          }}>{t.greeting},</div>
          <div style={{
            fontSize: 28, fontWeight: 800,
            background: `linear-gradient(135deg, ${t.accent}, ${t.labelColor})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.2, letterSpacing: "-0.02em",
            transition: "all 0.5s ease",
          }}>KL.</div>
          <div style={{ fontSize: 14, color: "#3a5060", marginTop: 8, lineHeight: 1.55, transition: "all 0.5s ease" }}>
            {t.sub}
          </div>
        </div>

        {/* ── Quest progress — framing changes ── */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#1e3040", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              {period === "morning" ? "Today's path" : period === "midday" ? "In progress" : "What's left"}
            </span>
            <span style={{ fontSize: 12, color: t.accent, fontWeight: 600 }}>1 / 4</span>
          </div>
          {/* Progress track */}
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "SNS", done: true },
              { label: "AGI", active: true },
              { label: "STR" },
              { label: "VIT" },
            ].map(s => (
              <div key={s.label} style={{ flex: 1 }}>
                <div style={{
                  height: 3, borderRadius: 3,
                  background: s.done
                    ? t.accent
                    : s.active
                      ? `linear-gradient(90deg, ${t.accent} 50%, rgba(255,255,255,0.05) 50%)`
                      : "rgba(255,255,255,0.05)",
                  transition: "all 0.5s ease",
                }} />
                <div style={{
                  fontSize: 9, textAlign: "center", marginTop: 4, letterSpacing: "0.1em",
                  color: s.done ? t.accent : s.active ? t.labelColor : "#1e3040",
                  transition: "all 0.5s ease",
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active mission card ── */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{
            background: t.accentDim,
            border: `1.5px solid ${t.accentBorder}`,
            borderRadius: 16,
            padding: "18px 18px",
            boxShadow: `0 4px 30px ${t.accentGlow}`,
            transition: "all 0.5s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: t.accentGlow,
                border: `1.5px solid ${t.accentBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#e8f4ff" }}>Agility</div>
                <div style={{ fontSize: 13, color: "#3a5060" }}>
                  {period === "morning" ? "Start here — Mobility Flow" :
                    period === "midday" ? "Mobility Flow · Step 2/4" :
                      "Mobility Flow — still time tonight"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: t.accent }}>+15</div>
                <div style={{ fontSize: 10, color: "#1e3040" }}>XP</div>
              </div>
            </div>

            {/* Contextual note — shifts by time */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8, padding: "8px 12px", marginBottom: 14,
              fontSize: 12, color: "#2c5060", lineHeight: 1.5,
            }}>
              {period === "morning" && "Movement unlocked after Calm Mind. Your body is primed."}
              {period === "midday" && "You're 25% through today's circuit. Next: Physical Circuit unlock."}
              {period === "evening" && "3 missions remain. Even partial completion counts toward stability."}
            </div>

            <button style={{
              width: "100%", padding: "15px",
              background: t.btnBg,
              border: "none", borderRadius: 12,
              color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.5s ease",
            }}>
              {period === "morning" ? "Begin your first mission" :
                period === "midday" ? "Continue Agility mission" :
                  "Pick up where you left off"}
              <span style={{ opacity: 0.7 }}>→</span>
            </button>
          </div>
        </div>

        {/* ── Completed / queued strip — tone shifts ── */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ fontSize: 11, color: "#1e3040", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>
            {period === "morning" ? "Already done" : period === "midday" ? "Earlier today" : "Completed"}
          </div>
          <div style={{
            background: "rgba(34,197,94,0.05)",
            border: "1px solid rgba(34,197,94,0.1)",
            borderRadius: 10, padding: "10px 14px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#4ade80" }}>Calm Mind</div>
              <div style={{ fontSize: 11, color: "#1e4a30" }}>30-sec reset · +15 XP</div>
            </div>
            <div style={{ fontSize: 18 }}>✓</div>
          </div>
        </div>

        {/* ── Bottom nav ── */}
        <div style={{
          display: "flex", justifyContent: "space-around",
          padding: "18px 16px 22px", marginTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          {[
            { label: "HOME", icon: "⌂", active: true },
            { label: "PROFILE", icon: "◯" },
            { label: "HABITS", icon: "◎" },
            { label: "SYSTEM", icon: "⊞" },
          ].map(n => (
            <div key={n.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              opacity: n.active ? 1 : 0.25, cursor: "pointer",
            }}>
              <span style={{ fontSize: 17 }}>{n.icon}</span>
              <span style={{ fontSize: 9, letterSpacing: "0.1em", color: n.active ? t.accent : "#3a5060", transition: "color 0.5s" }}>{n.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

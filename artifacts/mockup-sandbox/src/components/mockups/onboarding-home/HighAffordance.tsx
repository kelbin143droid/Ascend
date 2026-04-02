import { Wind, ChevronRight, CheckCircle, Circle } from "lucide-react";

const STEPS_LABELS = ["Reset", "Movement", "Hydration", "Reflect", "Cardio", "Planning", "Follow-through"];

export function HighAffordance() {
  const currentDay = 1;

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "#080812",
        color: "#f0f0f8",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 72,
      }}
    >
      {/* Header status bar */}
      <div
        style={{
          padding: "48px 24px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(240,240,248,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Day {currentDay} of 7
          </p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f0f0f8", marginTop: 2 }}>
            2-Minute Reset
          </p>
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "conic-gradient(#8b5cf6 0%, #8b5cf6 14.3%, rgba(139,92,246,0.15) 14.3%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#080812",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "#8b5cf6" }}>1/7</span>
          </div>
        </div>
      </div>

      {/* Step track — scrollable day indicators */}
      <div style={{ padding: "0 24px 20px", display: "flex", gap: 8, overflowX: "auto" }}>
        {STEPS_LABELS.map((label, i) => {
          const done = i < currentDay - 1;
          const active = i === currentDay - 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
                opacity: i > currentDay - 1 ? 0.35 : 1,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: done
                    ? "rgba(139,92,246,0.9)"
                    : active
                    ? "transparent"
                    : "rgba(255,255,255,0.06)",
                  border: active ? "2px solid #8b5cf6" : done ? "none" : "2px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {done ? (
                  <CheckCircle size={14} color="#fff" />
                ) : active ? (
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#8b5cf6" }}>{i + 1}</span>
                ) : (
                  <span style={{ fontSize: 10, color: "rgba(240,240,248,0.3)" }}>{i + 1}</span>
                )}
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: active ? "#8b5cf6" : "rgba(240,240,248,0.3)",
                  letterSpacing: "0.05em",
                  maxWidth: 36,
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Main action card — the whole card is tappable */}
        <button
          style={{
            width: "100%",
            background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(88,28,135,0.12) 100%)",
            border: "2px solid rgba(139,92,246,0.4)",
            borderRadius: 20,
            padding: "22px 20px",
            cursor: "pointer",
            textAlign: "left",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 0 40px rgba(139,92,246,0.12)",
          }}
        >
          {/* Label: "Tap to begin" affordance hint */}
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              fontSize: 10,
              color: "rgba(139,92,246,0.7)",
              letterSpacing: "0.1em",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            TAP TO BEGIN
            <ChevronRight size={12} color="rgba(139,92,246,0.7)" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "rgba(139,92,246,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
            >
              <Wind size={24} color="#8b5cf6" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f0f0f8", lineHeight: 1.2 }}>
                2-Minute Reset
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(139,92,246,0.8)", marginTop: 4 }}>
                2 minutes · Breathing
              </p>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "rgba(240,240,248,0.6)" }}>
            Slow breathing to reset your system. Just two minutes — this is your only task today.
          </p>

          {/* Visual progress hint inside the card */}
          <div
            style={{
              height: 3,
              backgroundColor: "rgba(139,92,246,0.1)",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div style={{ width: "0%", height: "100%", backgroundColor: "#8b5cf6", borderRadius: 99 }} />
          </div>
          <p style={{ margin: 0, fontSize: 10, color: "rgba(139,92,246,0.5)", textAlign: "right" }}>
            NOT STARTED
          </p>
        </button>

        {/* Coach — secondary, clearly labeled */}
        <div
          style={{
            padding: "14px 16px",
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p style={{ margin: "0 0 6px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(139,92,246,0.5)", fontWeight: 700 }}>
            From your coach
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(240,240,248,0.5)", lineHeight: 1.55 }}>
            Begin with one small action.
          </p>
        </div>

        {/* Explicit "what happens next" affordance */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(255,255,255,0.015)",
            borderRadius: 12,
            border: "1px dashed rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "rgba(240,240,248,0.3)" }}>
            Completing unlocks Day 2
          </p>
          <Circle size={16} color="rgba(139,92,246,0.3)" />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "rgba(240,240,248,0.15)",
            marginTop: 4,
            fontStyle: "italic",
          }}
        >
          Tradeoff: visible affordances & state machine — less content visible at once
        </p>
      </div>

      {/* Bottom nav */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: "#0c0c1a",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {["Home", "Train", "Habits", "Coach"].map((tab) => (
          <div
            key={tab}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              opacity: tab === "Home" ? 1 : 0.3,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: tab === "Home" ? "#8b5cf6" : "rgba(255,255,255,0.15)" }} />
            <span style={{ fontSize: 9, color: tab === "Home" ? "#8b5cf6" : "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
              {tab.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

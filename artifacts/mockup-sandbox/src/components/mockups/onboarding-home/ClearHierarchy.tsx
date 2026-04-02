import { Wind, CheckCircle2, Play } from "lucide-react";

const STEP = {
  day: 1,
  name: "2-Minute Reset",
  description: "Slow breathing to reset your nervous system and begin from a calm place.",
  coach: "Begin with one small action.",
  duration: "2 minutes",
};

export function ClearHierarchy() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "#070710",
        color: "#f0f0f8",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: "0 0 80px",
      }}
    >
      {/* ── Tier 1: WHAT DAY ─── dominant visual anchor */}
      <div
        style={{
          padding: "52px 28px 0",
          borderBottom: "1px solid rgba(139,92,246,0.08)",
          paddingBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span
            style={{
              fontSize: 52,
              fontWeight: 900,
              lineHeight: 1,
              color: "#8b5cf6",
              letterSpacing: "-2px",
            }}
          >
            1
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(240,240,248,0.45)", letterSpacing: "0.08em" }}>
            / 7 DAYS
          </span>
        </div>
        <p style={{ fontSize: 11, color: "rgba(240,240,248,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
          First week of Ascend
        </p>
      </div>

      {/* ── Tier 2: WHAT TO DO ── strong visual weight, clear session card */}
      <div style={{ padding: "28px 28px 0", flex: 1 }}>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%)",
            border: "1.5px solid rgba(139,92,246,0.25)",
            borderRadius: 16,
            padding: "24px 22px",
            marginBottom: 20,
          }}
        >
          {/* Session identity — medium weight */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "rgba(139,92,246,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Wind size={22} color="#8b5cf6" />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#f0f0f8",
                  letterSpacing: "-0.3px",
                  lineHeight: 1.2,
                }}
              >
                {STEP.name}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(139,92,246,0.8)", marginTop: 3, fontWeight: 500 }}>
                {STEP.duration}
              </p>
            </div>
          </div>

          {/* Description — tertiary */}
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.65,
              color: "rgba(240,240,248,0.55)",
            }}
          >
            {STEP.description}
          </p>
        </div>

        {/* ── Tier 3: COACH ── clearly subordinate */}
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 32,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "rgba(139,92,246,0.55)",
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            Coach
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(240,240,248,0.5)", lineHeight: 1.55 }}>
            {STEP.coach}
          </p>
        </div>

        {/* ── Tier 4: MICRO-COMMIT ── whisper-level */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "rgba(240,240,248,0.2)",
            letterSpacing: "0.06em",
            marginBottom: 32,
          }}
        >
          One action. That's the whole task.
        </p>
      </div>

      {/* ── CTA ── pinned, high contrast, single action */}
      <div style={{ padding: "0 28px" }}>
        <button
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
            border: "none",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 0 32px rgba(139,92,246,0.35)",
          }}
        >
          <Play size={16} fill="#fff" />
          Begin Today's Reset
        </button>
        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "rgba(240,240,248,0.18)",
            marginTop: 12,
            letterSpacing: "0.04em",
          }}
        >
          Tradeoff: stripped hierarchy is crystal clear, but reduces content richness
        </p>
      </div>

      {/* Bottom nav placeholder */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: "#0c0c18",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 16px",
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
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: tab === "Home" ? "#8b5cf6" : "rgba(255,255,255,0.2)",
              }}
            />
            <span style={{ fontSize: 9, color: tab === "Home" ? "#8b5cf6" : "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
              {tab.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

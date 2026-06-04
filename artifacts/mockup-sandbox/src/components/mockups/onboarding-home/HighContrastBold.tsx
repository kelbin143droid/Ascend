export function HighContrastBold() {
  const stats = [
    { label: "STR", value: 1 },
    { label: "AGI", value: 1 },
    { label: "SNS", value: 1 },
    { label: "VIT", value: 1 },
  ];

  const habits = [
    { name: "Morning Water", done: true },
    { name: "5-min Breathwork", done: true },
    { name: "Evening Reflection", done: false },
  ];

  return (
    <div
      style={{
        background: "#080808",
        minHeight: "100vh",
        fontFamily: "'Arial Black', 'Impact', sans-serif",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        maxWidth: 390,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hard geometric accent lines */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: "linear-gradient(90deg, #facc15 0%, #ffffff 50%, #facc15 100%)",
      }} />
      <div style={{
        position: "absolute", top: 0, right: 24, width: 1, height: 120,
        background: "rgba(250,204,21,0.3)",
      }} />

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px 0" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.35em", color: "#facc15",
            textTransform: "uppercase", fontFamily: "'Arial', sans-serif",
          }}>
            PHASE I — STABILIZATION
          </div>
          <div style={{ fontSize: 11, color: "#444", letterSpacing: "0.15em", fontFamily: "'Arial', sans-serif" }}>
            AWAKENED HUNTER SYSTEM
          </div>
        </div>
        <div style={{
          border: "1px solid #facc15",
          padding: "5px 12px",
          fontSize: 11,
          color: "#facc15",
          letterSpacing: "0.1em",
          fontFamily: "'Arial', sans-serif",
        }}>
          RANK E
        </div>
      </div>

      {/* Huge level number */}
      <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "flex-end", gap: 0 }}>
        <div>
          <div style={{
            fontSize: 9, letterSpacing: "0.3em", color: "#555",
            textTransform: "uppercase", fontFamily: "'Arial', sans-serif", marginBottom: 2,
          }}>
            CURRENT LEVEL
          </div>
          <div style={{ fontSize: 80, fontWeight: 900, color: "#fff", lineHeight: 0.9, letterSpacing: "-0.02em" }}>
            01
          </div>
        </div>
        <div style={{ marginLeft: 16, marginBottom: 12, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.2em", fontFamily: "'Arial', sans-serif" }}>XP</span>
            <span style={{ fontSize: 9, color: "#facc15", fontFamily: "'Arial', sans-serif" }}>0/100</span>
          </div>
          <div style={{ height: 3, background: "#1a1a1a", marginBottom: 8 }}>
            <div style={{ width: "0%", height: "100%", background: "#facc15" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.2em", fontFamily: "'Arial', sans-serif" }}>HP</span>
            <span style={{ fontSize: 9, color: "#f87171", fontFamily: "'Arial', sans-serif" }}>100/100</span>
          </div>
          <div style={{ height: 3, background: "#1a1a1a" }}>
            <div style={{ width: "100%", height: "100%", background: "#dc2626" }} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: "12px 24px", height: 1, background: "#1c1c1c" }} />

      {/* Stability block */}
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{
            fontSize: 9, letterSpacing: "0.3em", color: "#555",
            textTransform: "uppercase", fontFamily: "'Arial', sans-serif",
          }}>STABILITY SCORE</span>
          <span style={{ fontSize: 9, color: "#aaa", fontFamily: "'Arial', sans-serif" }}>STABILIZING</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 52, fontWeight: 900, color: "#facc15", lineHeight: 1, letterSpacing: "-0.02em" }}>26</span>
          <span style={{ fontSize: 13, color: "#333", fontFamily: "'Arial', sans-serif" }}>/100</span>
        </div>
        <div style={{ height: 6, background: "#111", position: "relative", marginBottom: 4 }}>
          <div style={{ width: "26%", height: "100%", background: "linear-gradient(90deg, #92400e, #facc15)" }} />
          <div style={{
            position: "absolute", left: "26%", top: -4, bottom: -4, width: 2,
            background: "#facc15",
          }} />
        </div>
        <div style={{
          fontSize: 9, color: "#333", letterSpacing: "0.15em",
          fontFamily: "'Arial', sans-serif", textAlign: "right",
        }}>
          0 ────────────────── 100
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{
          fontSize: 9, letterSpacing: "0.3em", color: "#555",
          textTransform: "uppercase", fontFamily: "'Arial', sans-serif", marginBottom: 10,
        }}>
          ATTRIBUTES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                border: "1px solid #1c1c1c",
                padding: "10px 6px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#facc15" }} />
              <div style={{
                fontSize: 22, fontWeight: 900, color: "#fff",
                fontFamily: "'Arial Black', sans-serif",
              }}>{s.value}</div>
              <div style={{
                fontSize: 9, color: "#444", marginTop: 2,
                textTransform: "uppercase", letterSpacing: "0.15em",
                fontFamily: "'Arial', sans-serif",
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rituals */}
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{
            fontSize: 9, letterSpacing: "0.3em", color: "#555",
            textTransform: "uppercase", fontFamily: "'Arial', sans-serif",
          }}>DAILY PROTOCOLS</div>
          <div style={{
            background: "#facc15", color: "#000",
            fontSize: 9, fontWeight: 900,
            padding: "2px 8px", letterSpacing: "0.1em",
          }}>2/3 DONE</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {habits.map((h) => (
            <div
              key={h.name}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: h.done ? "#0f0f0f" : "transparent",
                borderLeft: h.done ? "3px solid #facc15" : "3px solid #1c1c1c",
                padding: "10px 12px",
              }}
            >
              <div style={{
                width: 16, height: 16, flexShrink: 0,
                background: h.done ? "#facc15" : "transparent",
                border: h.done ? "none" : "1px solid #333",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {h.done && <span style={{ fontSize: 9, color: "#000", fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{
                fontSize: 12, color: h.done ? "#fff" : "#333",
                fontFamily: "'Arial', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>{h.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quote strip */}
      <div style={{
        margin: "16px 24px 0",
        background: "#0f0f0f",
        borderLeft: "3px solid #facc15",
        padding: "10px 14px",
      }}>
        <div style={{
          fontSize: 11, color: "#666", fontFamily: "'Arial', sans-serif",
          fontStyle: "italic", lineHeight: 1.5,
        }}>
          "One small step begins everything."
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "20px 24px 28px", marginTop: "auto" }}>
        <button
          style={{
            width: "100%",
            padding: "18px",
            background: "#facc15",
            border: "none",
            color: "#000",
            fontSize: 14,
            fontWeight: 900,
            fontFamily: "'Arial Black', sans-serif",
            cursor: "pointer",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            position: "relative",
            overflow: "hidden",
          }}
        >
          INITIATE DAILY FLOW
          <span style={{ marginLeft: 10 }}>→</span>
        </button>
        <div style={{
          textAlign: "center", marginTop: 10,
          fontSize: 9, color: "#333",
          letterSpacing: "0.2em", textTransform: "uppercase",
          fontFamily: "'Arial', sans-serif",
        }}>
          STREAK: 0 DAYS
        </div>
      </div>
    </div>
  );
}

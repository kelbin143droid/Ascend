export function SoftMinimal() {
  const stats = [
    { label: "STR", value: 1, desc: "Strength" },
    { label: "AGI", value: 1, desc: "Agility" },
    { label: "SNS", value: 1, desc: "Sense" },
    { label: "VIT", value: 1, desc: "Vitality" },
  ];

  const habits = [
    { name: "Morning Water", done: true, icon: "💧" },
    { name: "5-min Breathwork", done: true, icon: "🌬" },
    { name: "Evening Reflection", done: false, icon: "🌙" },
  ];

  return (
    <div
      style={{
        background: "#0d0b14",
        minHeight: "100vh",
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
        color: "#e2dff0",
        display: "flex",
        flexDirection: "column",
        maxWidth: 390,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Very subtle ambient glow */}
      <div style={{
        position: "absolute", top: -120, left: "30%", transform: "translateX(-50%)",
        width: 280, height: 280,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -80, right: -40,
        width: 220, height: 220,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(110,231,183,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Phase pill + rank */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(139,92,246,0.1)",
          borderRadius: 20,
          padding: "5px 12px",
          border: "1px solid rgba(139,92,246,0.2)",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
          <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 500 }}>Phase I · Stabilization</span>
        </div>
        <div style={{ fontSize: 12, color: "#4b4662", fontWeight: 500 }}>Rank E</div>
      </div>

      {/* Greeting block */}
      <div style={{ padding: "32px 24px 0" }}>
        <p style={{ fontSize: 13, color: "#6b6880", fontWeight: 400, marginBottom: 6 }}>Welcome back</p>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: "#ede9fe", margin: 0, letterSpacing: "-0.02em" }}>
          Awakened One
        </h1>
        <p style={{ fontSize: 13, color: "#6b6880", marginTop: 8, lineHeight: 1.6, fontStyle: "italic" }}>
          "One small step begins everything."
        </p>
      </div>

      {/* Core metrics — light cards */}
      <div style={{ padding: "24px 24px 0", display: "flex", gap: 12 }}>
        {/* Stability */}
        <div style={{
          flex: 1,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 16,
          padding: "16px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ fontSize: 10, color: "#4b4662", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>Stability</p>
          <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 8px" }}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="24"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="4"
                strokeDasharray={`${(26 / 100) * 150.8} 150.8`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
                opacity="0.7"
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#c4b5fd" }}>26</span>
            </div>
          </div>
          <p style={{ fontSize: 10, color: "#6b6880", textAlign: "center", margin: 0 }}>Stabilizing</p>
        </div>

        {/* XP & HP */}
        <div style={{
          flex: 1.3,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 16,
          padding: "16px",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 10, color: "#4b4662", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px" }}>Level</p>
            <p style={{ fontSize: 30, fontWeight: 600, color: "#ede9fe", margin: "0 0 12px", letterSpacing: "-0.03em" }}>1</p>
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#4b4662" }}>XP</span>
                <span style={{ fontSize: 10, color: "#a78bfa" }}>0 / 100</span>
              </div>
              <div style={{ height: 3, background: "rgba(139,92,246,0.1)", borderRadius: 2 }}>
                <div style={{ width: "0%", height: "100%", background: "#8b5cf6", borderRadius: 2, opacity: 0.8 }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#4b4662" }}>HP</span>
                <span style={{ fontSize: 10, color: "#6ee7b7" }}>100 / 100</span>
              </div>
              <div style={{ height: 3, background: "rgba(110,231,183,0.1)", borderRadius: 2 }}>
                <div style={{ width: "100%", height: "100%", background: "#6ee7b7", borderRadius: 2, opacity: 0.7 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div style={{ padding: "20px 24px 0" }}>
        <p style={{ fontSize: 10, color: "#4b4662", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>Attributes</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.025)",
                borderRadius: 12,
                padding: "10px 6px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <p style={{ fontSize: 18, fontWeight: 500, color: "#c4b5fd", margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 9, color: "#4b4662", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rituals */}
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: "#4b4662", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>Daily Rituals</p>
          <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 500 }}>2 of 3</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {habits.map((h) => (
            <div
              key={h.name}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: "11px 14px",
                opacity: h.done ? 1 : 0.45,
              }}
            >
              <span style={{ fontSize: 14 }}>{h.icon}</span>
              <span style={{ fontSize: 13, color: h.done ? "#e2dff0" : "#9993b0", flex: 1, fontWeight: 400 }}>{h.name}</span>
              {h.done && (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "rgba(139,92,246,0.2)",
                  border: "1px solid rgba(139,92,246,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 9, color: "#a78bfa" }}>✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Flow state — ghost card */}
      <div style={{ padding: "14px 24px 0" }}>
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 12 }}>〰</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: "#6b6880", margin: 0, fontWeight: 400 }}>
              Flow State · <span style={{ color: "#4b4662" }}>Awaiting Action</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ width: 3, height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 2 }} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "20px 24px 32px", marginTop: "auto" }}>
        <button
          style={{
            width: "100%",
            padding: "16px",
            background: "rgba(139,92,246,0.18)",
            border: "1px solid rgba(139,92,246,0.35)",
            borderRadius: 14,
            color: "#c4b5fd",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "inherit",
            cursor: "pointer",
            letterSpacing: "0.01em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <span>Begin Daily Flow</span>
          <span style={{ opacity: 0.7 }}>→</span>
        </button>
        <p style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#3d3a52", margin: "10px 0 0" }}>
          Streak: 0 days — start your journey
        </p>
      </div>
    </div>
  );
}

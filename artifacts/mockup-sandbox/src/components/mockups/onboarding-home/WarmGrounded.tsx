export function WarmGrounded() {
  const stats = [
    { label: "STR", value: 1, color: "#f97316" },
    { label: "AGI", value: 1, color: "#fbbf24" },
    { label: "SNS", value: 1, color: "#fb923c" },
    { label: "VIT", value: 1, color: "#f59e0b" },
  ];

  const habits = [
    { name: "Morning Water", done: true },
    { name: "5-min Breathwork", done: true },
    { name: "Evening Reflection", done: false },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(160deg, #1c0f02 0%, #2a1505 50%, #1a0e04 100%)",
        minHeight: "100vh",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#f5e6d0",
        display: "flex",
        flexDirection: "column",
        maxWidth: 390,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
        width: 300, height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#c2885c", textTransform: "uppercase" }}>Phase I</div>
          <div style={{ fontSize: 14, fontWeight: "bold", color: "#f5e6d0" }}>Stabilization</div>
        </div>
        <div style={{
          background: "rgba(245,158,11,0.15)",
          border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: 20,
          padding: "4px 14px",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
          <span style={{ fontSize: 12, color: "#fbbf24" }}>Rank E</span>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: "28px 24px 0" }}>
        <div style={{ fontSize: 13, color: "#c2885c", marginBottom: 4 }}>Good morning,</div>
        <div style={{ fontSize: 28, fontWeight: "bold", color: "#fde68a", lineHeight: 1.2 }}>Awakened One</div>
        <div style={{ marginTop: 8, fontSize: 13, color: "#b8916b", fontStyle: "italic", lineHeight: 1.5 }}>
          "One small step begins everything."
        </div>
      </div>

      {/* Stability ring + XP */}
      <div style={{ padding: "28px 24px 0", display: "flex", gap: 16, alignItems: "stretch" }}>
        {/* Stability */}
        <div style={{
          flex: 1,
          background: "rgba(251,146,60,0.08)",
          border: "1px solid rgba(251,146,60,0.2)",
          borderRadius: 16,
          padding: "16px",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{ position: "relative", width: 72, height: 72, marginBottom: 8 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(251,146,60,0.15)" strokeWidth="5" />
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke="url(#warmGrad)"
                strokeWidth="5"
                strokeDasharray={`${(26 / 100) * 175.9} 175.9`}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
              />
              <defs>
                <linearGradient id="warmGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              flexDirection: "column",
            }}>
              <span style={{ fontSize: 18, fontWeight: "bold", color: "#fbbf24" }}>26</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#c2885c", textTransform: "uppercase", letterSpacing: "0.1em" }}>Stability</div>
          <div style={{ fontSize: 12, color: "#f97316", marginTop: 2 }}>Stabilizing</div>
        </div>

        {/* XP & Level */}
        <div style={{
          flex: 1.2,
          background: "rgba(251,146,60,0.08)",
          border: "1px solid rgba(251,146,60,0.2)",
          borderRadius: 16,
          padding: "16px",
        }}>
          <div style={{ fontSize: 11, color: "#c2885c", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Progress</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 }}>
            <span style={{ fontSize: 32, fontWeight: "bold", color: "#fde68a" }}>1</span>
            <span style={{ fontSize: 13, color: "#c2885c" }}>/ lvl</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#c2885c" }}>XP</span>
              <span style={{ fontSize: 11, color: "#fbbf24" }}>0 / 100</span>
            </div>
            <div style={{ height: 5, background: "rgba(251,146,60,0.15)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: "0%", height: "100%", background: "linear-gradient(90deg, #f97316, #fbbf24)", borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#c2885c" }}>HP</span>
              <span style={{ fontSize: 11, color: "#fb923c" }}>100 / 100</span>
            </div>
            <div style={{ height: 5, background: "rgba(251,146,60,0.15)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #dc2626, #f97316)", borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{ fontSize: 11, color: "#c2885c", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Attributes</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(251,146,60,0.07)",
                border: `1px solid rgba(251,146,60,0.18)`,
                borderRadius: 12,
                padding: "10px 6px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: "bold", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#a0785a", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Rituals */}
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#c2885c", textTransform: "uppercase", letterSpacing: "0.15em" }}>Today's Rituals</div>
          <div style={{ fontSize: 12, color: "#f59e0b" }}>2 / 3</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {habits.map((h) => (
            <div
              key={h.name}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: h.done ? "rgba(251,146,60,0.1)" : "rgba(255,255,255,0.03)",
                border: h.done ? "1px solid rgba(251,146,60,0.25)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: h.done ? "rgba(245,158,11,0.25)" : "transparent",
                border: h.done ? "2px solid #f59e0b" : "2px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {h.done && <span style={{ fontSize: 11, color: "#f59e0b" }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, color: h.done ? "#fde68a" : "#9a7a60", textDecoration: h.done ? "none" : "none" }}>{h.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flow State */}
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{
          background: "rgba(251,146,60,0.07)",
          border: "1px solid rgba(251,146,60,0.15)",
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>🌊</span>
          <div>
            <div style={{ fontSize: 12, color: "#fbbf24" }}>Flow State</div>
            <div style={{ fontSize: 11, color: "#a0785a" }}>Awaiting Action</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ width: 4, height: 14, background: i < 0 ? "#f59e0b" : "rgba(251,146,60,0.2)", borderRadius: 2 }} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "20px 24px 28px", marginTop: "auto" }}>
        <button
          style={{
            width: "100%",
            padding: "17px",
            background: "linear-gradient(135deg, #c2410c 0%, #ea580c 40%, #f97316 100%)",
            border: "none",
            borderRadius: 16,
            color: "#fff9f0",
            fontSize: 16,
            fontWeight: "bold",
            fontFamily: "inherit",
            cursor: "pointer",
            letterSpacing: "0.03em",
            boxShadow: "0 4px 24px rgba(234,88,12,0.35)",
          }}
        >
          Begin Daily Flow →
        </button>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#6b4a30" }}>
          Streak: 0 days · Start your journey
        </div>
      </div>
    </div>
  );
}

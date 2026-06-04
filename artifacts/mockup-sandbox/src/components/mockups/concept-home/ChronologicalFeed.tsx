// Concept: Chronological Feed / Activity Log
// Information architecture: your day as a scrollable timeline — past completions
// are "posts", the active mission is pinned NOW, upcoming items fade below.
// Interaction model: scroll to review, tap the NOW card to act.
// Hypothesis: framing progress as a story you're living (not a dashboard to manage)
// increases completion motivation and makes partial progress feel rewarding.

export function ChronologicalFeed() {
  return (
    <div style={{
      background: "#070d14",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#c8dde8",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column" }}>

        {/* ── Compact identity bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#fff",
            }}>K</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#94b8d0" }}>KL's System</div>
              <div style={{ fontSize: 11, color: "#2c5060" }}>Level 1 · 15/100 XP</div>
            </div>
          </div>
          {/* Mini XP bar */}
          <div style={{ width: 80 }}>
            <div style={{ height: 3, background: "rgba(14,165,233,0.15)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: "15%", height: "100%", background: "#0ea5e9", borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* ── DATE stamp ── */}
        <div style={{ padding: "14px 20px 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: "#1e3f50", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em" }}>
            Today
          </div>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ fontSize: 11, color: "#1e3f50" }}>1 of 4 complete</div>
        </div>

        {/* ── TIMELINE ── */}
        <div style={{ padding: "0 20px", position: "relative" }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute", left: 34, top: 0, bottom: 0, width: 1,
            background: "rgba(255,255,255,0.06)",
          }} />

          {/* ── PAST EVENT: Calm Mind ── */}
          <div style={{ display: "flex", gap: 14, marginBottom: 10, alignItems: "flex-start" }}>
            {/* Timeline dot */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "rgba(34,197,94,0.2)",
              border: "2px solid #22c55e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, marginTop: 2, zIndex: 1,
            }}>✓</div>
            <div style={{
              flex: 1,
              background: "rgba(34,197,94,0.05)",
              border: "1px solid rgba(34,197,94,0.12)",
              borderRadius: 12,
              padding: "10px 14px",
              opacity: 0.8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#aaccdd" }}>Calm Mind</span>
                <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>+15 XP</span>
              </div>
              <div style={{ fontSize: 12, color: "#2c5060" }}>30-sec reset · Sense attribute</div>
            </div>
          </div>

          {/* ── NOW card — dominant, pinned ── */}
          <div style={{ display: "flex", gap: 14, marginBottom: 10, alignItems: "flex-start" }}>
            {/* NOW dot — pulsing ring via box-shadow */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "rgba(14,165,233,0.3)",
              border: "2px solid #0ea5e9",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 800, color: "#0ea5e9", marginTop: 2, zIndex: 1,
              boxShadow: "0 0 0 5px rgba(14,165,233,0.12), 0 0 0 10px rgba(14,165,233,0.05)",
              letterSpacing: "-0.02em",
            }}>⚡</div>
            <div style={{
              flex: 1,
              background: "rgba(14,165,233,0.1)",
              border: "1.5px solid rgba(14,165,233,0.35)",
              borderRadius: 14,
              padding: "16px 16px",
              boxShadow: "0 4px 24px rgba(14,165,233,0.1)",
            }}>
              {/* NOW badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#0ea5e9", borderRadius: 6,
                padding: "2px 8px", marginBottom: 10,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>NOW</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#e0eef8", marginBottom: 2 }}>Agility</div>
                  <div style={{ fontSize: 13, color: "#5a8ca8" }}>Mobility Flow · Step 2 of 4</div>
                </div>
                <div style={{
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 8, padding: "4px 10px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#4ade80" }}>+15</div>
                  <div style={{ fontSize: 9, color: "#22c55e", textTransform: "uppercase" }}>XP</div>
                </div>
              </div>

              <button style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #0284c7, #7c3aed)",
                border: "none", borderRadius: 10,
                color: "#fff", fontSize: 14, fontWeight: 700,
                fontFamily: "inherit", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                Begin mission <span style={{ opacity: 0.7 }}>→</span>
              </button>
            </div>
          </div>

          {/* ── UPCOMING ── */}
          {[
            { label: "Strength", sub: "Power Training", xp: "+12 XP", state: "up-next" },
            { label: "Vitality", sub: "Recovery Stable", xp: "+8 XP", state: "later" },
          ].map((item, i) => (
            <div key={item.label} style={{ display: "flex", gap: 14, marginBottom: 8, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "transparent",
                border: "1.5px dashed rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 2, zIndex: 1,
              }}>○</div>
              <div style={{
                flex: 1,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 10,
                padding: "10px 14px",
                opacity: i === 0 ? 0.5 : 0.25,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#4a6070" }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: "#2a4050" }}>{item.xp}</span>
                </div>
                <div style={{ fontSize: 11, color: "#1e3040" }}>{item.sub}</div>
              </div>
            </div>
          ))}

        </div>

        {/* ── Bottom nav ── */}
        <div style={{
          display: "flex", justifyContent: "space-around",
          padding: "14px 16px 20px",
          marginTop: 10,
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
              <span style={{ fontSize: 9, letterSpacing: "0.1em", color: n.active ? "#0ea5e9" : "#3a5060" }}>{n.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

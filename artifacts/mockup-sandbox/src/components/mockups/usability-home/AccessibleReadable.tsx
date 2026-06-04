// Usability tradeoff: Accessibility and readability
// WCAG AA+ contrast throughout, minimum 15px body text, no icon-only controls,
// generous spacing, text labels on every element, progress stated in words not just visuals.
// Tradeoff: less visual density — more scrolling — but no user left behind.

export function AccessibleReadable() {
  const statPipeline = [
    { label: "Sense", desc: "Calm Mind complete", state: "done" as const },
    { label: "Agility", desc: "In progress — Step 2 of 4", state: "active" as const },
    { label: "Strength", desc: "Power Training, queued", state: "queued" as const },
    { label: "Vitality", desc: "Recovery Stable, final step", state: "final" as const },
  ];

  const stateColors = {
    done:   { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.35)",  text: "#4ade80" },
    active: { bg: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.4)",  text: "#38bdf8" },
    queued: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "#64748b" },
    final:  { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "#64748b" },
  };

  return (
    <div style={{
      background: "#080e14",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#dce8f5",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      fontSize: 15,
      lineHeight: 1.55,
    }}>
      <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <button
            aria-label="Open menu"
            style={{
              width: 44, height: 44,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "#94b8d0",
            }}
          >☰</button>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#94b8d0", letterSpacing: "0.06em" }}>
            KL's System
          </h1>
          <button
            aria-label="Settings"
            style={{
              width: 44, height: 44,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "#94b8d0",
            }}
          >⚙</button>
        </header>

        {/* ── Level & XP — text-first ── */}
        <section style={{ padding: "18px 20px 0" }} aria-label="Player progress">
          <div style={{
            background: "rgba(14,165,233,0.08)",
            border: "1px solid rgba(14,165,233,0.2)",
            borderRadius: 14,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "#5a8ca8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>Current level</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#dce8f5", lineHeight: 1 }}>Level 1</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#5a8ca8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>Experience</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#38bdf8" }}>15 / 100 XP</div>
              </div>
            </div>
            {/* Progress bar with text label */}
            <div>
              <div style={{ height: 8, background: "rgba(14,165,233,0.12)", borderRadius: 4, overflow: "hidden", marginBottom: 5 }}>
                <div style={{
                  width: "15%", height: "100%",
                  background: "linear-gradient(90deg, #0ea5e9, #7c3aed)",
                  borderRadius: 4,
                }} />
              </div>
              <div style={{ fontSize: 12, color: "#3d6070" }}>15 XP earned · 85 XP to Level 2</div>
            </div>
          </div>
        </section>

        {/* ── Daily quest — full text ── */}
        <section style={{ padding: "12px 20px 0" }} aria-label="Daily quest status">
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>Daily Quest</div>
              <div style={{
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 6, padding: "3px 9px",
                fontSize: 12, fontWeight: 700, color: "#4ade80",
              }}>1 of 4 complete</div>
            </div>
            {/* Progress bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: i === 1 ? "#22c55e" : "rgba(255,255,255,0.07)",
                }} />
              ))}
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 15, color: "#aaccdd", lineHeight: 1.5 }}>
              First mission complete. Begin Agility to continue.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#4ade80" }}>
              +15 XP earned · Movement ability unlocked
            </p>
          </div>
        </section>

        {/* ── Active mission — highest contrast, largest text ── */}
        <section style={{ padding: "12px 20px 0" }} aria-label="Active mission">
          <div style={{
            background: "rgba(14,165,233,0.07)",
            border: "1.5px solid rgba(14,165,233,0.3)",
            borderRadius: 16,
            padding: "18px 18px 16px",
          }}>
            <div style={{
              fontSize: 11, color: "#0ea5e9", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12,
            }}>Active mission</div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "rgba(14,165,233,0.2)",
                border: "1.5px solid rgba(14,165,233,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>⚡</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#dce8f5", marginBottom: 2 }}>Agility</div>
                <div style={{ fontSize: 14, color: "#5a8ca8" }}>Mobility Flow</div>
              </div>
              <div style={{
                marginLeft: "auto", textAlign: "center",
                background: "rgba(14,165,233,0.1)",
                border: "1px solid rgba(14,165,233,0.25)",
                borderRadius: 10, padding: "8px 12px",
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8", lineHeight: 1 }}>2/4</div>
                <div style={{ fontSize: 11, color: "#3d6070", marginTop: 2 }}>steps done</div>
              </div>
            </div>

            {/* Reward + next — text-first */}
            <div style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 10, padding: "10px 14px",
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 2 }}>Reward: +12 XP</div>
              <div style={{ fontSize: 13, color: "#3d6070" }}>Completing unlocks Physical Circuit next</div>
            </div>

            {/* Accessible CTA */}
            <button
              aria-label="Begin Agility mission, earns 15 XP"
              style={{
                width: "100%",
                minHeight: 54,
                background: "linear-gradient(135deg, #0284c7, #7c3aed)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                letterSpacing: "0.01em",
              }}
            >
              <span>Begin mission</span>
              <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 8px", fontSize: 13 }}>+15 XP</span>
            </button>
          </div>
        </section>

        {/* ── Full activity pipeline with text descriptions ── */}
        <section style={{ padding: "16px 20px 0" }} aria-label="Activity pipeline">
          <div style={{
            fontSize: 11, color: "#2c4a5c",
            textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10,
          }}>Activity pipeline</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {statPipeline.map(s => {
              const c = stateColors[s.state];
              return (
                <div key={s.label} style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 12,
                  opacity: s.state === "queued" || s.state === "final" ? 0.6 : 1,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: c.text, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#dce8f5" }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "#4a6a80", marginTop: 1 }}>{s.desc}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: c.text,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>{s.state}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Bottom nav with text labels ── */}
        <nav style={{
          display: "flex",
          padding: "14px 8px 20px",
          marginTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }} aria-label="Main navigation">
          {[
            { label: "Home",    icon: "⌂",  active: true  },
            { label: "Profile", icon: "◯",  active: false },
            { label: "Habits",  icon: "◎",  active: false },
            { label: "System",  icon: "⊞",  active: false },
          ].map(n => (
            <button
              key={n.label}
              aria-label={n.label}
              aria-current={n.active ? "page" : undefined}
              style={{
                flex: 1,
                minHeight: 54,
                background: n.active ? "rgba(14,165,233,0.1)" : "transparent",
                border: n.active ? "1px solid rgba(14,165,233,0.2)" : "1px solid transparent",
                borderRadius: 12,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 18, opacity: n.active ? 1 : 0.35 }}>{n.icon}</span>
              <span style={{
                fontSize: 11, letterSpacing: "0.06em",
                color: n.active ? "#38bdf8" : "#2a4a5c",
                fontWeight: n.active ? 600 : 400,
              }}>{n.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  );
}

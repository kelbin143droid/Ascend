// Usability tradeoff: Ease of interaction and affordance visibility
// Every tappable surface looks explicitly pressable: raised cards, arrow indicators,
// active pulse rings, 48px+ touch targets, clear hover/tap states.
// Tradeoff: heavier visual weight, more "UI noise" — but zero ambiguity about what's interactive.

export function AffordanceFirst() {
  return (
    <div style={{
      background: "#06111a",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#dce8f0",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column" }}>

        {/* ── Header — menu + title + settings as explicit tap targets ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 16px 12px",
        }}>
          {/* Hamburger — raised button treatment */}
          <button style={{
            width: 42, height: 42,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 16, height: 1.5, background: "#8ab0c8" }} />)}
            </div>
          </button>

          <div style={{ fontSize: 14, fontWeight: 700, color: "#94b8d0", letterSpacing: "0.08em" }}>
            ✦ KL'S SYSTEM
          </div>

          {/* Settings — raised button */}
          <button style={{
            width: 42, height: 42,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            fontSize: 16,
          }}>⚙</button>
        </div>

        {/* ── Level card — tappable (explicit › affordance) ── */}
        <div style={{ padding: "0 16px 10px" }}>
          <div style={{
            background: "rgba(14,165,233,0.08)",
            border: "1px solid rgba(14,165,233,0.18)",
            borderRadius: 14,
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 14,
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(14,165,233,0.08)",
            minHeight: 60,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #0ea5e9, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0,
            }}>⚡</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#94b8d0", letterSpacing: "0.06em" }}>LEVEL 1</span>
                <span style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 600 }}>XP 15 / 100</span>
              </div>
              <div style={{ height: 5, background: "rgba(14,165,233,0.15)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: "15%", height: "100%", background: "linear-gradient(90deg, #0ea5e9, #7c3aed)", borderRadius: 3 }} />
              </div>
            </div>
            {/* Explicit tap indicator */}
            <div style={{ fontSize: 18, color: "#2a6080", marginLeft: 4 }}>›</div>
          </div>
        </div>

        {/* ── Quest card — tappable ── */}
        <div style={{ padding: "0 16px 10px" }}>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "14px 16px",
            cursor: "pointer",
            minHeight: 60,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700 }}>Daily Quest</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      width: 18, height: 4, borderRadius: 2,
                      background: i === 1 ? "#22c55e" : "rgba(255,255,255,0.07)",
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: "#4a7890" }}>1/4</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#7aaccc", lineHeight: 1.5 }}>
              First mission complete. Begin Agility.
            </div>
            <div style={{ fontSize: 12, color: "#22c55e" }}>+15 XP earned · Movement unlocked ✓</div>
          </div>
        </div>

        {/* ── Stat tabs — each is an explicit tap target (48px height) ── */}
        <div style={{ padding: "0 16px 10px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "Sense", icon: "👁", state: "done" },
              { label: "Agility", icon: "⚡", state: "active" },
              { label: "Strength", icon: "💪", state: "queued" },
              { label: "Vitality", icon: "❤️", state: "queued" },
            ].map(s => (
              <button key={s.label} style={{
                flex: 1,
                minHeight: 52,
                background: s.state === "active"
                  ? "rgba(14,165,233,0.15)"
                  : s.state === "done"
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(255,255,255,0.03)",
                border: s.state === "active"
                  ? "1.5px solid rgba(14,165,233,0.5)"
                  : s.state === "done"
                    ? "1.5px solid rgba(34,197,94,0.25)"
                    : "1.5px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                cursor: "pointer",
                position: "relative",
                boxShadow: s.state === "active" ? "0 0 0 3px rgba(14,165,233,0.15)" : "none",
              }}>
                {/* Pulsing ring on active */}
                {s.state === "active" && (
                  <div style={{
                    position: "absolute", inset: -4,
                    borderRadius: 15,
                    border: "1px solid rgba(14,165,233,0.25)",
                    animation: "none",
                  }} />
                )}
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                <span style={{
                  fontSize: 9, letterSpacing: "0.1em",
                  color: s.state === "active" ? "#0ea5e9" : s.state === "done" ? "#22c55e" : "#2a5060",
                  textTransform: "uppercase",
                }}>{s.label}</span>
                {s.state === "done" && (
                  <div style={{
                    position: "absolute", top: 4, right: 4,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#22c55e",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: "#fff",
                  }}>✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Active mission card — maximum affordance clarity ── */}
        <div style={{ padding: "0 16px 10px" }}>
          <div style={{
            background: "rgba(14,165,233,0.07)",
            border: "1.5px solid rgba(14,165,233,0.25)",
            borderRadius: 16,
            padding: "18px 16px",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(14,165,233,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "rgba(14,165,233,0.2)",
                  border: "1px solid rgba(14,165,233,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>⚡</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#dce8f0" }}>Agility</div>
                  <div style={{ fontSize: 12, color: "#5a8ca8" }}>Mobility Flow</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#3d6070", textTransform: "uppercase", letterSpacing: "0.1em" }}>Step</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0ea5e9" }}>2/4</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {/* Reward tag */}
              <div style={{
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 8, padding: "5px 10px",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>+12 XP reward</span>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8, padding: "5px 10px",
                flex: 1,
              }}>
                <span style={{ fontSize: 11, color: "#3d6070" }}>Next: Physical Circuit unlock</span>
              </div>
            </div>

            {/* CTA — raised button with strong affordance */}
            <button style={{
              width: "100%",
              minHeight: 52,
              background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
              border: "none",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 4px 16px rgba(7,130,203,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
              letterSpacing: "0.01em",
            }}>
              <span>Begin mission</span>
              <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>+15 XP</span>
              <span style={{ fontSize: 18, marginLeft: 4 }}>→</span>
            </button>
          </div>
        </div>

        {/* ── Other activities — tappable cards with › ── */}
        <div style={{ padding: "0 16px 0" }}>
          <div style={{ fontSize: 10, color: "#2a4a5c", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>
            Other activities
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { name: "Calm Mind", sub: "30-sec reset", state: "done", color: "#22c55e" },
              { name: "Strength", sub: "Power Training", state: "queued", color: "#94a3b8" },
              { name: "Vitality", sub: "Recovery", state: "final", color: "#94a3b8" },
            ].map(c => (
              <button key={c.name} style={{
                flex: 1,
                minHeight: 72,
                background: c.state === "done" ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                border: c.state === "done" ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "10px 10px 10px 12px",
                textAlign: "left",
                cursor: "pointer",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.state === "done" ? "#dce8f0" : "#4a6070" }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "#2a4a5c" }}>{c.sub}</div>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: c.state === "done" ? "#22c55e" : "#2a4a5c",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginTop: 4,
                }}>
                  <span>{c.state}</span>
                  <span style={{ fontSize: 12 }}>{c.state !== "done" ? "›" : ""}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Bottom nav — explicit active + inactive states ── */}
        <div style={{
          display: "flex",
          padding: "14px 8px 18px",
          marginTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          {[
            { label: "HOME", icon: "⌂", active: true },
            { label: "PROFILE", icon: "◯" },
            { label: "HABITS", icon: "◎" },
            { label: "SYSTEM", icon: "⊞" },
          ].map(n => (
            <button key={n.label} style={{
              flex: 1,
              minHeight: 52,
              background: n.active ? "rgba(14,165,233,0.1)" : "transparent",
              border: n.active ? "1px solid rgba(14,165,233,0.2)" : "1px solid transparent",
              borderRadius: 12,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 3, cursor: "pointer",
            }}>
              <span style={{ fontSize: 17, opacity: n.active ? 1 : 0.3 }}>{n.icon}</span>
              <span style={{ fontSize: 9, letterSpacing: "0.1em", color: n.active ? "#0ea5e9" : "#2a4a5c" }}>{n.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

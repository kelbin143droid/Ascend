// Usability tradeoff: Clarity of information hierarchy
// One dominant action at a time — the active mission owns the viewport.
// Level/XP is compressed to a single status line. Stats recede.
// Tradeoff: less simultaneous context, but zero ambiguity about "what do I do next."

export function ClearHierarchy() {
  const stats = [
    { label: "SNS", done: true },
    { label: "AGI", active: true },
    { label: "STR", done: false },
    { label: "VIT", done: false },
  ];

  return (
    <div style={{
      background: "#080e14",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#e8f0f8",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column" }}>

        {/* ── Compressed status bar — all secondary info in one line ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff",
            }}>K</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#94b8d0" }}>KL'S SYSTEM</span>
          </div>
          {/* Inline mini stats — compressed */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#3d6070", letterSpacing: "0.1em" }}>LVL 1</div>
              <div style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 600 }}>XP 15/100</div>
            </div>
            <div style={{
              width: 56, height: 4, background: "#0f2030", borderRadius: 2, overflow: "hidden",
            }}>
              <div style={{ width: "15%", height: "100%", background: "#0ea5e9", borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* ── Quest breadcrumb — single line ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          <span style={{ fontSize: 11, color: "#3d6070", textTransform: "uppercase", letterSpacing: "0.12em" }}>Quest</span>
          <div style={{ display: "flex", gap: 4 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                width: i === 1 ? 20 : 14, height: 4,
                background: i === 1 ? "#22c55e" : "#0f2030",
                borderRadius: 2,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#3d6070" }}>1 / 4</span>
          <span style={{ fontSize: 11, color: "#22c55e", marginLeft: "auto" }}>First mission complete ✓</span>
        </div>

        {/* ── HERO: Active mission dominates ── */}
        <div style={{
          margin: "20px 20px 0",
          background: "linear-gradient(160deg, #0a1d2e 0%, #0d2538 100%)",
          border: "1px solid rgba(14,165,233,0.2)",
          borderRadius: 20,
          padding: "28px 24px 24px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Glow behind active icon */}
          <div style={{
            position: "absolute", top: -40, left: -40, width: 180, height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(14,165,233,0.2)",
              border: "2px solid rgba(14,165,233,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>⚡</div>
            <div>
              {/* Giant name — primary anchor */}
              <div style={{ fontSize: 32, fontWeight: 800, color: "#e8f0f8", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Agility
              </div>
              <div style={{ fontSize: 14, color: "#5a8ca8", marginTop: 3 }}>Mobility Flow · Step 2 of 4</div>
            </div>
            <div style={{
              marginLeft: "auto", textAlign: "center",
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 10, padding: "6px 10px",
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>+15</div>
              <div style={{ fontSize: 9, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.1em" }}>XP</div>
            </div>
          </div>

          {/* Next hint — secondary */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 10, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, color: "#3d6070", textTransform: "uppercase", letterSpacing: "0.1em" }}>Next</span>
            <span style={{ fontSize: 12, color: "#5a8ca8" }}>Physical Circuit unlock</span>
          </div>

          {/* Dominant CTA */}
          <button style={{
            width: "100%",
            padding: "17px",
            background: "linear-gradient(135deg, #0ea5e9, #7c3aed)",
            border: "none",
            borderRadius: 14,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            letterSpacing: "0.01em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <span>Begin mission</span>
            <span style={{ fontSize: 18, opacity: 0.8 }}>→</span>
          </button>
        </div>

        {/* ── Stat pipeline — minimal, below the fold visually ── */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ fontSize: 10, color: "#2c4a5c", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>
            Daily pipeline
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Sense", emoji: "👁", state: "done", note: "Calm Mind" },
              { label: "Agility", emoji: "⚡", state: "active", note: "In progress" },
              { label: "Strength", emoji: "💪", state: "queued", note: "Queued" },
              { label: "Vitality", emoji: "❤️", state: "final", note: "Final" },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1,
                background: s.state === "active"
                  ? "rgba(14,165,233,0.1)"
                  : s.state === "done"
                    ? "rgba(34,197,94,0.06)"
                    : "rgba(255,255,255,0.02)",
                border: s.state === "active"
                  ? "1px solid rgba(14,165,233,0.3)"
                  : "1px solid rgba(255,255,255,0.05)",
                borderRadius: 10, padding: "8px 6px",
                textAlign: "center",
                opacity: s.state === "queued" || s.state === "final" ? 0.45 : 1,
              }}>
                <div style={{ fontSize: 14 }}>{s.emoji}</div>
                <div style={{ fontSize: 10, color: "#5a8ca8", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom nav ── */}
        <div style={{
          display: "flex", justifyContent: "space-around",
          padding: "16px 20px 20px",
          marginTop: 14,
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
              opacity: n.active ? 1 : 0.3, cursor: "pointer",
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ fontSize: 9, letterSpacing: "0.1em", color: n.active ? "#0ea5e9" : "#4a6070" }}>{n.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

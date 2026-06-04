// Concept: Conversational Coach / Message Thread
// Information architecture: a chat with your AI coach. Progress and missions
// arrive as messages; you respond by choosing an action.
// Interaction model: read → reply (tap a choice, not navigate a dashboard).
// Hypothesis: wrapping the habit loop in a social/conversational frame reduces
// the cognitive weight of "managing yourself" — it feels like talking to a mentor,
// not operating a system.

function CoachBubble({ text, sub, time }: { text: string; sub?: string; time: string }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-end" }}>
      {/* Coach avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #7c3aed, #0ea5e9)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14,
      }}>◎</div>
      <div>
        <div style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px 14px 14px 4px",
          padding: "11px 14px",
          maxWidth: 280,
        }}>
          <p style={{ margin: 0, fontSize: 14, color: "#dce8f5", lineHeight: 1.55 }}>{text}</p>
          {sub && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#4a7080", lineHeight: 1.4 }}>{sub}</p>}
        </div>
        <div style={{ fontSize: 10, color: "#1e3040", marginTop: 3, paddingLeft: 4 }}>{time}</div>
      </div>
    </div>
  );
}

function SystemLine({ text }: { text: string }) {
  return (
    <div style={{
      textAlign: "center", fontSize: 11, color: "#1e3040",
      margin: "6px 0 10px",
    }}>{text}</div>
  );
}

export function ConversationalCoach() {
  return (
    <div style={{
      background: "#070d14",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#dce8f5",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column" }}>

        {/* ── Chat header ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>◎</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#c8dde8" }}>Ascend Coach</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 11, color: "#22c55e" }}>Active now</span>
            </div>
          </div>
          {/* XP pill */}
          <div style={{
            background: "rgba(14,165,233,0.1)",
            border: "1px solid rgba(14,165,233,0.2)",
            borderRadius: 20, padding: "4px 12px",
            fontSize: 12, fontWeight: 600, color: "#0ea5e9",
          }}>Lv.1 · 15 XP</div>
        </div>

        {/* ── Message thread ── */}
        <div style={{ padding: "16px 16px 0", flex: 1 }}>

          <SystemLine text="Today · Morning session" />

          <CoachBubble
            text="Good morning, KL. Your system is online."
            sub="You're building something real — one day at a time."
            time="Just now"
          />

          {/* Completion notification */}
          <div style={{
            display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-end",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #7c3aed, #0ea5e9)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>◎</div>
            <div>
              <div style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "14px 14px 14px 4px",
                padding: "11px 14px", maxWidth: 280,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(34,197,94,0.2)", border: "1px solid #22c55e",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "#4ade80",
                  }}>✓</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Calm Mind — Complete!</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#aaccdd", lineHeight: 1.5 }}>
                  30-second reset done. You earned <strong style={{ color: "#4ade80" }}>+15 XP</strong> and unlocked the Movement ability.
                </p>
              </div>
              <div style={{ fontSize: 10, color: "#1e3040", marginTop: 3, paddingLeft: 4 }}>Just now</div>
            </div>
          </div>

          <CoachBubble
            text="Movement is now active. Ready to go deeper with Agility?"
            sub="Mobility Flow · Step 2 of 4 · +15 XP on completion"
            time="Just now"
          />

          {/* Mission preview card in chat */}
          <div style={{ paddingLeft: 42, marginBottom: 14 }}>
            <div style={{
              background: "rgba(14,165,233,0.08)",
              border: "1px solid rgba(14,165,233,0.2)",
              borderRadius: "12px 12px 12px 4px",
              padding: "14px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(14,165,233,0.2)",
                  border: "1px solid rgba(14,165,233,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                }}>⚡</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#dce8f5" }}>Agility · Mobility Flow</div>
                  <div style={{ fontSize: 12, color: "#5a8ca8" }}>Step 2 of 4 · Next: Physical Circuit unlock</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 6, padding: "4px 10px",
                  fontSize: 12, color: "#4ade80", fontWeight: 600,
                }}>+15 XP</div>
                <div style={{
                  background: "rgba(14,165,233,0.08)",
                  border: "1px solid rgba(14,165,233,0.15)",
                  borderRadius: 6, padding: "4px 10px",
                  fontSize: 12, color: "#5a8ca8",
                }}>~5 min</div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Reply choices ── */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 11, color: "#1e3040", marginBottom: 8, paddingLeft: 4 }}>Quick reply</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Primary action */}
            <button style={{
              padding: "15px 18px",
              background: "linear-gradient(135deg, #0284c7, #7c3aed)",
              border: "none", borderRadius: 12,
              color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>Begin Agility mission</span>
              <span style={{ opacity: 0.7, fontSize: 13, fontWeight: 400 }}>+15 XP →</span>
            </button>
            {/* Secondary choices */}
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{
                flex: 1, padding: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, color: "#5a8ca8",
                fontSize: 13, fontFamily: "inherit", cursor: "pointer",
              }}>Remind me later</button>
              <button style={{
                flex: 1, padding: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, color: "#5a8ca8",
                fontSize: 13, fontFamily: "inherit", cursor: "pointer",
              }}>View my stats</button>
            </div>
          </div>
        </div>

        {/* ── Bottom nav ── */}
        <div style={{
          display: "flex", justifyContent: "space-around",
          padding: "12px 16px 18px",
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

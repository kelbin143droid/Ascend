// Concept: Ritual Card — One Thing
//
// UNDEREXPLORED AXIS: Every version of the home screen shows everything simultaneously:
// level, XP, quest log, mission pipeline, activity cards, nav bar.
// The implicit assumption is that users need context before they act.
//
// This variant inverts that assumption completely.
// The screen shows ONLY the next mission — full-bleed, atmospheric, occupying the
// entire viewport like a tarot card or ritual scroll.
// Stats, progress, and context are deliberately hidden until AFTER you tap.
// The experience is: open the app → here is your one thing → do it or don't.
//
// Hypothesis: radical information hiding at point-of-decision removes the
// cognitive overhead of "processing the dashboard" and makes the act of beginning
// feel more intentional — like drawing a card, not reviewing a report.

const CARD_STYLE = `
  @keyframes card-breathe {
    0%, 100% { box-shadow: 0 8px 60px rgba(14,165,233,0.2), 0 0 120px rgba(14,165,233,0.06); }
    50%       { box-shadow: 0 8px 80px rgba(14,165,233,0.3), 0 0 140px rgba(14,165,233,0.1); }
  }
  @keyframes rune-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.06; }
    50%       { transform: translateY(-8px) rotate(3deg); opacity: 0.1; }
  }
  .card-breathe { animation: card-breathe 4s ease-in-out infinite; }
  .rune-float   { animation: rune-float 6s ease-in-out infinite; }
  .rune-float-2 { animation: rune-float 8s ease-in-out infinite reverse; }
`;

function ProgressDots({ done, total }: { done: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i < done ? 18 : 6, height: 6, borderRadius: 3,
          background: i < done
            ? "rgba(14,165,233,0.7)"
            : i === done
              ? "rgba(14,165,233,0.3)"
              : "rgba(255,255,255,0.05)",
          transition: "all 0.3s",
        }} />
      ))}
    </div>
  );
}

export function RitualCard() {
  return (
    <div style={{
      background: "#050b12",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#c8dde8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{CARD_STYLE}</style>

      {/* Deep background gradient */}
      <div style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at 50% 30%, rgba(14,165,233,0.06) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Floating rune glyphs — atmospheric only */}
      <div className="rune-float" style={{
        position: "fixed", top: "10%", left: "8%",
        fontSize: 60, color: "#0ea5e9", pointerEvents: "none", userSelect: "none",
        fontWeight: 900, opacity: 0.06,
      }}>⚡</div>
      <div className="rune-float-2" style={{
        position: "fixed", bottom: "15%", right: "6%",
        fontSize: 48, color: "#7c3aed", pointerEvents: "none", userSelect: "none",
        fontWeight: 900, opacity: 0.06,
      }}>◎</div>

      {/* ── Top strip: ONLY the session context — minimal ── */}
      <div style={{
        width: "100%", maxWidth: 430,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 22px 0",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ fontSize: 11, color: "#1e3040", letterSpacing: "0.12em" }}>KL · DAILY FLOW</div>
        <ProgressDots done={1} total={4} />
      </div>

      {/* ── THE CARD — full viewport, almost no margin ── */}
      <div style={{
        width: "calc(100% - 32px)", maxWidth: 400,
        flex: 1, margin: "18px 0",
        position: "relative", zIndex: 1,
      }}>
        <div className="card-breathe" style={{
          height: "100%",
          background: "linear-gradient(160deg, #0c1e30 0%, #071018 50%, #080820 100%)",
          border: "1.5px solid rgba(14,165,233,0.2)",
          borderRadius: 24,
          padding: "0",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          minHeight: 380,
        }}>

          {/* Card top area — mission identity */}
          <div style={{
            flex: 1,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "40px 28px 24px",
            position: "relative",
          }}>
            {/* Subtle inner top glow */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 120,
              background: "linear-gradient(180deg, rgba(14,165,233,0.08) 0%, transparent 100%)",
              pointerEvents: "none",
            }} />

            {/* Mission sigil */}
            <div style={{
              width: 80, height: 80, borderRadius: 20, marginBottom: 24,
              background: "radial-gradient(circle at 40% 35%, rgba(56,189,248,0.3) 0%, rgba(14,165,233,0.08) 70%)",
              border: "2px solid rgba(14,165,233,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
              boxShadow: "0 4px 24px rgba(14,165,233,0.2)",
            }}>⚡</div>

            {/* Mission name — large, primary */}
            <div style={{
              fontSize: 38, fontWeight: 900, color: "#e8f4ff",
              letterSpacing: "-0.03em", textAlign: "center", lineHeight: 1.1,
              marginBottom: 8,
            }}>Agility</div>

            <div style={{
              fontSize: 15, color: "#3a6070", textAlign: "center", lineHeight: 1.5, marginBottom: 20,
            }}>Mobility Flow</div>

            {/* Step indicator — subtle */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(14,165,233,0.06)",
              border: "1px solid rgba(14,165,233,0.12)",
              borderRadius: 20, padding: "6px 16px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9" }} />
              <span style={{ fontSize: 12, color: "#5a8ca8", letterSpacing: "0.06em" }}>STEP 2 OF 4</span>
            </div>
          </div>

          {/* Dividing rule */}
          <div style={{ height: 1, background: "rgba(14,165,233,0.08)", margin: "0 24px" }} />

          {/* Card bottom — reward + what's next */}
          <div style={{ padding: "18px 24px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: "#1e3040", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>Reward</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>+15 XP</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#1e3040", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>Unlocks</div>
                <div style={{ fontSize: 13, color: "#5a8ca8", fontWeight: 600 }}>Physical Circuit</div>
              </div>
            </div>

            {/* THE ONE BUTTON — large, unhurried */}
            <button style={{
              width: "100%", padding: "18px",
              background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
              border: "none", borderRadius: 14,
              color: "#fff", fontSize: 16, fontWeight: 800,
              fontFamily: "inherit", cursor: "pointer",
              letterSpacing: "0.01em",
              boxShadow: "0 4px 24px rgba(14,165,233,0.25)",
            }}>
              Begin mission
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom: only context on demand ── */}
      <div style={{
        width: "100%", maxWidth: 430,
        padding: "0 22px 20px",
        position: "relative", zIndex: 1,
      }}>
        {/* Expand strip */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "8px 0 14px",
          cursor: "pointer", opacity: 0.35,
        }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: 10, color: "#3a5060", letterSpacing: "0.12em" }}>VIEW FULL DAY</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Nav — minimal, text only */}
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {["HOME", "PROFILE", "HABITS", "SYSTEM"].map((n, i) => (
            <div key={n} style={{
              fontSize: 9, color: i === 0 ? "#0ea5e9" : "#1e3040",
              letterSpacing: "0.12em", cursor: "pointer",
            }}>{n}</div>
          ))}
        </div>
      </div>

    </div>
  );
}

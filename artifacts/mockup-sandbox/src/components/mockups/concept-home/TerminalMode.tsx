// Concept: Command Terminal / System Console
// Information architecture: a system process log — past events are output lines,
// active mission is a running process, user "executes" the next command.
// Interaction model: read output, issue the next command.
// Hypothesis: for power-user / "hunter" personality types, the terminal metaphor
// creates stronger identity alignment with the RPG concept — you ARE running the system.

const BLINK_STYLE = `
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  .cursor { animation: blink 1.1s step-start infinite; }
  .scanline {
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.08) 2px,
      rgba(0,0,0,0.08) 4px
    );
    pointer-events: none;
  }
`;

function Line({ prefix, text, color = "#4ade80", dim = false }: {
  prefix: string; text: string; color?: string; dim?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, opacity: dim ? 0.45 : 1, marginBottom: 3 }}>
      <span style={{ color: "#1e4a30", flexShrink: 0, userSelect: "none" }}>{prefix}</span>
      <span style={{ color, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 6px" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(74,222,128,0.12)" }} />
      <span style={{ fontSize: 10, color: "#1e4a30", letterSpacing: "0.15em" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(74,222,128,0.12)" }} />
    </div>
  );
}

export function TerminalMode() {
  return (
    <div style={{
      background: "#010c06",
      minHeight: "100vh",
      fontFamily: "'Courier New', 'Lucida Console', monospace",
      color: "#4ade80",
      fontSize: 12,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      position: "relative",
    }}>
      <style>{BLINK_STYLE}</style>

      {/* Scanline overlay */}
      <div className="scanline" style={{
        position: "fixed", inset: 0, zIndex: 10,
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 430, padding: "16px 18px", position: "relative", zIndex: 1 }}>

        {/* ── Boot header ── */}
        <div style={{ marginBottom: 14, borderBottom: "1px solid rgba(74,222,128,0.12)", paddingBottom: 12 }}>
          <div style={{ color: "#86efac", fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 3 }}>
            ASCEND OS v2.0 // AWAKENED SYSTEM
          </div>
          <div style={{ color: "#166534", fontSize: 11 }}>
            USER: KL &nbsp;|&nbsp; SESSION: active &nbsp;|&nbsp; UPTIME: 00:00:01
          </div>
        </div>

        {/* ── System log — past ── */}
        <Divider label="SESSION LOG" />

        <Line prefix="[INFO]" text="System boot complete. Welcome back, KL." color="#4ade80" dim />
        <Line prefix="[LOAD]" text="Loading player profile... DONE" color="#4ade80" dim />
        <Line prefix="[STAT]" text="Level: 1  |  XP: 15/100  |  Rank: E" color="#86efac" dim />
        <Line prefix="[STAT]" text="Stability: 26/100 (STABILIZING)" color="#fbbf24" dim />

        <Divider label="COMPLETED PROCESSES" />

        <Line prefix="[DONE]" text="PROCESS calm_mind --duration=30s" color="#4ade80" dim />
        <Line prefix="[OUT]"  text="  +15 XP awarded. Sense attribute updated." color="#166534" dim />
        <Line prefix="[OUT]"  text="  Movement ability UNLOCKED." color="#22c55e" dim />
        <Line prefix="[OUT]"  text="  Quest progress: 1/4 ████░░░░ 25%" color="#166534" dim />

        <Divider label="ACTIVE PROCESS" />

        {/* Active process — highlighted */}
        <div style={{
          background: "rgba(74,222,128,0.06)",
          border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: 6,
          padding: "12px 12px",
          marginBottom: 10,
        }}>
          <Line prefix="[RUN]"  text="PROCESS agility.mobility_flow --step=2/4" color="#86efac" />
          <Line prefix="[ARG]"  text="  --reward=15xp --unlock=physical_circuit" color="#4ade80" />
          <Line prefix="[STAT]" text="  Status: READY  |  Step: 2 of 4" color="#a3e635" />
          <Line prefix="[NEXT]" text="  On completion: physical_circuit.unlock()" color="#4ade80" />
        </div>

        {/* Execute command */}
        <div style={{
          background: "rgba(74,222,128,0.04)",
          border: "1px solid rgba(74,222,128,0.15)",
          borderRadius: 6,
          padding: "10px 12px",
          marginBottom: 14,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: "#22c55e", userSelect: "none" }}>KL@system:~$</span>
          <span style={{ color: "#86efac" }}>execute agility.mission</span>
          <span className="cursor" style={{ color: "#4ade80" }}>█</span>
        </div>

        {/* Run button */}
        <button style={{
          width: "100%",
          padding: "14px",
          background: "transparent",
          border: "1px solid rgba(74,222,128,0.4)",
          borderRadius: 6,
          color: "#4ade80",
          fontSize: 13,
          fontFamily: "inherit",
          cursor: "pointer",
          letterSpacing: "0.08em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 14,
        }}>
          <span style={{ color: "#1e4a30" }}>▶</span>
          <span>RUN execute agility.mission --confirm</span>
          <span style={{ color: "#22c55e", fontSize: 11 }}>+15 XP</span>
        </button>

        {/* Queued */}
        <Divider label="QUEUED PROCESSES" />
        <Line prefix="[NEXT]" text="strength.power_training --priority=2" color="#3a6030" dim />
        <Line prefix="[NEXT]" text="vitality.recovery_stable --priority=3" color="#3a6030" dim />

        {/* Bottom nav as process list */}
        <div style={{
          borderTop: "1px solid rgba(74,222,128,0.1)",
          marginTop: 14, paddingTop: 10,
          display: "flex", justifyContent: "space-around",
        }}>
          {["HOME", "PROFILE", "HABITS", "SYSTEM"].map((n, i) => (
            <div key={n} style={{
              fontSize: 10, color: i === 0 ? "#4ade80" : "#1e4a30",
              letterSpacing: "0.1em", cursor: "pointer",
              borderBottom: i === 0 ? "1px solid #4ade80" : "none",
              paddingBottom: 2,
            }}>{n}</div>
          ))}
        </div>

      </div>
    </div>
  );
}

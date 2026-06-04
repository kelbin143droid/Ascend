// Concept: Radar / Stat Map
// Information architecture: your stat balance IS the home screen.
// A radar chart shows STR/AGI/SNS/VIT balance. Daily missions are framed as
// "extending a spoke". The current active spoke (Agility) glows.
// Interaction model: tap a spoke to work on that attribute, or tap the active one to begin.
// Hypothesis: visualising character balance as a shape creates a stronger mental model
// of personal growth — and makes the RPG stats feel meaningful, not decorative.

const W = 200;
const CX = W / 2;
const CY = W / 2;
const R = 70;
const MAX_VAL = 10;

function polarToXY(angle: number, radius: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

interface Stat { label: string; value: number; angle: number; color: string; active?: boolean; done?: boolean; }

const STATS: Stat[] = [
  { label: "SNS",  value: 1, angle: 0,   color: "#a78bfa", done: true  },
  { label: "AGI",  value: 1, angle: 90,  color: "#38bdf8", active: true },
  { label: "VIT",  value: 1, angle: 180, color: "#fb7185"               },
  { label: "STR",  value: 1, angle: 270, color: "#fb923c"               },
];

function RadarChart() {
  // Grid rings
  const rings = [2, 4, 6, 8, 10];

  // Polygon points for current stats
  const statPoints = STATS.map(s => {
    const r = (s.value / MAX_VAL) * R;
    return polarToXY(s.angle, r);
  });
  const polyStr = statPoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} style={{ overflow: "visible" }}>
      {/* Grid rings */}
      {rings.map(v => {
        const pts = STATS.map(s => {
          const r = (v / MAX_VAL) * R;
          const p = polarToXY(s.angle, r);
          return `${p.x},${p.y}`;
        }).join(" ");
        return (
          <polygon key={v} points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        );
      })}

      {/* Spokes */}
      {STATS.map(s => {
        const outer = polarToXY(s.angle, R + 10);
        return (
          <line key={s.label}
            x1={CX} y1={CY}
            x2={outer.x} y2={outer.y}
            stroke={s.active ? s.color : "rgba(255,255,255,0.07)"}
            strokeWidth={s.active ? 1.5 : 1}
            strokeDasharray={s.active ? "none" : "3,3"}
          />
        );
      })}

      {/* Filled stat area */}
      <polygon points={polyStr}
        fill="rgba(56,189,248,0.12)"
        stroke="rgba(56,189,248,0.4)"
        strokeWidth="1.5"
      />

      {/* Active spoke glow */}
      {STATS.filter(s => s.active).map(s => {
        const tip = polarToXY(s.angle, R + 10);
        const dotPos = polarToXY(s.angle, (s.value / MAX_VAL) * R);
        return (
          <g key={s.label + "-active"}>
            {/* Glowing line */}
            <line x1={CX} y1={CY} x2={tip.x} y2={tip.y}
              stroke={s.color} strokeWidth="2" opacity="0.5"
            />
            {/* Tip dot */}
            <circle cx={tip.x} cy={tip.y} r="5" fill={s.color} opacity="0.3" />
            <circle cx={tip.x} cy={tip.y} r="3" fill={s.color} />
            {/* Value dot */}
            <circle cx={dotPos.x} cy={dotPos.y} r="5" fill={s.color} opacity="0.5" />
            <circle cx={dotPos.x} cy={dotPos.y} r="3" fill={s.color} />
          </g>
        );
      })}

      {/* Done stat dots */}
      {STATS.filter(s => s.done && !s.active).map(s => {
        const dotPos = polarToXY(s.angle, (s.value / MAX_VAL) * R);
        return (
          <circle key={s.label + "-dot"} cx={dotPos.x} cy={dotPos.y} r="3"
            fill={s.color} opacity="0.7"
          />
        );
      })}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r="3" fill="rgba(255,255,255,0.2)" />

      {/* Axis labels */}
      {STATS.map(s => {
        const pos = polarToXY(s.angle, R + 22);
        return (
          <text key={s.label + "-txt"}
            x={pos.x} y={pos.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fontWeight="700"
            fill={s.active ? s.color : s.done ? s.color : "rgba(255,255,255,0.2)"}
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.08em" }}
          >{s.label}</text>
        );
      })}
    </svg>
  );
}

export function RadarMap() {
  return (
    <div style={{
      background: "#06101a",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#c8dde8",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px 10px",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#1e3040", textTransform: "uppercase", letterSpacing: "0.14em" }}>KL's System</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#94b8d0", letterSpacing: "-0.01em" }}>Character Balance</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#3d6070" }}>Level 1</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>15 / 100 XP</div>
          </div>
        </div>

        {/* ── Radar chart ── */}
        <div style={{
          display: "flex", justifyContent: "center",
          padding: "10px 0 0",
          position: "relative",
        }}>
          {/* Outer glow for active stat (AGI) */}
          <div style={{
            position: "absolute", right: "calc(50% - 100px)", top: "50%",
            width: 80, height: 80,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
            transform: "translateY(-50%)",
          }} />
          <RadarChart />
        </div>

        {/* ── Balance note ── */}
        <div style={{ textAlign: "center", padding: "6px 20px 14px" }}>
          <div style={{ fontSize: 12, color: "#1e3040" }}>
            All 4 attributes at <span style={{ color: "#5a8ca8" }}>1/10</span> · Early phase
          </div>
        </div>

        {/* ── Stat spoke cards — quick overview ── */}
        <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {STATS.map(s => (
            <div key={s.label} style={{
              background: s.active
                ? "rgba(56,189,248,0.09)"
                : s.done
                  ? "rgba(167,139,250,0.06)"
                  : "rgba(255,255,255,0.02)",
              border: s.active
                ? `1.5px solid rgba(56,189,248,0.3)`
                : s.done
                  ? "1px solid rgba(167,139,250,0.15)"
                  : "1px solid rgba(255,255,255,0.05)",
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 10,
              opacity: !s.active && !s.done ? 0.4 : 1,
              cursor: "pointer",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0,
                boxShadow: s.active ? `0 0 8px ${s.color}` : "none",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.active ? "#dce8f5" : "#4a6070" }}>
                  {s.label === "SNS" ? "Sense" : s.label === "AGI" ? "Agility" : s.label === "STR" ? "Strength" : "Vitality"}
                </div>
                <div style={{ fontSize: 10, color: "#1e3040", marginTop: 1 }}>
                  {s.active ? "In progress" : s.done ? "Complete ✓" : "Queued"}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>
                {s.value}<span style={{ fontSize: 10, color: "#1e3040" }}>/10</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Active mission — linked to the glowing spoke ── */}
        <div style={{ padding: "0 20px 0" }}>
          <div style={{ fontSize: 11, color: "#1e3040", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>
            Active spoke — extend AGI
          </div>
          <div style={{
            background: "rgba(56,189,248,0.07)",
            border: "1.5px solid rgba(56,189,248,0.25)",
            borderRadius: 14,
            padding: "16px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "rgba(56,189,248,0.15)",
                border: "1.5px solid rgba(56,189,248,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>⚡</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#dce8f5" }}>Agility · Mobility Flow</div>
                <div style={{ fontSize: 12, color: "#5a8ca8" }}>Step 2/4 · +15 XP · unlocks Physical Circuit</div>
              </div>
            </div>

            {/* Visual "spoke extension" metaphor */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
              background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 12px",
            }}>
              <div style={{ fontSize: 11, color: "#1e3040" }}>AGI</div>
              <div style={{ flex: 1, height: 6, background: "rgba(56,189,248,0.1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: "10%", height: "100%", background: "linear-gradient(90deg, #0ea5e9, #38bdf8)", borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color: "#3d6070" }}>1 → 2</div>
              <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>after mission</div>
            </div>

            <button style={{
              width: "100%", padding: "15px",
              background: "linear-gradient(135deg, #0284c7, #7c3aed)",
              border: "none", borderRadius: 12,
              color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              Extend AGI spoke — Begin mission
              <span style={{ opacity: 0.7 }}>→</span>
            </button>
          </div>
        </div>

        {/* ── Bottom nav ── */}
        <div style={{
          display: "flex", justifyContent: "space-around",
          padding: "16px 16px 20px",
          marginTop: 16,
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

// Concept: Void Orb — The World IS the UI
//
// UNDEREXPLORED AXIS: Every prior variant places UI cards on top of the game world.
// The background is always inert decoration. This variant asks: what if the
// environment itself carries all information, and there are no cards at all?
//
// The screen is a dark void. Your character's essence is an orb at the centre.
// The 4 daily missions orbit it as glowing nodes — their brightness/size reflects
// state (done, active, queued). Tapping the active node begins the mission.
// There is no nav bar, no stats section, no "Begin mission" button copy — just
// the world and the things in it.
//
// Hypothesis: when the UI IS the world, identity alignment with the RPG character
// is strongest, and completing missions feels like transforming your existence
// rather than checking off tasks.

import { useState } from "react";

const PULSE_STYLE = `
  @keyframes pulse-orb {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50%       { transform: scale(1.04); opacity: 1; }
  }
  @keyframes orbit {
    from { transform: rotate(0deg) translateX(var(--r)) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); }
  }
  @keyframes ring-pulse {
    0%, 100% { opacity: 0.12; transform: scale(1); }
    50%       { opacity: 0.22; transform: scale(1.02); }
  }
  @keyframes node-glow {
    0%, 100% { box-shadow: 0 0 8px 2px var(--glow); }
    50%       { box-shadow: 0 0 18px 6px var(--glow); }
  }
  .orb-pulse { animation: pulse-orb 3s ease-in-out infinite; }
  .ring-pulse { animation: ring-pulse 3s ease-in-out infinite; }
  .node-active { animation: node-glow 2s ease-in-out infinite; }
`;

interface OrbNode {
  id: string;
  label: string;
  sublabel: string;
  angle: number;
  radius: number;
  state: "done" | "active" | "queued";
  color: string;
  glow: string;
  icon: string;
  xp: string;
}

const NODES: OrbNode[] = [
  {
    id: "sns", label: "Calm Mind", sublabel: "Sense", angle: 315, radius: 110,
    state: "done", color: "#a78bfa", glow: "rgba(167,139,250,0.6)", icon: "○", xp: "+15 XP",
  },
  {
    id: "agi", label: "Agility", sublabel: "Step 2/4", angle: 45, radius: 110,
    state: "active", color: "#38bdf8", glow: "rgba(56,189,248,0.7)", icon: "⚡", xp: "+15 XP",
  },
  {
    id: "str", label: "Strength", sublabel: "Queued", angle: 135, radius: 110,
    state: "queued", color: "#fb923c", glow: "rgba(251,146,60,0.4)", icon: "◇", xp: "+12 XP",
  },
  {
    id: "vit", label: "Vitality", sublabel: "Final", angle: 225, radius: 110,
    state: "queued", color: "#fb7185", glow: "rgba(251,113,133,0.4)", icon: "♡", xp: "+8 XP",
  },
];

function degToRad(deg: number) { return (deg * Math.PI) / 180; }

export function VoidOrb() {
  const [selected, setSelected] = useState<string | null>(null);
  const activeNode = NODES.find(n => n.id === selected) ?? NODES.find(n => n.state === "active")!;

  const CX = 215; // centre of 430-wide viewport
  const CY = 210; // vertical centre of the orb area

  return (
    <div style={{
      background: "#03050a",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#c8dde8",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      overflow: "hidden",
    }}>
      <style>{PULSE_STYLE}</style>

      <div style={{ width: "100%", maxWidth: 430 }}>

        {/* ── Subtle identity strip ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px 0",
        }}>
          <div style={{ fontSize: 12, color: "#1e3040", letterSpacing: "0.12em" }}>KL · LEVEL 1</div>
          <div style={{ fontSize: 11, color: "#1e3040" }}>15 / 100 XP</div>
        </div>

        {/* ── Void space with orb + nodes ── */}
        <div style={{ position: "relative", height: 420, overflow: "visible" }}>

          {/* Deep space radial bg */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, rgba(14,165,233,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* ── Orbit rings ── */}
          {[90, 110, 130].map((r, i) => (
            <div key={r} className="ring-pulse" style={{
              position: "absolute",
              left: CX - r, top: CY - r,
              width: r * 2, height: r * 2,
              borderRadius: "50%",
              border: "1px solid rgba(14,165,233,0.08)",
              animationDelay: `${i * 0.4}s`,
            }} />
          ))}

          {/* ── Core orb — KL's essence ── */}
          <div className="orb-pulse" style={{
            position: "absolute",
            left: CX - 38, top: CY - 38,
            width: 76, height: 76,
          }}>
            {/* Outer glow layers */}
            {[80, 60, 44].map((s, i) => (
              <div key={s} style={{
                position: "absolute",
                left: -(s - 76) / 2, top: -(s - 76) / 2,
                width: s, height: s,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(14,165,233,${0.06 - i * 0.015}) 0%, transparent 70%)`,
              }} />
            ))}
            {/* Core */}
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #7dd3fc 0%, #0284c7 45%, #083344 100%)",
              boxShadow: "0 0 30px rgba(14,165,233,0.5), 0 0 60px rgba(14,165,233,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 900, color: "#fff",
            }}>K</div>
          </div>

          {/* ── Mission nodes ── */}
          {NODES.map(node => {
            const rad = degToRad(node.angle);
            const nx = CX + node.radius * Math.cos(rad);
            const ny = CY + node.radius * Math.sin(rad);
            const size = node.state === "done" ? 38 : node.state === "active" ? 50 : 34;
            const opacity = node.state === "queued" ? 0.3 : 1;
            const isSelected = selected === node.id;

            return (
              <div key={node.id}
                onClick={() => setSelected(node.id === selected ? null : node.id)}
                className={node.state === "active" ? "node-active" : ""}
                style={{
                  position: "absolute",
                  left: nx - size / 2, top: ny - size / 2,
                  width: size, height: size,
                  borderRadius: "50%",
                  background: node.state === "done"
                    ? `radial-gradient(circle, ${node.color}33 0%, transparent 70%)`
                    : node.state === "active"
                      ? `radial-gradient(circle, ${node.color}55 0%, ${node.color}11 70%)`
                      : "transparent",
                  border: `${node.state === "active" ? "2px" : "1.5px"} solid ${node.color}${node.state === "queued" ? "30" : node.state === "done" ? "60" : "cc"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: node.state === "active" ? 18 : 14,
                  color: node.color,
                  opacity,
                  cursor: node.state === "queued" ? "default" : "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  transform: isSelected ? "scale(1.15)" : "scale(1)",
                  // @ts-ignore
                  "--glow": node.glow,
                }}>
                {node.state === "done" ? "✓" : node.icon}
              </div>
            );
          })}

          {/* ── Connection lines from centre to nodes ── */}
          <svg style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            pointerEvents: "none",
          }}>
            {NODES.map(node => {
              const rad = degToRad(node.angle);
              const nx = CX + node.radius * Math.cos(rad);
              const ny = CY + node.radius * Math.sin(rad);
              return (
                <line key={node.id}
                  x1={CX} y1={CY} x2={nx} y2={ny}
                  stroke={node.state === "done" ? node.color : node.state === "active" ? node.color : "rgba(255,255,255,0.05)"}
                  strokeWidth={node.state === "active" ? "1.5" : "1"}
                  strokeDasharray={node.state === "queued" ? "3,4" : "none"}
                  opacity={node.state === "queued" ? 0.1 : node.state === "done" ? 0.3 : 0.5}
                />
              );
            })}
          </svg>

          {/* ── Node labels ── */}
          {NODES.map(node => {
            const rad = degToRad(node.angle);
            const lx = CX + (node.radius + 28) * Math.cos(rad);
            const ly = CY + (node.radius + 28) * Math.sin(rad);
            return (
              <div key={node.id + "-label"} style={{
                position: "absolute",
                left: lx - 32, top: ly - 16,
                width: 64, textAlign: "center",
                opacity: node.state === "queued" ? 0.2 : node.state === "done" ? 0.6 : 1,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: node.color, letterSpacing: "0.06em" }}>{node.sublabel === "Step 2/4" ? "AGILITY" : node.sublabel.toUpperCase()}</div>
                {node.state !== "queued" && (
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>{node.xp}</div>
                )}
              </div>
            );
          })}

        </div>

        {/* ── Info panel for active / selected node ── */}
        <div style={{ padding: "0 20px", marginTop: -20 }}>
          <div style={{
            background: "rgba(56,189,248,0.07)",
            border: "1px solid rgba(56,189,248,0.2)",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#dce8f5" }}>
                  {activeNode.label} — {activeNode.sublabel}
                </div>
                <div style={{ fontSize: 12, color: "#3a6070", marginTop: 2 }}>
                  {activeNode.state === "active" ? "Tap the ⚡ node above to begin" : "Complete · +15 XP earned"}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>{activeNode.xp}</div>
            </div>
            <button style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #0284c7, #7c3aed)",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
            }}>
              Begin Agility mission →
            </button>
          </div>
        </div>

        {/* ── Minimal bottom strip ── */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 36,
          padding: "16px 16px 20px", marginTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          {["HOME", "PROFILE", "HABITS", "SYSTEM"].map((n, i) => (
            <div key={n} style={{
              fontSize: 9, color: i === 0 ? "#38bdf8" : "#1e3040",
              letterSpacing: "0.12em", cursor: "pointer",
            }}>{n}</div>
          ))}
        </div>

      </div>
    </div>
  );
}

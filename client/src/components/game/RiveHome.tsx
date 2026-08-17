import { useRive } from "@rive-app/react-canvas";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";

// ─── Stat definitions ─────────────────────────────────────────────────────────
const STATS = {
  agility: {
    label: "Agility",
    icon: "⚡",
    title: "Speed & Reaction",
    description: "Train fast-twitch reflexes and movement efficiency. Best action: 20 min sprint intervals.",
  },
  focus: {
    label: "Focus",
    icon: "🎯",
    title: "Mental Clarity",
    description: "Sharpen concentration and eliminate cognitive fog. Best action: 10 min breathwork flow.",
  },
  physical: {
    label: "Physical",
    icon: "💪",
    title: "Raw Strength",
    description: "Build foundational power and muscle endurance. Best action: 30 min compound lifts.",
  },
  vitality: {
    label: "Vitality",
    icon: "❤️",
    title: "Recovery & Energy",
    description: "Restore cellular energy and sleep quality. Best action: 15 min restorative yoga.",
  },
  calm: {
    label: "Calm Mind",
    icon: "☯️",
    title: "Inner Balance",
    description: "Center your nervous system and reduce cortisol. Best action: 5 min guided meditation.",
  },
} as const;

type StatKey = keyof typeof STATS;

// ─── Nav tab definitions ───────────────────────────────────────────────────────
const NAV_TABS = [
  { id: "hero",      label: "Hero",      route: "/profile" },
  { id: "quest",     label: "Quest",     route: "/train" },
  { id: "command",   label: "Command",   route: "/mission-command" },
  { id: "gate",      label: "Gate",      route: "/dungeon" },
  { id: "inventory", label: "Inventory", route: "/inventory" },
] as const;

// ─── Overlay zone helper ───────────────────────────────────────────────────────
interface ZoneProps {
  left: string;
  top: string;
  width: string;
  height: string;
  label: string;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function Zone({ left, top, width, height, label, hovered, onEnter, onLeave, onClick }: ZoneProps) {
  return (
    <div
      aria-label={label}
      role="button"
      tabIndex={0}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        transform: `translate(-50%, -50%) scale(${hovered ? 1.06 : 1})`,
        cursor: "pointer",
        borderRadius: "50%",
        background: hovered ? "rgba(100,220,255,0.10)" : "transparent",
        boxShadow: hovered ? "0 0 18px 4px rgba(100,220,255,0.25)" : "none",
        transition: "transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease",
        zIndex: 10,
        WebkitTapHighlightColor: "transparent",
        outline: "none",
      }}
    />
  );
}

// ─── Info card ────────────────────────────────────────────────────────────────
function InfoCard({ stat, onClose }: { stat: StatKey; onClose: () => void }) {
  const s = STATS[stat];
  return (
    <div
      style={{
        position: "absolute",
        bottom: "13%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "82%",
        background: "linear-gradient(135deg, rgba(5,20,40,0.92) 0%, rgba(0,40,60,0.92) 100%)",
        border: "1px solid rgba(100,220,255,0.35)",
        borderRadius: 16,
        padding: "14px 18px",
        color: "#e0f6ff",
        zIndex: 20,
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 32px rgba(0,180,255,0.18)",
        animation: "fadeSlideUp 0.22s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>{s.icon}</span>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "rgba(100,220,255,0.7)", textTransform: "uppercase" }}>
            Next Best Action · {s.label}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#7df5ff" }}>{s.title}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "rgba(200,240,255,0.5)", fontSize: 18, cursor: "pointer", lineHeight: 1,
          }}
        >×</button>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(200,240,255,0.8)", lineHeight: 1.5 }}>
        {s.description}
      </p>
      <button
        style={{
          marginTop: 12, width: "100%", padding: "9px 0",
          background: "linear-gradient(90deg, #0af 0%, #07e 100%)",
          border: "none", borderRadius: 10, color: "#fff",
          fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1,
        }}
        onClick={() => console.log("Start session →", stat)}
      >
        START SESSION
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function RiveHome() {
  const [, navigate] = useLocation();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatKey | null>(null);

  const { RiveComponent } = useRive({
    src: "/rive/ascend2.riv",
    autoplay: true,
  });

  const hover = useCallback((id: string) => setHoveredZone(id), []);
  const unhover = useCallback(() => setHoveredZone(null), []);

  const handleStatClick = (stat: StatKey) => {
    setSelectedStat((prev) => (prev === stat ? null : stat));
    console.log("Stat selected:", stat);
  };

  const handleStart = () => {
    console.log("START SESSION tapped");
    // Dismiss any open card and let the Rive animation handle the transition
    setSelectedStat(null);
  };

  return (
    <>
      {/* Keyframe for info card entrance */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100dvh",
          backgroundColor: "#000",
          overflow: "hidden",
        }}
      >
        {/* Canvas + overlay wrapper */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 390,
            height: "100%",
            maxHeight: 844,
          }}
        >
          {/* ── Rive canvas ── */}
          <RiveComponent
            style={{ width: "100%", height: "100%", display: "block" }}
          />

          {/* ── Overlay zones ── */}

          {/* Top icon – Agility (lightning bolt, top-center) */}
          <Zone
            left="50%" top="13%"
            width="18%" height="11%"
            label="Agility"
            hovered={hoveredZone === "agility"}
            onEnter={() => hover("agility")}
            onLeave={unhover}
            onClick={() => handleStatClick("agility")}
          />

          {/* Center of rune ring – Calm Mind chakra */}
          <Zone
            left="50%" top="57%"
            width="30%" height="22%"
            label="Calm Mind"
            hovered={hoveredZone === "calm"}
            onEnter={() => hover("calm")}
            onLeave={unhover}
            onClick={() => handleStatClick("calm")}
          />

          {/* Left diamond on ring – Focus */}
          <Zone
            left="9%" top="57%"
            width="14%" height="10%"
            label="Focus"
            hovered={hoveredZone === "focus"}
            onEnter={() => hover("focus")}
            onLeave={unhover}
            onClick={() => handleStatClick("focus")}
          />

          {/* Right diamond on ring – Physical */}
          <Zone
            left="91%" top="57%"
            width="14%" height="10%"
            label="Physical"
            hovered={hoveredZone === "physical"}
            onEnter={() => hover("physical")}
            onLeave={unhover}
            onClick={() => handleStatClick("physical")}
          />

          {/* Bottom – Vitality (lower portion of ring or below center) */}
          <Zone
            left="50%" top="78%"
            width="18%" height="10%"
            label="Vitality"
            hovered={hoveredZone === "vitality"}
            onEnter={() => hover("vitality")}
            onLeave={unhover}
            onClick={() => handleStatClick("vitality")}
          />

          {/* START / Tap to Begin button */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleStart}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            aria-label="Start"
            style={{
              position: "absolute",
              left: "50%",
              top: "90%",
              transform: `translate(-50%, -50%) scale(${hoveredZone === "start" ? 1.04 : 1})`,
              width: "72%",
              height: "8%",
              cursor: "pointer",
              borderRadius: 14,
              background: hoveredZone === "start" ? "rgba(100,220,255,0.08)" : "transparent",
              transition: "transform 0.18s ease, background 0.18s ease",
              zIndex: 10,
              WebkitTapHighlightColor: "transparent",
              outline: "none",
            }}
            onMouseEnter={() => hover("start")}
            onMouseLeave={unhover}
          />

          {/* Bottom navigation tabs */}
          {NAV_TABS.map((tab, i) => {
            const leftPct = `${10 + i * 20}%`;
            const isHovered = hoveredZone === tab.id;
            return (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                aria-label={tab.label}
                onClick={() => navigate(tab.route)}
                onKeyDown={(e) => e.key === "Enter" && navigate(tab.route)}
                onMouseEnter={() => hover(tab.id)}
                onMouseLeave={unhover}
                style={{
                  position: "absolute",
                  left: leftPct,
                  top: "96%",
                  transform: `translate(-50%, -50%) scale(${isHovered ? 1.08 : 1})`,
                  width: "18%",
                  height: "8%",
                  cursor: "pointer",
                  borderRadius: 10,
                  background: isHovered ? "rgba(100,220,255,0.10)" : "transparent",
                  transition: "transform 0.15s ease, background 0.15s ease",
                  zIndex: 10,
                  WebkitTapHighlightColor: "transparent",
                  outline: "none",
                }}
              />
            );
          })}

          {/* Dynamic info card */}
          {selectedStat && (
            <InfoCard stat={selectedStat} onClose={() => setSelectedStat(null)} />
          )}
        </div>
      </div>
    </>
  );
}

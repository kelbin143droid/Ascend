import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Brain,
  Dumbbell,
  Leaf,
  BookOpen,
  Lock,
  Info,
} from "lucide-react";
import { SystemLayout } from "@/components/game/SystemLayout";

// ── Types ────────────────────────────────────────────────────────────────────
type StatId = "sense" | "strength" | "vitality" | "intelligence";

interface HomeData {
  nextAction: {
    name: string;
    stat: string;
    durationMinutes: number;
    habitId?: string;
  } | null;
  todaysFocus: string;
  completedToday: number;
  totalActive: number;
}

// ── Stat config ───────────────────────────────────────────────────────────────
const STAT_CONFIG = [
  {
    id: "sense" as StatId,
    label: "MIND",
    color: "#60a5fa",
    borderColor: "#93c5fd",
    glowColor: "rgba(96,165,250,0.65)",
    orbGradient: "radial-gradient(circle at 38% 32%, #bfdbfe 0%, #3b82f6 45%, #1e3a8a 100%)",
    position: "top" as const,
    sessionRoute: "/guided-session/phase1_meditation",
    Icon: Brain,
  },
  {
    id: "intelligence" as StatId,
    label: "KNOW",
    color: "#f59e0b",
    borderColor: "#fcd34d",
    glowColor: "rgba(245,158,11,0.65)",
    orbGradient: "radial-gradient(circle at 38% 32%, #fef3c7 0%, #d97706 45%, #78350f 100%)",
    position: "left" as const,
    sessionRoute: "/train",
    Icon: BookOpen,
  },
  {
    id: "strength" as StatId,
    label: "BODY",
    color: "#ef4444",
    borderColor: "#fca5a5",
    glowColor: "rgba(239,68,68,0.65)",
    orbGradient: "radial-gradient(circle at 38% 32%, #fee2e2 0%, #dc2626 45%, #7f1d1d 100%)",
    position: "right" as const,
    sessionRoute: "/train",
    Icon: Dumbbell,
  },
  {
    id: "vitality" as StatId,
    label: "SPIRIT",
    color: "#22c55e",
    borderColor: "#86efac",
    glowColor: "rgba(34,197,94,0.65)",
    orbGradient: "radial-gradient(circle at 38% 32%, #dcfce7 0%, #16a34a 45%, #14532d 100%)",
    position: "bottom" as const,
    sessionRoute: "/train",
    Icon: Leaf,
  },
] as const;

// ── Meditation silhouette SVG ─────────────────────────────────────────────────
function MeditationSilhouette({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      {/* Aura */}
      <ellipse cx="22" cy="32" rx="13" ry="5" fill="rgba(96,165,250,0.18)" />
      {/* Head */}
      <circle cx="22" cy="9" r="4.5" fill="rgba(186,230,253,0.92)" />
      {/* Torso */}
      <path
        d="M14 28 Q14 20 22 20 Q30 20 30 28 L28 32 Q22 34 16 32 Z"
        fill="rgba(147,197,253,0.88)"
      />
      {/* Arms */}
      <path d="M14 26 Q10 27 10 30 Q13 29 15 28" fill="rgba(147,197,253,0.88)" />
      <path d="M30 26 Q34 27 34 30 Q31 29 29 28" fill="rgba(147,197,253,0.88)" />
      {/* Crossed legs */}
      <path
        d="M16 32 Q14 36 18 37 Q22 36 26 37 Q30 36 28 32 Q24 34 22 33.5 Q20 34 16 32Z"
        fill="rgba(96,165,250,0.82)"
      />
      {/* Lotus petals */}
      <ellipse cx="22" cy="38" rx="9" ry="2.5" fill="rgba(59,130,246,0.3)" />
      <ellipse
        cx="15"
        cy="36"
        rx="4.5"
        ry="1.8"
        fill="rgba(59,130,246,0.22)"
        transform="rotate(-22 15 36)"
      />
      <ellipse
        cx="29"
        cy="36"
        rx="4.5"
        ry="1.8"
        fill="rgba(59,130,246,0.22)"
        transform="rotate(22 29 36)"
      />
    </svg>
  );
}

// ── Wheel SVG ────────────────────────────────────────────────────────────────
const WHEEL_R = 118; // ring radius
const ORB_R = 33;   // orb circle radius
const PAD = 12;     // edge padding so orbs aren't clipped
const SVG_HALF = WHEEL_R + ORB_R + PAD;
const SVG_SIZE = SVG_HALF * 2;
const CX = SVG_HALF;
const CY = SVG_HALF;

// Cardinal orb centres (absolute SVG coords)
const ORB_POS: Record<"top" | "left" | "right" | "bottom", { x: number; y: number }> = {
  top:    { x: CX,               y: CY - WHEEL_R },
  left:   { x: CX - WHEEL_R,     y: CY },
  right:  { x: CX + WHEEL_R,     y: CY },
  bottom: { x: CX,               y: CY + WHEEL_R },
};

function WheelDecorSVG({ selected }: { selected: StatId }) {
  return (
    <svg
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      aria-hidden
    >
      <defs>
        {/* Outer ring gold gradient */}
        <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c" />
          <stop offset="50%" stopColor="#f5d078" />
          <stop offset="100%" stopColor="#8b6914" />
        </linearGradient>

        {/* Center orb gradient */}
        <radialGradient id="centerOrbGrad" cx="38%" cy="33%" r="62%">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.95" />
          <stop offset="42%" stopColor="#2563eb" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.7" />
        </radialGradient>

        {/* Outer glow filter */}
        <filter id="blueGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Orb gradients */}
        {STAT_CONFIG.map((s) => (
          <radialGradient key={s.id} id={`orb-${s.id}`} cx="38%" cy="33%" r="62%">
            <stop offset="0%" stopColor={s.borderColor} stopOpacity="0.95" />
            <stop offset="48%" stopColor={s.color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.25" />
          </radialGradient>
        ))}
      </defs>

      {/* ── Background circle glow ── */}
      <circle cx={CX} cy={CY} r={WHEEL_R + 20} fill="#1e3a8a" fillOpacity="0.06" />

      {/* ── Inner decorative ring ── */}
      <circle
        cx={CX} cy={CY} r={WHEEL_R * 0.64}
        fill="none" stroke="#8b6914" strokeWidth="1.2" strokeOpacity="0.45"
      />

      {/* ── Cross spokes (from centre to each orb) ── */}
      {(["top", "left", "right", "bottom"] as const).map((pos) => {
        const p = ORB_POS[pos];
        return (
          <line
            key={pos}
            x1={CX} y1={CY} x2={p.x} y2={p.y}
            stroke="#8b6914" strokeWidth="1.4" strokeOpacity="0.38"
          />
        );
      })}

      {/* ── Diagonal cross lines connecting orb pairs ── */}
      <line x1={ORB_POS.top.x} y1={ORB_POS.top.y} x2={ORB_POS.right.x} y2={ORB_POS.right.y}
        stroke="#8b6914" strokeWidth="0.9" strokeOpacity="0.22" />
      <line x1={ORB_POS.right.x} y1={ORB_POS.right.y} x2={ORB_POS.bottom.x} y2={ORB_POS.bottom.y}
        stroke="#8b6914" strokeWidth="0.9" strokeOpacity="0.22" />
      <line x1={ORB_POS.bottom.x} y1={ORB_POS.bottom.y} x2={ORB_POS.left.x} y2={ORB_POS.left.y}
        stroke="#8b6914" strokeWidth="0.9" strokeOpacity="0.22" />
      <line x1={ORB_POS.left.x} y1={ORB_POS.left.y} x2={ORB_POS.top.x} y2={ORB_POS.top.y}
        stroke="#8b6914" strokeWidth="0.9" strokeOpacity="0.22" />

      {/* ── Outer ring ── */}
      <circle
        cx={CX} cy={CY} r={WHEEL_R}
        fill="none" stroke="url(#ringGold)" strokeWidth="2.8"
      />

      {/* ── Diamond accents on the ring at cardinal points ── */}
      {([
        { angle: -90, pos: "top" },
        { angle: 0,   pos: "right" },
        { angle: 90,  pos: "bottom" },
        { angle: 180, pos: "left" },
      ] as const).map(({ angle, pos }) => {
        const rad = (angle * Math.PI) / 180;
        const dx = CX + WHEEL_R * Math.cos(rad);
        const dy = CY + WHEEL_R * Math.sin(rad);
        const stat = STAT_CONFIG.find((s) => s.position === pos);
        const isActive = selected === stat?.id;
        return (
          <polygon
            key={angle}
            points={`${dx},${dy - 8} ${dx + 5.5},${dy} ${dx},${dy + 8} ${dx - 5.5},${dy}`}
            fill={isActive ? stat!.borderColor : "#c9a84c"}
            fillOpacity={isActive ? 1 : 0.85}
          />
        );
      })}

      {/* ── Center orb outer glow ── */}
      <circle cx={CX} cy={CY} r={56} fill="#2563eb" fillOpacity="0.18" filter="url(#blueGlow)" />

      {/* ── Center orb ── */}
      <circle cx={CX} cy={CY} r={50} fill="url(#centerOrbGrad)" />
      <circle cx={CX} cy={CY} r={50} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeOpacity="0.75" />
      <circle cx={CX} cy={CY} r={50} fill="none" stroke="#93c5fd" strokeWidth="0.8" strokeOpacity="0.4" />
      {/* Center orb shine */}
      <ellipse cx={CX - 14} cy={CY - 16} rx={14} ry={9} fill="white" fillOpacity="0.18" />

      {/* ── Stat orbs ── */}
      {STAT_CONFIG.map((stat) => {
        const { x, y } = ORB_POS[stat.position];
        const isSelected = selected === stat.id;
        return (
          <g key={stat.id}>
            {/* Selected glow ring */}
            {isSelected && (
              <circle
                cx={x} cy={y} r={ORB_R + 12}
                fill={stat.color} fillOpacity="0.12"
                filter="url(#softGlow)"
              />
            )}
            {/* Outer gold frame */}
            <circle
              cx={x} cy={y} r={ORB_R + 5}
              fill="none"
              stroke={isSelected ? stat.borderColor : "#c9a84c"}
              strokeWidth={isSelected ? "2.5" : "1.8"}
              strokeOpacity={isSelected ? 1 : 0.72}
            />
            {/* Dark base */}
            <circle cx={x} cy={y} r={ORB_R} fill="#040e1e" />
            {/* Orb colour fill */}
            <circle cx={x} cy={y} r={ORB_R} fill={`url(#orb-${stat.id})`} />
            {/* Shine highlight */}
            <ellipse
              cx={x - ORB_R * 0.26} cy={y - ORB_R * 0.26}
              rx={ORB_R * 0.38} ry={ORB_R * 0.22}
              fill="white" fillOpacity="0.22"
            />
          </g>
        );
      })}
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MissionCommandPage() {
  const { player } = useGame();
  const [, navigate] = useLocation();
  const [selectedStat, setSelectedStat] = useState<StatId>("sense");
  const [startHovered, setStartHovered] = useState(false);

  const { data: homeData } = useQuery<HomeData>({
    queryKey: ["/api/player", player?.id, "home"],
    queryFn: async () => {
      const res = await fetch(`/api/player/${player!.id}/home`);
      if (!res.ok) throw new Error("Failed to fetch home data");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30_000,
  });

  const activeStat = STAT_CONFIG.find((s) => s.id === selectedStat)!;

  // Progress bar segments
  const totalSegs = Math.max(homeData?.totalActive ?? 6, 6);
  const completedSegs = Math.min(homeData?.completedToday ?? 0, totalSegs);

  // Next action label
  const nextStat = homeData?.nextAction?.stat?.toUpperCase() ?? "MIND";
  const nextName = homeData?.nextAction?.name ?? "Improve focus and clarity";
  const nextActionText = homeData?.nextAction
    ? `${nextStat}: ${nextName}`
    : "MIND: Improve focus and clarity";

  const handleStart = () => {
    if (selectedStat === "sense") {
      navigate("/guided-session/phase1_meditation");
    } else {
      navigate("/train");
    }
  };

  // Positions of the 4 orb interaction zones (% of SVG container)
  // The SVG is SVG_SIZE × SVG_SIZE, centred in its container
  const orbZoneSize = (ORB_R + 5) * 2; // touch target = orb + frame diameter
  const svgContainerSize = Math.min(SVG_SIZE, 340); // cap on small screens
  const scale = svgContainerSize / SVG_SIZE;

  const orbZones = STAT_CONFIG.map((stat) => {
    const { x, y } = ORB_POS[stat.position];
    return {
      stat: stat.id,
      left: (x - ORB_R - 5) * scale,
      top:  (y - ORB_R - 5) * scale,
      size: orbZoneSize * scale,
    };
  });

  return (
    <SystemLayout>
      {/* Full-screen overlay so we own the entire viewport */}
      <div
        className="fixed inset-0 z-20 flex flex-col overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 85% 55% at 50% -5%, #0d2040 0%, #050f20 55%, #020810 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1 shrink-0">
          <div className="w-8" />
          <h1
            className="text-[13px] font-black tracking-[0.3em] uppercase"
            style={{
              color: "#c9a84c",
              textShadow:
                "0 0 18px rgba(201,168,76,0.55), 0 1px 0 rgba(0,0,0,0.6)",
            }}
          >
            MISSION COMMAND
          </h1>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)" }}
            aria-label="Info"
          >
            <Info size={13} className="text-white/40" />
          </button>
        </div>

        {/* ── Daily progress bar ────────────────────────────────────────── */}
        <div className="px-5 pb-2 shrink-0">
          <p
            className="text-center text-[9px] font-black tracking-[0.38em] mb-2"
            style={{ color: "#38bdf8" }}
          >
            DAILY PROGRESS
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-[3px]">
              {Array.from({ length: totalSegs }).map((_, i) => (
                <motion.div
                  key={i}
                  className="flex-1 h-[9px] rounded-[2px]"
                  initial={false}
                  animate={{
                    background:
                      i < completedSegs
                        ? "linear-gradient(180deg,#67e8f9 0%,#0891b2 100%)"
                        : "rgba(255,255,255,0.07)",
                    boxShadow:
                      i < completedSegs
                        ? "0 0 7px rgba(103,232,249,0.5)"
                        : "none",
                  }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                />
              ))}
            </div>
            {/* Treasure chest */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
              style={{
                background: "radial-gradient(circle at 40% 35%, #fbbf24, #92400e)",
                border: "2px solid #c9a84c",
                boxShadow: "0 0 10px rgba(201,168,76,0.32)",
              }}
            >
              🏆
            </div>
          </div>
        </div>

        {/* ── Wheel + orbs ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
          {/* SVG wheel decoration + orb fills */}
          <div
            className="relative shrink-0"
            style={{ width: svgContainerSize, height: svgContainerSize }}
          >
            <WheelDecorSVG selected={selectedStat} />

            {/* Transparent click zones over each orb */}
            {orbZones.map((zone) => {
              const statCfg = STAT_CONFIG.find((s) => s.id === zone.stat)!;
              const IconComp = statCfg.Icon;
              const isSelected = selectedStat === zone.stat;
              return (
                <motion.div
                  key={zone.stat}
                  className="absolute flex flex-col items-center justify-center cursor-pointer select-none"
                  style={{
                    left: zone.left,
                    top: zone.top,
                    width: zone.size,
                    height: zone.size,
                  }}
                  animate={{ scale: isSelected ? 1.14 : 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                  onClick={() => setSelectedStat(zone.stat as StatId)}
                  role="button"
                  aria-label={`Select ${statCfg.label}`}
                  aria-pressed={isSelected}
                >
                  <IconComp
                    size={20}
                    style={{
                      color: statCfg.color,
                      filter: isSelected
                        ? `drop-shadow(0 0 7px ${statCfg.color})`
                        : "none",
                      transition: "filter 0.2s",
                    }}
                  />
                  <span
                    className="text-[7px] font-black tracking-[0.14em] mt-0.5"
                    style={{
                      color: isSelected ? statCfg.color : "rgba(255,255,255,0.5)",
                      transition: "color 0.2s",
                    }}
                  >
                    {statCfg.label}
                  </span>
                </motion.div>
              );
            })}

            {/* Centre meditation figure */}
            <div
              className="absolute pointer-events-none flex items-center justify-center"
              style={{
                left: CX * scale - 24,
                top:  CY * scale - 28,
                width: 48,
                height: 56,
              }}
            >
              <MeditationSilhouette size={48} />
            </div>
          </div>

          {/* Locked orb below wheel */}
          <motion.div
            className="mt-2 w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "radial-gradient(circle at 40% 35%, rgba(139,92,246,0.35), rgba(30,10,60,0.75))",
              border: "2px solid rgba(139,92,246,0.32)",
              boxShadow: "0 0 12px rgba(109,40,217,0.18)",
            }}
          >
            <Lock size={13} style={{ color: "rgba(167,139,250,0.55)" }} />
          </motion.div>
        </div>

        {/* ── Next Best Action card ─────────────────────────────────────── */}
        <div className="px-4 pb-2 shrink-0">
          <motion.div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background:
                "linear-gradient(135deg, rgba(13,28,58,0.96) 0%, rgba(6,15,35,0.97) 100%)",
              border: "1px solid rgba(201,168,76,0.28)",
              boxShadow:
                "0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
            layout
          >
            {/* Mini avatar orb */}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "radial-gradient(circle at 40% 35%, #3b82f6, #1e3a8a)",
                border: "2px solid #60a5fa",
                boxShadow: "0 0 12px rgba(96,165,250,0.3)",
              }}
            >
              <MeditationSilhouette size={28} />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-[8.5px] font-black tracking-[0.26em] mb-0.5 uppercase"
                style={{ color: "#38bdf8" }}
              >
                Next Best Action
              </p>
              <p className="text-[13px] font-bold text-white leading-snug">
                {nextActionText}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── START button ──────────────────────────────────────────────── */}
        <div className="px-4 pb-[84px] shrink-0">
          <motion.button
            className="w-full h-[54px] rounded-2xl relative overflow-hidden flex items-center justify-center"
            style={{
              background:
                "linear-gradient(180deg, #1d56cf 0%, #1040ae 50%, #0c348a 100%)",
              border: `2px solid ${startHovered ? "#93c5fd" : "#4a82d9"}`,
              boxShadow: startHovered
                ? "0 0 44px rgba(74,130,217,0.75), 0 0 90px rgba(74,130,217,0.28), inset 0 1px 0 rgba(255,255,255,0.22)"
                : "0 0 22px rgba(74,130,217,0.38), inset 0 1px 0 rgba(255,255,255,0.10)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            animate={{ scale: startHovered ? 1.025 : 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            onPointerEnter={() => setStartHovered(true)}
            onPointerLeave={() => setStartHovered(false)}
            onClick={handleStart}
            aria-label={`Start ${activeStat.label} session`}
          >
            {/* Shine */}
            <span className="absolute inset-x-6 top-1.5 h-3 rounded-full bg-white/10 blur-sm pointer-events-none" />
            {/* Gold top line */}
            <span
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent 5%, #c9a84c 30%, #f5d078 50%, #c9a84c 70%, transparent 95%)",
              }}
            />
            {/* Gold bottom line */}
            <span
              className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent 10%, #8b6914 40%, #c9a84c 50%, #8b6914 60%, transparent 90%)",
              }}
            />

            <span
              className="relative z-10 text-[16px] font-black tracking-[0.28em] text-white uppercase"
              style={{
                textShadow: startHovered
                  ? "0 0 24px rgba(255,255,255,0.7)"
                  : "0 0 12px rgba(255,255,255,0.3)",
                transition: "text-shadow 0.2s",
              }}
            >
              START
            </span>
          </motion.button>
        </div>
      </div>
    </SystemLayout>
  );
}

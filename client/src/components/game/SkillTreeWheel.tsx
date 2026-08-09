import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, BookOpen, Heart, Shield, Zap, Lock, CheckCircle2,
  Compass, Leaf, Moon, Droplets, Target, Swords, Wind, Lightbulb,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type IC = React.ComponentType<{ size?: number; style?: React.CSSProperties }>;

interface LeafDef {
  leafId: string;
  label: string;
  sub: string;
  Icon: IC;
  isLocked: boolean;
  cardId: string | null;   // maps to DASH_CARDS.id in Day6Home
  pos: { x: number; y: number }; // % of canvas (x=left, y=top)
}

interface StatDef {
  nodeId: string;
  label: string;
  labelShort: string;
  Icon: IC;
  color: string;
  pos: { x: number; y: number };
  leaves: LeafDef[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
// All positions are percentages of the canvas container (width × height).
// Canvas height is fixed at CANVAS_H px; width fills parent.
// Pentagon layout: MIND top, VITALITY top-right, AGILITY bot-right,
//                 STRENGTH bot-left, INTEL top-left.
// ─────────────────────────────────────────────────────────────────────────────

export const CANVAS_H = 340; // px — exported so parent can size the zone

const HERO = { x: 50, y: 50 } as const;

const STAT_NODES: StatDef[] = [
  {
    nodeId: "mind", label: "MIND", labelShort: "MIND",
    Icon: Brain, color: "#38bdf8",
    pos: { x: 50, y: 19 },
    leaves: [
      { leafId: "calm",     label: "Calm Mind",  sub: "Breathing", Icon: Leaf,    isLocked: false, cardId: "calm",         pos: { x: 27, y: 7  } },
      { leafId: "focus-s",  label: "Focus",       sub: "Session",   Icon: Target,  isLocked: true,  cardId: null,           pos: { x: 50, y: 5  } },
      { leafId: "reflect",  label: "Reflect",     sub: "Journal",   Icon: Moon,    isLocked: true,  cardId: null,           pos: { x: 73, y: 7  } },
    ],
  },
  {
    nodeId: "vitality", label: "VITALITY", labelShort: "VIT",
    Icon: Heart, color: "#4ade80",
    pos: { x: 83, y: 38 },
    leaves: [
      { leafId: "sleep",     label: "Sleep Log",  sub: "Recovery", Icon: Moon,     isLocked: false, cardId: "vitality",     pos: { x: 93, y: 23 } },
      { leafId: "hydrate",   label: "Hydration",  sub: "Water",    Icon: Droplets, isLocked: true,  cardId: null,           pos: { x: 96, y: 40 } },
      { leafId: "nutrition", label: "Nutrition",  sub: "Fuel",     Icon: Leaf,     isLocked: true,  cardId: null,           pos: { x: 93, y: 56 } },
    ],
  },
  {
    nodeId: "agility", label: "AGILITY", labelShort: "AGI",
    Icon: Zap, color: "#fb923c",
    pos: { x: 72, y: 77 },
    leaves: [
      { leafId: "mobility", label: "Mobility",   sub: "Movement", Icon: Wind,  isLocked: false, cardId: "agility",    pos: { x: 87, y: 88 } },
      { leafId: "speed",    label: "Speed",       sub: "Sprint",   Icon: Zap,   isLocked: true,  cardId: null,         pos: { x: 67, y: 92 } },
    ],
  },
  {
    nodeId: "strength", label: "STRENGTH", labelShort: "STR",
    Icon: Shield, color: "#f87171",
    pos: { x: 28, y: 77 },
    leaves: [
      { leafId: "training",  label: "Training",  sub: "Circuit",  Icon: Swords, isLocked: false, cardId: "strength",   pos: { x: 33, y: 92 } },
      { leafId: "endurance", label: "Endurance", sub: "Stamina",  Icon: Shield, isLocked: true,  cardId: null,         pos: { x: 13, y: 88 } },
    ],
  },
  {
    nodeId: "intel", label: "INTELLIGENCE", labelShort: "INT",
    Icon: BookOpen, color: "#c084fc",
    pos: { x: 17, y: 38 },
    leaves: [
      { leafId: "read",     label: "Daily Read", sub: "Intel",   Icon: BookOpen,  isLocked: false, cardId: "intelligence", pos: { x: 7,  y: 23 } },
      { leafId: "learning", label: "Learning",   sub: "Course",  Icon: Lightbulb, isLocked: true,  cardId: null,           pos: { x: 4,  y: 40 } },
      { leafId: "strategy", label: "Strategy",   sub: "Chess",   Icon: Target,    isLocked: true,  cardId: null,           pos: { x: 7,  y: 56 } },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  cardIsDone: (cardId: string) => boolean;
  featuredCardId: string | null;
  allDone: boolean;
  /** Called when user taps an unlocked leaf node */
  onLeafSelect: (cardId: string) => void;
  playerName: string;
  playerLevel: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SkillTreeWheel({ cardIsDone, featuredCardId, allDone, onLeafSelect, playerName, playerLevel }: Props) {
  const [expandedStat, setExpandedStat] = useState<string | null>(null);

  const handleStatTap = (nodeId: string) => {
    setExpandedStat(prev => prev === nodeId ? null : nodeId);
  };

  const handleLeafTap = (leaf: LeafDef) => {
    if (leaf.isLocked || !leaf.cardId) return;
    onLeafSelect(leaf.cardId);
  };

  return (
    <div className="relative w-full" style={{ height: CANVAS_H }}>
      {/* ── SVG layer: gold connecting lines ────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Subtle glow filter for active spokes */}
        <defs>
          <filter id="spoke-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Hero → each stat node spoke */}
        {STAT_NODES.map((stat, i) => {
          const isExpanded = expandedStat === stat.nodeId;
          return (
            <motion.line
              key={`h-${stat.nodeId}`}
              x1={HERO.x} y1={HERO.y}
              x2={stat.pos.x} y2={stat.pos.y}
              stroke={isExpanded ? stat.color : "rgba(205,162,55,0.55)"}
              strokeWidth={isExpanded ? 0.55 : 0.42}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, stroke: isExpanded ? stat.color : "rgba(205,162,55,0.55)" }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              filter={isExpanded ? "url(#spoke-glow)" : undefined}
            />
          );
        })}

        {/* Stat → leaf lines — draw-in animation */}
        {STAT_NODES.map(stat => (
          <AnimatePresence key={`llines-${stat.nodeId}`}>
            {expandedStat === stat.nodeId && stat.leaves.map((leaf, li) => (
              <motion.path
                key={leaf.leafId}
                d={`M ${stat.pos.x},${stat.pos.y} L ${leaf.pos.x},${leaf.pos.y}`}
                stroke={leaf.isLocked ? "rgba(205,162,55,0.35)" : stat.color + "88"}
                strokeWidth="0.38"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut", delay: li * 0.05 }}
              />
            ))}
          </AnimatePresence>
        ))}
      </svg>

      {/* ── Hero center medallion ────────────────────────────────────────── */}
      <div
        className="absolute flex flex-col items-center justify-center rounded-full"
        style={{
          left: `${HERO.x}%`, top: `${HERO.y}%`,
          transform: "translate(-50%, -50%)",
          width: 66, height: 66,
          background: "radial-gradient(circle at 38% 32%, rgba(140,100,220,0.24) 0%, rgba(4,6,22,0.98) 68%)",
          border: "2.5px solid rgba(195,152,52,0.92)",
          boxShadow: "0 0 0 1px rgba(195,152,52,0.18), 0 0 28px rgba(195,152,52,0.38), inset 0 0 22px rgba(0,0,0,0.72)",
          zIndex: 10,
        }}
      >
        <Compass size={26} style={{ color: "#e8c860", filter: "drop-shadow(0 0 8px rgba(232,200,96,0.70))" }} />
        {playerName && (
          <span className="text-[7px] font-black uppercase tracking-[0.12em] mt-0.5" style={{ color: "rgba(232,200,96,0.68)" }}>
            {playerName.slice(0, 6).toUpperCase()}
          </span>
        )}
      </div>

      {/* ── Stat branch nodes ─────────────────────────────────────────────── */}
      {STAT_NODES.map(stat => {
        const isExpanded = expandedStat === stat.nodeId;
        const hasAnyDone = stat.leaves.some(l => l.cardId && cardIsDone(l.cardId));
        const isRecommended = !allDone && stat.leaves.some(l => l.cardId === featuredCardId);

        return (
          <React.Fragment key={stat.nodeId}>
            {/* Stat node button */}
            <motion.button
              type="button"
              onClick={() => handleStatTap(stat.nodeId)}
              whileTap={{ scale: 0.86 }}
              className="absolute flex items-center justify-center rounded-full"
              style={{
                left: `${stat.pos.x}%`, top: `${stat.pos.y}%`,
                transform: "translate(-50%, -50%)",
                width: 52, height: 52,
                background: isExpanded
                  ? `radial-gradient(circle at 38% 32%, ${stat.color}30 0%, rgba(4,6,22,0.96) 68%)`
                  : `radial-gradient(circle at 38% 32%, ${stat.color}18 0%, rgba(4,6,22,0.96) 68%)`,
                border: `2px solid ${isExpanded ? stat.color + "cc" : isRecommended ? stat.color + "99" : stat.color + "55"}`,
                boxShadow: isExpanded
                  ? `0 0 22px ${stat.color}55, 0 0 44px ${stat.color}20, inset 0 0 14px rgba(0,0,0,0.58)`
                  : isRecommended
                    ? `0 0 16px ${stat.color}44, inset 0 0 12px rgba(0,0,0,0.52)`
                    : `0 0 8px ${stat.color}22, inset 0 0 12px rgba(0,0,0,0.52)`,
                zIndex: 8,
              }}
              data-testid={`stat-node-${stat.nodeId}`}
            >
              {hasAnyDone
                ? <CheckCircle2 size={20} style={{ color: "#22c55e" }} />
                : <stat.Icon size={20} style={{
                    color: stat.color,
                    filter: `drop-shadow(0 0 ${isExpanded ? "8px" : "4px"} ${stat.color}${isExpanded ? "ee" : "88"})`,
                  }} />
              }
            </motion.button>

            {/* Stat label (below node) */}
            <div
              className="absolute pointer-events-none text-center"
              style={{
                left: `${stat.pos.x}%`, top: `calc(${stat.pos.y}% + 29px)`,
                transform: "translateX(-50%)",
                zIndex: 8,
              }}
            >
              <span
                className="font-bold uppercase whitespace-nowrap"
                style={{
                  fontSize: "7.5px",
                  letterSpacing: "0.10em",
                  color: isExpanded ? stat.color : stat.color + "88",
                }}
              >
                {stat.labelShort}
              </span>
            </div>

            {/* ── Leaf nodes (spring in/out) ──────────────────────────────── */}
            <AnimatePresence>
              {isExpanded && stat.leaves.map((leaf, li) => {
                const done = leaf.cardId ? cardIsDone(leaf.cardId) : false;
                const isRec = !allDone && leaf.cardId === featuredCardId;

                return (
                  <motion.div
                    key={leaf.leafId}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${leaf.pos.x}%`, top: `${leaf.pos.y}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: 9,
                      gap: 2,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24, delay: li * 0.055 }}
                  >
                    {/* Pulse ring for recommended */}
                    {isRec && (
                      <motion.div
                        className="absolute rounded-full"
                        style={{ inset: -4, border: `1.5px solid ${stat.color}88` }}
                        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => handleLeafTap(leaf)}
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 38, height: 38,
                        background: leaf.isLocked
                          ? "rgba(255,255,255,0.04)"
                          : done
                            ? "rgba(34,197,94,0.18)"
                            : `radial-gradient(circle at 38% 32%, ${stat.color}22 0%, rgba(4,6,22,0.96) 70%)`,
                        border: `1.5px solid ${
                          leaf.isLocked ? "rgba(255,255,255,0.14)"
                          : done ? "rgba(34,197,94,0.65)"
                          : stat.color + "88"
                        }`,
                        boxShadow: isRec
                          ? `0 0 18px ${stat.color}60, 0 0 30px ${stat.color}22`
                          : done
                            ? "0 0 14px rgba(34,197,94,0.40)"
                            : "none",
                        opacity: leaf.isLocked ? 0.42 : 1,
                        cursor: leaf.isLocked ? "default" : "pointer",
                      }}
                      data-testid={`leaf-${leaf.leafId}`}
                    >
                      {leaf.isLocked
                        ? <Lock size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
                        : done
                          ? <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                          : <leaf.Icon size={14} style={{ color: stat.color, filter: `drop-shadow(0 0 4px ${stat.color}99)` }} />
                      }
                    </button>

                    <span
                      className="text-center font-bold uppercase leading-tight"
                      style={{
                        fontSize: "6px",
                        letterSpacing: "0.08em",
                        color: leaf.isLocked ? "rgba(255,255,255,0.28)" : done ? "#4ade80" : stat.color + "cc",
                        maxWidth: 42,
                      }}
                    >
                      {leaf.label}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </React.Fragment>
        );
      })}
    </div>
  );
}

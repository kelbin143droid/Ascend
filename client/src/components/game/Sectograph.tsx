import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

export interface ScheduleBlock {
  id: string;
  name: string;
  description?: string;
  date?: string;
  startHour: number;
  startMinute?: number;
  endHour: number;
  endMinute?: number;
  color: string;
  isSystemTask?: boolean;
  isTemplate?: boolean;
  segment?: string;
  subType?: string;
  type?: BlockType;
  completed?: boolean;
}

export type BlockType =
  | "sleep"
  | "work"
  | "study"
  | "daily"
  | "meal"
  | "leisure"
  | "custom";

export interface FreeWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  durationMinutes: number;
}

export interface BehavioralAnchor {
  sessionId: string;
  completedAt: string;
  hour: number;
  minute: number;
  durationMinutes: number;
}

export interface ActiveFocusBlock {
  startHour: number;
  startMinute: number;
  durationMinutes: number;
}

export interface RhythmWindowVisual {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  actionType: "reset" | "habit" | "focusSession" | "mixed";
  confidenceScore: number;
}

export interface SuggestedPlacement {
  id: string;
  suggestedHour: number;
  suggestedMinute: number;
  durationMinutes: number;
  confidenceScore: number;
  reason: string;
}

/* ─────────────── Fixed type-based color system ─────────────── */
export const TYPE_COLORS: Record<BlockType, string> = {
  sleep: "#3a3f4a",     // dark gray
  work: "#3b82f6",      // blue
  study: "#22c55e",     // green
  daily: "#a855f7",     // purple (Daily Flow)
  meal: "#f97316",      // orange
  leisure: "#eab308",   // yellow
  custom: "#6b7280",    // neutral gray
};

/** Best-effort classifier for blocks coming from older data without `type`. */
export function inferBlockType(block: ScheduleBlock): BlockType {
  if (block.type) return block.type;
  const id = (block.id || "").toLowerCase();
  const seg = (block.segment || "").toLowerCase();
  const name = (block.name || "").toLowerCase();
  if (id.startsWith("seg-sleep") || id.startsWith("sleep") || seg === "sleep" || /\bsleep\b|\brest\b/.test(name)) return "sleep";
  if (id.startsWith("daily-flow") || id.startsWith("daily") || /daily flow|workout|train|gym|stretch|breath/.test(name)) return "daily";
  if (id.startsWith("work") || seg === "work" || /\bwork\b|meeting|deep work/.test(name)) return "work";
  if (id.startsWith("study") || /\bstudy\b|\bread\b|\blearn\b|\bclass\b|\bcourse\b/.test(name)) return "study";
  if (id.startsWith("meal") || /\bmeal\b|\blunch\b|\bdinner\b|\bbreakfast\b|\bsnack\b|\beat\b/.test(name)) return "meal";
  if (id.startsWith("leisure") || /leisure|\bgame\b|\btv\b|relax|\bfun\b|social/.test(name)) return "leisure";
  return "custom";
}

/** Always returns a deterministic palette color so the wheel reads consistently. */
export function getBlockColor(block: ScheduleBlock): string {
  return TYPE_COLORS[inferBlockType(block)];
}

/* ─────────────── Time helpers (overnight-safe) ─────────────── */
/** Returns true when `nowMin` (0..1440) falls between an interval that may wrap past midnight. */
function isNowInsideInterval(nowMin: number, startMin: number, endMin: number): boolean {
  if (endMin > startMin) return nowMin >= startMin && nowMin < endMin;
  // Wrapped (e.g. 22:00 → 06:00)
  return nowMin >= startMin || nowMin < endMin;
}

/** Whether the interval has fully ended for today, given current minute-of-day. */
function isIntervalPast(nowMin: number, startMin: number, endMin: number): boolean {
  if (endMin > startMin) return nowMin >= endMin;
  // Wrapped intervals can only be considered "past" when nowMin is between endMin and startMin.
  return nowMin >= endMin && nowMin < startMin;
}

/** Minutes remaining in an interval that contains `nowMin`. Returns 0 if not inside. */
function minutesRemainingInInterval(nowMin: number, startMin: number, endMin: number): number {
  if (!isNowInsideInterval(nowMin, startMin, endMin)) return 0;
  if (endMin > startMin) return endMin - nowMin;
  // Wrapped: end is tomorrow.
  return (endMin + 24 * 60) - nowMin;
}

/** Minutes elapsed inside an interval, capped to its duration. Handles wrapped intervals. */
function elapsedMinutesInInterval(nowMin: number, startMin: number, endMin: number): number {
  const duration = endMin > startMin ? endMin - startMin : (endMin + 24 * 60) - startMin;
  if (isNowInsideInterval(nowMin, startMin, endMin)) {
    if (endMin > startMin) return nowMin - startMin;
    // Wrapped, currently inside
    return nowMin >= startMin ? nowMin - startMin : (nowMin + 24 * 60) - startMin;
  }
  if (isIntervalPast(nowMin, startMin, endMin)) return duration;
  return 0;
}

export const _sectographTimeHelpers = {
  isNowInsideInterval,
  isIntervalPast,
  minutesRemainingInInterval,
  elapsedMinutesInInterval,
};

export const DEFAULT_SEGMENTS: ScheduleBlock[] = [
  { id: "seg-sleep", name: "Sleep", startHour: 22, endHour: 6, color: TYPE_COLORS.sleep, segment: "sleep", type: "sleep" },
  { id: "seg-morning", name: "Morning", startHour: 6, endHour: 9, color: TYPE_COLORS.custom, segment: "personal", type: "custom" },
  { id: "seg-work-am", name: "Work", startHour: 9, endHour: 12, color: TYPE_COLORS.work, segment: "work", type: "work", isSystemTask: true },
  { id: "seg-midday", name: "Meal", startHour: 12, endHour: 13, color: TYPE_COLORS.meal, segment: "personal", type: "meal" },
  { id: "seg-work-pm", name: "Work", startHour: 13, endHour: 17, color: TYPE_COLORS.work, segment: "work", type: "work", isSystemTask: true },
  { id: "seg-focus", name: "Study", startHour: 17, endHour: 19, color: TYPE_COLORS.study, segment: "focus", type: "study", isSystemTask: true },
  { id: "seg-evening", name: "Leisure", startHour: 19, endHour: 22, color: TYPE_COLORS.leisure, segment: "personal", type: "leisure" },
];

export function detectFreeWindows(schedule: ScheduleBlock[], minGapMinutes: number = 30): FreeWindow[] {
  if (schedule.length === 0) return [];

  const toMin = (h: number, m: number = 0) => h * 60 + m;
  const intervals: [number, number][] = schedule.map(b => {
    let start = toMin(b.startHour, b.startMinute ?? 0);
    let end = toMin(b.endHour, b.endMinute ?? 0);
    if (end <= start) end += 24 * 60;
    return [start, end];
  });

  intervals.sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const [s, e] of intervals) {
    if (merged.length && s <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    } else {
      merged.push([s, e]);
    }
  }

  const gaps: FreeWindow[] = [];
  for (let i = 0; i < merged.length - 1; i++) {
    const gapStart = merged[i][1];
    const gapEnd = merged[i + 1][0];
    const duration = gapEnd - gapStart;
    if (duration >= minGapMinutes) {
      gaps.push({
        startHour: Math.floor((gapStart % (24 * 60)) / 60),
        startMinute: gapStart % 60,
        endHour: Math.floor((gapEnd % (24 * 60)) / 60),
        endMinute: gapEnd % 60,
        durationMinutes: duration,
      });
    }
  }
  return gaps;
}

interface SectographProps {
  schedule?: ScheduleBlock[];
  size?: number;
  showAwareness?: boolean;
  anchors?: BehavioralAnchor[];
  focusBlock?: ActiveFocusBlock | null;
  rhythmWindows?: RhythmWindowVisual[];
  suggestedPlacements?: SuggestedPlacement[];
  highlightCenter?: boolean;
  currentBlockId?: string | null;
  onCenterClick?: () => void;
  onBlockClick?: (block: ScheduleBlock) => void;
  onFreeWindowClick?: (window: FreeWindow) => void;
  onSuggestedPlacementClick?: (placement: SuggestedPlacement) => void;
}

export function Sectograph({
  schedule = DEFAULT_SEGMENTS,
  size = 280,
  showAwareness = false,
  anchors = [],
  focusBlock = null,
  rhythmWindows = [],
  suggestedPlacements = [],
  highlightCenter = false,
  currentBlockId = null,
  onCenterClick,
  onBlockClick,
  onFreeWindowClick,
  onSuggestedPlacementClick,
}: SectographProps) {
  const [time, setTime] = useState(new Date());
  const { clockTheme } = useTheme();

  // Tick once per minute for needle (was every second — wasteful).
  useEffect(() => {
    const update = () => setTime(new Date());
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, []);

  /* ─────────────── Geometry ─────────────── */
  const center = size / 2;
  const outerRadius = (size / 2) - 8;
  const progressRingRadius = outerRadius - 2;
  const progressRingWidth = 3;
  const scheduleOuterRadius = outerRadius - 8;
  const scheduleInnerRadius = scheduleOuterRadius - Math.max(28, size * 0.11);
  const innerRadius = scheduleInnerRadius - 6;

  const timeToAngle = (hour: number, minute: number = 0) =>
    ((hour * 60 + minute) / (24 * 60)) * 360 - 90;
  const hourToAngle = (hour: number) => ((hour % 24) / 24) * 360 - 90;

  const polarToCartesian = (angle: number, radius: number) => {
    const radian = angle * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian),
    };
  };

  const createArcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    let adjustedEnd = endAngle;
    if (endAngle < startAngle) adjustedEnd = endAngle + 360;
    const outerStart = polarToCartesian(startAngle, outerR);
    const outerEnd = polarToCartesian(adjustedEnd, outerR);
    const innerEnd = polarToCartesian(adjustedEnd, innerR);
    const innerStart = polarToCartesian(startAngle, innerR);
    const largeArc = (adjustedEnd - startAngle) > 180 ? 1 : 0;
    return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y} Z`;
  };

  const createStrokeArcPath = (startAngle: number, endAngle: number, radius: number) => {
    let adjustedEnd = endAngle;
    if (endAngle < startAngle) adjustedEnd = endAngle + 360;
    const start = polarToCartesian(startAngle, radius);
    const end = polarToCartesian(adjustedEnd, radius);
    const largeArc = (adjustedEnd - startAngle) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const currentAngle = timeToAngle(hours, minutes);
  const nowMin = hours * 60 + minutes;

  /* ─────────────── Schedule segments (memoized) ─────────────── */
  const scheduleSegments = useMemo(() => {
    return schedule.map((block) => {
      const startAngle = timeToAngle(block.startHour, block.startMinute ?? 0);
      const endAngle = timeToAngle(block.endHour, block.endMinute ?? 0);
      const path = createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius);

      const startMin = block.startHour * 60 + (block.startMinute ?? 0);
      const endMin = block.endHour * 60 + (block.endMinute ?? 0);
      const isPast = block.completed === true || isIntervalPast(nowMin, startMin, endMin);
      const color = getBlockColor(block);
      return { block, path, color, isPast };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, scheduleOuterRadius, scheduleInnerRadius, nowMin]);

  /* ─────────────── Day completion percentage (overnight-safe) ─────────────── */
  const dayCompletionPct = useMemo(() => {
    if (schedule.length === 0) return 0;
    let scheduledMin = 0;
    let elapsedScheduledMin = 0;
    for (const b of schedule) {
      const s = b.startHour * 60 + (b.startMinute ?? 0);
      const e = b.endHour * 60 + (b.endMinute ?? 0);
      const duration = e > s ? e - s : (e + 24 * 60) - s;
      scheduledMin += duration;
      elapsedScheduledMin += elapsedMinutesInInterval(nowMin, s, e);
    }
    if (scheduledMin <= 0) return 0;
    return Math.min(1, elapsedScheduledMin / scheduledMin);
  }, [schedule, nowMin]);

  const freeWindows = useMemo(() => {
    if (!showAwareness) return [];
    return detectFreeWindows(schedule, 30);
  }, [schedule, showAwareness]);

  const colors = clockTheme.colors;
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

  // Needle endpoints
  const needleTip = polarToCartesian(currentAngle, scheduleOuterRadius + 2);
  const needleBase = polarToCartesian(currentAngle, innerRadius - 2);

  // Outer progress arc (start of day → now)
  const progressEndAngle = -90 + dayCompletionPct * 360;
  const progressArcPath = dayCompletionPct > 0.001
    ? createStrokeArcPath(-90, progressEndAngle, progressRingRadius)
    : null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <style>{`
        @keyframes sectoNeedlePulse-${uid} {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        @keyframes sectoNodeHalo-${uid} {
          0%, 100% { r: 9; opacity: 0.85; }
          50% { r: 18; opacity: 0; }
        }
        @keyframes sectoNodeHalo2-${uid} {
          0%, 100% { r: 11; opacity: 0.6; }
          50% { r: 22; opacity: 0; }
        }
        @keyframes sectoNodePulse-${uid} {
          0%, 100% { r: 7; }
          50% { r: 8.5; }
        }
      `}</style>
      <svg width={size} height={size}>
        <defs>
          <radialGradient id={`centerDark-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.background} />
            <stop offset="100%" stopColor={colors.background} />
          </radialGradient>
          <filter id={`needleGlow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <filter id={`needleGlowStrong-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* Layer 1 — subtle background ring */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill={colors.surface}
          stroke={colors.surfaceBorder}
          strokeWidth="1"
        />
        <circle
          cx={center}
          cy={center}
          r={progressRingRadius}
          fill="none"
          stroke={colors.surfaceBorder}
          strokeWidth={progressRingWidth}
          opacity="0.35"
        />

        {/* Outer progress arc — completed scheduled time */}
        {progressArcPath && (
          <path
            d={progressArcPath}
            fill="none"
            stroke={colors.primary}
            strokeWidth={progressRingWidth}
            strokeLinecap="round"
            opacity="0.9"
          />
        )}

        {/* Hour ticks */}
        {[...Array(24)].map((_, hour) => {
          const angle = hourToAngle(hour);
          const isMain = hour % 6 === 0;
          const tickOuter = scheduleOuterRadius + 5;
          const tickInner = isMain ? scheduleOuterRadius - 2 : scheduleOuterRadius + 1;
          const start = polarToCartesian(angle, tickInner);
          const end = polarToCartesian(angle, tickOuter);
          return (
            <line
              key={hour}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isMain ? colors.text : colors.tickMark}
              strokeWidth={isMain ? 1.5 : 0.75}
              opacity={isMain ? 0.85 : 0.45}
            />
          );
        })}

        {/* Layer 2 — schedule segments (solid colors, no gradient/glow) */}
        {scheduleSegments.map(({ block, path, color, isPast }) => {
          const isActive = currentBlockId === block.id;
          return (
            <g
              key={block.id}
              onClick={() => onBlockClick?.(block)}
              style={{ cursor: onBlockClick ? "pointer" : "default" }}
              data-testid={`sectograph-block-${block.id}`}
            >
              <path
                d={path}
                fill={color}
                opacity={isActive ? 1 : isPast ? 0.4 : 0.78}
                stroke={isActive ? "#ffffff" : "rgba(0,0,0,0.25)"}
                strokeWidth={isActive ? 1.75 : 0.5}
                className={onBlockClick ? "transition-opacity hover:opacity-90" : ""}
              />
              {isActive && (
                <>
                  {/* soft glow only on active */}
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    opacity="0.55"
                    style={{ filter: "blur(3px)", pointerEvents: "none" }}
                  />
                  <path
                    d={path}
                    fill="rgba(255,255,255,0.14)"
                    stroke="none"
                    style={{ pointerEvents: "none" }}
                  >
                    <animate attributeName="opacity" values="0.22;0.05;0.22" dur="2.6s" repeatCount="indefinite" />
                  </path>
                </>
              )}
            </g>
          );
        })}

        {/* Free windows — subtle dashed overlay */}
        {showAwareness && freeWindows.map((gap, i) => {
          const startAngle = timeToAngle(gap.startHour, gap.startMinute);
          const endAngle = timeToAngle(gap.endHour, gap.endMinute);
          return (
            <g
              key={`free-${i}`}
              onClick={() => onFreeWindowClick?.(gap)}
              style={{ cursor: onFreeWindowClick ? "pointer" : "default" }}
              data-testid={`sectograph-free-${i}`}
            >
              <path
                d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)}
                fill="rgba(34,197,94,0.06)"
                stroke="rgba(34,197,94,0.22)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </g>
          );
        })}

        {/* Suggested placements — small dashed markers */}
        {suggestedPlacements.map((sp, i) => {
          const startMin = sp.suggestedHour * 60 + sp.suggestedMinute;
          const endMin = startMin + sp.durationMinutes;
          const startAngle = timeToAngle(sp.suggestedHour, sp.suggestedMinute);
          const endAngle = timeToAngle(Math.floor(endMin / 60) % 24, endMin % 60);
          return (
            <g
              key={`suggestion-${i}`}
              onClick={() => onSuggestedPlacementClick?.(sp)}
              style={{ cursor: onSuggestedPlacementClick ? "pointer" : "default" }}
              data-testid={`sectograph-suggestion-${i}`}
            >
              <path
                d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)}
                fill="rgba(34,211,238,0.10)"
                stroke="rgba(34,211,238,0.45)"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
            </g>
          );
        })}

        {/* Rhythm windows — kept (very subtle) */}
        {rhythmWindows.map((rw, i) => {
          const startAngle = timeToAngle(rw.startHour, rw.startMinute);
          const endAngle = timeToAngle(rw.endHour, rw.endMinute);
          const colorRgb = rw.actionType === "reset" ? "245,158,11"
            : rw.actionType === "focusSession" ? "139,92,246"
            : rw.actionType === "habit" ? "59,130,246"
            : "99,102,241";
          const opacity = Math.min(0.18, rw.confidenceScore * 0.22);
          return (
            <path
              key={`rhythm-${i}`}
              data-testid={`sectograph-rhythm-${i}`}
              d={createArcPath(startAngle, endAngle, scheduleOuterRadius + 4, scheduleOuterRadius + 1)}
              fill={`rgba(${colorRgb},${opacity})`}
              stroke="none"
            />
          );
        })}

        {/* Active focus block — subtle highlight */}
        {focusBlock && (() => {
          const endMin = focusBlock.startHour * 60 + focusBlock.startMinute + focusBlock.durationMinutes;
          const endH = Math.floor(endMin / 60) % 24;
          const endM = endMin % 60;
          const startAngle = timeToAngle(focusBlock.startHour, focusBlock.startMinute);
          const endAngle = timeToAngle(endH, endM);
          return (
            <path
              data-testid="sectograph-focus-block"
              d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)}
              fill="rgba(168,85,247,0.25)"
              stroke="rgba(168,85,247,0.6)"
              strokeWidth="1.5"
            />
          );
        })()}

        {/* Behavioral anchors — small dots */}
        {anchors.map((anchor, i) => {
          const angle = timeToAngle(anchor.hour, anchor.minute);
          const pos = polarToCartesian(angle, scheduleOuterRadius + 6);
          return (
            <circle
              key={`anchor-${i}`}
              data-testid={`sectograph-anchor-${i}`}
              cx={pos.x}
              cy={pos.y}
              r={2.5}
              fill="#f59e0b"
              opacity="0.85"
            />
          );
        })}

        {/* Inner disc */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill={`url(#centerDark-${uid})`}
          stroke={colors.surfaceBorder}
          strokeWidth="1"
        />

        {/* Layer 3 — bold current time needle (player position) */}
        {/* Wide outer glow line */}
        <line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#06b6d4"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.4"
          filter={`url(#needleGlowStrong-${uid})`}
          style={{ pointerEvents: "none" }}
        />
        {/* Mid glow line */}
        <line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#22d3ee"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.55"
          filter={`url(#needleGlow-${uid})`}
          style={{ pointerEvents: "none" }}
        />
        {/* Bold bright core needle */}
        <line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ animation: `sectoNeedlePulse-${uid} 2.2s ease-in-out infinite` }}
        />
        {/* Cyan inner stripe to colorize the bright core */}
        <line
          x1={needleBase.x}
          y1={needleBase.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#22d3ee"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.95"
        />
        {/* Player-position node at the edge — multiple layered halos */}
        <circle
          cx={needleTip.x}
          cy={needleTip.y}
          r={20}
          fill="#22d3ee"
          opacity="0.22"
          filter={`url(#needleGlowStrong-${uid})`}
          style={{ pointerEvents: "none" }}
        />
        <circle
          cx={needleTip.x}
          cy={needleTip.y}
          r={11}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          opacity="0.7"
          style={{ animation: `sectoNodeHalo2-${uid} 2.2s ease-out infinite` }}
        />
        <circle
          cx={needleTip.x}
          cy={needleTip.y}
          r={9}
          fill="none"
          stroke="#67e8f9"
          strokeWidth="1.5"
          opacity="0.85"
          style={{ animation: `sectoNodeHalo-${uid} 2.2s ease-out infinite` }}
        />
        <circle
          cx={needleTip.x}
          cy={needleTip.y}
          r={7}
          fill="#22d3ee"
          stroke="#ffffff"
          strokeWidth="2"
          style={{ animation: `sectoNodePulse-${uid} 2.2s ease-in-out infinite` }}
        />
        <circle
          cx={needleTip.x}
          cy={needleTip.y}
          r={2.5}
          fill="#ffffff"
          opacity="0.95"
        />

        {/* Center pivot */}
        <circle cx={center} cy={center} r={4.5} fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" opacity="1" />

        {/* Cardinal hour labels */}
        {[
          { hour: 0, label: "12AM" },
          { hour: 6, label: "6AM" },
          { hour: 12, label: "12PM" },
          { hour: 18, label: "6PM" },
        ].map(({ hour, label }) => {
          const angle = hourToAngle(hour);
          const pos = polarToCartesian(angle, scheduleInnerRadius - 12);
          return (
            <text
              key={hour}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={colors.textMuted}
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.05em" }}
            >
              {label}
            </text>
          );
        })}

        {/* Now time label (top) */}
        <text
          x={center}
          y={14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colors.text}
          opacity={0.85}
          style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </text>
      </svg>

      {/* Center "Add Block" button */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {highlightCenter && (
          <>
            <style>{`
              @keyframes sectoCenterPulse1-${uid} {
                0%, 100% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.5); opacity: 0; }
              }
            `}</style>
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 64, height: 64,
                border: "2px solid #6366f1",
                animation: `sectoCenterPulse1-${uid} 1.4s ease-out infinite`,
              }}
            />
          </>
        )}
        <button
          data-testid="button-schedule"
          onClick={onCenterClick}
          className="pointer-events-auto rounded-full flex items-center justify-center gap-1.5 transition-transform duration-200 cursor-pointer hover:scale-105 active:scale-95"
          style={{
            backgroundColor: colors.surface,
            border: `1.5px solid ${colors.primary}`,
            color: colors.primary,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            padding: "8px 12px",
            minWidth: 86,
            boxShadow: `0 0 12px ${colors.primaryGlow}`,
          }}
          title="Add time block"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          ADD BLOCK
        </button>
      </div>
    </div>
  );
}

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
}

export interface FreeWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  durationMinutes: number;
}

export const DEFAULT_SEGMENTS: ScheduleBlock[] = [
  { id: "seg-sleep", name: "Sleep", startHour: 22, endHour: 6, color: "#2d3a4f", segment: "sleep" },
  { id: "seg-morning", name: "Morning", startHour: 6, endHour: 9, color: "#4a6272", segment: "personal" },
  { id: "seg-work-am", name: "Work", startHour: 9, endHour: 12, color: "#3d5a80", segment: "work", isSystemTask: true },
  { id: "seg-midday", name: "Break", startHour: 12, endHour: 13, color: "#5a7d5a", segment: "personal" },
  { id: "seg-work-pm", name: "Work", startHour: 13, endHour: 17, color: "#3d5a80", segment: "work", isSystemTask: true },
  { id: "seg-focus", name: "Focus", startHour: 17, endHour: 19, color: "#6b5b8a", segment: "focus", isSystemTask: true },
  { id: "seg-evening", name: "Personal", startHour: 19, endHour: 22, color: "#5a6b7a", segment: "personal" },
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
  onCenterClick?: () => void;
  onBlockClick?: (block: ScheduleBlock) => void;
  onFreeWindowClick?: (window: FreeWindow) => void;
}

export function Sectograph({
  schedule = DEFAULT_SEGMENTS,
  size = 280,
  showAwareness = false,
  onCenterClick,
  onBlockClick,
  onFreeWindowClick,
}: SectographProps) {
  const [time, setTime] = useState(new Date());
  const { clockTheme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const center = size / 2;
  const outerRadius = (size / 2) - 12;
  const glowRingRadius = outerRadius * 0.82;
  const glowRingWidth = outerRadius * 0.12;
  const innerRadius = outerRadius * 0.55;
  const scheduleInnerRadius = innerRadius + 4;
  const scheduleOuterRadius = glowRingRadius - glowRingWidth / 2 - 2;
  const presentMarkerRadius = outerRadius - 1;

  const timeToAngle = (hour: number, minute: number = 0) => {
    const totalMinutes = hour * 60 + minute;
    return (totalMinutes / (24 * 60)) * 360 - 90;
  };

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

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const currentAngle = timeToAngle(hours, minutes);
  const hourAngle = (hours / 24) * 360 + (minutes / 60) * 15 - 90;
  const minuteAngle = (minutes / 60) * 360 + (seconds / 60) * 6 - 90;

  const hourHandLength = innerRadius * 0.5;
  const minuteHandLength = innerRadius * 0.75;
  const hourHandEnd = polarToCartesian(hourAngle, hourHandLength);
  const minuteHandEnd = polarToCartesian(minuteAngle, minuteHandLength);

  const presentPos = polarToCartesian(currentAngle, presentMarkerRadius);
  const presentInner = polarToCartesian(currentAngle, scheduleInnerRadius - 2);
  const presentOuter = polarToCartesian(currentAngle, scheduleOuterRadius + 2);

  const freeWindows = useMemo(() => {
    if (!showAwareness) return [];
    return detectFreeWindows(schedule, 30);
  }, [schedule, showAwareness]);

  const colors = clockTheme.colors;
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <filter id={`glowRing-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id={`softGlow-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`presentGlow-${uid}`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`ringGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.ring} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.ring} />
          </linearGradient>
          <radialGradient id={`centerDark-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.background} />
            <stop offset="80%" stopColor={colors.background} />
            <stop offset="100%" stopColor={colors.background} />
          </radialGradient>
        </defs>

        <circle cx={center} cy={center} r={outerRadius + 4} fill="none" stroke={colors.surfaceBorder} strokeWidth="1" />
        <circle cx={center} cy={center} r={outerRadius} fill={colors.surface} stroke={colors.surfaceBorder} strokeWidth="1" />
        <circle cx={center} cy={center} r={glowRingRadius} fill="none" stroke={`url(#ringGradient-${uid})`} strokeWidth={glowRingWidth} filter={`url(#glowRing-${uid})`} opacity="0.5" />
        <circle cx={center} cy={center} r={glowRingRadius} fill="none" stroke={colors.ringGlow} strokeWidth={glowRingWidth + 8} opacity="0.4" style={{ filter: "blur(6px)" }} />

        {[...Array(24)].map((_, hour) => {
          const angle = hourToAngle(hour);
          const isMainHour = hour % 6 === 0;
          const tickOuter = outerRadius - 2;
          const tickInner = isMainHour ? outerRadius - 16 : outerRadius - 8;
          const start = polarToCartesian(angle, tickInner);
          const end = polarToCartesian(angle, tickOuter);
          return (
            <line key={hour} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={isMainHour ? colors.ring : colors.tickMark} strokeWidth={isMainHour ? 2 : 1} />
          );
        })}

        {schedule.map((block) => {
          const startAngle = timeToAngle(block.startHour, block.startMinute ?? 0);
          const endAngle = timeToAngle(block.endHour, block.endMinute ?? 0);
          return (
            <g key={block.id} onClick={() => onBlockClick?.(block)} style={{ cursor: onBlockClick ? "pointer" : "default" }} data-testid={`sectograph-block-${block.id}`}>
              <path d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)} fill={block.color} opacity={1} stroke={block.isSystemTask ? colors.ring : "rgba(255,255,255,0.15)"} strokeWidth={block.isSystemTask ? 1.5 : 0.5} className={onBlockClick ? "hover:opacity-80 transition-opacity" : ""} />
              {block.isSystemTask && (
                <path d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)} fill="none" stroke={colors.ringGlow} strokeWidth="3" style={{ filter: "blur(4px)", pointerEvents: "none" }} />
              )}
            </g>
          );
        })}

        {showAwareness && freeWindows.map((gap, i) => {
          const startAngle = timeToAngle(gap.startHour, gap.startMinute);
          const endAngle = timeToAngle(gap.endHour, gap.endMinute);
          return (
            <g key={`free-${i}`} onClick={() => onFreeWindowClick?.(gap)} style={{ cursor: onFreeWindowClick ? "pointer" : "default" }} data-testid={`sectograph-free-${i}`}>
              <path d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)} fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.25)" strokeWidth="1" strokeDasharray="4 3" />
            </g>
          );
        })}

        <circle cx={center} cy={center} r={innerRadius} fill={`url(#centerDark-${uid})`} stroke={colors.surfaceBorder} strokeWidth="1" />
        <circle cx={center} cy={center} r={innerRadius - 8} fill="none" stroke={colors.surfaceBorder} strokeWidth="1" opacity="0.5" />

        <line x1={center} y1={center} x2={hourHandEnd.x} y2={hourHandEnd.y} stroke={colors.text} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        <line x1={center} y1={center} x2={minuteHandEnd.x} y2={minuteHandEnd.y} stroke={colors.clockHand} strokeWidth="2" strokeLinecap="round" filter={`url(#softGlow-${uid})`} opacity="0.8" />

        <circle cx={center} cy={center} r={6} fill={colors.background} stroke={colors.ring} strokeWidth="2" opacity="0.8" />
        <circle cx={center} cy={center} r={3} fill={colors.centerDot} opacity="0.9" />

        <line x1={presentInner.x} y1={presentInner.y} x2={presentOuter.x} y2={presentOuter.y} stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <circle cx={presentPos.x} cy={presentPos.y} r={4} fill="#22c55e" filter={`url(#presentGlow-${uid})`} opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx={presentPos.x} cy={presentPos.y} r={7} fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.3">
          <animate attributeName="r" values="7;12;7" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
        </circle>

        {[0, 6, 12, 18].map((hour) => {
          const angle = hourToAngle(hour);
          const pos = polarToCartesian(angle, outerRadius - 24);
          const labels: Record<number, string> = { 0: "12", 6: "6", 12: "12", 18: "6" };
          const periods: Record<number, string> = { 0: "AM", 6: "AM", 12: "PM", 18: "PM" };
          return (
            <text key={hour} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fill={colors.textMuted} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: "bold" }}>
              {labels[hour]}
              <tspan fill={colors.tickMark} style={{ fontSize: "7px" }}>{periods[hour]}</tspan>
            </text>
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <button
          data-testid="button-schedule"
          onClick={onCenterClick}
          className="pointer-events-auto absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all cursor-pointer group"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.surfaceBorder}`,
            boxShadow: `0 0 15px ${colors.primaryGlow}`,
          }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 transition-colors" style={{ color: colors.primary }} fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none" style={{ top: "-8px" }}>
        <div
          className="text-sm font-mono font-bold tracking-tighter"
          style={{
            color: colors.text,
            textShadow: `0 0 8px ${colors.primaryGlow}`,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "-0.02em",
            opacity: 0.8,
          }}
        >
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </div>
      </div>
    </div>
  );
}

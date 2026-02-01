import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

export interface ScheduleBlock {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  color: string;
  isSystemTask?: boolean;
}

interface SectographProps {
  schedule?: ScheduleBlock[];
  size?: number;
  onCenterClick?: () => void;
  playerRank?: string;
}

const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  { id: "sleep", name: "Sleep", startHour: 22, endHour: 6, color: "#3b4d6b" },
  { id: "morning", name: "Morning Routine", startHour: 6, endHour: 7, color: "#6b8cae" },
  { id: "work1", name: "Focus Work", startHour: 9, endHour: 12, color: "#4a6fa5", isSystemTask: true },
  { id: "lunch", name: "Lunch", startHour: 12, endHour: 13, color: "#7d9d6a" },
  { id: "work2", name: "Deep Work", startHour: 14, endHour: 17, color: "#4a6fa5", isSystemTask: true },
  { id: "training", name: "Training", startHour: 17, endHour: 18, color: "#c97b63", isSystemTask: true },
  { id: "evening", name: "Leisure", startHour: 19, endHour: 22, color: "#8b7aa3" },
];

export function Sectograph({ schedule = DEFAULT_SCHEDULE, size = 280, onCenterClick, playerRank }: SectographProps) {
  const isAscension = playerRank === "S";
  const goldGlow = "#ffd700";
  const [time, setTime] = useState(new Date());
  const { theme } = useTheme();
  
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

  const hourToAngle = (hour: number) => {
    return ((hour % 24) / 24) * 360 - 90;
  };

  const polarToCartesian = (angle: number, radius: number) => {
    const radian = angle * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian),
    };
  };

  const createArcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    let adjustedEnd = endAngle;
    if (endAngle < startAngle) {
      adjustedEnd = endAngle + 360;
    }
    
    const outerStart = polarToCartesian(startAngle, outerR);
    const outerEnd = polarToCartesian(adjustedEnd, outerR);
    const innerEnd = polarToCartesian(adjustedEnd, innerR);
    const innerStart = polarToCartesian(startAngle, innerR);
    
    const largeArc = (adjustedEnd - startAngle) > 180 ? 1 : 0;
    
    return `
      M ${outerStart.x} ${outerStart.y}
      A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
      L ${innerEnd.x} ${innerEnd.y}
      A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
      Z
    `;
  };

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  
  const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30 - 90;
  const minuteAngle = (minutes / 60) * 360 + (seconds / 60) * 6 - 90;

  const hourHandLength = innerRadius * 0.5;
  const minuteHandLength = innerRadius * 0.75;

  const hourHandEnd = polarToCartesian(hourAngle, hourHandLength);
  const minuteHandEnd = polarToCartesian(minuteAngle, minuteHandLength);

  const colors = theme.colors;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <filter id="glowRing" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.ring} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.ring} />
          </linearGradient>
          <radialGradient id="centerDark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.background} />
            <stop offset="80%" stopColor={colors.background} />
            <stop offset="100%" stopColor={colors.background} />
          </radialGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={outerRadius + 4}
          fill="none"
          stroke={colors.surfaceBorder}
          strokeWidth="1"
        />

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
          r={glowRingRadius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={glowRingWidth}
          filter="url(#glowRing)"
          opacity="0.9"
        />

        <circle
          cx={center}
          cy={center}
          r={glowRingRadius}
          fill="none"
          stroke={colors.ringGlow}
          strokeWidth={glowRingWidth + 8}
          style={{ filter: "blur(6px)" }}
        />

        {[...Array(24)].map((_, hour) => {
          const angle = hourToAngle(hour);
          const isMainHour = hour % 6 === 0;
          const tickOuter = outerRadius - 2;
          const tickInner = isMainHour ? outerRadius - 16 : outerRadius - 8;
          const start = polarToCartesian(angle, tickInner);
          const end = polarToCartesian(angle, tickOuter);
          
          return (
            <line
              key={hour}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isMainHour ? colors.ring : colors.tickMark}
              strokeWidth={isMainHour ? 2 : 1}
            />
          );
        })}

        {schedule.map((block) => {
          const startAngle = hourToAngle(block.startHour);
          const endAngle = hourToAngle(block.endHour);
          const systemTaskGlow = isAscension && block.isSystemTask ? goldGlow : colors.ringGlow;
          const systemTaskStroke = isAscension && block.isSystemTask ? goldGlow : colors.ring;
          
          return (
            <g key={block.id}>
              <path
                d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)}
                fill={block.color}
                opacity={0.8}
                stroke={block.isSystemTask ? systemTaskStroke : "rgba(255,255,255,0.08)"}
                strokeWidth={block.isSystemTask ? 1.5 : 0.5}
              />
              {block.isSystemTask && (
                <path
                  d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)}
                  fill="none"
                  stroke={systemTaskGlow}
                  strokeWidth="3"
                  style={{ filter: "blur(4px)" }}
                />
              )}
            </g>
          );
        })}

        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="url(#centerDark)"
          stroke={colors.surfaceBorder}
          strokeWidth="1"
        />

        <circle
          cx={center}
          cy={center}
          r={innerRadius - 8}
          fill="none"
          stroke={colors.surfaceBorder}
          strokeWidth="1"
          opacity="0.5"
        />

        <line
          x1={center}
          y1={center}
          x2={hourHandEnd.x}
          y2={hourHandEnd.y}
          stroke={colors.text}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />

        <line
          x1={center}
          y1={center}
          x2={minuteHandEnd.x}
          y2={minuteHandEnd.y}
          stroke={colors.clockHand}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.8"
        />

        <circle
          cx={center}
          cy={center}
          r={6}
          fill={colors.background}
          stroke={colors.ring}
          strokeWidth="2"
          opacity="0.8"
        />
        <circle
          cx={center}
          cy={center}
          r={3}
          fill={colors.centerDot}
          opacity="0.9"
        />

        {[0, 6, 12, 18].map((hour) => {
          const angle = hourToAngle(hour);
          const pos = polarToCartesian(angle, outerRadius + 10);
          const labels: Record<number, string> = { 0: "12", 6: "6", 12: "12", 18: "6" };
          const periods: Record<number, string> = { 0: "AM", 6: "AM", 12: "PM", 18: "PM" };
          
          return (
            <text
              key={hour}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={colors.textMuted}
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}
            >
              {labels[hour]}
              <tspan fill={colors.tickMark} style={{ fontSize: "6px" }}>{periods[hour]}</tspan>
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
            boxShadow: `0 0 15px ${colors.primaryGlow}` 
          }}
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-5 h-5 transition-colors"
            style={{ color: colors.primary }}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Center logo and time display */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
      >
        {/* Rocket logo */}
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="rocketBody" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0e8f0" />
            </linearGradient>
            <linearGradient id="rocketFlame" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#ff8c00" />
              <stop offset="100%" stopColor="#ff4500" />
            </linearGradient>
            <linearGradient id="rocketWindow" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#4dc3ff" />
              <stop offset="100%" stopColor="#2a8ab8" />
            </linearGradient>
          </defs>
          {/* Rocket body */}
          <path
            d="M24 6 C28 6 32 12 32 20 L32 32 L28 36 L20 36 L16 32 L16 20 C16 12 20 6 24 6 Z"
            fill="url(#rocketBody)"
            stroke="#1a2a4a"
            strokeWidth="1.5"
          />
          {/* Rocket window */}
          <circle cx="24" cy="18" r="4" fill="url(#rocketWindow)" stroke="#1a2a4a" strokeWidth="1" />
          {/* Left fin */}
          <path
            d="M16 28 L10 36 L16 34 Z"
            fill="url(#rocketBody)"
            stroke="#1a2a4a"
            strokeWidth="1"
          />
          {/* Right fin */}
          <path
            d="M32 28 L38 36 L32 34 Z"
            fill="url(#rocketBody)"
            stroke="#1a2a4a"
            strokeWidth="1"
          />
          {/* Flame */}
          <path
            d="M20 36 L24 46 L28 36 Z"
            fill="url(#rocketFlame)"
          />
          <path
            d="M22 36 L24 42 L26 36 Z"
            fill="#fff8dc"
            opacity="0.8"
          />
        </svg>
        
        {/* Time display */}
        <div 
          className="text-lg font-mono font-bold tracking-wider mt-1"
          style={{ color: colors.text, textShadow: `0 0 10px ${colors.primaryGlow}` }}
        >
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      </div>
    </div>
  );
}

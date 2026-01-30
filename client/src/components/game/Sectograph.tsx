import React from "react";

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
}

const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  { id: "sleep", name: "Sleep", startHour: 22, endHour: 6, color: "#3b4d6b" },
  { id: "morning", name: "Morning Routine", startHour: 6, endHour: 7, color: "#6b8cae" },
  { id: "work1", name: "Focus Work", startHour: 9, endHour: 12, color: "#4a6fa5", isSystemTask: true },
  { id: "lunch", name: "Lunch", startHour: 12, endHour: 13, color: "#7d9d6a" },
  { id: "work2", name: "Deep Work", startHour: 14, endHour: 17, color: "#4a6fa5", isSystemTask: true },
  { id: "exercise", name: "Exercise", startHour: 17, endHour: 18, color: "#c97b63", isSystemTask: true },
  { id: "evening", name: "Leisure", startHour: 19, endHour: 22, color: "#8b7aa3" },
];

export function Sectograph({ schedule = DEFAULT_SCHEDULE, size = 280, onCenterClick }: SectographProps) {
  const center = size / 2;
  const outerRadius = (size / 2) - 8;
  const innerRadius = outerRadius * 0.45;
  const scheduleRadius = outerRadius * 0.75;

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

  const hourMarkers = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <filter id="systemGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
          <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.15)" />
            <stop offset="70%" stopColor="rgba(0,255,255,0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="rgba(10,15,25,0.6)"
          stroke="rgba(0,255,255,0.15)"
          strokeWidth="1"
        />

        {[...Array(24)].map((_, hour) => {
          const angle = hourToAngle(hour);
          const isMainHour = hour % 6 === 0;
          const tickInner = isMainHour ? outerRadius - 12 : outerRadius - 6;
          const start = polarToCartesian(angle, tickInner);
          const end = polarToCartesian(angle, outerRadius - 2);
          
          return (
            <line
              key={hour}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="rgba(0,255,255,0.2)"
              strokeWidth={isMainHour ? 1.5 : 0.5}
            />
          );
        })}

        {schedule.map((block) => {
          const startAngle = hourToAngle(block.startHour);
          const endAngle = hourToAngle(block.endHour);
          
          return (
            <g key={block.id}>
              <path
                d={createArcPath(startAngle, endAngle, scheduleRadius, innerRadius + 8)}
                fill={block.color}
                opacity={0.85}
                filter={block.isSystemTask ? "url(#systemGlow)" : undefined}
                stroke={block.isSystemTask ? "rgba(0,255,255,0.4)" : "rgba(255,255,255,0.1)"}
                strokeWidth={block.isSystemTask ? 1.5 : 0.5}
              />
              {block.isSystemTask && (
                <path
                  d={createArcPath(startAngle, endAngle, scheduleRadius, innerRadius + 8)}
                  fill="none"
                  stroke="rgba(0,255,255,0.3)"
                  strokeWidth="2"
                  style={{ filter: "blur(3px)" }}
                />
              )}
            </g>
          );
        })}

        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="url(#centerGradient)"
          stroke="rgba(0,255,255,0.2)"
          strokeWidth="1"
        />

        {hourMarkers.map((hour) => {
          const angle = hourToAngle(hour);
          const pos = polarToCartesian(angle, outerRadius + 12);
          const label = hour === 0 ? "12" : hour === 12 ? "12" : hour > 12 ? (hour - 12).toString() : hour.toString();
          const period = hour < 12 ? "a" : "p";
          
          return (
            <text
              key={hour}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8px] fill-muted-foreground/60"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {label}{period}
            </text>
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <button
          data-testid="button-schedule"
          onClick={onCenterClick}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-black/80 to-black/60 border border-primary/30 flex items-center justify-center hover:scale-105 hover:border-primary/60 transition-all cursor-pointer group"
          style={{ boxShadow: '0 0 20px rgba(0,255,255,0.1)' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-6 h-6 text-primary/70 group-hover:text-primary transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="9" strokeOpacity="0.5" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

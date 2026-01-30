import React, { useState, useEffect } from "react";

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
  { id: "training", name: "Training", startHour: 17, endHour: 18, color: "#c97b63", isSystemTask: true },
  { id: "evening", name: "Leisure", startHour: 19, endHour: 22, color: "#8b7aa3" },
];

export function Sectograph({ schedule = DEFAULT_SCHEDULE, size = 280, onCenterClick }: SectographProps) {
  const [time, setTime] = useState(new Date());
  
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
            <stop offset="0%" stopColor="#00f5d4" />
            <stop offset="50%" stopColor="#00bfa6" />
            <stop offset="100%" stopColor="#00f5d4" />
          </linearGradient>
          <radialGradient id="centerDark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0a1628" />
            <stop offset="80%" stopColor="#05101d" />
            <stop offset="100%" stopColor="#020810" />
          </radialGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={outerRadius + 4}
          fill="none"
          stroke="rgba(0,200,200,0.08)"
          strokeWidth="1"
        />

        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="rgba(5,10,20,0.95)"
          stroke="rgba(0,200,200,0.15)"
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
          stroke="rgba(0,245,212,0.3)"
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
              stroke={isMainHour ? "rgba(0,245,212,0.6)" : "rgba(0,245,212,0.25)"}
              strokeWidth={isMainHour ? 2 : 1}
            />
          );
        })}

        {schedule.map((block) => {
          const startAngle = hourToAngle(block.startHour);
          const endAngle = hourToAngle(block.endHour);
          
          return (
            <g key={block.id}>
              <path
                d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)}
                fill={block.color}
                opacity={0.8}
                stroke={block.isSystemTask ? "rgba(0,245,212,0.5)" : "rgba(255,255,255,0.08)"}
                strokeWidth={block.isSystemTask ? 1.5 : 0.5}
              />
              {block.isSystemTask && (
                <path
                  d={createArcPath(startAngle, endAngle, scheduleOuterRadius, scheduleInnerRadius)}
                  fill="none"
                  stroke="rgba(0,245,212,0.25)"
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
          stroke="rgba(0,200,200,0.2)"
          strokeWidth="1"
        />

        <circle
          cx={center}
          cy={center}
          r={innerRadius - 8}
          fill="none"
          stroke="rgba(0,200,200,0.08)"
          strokeWidth="1"
        />

        <line
          x1={center}
          y1={center}
          x2={hourHandEnd.x}
          y2={hourHandEnd.y}
          stroke="rgba(200,210,220,0.9)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <line
          x1={center}
          y1={center}
          x2={minuteHandEnd.x}
          y2={minuteHandEnd.y}
          stroke="rgba(0,245,212,0.8)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#softGlow)"
        />

        <circle
          cx={center}
          cy={center}
          r={6}
          fill="#0a1628"
          stroke="rgba(0,245,212,0.6)"
          strokeWidth="2"
        />
        <circle
          cx={center}
          cy={center}
          r={3}
          fill="rgba(0,245,212,0.8)"
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
              className="fill-cyan-400/50"
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}
            >
              {labels[hour]}
              <tspan className="fill-cyan-400/30" style={{ fontSize: "6px" }}>{periods[hour]}</tspan>
            </text>
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <button
          data-testid="button-schedule"
          onClick={onCenterClick}
          className="pointer-events-auto absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/80 border border-primary/30 flex items-center justify-center hover:scale-110 hover:border-primary/60 transition-all cursor-pointer group"
          style={{ boxShadow: '0 0 15px rgba(0,245,212,0.15)' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div 
        className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none"
        style={{ bottom: center - innerRadius + 16 }}
      >
        <div className="text-[10px] text-cyan-400/40 font-mono tracking-wider">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      </div>
    </div>
  );
}

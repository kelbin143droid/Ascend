import React from "react";

interface SectographProps {
  stats: {
    strength: number;
    agility: number;
    sense: number;
    vitality: number;
  };
  maxStat?: number;
  size?: number;
  onCenterClick?: () => void;
}

export function Sectograph({ stats, maxStat = 100, size = 280, onCenterClick }: SectographProps) {
  const center = size / 2;
  const maxRadius = (size / 2) - 20;
  const rings = 5;
  
  const statConfig = [
    { key: 'strength', label: 'STR', color: '#ff6b6b', angle: -90 },
    { key: 'agility', label: 'AGI', color: '#4ecdc4', angle: 0 },
    { key: 'sense', label: 'SEN', color: '#ffe66d', angle: 90 },
    { key: 'vitality', label: 'VIT', color: '#a855f7', angle: 180 },
  ];

  const getStatValue = (key: string) => {
    return stats[key as keyof typeof stats] || 0;
  };

  const polarToCartesian = (angle: number, radius: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian),
    };
  };

  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(startAngle, radius);
    const end = polarToCartesian(endAngle, radius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-0">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {[...Array(rings)].map((_, i) => {
          const radius = (maxRadius / rings) * (i + 1);
          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="1"
              opacity={0.6}
            />
          );
        })}

        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const end = polarToCartesian(angle, maxRadius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#1a1a2e"
              strokeWidth="1"
              opacity={0.4}
            />
          );
        })}

        {statConfig.map((stat, index) => {
          const value = getStatValue(stat.key);
          const normalizedValue = Math.min(value / maxStat, 1);
          const arcRadius = maxRadius * normalizedValue;
          const startAngle = stat.angle - 40;
          const endAngle = stat.angle + 40;
          
          return (
            <g key={stat.key}>
              <path
                d={createArcPath(startAngle, endAngle, maxRadius)}
                fill="none"
                stroke="#2a2a4a"
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.3"
              />
              
              {arcRadius > 10 && (
                <path
                  d={createArcPath(startAngle, endAngle, arcRadius)}
                  fill="none"
                  stroke={stat.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  opacity="0.9"
                />
              )}
            </g>
          );
        })}

        <circle
          cx={center}
          cy={center}
          r={maxRadius * 0.35}
          fill="url(#centerGlow)"
          stroke="#00ffff"
          strokeWidth="2"
          opacity="0.5"
        />
        
        <circle
          cx={center}
          cy={center}
          r={maxRadius * 0.25}
          fill="#0a0a1a"
          stroke="#00ffff"
          strokeWidth="1"
          opacity="0.8"
        />
      </svg>

      <div 
        className="absolute inset-0 flex items-center justify-center"
      >
        <button
          data-testid="button-schedule"
          onClick={onCenterClick}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-primary/30 border-2 border-primary/50 flex items-center justify-center hover:scale-110 hover:border-primary transition-all cursor-pointer group"
          style={{ boxShadow: '0 0 20px rgba(168,85,247,0.3), inset 0 0 15px rgba(0,255,255,0.2)' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-8 h-8 text-primary group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
          </svg>
        </button>
      </div>

      {statConfig.map((stat) => {
        const labelRadius = maxRadius + 15;
        const pos = polarToCartesian(stat.angle, labelRadius);
        const value = getStatValue(stat.key);
        
        return (
          <div
            key={stat.key}
            className="absolute text-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: pos.x, 
              top: pos.y,
              pointerEvents: 'none'
            }}
          >
            <div 
              className="text-xs font-bold"
              style={{ color: stat.color, textShadow: `0 0 8px ${stat.color}` }}
            >
              {value}
            </div>
            <div className="text-[8px] text-muted-foreground tracking-wider">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}

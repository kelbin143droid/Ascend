import React, { useEffect, useState } from "react";
import { Award, Sparkles, Star } from "lucide-react";

const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes xpFloat {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    60% { opacity: 1; transform: translateY(-40px) scale(1.1); }
    100% { opacity: 0; transform: translateY(-70px) scale(0.9); }
  }
  @keyframes streakPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }
  @keyframes badgeEnter {
    0% { opacity: 0; transform: scale(0.3) rotate(-10deg); }
    60% { transform: scale(1.1) rotate(2deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes sparkleFloat {
    0% { opacity: 1; transform: translate(0, 0) scale(1); }
    100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(0); }
  }
  @keyframes statGlowPulse {
    0% { opacity: 0; box-shadow: 0 0 0px var(--glow-color); }
    50% { opacity: 1; box-shadow: 0 0 30px var(--glow-color), 0 0 60px var(--glow-color); }
    100% { opacity: 0; box-shadow: 0 0 0px var(--glow-color); }
  }
  @keyframes badgeOverlayFadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
`;
if (!document.querySelector("[data-micro-rewards-styles]")) {
  styleTag.setAttribute("data-micro-rewards-styles", "true");
  document.head.appendChild(styleTag);
}

interface XPPopupProps {
  amount: number;
  visible: boolean;
  onComplete: () => void;
}

export function XPPopup({ amount, visible, onComplete }: XPPopupProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onComplete, 1200);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div
      data-testid="xp-popup"
      className="fixed top-1/3 left-1/2 z-[110] pointer-events-none"
      style={{
        transform: "translateX(-50%)",
      }}
    >
      <div
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color: "#FFD700",
          fontSize: "1.75rem",
          fontWeight: 900,
          textShadow: "0 0 12px rgba(255, 215, 0, 0.6), 0 0 24px rgba(255, 215, 0, 0.3)",
          animation: "xpFloat 1.2s ease-out forwards",
          whiteSpace: "nowrap",
        }}
      >
        +{amount} XP
      </div>
    </div>
  );
}

interface StreakFireProps {
  streak: number;
}

export function StreakFire({ streak }: StreakFireProps) {
  if (streak < 1) return null;

  let size: string;
  let emoji: string;
  let label: string;

  if (streak >= 30) {
    size = "3rem";
    emoji = "🔥🔥🔥";
    label = "Epic Streak";
  } else if (streak >= 14) {
    size = "2.25rem";
    emoji = "🔥🔥";
    label = "Hot Streak";
  } else if (streak >= 7) {
    size = "1.75rem";
    emoji = "🔥";
    label = "Streak";
  } else {
    size = "1.25rem";
    emoji = "🔥";
    label = "Streak";
  }

  return (
    <div
      data-testid="streak-fire"
      className="inline-flex items-center gap-1.5"
      style={{
        animation: streak >= 7 ? "streakPulse 1.5s ease-in-out infinite" : undefined,
      }}
    >
      <span
        data-testid="streak-fire-emoji"
        style={{ fontSize: size, lineHeight: 1 }}
        role="img"
        aria-label={label}
      >
        {emoji}
      </span>
      <span
        data-testid="streak-fire-count"
        className="font-bold text-orange-400"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: streak >= 30 ? "1.1rem" : "0.85rem",
          textShadow: streak >= 14 ? "0 0 8px rgba(255, 165, 0, 0.5)" : undefined,
        }}
      >
        {streak}
      </span>
    </div>
  );
}

interface BadgeUnlockProps {
  badge: { name: string; description: string; badgeType: string } | null;
  onClose: () => void;
}

const sparklePositions = [
  { x: -60, y: -80 },
  { x: 70, y: -70 },
  { x: -80, y: 20 },
  { x: 80, y: 30 },
  { x: -40, y: 70 },
  { x: 50, y: 80 },
  { x: 0, y: -90 },
  { x: -70, y: -30 },
];

export function BadgeUnlock({ badge, onClose }: BadgeUnlockProps) {
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (badge) {
      const timer = setTimeout(() => setShowSparkles(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowSparkles(false);
    }
  }, [badge]);

  if (!badge) return null;

  return (
    <div
      data-testid="badge-unlock"
      className="fixed inset-0 z-[120] flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        animation: "badgeOverlayFadeIn 0.3s ease-out forwards",
      }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-4 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {showSparkles &&
          sparklePositions.map((pos, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                top: "50%",
                "--sx": `${pos.x}px`,
                "--sy": `${pos.y}px`,
                animation: `sparkleFloat ${0.8 + i * 0.1}s ease-out forwards`,
                animationDelay: `${i * 0.05}s`,
              } as React.CSSProperties}
            >
              <Sparkles className="text-yellow-400" size={14 + (i % 3) * 4} />
            </div>
          ))}

        <div
          data-testid="badge-unlock-icon"
          className="relative"
          style={{
            animation: "badgeEnter 0.6s ease-out forwards",
          }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #FFD700, #FFA500)",
              boxShadow: "0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)",
            }}
          >
            <Award className="text-gray-900" size={40} />
          </div>
        </div>

        <div
          className="text-xs tracking-[0.3em] uppercase"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: "#FFD700",
            textShadow: "0 0 10px rgba(255, 215, 0, 0.4)",
            animation: "badgeEnter 0.6s ease-out forwards",
            animationDelay: "0.15s",
            opacity: 0,
          }}
        >
          Badge Unlocked
        </div>

        <div
          data-testid="badge-unlock-name"
          className="text-xl font-bold text-white text-center"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            animation: "badgeEnter 0.6s ease-out forwards",
            animationDelay: "0.25s",
            opacity: 0,
          }}
        >
          {badge.name}
        </div>

        <div
          data-testid="badge-unlock-description"
          className="text-sm text-gray-400 text-center max-w-xs"
          style={{
            animation: "badgeEnter 0.6s ease-out forwards",
            animationDelay: "0.35s",
            opacity: 0,
          }}
        >
          {badge.description}
        </div>

        <div
          data-testid="badge-unlock-type"
          className="mt-2 px-3 py-1 rounded-full text-xs uppercase tracking-wider"
          style={{
            backgroundColor: "rgba(255, 215, 0, 0.15)",
            color: "#FFD700",
            border: "1px solid rgba(255, 215, 0, 0.3)",
            fontFamily: "'Orbitron', sans-serif",
            animation: "badgeEnter 0.6s ease-out forwards",
            animationDelay: "0.45s",
            opacity: 0,
          }}
        >
          {badge.badgeType}
        </div>

        <button
          data-testid="badge-unlock-close"
          className="mt-4 text-[10px] text-gray-500 tracking-wider uppercase cursor-pointer hover:text-gray-300 transition-colors"
          onClick={onClose}
          style={{
            animation: "badgeEnter 0.6s ease-out forwards",
            animationDelay: "0.8s",
            opacity: 0,
          }}
        >
          Tap to continue
        </button>
      </div>
    </div>
  );
}

interface StatGlowProps {
  stat: string;
  visible: boolean;
}

const statColors: Record<string, string> = {
  STR: "rgba(239, 68, 68, 0.6)",
  AGI: "rgba(34, 197, 94, 0.6)",
  SEN: "rgba(59, 130, 246, 0.6)",
  VIT: "rgba(168, 85, 247, 0.6)",
};

export function StatGlow({ stat, visible }: StatGlowProps) {
  if (!visible) return null;

  const glowColor = statColors[stat.toUpperCase()] || "rgba(255, 255, 255, 0.4)";

  return (
    <div
      data-testid={`stat-glow-${stat.toLowerCase()}`}
      className="absolute inset-0 rounded-lg pointer-events-none"
      style={{
        "--glow-color": glowColor,
        animation: "statGlowPulse 0.8s ease-in-out forwards",
      } as React.CSSProperties}
    />
  );
}

const STAT_BURST_COLORS: Record<string, string> = {
  strength: "#ef4444",
  agility: "#22c55e",
  sense: "#3b82f6",
  vitality: "#f59e0b",
};

interface TaskCompletionBurstProps {
  stat: string;
  xpEarned: number;
  celebrationLevel: "minimal" | "moderate" | "epic";
  visible: boolean;
  onComplete: () => void;
}

export function TaskCompletionBurst({ stat, xpEarned, celebrationLevel, visible, onComplete }: TaskCompletionBurstProps) {
  useEffect(() => {
    if (visible) {
      const duration = celebrationLevel === "epic" ? 2000 : celebrationLevel === "moderate" ? 1500 : 1000;
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, celebrationLevel, onComplete]);

  if (!visible) return null;

  const color = STAT_BURST_COLORS[stat] || "#ffffff";
  const ringCount = celebrationLevel === "epic" ? 3 : celebrationLevel === "moderate" ? 2 : 1;
  const glowSize = celebrationLevel === "epic" ? "120px" : celebrationLevel === "moderate" ? "80px" : "50px";

  return (
    <div
      data-testid="task-completion-burst"
      className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
    >
      {Array.from({ length: ringCount }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: glowSize,
            height: glowSize,
            border: `2px solid ${color}`,
            opacity: 0,
            animation: `statGlowPulse ${0.8 + i * 0.3}s ease-out forwards`,
            animationDelay: `${i * 0.15}s`,
            boxShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`,
            "--glow-color": color,
          } as React.CSSProperties}
        />
      ))}
      <div
        className="absolute"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color,
          fontSize: celebrationLevel === "epic" ? "1.5rem" : "1.1rem",
          fontWeight: 900,
          textShadow: `0 0 12px ${color}80`,
          animation: "xpFloat 1.2s ease-out forwards",
          animationDelay: "0.2s",
          opacity: 0,
        }}
      >
        +{xpEarned} XP
      </div>
    </div>
  );
}

interface StabilityShiftProps {
  direction: "up" | "down" | null;
  amount: number;
  visible: boolean;
  onComplete: () => void;
}

export function StabilityShift({ direction, amount, visible, onComplete }: StabilityShiftProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible || !direction) return null;

  const isUp = direction === "up";
  const color = isUp ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)";
  const textColor = isUp ? "#22c55e" : "#ef4444";
  const symbol = isUp ? "+" : "";

  return (
    <div
      data-testid="stability-shift"
      className="fixed inset-0 z-[95] pointer-events-none"
      style={{
        backgroundColor: color,
        animation: "badgeOverlayFadeIn 0.3s ease-out forwards",
      }}
    >
      <div
        className="absolute bottom-24 left-1/2 -translate-x-1/2"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.75rem",
          color: textColor,
          animation: "xpFloat 1.5s ease-out forwards",
        }}
      >
        <span data-testid="stability-shift-value">Stability {symbol}{amount}</span>
      </div>
    </div>
  );
}

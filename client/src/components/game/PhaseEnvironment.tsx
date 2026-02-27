import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Sparkles, Flame, Crown, Star, Zap } from "lucide-react";

interface PhaseEnvironmentProps {
  phase: number;
  stabilityScore: number;
  compact?: boolean;
}

const PHASE_CONFIGS = {
  1: {
    name: "Stabilization",
    bgGradient: "linear-gradient(135deg, #1a1f2e 0%, #1e2738 50%, #1a2233 100%)",
    particleColor: "#94a3b8",
    auraColor: "rgba(148, 163, 184, 0.15)",
    glowColor: "#94a3b8",
    borderColor: "#334155",
    icon: Shield,
    particleCount: 3,
    auraLayers: 0,
  },
  2: {
    name: "Foundation",
    bgGradient: "linear-gradient(135deg, #0f1f1a 0%, #132a1f 50%, #0f261a 100%)",
    particleColor: "#22c55e",
    auraColor: "rgba(34, 197, 94, 0.12)",
    glowColor: "#22c55e",
    borderColor: "#166534",
    icon: Sparkles,
    particleCount: 6,
    auraLayers: 1,
  },
  3: {
    name: "Expansion",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e2b4a 50%, #1a2744 100%)",
    particleColor: "#3b82f6",
    auraColor: "rgba(59, 130, 246, 0.12)",
    glowColor: "#3b82f6",
    borderColor: "#1d4ed8",
    icon: Zap,
    particleCount: 10,
    auraLayers: 2,
  },
  4: {
    name: "Optimization",
    bgGradient: "linear-gradient(135deg, #1a0f2e 0%, #2a1548 50%, #221240 100%)",
    particleColor: "#a855f7",
    auraColor: "rgba(168, 85, 247, 0.12)",
    glowColor: "#a855f7",
    borderColor: "#7c3aed",
    icon: Flame,
    particleCount: 15,
    auraLayers: 3,
  },
  5: {
    name: "Sovereignty",
    bgGradient: "linear-gradient(135deg, #1a1508 0%, #2a2210 50%, #221c0e 100%)",
    particleColor: "#ffd700",
    auraColor: "rgba(255, 215, 0, 0.1)",
    glowColor: "#ffd700",
    borderColor: "#b8860b",
    icon: Crown,
    particleCount: 20,
    auraLayers: 4,
  },
};

function getConfig(phase: number) {
  return PHASE_CONFIGS[phase as keyof typeof PHASE_CONFIGS] || PHASE_CONFIGS[1];
}

export function PhaseEnvironment({ phase, stabilityScore, compact = false }: PhaseEnvironmentProps) {
  const config = getConfig(phase);
  const Icon = config.icon;
  const stabilityFactor = Math.max(0.3, stabilityScore / 100);

  const particles = useMemo(() => {
    return Array.from({ length: config.particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
    }));
  }, [config.particleCount]);

  if (compact) {
    return (
      <div
        data-testid="phase-environment-compact"
        className="relative rounded-lg overflow-hidden p-3"
        style={{
          background: config.bgGradient,
          border: `1px solid ${config.borderColor}`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: `${config.auraColor}`,
              boxShadow: `0 0 ${12 * stabilityFactor}px ${config.glowColor}40`,
            }}
          >
            <Icon size={16} style={{ color: config.glowColor }} />
          </div>
          <div>
            <div className="text-[10px] font-display tracking-wider uppercase" style={{ color: config.glowColor }}>
              Phase {phase}
            </div>
            <div className="text-xs font-bold font-display" style={{ color: config.particleColor }}>
              {config.name}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: `${config.particleColor}80` }}>
              Stability
            </div>
            <div className="text-sm font-mono font-bold" style={{ color: config.particleColor }}>
              {stabilityScore}
            </div>
          </div>
        </div>

        {particles.slice(0, 5).map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: config.particleColor,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: 0.3 * stabilityFactor,
            }}
            animate={{
              y: [-5, 5, -5],
              opacity: [0.2 * stabilityFactor, 0.5 * stabilityFactor, 0.2 * stabilityFactor],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="phase-environment"
      className="relative rounded-xl overflow-hidden p-5"
      style={{
        background: config.bgGradient,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      {Array.from({ length: config.auraLayers }).map((_, i) => (
        <motion.div
          key={`aura-${i}`}
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${config.auraColor} 0%, transparent ${60 + i * 10}%)`,
          }}
          animate={{
            opacity: [0.3 * stabilityFactor, 0.6 * stabilityFactor, 0.3 * stabilityFactor],
            scale: [1, 1.02 + i * 0.01, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: config.particleColor,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 0.15 * stabilityFactor,
          }}
          animate={{
            y: [-8, 8, -8],
            x: [-3, 3, -3],
            opacity: [0.1 * stabilityFactor, 0.4 * stabilityFactor, 0.1 * stabilityFactor],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 flex items-center gap-4">
        <motion.div
          className="relative"
          animate={{
            boxShadow: [
              `0 0 ${10 * stabilityFactor}px ${config.glowColor}30`,
              `0 0 ${20 * stabilityFactor}px ${config.glowColor}50`,
              `0 0 ${10 * stabilityFactor}px ${config.glowColor}30`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(circle, ${config.auraColor} 0%, transparent 70%)`,
            border: `2px solid ${config.borderColor}`,
          }}
        >
          <Icon size={24} style={{ color: config.glowColor }} />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-display tracking-[0.2em] uppercase" style={{ color: `${config.particleColor}80` }}>
              Phase {phase}
            </span>
            <span className="text-lg font-display font-bold" style={{ color: config.particleColor }}>
              {config.name}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${config.borderColor}60` }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: config.glowColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stabilityScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            <span className="text-sm font-mono font-bold" style={{ color: config.particleColor }}>
              {stabilityScore}/100
            </span>
          </div>
          <div className="text-[10px] mt-0.5 tracking-wider" style={{ color: `${config.particleColor}60` }}>
            STABILITY SCORE
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhaseAuraEffect({ phase, stabilityScore }: { phase: number; stabilityScore: number }) {
  const config = getConfig(phase);
  const intensity = Math.max(0.1, (stabilityScore / 100) * 0.4);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-5"
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${config.glowColor}${Math.round(intensity * 15).toString(16).padStart(2, '0')} 0%, transparent 60%)`,
      }}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

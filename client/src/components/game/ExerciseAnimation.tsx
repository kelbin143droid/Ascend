import React from "react";

interface ExerciseAnimationProps {
  exerciseId: string;
  color: string;
  size?: number;
}

const BODY_COLOR = "rgba(255,255,255,0.85)";
const JOINT_COLOR = "rgba(255,255,255,0.6)";

function PushupAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 120" width={s} height={s * 0.6}>
      <style>{`
        @keyframes pushup {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(18px); }
        }
        .pushup-body { animation: pushup 2s ease-in-out infinite; }
      `}</style>
      <line x1="30" y1="100" x2="50" y2="100" stroke={JOINT_COLOR} strokeWidth="3" strokeLinecap="round" />
      <line x1="160" y1="100" x2="170" y2="100" stroke={JOINT_COLOR} strokeWidth="3" strokeLinecap="round" />
      <g className="pushup-body">
        <line x1="50" y1="60" x2="30" y2="100" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="60" x2="40" y2="100" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="60" x2="140" y2="55" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
        <line x1="140" y1="55" x2="160" y2="100" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="140" y1="55" x2="170" y2="100" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <circle cx="45" cy="48" r="10" fill={color} opacity="0.8" />
      </g>
      <text x="100" y="14" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">PUSH-UPS</text>
    </svg>
  );
}

function SquatAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 140" width={s} height={s * 0.7}>
      <style>{`
        @keyframes squat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
        .squat-body { animation: squat 2.5s ease-in-out infinite; }
      `}</style>
      <g className="squat-body">
        <circle cx="100" cy="20" r="10" fill={color} opacity="0.8" />
        <line x1="100" y1="30" x2="100" y2="65" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="65" x2="80" y2="95" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="65" x2="120" y2="95" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="95" x2="75" y2="115" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="120" y1="95" x2="125" y2="115" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="40" x2="75" y2="55" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="40" x2="125" y2="55" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="138" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">SQUATS</text>
    </svg>
  );
}

function PlankAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 100" width={s} height={s * 0.5}>
      <style>{`
        @keyframes plank-breathe {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(2px); }
        }
        .plank-body { animation: plank-breathe 3s ease-in-out infinite; }
      `}</style>
      <g className="plank-body">
        <circle cx="45" cy="38" r="9" fill={color} opacity="0.8" />
        <line x1="50" y1="45" x2="150" y2="48" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="45" x2="35" y2="75" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="35" y1="75" x2="35" y2="80" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="150" y1="48" x2="155" y2="80" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="150" y1="48" x2="165" y2="80" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="96" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">PLANK HOLD</text>
    </svg>
  );
}

function LungeAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 140" width={s} height={s * 0.7}>
      <style>{`
        @keyframes lunge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
        .lunge-body { animation: lunge 2.5s ease-in-out infinite; }
      `}</style>
      <g className="lunge-body">
        <circle cx="90" cy="18" r="10" fill={color} opacity="0.8" />
        <line x1="90" y1="28" x2="90" y2="60" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
        <line x1="90" y1="60" x2="60" y2="90" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="60" y1="90" x2="55" y2="115" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="90" y1="60" x2="125" y2="85" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="125" y1="85" x2="130" y2="115" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="90" y1="38" x2="70" y2="50" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="90" y1="38" x2="110" y2="50" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="136" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">LUNGES</text>
    </svg>
  );
}

function MountainClimberAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 110" width={s} height={s * 0.55}>
      <style>{`
        @keyframes climb-left {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(25px, -20px); }
        }
        @keyframes climb-right {
          0%, 100% { transform: translate(25px, -20px); }
          50% { transform: translate(0px, 0px); }
        }
        .climb-l { animation: climb-left 1s ease-in-out infinite; }
        .climb-r { animation: climb-right 1s ease-in-out infinite; }
      `}</style>
      <circle cx="48" cy="30" r="9" fill={color} opacity="0.8" />
      <line x1="55" y1="35" x2="120" y2="40" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
      <line x1="55" y1="35" x2="40" y2="70" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="70" x2="40" y2="78" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <g className="climb-l">
        <line x1="120" y1="40" x2="135" y2="80" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="climb-r">
        <line x1="120" y1="40" x2="155" y2="80" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="105" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace" opacity="0.6">MOUNTAIN CLIMBERS</text>
    </svg>
  );
}

function TricepDipAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 130" width={s} height={s * 0.65}>
      <style>{`
        @keyframes dip {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
        .dip-body { animation: dip 2s ease-in-out infinite; }
      `}</style>
      <rect x="25" y="55" width="150" height="6" rx="2" fill="rgba(255,255,255,0.15)" />
      <g className="dip-body">
        <circle cx="100" cy="25" r="10" fill={color} opacity="0.8" />
        <line x1="100" y1="35" x2="100" y2="60" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="45" x2="70" y2="58" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="45" x2="130" y2="58" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="60" x2="80" y2="95" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="60" x2="120" y2="95" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="95" x2="75" y2="115" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="120" y1="95" x2="125" y2="115" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="128" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">TRICEP DIPS</text>
    </svg>
  );
}

function GluteBridgeAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 100" width={s} height={s * 0.5}>
      <style>{`
        @keyframes bridge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .bridge-hips { animation: bridge 2s ease-in-out infinite; }
      `}</style>
      <line x1="140" y1="75" x2="160" y2="75" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <circle cx="155" cy="70" r="8" fill={color} opacity="0.8" />
      <line x1="145" y1="75" x2="100" y2="75" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
      <g className="bridge-hips">
        <line x1="100" y1="75" x2="80" y2="45" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
      </g>
      <line x1="80" y1="45" x2="55" y2="75" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <line x1="55" y1="75" x2="45" y2="75" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="45" x2="65" y2="75" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <line x1="65" y1="75" x2="55" y2="78" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <text x="100" y="96" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">GLUTE BRIDGES</text>
    </svg>
  );
}

function SupermanAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 100" width={s} height={s * 0.5}>
      <style>{`
        @keyframes superman-lift {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .superman-limbs { animation: superman-lift 2.5s ease-in-out infinite; }
      `}</style>
      <line x1="60" y1="60" x2="140" y2="60" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
      <g className="superman-limbs">
        <line x1="60" y1="60" x2="30" y2="45" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <circle cx="55" cy="50" r="9" fill={color} opacity="0.8" />
        <line x1="140" y1="60" x2="170" y2="45" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="140" y1="60" x2="165" y2="50" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="90" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">SUPERMAN HOLD</text>
    </svg>
  );
}

function BurpeeAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 140" width={s} height={s * 0.7}>
      <style>{`
        @keyframes burpee {
          0% { transform: translateY(0px) scaleY(1); }
          25% { transform: translateY(30px) scaleY(0.7); }
          50% { transform: translateY(30px) scaleY(0.7); }
          75% { transform: translateY(-10px) scaleY(1.05); }
          100% { transform: translateY(0px) scaleY(1); }
        }
        .burpee-body { animation: burpee 2s ease-in-out infinite; transform-origin: center bottom; }
      `}</style>
      <g className="burpee-body">
        <circle cx="100" cy="20" r="10" fill={color} opacity="0.8" />
        <line x1="100" y1="30" x2="100" y2="65" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="65" x2="80" y2="90" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="65" x2="120" y2="90" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="90" x2="78" y2="115" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="120" y1="90" x2="122" y2="115" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="40" x2="70" y2="30" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="40" x2="130" y2="30" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="136" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">BURPEES</text>
    </svg>
  );
}

function WallSitAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 130" width={s} height={s * 0.65}>
      <style>{`
        @keyframes wall-shake {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(1px); }
          75% { transform: translateX(-1px); }
        }
        .wall-sit-body { animation: wall-shake 0.5s ease-in-out infinite; }
      `}</style>
      <rect x="40" y="10" width="5" height="110" rx="1" fill="rgba(255,255,255,0.15)" />
      <g className="wall-sit-body">
        <circle cx="70" cy="25" r="10" fill={color} opacity="0.8" />
        <line x1="60" y1="35" x2="55" y2="65" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
        <line x1="55" y1="65" x2="85" y2="65" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="85" y1="65" x2="85" y2="95" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="55" y1="65" x2="75" y2="65" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="75" y1="65" x2="75" y2="95" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="55" y1="50" x2="75" y2="60" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="55" y1="50" x2="80" y2="55" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="126" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">WALL SIT</text>
    </svg>
  );
}

function CrunchAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 100" width={s} height={s * 0.5}>
      <style>{`
        @keyframes crunch {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-25deg); }
        }
        .crunch-upper { animation: crunch 2s ease-in-out infinite; transform-origin: 100px 70px; }
      `}</style>
      <line x1="100" y1="70" x2="60" y2="80" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="80" x2="40" y2="75" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="70" x2="70" y2="80" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="80" x2="50" y2="78" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      <g className="crunch-upper">
        <line x1="100" y1="70" x2="150" y2="70" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
        <circle cx="155" cy="65" r="9" fill={color} opacity="0.8" />
        <line x1="130" y1="70" x2="140" y2="50" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="130" y1="70" x2="145" y2="55" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="96" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">CRUNCHES</text>
    </svg>
  );
}

function JumpingJackAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 140" width={s} height={s * 0.7}>
      <style>{`
        @keyframes jj-arms {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-45deg); }
        }
        @keyframes jj-arms-r {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(45deg); }
        }
        @keyframes jj-legs {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(-10px); }
        }
        @keyframes jj-legs-r {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(10px); }
        }
        .jj-arm-l { animation: jj-arms 1s ease-in-out infinite; transform-origin: 100px 45px; }
        .jj-arm-r { animation: jj-arms-r 1s ease-in-out infinite; transform-origin: 100px 45px; }
        .jj-leg-l { animation: jj-legs 1s ease-in-out infinite; }
        .jj-leg-r { animation: jj-legs-r 1s ease-in-out infinite; }
      `}</style>
      <circle cx="100" cy="20" r="10" fill={color} opacity="0.8" />
      <line x1="100" y1="30" x2="100" y2="70" stroke={BODY_COLOR} strokeWidth="4" strokeLinecap="round" />
      <g className="jj-arm-l">
        <line x1="100" y1="45" x2="70" y2="55" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="jj-arm-r">
        <line x1="100" y1="45" x2="130" y2="55" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="jj-leg-l">
        <line x1="100" y1="70" x2="80" y2="100" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="100" x2="78" y2="118" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="jj-leg-r">
        <line x1="100" y1="70" x2="120" y2="100" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
        <line x1="120" y1="100" x2="122" y2="118" stroke={BODY_COLOR} strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="100" y="136" textAnchor="middle" fill={color} fontSize="10" fontFamily="monospace" opacity="0.6">JUMPING JACKS</text>
    </svg>
  );
}

function RestAnimation({ color, size }: { color: string; size: number }) {
  const s = size;
  return (
    <svg viewBox="0 0 200 120" width={s} height={s * 0.6}>
      <style>{`
        @keyframes breathe {
          0%, 100% { r: 30; opacity: 0.15; }
          50% { r: 40; opacity: 0.25; }
        }
        @keyframes breathe-inner {
          0%, 100% { r: 15; opacity: 0.3; }
          50% { r: 20; opacity: 0.5; }
        }
        .breath-outer { animation: breathe 4s ease-in-out infinite; }
        .breath-inner { animation: breathe-inner 4s ease-in-out infinite; }
      `}</style>
      <circle cx="100" cy="55" r="30" fill={color} opacity="0.15" className="breath-outer" />
      <circle cx="100" cy="55" r="15" fill={color} opacity="0.3" className="breath-inner" />
      <text x="100" y="58" textAnchor="middle" fill={BODY_COLOR} fontSize="12" fontFamily="monospace">REST</text>
      <text x="100" y="105" textAnchor="middle" fill={color} fontSize="9" fontFamily="monospace" opacity="0.5">BREATHE & RECOVER</text>
    </svg>
  );
}

const ANIMATION_MAP: Record<string, React.FC<{ color: string; size: number }>> = {
  pushups: PushupAnimation,
  squats: SquatAnimation,
  plank: PlankAnimation,
  lunges: LungeAnimation,
  mountain_climbers: MountainClimberAnimation,
  tricep_dips: TricepDipAnimation,
  glute_bridges: GluteBridgeAnimation,
  superman: SupermanAnimation,
  burpees: BurpeeAnimation,
  wall_sit: WallSitAnimation,
  crunches: CrunchAnimation,
  jumping_jacks: JumpingJackAnimation,
};

export function ExerciseAnimation({ exerciseId, color, size = 180 }: ExerciseAnimationProps) {
  const AnimComponent = ANIMATION_MAP[exerciseId];

  if (!AnimComponent) {
    return <RestAnimation color={color} size={size} />;
  }

  return (
    <div className="flex items-center justify-center" data-testid={`exercise-anim-${exerciseId}`}>
      <AnimComponent color={color} size={size} />
    </div>
  );
}

export function RestAnimationComponent({ color, size = 180 }: { color: string; size?: number }) {
  return (
    <div className="flex items-center justify-center" data-testid="exercise-anim-rest">
      <RestAnimation color={color} size={size} />
    </div>
  );
}

import React from "react";
import { resolveActionId, getAnimationMeta, type AnimationRendererProps } from "@/lib/animationRegistry";

interface ExerciseAnimationProps {
  exerciseId: string;
  color: string;
  size?: number;
}

const SIL = "rgba(255,255,255,0.9)";
const SIL_DIM = "rgba(255,255,255,0.5)";

function Head({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={SIL} />
      <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
    </>
  );
}

function Glow({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return <circle cx={cx} cy={cy} r={r} fill={color} opacity="0.08" />;
}

function StrPushups({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 110" width={s} height={s * 0.55}>
      <defs>
        <filter id="glow-pu"><feGaussianBlur stdDeviation="3" /><feComposite in="SourceGraphic" /></filter>
      </defs>
      <style>{`
        @keyframes pu-move { 0%,100%{transform:translateY(0)} 40%{transform:translateY(16px)} 60%{transform:translateY(16px)} }
        .pu-g{animation:pu-move 2.4s ease-in-out infinite}
      `}</style>
      <Glow cx={100} cy={60} r={55} color={c} />
      <line x1="25" y1="88" x2="45" y2="88" stroke={SIL_DIM} strokeWidth="4" strokeLinecap="round" />
      <line x1="155" y1="88" x2="175" y2="88" stroke={SIL_DIM} strokeWidth="4" strokeLinecap="round" />
      <g className="pu-g">
        <path d="M45,50 Q50,48 55,50 L140,46 Q145,44 148,46" stroke={SIL} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M55,50 L42,55 L30,88" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M55,50 L46,57 L38,88" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M140,46 L150,65 L155,88" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M140,46 L152,60 L165,88" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Head cx={42} cy={40} r={9} color={c} />
        <circle cx={90} cy={48} r={3} fill={c} opacity="0.4" />
      </g>
    </svg>
  );
}

function StrSquats({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 160" width={s} height={s}>
      <style>{`
        @keyframes sq-move { 0%,100%{transform:translateY(0)} 35%{transform:translateY(28px)} 65%{transform:translateY(28px)} }
        @keyframes sq-knees { 0%,100%{d:path("M80,88 L68,118 L65,145")} 35%,65%{d:path("M80,88 L55,105 L50,130")} }
        .sq-g{animation:sq-move 2.8s ease-in-out infinite}
      `}</style>
      <Glow cx={80} cy={80} r={55} color={c} />
      <g className="sq-g">
        <Head cx={80} cy={18} r={10} color={c} />
        <path d="M80,28 L80,55" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <path d="M80,55 L80,88" stroke={SIL} strokeWidth="6" strokeLinecap="round" />
        <path d="M80,40 L60,55 L55,48" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,40 L100,55 L105,48" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,88 L68,118 L65,145" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,88 L92,118 L95,145" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={80} cy={55} r={4} fill={c} opacity="0.3" />
      </g>
    </svg>
  );
}

function StrPlank({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 90" width={s} height={s * 0.45}>
      <style>{`
        @keyframes pl-breathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(2px)} }
        @keyframes pl-glow { 0%,100%{opacity:0.08} 50%{opacity:0.15} }
        .pl-g{animation:pl-breathe 3s ease-in-out infinite}
        .pl-glo{animation:pl-glow 3s ease-in-out infinite}
      `}</style>
      <Glow cx={100} cy={50} r={55} color={c} />
      <g className="pl-g">
        <Head cx={42} cy={30} r={9} color={c} />
        <path d="M48,37 Q95,40 155,42" stroke={SIL} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M48,37 L38,55 L36,72" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M155,42 L160,72" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M155,42 L170,72" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx={100} cy={42} rx={20} ry={8} fill={c} opacity="0.08" className="pl-glo" />
      </g>
    </svg>
  );
}

function StrLunges({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 160" width={s} height={s}>
      <style>{`
        @keyframes lu-dip { 0%,100%{transform:translateY(0)} 40%{transform:translateY(18px)} 60%{transform:translateY(18px)} }
        .lu-g{animation:lu-dip 2.6s ease-in-out infinite}
      `}</style>
      <Glow cx={80} cy={80} r={55} color={c} />
      <g className="lu-g">
        <Head cx={75} cy={16} r={10} color={c} />
        <path d="M75,26 L75,60" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <path d="M75,60 L55,90 L48,125" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M75,60 L100,85 L110,125" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M75,38 L58,48" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M75,38 L92,48" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <circle cx={75} cy={60} r={3} fill={c} opacity="0.4" />
      </g>
    </svg>
  );
}

function StrMountainClimbers({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 100" width={s} height={s * 0.5}>
      <style>{`
        @keyframes mc-l { 0%,100%{transform:translate(0,0)} 50%{transform:translate(22px,-18px)} }
        @keyframes mc-r { 0%,100%{transform:translate(22px,-18px)} 50%{transform:translate(0,0)} }
        .mc-ll{animation:mc-l 1.2s ease-in-out infinite}
        .mc-rr{animation:mc-r 1.2s ease-in-out infinite}
      `}</style>
      <Glow cx={100} cy={50} r={50} color={c} />
      <Head cx={42} cy={25} r={9} color={c} />
      <path d="M48,32 L125,38" stroke={SIL} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M48,32 L35,55 L35,68" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g className="mc-ll">
        <path d="M125,38 L140,68 L145,78" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="mc-rr">
        <path d="M125,38 L155,65 L162,78" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx={85} cy={36} r={3} fill={c} opacity="0.4" />
    </svg>
  );
}

function StrTricepDips({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 140" width={s} height={s * 0.875}>
      <style>{`
        @keyframes td-dip { 0%,100%{transform:translateY(0)} 40%{transform:translateY(18px)} 60%{transform:translateY(18px)} }
        .td-g{animation:td-dip 2.4s ease-in-out infinite}
      `}</style>
      <Glow cx={80} cy={70} r={50} color={c} />
      <rect x={20} y={52} width={120} height={5} rx={2} fill="rgba(255,255,255,0.12)" />
      <g className="td-g">
        <Head cx={80} cy={18} r={10} color={c} />
        <path d="M80,28 L80,55" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <path d="M80,42 L58,55" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M80,42 L102,55" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M80,55 L70,85 L68,115" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,55 L90,85 L92,115" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={80} cy={42} r={3} fill={c} opacity="0.4" />
      </g>
    </svg>
  );
}

function StrGluteBridges({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 90" width={s} height={s * 0.45}>
      <style>{`
        @keyframes gb-lift { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-14px)} 60%{transform:translateY(-14px)} }
        .gb-g{animation:gb-lift 2.4s ease-in-out infinite}
      `}</style>
      <Glow cx={100} cy={50} r={50} color={c} />
      <Head cx={155} cy={58} r={8} color={c} />
      <path d="M148,62 L110,65" stroke={SIL} strokeWidth="6" strokeLinecap="round" />
      <g className="gb-g">
        <path d="M110,65 L88,35" stroke={SIL} strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx={95} cy={48} r={3} fill={c} opacity="0.5" />
      </g>
      <path d="M88,35 L65,65 L55,68" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M88,35 L72,62 L62,72" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StrSuperman({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 85" width={s} height={s * 0.425}>
      <style>{`
        @keyframes sm-lift { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-10px)} 60%{transform:translateY(-10px)} }
        .sm-g{animation:sm-lift 3s ease-in-out infinite}
      `}</style>
      <Glow cx={100} cy={45} r={50} color={c} />
      <path d="M55,55 L145,55" stroke={SIL} strokeWidth="7" fill="none" strokeLinecap="round" />
      <g className="sm-g">
        <Head cx={48} cy={42} r={9} color={c} />
        <path d="M55,55 L30,38" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M145,55 L172,38" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M145,55 L168,42" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx={100} cy={45} rx={30} ry={6} fill={c} opacity="0.1" />
      </g>
    </svg>
  );
}

function StrBurpees({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 155" width={s} height={s * 0.97}>
      <style>{`
        @keyframes bp-phase {
          0%{transform:translateY(0) scaleY(1)}
          20%{transform:translateY(25px) scaleY(0.75)}
          50%{transform:translateY(25px) scaleY(0.75)}
          70%{transform:translateY(-8px) scaleY(1.02)}
          100%{transform:translateY(0) scaleY(1)}
        }
        .bp-g{animation:bp-phase 2.8s ease-in-out infinite;transform-origin:80px 140px}
      `}</style>
      <Glow cx={80} cy={75} r={55} color={c} />
      <g className="bp-g">
        <Head cx={80} cy={18} r={10} color={c} />
        <path d="M80,28 L80,65" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <path d="M80,65 L65,95 L63,125" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,65 L95,95 L97,125" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,40 L58,28" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M80,40 L102,28" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <circle cx={80} cy={65} r={3} fill={c} opacity="0.4" />
      </g>
    </svg>
  );
}

function StrWallSit({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 140 130" width={s} height={s * 0.93}>
      <style>{`
        @keyframes ws-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(0.8px)} 75%{transform:translateX(-0.8px)} }
        @keyframes ws-glow { 0%,100%{opacity:0.08} 50%{opacity:0.18} }
        .ws-g{animation:ws-shake 0.6s ease-in-out infinite}
        .ws-glo{animation:ws-glow 2s ease-in-out infinite}
      `}</style>
      <rect x={32} y={8} width={5} height={115} rx={2} fill="rgba(255,255,255,0.1)" />
      <Glow cx={75} cy={60} r={45} color={c} />
      <g className="ws-g">
        <Head cx={58} cy={20} r={10} color={c} />
        <path d="M52,30 L48,60" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <path d="M48,60 L75,60" stroke={SIL} strokeWidth="6" strokeLinecap="round" />
        <path d="M75,60 L78,90" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M48,60 L65,60 L68,90" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M48,45 L68,52" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M48,45 L72,48" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <ellipse cx={65} cy={60} rx={12} ry={5} fill={c} className="ws-glo" />
      </g>
    </svg>
  );
}

function StrCrunches({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 90" width={s} height={s * 0.45}>
      <style>{`
        @keyframes cr-curl { 0%,100%{transform:rotate(0deg)} 40%{transform:rotate(-22deg)} 60%{transform:rotate(-22deg)} }
        .cr-g{animation:cr-curl 2.2s ease-in-out infinite;transform-origin:100px 62px}
      `}</style>
      <Glow cx={100} cy={50} r={50} color={c} />
      <path d="M100,62 L60,72 L40,68" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100,62 L68,72 L48,70" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g className="cr-g">
        <path d="M100,62 L150,62" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <Head cx={158} cy={55} r={9} color={c} />
        <path d="M130,62 L138,45" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M130,62 L142,48" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <circle cx={115} cy={60} r={3} fill={c} opacity="0.4" />
      </g>
    </svg>
  );
}

function StrJumpingJacks({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 155" width={s} height={s * 0.97}>
      <style>{`
        @keyframes jj-arm-l2 { 0%,100%{d:path("M80,42 L60,52")} 50%{d:path("M80,42 L55,22")} }
        @keyframes jj-arm-r2 { 0%,100%{d:path("M80,42 L100,52")} 50%{d:path("M80,42 L105,22")} }
        @keyframes jj-leg-l2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-12px)} }
        @keyframes jj-leg-r2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(12px)} }
        .jj-al{animation:jj-arm-l2 1.2s ease-in-out infinite}
        .jj-ar{animation:jj-arm-r2 1.2s ease-in-out infinite}
        .jj-ll{animation:jj-leg-l2 1.2s ease-in-out infinite}
        .jj-lr{animation:jj-leg-r2 1.2s ease-in-out infinite}
      `}</style>
      <Glow cx={80} cy={75} r={55} color={c} />
      <Head cx={80} cy={16} r={10} color={c} />
      <path d="M80,26 L80,68" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
      <path d="M80,42 L60,52" stroke={SIL} strokeWidth="5" strokeLinecap="round" className="jj-al" />
      <path d="M80,42 L100,52" stroke={SIL} strokeWidth="5" strokeLinecap="round" className="jj-ar" />
      <g className="jj-ll">
        <path d="M80,68 L68,100 L65,130" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="jj-lr">
        <path d="M80,68 L92,100 L95,130" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function AgiForwardFold({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 140" width={s} height={s * 0.875}>
      <style>{`
        @keyframes ff-fold { 0%,100%{transform:rotate(0deg)} 45%{transform:rotate(-50deg)} 55%{transform:rotate(-50deg)} }
        .ff-g{animation:ff-fold 3s ease-in-out infinite;transform-origin:80px 75px}
      `}</style>
      <Glow cx={80} cy={70} r={50} color={c} />
      <path d="M80,75 L68,110 L65,135" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M80,75 L92,110 L95,135" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g className="ff-g">
        <path d="M80,75 L80,38" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <Head cx={80} cy={26} r={10} color={c} />
        <path d="M80,48 L60,58" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M80,48 L100,58" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function AgiCatCow({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 100" width={s} height={s * 0.5}>
      <style>{`
        @keyframes cc-spine { 0%,100%{d:path("M55,50 Q100,35 145,50")} 50%{d:path("M55,50 Q100,65 145,50")} }
        .cc-sp{animation:cc-spine 3.2s ease-in-out infinite}
      `}</style>
      <Glow cx={100} cy={55} r={50} color={c} />
      <path d="M55,50 L50,78" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <path d="M55,50 L60,78" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <path d="M145,50 L140,78" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <path d="M145,50 L150,78" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <path d="M55,50 Q100,35 145,50" stroke={SIL} strokeWidth="7" fill="none" strokeLinecap="round" className="cc-sp" />
      <Head cx={48} cy={42} r={8} color={c} />
    </svg>
  );
}

function AgiDownwardDog({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 110" width={s} height={s * 0.55}>
      <style>{`
        @keyframes dd-breathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        .dd-g{animation:dd-breathe 3s ease-in-out infinite}
      `}</style>
      <Glow cx={100} cy={55} r={50} color={c} />
      <g className="dd-g">
        <path d="M50,85 L100,25 L155,85" stroke={SIL} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50,85 L45,92" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M50,85 L55,92" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M155,85 L150,92" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M155,85 L160,92" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <Head cx={48} cy={80} r={8} color={c} />
      </g>
    </svg>
  );
}

function AgiWarriorFlow({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 140" width={s} height={s * 0.7}>
      <style>{`
        @keyframes wf-arms { 0%,100%{d:path("M100,55 L55,45")} 50%{d:path("M100,55 L55,55")} }
        @keyframes wf-arms-r { 0%,100%{d:path("M100,55 L145,45")} 50%{d:path("M100,55 L145,55")} }
        .wf-al{animation:wf-arms 3.5s ease-in-out infinite}
        .wf-ar{animation:wf-arms-r 3.5s ease-in-out infinite}
      `}</style>
      <Glow cx={100} cy={70} r={55} color={c} />
      <Head cx={100} cy={20} r={10} color={c} />
      <path d="M100,30 L100,75" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
      <path d="M100,55 L55,45" stroke={SIL} strokeWidth="5" strokeLinecap="round" className="wf-al" />
      <path d="M100,55 L145,45" stroke={SIL} strokeWidth="5" strokeLinecap="round" className="wf-ar" />
      <path d="M100,75 L70,110 L60,130" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100,75 L130,100 L135,130" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AgiCobraStretch({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 200 90" width={s} height={s * 0.45}>
      <style>{`
        @keyframes co-lift { 0%,100%{transform:rotate(0deg)} 40%{transform:rotate(-18deg)} 60%{transform:rotate(-18deg)} }
        .co-g{animation:co-lift 3s ease-in-out infinite;transform-origin:110px 65px}
      `}</style>
      <Glow cx={100} cy={50} r={50} color={c} />
      <path d="M110,65 L155,68" stroke={SIL} strokeWidth="6" strokeLinecap="round" />
      <path d="M155,68 L162,72" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <path d="M155,68 L168,72" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <g className="co-g">
        <path d="M110,65 L70,55" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <Head cx={62} cy={48} r={9} color={c} />
        <path d="M90,60 L85,72" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M90,60 L95,72" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function AgiButterfly({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 130" width={s} height={s * 0.81}>
      <style>{`
        @keyframes bf-knees { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-15deg)} }
        @keyframes bf-knees-r { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(15deg)} }
        .bf-kl{animation:bf-knees 3s ease-in-out infinite;transform-origin:70px 85px}
        .bf-kr{animation:bf-knees-r 3s ease-in-out infinite;transform-origin:90px 85px}
      `}</style>
      <Glow cx={80} cy={60} r={50} color={c} />
      <Head cx={80} cy={18} r={10} color={c} />
      <path d="M80,28 L80,72" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
      <path d="M80,42 L62,52" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <path d="M80,42 L98,52" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <g className="bf-kl">
        <path d="M80,72 L55,88 L40,105" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="bf-kr">
        <path d="M80,72 L105,88 L120,105" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <ellipse cx={80} cy={95} rx={8} ry={4} fill={c} opacity="0.15" />
    </svg>
  );
}

function SenBreathAwareness({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 140" width={s} height={s * 0.875}>
      <style>{`
        @keyframes ba-outer { 0%,100%{r:42;opacity:0.06} 50%{r:52;opacity:0.14} }
        @keyframes ba-mid { 0%,100%{r:25;opacity:0.12} 50%{r:32;opacity:0.22} }
        @keyframes ba-inner { 0%,100%{r:10;opacity:0.25} 50%{r:15;opacity:0.45} }
        @keyframes ba-body { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }
        .ba-o{animation:ba-outer 4s ease-in-out infinite}
        .ba-m{animation:ba-mid 4s ease-in-out infinite}
        .ba-i{animation:ba-inner 4s ease-in-out infinite}
        .ba-b{animation:ba-body 4s ease-in-out infinite;transform-origin:80px 50px}
      `}</style>
      <circle cx={80} cy={55} r={42} fill={c} className="ba-o" />
      <circle cx={80} cy={55} r={25} fill={c} className="ba-m" />
      <circle cx={80} cy={55} r={10} fill={c} className="ba-i" />
      <g className="ba-b">
        <Head cx={80} cy={22} r={10} color={c} />
        <path d="M80,32 L80,70" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <path d="M80,70 L60,100 L55,115" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,70 L100,100 L105,115" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,48 L60,65" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M80,48 L100,65" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function SenBodyScan({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 150" width={s} height={s * 0.94}>
      <style>{`
        @keyframes bs-scan { 0%{transform:translateY(-20px);opacity:0} 20%{opacity:0.5} 80%{opacity:0.5} 100%{transform:translateY(95px);opacity:0} }
        .bs-line{animation:bs-scan 5s ease-in-out infinite}
      `}</style>
      <Glow cx={80} cy={70} r={55} color={c} />
      <Head cx={80} cy={18} r={10} color={c} />
      <path d="M80,28 L80,72" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
      <path d="M80,72 L65,105 L62,130" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M80,72 L95,105 L98,130" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M80,45 L58,60" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <path d="M80,45 L102,60" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      <rect x={40} y={15} width={80} height={4} rx={2} fill={c} opacity="0.4" className="bs-line" />
    </svg>
  );
}

function SenVisualization({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 140" width={s} height={s * 0.875}>
      <style>{`
        @keyframes vi-orb { 0%,100%{r:5;opacity:0.6} 50%{r:12;opacity:0.2} }
        @keyframes vi-orb2 { 0%,100%{r:8;opacity:0.3} 50%{r:4;opacity:0.7} }
        @keyframes vi-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .vi-o1{animation:vi-orb 4s ease-in-out infinite}
        .vi-o2{animation:vi-orb2 4s ease-in-out infinite}
        .vi-f{animation:vi-float 4s ease-in-out infinite}
      `}</style>
      <Glow cx={80} cy={70} r={55} color={c} />
      <g className="vi-f">
        <Head cx={80} cy={30} r={10} color={c} />
        <path d="M80,40 L80,80" stroke={SIL} strokeWidth="7" strokeLinecap="round" />
        <path d="M80,80 L62,108 L58,125" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,80 L98,108 L102,125" stroke={SIL} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80,55 L60,70" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
        <path d="M80,55 L100,70" stroke={SIL} strokeWidth="5" strokeLinecap="round" />
      </g>
      <circle cx={55} cy={20} r={5} fill={c} className="vi-o1" />
      <circle cx={110} cy={15} r={8} fill={c} className="vi-o2" />
      <circle cx={42} cy={38} r={4} fill={c} className="vi-o2" />
      <circle cx={118} cy={35} r={6} fill={c} className="vi-o1" />
    </svg>
  );
}

function RestBreathe({ accentColor: c, size: s }: AnimationRendererProps) {
  return (
    <svg viewBox="0 0 160 120" width={s} height={s * 0.75}>
      <style>{`
        @keyframes rb-outer { 0%,100%{r:35;opacity:0.06} 50%{r:48;opacity:0.15} }
        @keyframes rb-inner { 0%,100%{r:18;opacity:0.15} 50%{r:25;opacity:0.35} }
        @keyframes rb-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .rb-o{animation:rb-outer 4s ease-in-out infinite}
        .rb-i{animation:rb-inner 4s ease-in-out infinite}
        .rb-t{animation:rb-pulse 4s ease-in-out infinite}
      `}</style>
      <circle cx={80} cy={52} r={35} fill={c} className="rb-o" />
      <circle cx={80} cy={52} r={18} fill={c} className="rb-i" />
      <text x={80} y={56} textAnchor="middle" fill={SIL} fontSize="11" fontFamily="monospace" className="rb-t">REST</text>
      <text x={80} y={108} textAnchor="middle" fill={c} fontSize="9" fontFamily="monospace" opacity="0.5">BREATHE &amp; RECOVER</text>
    </svg>
  );
}

const RENDERER_MAP: Record<string, React.FC<AnimationRendererProps>> = {
  str_pushups: StrPushups,
  str_squats: StrSquats,
  str_plank: StrPlank,
  str_lunges: StrLunges,
  str_mountain_climbers: StrMountainClimbers,
  str_tricep_dips: StrTricepDips,
  str_glute_bridges: StrGluteBridges,
  str_superman: StrSuperman,
  str_burpees: StrBurpees,
  str_wall_sit: StrWallSit,
  str_crunches: StrCrunches,
  str_jumping_jacks: StrJumpingJacks,
  agi_forward_fold: AgiForwardFold,
  agi_cat_cow: AgiCatCow,
  agi_downward_dog: AgiDownwardDog,
  agi_warrior_flow: AgiWarriorFlow,
  agi_cobra_stretch: AgiCobraStretch,
  agi_butterfly: AgiButterfly,
  sen_breath_awareness: SenBreathAwareness,
  sen_body_scan: SenBodyScan,
  sen_visualization: SenVisualization,
  rest_breathe: RestBreathe,
};

export function ExerciseAnimation({ exerciseId, color, size = 180 }: ExerciseAnimationProps) {
  const actionId = resolveActionId(exerciseId);
  const meta = getAnimationMeta(actionId);
  const Renderer = RENDERER_MAP[actionId];

  if (!Renderer || !meta) {
    return (
      <div className="flex items-center justify-center" data-testid="exercise-anim-fallback">
        <RestBreathe meta={{ actionId: "rest_breathe", name: "Rest", stat: "vitality", muscleGroup: "recovery", difficulty: "beginner", loopDurationMs: 4000, loopable: true, rendererType: "svg-silhouette", tags: ["rest"] }} accentColor={color} size={size} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" data-testid={`exercise-anim-${actionId}`}>
      <Renderer meta={meta} accentColor={color} size={size} />
    </div>
  );
}

export function RestAnimationComponent({ color, size = 180 }: { color: string; size?: number }) {
  const meta = getAnimationMeta("rest_breathe")!;
  return (
    <div className="flex items-center justify-center" data-testid="exercise-anim-rest">
      <RestBreathe meta={meta || { actionId: "rest_breathe", name: "Rest", stat: "vitality", muscleGroup: "recovery", difficulty: "beginner", loopDurationMs: 4000, loopable: true, rendererType: "svg-silhouette", tags: ["rest"] }} accentColor={color} size={size} />
    </div>
  );
}

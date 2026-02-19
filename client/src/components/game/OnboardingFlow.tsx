import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

interface OnboardingSlide {
  id: string;
  headline: string;
  body: React.ReactNode;
  subtext?: string;
  visual?: React.ReactNode;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
  playerName?: string;
}

function MiniSectograph() {
  const size = 180;
  const center = size / 2;
  const outerR = center - 10;
  const innerR = outerR * 0.55;

  const blocks = [
    { name: "Sleep", start: 22, end: 6, color: "#3b4d6b" },
    { name: "Training", start: 6, end: 8, color: "#c97b63" },
    { name: "Focus Work", start: 9, end: 12, color: "#4a6fa5" },
    { name: "Recovery", start: 13, end: 14, color: "#7d9d6a" },
    { name: "Deep Work", start: 14, end: 17, color: "#4a6fa5" },
    { name: "Meditation", start: 20, end: 21, color: "#8b7aa3" },
  ];

  const toAngle = (h: number) => ((h % 24) / 24) * 360 - 90;

  const arcPath = (startH: number, endH: number, oR: number, iR: number) => {
    let sa = toAngle(startH);
    let ea = toAngle(endH);
    if (ea <= sa) ea += 360;
    const sar = (sa * Math.PI) / 180;
    const ear = (ea * Math.PI) / 180;
    const large = ea - sa > 180 ? 1 : 0;
    const ox1 = center + oR * Math.cos(sar);
    const oy1 = center + oR * Math.sin(sar);
    const ox2 = center + oR * Math.cos(ear);
    const oy2 = center + oR * Math.sin(ear);
    const ix1 = center + iR * Math.cos(ear);
    const iy1 = center + iR * Math.sin(ear);
    const ix2 = center + iR * Math.cos(sar);
    const iy2 = center + iR * Math.sin(sar);
    return `M${ox1},${oy1} A${oR},${oR} 0 ${large} 1 ${ox2},${oy2} L${ix1},${iy1} A${iR},${iR} 0 ${large} 0 ${ix2},${iy2} Z`;
  };

  return (
    <div className="relative">
      <svg width={size} height={size}>
        <circle cx={center} cy={center} r={outerR} fill="#0a0f1a" stroke="#1e3a5f" strokeWidth="1" />
        <circle cx={center} cy={center} r={innerR} fill="#060b14" stroke="#1e3a5f" strokeWidth="0.5" />
        {blocks.map((b, i) => (
          <motion.path
            key={b.name}
            d={arcPath(b.start, b.end, outerR - 2, innerR + 2)}
            fill={b.color}
            opacity={0.6}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
          />
        ))}
        {[0, 6, 12, 18].map((h) => {
          const a = (toAngle(h) * Math.PI) / 180;
          const r = outerR - 20;
          return (
            <text
              key={h}
              x={center + r * Math.cos(a)}
              y={center + r * Math.sin(a)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.4)"
              style={{ fontSize: "9px", fontFamily: "var(--font-mono)" }}
            >
              {h === 0 || h === 12 ? "12" : "6"}
            </text>
          );
        })}
      </svg>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: "1px solid rgba(0,200,255,0.15)" }}
        animate={{ boxShadow: ["0 0 15px rgba(0,200,255,0.05)", "0 0 25px rgba(0,200,255,0.15)", "0 0 15px rgba(0,200,255,0.05)"] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
}

function StatBar({ label, sublabel, value, color, delay }: { label: string; sublabel: string; value: number; color: string; delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="w-12 text-right">
        <div className="text-xs font-display tracking-widest" style={{ color }}>{label}</div>
        <div className="text-[9px] text-white/40">{sublabel}</div>
      </div>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="text-xs font-mono text-white/50 w-6 text-right">{Math.round(value * 0.3)}</div>
    </motion.div>
  );
}

function PhaseLadder() {
  const phases = [
    { num: 1, label: "Foundation", cap: 30 },
    { num: 2, label: "Development", cap: 60 },
    { num: 3, label: "Refinement", cap: 80 },
    { num: 4, label: "Mastery", cap: 100 },
    { num: 5, label: "Transcendence", cap: 120 },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      {[...phases].reverse().map((p, i) => (
        <motion.div
          key={p.num}
          className="flex items-center gap-3 w-full max-w-[220px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
        >
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-display font-bold border"
            style={{
              borderColor: p.num === 1 ? "rgba(0,200,255,0.5)" : "rgba(255,255,255,0.1)",
              backgroundColor: p.num === 1 ? "rgba(0,200,255,0.1)" : "transparent",
              color: p.num === 1 ? "#00c8ff" : "rgba(255,255,255,0.4)",
            }}
          >
            {p.num}
          </div>
          <div className="flex-1">
            <div className="text-xs font-display tracking-wider" style={{ color: p.num === 1 ? "#00c8ff" : "rgba(255,255,255,0.5)" }}>
              {p.label}
            </div>
            <div className="text-[9px] text-white/30">Stat Cap: {p.cap}</div>
          </div>
          {p.num === 1 && (
            <motion.div
              className="text-[9px] font-mono px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(0,200,255,0.15)", color: "#00c8ff" }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              YOU
            </motion.div>
          )}
        </motion.div>
      ))}
      <motion.div
        className="w-px h-full absolute left-[16px] top-0"
        style={{ background: "linear-gradient(to top, rgba(0,200,255,0.3), transparent)" }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      />
    </div>
  );
}

function TaskExample() {
  return (
    <motion.div
      className="w-full max-w-[260px] rounded-lg border border-white/10 bg-white/5 p-3 space-y-2"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-400" />
        <span className="text-xs font-display tracking-wider text-white/80">MEDITATION</span>
        <span className="text-[9px] ml-auto text-white/40 font-mono">20 min</span>
      </div>
      <div className="text-[10px] text-white/50">Morning mindfulness session</div>
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-display tracking-widest text-purple-300">SEN</span>
          <motion.span
            className="text-[10px] font-mono text-green-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            +1
          </motion.span>
        </div>
        <motion.div
          className="text-[9px] font-mono text-cyan-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          +10 XP
        </motion.div>
      </div>
    </motion.div>
  );
}

export function OnboardingFlow({ onComplete, onSkip, playerName }: OnboardingFlowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const slides: OnboardingSlide[] = [
    {
      id: "welcome",
      headline: "Your Life Is the System.",
      body: (
        <div className="space-y-3">
          <p>This app transforms real-world discipline into measurable growth.</p>
          <p>Every action you complete strengthens your character.</p>
        </div>
      ),
      subtext: "Progress is earned. Growth is gradual.",
    },
    {
      id: "sectograph",
      headline: "Design Your Day.",
      body: (
        <div className="space-y-3">
          <p>Your Sectograph displays the day as a circular timeline.</p>
          <p>Each scheduled task becomes a mission.</p>
          <p>Complete missions to increase your stats.</p>
        </div>
      ),
      visual: <MiniSectograph />,
    },
    {
      id: "stats",
      headline: "Stats Reflect Reality.",
      body: (
        <div className="space-y-4">
          <div className="space-y-2 w-full max-w-[260px]">
            <StatBar label="STR" sublabel="Physical" value={40} color="#ef4444" delay={0.3} />
            <StatBar label="AGI" sublabel="Mobility" value={55} color="#3b82f6" delay={0.45} />
            <StatBar label="VIT" sublabel="Recovery" value={35} color="#22c55e" delay={0.6} />
            <StatBar label="SEN" sublabel="Clarity" value={60} color="#a855f7" delay={0.75} />
          </div>
          <p className="text-white/60 text-xs">Stats increase only when you complete related tasks. There are no shortcuts or manual upgrades.</p>
          <TaskExample />
        </div>
      ),
      subtext: "Consistency builds power.",
    },
    {
      id: "phases",
      headline: "Advance Through Phases.",
      body: (
        <div className="space-y-4">
          <p>There are 5 Phases of progression. Each phase raises your stat potential and unlocks deeper growth.</p>
          <PhaseLadder />
          <p className="text-white/50 text-xs italic">You are not competing with anyone. You progress at your pace.</p>
        </div>
      ),
    },
    {
      id: "begin",
      headline: "Begin.",
      body: (
        <div className="space-y-4">
          <p>Create or complete one small task to start your journey.</p>
          <motion.div
            className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3 w-full max-w-[260px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-[10px] font-display tracking-widest text-white/40 uppercase">Game Integration - Coming Soon</div>
            <div className="text-xs text-white/60">Your real-world growth will directly power your in-game character.</div>
            <div className="text-[9px] text-white/30">No additional mechanics yet.</div>
          </motion.div>
        </div>
      ),
      subtext: `Welcome to Phase 1${playerName ? `, ${playerName}` : ""}.`,
    },
  ];

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((p) => p + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, slides.length, onComplete]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((p) => p - 1);
    }
  }, [currentSlide]);

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #0a0f1a 0%, #111827 50%, #0a0f1a 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 p-2 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 transition-all z-10"
        data-testid="button-skip-onboarding"
      >
        <X size={18} />
      </button>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === currentSlide ? "24px" : "8px",
              backgroundColor: i === currentSlide ? "#00c8ff" : i < currentSlide ? "rgba(0,200,255,0.4)" : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-md px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="flex flex-col items-center text-center space-y-6 w-full"
          >
            <motion.h1
              className="text-2xl font-display tracking-wider text-white"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              {slide.headline}
            </motion.h1>

            {slide.visual && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {slide.visual}
              </motion.div>
            )}

            <motion.div
              className="text-sm text-white/70 leading-relaxed max-w-[300px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              {slide.body}
            </motion.div>

            {slide.subtext && (
              <motion.p
                className="text-xs text-white/40 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {slide.subtext}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-10 flex items-center gap-4">
        {currentSlide > 0 && (
          <motion.button
            onClick={goPrev}
            className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-testid="button-onboarding-prev"
          >
            <ChevronLeft size={16} />
            Back
          </motion.button>
        )}

        <motion.button
          onClick={goNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-display tracking-wider text-sm transition-all"
          style={{
            background: isLast
              ? "linear-gradient(135deg, #00c8ff 0%, #0088cc 100%)"
              : "rgba(0,200,255,0.1)",
            color: isLast ? "#000" : "#00c8ff",
            border: isLast ? "none" : "1px solid rgba(0,200,255,0.2)",
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          data-testid={isLast ? "button-enter-dashboard" : "button-onboarding-next"}
        >
          {isLast ? "Enter Dashboard" : "Continue"}
          {!isLast && <ChevronRight size={16} />}
        </motion.button>
      </div>
    </motion.div>
  );
}

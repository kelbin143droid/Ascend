import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface OnboardingSlide {
  id: string;
  headline: string;
  body: React.ReactNode;
  subtext?: string;
  isFinal?: boolean;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  playerName?: string;
}

export const LEARN_CONTENT = [
  {
    id: "why-start-small",
    title: "Why Start Small",
    lines: [
      "Most people fail because they try to change everything at once.",
      "Ascend builds momentum first.",
      "One small action today is enough.",
    ],
  },
  {
    id: "stats-reflect-reality",
    title: "Stats Reflect Reality",
    lines: [
      "Every stat is tied to a real action.",
      "Strength grows from physical practice, Sense from mindfulness, Agility from movement, Vitality from recovery.",
      "There are no shortcuts or manual upgrades. Consistency builds power.",
    ],
  },
  {
    id: "phases-of-growth",
    title: "Phases of Growth",
    lines: [
      "There are 5 Phases of progression. Each phase raises your stat potential and unlocks deeper growth.",
      "You progress at your own pace. Phase 1 is Foundation — where momentum begins.",
    ],
  },
  {
    id: "design-your-day",
    title: "Design Your Day",
    lines: [
      "The Sectograph displays your day as a circular timeline.",
      "Add steps, set times, and begin your practice to grow your stats.",
      "Each completed step feeds into your Flow State.",
    ],
  },
];

export function OnboardingFlow({ onComplete, playerName }: OnboardingFlowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const slides: OnboardingSlide[] = [
    {
      id: "identity",
      headline: "Your Life Is the System.",
      body: (
        <div className="space-y-3">
          <p>This isn't a game you play separately from your life.</p>
          <p>Every real action you take strengthens your character.</p>
        </div>
      ),
      subtext: "Progress is earned through action.",
    },
    {
      id: "growth",
      headline: "Growth Through Action.",
      body: (
        <div className="space-y-3">
          <p>Complete habits to build stats, raise your level, and advance through phases.</p>
          <p>The system adapts to you — start where you are.</p>
        </div>
      ),
      subtext: "No shortcuts. No tricks. Just consistency.",
    },
    {
      id: "first-principle",
      headline: "Real change starts small.",
      body: (
        <div className="space-y-3">
          <p>Most people fail because they try to change everything at once.</p>
          <p className="text-white/90 font-medium">One small action today is enough.</p>
        </div>
      ),
      isFinal: true,
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
  const isLast = slide.isFinal === true;

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
          data-testid={isLast ? "button-begin" : "button-onboarding-next"}
        >
          {isLast ? "Begin" : "Continue"}
          {!isLast && <ChevronRight size={16} />}
        </motion.button>
      </div>
    </motion.div>
  );
}

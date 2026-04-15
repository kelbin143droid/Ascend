import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Flame, Swords, Star, Zap } from "lucide-react";
import { markIntroDone, getGender } from "@/lib/userState";

interface Props {
  onComplete: () => void;
}

type Slide = {
  id: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  bullets?: { icon: ReactNode; text: string }[];
  cta?: string;
};

function useGenderTheme() {
  const gender = getGender();
  if (gender === "female") {
    return {
      primary: "#e040fb",
      primaryGlow: "rgba(224,64,251,0.45)",
      accent: "#f472b6",
      bg: "#0d0614",
      surface: "rgba(40,10,60,0.7)",
      border: "rgba(224,64,251,0.25)",
      gradient: "linear-gradient(135deg, #7e22ce, #e040fb)",
      textMuted: "rgba(248,232,255,0.5)",
    };
  }
  return {
    primary: "#4f8ef7",
    primaryGlow: "rgba(79,142,247,0.45)",
    accent: "#00d4ff",
    bg: "#050815",
    surface: "rgba(10,20,60,0.7)",
    border: "rgba(79,142,247,0.25)",
    gradient: "linear-gradient(135deg, #1e3a8a, #4f8ef7)",
    textMuted: "rgba(232,240,255,0.5)",
  };
}

export function IntroTutorialScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const t = useGenderTheme();

  const slides: Slide[] = [
    {
      id: "welcome",
      icon: <Zap size={36} color={t.primary} />,
      eyebrow: "WELCOME",
      title: "You've just entered\nAscend OS",
      subtitle: "This is your daily command centre. Real actions in the real world level you up inside the game.",
      bullets: [
        { icon: <Star size={14} color={t.accent} />, text: "Complete daily rituals to earn XP" },
        { icon: <Flame size={14} color={t.accent} />, text: "Build streaks to unlock power" },
        { icon: <Swords size={14} color={t.accent} />, text: "Rise through 5 phases of mastery" },
      ],
    },
    {
      id: "sectograph",
      icon: <Clock size={36} color={t.primary} />,
      eyebrow: "YOUR TIMELINE",
      title: "The Sectograph",
      subtitle: "A 24-hour ring showing exactly where your habits live in the day. Anchor your rituals to time — that's what makes them stick.",
      bullets: [
        { icon: <span style={{ fontSize: 14 }}>🌅</span>, text: "Morning: Sleep & wake anchor" },
        { icon: <span style={{ fontSize: 14 }}>⚡</span>, text: "Day: Training & focus blocks" },
        { icon: <span style={{ fontSize: 14 }}>🌙</span>, text: "Night: Recovery & reflection" },
      ],
    },
    {
      id: "habits",
      icon: <Flame size={36} color={t.primary} />,
      eyebrow: "YOUR SYSTEM",
      title: "Build & Break\nHabits",
      subtitle: "The Habits tab is your toolkit. Stack new behaviours on top of existing ones. Track and crush bad patterns before they track you.",
      bullets: [
        { icon: <span style={{ fontSize: 14 }}>🔧</span>, text: "Build tab: Add positive daily habits" },
        { icon: <span style={{ fontSize: 14 }}>🚫</span>, text: "Break tab: Log triggers and cravings" },
        { icon: <span style={{ fontSize: 14 }}>📈</span>, text: "Streaks multiply your XP output" },
      ],
    },
    {
      id: "game",
      icon: <Swords size={36} color={t.primary} />,
      eyebrow: "THE GAME",
      title: "Dual Progression\nSystem",
      subtitle: "Every action builds two things: your Overall Level and your Stat Power. Level up to earn Stat Points and allocate them where you need them.",
      bullets: [
        { icon: <span style={{ fontSize: 14 }}>💪</span>, text: "STR · AGI · SNS · VIT — 4 core stats" },
        { icon: <span style={{ fontSize: 14 }}>🏆</span>, text: "E → S Rank — 8 tiers of power" },
        { icon: <span style={{ fontSize: 14 }}>🎮</span>, text: "Unlock HP/MP bars, skills & more" },
      ],
    },
    {
      id: "enter",
      icon: <Star size={36} color={t.primary} />,
      eyebrow: "READY",
      title: "Your system\nis online.",
      subtitle: "Start your first daily flow session. Breathe, move, reflect — and watch your stats climb.",
      cta: "Enter the System",
    },
  ];

  const current = slides[step];
  const isLast = step === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (leaving) return;
      setLeaving(true);
      markIntroDone();
      setTimeout(() => onComplete(), 400);
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      style={{
        minHeight: "100dvh",
        backgroundColor: t.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px 48px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* bg glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${t.primaryGlow} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* progress dots */}
      <div
        style={{
          display: "flex",
          gap: 7,
          marginBottom: 40,
          position: "relative",
          zIndex: 1,
        }}
      >
        {slides.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 22 : 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: i <= step ? t.primary : "rgba(255,255,255,0.12)",
              transition: "all 0.35s ease",
            }}
          />
        ))}
      </div>

      {/* slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            width: "100%",
            maxWidth: 360,
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* icon circle */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: t.surface,
              border: `2px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
              boxShadow: `0 0 32px ${t.primaryGlow}`,
            }}
          >
            {current.icon}
          </div>

          {/* eyebrow */}
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.28em",
              fontWeight: 800,
              textTransform: "uppercase",
              color: t.primary,
              marginBottom: 12,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {current.eyebrow}
          </div>

          {/* title */}
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#f5f5ff",
              textAlign: "center",
              lineHeight: 1.15,
              margin: "0 0 16px",
              fontFamily: "Inter, system-ui, sans-serif",
              letterSpacing: "-0.4px",
              whiteSpace: "pre-line",
            }}
          >
            {current.title}
          </h1>

          {/* subtitle */}
          <p
            style={{
              fontSize: 14,
              color: t.textMuted,
              textAlign: "center",
              lineHeight: 1.65,
              margin: "0 0 28px",
              fontFamily: "Inter, system-ui, sans-serif",
              maxWidth: 300,
            }}
          >
            {current.subtitle}
          </p>

          {/* bullets */}
          {current.bullets && (
            <div
              style={{
                width: "100%",
                borderRadius: 16,
                background: t.surface,
                border: `1px solid ${t.border}`,
                padding: "4px 0",
                marginBottom: 32,
              }}
            >
              {current.bullets.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 18px",
                    borderBottom:
                      i < current.bullets!.length - 1
                        ? `1px solid rgba(255,255,255,0.05)`
                        : "none",
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{b.icon}</span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.75)",
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CTA button */}
          <motion.button
            data-testid={isLast ? "button-intro-enter" : "button-intro-next"}
            whileTap={{ scale: 0.96 }}
            onClick={handleNext}
            style={{
              width: "100%",
              padding: "17px",
              borderRadius: 18,
              background: t.gradient,
              border: "none",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "Inter, system-ui, sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: `0 6px 28px ${t.primaryGlow}`,
              letterSpacing: "0.02em",
              marginTop: current.bullets ? 0 : 8,
            }}
          >
            {current.cta ?? "Continue"}
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* skip (only show before last slide) */}
      {!isLast && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          onClick={() => {
            markIntroDone();
            setLeaving(true);
            setTimeout(() => onComplete(), 300);
          }}
          style={{
            marginTop: 24,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.35)",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "0.04em",
            position: "relative",
            zIndex: 1,
          }}
        >
          Skip intro
        </motion.button>
      )}
    </motion.div>
  );
}

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowRight, Brain, Dumbbell, Flame, Repeat2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AscendGoal = "discipline" | "health" | "focus" | "routine" | "everything";

interface GoalOption {
  id: AscendGoal;
  label: string;
  description: string;
  Icon: LucideIcon;
  color: string;
}

interface GoalSelectScreenProps {
  firstName: string;
  onSelect: (goal: AscendGoal) => void;
}

const GOALS: GoalOption[] = [
  {
    id: "discipline",
    label: "Build discipline",
    description: "Show up daily and turn effort into momentum.",
    Icon: Flame,
    color: "#f97316",
  },
  {
    id: "health",
    label: "Get healthier",
    description: "Improve movement, recovery, nutrition, and energy.",
    Icon: Activity,
    color: "#22c55e",
  },
  {
    id: "focus",
    label: "Improve focus",
    description: "Train attention, calm, and deep work habits.",
    Icon: Brain,
    color: "#38bdf8",
  },
  {
    id: "routine",
    label: "Fix my routine",
    description: "Plan your day and make time visible.",
    Icon: Repeat2,
    color: "#a78bfa",
  },
  {
    id: "everything",
    label: "Level up everything",
    description: "Build a full-life system across all stats.",
    Icon: Dumbbell,
    color: "#facc15",
  },
];

export function GoalSelectScreen({ firstName, onSelect }: GoalSelectScreenProps) {
  const [selected, setSelected] = useState<AscendGoal | null>(null);
  const [exiting, setExiting] = useState(false);
  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 4 + Math.random() * 92,
      y: 5 + Math.random() * 88,
      size: 0.8 + Math.random() * 1.8,
      duration: 10 + Math.random() * 14,
      delay: Math.random() * 7,
      driftX: (Math.random() - 0.5) * 34,
      driftY: -(16 + Math.random() * 46),
    })),
  ).current;

  const selectedGoal = GOALS.find((goal) => goal.id === selected);

  const handleContinue = () => {
    if (!selected || exiting) return;
    setExiting(true);
    window.setTimeout(() => onSelect(selected), 520);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden px-5 py-8 text-white"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, rgba(56,189,248,0.16), transparent 28%), radial-gradient(circle at 85% 70%, rgba(168,85,247,0.14), transparent 30%), linear-gradient(180deg, #020810 0%, #06111f 52%, #020610 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(125,211,252,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.12) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="pointer-events-none absolute rounded-full bg-cyan-200"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            boxShadow: "0 0 8px rgba(125,211,252,0.75)",
          }}
          animate={{
            x: [0, particle.driftX, 0],
            y: [0, particle.driftY, 0],
            opacity: [0, 0.48, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[430px] flex-col">
        <header className="mb-5 pt-4 text-center">
          <motion.p
            className="mb-3 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-100/50"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Personal Protocol
          </motion.p>
          <motion.h1
            className="text-[28px] font-black leading-tight tracking-[0.01em] min-[390px]:text-[32px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            What are you here to improve{firstName ? `, ${firstName.split(" ")[0]}` : ""}?
          </motion.h1>
          <motion.p
            className="mx-auto mt-3 max-w-[320px] text-sm font-medium leading-relaxed text-slate-300/72"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Ascend will shape your first quests around the outcome you care about most.
          </motion.p>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto pb-4">
          <div className="grid gap-3">
            {GOALS.map(({ id, label, description, Icon, color }, index) => {
              const isSelected = selected === id;
              return (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  data-testid={`goal-${id}`}
                  className="relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left transition"
                  style={{
                    background: isSelected ? `${color}18` : "rgba(255,255,255,0.045)",
                    borderColor: isSelected ? `${color}cc` : "rgba(125,211,252,0.18)",
                    boxShadow: isSelected
                      ? `0 0 34px ${color}35, inset 0 1px 0 rgba(255,255,255,0.16)`
                      : "inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36 + index * 0.06 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                    style={{
                      color,
                      borderColor: `${color}70`,
                      background: `${color}12`,
                      boxShadow: isSelected ? `0 0 22px ${color}40` : "none",
                    }}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-black leading-tight text-white">
                      {label}
                    </span>
                    <span className="mt-1 block text-[12px] font-medium leading-snug text-slate-300/68">
                      {description}
                    </span>
                  </span>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      background: isSelected ? color : "rgba(255,255,255,0.18)",
                      boxShadow: isSelected ? `0 0 16px ${color}` : "none",
                    }}
                  />
                </motion.button>
              );
            })}
          </div>
        </main>

        <footer className="pb-2 pt-2">
          <AnimatePresence mode="wait">
            {selectedGoal ? (
              <motion.button
                key="continue"
                type="button"
                onClick={handleContinue}
                data-testid="button-confirm-goal"
                className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl px-5 text-[12px] font-black uppercase tracking-[0.22em] text-slate-950"
                style={{
                  background: `linear-gradient(90deg, ${selectedGoal.color}, #67e8f9)`,
                  boxShadow: `0 0 34px ${selectedGoal.color}55, 0 10px 34px rgba(0,0,0,0.36)`,
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue
                <ArrowRight size={17} />
              </motion.button>
            ) : (
              <motion.p
                key="hint"
                className="text-center text-[10px] font-bold uppercase tracking-[0.26em] text-white/34"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Choose your main goal
              </motion.p>
            )}
          </AnimatePresence>
        </footer>
      </div>
    </motion.div>
  );
}

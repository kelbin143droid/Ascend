import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

export const STAT_INTRO_SEEN_KEY = "ascend_stat_intro_seen";

export const STAT_EXPLAINERS = [
  { key: "SEN", label: "Sense", text: "Calm, focus, and MP recovery." },
  { key: "AGI", label: "Agility", text: "Mobility, speed, and movement control." },
  { key: "STR", label: "Strength", text: "Power, discipline, and battle readiness." },
  { key: "INT", label: "Intel", text: "Learning, strategy, and smarter choices." },
  { key: "VIT", label: "Vitality", text: "Sleep, recovery, and HP stability." },
];

export function markStatIntroSeen() {
  try {
    localStorage.setItem(STAT_INTRO_SEEN_KEY, "true");
  } catch {
    /* noop */
  }
}

interface StatIntroModalProps {
  open: boolean;
  onClose: () => void;
  primaryColor?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
}

export function StatIntroModal({
  open,
  onClose,
  primaryColor = "#38bdf8",
  primaryLabel = "Done",
  onPrimary,
}: StatIntroModalProps) {
  const handleClose = () => {
    markStatIntroSeen();
    onClose();
  };

  const handlePrimary = () => {
    markStatIntroSeen();
    if (onPrimary) onPrimary();
    else onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "rgba(2,6,18,0.88)", backdropFilter: "blur(18px)" }}
          data-testid="stat-intro-modal"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="relative max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-3xl px-6 py-6"
            style={{
              background: "linear-gradient(145deg, rgba(8,14,32,0.97), rgba(4,9,24,0.99))",
              border: `1px solid ${primaryColor}44`,
              boxShadow: `0 24px 70px rgba(0,0,0,0.58), 0 0 42px ${primaryColor}18`,
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(226,232,240,0.76)" }}
              aria-label="Close stats guide"
              data-testid="button-close-stat-intro"
            >
              <X size={17} />
            </button>

            <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: primaryColor }}>
              System Awakened
            </p>
            <h2 className="mt-2 pr-8 text-[25px] font-black leading-tight" style={{ color: "rgba(248,250,252,0.98)" }}>
              Your stats feed your hero.
            </h2>
            <p className="mt-2 text-[13px] leading-snug" style={{ color: "rgba(203,213,225,0.72)" }}>
              Real-world actions raise the system that powers your game character.
            </p>

            <div className="mt-5 grid gap-2">
              {STAT_EXPLAINERS.map((stat) => (
                <div
                  key={stat.key}
                  className="grid grid-cols-[44px_1fr] gap-3 rounded-2xl px-3 py-2.5"
                  style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="flex h-9 items-center justify-center rounded-xl text-[11px] font-black"
                    style={{ background: `${primaryColor}16`, color: primaryColor }}
                  >
                    {stat.key}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold leading-tight" style={{ color: "rgba(248,250,252,0.94)" }}>
                      {stat.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "rgba(203,213,225,0.64)" }}>
                      {stat.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrimary}
              className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold"
              style={{
                background: `linear-gradient(90deg, #2563eb, ${primaryColor}, #7c3aed)`,
                color: "#fff",
                boxShadow: `0 10px 30px ${primaryColor}24`,
              }}
              data-testid="button-stat-intro-primary"
            >
              {primaryLabel}
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

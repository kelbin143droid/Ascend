import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

export const STAT_INTRO_SEEN_KEY = "ascend_stat_intro_seen";

export const STAT_EXPLAINERS = [
  { key: "STR", label: "Strength", text: "Attack damage and stamina." },
  { key: "AGI", label: "Agility", text: "Attack speed and movement speed." },
  { key: "SEN", label: "Sense", text: "Mana regeneration and cooldown reduction." },
  { key: "INT", label: "Intel", text: "Crit chance and dodge chance." },
  { key: "VIT", label: "Vitality", text: "Defense and HP regeneration." },
  { key: "DIS", label: "Discipline", text: "Dungeon energy and reward chance." },
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
  const [page, setPage] = useState(0);
  const statPages = [
    STAT_EXPLAINERS.slice(0, 3),
    STAT_EXPLAINERS.slice(3),
  ];
  const visibleStats = statPages[page] ?? statPages[0];
  const isFinalPage = page >= statPages.length - 1;

  useEffect(() => {
    if (open) setPage(0);
  }, [open]);

  const handleClose = () => {
    markStatIntroSeen();
    onClose();
  };

  const handlePrimary = () => {
    if (!isFinalPage) {
      setPage((p) => Math.min(statPages.length - 1, p + 1));
      return;
    }
    markStatIntroSeen();
    if (onPrimary) onPrimary();
    else onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
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
            className="relative max-h-[calc(100dvh-28px)] w-[calc(100vw-32px)] max-w-sm overflow-y-auto rounded-3xl"
            style={{
              background: "linear-gradient(145deg, rgba(8,14,32,0.97), rgba(4,9,24,0.99))",
              border: `1px solid ${primaryColor}44`,
              boxShadow: `0 24px 70px rgba(0,0,0,0.58), 0 0 42px ${primaryColor}18`,
              padding: "18px",
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
            <h2 className="mt-2 pr-8 text-[22px] font-black leading-tight" style={{ color: "rgba(248,250,252,0.98)", marginTop: "7px", paddingRight: "36px" }}>
              Stats power your hero.
            </h2>
            <p className="mt-2 text-[12px] leading-snug" style={{ color: "rgba(203,213,225,0.72)", marginTop: "7px" }}>
              Each stat maps to a combat advantage for your character.
            </p>

            <div className="mt-4 flex items-center gap-2" aria-hidden="true">
              {statPages.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: i === page ? primaryColor : "rgba(148,163,184,0.18)" }}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-2" style={{ marginTop: "14px" }}>
              {visibleStats.map((stat) => (
                <div
                  key={stat.key}
                  className="grid grid-cols-[42px_1fr] gap-3 rounded-2xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)", padding: "9px 12px" }}
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
                    <p className="mt-0.5 text-[11px] leading-tight" style={{ color: "rgba(203,213,225,0.64)" }}>
                      {stat.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrimary}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold"
              style={{
                background: `linear-gradient(90deg, #2563eb, ${primaryColor}, #7c3aed)`,
                color: "#fff",
                boxShadow: `0 10px 30px ${primaryColor}24`,
                marginTop: "14px",
                padding: "0 16px",
              }}
              data-testid="button-stat-intro-primary"
            >
              {isFinalPage ? primaryLabel : "Next"}
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

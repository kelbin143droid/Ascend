import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface FirstPrincipleScreenProps {
  onBegin: () => void;
}

export function FirstPrincipleScreen({ onBegin }: FirstPrincipleScreenProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center px-8"
      style={{
        background: `linear-gradient(to bottom, ${colors.background} 0%, ${colors.background}ee 100%)`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-sm w-full flex flex-col items-center text-center">
        <motion.h1
          className="text-2xl font-display font-bold leading-snug mb-8"
          style={{ color: colors.text }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          Real change starts small.
        </motion.h1>

        <motion.div
          className="space-y-3 mb-12"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
            Most people fail because they try to change everything at once.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
            Ascend builds momentum first.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
            One small action today is enough.
          </p>
        </motion.div>

        <motion.button
          data-testid="button-begin"
          onClick={onBegin}
          className="w-full py-4 rounded-xl font-display font-bold text-base uppercase tracking-[0.15em] transition-all active:scale-[0.97]"
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
            boxShadow: `0 0 24px ${colors.primaryGlow}30`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          Begin
        </motion.button>
      </div>
    </motion.div>
  );
}

export const FIRST_PRINCIPLE_CONTENT = {
  title: "Why Start Small",
  lines: [
    "Most people fail because they try to change everything at once.",
    "Ascend builds momentum first.",
    "One small action today is enough.",
  ],
};

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronRight } from "lucide-react";

interface LevelUpModalProps {
  visible: boolean;
  onComplete: () => void;
}

export function LevelUpModal({ visible, onComplete }: LevelUpModalProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onComplete, 4500);
    return () => clearTimeout(t);
  }, [visible, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="level-up-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(4,4,12,0.9)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            padding: "24px",
          }}
          data-testid="level-up-modal"
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 700px 500px at 50% 50%, rgba(255,165,0,0.07) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: "2px solid rgba(255,215,0,0.5)",
              pointerEvents: "none",
            }}
          />
          <motion.div
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.15 }}
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: "1px solid rgba(255,165,0,0.3)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            initial={{ scale: 0, rotate: -40, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 22,
              delay: 0.15,
            }}
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 28,
              boxShadow:
                "0 0 60px rgba(255,165,0,0.5), 0 0 120px rgba(255,165,0,0.2)",
            }}
          >
            <Star size={40} color="#1a0800" fill="#1a0800" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{
              fontSize: 11,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(255,215,0,0.65)",
              marginBottom: 10,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 700,
            }}
          >
            Rank Advancement
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.55, type: "spring", stiffness: 200 }}
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: "#FFD700",
              lineHeight: 1,
              margin: "0 0 14px",
              fontFamily: "Inter, system-ui, sans-serif",
              textShadow:
                "0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,165,0,0.3)",
              letterSpacing: "0.02em",
            }}
            data-testid="text-level-up-title"
          >
            LEVEL UP!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "rgba(245,245,255,0.9)",
              margin: "0 0 8px",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
            data-testid="text-level-up-subtitle"
          >
            Welcome to Level 2
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{
              fontSize: 14,
              color: "rgba(245,245,255,0.45)",
              margin: "0 0 36px",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            Your journey begins now.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            style={{ display: "flex", gap: 16, marginBottom: 40 }}
          >
            {[
              { label: "Level", value: "2" },
              { label: "XP", value: "0 / 100" },
              { label: "Phase", value: "I" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  textAlign: "center",
                  padding: "12px 18px",
                  borderRadius: 14,
                  background: "rgba(255,215,0,0.06)",
                  border: "1px solid rgba(255,215,0,0.18)",
                  minWidth: 72,
                }}
              >
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#FFD700",
                    margin: 0,
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {item.value}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    color: "rgba(245,245,255,0.35)",
                    margin: "3px 0 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15 }}
            onClick={onComplete}
            data-testid="button-begin-journey"
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "16px 44px",
              borderRadius: 16,
              background: "linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)",
              border: "none",
              color: "#1a0800",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "Inter, system-ui, sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 4px 36px rgba(255,165,0,0.4)",
              letterSpacing: "0.04em",
            }}
          >
            Begin Your Journey
            <ChevronRight size={18} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

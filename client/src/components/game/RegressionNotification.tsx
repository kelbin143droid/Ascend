import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ArrowDown } from "lucide-react";
import { PHASE_NAMES } from "@shared/schema";

interface RegressionNotificationProps {
  show: boolean;
  type: "soft" | "hard";
  message: string;
  currentPhase: number;
  previousPhase?: number;
  onDismiss: () => void;
}

export function RegressionNotification({
  show,
  type,
  message,
  currentPhase,
  previousPhase,
  onDismiss,
}: RegressionNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          data-testid="regression-notification"
          initial={{ opacity: 0, y: -60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: type === "hard" ? "#1a0f0f" : "#1a1508",
              border: `1px solid ${type === "hard" ? "#dc262640" : "#f59e0b40"}`,
              boxShadow: type === "hard"
                ? "0 0 30px rgba(220, 38, 38, 0.2)"
                : "0 0 20px rgba(245, 158, 11, 0.15)",
            }}
          >
            <div
              className="h-1 w-full"
              style={{
                background: type === "hard"
                  ? "linear-gradient(to right, transparent, #dc2626, transparent)"
                  : "linear-gradient(to right, transparent, #f59e0b, transparent)",
              }}
            />

            <div className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: type === "hard" ? "#dc262620" : "#f59e0b20",
                  }}
                >
                  {type === "hard" ? (
                    <ArrowDown size={20} className="text-red-400" />
                  ) : (
                    <AlertTriangle size={20} className="text-amber-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-sm font-display font-bold tracking-wider uppercase"
                      style={{ color: type === "hard" ? "#ef4444" : "#f59e0b" }}
                    >
                      {type === "hard" ? "Phase Recalibration" : "Soft Adjustment"}
                    </h3>
                    <button
                      data-testid="button-dismiss-regression"
                      onClick={onDismiss}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <X size={14} className="text-gray-500" />
                    </button>
                  </div>

                  {type === "hard" && previousPhase && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="text-gray-500">
                        {PHASE_NAMES[previousPhase]} → {PHASE_NAMES[currentPhase]}
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { AppTheme } from "@/lib/themes";

// ── Types ─────────────────────────────────────────────────────────────────────

export const AVATAR_ICONS = ["⚡", "🔥", "🌊", "🌙", "🗡️", "🛡️", "🌟", "👁️"];
export const AVATAR_KEY = "ascend_avatar_icon";

export function getAvatarIcon(): string {
  try { return localStorage.getItem(AVATAR_KEY) ?? AVATAR_ICONS[0]; } catch { return AVATAR_ICONS[0]; }
}
export function saveAvatarIcon(icon: string): void {
  try { localStorage.setItem(AVATAR_KEY, icon); } catch { /* noop */ }
}

export interface FaeColors {
  lavender: string;
  lavenderDeep: string;
  inkText: string;
}

export interface AvatarPickerSheetProps {
  open: boolean;
  current: string;
  playerName: string;
  onPick: (icon: string) => void;
  onClose: () => void;
  isIronSovereign: boolean;
  isNeonEmpress: boolean;
  colors: AppTheme["colors"];
  fae: FaeColors;
  pathColor: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AvatarPickerSheet({
  open, current, playerName, onPick, onClose,
  isIronSovereign, isNeonEmpress, colors, fae, pathColor,
}: AvatarPickerSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center"
          data-testid="avatar-picker-sheet"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 24 }}
            className="relative w-full max-w-md rounded-t-3xl px-5 pt-5 pb-8"
            style={{
              backgroundColor: isNeonEmpress ? fae.lavender : colors.background,
              border: `1.5px solid ${isNeonEmpress ? fae.lavenderDeep + "66" : colors.surfaceBorder}`,
              borderBottom: "none",
              boxShadow: "0 -12px 40px rgba(0,0,0,0.4)",
            }}
          >
            {/* Handle */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-4"
              style={{ backgroundColor: isNeonEmpress ? fae.lavenderDeep + "66" : "rgba(255,255,255,0.2)" }}
            />

            {/* Header: player name + close */}
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3
                  className="text-sm font-bold"
                  style={{ color: isNeonEmpress ? fae.inkText : colors.text }}
                  data-testid="avatar-sheet-title"
                >
                  Choose Your Avatar
                </h3>
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: isNeonEmpress ? fae.inkText + "99" : colors.textMuted }}
                  data-testid="avatar-sheet-player-name"
                >
                  {playerName || "Hunter"} · your evolving identity
                </p>
              </div>
              <button
                onClick={onClose}
                data-testid="button-avatar-close"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isNeonEmpress ? fae.lavenderDeep + "33" : colors.surface,
                  color: colors.textMuted,
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Current selection label */}
            <p
              className="text-[9px] uppercase tracking-[0.16em] font-semibold mb-3"
              style={{ color: pathColor }}
            >
              Selected: {current}
            </p>

            {/* Icon grid */}
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_ICONS.map(icon => {
                const isSelected = icon === current;
                return (
                  <button
                    key={icon}
                    onClick={() => onPick(icon)}
                    data-testid={`avatar-option-${icon}`}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
                    style={{
                      backgroundColor: isSelected
                        ? `${pathColor}22`
                        : isNeonEmpress ? fae.lavenderDeep + "22" : colors.surface,
                      border: `2px solid ${isSelected ? pathColor : "transparent"}`,
                      boxShadow: isSelected ? `0 0 14px ${pathColor}55` : "none",
                    }}
                  >
                    <span className="text-2xl leading-none">{icon}</span>
                    {isSelected && (
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: pathColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

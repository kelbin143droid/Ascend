import { useEffect, useState } from "react";
import { Play, Check, Plus, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  getBlockColor,
  _sectographTimeHelpers,
  type ScheduleBlock,
} from "@/components/game/Sectograph";

interface CurrentMissionCardProps {
  currentBlock: ScheduleBlock | null;
  nextBlock: ScheduleBlock | null;
  onStartFocus?: (block: ScheduleBlock) => void;
  onComplete?: (block: ScheduleBlock) => void;
  onAddBlock?: () => void;
}

/** Rough XP estimate based on block duration (mock: 1 XP/min, capped). */
function estimateXp(block: ScheduleBlock): number {
  const s = block.startHour * 60 + (block.startMinute ?? 0);
  const e = block.endHour * 60 + (block.endMinute ?? 0);
  const dur = e > s ? e - s : (e + 24 * 60) - s;
  return Math.max(5, Math.min(120, Math.round(dur / 2)));
}

const fmt = (h: number, m: number) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

export function CurrentMissionCard({
  currentBlock,
  nextBlock,
  onStartFocus,
  onComplete,
  onAddBlock,
}: CurrentMissionCardProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  // Re-render every 30s for the countdown.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Countdown to the next block (or to current block end if active).
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let countdownLabel: string | null = null;
  if (currentBlock) {
    const sMin = currentBlock.startHour * 60 + (currentBlock.startMinute ?? 0);
    const eMin = currentBlock.endHour * 60 + (currentBlock.endMinute ?? 0);
    const remaining = _sectographTimeHelpers.minutesRemainingInInterval(nowMin, sMin, eMin);
    if (remaining > 0) {
      const h = Math.floor(remaining / 60);
      const m = remaining % 60;
      countdownLabel = h > 0 ? `${h}h ${m}m left` : `${m}m left`;
    }
  } else if (nextBlock) {
    let nStart = nextBlock.startHour * 60 + (nextBlock.startMinute ?? 0);
    if (nStart < nowMin) nStart += 24 * 60;
    const until = nStart - nowMin;
    const h = Math.floor(until / 60);
    const m = until % 60;
    countdownLabel = h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
  }

  /* ─────────────── Empty state ─────────────── */
  if (!currentBlock && !nextBlock) {
    return (
      <div
        data-testid="current-mission-empty"
        className="w-full rounded-2xl p-5 flex items-center gap-3"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.surfaceBorder}`,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${colors.primary}15`, border: `1px solid ${colors.primary}40` }}
        >
          <Clock size={16} style={{ color: colors.primary }} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: colors.textMuted }}>
            Current Mission
          </div>
          <div className="text-sm font-semibold" style={{ color: colors.text }}>
            No active task
          </div>
        </div>
        {onAddBlock && (
          <button
            type="button"
            onClick={onAddBlock}
            data-testid="button-mission-add-block"
            className="px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-transform active:scale-95"
            style={{
              backgroundColor: colors.primary,
              color: "#0b1020",
            }}
          >
            <Plus size={13} />
            Add Block
          </button>
        )}
      </div>
    );
  }

  /* ─────────────── Active mission card ─────────────── */
  const block = currentBlock ?? nextBlock!;
  const accent = getBlockColor(block);
  const isActive = !!currentBlock;

  const xp = estimateXp(block);

  return (
    <div
      data-testid="current-mission-card"
      className="w-full rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        border: isActive ? `1px solid ${accent}55` : `1px solid ${colors.surfaceBorder}`,
        boxShadow: isActive ? `0 4px 14px rgba(0,0,0,0.22)` : undefined,
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, backgroundColor: accent, opacity: isActive ? 1 : 0.55 }} />

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div
              className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1 flex items-center gap-1.5"
              style={{ color: isActive ? accent : colors.textMuted }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: isActive ? accent : colors.textMuted,
                  animation: isActive ? "missionDot 1.6s ease-in-out infinite" : undefined,
                }}
              />
              {isActive ? "Current Mission" : "Up Next"}
            </div>
            <div
              className="text-lg font-semibold leading-tight truncate"
              style={{ color: colors.text }}
              data-testid="text-mission-name"
            >
              {block.name}
            </div>
            <div
              className="text-xs mt-1 font-mono flex items-center flex-wrap gap-x-2"
              style={{ color: colors.textMuted }}
              data-testid="text-mission-time"
            >
              <span>
                {fmt(block.startHour, block.startMinute ?? 0)}
                {" – "}
                {fmt(block.endHour, block.endMinute ?? 0)}
              </span>
              {countdownLabel && (
                <span
                  style={{
                    color: accent,
                    animation: isActive ? "missionCountdown 2.4s ease-in-out infinite" : undefined,
                  }}
                  data-testid="text-mission-countdown"
                >
                  · {countdownLabel}
                </span>
              )}
            </div>
          </div>
          <div
            className="flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider"
            style={{
              backgroundColor: `${accent}1f`,
              color: accent,
            }}
            data-testid="text-mission-xp"
          >
            +{xp} XP
          </div>
        </div>

        {isActive && (onStartFocus || onComplete) && (
          <div className="flex items-center gap-2">
            {onStartFocus && (
              <button
                type="button"
                onClick={() => onStartFocus(block)}
                data-testid="button-mission-focus"
                className="flex-1 px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-transform active:scale-95"
                style={{
                  backgroundColor: accent,
                  color: "#0b1020",
                }}
              >
                <Play size={13} fill="#0b1020" />
                Focus Mode
              </button>
            )}
            {onComplete && (
              <button
                type="button"
                onClick={() => onComplete(block)}
                data-testid="button-mission-complete"
                className="flex-1 px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-transform active:scale-95"
                style={{
                  backgroundColor: "transparent",
                  border: `1px solid ${accent}55`,
                  color: accent,
                }}
              >
                <Check size={13} />
                Complete
              </button>
            )}
          </div>
        )}

        {!isActive && nextBlock && (
          <div
            className="text-[11px]"
            style={{ color: colors.textMuted }}
          >
            You're in open time — your next mission starts soon.
          </div>
        )}
      </div>

      <style>{`
        @keyframes missionDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        @keyframes missionCountdown {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}

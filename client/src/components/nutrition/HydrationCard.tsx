import { Droplet } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { addWater } from "@/lib/nutritionStore";

interface HydrationCardProps {
  waterIntake: number;
  waterGoal: number;
}

const QUICK_ADDS = [250, 500, 750];

export function HydrationCard({ waterIntake, waterGoal }: HydrationCardProps) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const accent = "#06b6d4";
  const pct = Math.min(100, Math.max(0, (waterIntake / Math.max(1, waterGoal)) * 100));

  return (
    <div
      data-testid="hydration-card"
      className="w-full rounded-2xl p-4"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.surfaceBorder}`,
        boxShadow: `0 0 24px ${accent}18`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${accent}1a`,
              boxShadow: `0 0 12px ${accent}40`,
            }}
          >
            <Droplet size={14} style={{ color: accent }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>
              Hydration
            </p>
            <p className="text-base font-bold leading-none" style={{ color: colors.text }} data-testid="text-water-intake">
              <span style={{ color: accent }}>{waterIntake}</span>
              <span className="text-xs font-mono ml-1" style={{ color: colors.textMuted }}>
                / {waterGoal} ml
              </span>
            </p>
          </div>
        </div>
        <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
          {Math.round(pct)}%
        </p>
      </div>

      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-3"
        style={{ backgroundColor: `${accent}18` }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accent}, #22d3ee)`,
            boxShadow: `0 0 8px ${accent}80`,
          }}
          data-testid="bar-water-fill"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_ADDS.map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => addWater(ml)}
            data-testid={`button-add-water-${ml}`}
            className="rounded-lg py-1.5 text-xs font-bold transition-transform active:scale-95"
            style={{
              backgroundColor: `${accent}14`,
              border: `1px solid ${accent}35`,
              color: accent,
            }}
          >
            +{ml} ml
          </button>
        ))}
      </div>
    </div>
  );
}

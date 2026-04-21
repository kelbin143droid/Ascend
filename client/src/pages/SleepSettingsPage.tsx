import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Sparkles,
  Moon,
  Settings2,
  Zap,
  Check,
  Info,
} from "lucide-react";
import {
  getSleepModeState,
  setMode,
  updateCustom,
  subscribeSleepMode,
  computeAdaptiveSnapshot,
  SLEEP_MODE_META,
  type SleepMode,
  type SleepModeState,
} from "@/lib/sleepModeStore";

const MODE_ORDER: SleepMode[] = ["beginner", "adaptive", "custom", "minimal"];

const MODE_ICON: Record<SleepMode, typeof Sparkles> = {
  beginner: Moon,
  adaptive: Sparkles,
  custom: Settings2,
  minimal: Zap,
};

function ModeCard({
  mode,
  active,
  onSelect,
}: {
  mode: SleepMode;
  active: boolean;
  onSelect: () => void;
}) {
  const meta = SLEEP_MODE_META[mode];
  const Icon = MODE_ICON[mode];
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`mode-card-${mode}`}
      className="relative w-full rounded-xl p-4 text-left transition-all"
      style={{
        backgroundColor: active ? `${meta.color}1c` : colors.surface,
        border: `1px solid ${active ? meta.color : colors.surfaceBorder}`,
        boxShadow: active ? `0 0 22px ${meta.color}55` : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${meta.color}25`,
            border: `1px solid ${meta.color}55`,
          }}
        >
          <Icon size={18} style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: active ? meta.color : colors.text }}>
              {meta.label}
            </p>
            {meta.recommended && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${meta.color}25`,
                  color: meta.color,
                  border: `1px solid ${meta.color}55`,
                }}
                data-testid="badge-recommended"
              >
                Recommended
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            {meta.description}
          </p>
        </div>
        {active && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: meta.color, color: "#0b1020" }}
          >
            <Check size={14} />
          </div>
        )}
      </div>
    </button>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
  testId,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testId: string;
}) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  return (
    <div
      className="flex items-center justify-between py-3 px-3 rounded-lg"
      style={{ backgroundColor: `${colors.surface}66`, border: `1px solid ${colors.surfaceBorder}` }}
    >
      <div className="min-w-0 mr-3">
        <p className="text-sm font-medium" style={{ color: colors.text }}>{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        data-testid={testId}
        aria-pressed={value}
        className="relative w-10 h-5 rounded-full shrink-0 transition-colors"
        style={{ backgroundColor: value ? "#8b5cf6" : "rgba(255,255,255,0.18)" }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: value ? "calc(100% - 18px)" : "2px" }}
        />
      </button>
    </div>
  );
}

export default function SleepSettingsPage() {
  const [, navigate] = useLocation();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { toast } = useToast();
  const [state, setState] = useState<SleepModeState>(() => getSleepModeState());

  useEffect(() => subscribeSleepMode(() => setState(getSleepModeState())), []);

  const snap = computeAdaptiveSnapshot();

  const onPickMode = (m: SleepMode) => {
    setMode(m);
    toast({
      title: `${SLEEP_MODE_META[m].label} mode active`,
      description: SLEEP_MODE_META[m].description,
    });
  };

  return (
    <div className="min-h-screen w-full" style={{ background: colors.background, color: colors.text }} data-testid="sleep-settings-page">
      {/* Top bar */}
      <div className="sticky top-0 z-30 px-4 pt-3 pb-2" style={{ backdropFilter: "blur(8px)", backgroundColor: `${colors.background}cc` }}>
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="p-1.5 rounded-lg"
            style={{ color: colors.textMuted }}
            data-testid="button-close-sleep-settings"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold" style={{ color: colors.text }}>
            Sleep Optimization
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Insight strip */}
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{
            backgroundColor: `${colors.surface}aa`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
          data-testid="adaptive-snapshot"
        >
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textMuted }}>
              Last {snap.windowDays} days
            </p>
            <p className="text-xs" style={{ color: colors.text }}>
              Completion <span className="font-mono font-bold" style={{ color: "#fbbf24" }}>{snap.completionRate}%</span>
              {"  ·  "}
              Consistency <span className="font-mono font-bold" style={{ color: "#06b6d4" }}>{snap.consistencyScore}%</span>
            </p>
          </div>
          <Info size={14} style={{ color: colors.textMuted }} />
        </div>

        {/* Mode selector */}
        <div className="space-y-2">
          {MODE_ORDER.map((m) => (
            <ModeCard
              key={m}
              mode={m}
              active={state.mode === m}
              onSelect={() => onPickMode(m)}
            />
          ))}
        </div>

        {/* Custom config — only when custom mode is active */}
        {state.mode === "custom" && (
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              backgroundColor: `${colors.surface}aa`,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
            data-testid="custom-config"
          >
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>
              Choose what runs
            </p>
            <ToggleRow
              label="Wind-down reminder"
              description="One ping before bed"
              value={state.custom.windDownReminder}
              onChange={(v) => updateCustom({ windDownReminder: v })}
              testId="toggle-windDownReminder"
            />
            <ToggleRow
              label="Food cutoff"
              description="Adaptive 30/45/60/90 min ladder"
              value={state.custom.foodCutoff}
              onChange={(v) => updateCustom({ foodCutoff: v })}
              testId="toggle-foodCutoff"
            />
            <ToggleRow
              label="Low stimulation"
              description="Focus mode + media off"
              value={state.custom.lowStimulation}
              onChange={(v) => updateCustom({ lowStimulation: v })}
              testId="toggle-lowStimulation"
            />
            <ToggleRow
              label="Sleep priming"
              description="Breathing / body scan / reflection"
              value={state.custom.sleepPriming}
              onChange={(v) => updateCustom({ sleepPriming: v })}
              testId="toggle-sleepPriming"
            />
            {/* Wind-down offset */}
            <div className="pt-2">
              <p className="text-xs font-medium mb-2" style={{ color: colors.text }}>
                Wind-down lead time
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 90].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateCustom({ windDownOffsetMin: m })}
                    data-testid={`offset-${m}`}
                    className="rounded-lg py-2 text-xs font-bold"
                    style={{
                      backgroundColor: state.custom.windDownOffsetMin === m ? "rgba(139,92,246,0.25)" : `${colors.surface}`,
                      border: `1px solid ${state.custom.windDownOffsetMin === m ? "#8b5cf6" : colors.surfaceBorder}`,
                      color: state.custom.windDownOffsetMin === m ? "#c4b5fd" : colors.textMuted,
                    }}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color: colors.textMuted }}>
                Wind-down ping fires this far before your sleep block.
              </p>
            </div>
          </div>
        )}

        {/* Manual launchers */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={() => navigate("/night-flow")}
            variant="outline"
            className="w-full h-11 text-xs border-white/15"
            data-testid="button-open-night-flow"
          >
            Open Night Flow now
          </Button>
        </div>

        <p className="text-[10px] text-center pt-4" style={{ color: colors.textMuted }}>
          Save the next sleep block on your Sectograph to apply the new schedule.
        </p>
      </div>
    </div>
  );
}

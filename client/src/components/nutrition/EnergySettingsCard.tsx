import { useEffect, useMemo, useState } from "react";
import { Flame, Activity, Target } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  ACTIVITY_LABEL,
  GOAL_LABEL,
  calculateAll,
  readEnergySettings,
  subscribeEnergySettings,
  writeEnergySettings,
  type ActivityLevel,
  type EnergySettings,
  type Goal,
  type Sex,
} from "@/lib/energySettingsStore";

/**
 * BMR + TDEE editor. Shows the live-calculated metabolic numbers so the user
 * understands how their target calorie goal is derived.
 */
export function EnergySettingsCard() {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const [settings, setSettings] = useState<EnergySettings>(() => readEnergySettings());

  useEffect(() => subscribeEnergySettings(() => setSettings(readEnergySettings())), []);

  const result = useMemo(() => calculateAll(settings), [settings]);

  const update = (patch: Partial<EnergySettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeEnergySettings(next);
  };

  const inputStyle = {
    backgroundColor: "transparent",
    border: `1px solid ${colors.surfaceBorder}`,
    color: colors.text,
  } as const;

  return (
    <div
      data-testid="energy-settings-card"
      className="w-full rounded-2xl p-5 flex flex-col gap-4"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.surfaceBorder}`,
      }}
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: colors.textMuted }}>
          Energy
        </p>
        <p className="text-base font-bold" style={{ color: colors.text }}>
          BMR &amp; daily target
        </p>
      </div>

      {/* Inputs grid */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Weight (kg)">
          <input
            type="number"
            inputMode="decimal"
            min={20}
            max={400}
            value={settings.weightKg}
            onChange={(e) => update({ weightKg: clamp(parseFloat(e.target.value) || 0, 20, 400) })}
            className="w-full rounded-md px-2.5 py-2 text-sm outline-none"
            style={inputStyle}
            data-testid="input-weight"
          />
        </Field>
        <Field label="Height (cm)">
          <input
            type="number"
            inputMode="decimal"
            min={80}
            max={260}
            value={settings.heightCm}
            onChange={(e) => update({ heightCm: clamp(parseFloat(e.target.value) || 0, 80, 260) })}
            className="w-full rounded-md px-2.5 py-2 text-sm outline-none"
            style={inputStyle}
            data-testid="input-height"
          />
        </Field>
        <Field label="Age">
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={120}
            value={settings.age}
            onChange={(e) => update({ age: clamp(parseInt(e.target.value, 10) || 0, 10, 120) })}
            className="w-full rounded-md px-2.5 py-2 text-sm outline-none"
            style={inputStyle}
            data-testid="input-age"
          />
        </Field>
        <Field label="Gender">
          <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${colors.surfaceBorder}` }}>
            {(["male", "female"] as Sex[]).map((s) => {
              const active = settings.sex === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => update({ sex: s })}
                  data-testid={`button-sex-${s}`}
                  className="flex-1 py-1.5 text-xs font-bold capitalize"
                  style={{
                    backgroundColor: active ? colors.primary : "transparent",
                    color: active ? colors.background : colors.textMuted,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {/* Activity + Goal */}
      <Field label="Activity level">
        <select
          value={settings.activity}
          onChange={(e) => update({ activity: e.target.value as ActivityLevel })}
          className="w-full rounded-md px-2.5 py-2 text-sm outline-none"
          style={inputStyle}
          data-testid="select-activity"
        >
          {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((k) => (
            <option key={k} value={k} style={{ backgroundColor: colors.background, color: colors.text }}>
              {ACTIVITY_LABEL[k]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Goal">
        <select
          value={settings.goal}
          onChange={(e) => update({ goal: e.target.value as Goal })}
          className="w-full rounded-md px-2.5 py-2 text-sm outline-none"
          style={inputStyle}
          data-testid="select-goal"
        >
          {(Object.keys(GOAL_LABEL) as Goal[]).map((k) => (
            <option key={k} value={k} style={{ backgroundColor: colors.background, color: colors.text }}>
              {GOAL_LABEL[k]}
            </option>
          ))}
        </select>
      </Field>

      {/* Calculations */}
      <div
        className="grid grid-cols-3 gap-2 mt-1"
        data-testid="energy-calc-output"
      >
        <Stat icon={<Flame size={12} />} label="BMR" value={result.bmr} accent={colors.textMuted} text={colors.text} surface={colors.background} border={colors.surfaceBorder} />
        <Stat icon={<Activity size={12} />} label="TDEE" value={result.tdee} accent={colors.textMuted} text={colors.text} surface={colors.background} border={colors.surfaceBorder} />
        <Stat icon={<Target size={12} />} label="Target" value={result.target} accent={colors.primary} text={colors.primary} surface={`${colors.primary}10`} border={`${colors.primary}30`} />
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
        Mifflin-St Jeor BMR × activity = TDEE. Target = TDEE × {GOAL_LABEL[settings.goal].toLowerCase()} multiplier.
      </p>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { backgroundTheme } = useTheme();
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-[10px] uppercase tracking-wider font-semibold"
        style={{ color: backgroundTheme.colors.textMuted }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
  text,
  surface,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  text: string;
  surface: string;
  border: string;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
      data-testid={`energy-stat-${label.toLowerCase()}`}
    >
      <div className="flex items-center gap-1 mb-0.5" style={{ color: accent }}>
        {icon}
        <span className="text-[9px] uppercase tracking-wider font-bold">{label}</span>
      </div>
      <p className="text-base font-mono font-bold tabular-nums leading-none" style={{ color: text }}>
        {value}
      </p>
    </div>
  );
}

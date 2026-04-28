import { useEffect, useMemo, useState, useCallback } from "react";
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

  const update = useCallback((patch: Partial<EnergySettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeEnergySettings(next);
  }, [settings]);

  // --- Local string states for numeric inputs so the field doesn't snap while typing ---
  const [weightStr, setWeightStr] = useState(() => String(kgToLb(settings.weightKg)));
  const [ftStr, setFtStr] = useState(() => String(cmToFt(settings.heightCm)));
  const [inStr, setInStr] = useState(() => String(cmToInRemainder(settings.heightCm)));
  const [ageStr, setAgeStr] = useState(() => String(settings.age));

  // Sync string states if settings change externally (e.g. from subscribeEnergySettings).
  useEffect(() => {
    setWeightStr(String(kgToLb(settings.weightKg)));
    setFtStr(String(cmToFt(settings.heightCm)));
    setInStr(String(cmToInRemainder(settings.heightCm)));
    setAgeStr(String(settings.age));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commitWeight = () => {
    const lb = parseFloat(weightStr);
    if (!isNaN(lb) && lb >= 44) {
      const clamped = clamp(lb, 44, 882);
      update({ weightKg: Math.round(lbToKg(clamped) * 10) / 10 });
      setWeightStr(String(clamped));
    } else {
      setWeightStr(String(kgToLb(settings.weightKg)));
    }
  };

  const commitHeight = () => {
    const ft = parseInt(ftStr, 10);
    const inch = parseInt(inStr, 10);
    const validFt = !isNaN(ft) && ft >= 2 && ft <= 8;
    const validIn = !isNaN(inch) && inch >= 0 && inch <= 11;
    if (validFt && validIn) {
      update({ heightCm: clamp(ftInToCm(ft, inch), 80, 260) });
    } else {
      setFtStr(String(cmToFt(settings.heightCm)));
      setInStr(String(cmToInRemainder(settings.heightCm)));
    }
  };

  const commitAge = () => {
    const age = parseInt(ageStr, 10);
    if (!isNaN(age) && age >= 10) {
      const clamped = clamp(age, 10, 120);
      update({ age: clamped });
      setAgeStr(String(clamped));
    } else {
      setAgeStr(String(settings.age));
    }
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
        <Field label="Weight (lb)">
          <input
            type="text"
            inputMode="decimal"
            value={weightStr}
            onChange={(e) => {
              setWeightStr(e.target.value);
              const lb = parseFloat(e.target.value);
              if (!isNaN(lb) && lb >= 44 && lb <= 882) {
                update({ weightKg: Math.round(lbToKg(lb) * 10) / 10 });
              }
            }}
            onBlur={commitWeight}
            className="w-full rounded-md px-2.5 py-2 text-sm outline-none"
            style={inputStyle}
            data-testid="input-weight"
            placeholder="lbs"
          />
        </Field>
        <Field label="Height (ft / in)">
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={ftStr}
              onChange={(e) => {
                setFtStr(e.target.value);
                const ft = parseInt(e.target.value, 10);
                const inch = parseInt(inStr, 10) || 0;
                if (!isNaN(ft) && ft >= 2 && ft <= 8) {
                  update({ heightCm: clamp(ftInToCm(ft, inch), 80, 260) });
                }
              }}
              onBlur={commitHeight}
              className="w-1/2 rounded-md px-2.5 py-2 text-sm outline-none"
              style={inputStyle}
              data-testid="input-height-ft"
              placeholder="ft"
            />
            <input
              type="text"
              inputMode="numeric"
              value={inStr}
              onChange={(e) => {
                setInStr(e.target.value);
                const inch = parseInt(e.target.value, 10);
                const ft = parseInt(ftStr, 10) || cmToFt(settings.heightCm);
                if (!isNaN(inch) && inch >= 0 && inch <= 11) {
                  update({ heightCm: clamp(ftInToCm(ft, inch), 80, 260) });
                }
              }}
              onBlur={commitHeight}
              className="w-1/2 rounded-md px-2.5 py-2 text-sm outline-none"
              style={inputStyle}
              data-testid="input-height-in"
              placeholder="in"
            />
          </div>
        </Field>
        <Field label="Age">
          <input
            type="text"
            inputMode="numeric"
            value={ageStr}
            onChange={(e) => {
              setAgeStr(e.target.value);
              const age = parseInt(e.target.value, 10);
              if (!isNaN(age) && age >= 10 && age <= 120) {
                update({ age });
              }
            }}
            onBlur={commitAge}
            className="w-full rounded-md px-2.5 py-2 text-sm outline-none"
            style={inputStyle}
            data-testid="input-age"
            placeholder="age"
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

function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462);
}
function lbToKg(lb: number): number {
  return lb / 2.20462;
}
function cmToFt(cm: number): number {
  const totalIn = cm / 2.54;
  return Math.floor(totalIn / 12);
}
function cmToInRemainder(cm: number): number {
  const totalIn = Math.round(cm / 2.54);
  return totalIn % 12;
}
function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54);
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

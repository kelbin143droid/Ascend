import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { DailySummary } from "@/components/nutrition/DailySummary";
import { FoodSearch } from "@/components/nutrition/FoodSearch";
import { QuickAdd } from "@/components/nutrition/QuickAdd";
import { HydrationCard } from "@/components/nutrition/HydrationCard";
import { SavedMealsList } from "@/components/nutrition/SavedMealsList";
import { CreateMealModal } from "@/components/nutrition/CreateMealModal";
import { MealGroupSection } from "@/components/nutrition/MealGroupSection";
import { EnergySettingsCard } from "@/components/nutrition/EnergySettingsCard";
import { ExerciseSection } from "@/components/nutrition/ExerciseSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2, X as XIcon, Plus, Sparkles } from "lucide-react";
import { addEntry } from "@/lib/nutritionStore";
import { AutoMealPlanModal } from "@/components/nutrition/AutoMealPlanModal";
import {
  computeTotals,
  defaultMealForNow,
  entryMealType,
  MEAL_LABEL,
  MEAL_TYPES,
  readDay,
  subscribeNutrition,
  todayIso,
  type MealType,
  type NutritionDay,
} from "@/lib/nutritionStore";
import {
  calculateTarget,
  readEnergySettings,
  subscribeEnergySettings,
} from "@/lib/energySettingsStore";
import {
  readWorkouts,
  subscribeWorkouts,
  totalCaloriesBurned,
  type WorkoutEntry,
} from "@/lib/workoutLogStore";
import { calculateDailyEnergy } from "@/lib/energyEngine";

type Tab = "log" | "energy" | "meals";
const TABS: { id: Tab; label: string }[] = [
  { id: "log", label: "Log" },
  { id: "energy", label: "Energy" },
  { id: "meals", label: "Meals" },
];

export default function NutritionPage() {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const [activeTab, setActiveTab] = useState<Tab>("log");
  const [day, setDay] = useState<NutritionDay>(() => readDay());
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>(() => readWorkouts());
  const [createOpen, setCreateOpen] = useState(false);

  // Selected meal bucket for the next added entry — drives FoodSearch / QuickAdd
  const [selectedMeal, setSelectedMeal] = useState<MealType>(() => defaultMealForNow());
  const addPanelRef = useRef<HTMLDivElement>(null);

  // Daily calorie target derived from energy settings (live).
  const [calorieGoal, setCalorieGoal] = useState<number>(() => calculateTarget(readEnergySettings()));
  useEffect(() => {
    const refresh = () => setCalorieGoal(calculateTarget(readEnergySettings()));
    refresh();
    return subscribeEnergySettings(refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setDay(readDay(todayIso()));
    refresh();
    return subscribeNutrition(refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setWorkouts(readWorkouts(todayIso()));
    refresh();
    return subscribeWorkouts(refresh);
  }, []);

  const totals = useMemo(() => computeTotals(day.entries), [day.entries]);
  const workoutBurned = useMemo(() => totalCaloriesBurned(workouts), [workouts]);
  const energy = useMemo(
    () =>
      calculateDailyEnergy({
        nutritionTotals: totals,
        workouts,
        goalCalories: calorieGoal,
      }),
    [totals, workouts, calorieGoal],
  );

  const entriesByMeal = useMemo(() => {
    const groups: Record<MealType, typeof day.entries> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    for (const e of day.entries) {
      groups[entryMealType(e)].push(e);
    }
    return groups;
  }, [day.entries]);

  const handleAddFromMealGroup = (mealType: MealType) => {
    setSelectedMeal(mealType);
    // Scroll the add-food panel into view so the user sees the search box.
    requestAnimationFrame(() => {
      addPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Camera scan state
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [autoMealPlanOpen, setAutoMealPlanOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<null | {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize?: string | null;
    fiber?: number | null;
    sugar?: number | null;
    sodium?: number | null;
  }>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);

  /**
   * Compress a photo File to a JPEG DataURL without ever holding the full
   * resolution base64 in memory. Uses a blob URL so the browser streams
   * the pixel data directly to a canvas, then discards it.
   */
  const compressImage = (file: File, maxPx = 1024, quality = 0.8): Promise<string> =>
    new Promise((resolve, reject) => {
      const objUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        try {
          const scale = Math.min(1, maxPx / Math.max(img.width || 1, img.height || 1));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("canvas unavailable")); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error("image load failed")); };
      img.src = objUrl;
    });

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanLoading(true);
    setScanError(null);
    setScanResult(null);
    setScanModalOpen(true);

    try {
      const base64 = await compressImage(file);

      const res = await fetch("/api/nutrition/scan-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "no_api_key") {
          setNoApiKey(true);
          setScanError(data.message ?? "OpenAI API key not configured.");
        } else {
          setScanError(data.message ?? "Failed to scan label.");
        }
      } else {
        setScanResult(data.nutrition);
        setNoApiKey(false);
      }
    } catch (err) {
      setScanError("Network error. Please try again.");
    } finally {
      setScanLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleAddScannedItem = () => {
    if (!scanResult) return;
    addEntry({
      name: scanResult.name || "Scanned Item",
      calories: scanResult.calories || 0,
      protein: scanResult.protein || 0,
      carbs: scanResult.carbs || 0,
      fat: scanResult.fat || 0,
      quantity: 1,
      servingLabel: scanResult.servingSize ?? "1 serving",
      mealType: selectedMeal,
    });
    setScanModalOpen(false);
    setScanResult(null);
  };

  return (
    <SystemLayout>
      <div
        className="flex flex-col gap-5 py-6 px-1 max-w-md mx-auto w-full"
        data-testid="nutrition-page"
      >
        {/* Header */}
        <div className="px-1">
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: colors.textMuted }}>
            System · Tools
          </p>
          <h1 className="text-xl font-bold tracking-wide" style={{ color: colors.text }}>
            Nutrition
          </h1>
        </div>

        {/* Tab nav */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{
            backgroundColor: `${colors.surface}80`,
            border: `1px solid ${colors.surfaceBorder}`,
          }}
          data-testid="nutrition-tabs"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-nutrition-${tab.id}`}
                className="flex-1 py-2 rounded-lg text-sm font-semibold tracking-wide transition-colors"
                style={{
                  backgroundColor: isActive ? colors.primary : "transparent",
                  color: isActive ? colors.background : colors.textMuted,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─────────────── LOG ─────────────── */}
        {activeTab === "log" && (
          <div className="flex flex-col gap-4" data-testid="tab-panel-log">
            <DailySummary totals={totals} energy={energy} />

            {/* Add-food panel: meal selector + search + quick-add */}
            <div ref={addPanelRef} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: colors.textMuted }}>
                  Add to
                </p>
                <p className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                  {MEAL_LABEL[selectedMeal]}
                </p>
              </div>
              <div
                className="flex rounded-lg p-1 gap-1"
                style={{
                  backgroundColor: `${colors.surface}80`,
                  border: `1px solid ${colors.surfaceBorder}`,
                }}
                data-testid="meal-type-chips"
              >
                {MEAL_TYPES.map((m) => {
                  const isActive = m === selectedMeal;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMeal(m)}
                      data-testid={`chip-meal-${m}`}
                      className="flex-1 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                      style={{
                        backgroundColor: isActive ? `${colors.primary}25` : "transparent",
                        color: isActive ? colors.primary : colors.textMuted,
                        border: `1px solid ${isActive ? `${colors.primary}55` : "transparent"}`,
                      }}
                    >
                      {MEAL_LABEL[m]}
                    </button>
                  );
                })}
              </div>
              <FoodSearch mealType={selectedMeal} />
              <QuickAdd mealType={selectedMeal} />

              {/* Camera scan button */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleImageCapture}
                data-testid="input-camera-capture"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: `${colors.surface}80`,
                  border: `1px dashed ${colors.surfaceBorder}`,
                  color: colors.textMuted,
                }}
                data-testid="button-scan-label"
              >
                <Camera size={16} />
                Scan Nutrition Label
              </button>
            </div>

            {/* Meal groups */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: colors.textMuted }}>
                  Today's Log
                </p>
                <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>
                  {totals.count} {totals.count === 1 ? "entry" : "entries"}
                </span>
              </div>
              {MEAL_TYPES.map((m) => (
                <MealGroupSection
                  key={m}
                  mealType={m}
                  label={MEAL_LABEL[m]}
                  entries={entriesByMeal[m]}
                  defaultOpen={entriesByMeal[m].length > 0 || m === selectedMeal}
                  onAdd={handleAddFromMealGroup}
                />
              ))}
            </div>

            {/* Workout log — burns flow into the energy ledger above */}
            <ExerciseSection
              entries={workouts}
              totalCalories={workoutBurned}
            />
          </div>
        )}

        {/* ─────────────── ENERGY ─────────────── */}
        {activeTab === "energy" && (
          <div className="flex flex-col gap-4" data-testid="tab-panel-energy">
            <HydrationCard waterIntake={day.waterIntake} waterGoal={day.waterGoal} />
            <EnergySettingsCard />
          </div>
        )}

        {/* ─────────────── MEALS ─────────────── */}
        {activeTab === "meals" && (
          <div className="flex flex-col gap-4" data-testid="tab-panel-meals">
            {/* Auto meal plan */}
            <button
              type="button"
              onClick={() => setAutoMealPlanOpen(true)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}08)`,
                border: `1px solid ${colors.primary}35`,
              }}
              data-testid="button-auto-meal-plan"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Sparkles size={18} style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: colors.text }}>Auto-Fill Meal Plan</p>
                <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                  Generate a full day's meals for your goal and diet
                </p>
              </div>
            </button>
            <SavedMealsList onCreate={() => setCreateOpen(true)} />
          </div>
        )}
      </div>

      <CreateMealModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AutoMealPlanModal open={autoMealPlanOpen} onClose={() => setAutoMealPlanOpen(false)} />

      {/* Nutrition label scan result modal */}
      <Dialog open={scanModalOpen} onOpenChange={(o) => { if (!scanLoading) setScanModalOpen(o); }}>
        <DialogContent className="max-w-sm border-white/10" style={{ backgroundColor: "#0a0f1e" }}>
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2" style={{ color: "#e2e8f0" }}>
              <Camera size={16} style={{ color: colors.primary }} />
              Nutrition Label Scan
            </DialogTitle>
          </DialogHeader>

          {scanLoading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: colors.primary }} />
              <p className="text-sm" style={{ color: "#94a3b8" }}>Reading nutrition label…</p>
            </div>
          )}

          {!scanLoading && scanError && (
            <div className="space-y-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <p className="text-sm" style={{ color: "#fca5a5" }}>{scanError}</p>
                {noApiKey && (
                  <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
                    Add your OPENAI_API_KEY to the environment to enable AI-powered label scanning.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setScanModalOpen(false)}
                className="w-full py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
              >
                Close
              </button>
            </div>
          )}

          {!scanLoading && scanResult && (
            <div className="space-y-3">
              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{scanResult.name}</p>
                {scanResult.servingSize && (
                  <p className="text-[11px]" style={{ color: "#94a3b8" }}>Serving: {scanResult.servingSize}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Calories", value: scanResult.calories, unit: "kcal" },
                    { label: "Protein", value: scanResult.protein, unit: "g" },
                    { label: "Carbs", value: scanResult.carbs, unit: "g" },
                    { label: "Fat", value: scanResult.fat, unit: "g" },
                    ...(scanResult.fiber != null ? [{ label: "Fiber", value: scanResult.fiber, unit: "g" }] : []),
                    ...(scanResult.sugar != null ? [{ label: "Sugar", value: scanResult.sugar, unit: "g" }] : []),
                    ...(scanResult.sodium != null ? [{ label: "Sodium", value: scanResult.sodium, unit: "mg" }] : []),
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="rounded p-2 text-center" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>{label}</p>
                      <p className="text-sm font-bold" style={{ color: colors.primary }}>{value ?? "—"}<span className="text-[10px] ml-0.5" style={{ color: "#64748b" }}>{unit}</span></p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddScannedItem}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                  style={{ backgroundColor: colors.primary, color: "#0a0f1e" }}
                  data-testid="button-add-scanned-item"
                >
                  <Plus size={14} />
                  Add to {MEAL_LABEL[selectedMeal]}
                </button>
                <button
                  type="button"
                  onClick={() => setScanModalOpen(false)}
                  className="px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#64748b" }}
                >
                  <XIcon size={16} />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SystemLayout>
  );
}

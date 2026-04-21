import { useEffect, useRef, useState } from "react";
import { X, Search, Plus, Minus, Check, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { searchFoods, type FoodSearchResult } from "@/lib/foodApi";
import { readDay, type NutritionEntry } from "@/lib/nutritionStore";
import { saveMeal, type SavedMealFood } from "@/lib/savedMealsStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

type DraftFood = SavedMealFood & { tempId: string };

export function CreateMealModal({ open, onClose }: Props) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const [name, setName] = useState("");
  const [foods, setFoods] = useState<DraftFood[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [todayEntries, setTodayEntries] = useState<NutritionEntry[]>([]);
  const debounceRef = useRef<number | null>(null);
  const searchTokenRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    setName("");
    setFoods([]);
    setQuery("");
    setResults([]);
    setTodayEntries(readDay().entries);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const myToken = ++searchTokenRef.current;
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await searchFoods(query, 10);
        // Drop stale results — only the latest issued request may write state.
        if (myToken !== searchTokenRef.current) return;
        setResults(r);
      } finally {
        if (myToken === searchTokenRef.current) setSearching(false);
      }
    }, 280);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const addDraftFromSearch = (f: FoodSearchResult) => {
    setFoods((prev) => [
      ...prev,
      {
        tempId: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        quantity: 1,
        servingLabel: f.servingLabel,
      },
    ]);
    setQuery("");
    setResults([]);
  };

  const addDraftFromLog = (e: NutritionEntry) => {
    setFoods((prev) => [
      ...prev,
      {
        tempId: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: e.name,
        calories: e.calories,
        protein: e.protein,
        carbs: e.carbs,
        fat: e.fat,
        quantity: e.quantity,
        servingLabel: e.servingLabel,
      },
    ]);
  };

  const removeDraft = (tempId: string) => {
    setFoods((prev) => prev.filter((f) => f.tempId !== tempId));
  };

  const updateQty = (tempId: string, qty: number) => {
    setFoods((prev) =>
      prev.map((f) => (f.tempId === tempId ? { ...f, quantity: Math.max(0.25, qty) } : f)),
    );
  };

  const totals = foods.reduce(
    (acc, f) => {
      acc.calories += f.calories * f.quantity;
      acc.protein += f.protein * f.quantity;
      acc.carbs += f.carbs * f.quantity;
      acc.fat += f.fat * f.quantity;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const handleSave = () => {
    if (foods.length === 0) return;
    setSaving(true);
    try {
      saveMeal(
        name || "Untitled Meal",
        foods.map(({ tempId, ...rest }) => rest),
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[125] flex items-end sm:items-center justify-center p-3"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
      data-testid="create-meal-modal"
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.primary}55`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 32px ${colors.primaryGlow}30`,
          maxHeight: "85vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: colors.surfaceBorder }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: colors.textMuted }}>
              Compose
            </p>
            <p className="text-base font-bold" style={{ color: colors.text }}>
              New Meal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: colors.textMuted }}
            data-testid="button-create-meal-close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Meal name (e.g. Post Workout)"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: `${colors.primary}0a`,
              border: `1px solid ${colors.primary}35`,
              color: colors.text,
            }}
            data-testid="input-meal-name"
          />

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              backgroundColor: colors.background,
              border: `1px solid ${colors.surfaceBorder}`,
            }}
          >
            <Search size={14} style={{ color: colors.textMuted }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search to add food..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: colors.text }}
              data-testid="input-meal-search"
            />
            {searching && <Loader2 size={13} className="animate-spin" style={{ color: colors.primary }} />}
          </div>

          {results.length > 0 && (
            <div
              className="rounded-lg divide-y overflow-hidden"
              style={{
                backgroundColor: colors.background,
                border: `1px solid ${colors.surfaceBorder}`,
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              {results.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => addDraftFromSearch(f)}
                  data-testid={`meal-search-result-${f.id}`}
                  className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/5"
                >
                  <span className="text-xs truncate" style={{ color: colors.text }}>{f.name}</span>
                  <span className="text-[10px] font-mono shrink-0" style={{ color: colors.primary }}>
                    {f.calories} kcal
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* From today's log */}
          {todayEntries.length > 0 && (
            <details className="rounded-lg" style={{ border: `1px solid ${colors.surfaceBorder}` }}>
              <summary
                className="px-3 py-2 text-xs cursor-pointer flex items-center justify-between"
                style={{ color: colors.textMuted }}
              >
                <span>From today's log ({todayEntries.length})</span>
              </summary>
              <div className="divide-y max-h-40 overflow-y-auto">
                {todayEntries.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => addDraftFromLog(e)}
                    className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/5"
                    data-testid={`meal-from-log-${e.id}`}
                  >
                    <span className="text-xs truncate" style={{ color: colors.text }}>{e.name}</span>
                    <Plus size={11} style={{ color: colors.primary }} />
                  </button>
                ))}
              </div>
            </details>
          )}

          {/* Drafted foods */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.textMuted }}>
              In this meal ({foods.length})
            </p>
            {foods.length === 0 ? (
              <div
                className="rounded-lg px-3 py-4 text-center text-[11px]"
                style={{
                  border: `1px dashed ${colors.surfaceBorder}`,
                  color: colors.textMuted,
                }}
              >
                Add foods from search or today's log.
              </div>
            ) : (
              foods.map((f) => (
                <div
                  key={f.tempId}
                  className="rounded-lg px-2.5 py-2 flex items-center gap-2"
                  style={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.surfaceBorder}`,
                  }}
                  data-testid={`meal-draft-${f.tempId}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: colors.text }}>{f.name}</p>
                    <p className="text-[9px] font-mono" style={{ color: colors.textMuted }}>
                      {Math.round(f.calories * f.quantity)} kcal
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQty(f.tempId, +(f.quantity - 0.25).toFixed(2))}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: colors.surface, color: colors.primary, border: `1px solid ${colors.surfaceBorder}` }}
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-9 text-center text-xs font-mono" style={{ color: colors.text }}>
                      {f.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(f.tempId, +(f.quantity + 0.25).toFixed(2))}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: colors.surface, color: colors.primary, border: `1px solid ${colors.surfaceBorder}` }}
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDraft(f.tempId)}
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ color: "#ef4444" }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer totals + save */}
        <div className="p-3 border-t" style={{ borderColor: colors.surfaceBorder }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.textMuted }}>
              Total
            </span>
            <span className="text-xs font-mono" style={{ color: colors.text }}>
              <span style={{ color: colors.primary }}>{Math.round(totals.calories)}</span> kcal ·
              <span style={{ color: "#22c55e" }}> P</span>{totals.protein.toFixed(0)}g ·
              <span style={{ color: "#f59e0b" }}> C</span>{totals.carbs.toFixed(0)}g ·
              <span style={{ color: "#ef4444" }}> F</span>{totals.fat.toFixed(0)}g
            </span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={foods.length === 0 || saving}
            data-testid="button-save-meal"
            className="w-full rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            style={{ backgroundColor: colors.primary, color: colors.background }}
          >
            <Check size={14} /> Save Meal
          </button>
        </div>
      </div>
    </div>
  );
}

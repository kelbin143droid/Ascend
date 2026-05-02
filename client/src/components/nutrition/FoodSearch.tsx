import { useEffect, useRef, useState } from "react";
import { Search, Plus, Minus, X, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { searchFoods, type FoodSearchResult } from "@/lib/foodApi";
import { addEntry, type MealType } from "@/lib/nutritionStore";

interface FoodSearchProps {
  mealType?: MealType;
}

export function FoodSearch({ mealType }: FoodSearchProps = {}) {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState(1);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await searchFoods(query, 15);
        setResults(r);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const openItem = (f: FoodSearchResult) => {
    setSelected(f);
    setQuantity(1);
  };

  const confirmAdd = () => {
    if (!selected) return;
    addEntry({
      name: selected.name,
      calories: selected.calories,
      protein: selected.protein,
      carbs: selected.carbs,
      fat: selected.fat,
      quantity,
      servingLabel: selected.servingLabel,
      mealType,
    });
    setSelected(null);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="w-full">
      {/* Search input */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.surfaceBorder}`,
        }}
      >
        <Search size={15} style={{ color: colors.textMuted }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search food..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: colors.text }}
          data-testid="input-food-search"
        />
        {loading && <Loader2 size={14} className="animate-spin" style={{ color: colors.primary }} />}
        {query && !loading && (
          <button
            type="button"
            onClick={() => setQuery("")}
            data-testid="button-clear-search"
            className="p-0.5"
            style={{ color: colors.textMuted }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div
          className="mt-2 rounded-xl divide-y overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.surfaceBorder}`,
            maxHeight: 280,
            overflowY: "auto",
          }}
          data-testid="food-search-results"
        >
          {results.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => openItem(f)}
              data-testid={`food-result-${f.id}`}
              className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-colors hover:bg-white/5"
              style={{ borderColor: colors.surfaceBorder }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: colors.text }}>
                  {f.name}
                </p>
                <p className="text-[10px]" style={{ color: colors.textMuted }}>
                  {f.brand ? `${f.brand} · ` : ""}{f.servingLabel}
                </p>
              </div>
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0"
                style={{
                  backgroundColor: `${colors.primary}18`,
                  color: colors.primary,
                }}
              >
                {f.calories} kcal
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Add modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={() => setSelected(null)}
          data-testid="food-add-modal"
        >
          <div
            className="w-full max-w-sm rounded-2xl p-4"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.primary}55`,
              boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 32px ${colors.primaryGlow}30`,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-base font-bold leading-tight" style={{ color: colors.text }}>
                  {selected.name}
                </p>
                <p className="text-[11px]" style={{ color: colors.textMuted }}>
                  {selected.brand ? `${selected.brand} · ` : ""}per {selected.servingLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg shrink-0"
                style={{ color: colors.textMuted }}
                data-testid="button-modal-close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quantity stepper */}
            <div className="flex items-center justify-between mb-3 rounded-lg p-2" style={{ backgroundColor: `${colors.primary}10` }}>
              <span className="text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>
                Servings
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(0.25, +(q - 0.25).toFixed(2)))}
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: colors.surface, color: colors.primary, border: `1px solid ${colors.surfaceBorder}` }}
                  data-testid="button-qty-down"
                >
                  <Minus size={13} />
                </button>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0.25, parseFloat(e.target.value) || 0.25))}
                  className="w-16 text-center font-mono text-sm rounded-md py-1 outline-none"
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.text,
                    border: `1px solid ${colors.surfaceBorder}`,
                  }}
                  data-testid="input-qty"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => +(q + 0.25).toFixed(2))}
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: colors.surface, color: colors.primary, border: `1px solid ${colors.surfaceBorder}` }}
                  data-testid="button-qty-up"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Macro preview */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: "kcal", val: Math.round(selected.calories * quantity), color: colors.primary },
                { label: "P",    val: +(selected.protein * quantity).toFixed(1), color: "#22c55e" },
                { label: "C",    val: +(selected.carbs * quantity).toFixed(1),   color: "#f59e0b" },
                { label: "F",    val: +(selected.fat * quantity).toFixed(1),     color: "#ef4444" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-md py-2 text-center"
                  style={{
                    backgroundColor: `${m.color}12`,
                    border: `1px solid ${m.color}28`,
                  }}
                >
                  <p className="text-[9px] uppercase font-bold" style={{ color: m.color }}>{m.label}</p>
                  <p className="text-sm font-mono font-bold" style={{ color: colors.text }}>{m.val}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={confirmAdd}
              className="w-full rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: colors.primary, color: colors.background }}
              data-testid="button-add-to-log"
            >
              <Plus size={14} /> Add to Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

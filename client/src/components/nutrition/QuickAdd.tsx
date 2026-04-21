import { useState } from "react";
import { Plus, Zap } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { addEntry } from "@/lib/nutritionStore";

export function QuickAdd() {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const reset = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  };

  const handleAdd = () => {
    const cal = parseFloat(calories) || 0;
    if (cal <= 0 && !name.trim()) return;
    addEntry({
      name: name.trim() || "Quick entry",
      calories: cal,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      quantity: 1,
      servingLabel: "Quick",
    });
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        data-testid="button-quick-add-toggle"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl px-3 py-3 flex items-center gap-2 text-sm font-bold transition-transform active:scale-[0.98]"
        style={{
          backgroundColor: `${colors.primary}14`,
          border: `1px dashed ${colors.primary}55`,
          color: colors.primary,
        }}
      >
        <Zap size={14} />
        Quick add calories
      </button>
    );
  }

  const inputStyle = {
    backgroundColor: "transparent",
    border: `1px solid ${colors.surfaceBorder}`,
    color: colors.text,
  } as const;

  return (
    <div
      className="w-full rounded-xl p-3"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.primary}45`,
        boxShadow: `0 0 18px ${colors.primaryGlow}22`,
      }}
      data-testid="quick-add-panel"
    >
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mb-2 rounded-md px-2.5 py-2 text-sm outline-none"
        style={inputStyle}
        data-testid="input-quick-name"
      />
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="rounded-md px-2.5 py-2 text-sm outline-none"
          style={inputStyle}
          data-testid="input-quick-calories"
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Protein g"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          className="rounded-md px-2.5 py-2 text-sm outline-none"
          style={inputStyle}
          data-testid="input-quick-protein"
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Carbs g"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          className="rounded-md px-2.5 py-2 text-sm outline-none"
          style={inputStyle}
          data-testid="input-quick-carbs"
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Fat g"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          className="rounded-md px-2.5 py-2 text-sm outline-none"
          style={inputStyle}
          data-testid="input-quick-fat"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          className="flex-1 rounded-md px-3 py-2 text-xs font-semibold"
          style={{ color: colors.textMuted, border: `1px solid ${colors.surfaceBorder}` }}
          data-testid="button-quick-cancel"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 rounded-md px-3 py-2 text-xs font-bold flex items-center justify-center gap-1"
          style={{ backgroundColor: colors.primary, color: colors.background }}
          data-testid="button-quick-add"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

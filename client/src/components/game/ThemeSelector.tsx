import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Palette, X, Clock, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const presetColors = [
  "#00d4ff", "#ff3333", "#6b21a8", "#00ff41", "#ffd700", 
  "#ff00ff", "#f472b6", "#0284c7", "#ff6600", "#34d399"
];

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"clock" | "background">("clock");
  const { 
    theme, 
    clockTheme,
    backgroundTheme,
    setClockTheme, 
    setBackgroundTheme,
    setCustomClockColor,
    setCustomBackgroundColor,
    customClockColor,
    customBackgroundColor,
    allThemes 
  } = useTheme();

  const handleColorChange = (color: string) => {
    if (activeTab === "clock") {
      setCustomClockColor(color);
    } else {
      setCustomBackgroundColor(color);
    }
  };

  const currentThemeId = activeTab === "clock" ? clockTheme.id : backgroundTheme.id;
  const currentCustomColor = activeTab === "clock" ? customClockColor : customBackgroundColor;

  return (
    <>
      <button
        data-testid="button-theme-toggle"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.surfaceBorder}`,
          boxShadow: `0 0 15px ${theme.colors.primaryGlow}`
        }}
      >
        <Palette size={18} style={{ color: theme.colors.primary }} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="relative w-full max-w-sm rounded-lg p-4 max-h-[80vh] overflow-y-auto"
            style={{
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.surfaceBorder}`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="font-display text-lg tracking-wider"
                style={{ color: theme.colors.primary }}
              >
                THEME SELECTOR
              </h3>
              <button
                data-testid="button-theme-close"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textMuted
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2 mb-4 p-1 rounded-lg bg-black/20" style={{ border: `1px solid ${theme.colors.surfaceBorder}` }}>
              <button
                onClick={() => setActiveTab("clock")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-display tracking-wider transition-all"
                )}
                style={activeTab === "clock" 
                  ? { backgroundColor: theme.colors.primary, color: theme.colors.background } 
                  : { color: theme.colors.textMuted }}
              >
                <Clock size={14} />
                CLOCK
              </button>
              <button
                onClick={() => setActiveTab("background")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-display tracking-wider transition-all"
                )}
                style={activeTab === "background" 
                  ? { backgroundColor: theme.colors.primary, color: theme.colors.background } 
                  : { color: theme.colors.textMuted }}
              >
                <ImageIcon size={14} />
                BG
              </button>
            </div>

            <div 
              className="mb-4 p-3 rounded-lg"
              style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.surfaceBorder}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-display tracking-wider" style={{ color: theme.colors.textMuted }}>
                  CUSTOM COLOR
                </span>
                <input
                  type="color"
                  value={currentCustomColor || (activeTab === "clock" ? clockTheme.colors.ring : backgroundTheme.colors.primary)}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-none"
                  style={{ backgroundColor: "transparent" }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110 border-2"
                    style={{ 
                      backgroundColor: color,
                      borderColor: currentCustomColor === color ? "#ffffff" : "transparent"
                    }}
                  />
                ))}
              </div>
            </div>

            <div 
              className="text-xs font-display tracking-wider mb-2" 
              style={{ color: theme.colors.textMuted }}
            >
              PRESET THEMES
            </div>

            <div className="grid grid-cols-2 gap-3">
              {allThemes.map((t) => {
                const isSelected = !currentCustomColor && currentThemeId === t.id;
                return (
                  <button
                    key={t.id}
                    data-testid={`button-theme-${t.id}`}
                    onClick={() => {
                      if (activeTab === "clock") {
                        setClockTheme(t.id);
                      } else {
                        setBackgroundTheme(t.id);
                      }
                    }}
                    className="relative p-3 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: t.colors.surface,
                      border: isSelected 
                        ? `2px solid ${t.colors.primary}` 
                        : `1px solid ${t.colors.surfaceBorder}`,
                      boxShadow: isSelected 
                        ? `0 0 20px ${t.colors.primaryGlow}` 
                        : "none"
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{t.icon}</span>
                      <span 
                        className="font-display text-xs tracking-wider"
                        style={{ color: t.colors.primary }}
                      >
                        {t.name}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {activeTab === "clock" ? (
                        <>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.ring }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.clockHand }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.centerDot }} />
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.background }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.surface }} />
                        </>
                      )}
                    </div>
                    {isSelected && (
                      <div 
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: t.colors.primary, color: t.colors.background }}
                      >
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

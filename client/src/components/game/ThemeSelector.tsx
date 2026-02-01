import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Palette, X, Clock, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"clock" | "background">("clock");
  const { 
    clockTheme, bgTheme, setClockTheme, setBgTheme, 
    setCustomClockColor, setCustomBgColor, allThemes 
  } = useTheme();

  const currentThemeId = activeTab === "clock" ? clockTheme.id : bgTheme.id;
  const setTheme = activeTab === "clock" ? setClockTheme : setBgTheme;

  return (
    <>
      <button
        data-testid="button-theme-toggle"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{
          backgroundColor: bgTheme.colors.surface,
          border: `1px solid ${bgTheme.colors.surfaceBorder}`,
          boxShadow: `0 0 15px ${bgTheme.colors.primaryGlow}`
        }}
      >
        <Palette size={18} style={{ color: bgTheme.colors.primary }} />
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
              backgroundColor: bgTheme.colors.background,
              border: `1px solid ${bgTheme.colors.surfaceBorder}`
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="font-display text-lg tracking-wider"
                style={{ color: bgTheme.colors.primary }}
              >
                THEME SELECTOR
              </h3>
              <button
                data-testid="button-theme-close"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: bgTheme.colors.surface,
                  color: bgTheme.colors.textMuted
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2 mb-4 p-1 rounded-lg bg-black/20" style={{ border: `1px solid ${bgTheme.colors.surfaceBorder}` }}>
              <button
                onClick={() => setActiveTab("clock")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-display tracking-wider transition-all",
                  activeTab === "clock" ? "bg-primary text-background shadow-lg" : "text-muted-foreground hover:bg-black/10"
                )}
                style={activeTab === "clock" ? { backgroundColor: bgTheme.colors.primary, color: bgTheme.colors.background } : {}}
              >
                <Clock size={14} />
                CLOCK
              </button>
              <button
                onClick={() => setActiveTab("background")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-display tracking-wider transition-all",
                  activeTab === "background" ? "bg-primary text-background shadow-lg" : "text-muted-foreground hover:bg-black/10"
                )}
                style={activeTab === "background" ? { backgroundColor: bgTheme.colors.primary, color: bgTheme.colors.background } : {}}
              >
                <ImageIcon size={14} />
                BG
              </button>
            </div>

            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-widest mb-2 block opacity-60">Custom Color</label>
              <input 
                type="color" 
                className="w-full h-8 rounded cursor-pointer bg-transparent border-none"
                onChange={(e) => {
                  if (activeTab === "clock") setCustomClockColor(e.target.value);
                  else setCustomBgColor(e.target.value);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {allThemes.map((t) => (
                <button
                  key={t.id}
                  data-testid={`button-theme-${t.id}`}
                  onClick={() => {
                    setTheme(t.id);
                  }}
                  className="relative p-3 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: t.colors.surface,
                    border: currentThemeId === t.id 
                      ? `2px solid ${t.colors.primary}` 
                      : `1px solid ${t.colors.surfaceBorder}`,
                    boxShadow: currentThemeId === t.id 
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
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: t.colors.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: t.colors.secondary }}
                    />
                  </div>
                  {currentThemeId === t.id && (
                    <div 
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: t.colors.primary, color: t.colors.background }}
                    >
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

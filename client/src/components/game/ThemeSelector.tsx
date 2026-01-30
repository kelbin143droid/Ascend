import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Palette, X } from "lucide-react";

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, allThemes } = useTheme();

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

            <div className="grid grid-cols-2 gap-3">
              {allThemes.map((t) => (
                <button
                  key={t.id}
                  data-testid={`button-theme-${t.id}`}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className="relative p-3 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: t.colors.surface,
                    border: theme.id === t.id 
                      ? `2px solid ${t.colors.primary}` 
                      : `1px solid ${t.colors.surfaceBorder}`,
                    boxShadow: theme.id === t.id 
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
                  <p 
                    className="text-[10px] leading-tight"
                    style={{ color: t.colors.textMuted }}
                  >
                    {t.description}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: t.colors.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: t.colors.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: t.colors.accent }}
                    />
                  </div>
                  {theme.id === t.id && (
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

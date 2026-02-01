import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppTheme, getThemeById, themes } from "@/lib/themes";

interface ThemeState {
  clockThemeId: string;
  bgThemeId: string;
  customClockColor: string | null;
  customBgColor: string | null;
}

interface ThemeContextType {
  theme: AppTheme;
  clockTheme: AppTheme;
  bgTheme: AppTheme;
  setClockTheme: (themeId: string) => void;
  setBgTheme: (themeId: string) => void;
  setCustomClockColor: (color: string | null) => void;
  setCustomBgColor: (color: string | null) => void;
  allThemes: AppTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app-theme-state");
      if (saved) return JSON.parse(saved);
    }
    return {
      clockThemeId: "default",
      bgThemeId: "default",
      customClockColor: null,
      customBgColor: null,
    };
  });

  const clockTheme = getThemeById(state.clockThemeId);
  const bgTheme = getThemeById(state.bgThemeId);

  useEffect(() => {
    localStorage.setItem("app-theme-state", JSON.stringify(state));
    
    const root = document.documentElement;
    const primaryColor = state.customClockColor || clockTheme.colors.primary;
    const bgColor = state.customBgColor || bgTheme.colors.background;

    root.style.setProperty("--theme-primary", primaryColor);
    root.style.setProperty("--theme-background", bgColor);
    // Update other properties derived from these or from the combined theme
    root.style.setProperty("--theme-primary-glow", state.customClockColor ? `${state.customClockColor}4d` : clockTheme.colors.primaryGlow);
    root.style.setProperty("--theme-surface", bgTheme.colors.surface);
    root.style.setProperty("--theme-surface-border", bgTheme.colors.surfaceBorder);
    root.style.setProperty("--theme-text", bgTheme.colors.text);
    root.style.setProperty("--theme-text-muted", bgTheme.colors.textMuted);
  }, [state, clockTheme, bgTheme]);

  const setClockTheme = (clockThemeId: string) => setState(s => ({ ...s, clockThemeId, customClockColor: null }));
  const setBgTheme = (bgThemeId: string) => setState(s => ({ ...s, bgThemeId, customBgColor: null }));
  const setCustomClockColor = (customClockColor: string | null) => setState(s => ({ ...s, customClockColor }));
  const setCustomBgColor = (customBgColor: string | null) => setState(s => ({ ...s, customBgColor }));

  return (
    <ThemeContext.Provider value={{ 
      theme: bgTheme, // Fallback for components still using 'theme'
      clockTheme,
      bgTheme,
      setClockTheme,
      setBgTheme,
      setCustomClockColor,
      setCustomBgColor,
      allThemes: themes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

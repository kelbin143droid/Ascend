import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppTheme, getThemeById, themes } from "@/lib/themes";

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (themeId: string) => void;
  allThemes: AppTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("app-theme") || "default";
    }
    return "default";
  });

  const theme = getThemeById(themeId);

  useEffect(() => {
    localStorage.setItem("app-theme", themeId);
    
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", theme.colors.primary);
    root.style.setProperty("--theme-primary-glow", theme.colors.primaryGlow);
    root.style.setProperty("--theme-secondary", theme.colors.secondary);
    root.style.setProperty("--theme-accent", theme.colors.accent);
    root.style.setProperty("--theme-background", theme.colors.background);
    root.style.setProperty("--theme-surface", theme.colors.surface);
    root.style.setProperty("--theme-surface-border", theme.colors.surfaceBorder);
    root.style.setProperty("--theme-text", theme.colors.text);
    root.style.setProperty("--theme-text-muted", theme.colors.textMuted);
  }, [themeId, theme]);

  const setTheme = (newThemeId: string) => {
    setThemeId(newThemeId);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, allThemes: themes }}>
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

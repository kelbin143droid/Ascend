import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppTheme, getThemeById, themes, createCustomTheme } from "@/lib/themes";
import { getGender } from "@/lib/userState";

function getGenderDefaultTheme(): string {
  const g = getGender();
  if (g === "male") return "cyber-hunter";
  if (g === "female") return "arcane-fable";
  return "default";
}

interface ThemeContextType {
  theme: AppTheme;
  clockTheme: AppTheme;
  backgroundTheme: AppTheme;
  setClockTheme: (themeId: string) => void;
  setBackgroundTheme: (themeId: string) => void;
  setCustomClockColor: (color: string) => void;
  setCustomBackgroundColor: (color: string) => void;
  customClockColor: string | null;
  customBackgroundColor: string | null;
  allThemes: AppTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [clockThemeId, setClockThemeId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clock-theme") || "default";
    }
    return "default";
  });

  const [backgroundThemeId, setBackgroundThemeId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("background-theme") || getGenderDefaultTheme();
    }
    return "default";
  });

  const [customClockColor, setCustomClockColorState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("custom-clock-color");
    }
    return null;
  });

  const [customBackgroundColor, setCustomBackgroundColorState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("custom-background-color");
    }
    return null;
  });

  const clockTheme = customClockColor 
    ? createCustomTheme("clock", customClockColor) 
    : getThemeById(clockThemeId);
  
  const backgroundTheme = customBackgroundColor 
    ? createCustomTheme("background", customBackgroundColor) 
    : getThemeById(backgroundThemeId);

  const theme: AppTheme = {
    ...backgroundTheme,
    colors: {
      ...backgroundTheme.colors,
      ring: clockTheme.colors.ring,
      ringGlow: clockTheme.colors.ringGlow,
      tickMark: clockTheme.colors.tickMark,
      clockHand: clockTheme.colors.clockHand,
      centerDot: clockTheme.colors.centerDot,
    }
  };

  useEffect(() => {
    localStorage.setItem("clock-theme", clockThemeId);
    localStorage.setItem("background-theme", backgroundThemeId);
    if (customClockColor) {
      localStorage.setItem("custom-clock-color", customClockColor);
    } else {
      localStorage.removeItem("custom-clock-color");
    }
    if (customBackgroundColor) {
      localStorage.setItem("custom-background-color", customBackgroundColor);
    } else {
      localStorage.removeItem("custom-background-color");
    }
    
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
  }, [clockThemeId, backgroundThemeId, customClockColor, customBackgroundColor, theme]);

  const setClockTheme = (newThemeId: string) => {
    setClockThemeId(newThemeId);
    setCustomClockColorState(null);
  };

  const setBackgroundTheme = (newThemeId: string) => {
    setBackgroundThemeId(newThemeId);
    setCustomBackgroundColorState(null);
  };

  const setCustomClockColor = (color: string) => {
    setCustomClockColorState(color);
  };

  const setCustomBackgroundColor = (color: string) => {
    setCustomBackgroundColorState(color);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      clockTheme,
      backgroundTheme,
      setClockTheme, 
      setBackgroundTheme,
      setCustomClockColor,
      setCustomBackgroundColor,
      customClockColor,
      customBackgroundColor,
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

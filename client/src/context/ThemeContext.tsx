import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppTheme, getThemeById, themes, createCustomTheme } from "@/lib/themes";

export type FontFamilyKey = "system" | "display" | "serif" | "mono" | "rounded";
export type FontSizeKey = "sm" | "md" | "lg" | "xl";

export const FONT_FAMILY_OPTIONS: { key: FontFamilyKey; label: string; stack: string }[] = [
  { key: "system", label: "System", stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { key: "display", label: "Display", stack: "'Orbitron', 'Rajdhani', system-ui, sans-serif" },
  { key: "serif", label: "Serif", stack: "'Georgia', 'Times New Roman', serif" },
  { key: "mono", label: "Mono", stack: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace" },
  { key: "rounded", label: "Rounded", stack: "'Nunito', 'Quicksand', system-ui, sans-serif" },
];

export const FONT_SIZE_OPTIONS: { key: FontSizeKey; label: string; px: number }[] = [
  { key: "sm", label: "Small", px: 14 },
  { key: "md", label: "Medium", px: 16 },
  { key: "lg", label: "Large", px: 18 },
  { key: "xl", label: "Extra Large", px: 20 },
];

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

  // ── Customization layer ──────────────────────────
  fontFamily: FontFamilyKey;
  setFontFamily: (key: FontFamilyKey) => void;
  fontSize: FontSizeKey;
  setFontSize: (key: FontSizeKey) => void;
  customBackgroundImage: string | null;
  setCustomBackgroundImage: (dataUrl: string | null) => void;
  customPrimaryColor: string | null;
  setCustomPrimaryColor: (hex: string | null) => void;
  customTextColor: string | null;
  setCustomTextColor: (hex: string | null) => void;
  resetCustomization: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(key); } catch { return null; }
};

const safeSet = (key: string, value: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* quota or disabled */ }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [clockThemeId, setClockThemeId] = useState<string>(() => {
    const explicit = safeGet("clock-theme");
    if (explicit) return explicit;
    const gender = safeGet("ascend_gender");
    if (gender === "male" || gender === "female") return gender;
    return "default";
  });

  const [backgroundThemeId, setBackgroundThemeId] = useState<string>(() => {
    const explicit = safeGet("background-theme");
    if (explicit) return explicit;
    const gender = safeGet("ascend_gender");
    if (gender === "male" || gender === "female") return gender;
    return "default";
  });

  const [customClockColor, setCustomClockColorState] = useState<string | null>(() => safeGet("custom-clock-color"));
  const [customBackgroundColor, setCustomBackgroundColorState] = useState<string | null>(() => safeGet("custom-background-color"));

  // Customization layer
  const [fontFamily, setFontFamilyState] = useState<FontFamilyKey>(() => {
    const v = safeGet("ascend_font_family");
    return (FONT_FAMILY_OPTIONS.find(f => f.key === v)?.key) ?? "system";
  });
  const [fontSize, setFontSizeState] = useState<FontSizeKey>(() => {
    const v = safeGet("ascend_font_size");
    return (FONT_SIZE_OPTIONS.find(f => f.key === v)?.key) ?? "md";
  });
  const [customBackgroundImage, setCustomBackgroundImageState] = useState<string | null>(() => safeGet("ascend_bg_image"));
  const [customPrimaryColor, setCustomPrimaryColorState] = useState<string | null>(() => safeGet("ascend_custom_primary"));
  const [customTextColor, setCustomTextColorState] = useState<string | null>(() => safeGet("ascend_custom_text"));

  const baseClockTheme = customClockColor 
    ? createCustomTheme("clock", customClockColor) 
    : getThemeById(clockThemeId);
  
  const baseBackgroundTheme = customBackgroundColor 
    ? createCustomTheme("background", customBackgroundColor) 
    : getThemeById(backgroundThemeId);

  // Apply user color overrides on top of the resolved background theme.
  const backgroundTheme: AppTheme = (customPrimaryColor || customTextColor)
    ? {
        ...baseBackgroundTheme,
        colors: {
          ...baseBackgroundTheme.colors,
          ...(customPrimaryColor && {
            primary: customPrimaryColor,
            primaryGlow: hexToRgba(customPrimaryColor, 0.45),
          }),
          ...(customTextColor && {
            text: customTextColor,
            textMuted: hexToRgba(customTextColor, 0.55),
          }),
        },
      }
    : baseBackgroundTheme;

  const clockTheme = baseClockTheme;

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
    safeSet("clock-theme", clockThemeId);
    safeSet("background-theme", backgroundThemeId);
    safeSet("custom-clock-color", customClockColor);
    safeSet("custom-background-color", customBackgroundColor);
    safeSet("ascend_font_family", fontFamily);
    safeSet("ascend_font_size", fontSize);
    safeSet("ascend_bg_image", customBackgroundImage);
    safeSet("ascend_custom_primary", customPrimaryColor);
    safeSet("ascend_custom_text", customTextColor);

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

    // Customization vars
    const ff = FONT_FAMILY_OPTIONS.find(f => f.key === fontFamily) ?? FONT_FAMILY_OPTIONS[0];
    const fs = FONT_SIZE_OPTIONS.find(f => f.key === fontSize) ?? FONT_SIZE_OPTIONS[1];
    root.style.setProperty("--app-font-family", ff.stack);
    root.style.setProperty("--app-font-size", `${fs.px}px`);
    root.style.setProperty("--app-bg-image", customBackgroundImage ? `url("${customBackgroundImage}")` : "none");
    if (customBackgroundImage) {
      document.body.classList.add("has-custom-bg");
    } else {
      document.body.classList.remove("has-custom-bg");
    }
  }, [clockThemeId, backgroundThemeId, customClockColor, customBackgroundColor, fontFamily, fontSize, customBackgroundImage, customPrimaryColor, customTextColor, theme]);

  const setClockTheme = (newThemeId: string) => {
    setClockThemeId(newThemeId);
    setCustomClockColorState(null);
  };
  const setBackgroundTheme = (newThemeId: string) => {
    setBackgroundThemeId(newThemeId);
    setCustomBackgroundColorState(null);
  };
  const setCustomClockColor = (color: string) => setCustomClockColorState(color);
  const setCustomBackgroundColor = (color: string) => setCustomBackgroundColorState(color);

  const setFontFamily = (key: FontFamilyKey) => setFontFamilyState(key);
  const setFontSize = (key: FontSizeKey) => setFontSizeState(key);
  const setCustomBackgroundImage = (v: string | null) => setCustomBackgroundImageState(v);
  const setCustomPrimaryColor = (v: string | null) => setCustomPrimaryColorState(v);
  const setCustomTextColor = (v: string | null) => setCustomTextColorState(v);

  const resetCustomization = () => {
    setCustomBackgroundImageState(null);
    setCustomPrimaryColorState(null);
    setCustomTextColorState(null);
    setCustomBackgroundColorState(null);
    setCustomClockColorState(null);
    setFontFamilyState("system");
    setFontSizeState("md");
    // Restore the gender-default theme if available, otherwise "default".
    const gender = safeGet("ascend_gender");
    const fallback = (gender === "male" || gender === "female") ? gender : "default";
    setBackgroundThemeId(fallback);
    setClockThemeId(fallback);
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
      allThemes: themes,

      fontFamily,
      setFontFamily,
      fontSize,
      setFontSize,
      customBackgroundImage,
      setCustomBackgroundImage,
      customPrimaryColor,
      setCustomPrimaryColor,
      customTextColor,
      setCustomTextColor,
      resetCustomization,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  if (!/^#([0-9a-f]{6})$/i.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

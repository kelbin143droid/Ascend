export interface AppTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: {
    primary: string;
    primaryGlow: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundGradient: string;
    surface: string;
    surfaceBorder: string;
    text: string;
    textMuted: string;
    ring: string;
    ringGlow: string;
    tickMark: string;
    clockHand: string;
    centerDot: string;
  };
}

export const themes: AppTheme[] = [
  {
    id: "default",
    name: "System Blue",
    description: "Classic cyberpunk cyan aesthetic",
    icon: "💎",
    colors: {
      primary: "#00d4ff",
      primaryGlow: "rgba(0, 212, 255, 0.3)",
      secondary: "#a855f7",
      accent: "#ec4899",
      background: "#0a0a0f",
      backgroundGradient: "radial-gradient(ellipse at center, rgba(0,50,80,0.15) 0%, rgba(10,10,15,1) 70%)",
      surface: "rgba(0, 20, 40, 0.6)",
      surfaceBorder: "rgba(0, 212, 255, 0.2)",
      text: "#ffffff",
      textMuted: "rgba(255, 255, 255, 0.5)",
      ring: "#00d4ff",
      ringGlow: "rgba(0, 212, 255, 0.4)",
      tickMark: "rgba(0, 212, 255, 0.4)",
      clockHand: "#00d4ff",
      centerDot: "#00d4ff"
    }
  },
  {
    id: "aggressive",
    name: "Blood Ascendant",
    description: "Intense red and black combat theme",
    icon: "🔥",
    colors: {
      primary: "#ff3333",
      primaryGlow: "rgba(255, 51, 51, 0.4)",
      secondary: "#ff6600",
      accent: "#ffcc00",
      background: "#0f0505",
      backgroundGradient: "radial-gradient(ellipse at center, rgba(80,10,10,0.3) 0%, rgba(15,5,5,1) 70%)",
      surface: "rgba(40, 5, 5, 0.7)",
      surfaceBorder: "rgba(255, 51, 51, 0.3)",
      text: "#ffffff",
      textMuted: "rgba(255, 200, 200, 0.5)",
      ring: "#ff3333",
      ringGlow: "rgba(255, 51, 51, 0.5)",
      tickMark: "rgba(255, 100, 50, 0.5)",
      clockHand: "#ff5500",
      centerDot: "#ff3333"
    }
  },
  {
    id: "dark",
    name: "Shadow Realm",
    description: "Deep darkness with subtle purple",
    icon: "🌑",
    colors: {
      primary: "#6b21a8",
      primaryGlow: "rgba(107, 33, 168, 0.3)",
      secondary: "#4c1d95",
      accent: "#8b5cf6",
      background: "#050508",
      backgroundGradient: "radial-gradient(ellipse at center, rgba(30,10,50,0.2) 0%, rgba(5,5,8,1) 70%)",
      surface: "rgba(15, 10, 25, 0.8)",
      surfaceBorder: "rgba(107, 33, 168, 0.2)",
      text: "#e0e0e0",
      textMuted: "rgba(200, 180, 220, 0.4)",
      ring: "#7c3aed",
      ringGlow: "rgba(124, 58, 237, 0.3)",
      tickMark: "rgba(139, 92, 246, 0.3)",
      clockHand: "#8b5cf6",
      centerDot: "#a855f7"
    }
  },
  {
    id: "light",
    name: "Awakened Dawn",
    description: "Clean and bright interface",
    icon: "☀️",
    colors: {
      primary: "#0284c7",
      primaryGlow: "rgba(2, 132, 199, 0.2)",
      secondary: "#0369a1",
      accent: "#06b6d4",
      background: "#f0f4f8",
      backgroundGradient: "radial-gradient(ellipse at center, rgba(200,230,255,0.5) 0%, rgba(240,244,248,1) 70%)",
      surface: "rgba(255, 255, 255, 0.9)",
      surfaceBorder: "rgba(2, 132, 199, 0.3)",
      text: "#1e293b",
      textMuted: "rgba(30, 41, 59, 0.6)",
      ring: "#0284c7",
      ringGlow: "rgba(2, 132, 199, 0.3)",
      tickMark: "rgba(2, 132, 199, 0.4)",
      clockHand: "#0369a1",
      centerDot: "#0284c7"
    }
  },
  {
    id: "colorful",
    name: "Rainbow Gate",
    description: "Vibrant multi-color experience",
    icon: "🌈",
    colors: {
      primary: "#f472b6",
      primaryGlow: "rgba(244, 114, 182, 0.3)",
      secondary: "#a78bfa",
      accent: "#34d399",
      background: "#0f0a1a",
      backgroundGradient: "radial-gradient(ellipse at top left, rgba(244,114,182,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(52,211,153,0.15) 0%, rgba(15,10,26,1) 70%)",
      surface: "rgba(30, 20, 50, 0.7)",
      surfaceBorder: "rgba(244, 114, 182, 0.3)",
      text: "#ffffff",
      textMuted: "rgba(255, 220, 240, 0.5)",
      ring: "#f472b6",
      ringGlow: "rgba(167, 139, 250, 0.4)",
      tickMark: "rgba(52, 211, 153, 0.5)",
      clockHand: "#a78bfa",
      centerDot: "#34d399"
    }
  },
  {
    id: "neon",
    name: "Neon City",
    description: "Bright glowing cyberpunk vibes",
    icon: "💜",
    colors: {
      primary: "#ff00ff",
      primaryGlow: "rgba(255, 0, 255, 0.5)",
      secondary: "#00ffff",
      accent: "#ffff00",
      background: "#0a0012",
      backgroundGradient: "radial-gradient(ellipse at center, rgba(50,0,80,0.3) 0%, rgba(10,0,18,1) 70%)",
      surface: "rgba(20, 0, 40, 0.8)",
      surfaceBorder: "rgba(255, 0, 255, 0.4)",
      text: "#ffffff",
      textMuted: "rgba(255, 200, 255, 0.6)",
      ring: "#ff00ff",
      ringGlow: "rgba(255, 0, 255, 0.6)",
      tickMark: "rgba(0, 255, 255, 0.6)",
      clockHand: "#00ffff",
      centerDot: "#ffff00"
    }
  },
  {
    id: "matrix",
    name: "Digital Rain",
    description: "Classic green terminal aesthetic",
    icon: "💚",
    colors: {
      primary: "#00ff41",
      primaryGlow: "rgba(0, 255, 65, 0.4)",
      secondary: "#008f11",
      accent: "#00ff41",
      background: "#000800",
      backgroundGradient: "radial-gradient(ellipse at center, rgba(0,30,10,0.4) 0%, rgba(0,8,0,1) 70%)",
      surface: "rgba(0, 20, 5, 0.8)",
      surfaceBorder: "rgba(0, 255, 65, 0.3)",
      text: "#00ff41",
      textMuted: "rgba(0, 255, 65, 0.5)",
      ring: "#00ff41",
      ringGlow: "rgba(0, 255, 65, 0.5)",
      tickMark: "rgba(0, 200, 50, 0.5)",
      clockHand: "#00ff41",
      centerDot: "#00ff41"
    }
  },
  {
    id: "gold",
    name: "S-TIER Elite",
    description: "Prestigious gold and black",
    icon: "👑",
    colors: {
      primary: "#ffd700",
      primaryGlow: "rgba(255, 215, 0, 0.4)",
      secondary: "#b8860b",
      accent: "#ff8c00",
      background: "#0a0806",
      backgroundGradient: "radial-gradient(ellipse at center, rgba(50,40,10,0.3) 0%, rgba(10,8,6,1) 70%)",
      surface: "rgba(30, 25, 15, 0.8)",
      surfaceBorder: "rgba(255, 215, 0, 0.3)",
      text: "#fff8dc",
      textMuted: "rgba(255, 248, 220, 0.5)",
      ring: "#ffd700",
      ringGlow: "rgba(255, 215, 0, 0.5)",
      tickMark: "rgba(255, 140, 0, 0.5)",
      clockHand: "#ffd700",
      centerDot: "#ff8c00"
    }
  }
];

export const getThemeById = (id: string): AppTheme => {
  return themes.find(t => t.id === id) || themes[0];
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenColor(hex: string, factor: number): string {
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export const createCustomTheme = (type: "clock" | "background", color: string): AppTheme => {
  const baseTheme = themes[0];
  
  if (type === "clock") {
    return {
      ...baseTheme,
      id: "custom-clock",
      name: "Custom Clock",
      icon: "🎨",
      colors: {
        ...baseTheme.colors,
        ring: color,
        ringGlow: hexToRgba(color, 0.4),
        tickMark: hexToRgba(color, 0.4),
        clockHand: color,
        centerDot: color
      }
    };
  } else {
    const darkBg = darkenColor(color, 0.1);
    return {
      ...baseTheme,
      id: "custom-background",
      name: "Custom Background",
      icon: "🎨",
      colors: {
        ...baseTheme.colors,
        primary: color,
        primaryGlow: hexToRgba(color, 0.3),
        background: darkBg,
        backgroundGradient: `radial-gradient(ellipse at center, ${hexToRgba(color, 0.15)} 0%, ${darkBg} 70%)`,
        surface: hexToRgba(color, 0.15),
        surfaceBorder: hexToRgba(color, 0.2)
      }
    };
  }
};

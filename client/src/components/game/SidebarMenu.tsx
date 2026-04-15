import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Menu,
  X,
  BarChart3,
  BookOpen,
  Trophy,
  Gamepad2,
  Clock,
  Lock,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useGame } from "@/context/GameContext";
import { isGameUnlocked, GAME_UNLOCK_EVENT } from "@/lib/progressionService";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  section?: string;
  unlockDay?: number;
  lockMessage?: string;
  isGame?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: BookOpen, label: "Library", path: "/library" },
  { icon: Trophy, label: "Achievements", path: "/inventory" },
  { icon: Clock, label: "Sectograph", path: "/sectograph", section: "system", unlockDay: 1, lockMessage: "Sectograph unlocks once your rhythm begins." },
  { icon: Gamepad2, label: "Future Game", path: "/game3d", section: "game", isGame: true },
];

export function SidebarMenu() {
  const [open, setOpen] = useState(false);
  const [lockToast, setLockToast] = useState<string | null>(null);
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { player } = useGame();
  const [, navigate] = useLocation();

  const [gameUnlocked, setGameUnlocked] = useState(() => isGameUnlocked());
  const [gameJustUnlocked, setGameJustUnlocked] = useState(false);

  useEffect(() => {
    const handler = () => {
      setGameUnlocked(true);
      setGameJustUnlocked(true);
      setTimeout(() => setGameJustUnlocked(false), 4000);
    };
    window.addEventListener(GAME_UNLOCK_EVENT, handler);
    return () => window.removeEventListener(GAME_UNLOCK_EVENT, handler);
  }, []);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener("ascend:tutorial-sidebar-open", openHandler);
    window.addEventListener("ascend:tutorial-sidebar-close", closeHandler);
    return () => {
      window.removeEventListener("ascend:tutorial-sidebar-open", openHandler);
      window.removeEventListener("ascend:tutorial-sidebar-close", closeHandler);
    };
  }, []);

  const { data: homeData } = useQuery<{ onboardingDay: number; isOnboardingComplete: boolean }>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      if (!player?.id) throw new Error("No player");
      const res = await fetch(`/api/player/${player.id}/home`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
  });

  const onboardingDay = homeData?.onboardingDay ?? 1;
  const isComplete = homeData?.isOnboardingComplete ?? false;

  const isLocked = (item: MenuItem) => {
    if (item.isGame) return false;
    if (!item.unlockDay) return false;
    if (isComplete) return false;
    return onboardingDay < item.unlockDay;
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (lockToast) {
      const timer = setTimeout(() => setLockToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [lockToast]);

  const regularItems = menuItems.filter(i => !i.section);
  const systemItems = menuItems.filter(i => i.section === "system");
  const gameItems = menuItems.filter(i => i.section === "game");

  const renderItem = (item: MenuItem) => {
    const locked = isLocked(item);
    const isNewlyUnlocked = item.isGame && gameJustUnlocked;

    if (locked) {
      return (
        <button
          key={item.path}
          data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => setLockToast(
            item.isGame
              ? "Complete the AI Coach tutorial to unlock the Game Section"
              : (item.lockMessage || "Locked")
          )}
          className="flex items-center gap-3 w-full px-5 py-3 text-left transition-colors duration-200"
          style={{ color: colors.textMuted, opacity: 0.4 }}
        >
          <item.icon size={18} style={{ color: colors.textMuted }} />
          <span className="text-sm font-medium tracking-wide flex-1">{item.label}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: colors.textMuted }}>
              Day 8
            </span>
            <Lock size={12} style={{ color: colors.textMuted }} />
          </div>
        </button>
      );
    }

    return (
      <button
        key={item.path}
        data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        onClick={() => { navigate(item.path); setOpen(false); }}
        className="flex items-center gap-3 w-full px-5 py-3 text-left transition-colors duration-200 hover:bg-white/5 relative"
        style={{ color: colors.text }}
      >
        {/* Glow on newly unlocked game item */}
        {isNewlyUnlocked && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.08), transparent)",
              animation: "gameUnlockGlow 2s ease-in-out infinite",
            }}
          />
        )}
        <item.icon
          size={18}
          style={{
            color: item.isGame ? "#22d3ee" : colors.primary,
            opacity: 0.9,
            filter: item.isGame && gameUnlocked ? "drop-shadow(0 0 4px rgba(34,211,238,0.6))" : undefined,
          }}
        />
        <span className="text-sm font-medium tracking-wide flex-1" style={{ color: item.isGame ? "#22d3ee" : colors.text }}>
          {item.label}
        </span>
        {item.isGame && gameUnlocked && (
          <>
            {isNewlyUnlocked ? (
              <div
                className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(34,211,238,0.15)",
                  color: "#22d3ee",
                  border: "1px solid rgba(34,211,238,0.4)",
                  animation: "gamePointerPulse 1.4s ease-in-out infinite",
                }}
              >
                ✦ NEW
              </div>
            ) : (
              <ChevronRight size={12} style={{ color: "#22d3ee", opacity: 0.6 }} />
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <>
      <button
        data-testid="button-sidebar-toggle"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 rounded-md backdrop-blur-md transition-all duration-200"
        style={{
          backgroundColor: `${colors.surface}cc`,
          border: `1px solid ${colors.surfaceBorder}`,
          color: colors.text,
        }}
        aria-label="Open menu"
      >
        <Menu size={22} />
        {/* Badge on toggle button if game just unlocked */}
        {gameJustUnlocked && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{
              backgroundColor: "#22d3ee",
              boxShadow: "0 0 6px rgba(34,211,238,0.8)",
              animation: "gamePointerPulse 1.2s ease-in-out infinite",
            }}
          />
        )}
      </button>

      {open && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        data-testid="sidebar-menu"
        className="fixed top-0 left-0 h-full z-[60] transition-transform duration-300 ease-in-out w-72"
        style={{
          transform: open ? "translateX(0)" : "translateX(-100%)",
          backgroundColor: colors.background,
          borderRight: `1px solid ${colors.surfaceBorder}`,
        }}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${colors.surfaceBorder}` }}>
          <span
            className="text-sm font-display font-bold tracking-[0.15em] uppercase"
            style={{ color: colors.primary }}
          >
            ASCEND OS
          </span>
          <button
            data-testid="button-sidebar-close"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: colors.textMuted }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col py-2">
          {regularItems.map(renderItem)}

          {systemItems.length > 0 && (
            <>
              <div className="px-5 pt-4 pb-1">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>
                  System Tools
                </span>
              </div>
              {systemItems.map(renderItem)}
            </>
          )}

          {/* Game section */}
          <div className="px-5 pt-4 pb-1 flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: "#22d3ee", opacity: 0.8 }}>
              Game
            </span>
          </div>
          {gameItems.map(renderItem)}
        </nav>

        <div
          className="absolute bottom-0 left-0 right-0 p-4 text-center"
          style={{ borderTop: `1px solid ${colors.surfaceBorder}` }}
        >
          <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: colors.textMuted }}>
            v1.0 — Ascend OS
          </span>
        </div>
      </div>

      {lockToast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg text-xs font-medium max-w-[260px] text-center"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.surfaceBorder}`,
            color: colors.textMuted,
            boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
            animation: "fadeInDown 0.3s ease-out",
          }}
          data-testid="sidebar-lock-toast"
        >
          {lockToast}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes gameUnlockGlow {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes gamePointerPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Menu,
  X,
  UserCircle,
  BarChart3,
  BookOpen,
  Trophy,
  Gamepad2,
  Clock,
  Lock,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useGame } from "@/context/GameContext";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  section?: string;
  unlockDay?: number;
  lockMessage?: string;
}

const menuItems: MenuItem[] = [
  { icon: UserCircle, label: "Profile", path: "/profile" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: BookOpen, label: "Library", path: "/library" },
  { icon: Trophy, label: "Achievements", path: "/inventory" },
  { icon: Clock, label: "Sectograph", path: "/sectograph", section: "system", unlockDay: 1, lockMessage: "Sectograph unlocks once your rhythm begins." },
  { icon: Gamepad2, label: "Future Game", path: "/game3d" },
];

export function SidebarMenu() {
  const [open, setOpen] = useState(false);
  const [lockToast, setLockToast] = useState<string | null>(null);
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const { player } = useGame();

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

  const renderItem = (item: MenuItem) => {
    const locked = isLocked(item);

    if (locked) {
      return (
        <button
          key={item.path}
          data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => setLockToast(item.lockMessage || "Locked")}
          className="flex items-center gap-3 w-full px-5 py-3 text-left transition-colors duration-200"
          style={{ color: colors.textMuted, opacity: 0.4 }}
        >
          <item.icon size={18} style={{ color: colors.textMuted }} />
          <span className="text-sm font-medium tracking-wide flex-1">{item.label}</span>
          <Lock size={12} style={{ color: colors.textMuted }} />
        </button>
      );
    }

    return (
      <Link key={item.path} href={item.path}>
        <button
          data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 w-full px-5 py-3 text-left transition-colors duration-200 hover:bg-white/5"
          style={{ color: colors.text }}
        >
          <item.icon size={18} style={{ color: colors.primary, opacity: 0.8 }} />
          <span className="text-sm font-medium tracking-wide">{item.label}</span>
        </button>
      </Link>
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
        className="fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out w-72"
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
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg text-xs font-medium"
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
      `}</style>
    </>
  );
}

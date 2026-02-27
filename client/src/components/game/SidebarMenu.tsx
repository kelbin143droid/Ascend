import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Menu,
  X,
  UserCircle,
  BarChart3,
  TrendingUp,
  Shield,
  BookOpen,
  Trophy,
  Settings,
  HelpCircle,
  Gamepad2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const menuItems = [
  { icon: UserCircle, label: "Profile", path: "/profile" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: TrendingUp, label: "Progress History", path: "/trials" },
  { icon: Shield, label: "Stability Details", path: "/survival" },
  { icon: BookOpen, label: "Library", path: "/library" },
  { icon: Trophy, label: "Achievements", path: "/inventory" },
  { icon: Settings, label: "Weekly Planning", path: "/weekly-planning" },
  { icon: HelpCircle, label: "Calendar", path: "/calendar" },
  { icon: Gamepad2, label: "Future Game", path: "/game3d" },
];

export function SidebarMenu() {
  const [open, setOpen] = useState(false);
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

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
          {menuItems.map((item) => (
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
          ))}
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
    </>
  );
}

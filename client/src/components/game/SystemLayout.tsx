import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, User, Target, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SidebarMenu } from "./SidebarMenu";
import { DevPanel } from "./DevPanel";
import bgImage from "@assets/generated_images/dark_cinematic_digital_void_background_with_blue_glowing_particles.png";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: "HOME", path: "/" },
  { icon: User, label: "PROFILE", path: "/profile" },
  { icon: Target, label: "HABITS", path: "/habits" },
  { icon: Brain, label: "COACH", path: "/coach" },
];

export function SystemLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { backgroundTheme } = useTheme();
  const { t } = useLanguage();
  const colors = backgroundTheme.colors;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden font-ui selection:bg-primary selection:text-background"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
      }}
    >
      <style>{`
        @keyframes tabUnlockGlow {
          0% { box-shadow: 0 0 0px transparent; }
          40% { box-shadow: 0 0 18px rgba(147,197,253,0.5); }
          100% { box-shadow: 0 0 0px transparent; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-0"
        style={{ background: colors.backgroundGradient }}
      />

      <div
        className="fixed inset-0 z-0 opacity-15 scale-110 blur-[2px]"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="fixed inset-0 z-10 pointer-events-none">
        <div
          className="absolute inset-2 rounded-lg"
          style={{ border: `2px solid ${colors.surfaceBorder}` }}
        />
        <div
          className="absolute top-2 left-2 w-8 h-8 rounded-tl-lg"
          style={{
            borderTop: `2px solid ${colors.primary}`,
            borderLeft: `2px solid ${colors.primary}`,
          }}
        />
        <div
          className="absolute top-2 right-2 w-8 h-8 rounded-tr-lg"
          style={{
            borderTop: `2px solid ${colors.primary}`,
            borderRight: `2px solid ${colors.primary}`,
          }}
        />
        <div
          className="absolute bottom-2 left-2 w-8 h-8 rounded-bl-lg"
          style={{
            borderBottom: `2px solid ${colors.primary}`,
            borderLeft: `2px solid ${colors.primary}`,
          }}
        />
        <div
          className="absolute bottom-2 right-2 w-8 h-8 rounded-br-lg"
          style={{
            borderBottom: `2px solid ${colors.primary}`,
            borderRight: `2px solid ${colors.primary}`,
          }}
        />
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 h-[2px] w-24"
          style={{
            background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
          }}
        />
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 h-[2px] w-24"
          style={{
            background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
          }}
        />
      </div>

      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${colors.primary}15 1px, transparent 1px), linear-gradient(90deg, ${colors.primary}15 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
          backgroundPosition: "center",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 90%)",
        }}
      />

      <SidebarMenu />

      <main className="relative z-20 container mx-auto px-4 py-6 pt-14 pb-24 max-w-md md:max-w-2xl min-h-screen flex flex-col">
        {children}
      </main>

      <DevPanel />

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl"
        style={{
          backgroundColor: `${colors.background}99`,
          borderTop: `1px solid ${colors.surfaceBorder}`,
        }}
        data-testid="bottom-nav"
      >
        <div className="flex justify-around items-end h-16 w-full mx-auto pb-2 max-w-md">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <div className="relative flex flex-col items-center">
                  <button
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={cn(
                      "flex flex-col items-center justify-center transition-all duration-300 group min-w-[60px]"
                    )}
                    style={{
                      color: isActive ? colors.primary : colors.textMuted,
                      transform: isActive ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    <div
                      className="relative p-1.5 rounded-sm transition-all duration-500"
                      style={
                        isActive
                          ? {
                              backgroundColor: `${colors.primary}33`,
                              boxShadow: `0 0 25px ${colors.primaryGlow}`,
                              border: `1px solid ${colors.surfaceBorder}`,
                            }
                          : {}
                      }
                    >
                      <item.icon
                        size={22}
                        className={cn("transition-transform", isActive && "animate-pulse")}
                      />
                    </div>
                    <span
                      className="text-[9px] tracking-[0.15em] mt-1.5 font-display font-bold uppercase transition-all"
                      style={{ opacity: isActive ? 1 : 0.6 }}
                    >
                      {t(item.label)}
                    </span>
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

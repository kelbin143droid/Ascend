import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Home, User, Target, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { useGame } from "@/context/GameContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { useQuery } from "@tanstack/react-query";
import { ThemeSelector } from "./ThemeSelector";
import { SidebarMenu } from "./SidebarMenu";
import { DevPanel } from "./DevPanel";
import { isSectographTutorialDone } from "@/lib/userState";
import bgImage from "@assets/generated_images/dark_cinematic_digital_void_background_with_blue_glowing_particles.png";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  unlockDay: number;
  lockMessage: string;
}

const TUTORIAL_LOCK_PATHS = new Set(["/profile", "/habits", "/coach"]);
const TUTORIAL_LOCK_MSG = "Map your timeline in the Sectograph first";

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: "HOME", path: "/", unlockDay: 1, lockMessage: "" },
  { icon: User, label: "PROFILE", path: "/profile", unlockDay: 1, lockMessage: TUTORIAL_LOCK_MSG },
  { icon: Target, label: "HABITS", path: "/habits", unlockDay: 3, lockMessage: "Habits unlock on Day 3" },
  { icon: Brain, label: "COACH", path: "/coach", unlockDay: 1, lockMessage: TUTORIAL_LOCK_MSG },
];

function LockedToast({ message, visible, onFade }: { message: string; visible: boolean; onFade: () => void }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onFade, 2800);
      return () => clearTimeout(t);
    }
  }, [visible, onFade]);

  if (!visible) return null;

  return (
    <div
      data-testid="locked-tab-toast"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-center max-w-[280px]"
      style={{
        backgroundColor: "rgba(15,23,42,0.92)",
        border: "1px solid rgba(147,197,253,0.15)",
        backdropFilter: "blur(12px)",
        animation: "lockedToastIn 0.35s ease-out",
      }}
    >
      <p className="text-xs leading-relaxed" style={{ color: "rgba(147,197,253,0.85)" }}>
        {message}
      </p>
    </div>
  );
}

export function SystemLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { backgroundTheme } = useTheme();
  const { player } = useGame();
  const { t } = useLanguage();
  const colors = backgroundTheme.colors;

  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<Set<string>>(new Set());
  const [tutorialDone, setTutorialDone] = useState(() => isSectographTutorialDone());

  useEffect(() => {
    const handler = () => setTutorialDone(true);
    window.addEventListener("ascend:sectograph-tutorial-done", handler);
    return () => window.removeEventListener("ascend:sectograph-tutorial-done", handler);
  }, []);

  const { data: homeData } = useQuery<{ onboardingDay: number; isOnboardingComplete: boolean }>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      const res = await fetch(`/api/player/${player!.id}/home`);
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
  });

  const onboardingDay = homeData?.onboardingDay ?? 1;
  const isComplete = homeData?.isOnboardingComplete ?? false;

  useEffect(() => {
    const prevDay = parseInt(localStorage.getItem("ascend_nav_last_day") || "0", 10);
    if (onboardingDay > prevDay && prevDay > 0) {
      const newlyUnlocked = new Set<string>();
      NAV_ITEMS.forEach(item => {
        if (item.unlockDay > prevDay && item.unlockDay <= onboardingDay) {
          newlyUnlocked.add(item.path);
        }
      });
      if (newlyUnlocked.size > 0) {
        setJustUnlocked(newlyUnlocked);
        setTimeout(() => setJustUnlocked(new Set()), 3000);
      }
    }
    localStorage.setItem("ascend_nav_last_day", String(onboardingDay));
  }, [onboardingDay]);

  const isTabLocked = useCallback((item: NavItem) => {
    if (!isComplete) {
      return onboardingDay < item.unlockDay;
    }
    if (!tutorialDone && TUTORIAL_LOCK_PATHS.has(item.path)) {
      return true;
    }
    return false;
  }, [onboardingDay, isComplete, tutorialDone]);

  const handleLockedTap = useCallback((item: NavItem) => {
    setToastMessage(t(item.lockMessage));
    setToastVisible(true);
  }, [t]);

  const handleToastFade = useCallback(() => {
    setToastVisible(false);
  }, []);

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden font-ui selection:bg-primary selection:text-background"
      style={{ 
        backgroundColor: colors.background,
        color: colors.text
      }}
    >
      <style>{`
        @keyframes lockedGlowPulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.45; }
        }
        @keyframes lockedShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes lockedToastIn {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes tabUnlockGlow {
          0% { box-shadow: 0 0 0px transparent; }
          40% { box-shadow: 0 0 18px rgba(147,197,253,0.5); }
          100% { box-shadow: 0 0 0px transparent; }
        }
      `}</style>

      <div 
        className="fixed inset-0 z-0"
        style={{
          background: colors.backgroundGradient
        }}
      />
      
      <div 
        className="fixed inset-0 z-0 opacity-15 scale-110 blur-[2px]"
        style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      />
      
      <div className="fixed inset-0 z-10 pointer-events-none">
        <div 
          className="absolute inset-2 rounded-lg"
          style={{ border: `2px solid ${colors.surfaceBorder}` }}
        />
        <div 
          className="absolute top-2 left-2 w-8 h-8 rounded-tl-lg"
          style={{ borderTop: `2px solid ${colors.primary}`, borderLeft: `2px solid ${colors.primary}` }}
        />
        <div 
          className="absolute top-2 right-2 w-8 h-8 rounded-tr-lg"
          style={{ borderTop: `2px solid ${colors.primary}`, borderRight: `2px solid ${colors.primary}` }}
        />
        <div 
          className="absolute bottom-2 left-2 w-8 h-8 rounded-bl-lg"
          style={{ borderBottom: `2px solid ${colors.primary}`, borderLeft: `2px solid ${colors.primary}` }}
        />
        <div 
          className="absolute bottom-2 right-2 w-8 h-8 rounded-br-lg"
          style={{ borderBottom: `2px solid ${colors.primary}`, borderRight: `2px solid ${colors.primary}` }}
        />
        <div 
          className="absolute top-2 left-1/2 -translate-x-1/2 h-[2px] w-24"
          style={{ background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)` }}
        />
        <div 
          className="absolute bottom-2 left-1/2 -translate-x-1/2 h-[2px] w-24"
          style={{ background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)` }}
        />
      </div>

      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${colors.primary}15 1px, transparent 1px), linear-gradient(90deg, ${colors.primary}15 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)'
        }}
      />

      {location === "/" && <ThemeSelector />}

      <SidebarMenu />

      <main className="relative z-20 container mx-auto px-4 py-6 pt-14 pb-24 max-w-md md:max-w-2xl min-h-screen flex flex-col">
        {children}
      </main>

      <LockedToast message={toastMessage} visible={toastVisible} onFade={handleToastFade} />
      <DevPanel />

      <nav 
        className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl"
        style={{
          backgroundColor: `${colors.background}99`,
          borderTop: `1px solid ${colors.surfaceBorder}`
        }}
        data-testid="bottom-nav"
      >
        <div className="flex justify-around items-end h-16 w-full mx-auto pb-2 max-w-md">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const locked = isTabLocked(item);
            const wasJustUnlocked = justUnlocked.has(item.path);

            if (locked) {
              return (
                <button
                  key={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  onClick={() => handleLockedTap(item)}
                  className="flex flex-col items-center justify-center min-w-[60px] relative"
                  style={{ color: colors.textMuted }}
                >
                  <div
                    className="relative p-1.5 rounded-sm"
                    style={{
                      animation: "lockedGlowPulse 3s ease-in-out infinite",
                    }}
                  >
                    <item.icon
                      size={22}
                      style={{ opacity: 0.3 }}
                    />
                    <div
                      className="absolute inset-0 rounded-sm pointer-events-none"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${colors.primary}15, transparent)`,
                        backgroundSize: "200% 100%",
                        animation: "lockedShimmer 4s ease-in-out infinite",
                      }}
                    />
                  </div>
                  <span
                    className="text-[9px] tracking-[0.15em] mt-1.5 font-display font-bold uppercase"
                    style={{ opacity: 0.25 }}
                  >
                    {t(item.label)}
                  </span>
                </button>
              );
            }

            return (
              <Link key={item.path} href={item.path}>
                <button
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={cn(
                    "flex flex-col items-center justify-center transition-all duration-300 group min-w-[60px]"
                  )}
                  style={{
                    color: isActive ? colors.primary : colors.textMuted,
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    ...(wasJustUnlocked ? { animation: "tabUnlockGlow 1.5s ease-out" } : {}),
                  }}
                >
                  <div 
                    className="relative p-1.5 rounded-sm transition-all duration-500"
                    style={isActive ? {
                      backgroundColor: `${colors.primary}33`,
                      boxShadow: `0 0 25px ${colors.primaryGlow}`,
                      border: `1px solid ${colors.surfaceBorder}`
                    } : {}}
                  >
                    <item.icon size={22} className={cn("transition-transform", isActive && "animate-pulse")} />
                  </div>
                  <span 
                    className="text-[9px] tracking-[0.15em] mt-1.5 font-display font-bold uppercase transition-all"
                    style={{ opacity: isActive ? 1 : 0.6 }}
                  >
                    {t(item.label)}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, User, Target, Brain, Film, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageStageContext";
import { SidebarMenu } from "./SidebarMenu";
import { DevPanel } from "./DevPanel";
import { AppTutorialOverlay } from "./AppTutorialOverlay";
import ironSovereignBg from "@/assets/themes/iron_sovereign_starfield.png";
import neonEmpressBg from "@/assets/themes/neon_empress_pastel.png";

const ANIMATED_BG_KEY = "ascend_bg_animated";
const safeGetBool = (key: string) => {
  try { return localStorage.getItem(key) === "1"; } catch { return false; }
};
const safeSetBool = (key: string, val: boolean) => {
  try { localStorage.setItem(key, val ? "1" : "0"); } catch { /* noop */ }
};

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
  const { backgroundTheme, customBackgroundImage } = useTheme();
  const { t } = useLanguage();
  const colors = backgroundTheme.colors;
  const hasCustomBg = !!customBackgroundImage;
  const isIronSovereign = backgroundTheme.id === "male" && !hasCustomBg;
  const isNeonEmpress = backgroundTheme.id === "female" && !hasCustomBg;
  const usingThemeImage = isIronSovereign || isNeonEmpress;

  const [animatedBg, setAnimatedBg] = useState<boolean>(() => safeGetBool(ANIMATED_BG_KEY));

  function toggleAnimatedBg() {
    setAnimatedBg((prev) => {
      const next = !prev;
      safeSetBool(ANIMATED_BG_KEY, next);
      return next;
    });
  }
  // When the user uploaded a background OR a baked-in theme image is active,
  // dial down the layout's own overlays so the underlying image stays visible
  // instead of being painted over.
  const darkOverlayOpacity =
    hasCustomBg || usingThemeImage ? 0 : (backgroundTheme.darkOverlayOpacity ?? 0.15);
  const gridOpacity =
    hasCustomBg || usingThemeImage ? 0 : (backgroundTheme.gridOpacity ?? 0.20);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden font-ui selection:bg-primary selection:text-background"
      style={{
        backgroundColor: hasCustomBg ? "transparent" : colors.background,
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

      {/* Background layer — static image / animated video / gradient */}
      {(isIronSovereign || isNeonEmpress) && animatedBg ? (
        <video
          key="animated-bg"
          className="fixed z-0 object-cover"
          src={isIronSovereign ? "/videos/male_bg_animated.mp4" : "/videos/female_bg_animated.mp4"}
          autoPlay
          loop
          muted
          playsInline
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            minWidth: "100vw",
            minHeight: "100vh",
            width: "auto",
            height: "auto",
            backgroundColor: "#000000",
          }}
        />
      ) : (
        <div
          className="fixed inset-0 z-0"
          style={
            hasCustomBg
              ? {
                  backgroundImage: `url("${customBackgroundImage}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }
              : isIronSovereign
              ? {
                  backgroundImage: `url(${ironSovereignBg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center bottom",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "#000000",
                }
              : isNeonEmpress
              ? {
                  backgroundImage: `url(${neonEmpressBg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "#dde8f5",
                }
              : { background: colors.backgroundGradient }
          }
        />
      )}

      {/* Female theme — soft dreamy blobs (skipped when the pastel image
          background is active so the baked-in flowers/sparkles read clean). */}
      {backgroundTheme.id === "female" && !isNeonEmpress && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {[
            { w: 220, h: 180, top: "5%",  left: "5%",  color: "rgba(255,210,230,0.55)" },
            { w: 160, h: 140, top: "12%", left: "72%", color: "rgba(200,240,255,0.50)" },
            { w: 130, h: 110, top: "35%", left: "-4%", color: "rgba(210,255,220,0.45)" },
            { w: 180, h: 150, top: "55%", left: "68%", color: "rgba(255,220,245,0.50)" },
            { w: 140, h: 120, top: "72%", left: "20%", color: "rgba(220,210,255,0.45)" },
            { w: 100, h:  90, top: "20%", left: "40%", color: "rgba(255,240,200,0.40)" },
          ].map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: b.w,
                height: b.h,
                top: b.top,
                left: b.left,
                borderRadius: "50%",
                background: b.color,
                filter: "blur(40px)",
              }}
            />
          ))}
        </div>
      )}

      <div
        className="fixed inset-0 z-0 scale-110 blur-[2px]"
        style={{
          background: "radial-gradient(ellipse at 20% 40%, rgba(14,30,80,0.9) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(6,20,60,0.8) 0%, transparent 55%), radial-gradient(ellipse at 50% 10%, rgba(20,10,50,0.7) 0%, transparent 50%), #020510",
          opacity: darkOverlayOpacity,
          transition: "opacity 0.6s ease",
        }}
      />

      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{ display: (isIronSovereign || (isNeonEmpress && animatedBg)) ? "none" : undefined }}
      >
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
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${colors.primary}15 1px, transparent 1px), linear-gradient(90deg, ${colors.primary}15 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
          backgroundPosition: "center",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 90%)",
          opacity: gridOpacity,
          transition: "opacity 0.6s ease",
        }}
      />

      {/* Animated background toggle — shown for Iron Sovereign (male) and Neon Empress (female) themes */}
      {(isIronSovereign || isNeonEmpress) && (
        <button
          data-testid="button-toggle-animated-bg"
          onClick={toggleAnimatedBg}
          title={animatedBg ? "Switch to static background" : "Switch to animated background"}
          className="fixed top-3.5 right-4 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
          style={{
            backgroundColor: animatedBg ? `${colors.primary}25` : `${colors.primary}10`,
            border: `1px solid ${animatedBg ? colors.primary : `${colors.primary}40`}`,
            color: animatedBg ? colors.primary : `${colors.primary}90`,
            backdropFilter: "blur(8px)",
          }}
        >
          {animatedBg ? <Film size={11} /> : <ImageIcon size={11} />}
          {animatedBg ? "Live" : "Static"}
        </button>
      )}

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
                      color: isActive ? colors.primary : colors.text,
                      opacity: isActive ? 1 : 0.75,
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

      <AppTutorialOverlay />
    </div>
  );
}

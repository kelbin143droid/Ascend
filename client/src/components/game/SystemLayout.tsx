import React from "react";
import { Link, useLocation } from "wouter";
import { User, Sword, Backpack, Zap, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { ThemeSelector } from "./ThemeSelector";
import bgImage from "@assets/generated_images/dark_cinematic_digital_void_background_with_blue_glowing_particles.png";

export function SystemLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme } = useTheme();

  const navItems = [
    { icon: User, label: "STATUS", path: "/" },
    { icon: Sword, label: "DUNGEON", path: "/dungeon" },
    { icon: Backpack, label: "ITEMS", path: "/inventory" },
    { icon: Home, label: "HOUSING", path: "/housing" },
    { icon: Zap, label: "SKILLS", path: "/skills" },
  ];

  const colors = theme.colors;

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden font-ui selection:bg-primary selection:text-background"
      style={{ 
        backgroundColor: colors.background,
        color: colors.text
      }}
    >
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

      <ThemeSelector />

      <main className="relative z-20 container mx-auto px-4 py-6 pb-24 max-w-md md:max-w-2xl min-h-screen flex flex-col">
        {children}
      </main>

      <nav 
        className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl"
        style={{
          backgroundColor: `${colors.background}99`,
          borderTop: `1px solid ${colors.surfaceBorder}`
        }}
      >
        <div className="flex justify-around items-center h-16 max-w-md md:max-w-2xl mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full transition-all duration-300 group"
                  )}
                  style={{
                    color: isActive ? colors.primary : colors.textMuted,
                    transform: isActive ? 'scale(1.1)' : 'scale(1)'
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
                    className="text-[10px] tracking-[0.2em] mt-1.5 font-display font-bold uppercase transition-all"
                    style={{ opacity: isActive ? 1 : 0.6 }}
                  >
                    {item.label}
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

import React from "react";
import { Link, useLocation } from "wouter";
import { User, Sword, Backpack, Zap, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import bgImage from "@assets/generated_images/dark_cinematic_digital_void_background_with_blue_glowing_particles.png";

export function SystemLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: User, label: "STATUS", path: "/" },
    { icon: Sword, label: "DUNGEON", path: "/dungeon" },
    { icon: Backpack, label: "INVENTORY", path: "/inventory" },
    { icon: Zap, label: "SKILLS", path: "/skills" },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground font-ui selection:bg-primary selection:text-background">
      {/* Background Layer */}
      <div 
        className="fixed inset-0 z-0 opacity-20 scale-110 blur-[2px]"
        style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      />
      
      {/* Lightning Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[1px] h-[120%] bg-primary opacity-0 animate-lightning rotate-[15deg] blur-[2px]" />
        <div className="absolute top-[-20%] right-[30%] w-[1px] h-[140%] bg-accent opacity-0 animate-lightning [animation-delay:1.5s] rotate-[-10deg] blur-[2px]" />
        <div className="absolute top-[30%] left-[-10%] w-[120%] h-[1px] bg-primary opacity-0 animate-lightning [animation-delay:3s] blur-[2px]" />
      </div>

      {/* Grid Overlay */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] [background-position:center] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)] opacity-30 pointer-events-none" />

      {/* Main Content Area */}
      <main className="relative z-20 container mx-auto px-4 py-6 pb-24 max-w-md md:max-w-2xl min-h-screen flex flex-col">
        {children}
      </main>

      {/* Bottom Navigation HUD */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/60 backdrop-blur-xl border-t border-primary/30">
        <div className="flex justify-around items-center h-16 max-w-md md:max-w-2xl mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full transition-all duration-300 group",
                    isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "relative p-1.5 rounded-sm transition-all duration-500",
                    isActive && "bg-primary/20 shadow-[0_0_25px_rgba(0,240,255,0.5)] border border-primary/40"
                  )}>
                    <item.icon size={22} className={cn("transition-transform", isActive && "animate-pulse")} />
                  </div>
                  <span className={cn(
                    "text-[10px] tracking-[0.2em] mt-1.5 font-display font-bold uppercase transition-all",
                    isActive ? "opacity-100 text-glow" : "opacity-60"
                  )}>
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

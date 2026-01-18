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
        className="fixed inset-0 z-0 opacity-40"
        style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      />
      
      {/* Grid Overlay */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] [background-position:center] [mask-image:linear-gradient(black,transparent_80%)] opacity-20 pointer-events-none" />

      {/* Scanline Effect */}
      <div className="fixed inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(0,255,255,0.03)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px]" />

      {/* Main Content Area */}
      <main className="relative z-20 container mx-auto px-4 py-6 pb-24 max-w-md md:max-w-2xl min-h-screen flex flex-col">
        {children}
      </main>

      {/* Bottom Navigation HUD */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-md border-t border-primary/20">
        <div className="flex justify-around items-center h-16 max-w-md md:max-w-2xl mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full transition-all duration-200 group",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "relative p-1 rounded-sm transition-all duration-300",
                    isActive && "bg-primary/10 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                  )}>
                    <item.icon size={20} className={cn("transition-transform", isActive && "scale-110")} />
                  </div>
                  <span className="text-[10px] tracking-widest mt-1 font-display opacity-80 group-hover:opacity-100">
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

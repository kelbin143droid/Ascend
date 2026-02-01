import React from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { useTheme } from "@/context/ThemeContext";
import { BookOpen, Scroll, Trophy, Star, Lock } from "lucide-react";

export default function LibraryPage() {
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;

  const libraryItems = [
    { id: 1, title: "Ascendant's Guide", type: "Tutorial", icon: BookOpen, unlocked: true },
    { id: 2, title: "Combat Manual", type: "Skills", icon: Scroll, unlocked: true },
    { id: 3, title: "Tier Codex", type: "Progression", icon: Trophy, unlocked: true },
    { id: 4, title: "Secret Techniques", type: "Advanced", icon: Star, unlocked: false },
  ];

  return (
    <SystemLayout>
      <div className="flex flex-col gap-6 pt-4">
        <div className="text-center">
          <h1 
            className="text-2xl font-display font-black tracking-wider"
            style={{ color: colors.text }}
          >
            LIBRARY
          </h1>
          <p 
            className="text-sm mt-1"
            style={{ color: colors.textMuted }}
          >
            Knowledge Archive
          </p>
        </div>

        <div className="grid gap-4">
          {libraryItems.map((item) => (
            <div
              key={item.id}
              data-testid={`library-item-${item.id}`}
              className="relative p-4 rounded-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.surfaceBorder}`,
                opacity: item.unlocked ? 1 : 0.5
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${colors.primary}20`,
                    border: `1px solid ${colors.primary}40`
                  }}
                >
                  {item.unlocked ? (
                    <item.icon size={24} style={{ color: colors.primary }} />
                  ) : (
                    <Lock size={24} style={{ color: colors.textMuted }} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 
                    className="font-display font-bold text-lg"
                    style={{ color: colors.text }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="text-xs tracking-wider uppercase"
                    style={{ color: colors.textMuted }}
                  >
                    {item.type}
                  </p>
                </div>
                {!item.unlocked && (
                  <div 
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      color: "#ef4444"
                    }}
                  >
                    LOCKED
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div 
          className="text-center p-4 rounded-lg mt-4"
          style={{
            backgroundColor: `${colors.primary}10`,
            border: `1px solid ${colors.surfaceBorder}`
          }}
        >
          <p 
            className="text-sm"
            style={{ color: colors.textMuted }}
          >
            More content coming soon...
          </p>
        </div>
      </div>
    </SystemLayout>
  );
}

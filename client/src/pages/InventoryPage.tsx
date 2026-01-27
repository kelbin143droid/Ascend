import React from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion } from "framer-motion";
import { Sword, Shield, FlaskConical, Scroll, Package } from "lucide-react";
import { useGame } from "@/context/GameContext";

const getIconForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'weapon': return Sword;
    case 'armor': return Shield;
    case 'consumable': return FlaskConical;
    default: return Scroll;
  }
};

const getColorForRarity = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case 'S': return 'text-yellow-400';
    case 'A': return 'text-red-400';
    case 'B': return 'text-purple-400';
    case 'C': return 'text-blue-400';
    case 'D': return 'text-green-400';
    default: return 'text-gray-400';
  }
};

export default function InventoryPage() {
  const { player, isLoading } = useGame();
  
  const totalSlots = 25;
  const items = player?.inventory || [];
  const emptySlots = Array.from({ length: totalSlots - items.length });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 }
  };

  if (isLoading || !player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary animate-pulse font-display text-xl tracking-widest">LOADING SYSTEM...</div>
        </div>
      </SystemLayout>
    );
  }

  return (
    <SystemLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b-2 border-primary pb-2">
            <div>
                <h1 className="text-3xl font-display font-bold text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">INVENTORY</h1>
                <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Storage</p>
            </div>
             <div className="text-right">
                 <span className="text-xs text-muted-foreground block">GOLD</span>
                 <span className="text-xl font-mono font-bold text-yellow-500 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">{player.gold.toLocaleString()}</span>
            </div>
        </div>

        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-5 gap-2"
        >
            {items.length === 0 ? (
              <div className="col-span-5 text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Your inventory is empty</p>
                <p className="text-xs opacity-60">Defeat enemies in dungeons to collect items</p>
              </div>
            ) : (
              items.map((item) => {
                const Icon = getIconForType(item.type);
                const color = getColorForRarity(item.rarity);
                return (
                  <motion.div
                      key={item.id}
                      variants={itemAnim}
                      className="aspect-square system-panel rounded-sm flex flex-col items-center justify-center relative group cursor-pointer hover:bg-primary/10 transition-colors border-primary/30 hover:border-primary"
                  >
                      <Icon className={`w-6 h-6 ${color} drop-shadow-md`} />
                      {item.equipped && (
                          <span className="absolute top-1 right-1 text-[8px] font-mono text-primary">E</span>
                      )}
                      
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center p-1 z-10 pointer-events-none">
                          <span className="text-[10px] text-white font-bold">{item.name}</span>
                      </div>
                  </motion.div>
                );
              })
            )}
            
            {emptySlots.map((_, i) => (
                <motion.div
                    key={`empty-${i}`}
                    variants={itemAnim}
                    className="aspect-square bg-black/20 border border-white/5 rounded-sm"
                />
            ))}
        </motion.div>
      </div>
    </SystemLayout>
  );
}

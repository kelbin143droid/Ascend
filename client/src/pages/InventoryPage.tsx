import React from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion } from "framer-motion";
import { Sword, Shield, FlaskConical, Scroll } from "lucide-react";

const items = [
    { id: 1, name: "Kasaka's Fang", type: "Weapon", rank: "C", icon: Sword, color: "text-blue-400" },
    { id: 2, name: "Knight Killer", type: "Weapon", rank: "B", icon: Sword, color: "text-purple-400" },
    { id: 3, name: "High Orc Shield", type: "Armor", rank: "B", icon: Shield, color: "text-purple-400" },
    { id: 4, name: "Healing Potion", type: "Consumable", rank: "E", icon: FlaskConical, color: "text-red-400", count: 5 },
    { id: 5, name: "Return Stone", type: "Item", rank: "E", icon: Scroll, color: "text-gray-400", count: 1 },
];

export default function InventoryPage() {
  // Generate empty slots to fill a 5x5 grid (25 slots total)
  const totalSlots = 25;
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
                 <span className="text-xl font-mono font-bold text-yellow-500 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">1,500,000</span>
            </div>
        </div>

        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-5 gap-2"
        >
            {items.map((item) => (
                <motion.div
                    key={item.id}
                    variants={itemAnim}
                    className="aspect-square system-panel rounded-sm flex flex-col items-center justify-center relative group cursor-pointer hover:bg-primary/10 transition-colors border-primary/30 hover:border-primary"
                >
                    <item.icon className={`w-6 h-6 ${item.color} drop-shadow-md`} />
                    {item.count && (
                        <span className="absolute bottom-1 right-1 text-[10px] font-mono text-muted-foreground">x{item.count}</span>
                    )}
                    
                    {/* Tooltip on hover (simplified) */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center p-1 z-10 pointer-events-none">
                        <span className="text-[10px] text-white font-bold">{item.name}</span>
                    </div>
                </motion.div>
            ))}
            
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

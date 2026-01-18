import React from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion } from "framer-motion";
import { AlertTriangle, Lock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/context/GameContext";
import { useToast } from "@/hooks/use-toast";

const dungeons = [
    { id: 1, name: "Subway Station Entrance", rank: "E", type: "Instance", status: "CLEARED" },
    { id: 2, name: "Gate of the Double Dungeon", rank: "D", type: "Hidden", status: "LOCKED" },
    { id: 3, name: "Goblin Forest", rank: "E", type: "Field", status: "AVAILABLE" },
    { id: 4, name: "Demon Castle", rank: "S", type: "Tower", status: "LOCKED" },
];

export default function DungeonPage() {
  const { gainExp } = useGame();
  const { toast } = useToast();

  const handleEnterDungeon = (dungeon: any) => {
    if (dungeon.status === 'LOCKED') return;
    
    // Simulate dungeon clear
    toast({
        title: "DUNGEON ENTERED",
        description: `Entering ${dungeon.name}...`,
        className: "bg-background border-primary text-primary font-display"
    });

    setTimeout(() => {
        gainExp(100);
        toast({
            title: "DUNGEON CLEARED",
            description: "You have gained experience.",
            className: "bg-background border-primary text-primary font-display"
        });
    }, 1500);
  };

  return (
    <SystemLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b-2 border-primary pb-2">
            <div>
                <h1 className="text-3xl font-display font-bold text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">GATES</h1>
                <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Select Location</p>
            </div>
        </div>

        <div className="grid gap-4">
            {dungeons.map((dungeon, index) => (
                <motion.div
                    key={dungeon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`system-panel p-4 rounded-sm border-l-4 group relative overflow-hidden transition-all duration-300 hover:translate-x-1 ${
                        dungeon.status === 'LOCKED' ? 'border-l-muted opacity-50' : 
                        dungeon.rank === 'S' ? 'border-l-destructive' : 'border-l-primary'
                    }`}
                >
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex gap-4">
                            <div className={`
                                w-12 h-12 flex items-center justify-center font-display text-xl font-bold rounded bg-background/50 border
                                ${dungeon.rank === 'S' ? 'text-destructive border-destructive' : 'text-primary border-primary'}
                            `}>
                                {dungeon.rank}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {dungeon.name}
                                    {dungeon.status === 'LOCKED' && <Lock size={14} className="text-muted-foreground" />}
                                </h3>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2 mt-1">
                                    <MapPin size={12} />
                                    {dungeon.type} • {dungeon.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button 
                            variant="outline" 
                            className={`
                                font-display tracking-widest border-opacity-50 hover:bg-primary/20
                                ${dungeon.status === 'LOCKED' ? 'cursor-not-allowed' : 'border-primary text-primary hover:text-primary'}
                            `}
                            onClick={() => handleEnterDungeon(dungeon)}
                            disabled={dungeon.status === 'LOCKED'}
                        >
                            {dungeon.status === 'LOCKED' ? 'RESTRICTED' : 'ENTER GATE'}
                        </Button>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <AlertTriangle size={100} />
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </SystemLayout>
  );
}

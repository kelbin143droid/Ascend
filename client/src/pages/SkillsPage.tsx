import React from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion } from "framer-motion";
import { Zap, Wind, Eye, Skull } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const activeSkills = [
    { id: 1, name: "Sprint", level: 2, cost: "1 MP / min", desc: "Movement speed increases by 30%.", icon: Wind },
    { id: 2, name: "Vital Strike", level: 1, cost: "70 MP", desc: "Deals critical damage to vital points.", icon: Zap },
    { id: 3, name: "Stealth", level: 1, cost: "200 MP", desc: "Hides your presence completely.", icon: Eye },
    { id: 4, name: "Shadow Extraction", level: 1, cost: "Varies", desc: "Extract mana from a corpse to create a shadow soldier.", icon: Skull, isUlt: true },
];

const passiveSkills = [
    { id: 5, name: "Perseverance", level: 1, desc: "When HP is below 30%, damage taken is reduced by 50%." },
    { id: 6, name: "Advanced Dagger Arts", level: 2, desc: "Damage with daggers increased by 33%." },
];

export default function SkillsPage() {
  return (
    <SystemLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b-2 border-primary pb-2">
            <div>
                <h1 className="text-3xl font-display font-bold text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">SKILLS</h1>
                <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Abilities</p>
            </div>
        </div>

        <div className="space-y-6">
            <div>
                <h3 className="font-display text-lg tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary inline-block"/> ACTIVE
                </h3>
                <div className="space-y-3">
                    {activeSkills.map((skill) => (
                        <motion.div 
                            key={skill.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`system-panel p-3 rounded-sm flex gap-3 ${skill.isUlt ? 'border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : ''}`}
                        >
                            <div className={`w-12 h-12 flex items-center justify-center rounded bg-background/50 border ${skill.isUlt ? 'border-purple-500 text-purple-400' : 'border-primary/30 text-primary'}`}>
                                <skill.icon size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold text-sm ${skill.isUlt ? 'text-purple-400' : ''}`}>{skill.name}</h4>
                                    <Badge variant="outline" className="text-[10px] h-5 border-primary/20 bg-primary/5">Lv. {skill.level}</Badge>
                                </div>
                                <div className="text-[10px] font-mono text-primary mt-0.5">{skill.cost}</div>
                                <p className="text-xs text-muted-foreground mt-1 leading-tight">{skill.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-display text-lg tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-secondary inline-block"/> PASSIVE
                </h3>
                <div className="space-y-3">
                    {passiveSkills.map((skill) => (
                        <motion.div 
                            key={skill.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="system-panel p-3 rounded-sm flex gap-3 opacity-80"
                        >
                            <div className="w-12 h-12 flex items-center justify-center rounded bg-secondary/20 border border-secondary/30 text-muted-foreground">
                                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-muted-foreground">{skill.name}</h4>
                                    <Badge variant="outline" className="text-[10px] h-5 border-white/10 bg-white/5 text-muted-foreground">Lv. {skill.level}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-tight">{skill.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </SystemLayout>
  );
}

import React from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion } from "framer-motion";
import { Zap, Wind, Eye, Skull, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/context/GameContext";
import type { Skill } from "@shared/schema";

const getIconForSkill = (skillId: string) => {
  switch (skillId) {
    case 'shadow_extraction': return Skull;
    case 'rulers_authority': return Zap;
    case 'shadow_exchange': return Wind;
    case 'monarch_domain': return Eye;
    default: return Zap;
  }
};

const isUltimateSkill = (skillId: string) => {
  return ['shadow_extraction', 'monarch_domain'].includes(skillId);
};

export default function SkillsPage() {
  const { player, isLoading } = useGame();

  if (isLoading || !player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary animate-pulse font-display text-xl tracking-widest">LOADING SYSTEM...</div>
        </div>
      </SystemLayout>
    );
  }

  const skills = player.skills || [];
  const unlockedSkills = skills.filter((s: Skill) => s.unlocked);
  const lockedSkills = skills.filter((s: Skill) => !s.unlocked);

  return (
    <SystemLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b-2 border-primary pb-2">
            <div>
                <h1 className="text-3xl font-display font-bold text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">SKILLS</h1>
                <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Abilities</p>
            </div>
            <div className="text-right">
                <span className="text-xs text-muted-foreground block">UNLOCKED</span>
                <span className="text-xl font-mono font-bold text-primary">{unlockedSkills.length}/{skills.length}</span>
            </div>
        </div>

        <div className="space-y-6">
            <div>
                <h3 className="font-display text-lg tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary inline-block"/> ACTIVE
                </h3>
                <div className="space-y-3">
                    {unlockedSkills.map((skill: Skill) => {
                        const Icon = getIconForSkill(skill.id);
                        const isUlt = isUltimateSkill(skill.id);
                        return (
                            <motion.div 
                                key={skill.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`system-panel p-3 rounded-sm flex gap-3 ${isUlt ? 'border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : ''}`}
                            >
                                <div className={`w-12 h-12 flex items-center justify-center rounded bg-background/50 border ${isUlt ? 'border-purple-500 text-purple-400' : 'border-primary/30 text-primary'}`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold text-sm ${isUlt ? 'text-purple-400' : ''}`}>{skill.name}</h4>
                                        <Badge variant="outline" className="text-[10px] h-5 border-primary/20 bg-primary/5">Lv. {skill.level}</Badge>
                                    </div>
                                    <div className="text-[10px] font-mono text-primary mt-0.5">{skill.mpCost} MP • {skill.cooldown}s CD</div>
                                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{skill.description}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {lockedSkills.length > 0 && (
              <div>
                  <h3 className="font-display text-lg tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-secondary inline-block"/> LOCKED
                  </h3>
                  <div className="space-y-3">
                      {lockedSkills.map((skill: Skill) => {
                          const Icon = getIconForSkill(skill.id);
                          return (
                              <motion.div 
                                  key={skill.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="system-panel p-3 rounded-sm flex gap-3 opacity-50"
                              >
                                  <div className="w-12 h-12 flex items-center justify-center rounded bg-secondary/20 border border-secondary/30 text-muted-foreground relative">
                                      <Icon size={24} className="opacity-30" />
                                      <Lock size={12} className="absolute bottom-1 right-1" />
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                          <h4 className="font-bold text-sm text-muted-foreground">{skill.name}</h4>
                                          <Badge variant="outline" className="text-[10px] h-5 border-white/10 bg-white/5 text-muted-foreground">LOCKED</Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 leading-tight">{skill.description}</p>
                                  </div>
                              </motion.div>
                          );
                      })}
                  </div>
              </div>
            )}
        </div>
      </div>
    </SystemLayout>
  );
}

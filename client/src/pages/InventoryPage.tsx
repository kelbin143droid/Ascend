import React, { useState, useMemo, useEffect } from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Shield, Gem, FlaskConical, Package, X, Check } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem, Equipment } from "@shared/schema";

const JOB_AVATARS: Record<string, { icon: string; color: string; silhouette: string }> = {
  NONE: { icon: "🧑", color: "#888888", silhouette: "Hunter" },
  WARRIOR: { icon: "⚔️", color: "#dc2626", silhouette: "Warrior" },
  MAGE: { icon: "🔮", color: "#8b5cf6", silhouette: "Mage" },
  SUPPORT: { icon: "✨", color: "#22c55e", silhouette: "Healer" },
  ASSASSIN: { icon: "🗡️", color: "#1f2937", silhouette: "Assassin" },
  RANGER: { icon: "🏹", color: "#16a34a", silhouette: "Ranger" },
  TANK: { icon: "🛡️", color: "#3b82f6", silhouette: "Tank" },
};

const getIconForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'weapon': return Sword;
    case 'armor': return Shield;
    case 'accessory': return Gem;
    case 'consumable': return FlaskConical;
    default: return Package;
  }
};

const getColorForRarity = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case 'S': return 'text-yellow-400 border-yellow-400/50';
    case 'A': return 'text-red-400 border-red-400/50';
    case 'B': return 'text-purple-400 border-purple-400/50';
    case 'C': return 'text-blue-400 border-blue-400/50';
    case 'D': return 'text-green-400 border-green-400/50';
    default: return 'text-gray-400 border-gray-400/50';
  }
};

const getBgForRarity = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case 'S': return 'bg-yellow-400/10';
    case 'A': return 'bg-red-400/10';
    case 'B': return 'bg-purple-400/10';
    case 'C': return 'bg-blue-400/10';
    case 'D': return 'bg-green-400/10';
    default: return 'bg-gray-400/10';
  }
};

export default function InventoryPage() {
  const { player, isLoading, updatePlayer } = useGame();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [initializingInventory, setInitializingInventory] = useState(false);
  
  useEffect(() => {
    const initInventory = async () => {
      if (player && (!player.inventory || player.inventory.length === 0) && !initializingInventory) {
        setInitializingInventory(true);
        try {
          await apiRequest("POST", `/api/player/${player.id}/init-inventory`);
          queryClient.invalidateQueries({ queryKey: ["/api/player", player.id] });
        } catch (error) {
          console.error("Failed to initialize inventory:", error);
        }
        setInitializingInventory(false);
      }
    };
    initInventory();
  }, [player, initializingInventory, queryClient]);
  
  const items = useMemo(() => {
    return player?.inventory || [];
  }, [player?.inventory]);

  const equipment: Equipment = player?.equipment || { weapon: null, armor: null, accessory: null };
  
  const equippedItems = useMemo(() => {
    return {
      weapon: items.find(i => i.id === equipment.weapon),
      armor: items.find(i => i.id === equipment.armor),
      accessory: items.find(i => i.id === equipment.accessory),
    };
  }, [items, equipment]);

  const jobAvatar = JOB_AVATARS[player?.job?.toUpperCase() || "NONE"] || JOB_AVATARS.NONE;

  const handleEquip = (item: InventoryItem) => {
    if (!player) return;
    if (item.type === "consumable") return;
    
    const newEquipment = { ...equipment };
    const slot = item.type as keyof Equipment;
    
    if (newEquipment[slot] === item.id) {
      newEquipment[slot] = null;
    } else {
      newEquipment[slot] = item.id;
    }
    
    updatePlayer({ equipment: newEquipment });
    setSelectedItem(null);
  };

  const totalStats = useMemo(() => {
    const stats: Record<string, number> = {};
    Object.values(equippedItems).forEach(item => {
      if (item?.stats) {
        Object.entries(item.stats).forEach(([key, value]) => {
          stats[key] = (stats[key] || 0) + value;
        });
      }
    });
    return stats;
  }, [equippedItems]);

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
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b-2 border-primary pb-2">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary tracking-tighter drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">INVENTORY</h1>
            <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Equipment & Storage</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">GOLD</span>
            <span className="text-xl font-mono font-bold text-yellow-500 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">{player.gold.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="system-panel p-4 rounded-sm col-span-1">
            <h3 className="text-xs font-bold text-primary/70 mb-3 tracking-wider text-center">AVATAR</h3>
            
            <div className="relative mx-auto w-32 h-40 mb-4">
              <div 
                className="absolute inset-0 rounded-lg border-2 flex flex-col items-center justify-center"
                style={{ 
                  borderColor: jobAvatar.color,
                  background: `linear-gradient(180deg, ${jobAvatar.color}20 0%, transparent 100%)`,
                  boxShadow: `0 0 20px ${jobAvatar.color}40`
                }}
              >
                <div className="text-5xl mb-2">{jobAvatar.icon}</div>
                <div className="text-xs font-bold" style={{ color: jobAvatar.color }}>{jobAvatar.silhouette}</div>
                <div className="text-[10px] text-muted-foreground">{player.job}</div>
              </div>
              
              <div 
                data-testid="slot-weapon"
                className={`absolute -left-6 top-1/4 w-10 h-10 rounded border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${equippedItems.weapon ? getBgForRarity(equippedItems.weapon.rarity) : 'bg-black/50'}`}
                style={{ borderColor: equippedItems.weapon ? undefined : '#444' }}
                onClick={() => equippedItems.weapon && setSelectedItem(equippedItems.weapon)}
              >
                {equippedItems.weapon ? (
                  <span className="text-lg">{equippedItems.weapon.icon || "⚔️"}</span>
                ) : (
                  <Sword className="w-4 h-4 text-gray-600" />
                )}
              </div>
              
              <div 
                data-testid="slot-armor"
                className={`absolute -right-6 top-1/4 w-10 h-10 rounded border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${equippedItems.armor ? getBgForRarity(equippedItems.armor.rarity) : 'bg-black/50'}`}
                style={{ borderColor: equippedItems.armor ? undefined : '#444' }}
                onClick={() => equippedItems.armor && setSelectedItem(equippedItems.armor)}
              >
                {equippedItems.armor ? (
                  <span className="text-lg">{equippedItems.armor.icon || "🛡️"}</span>
                ) : (
                  <Shield className="w-4 h-4 text-gray-600" />
                )}
              </div>
              
              <div 
                data-testid="slot-accessory"
                className={`absolute left-1/2 -translate-x-1/2 -bottom-4 w-10 h-10 rounded border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${equippedItems.accessory ? getBgForRarity(equippedItems.accessory.rarity) : 'bg-black/50'}`}
                style={{ borderColor: equippedItems.accessory ? undefined : '#444' }}
                onClick={() => equippedItems.accessory && setSelectedItem(equippedItems.accessory)}
              >
                {equippedItems.accessory ? (
                  <span className="text-lg">{equippedItems.accessory.icon || "💍"}</span>
                ) : (
                  <Gem className="w-4 h-4 text-gray-600" />
                )}
              </div>
            </div>

            {Object.keys(totalStats).length > 0 && (
              <div className="mt-6 pt-3 border-t border-primary/20">
                <h4 className="text-[10px] text-primary/60 mb-2 tracking-wider">GEAR BONUSES</h4>
                <div className="space-y-1">
                  {Object.entries(totalStats).map(([stat, value]) => (
                    <div key={stat} className="flex justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{stat}</span>
                      <span className="text-green-400 font-mono">+{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="system-panel p-4 rounded-sm col-span-2">
            <h3 className="text-xs font-bold text-primary/70 mb-3 tracking-wider">ITEMS ({items.length})</h3>
            
            <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto">
              {items.map((item) => {
                const Icon = getIconForType(item.type);
                const colorClass = getColorForRarity(item.rarity);
                const isEquipped = equipment[item.type as keyof Equipment] === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    data-testid={`item-${item.id}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedItem(item)}
                    className={`aspect-square system-panel rounded-sm flex flex-col items-center justify-center relative group cursor-pointer transition-colors border ${colorClass} ${isEquipped ? 'ring-2 ring-primary' : ''}`}
                  >
                    {item.icon ? (
                      <span className="text-xl">{item.icon}</span>
                    ) : (
                      <Icon className={`w-6 h-6 ${colorClass.split(' ')[0]}`} />
                    )}
                    {isEquipped && (
                      <span className="absolute top-0.5 right-0.5 text-[8px] font-mono text-primary bg-primary/20 px-1 rounded">E</span>
                    )}
                    <span className="absolute bottom-0.5 left-0.5 text-[8px] font-mono text-muted-foreground">{item.rarity}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="system-panel p-4 rounded-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`w-16 h-16 rounded flex items-center justify-center ${getBgForRarity(selectedItem.rarity)} border ${getColorForRarity(selectedItem.rarity)}`}>
                    {selectedItem.icon ? (
                      <span className="text-3xl">{selectedItem.icon}</span>
                    ) : (
                      React.createElement(getIconForType(selectedItem.type), { className: `w-8 h-8 ${getColorForRarity(selectedItem.rarity).split(' ')[0]}` })
                    )}
                  </div>
                  <div>
                    <h3 className={`font-bold ${getColorForRarity(selectedItem.rarity).split(' ')[0]}`}>{selectedItem.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{selectedItem.type} • Rank {selectedItem.rarity}</p>
                    {selectedItem.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedItem.description}</p>
                    )}
                    {selectedItem.stats && (
                      <div className="flex gap-3 mt-2">
                        {Object.entries(selectedItem.stats).map(([stat, value]) => (
                          <span key={stat} className="text-xs">
                            <span className="text-muted-foreground capitalize">{stat}:</span>
                            <span className="text-green-400 ml-1">+{value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {selectedItem.type !== "consumable" && (
                    <Button
                      data-testid="button-equip"
                      size="sm"
                      onClick={() => handleEquip(selectedItem)}
                      className={equipment[selectedItem.type as keyof Equipment] === selectedItem.id ? 'bg-red-600 hover:bg-red-500' : ''}
                    >
                      {equipment[selectedItem.type as keyof Equipment] === selectedItem.id ? (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Unequip
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Equip
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    data-testid="button-close-details"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedItem(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SystemLayout>
  );
}

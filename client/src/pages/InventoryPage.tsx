import React, { useState, useMemo, useEffect } from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Shield, Gem, FlaskConical, Package, X, Check, Sparkles, Zap } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem, Equipment } from "@shared/schema";

import warriorAvatar from "@/assets/images/warrior-avatar.png";

const JOB_AVATARS: Record<string, { color: string; name: string; image?: string }> = {
  NONE: { color: "#888888", name: "Hunter" },
  WARRIOR: { color: "#dc2626", name: "Warrior", image: warriorAvatar },
  MAGE: { color: "#8b5cf6", name: "Mage" },
  SUPPORT: { color: "#22c55e", name: "Healer" },
  ASSASSIN: { color: "#1f2937", name: "Assassin" },
  RANGER: { color: "#16a34a", name: "Ranger" },
  TANK: { color: "#3b82f6", name: "Tank" },
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
    case 'S': return 'bg-yellow-400/20';
    case 'A': return 'bg-red-400/20';
    case 'B': return 'bg-purple-400/20';
    case 'C': return 'bg-blue-400/20';
    case 'D': return 'bg-green-400/20';
    default: return 'bg-gray-400/20';
  }
};

const ITEM_TABS = [
  { id: 'all', label: 'All', icon: Package },
  { id: 'weapon', label: 'Weapons', icon: Sword },
  { id: 'armor', label: 'Armor', icon: Shield },
  { id: 'accessory', label: 'Acc', icon: Gem },
];

export default function InventoryPage() {
  const { player, isLoading, updatePlayer } = useGame();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [initializingInventory, setInitializingInventory] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
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

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter(item => item.type.toLowerCase() === activeTab);
  }, [items, activeTab]);

  const equipment: Equipment = player?.equipment || { weapon: null, armor: null, accessory: null };
  
  const equippedItems = useMemo(() => {
    return {
      weapon: items.find(i => i.id === equipment.weapon),
      armor: items.find(i => i.id === equipment.armor),
      accessory: items.find(i => i.id === equipment.accessory),
    };
  }, [items, equipment]);

  const jobKey = player?.job?.toUpperCase() || "NONE";
  const jobAvatar = JOB_AVATARS[jobKey] || JOB_AVATARS.NONE;

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
      <div className="space-y-2">
        <div className="flex justify-between items-center border-b border-primary/30 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h1 className="text-xl font-display font-bold text-primary tracking-tight">INVENTORY</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400 font-mono">
              💰 {player.gold.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex gap-2" style={{ height: 'calc(100vh - 180px)', minHeight: '350px' }}>
          <div 
            className="w-[42%] rounded-lg overflow-hidden relative"
            style={{ 
              background: 'linear-gradient(180deg, #3a4a5c 0%, #2a3a4c 50%, #1a2a3c 100%)',
              border: '2px solid rgba(100,150,200,0.3)'
            }}
          >
            <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-10">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-black/50 rounded text-[10px]">
                <span className="text-muted-foreground">Focus</span>
                <span className="text-yellow-400 font-bold">⚡ 25</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-black/50 rounded text-[10px]">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400 font-bold">10</span>
                <span className="text-muted-foreground">Energy</span>
              </div>
            </div>

            <div className="h-full flex items-center justify-center p-4 pt-10">
              {jobAvatar.image ? (
                <img 
                  src={jobAvatar.image} 
                  alt={jobAvatar.name}
                  className="max-h-full max-w-full object-contain drop-shadow-[0_0_20px_rgba(100,150,255,0.3)]"
                />
              ) : (
                <div 
                  className="w-32 h-48 rounded-lg flex items-center justify-center text-6xl"
                  style={{ 
                    background: `linear-gradient(180deg, ${jobAvatar.color}40 0%, ${jobAvatar.color}20 100%)`,
                    border: `2px solid ${jobAvatar.color}50`
                  }}
                >
                  ⚔️
                </div>
              )}
            </div>

            <div 
              data-testid="slot-weapon"
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 backdrop-blur-sm ${equippedItems.weapon ? getBgForRarity(equippedItems.weapon.rarity) : 'bg-black/60'}`}
              style={{ borderColor: equippedItems.weapon ? undefined : 'rgba(100,150,200,0.4)' }}
              onClick={() => equippedItems.weapon && setSelectedItem(equippedItems.weapon)}
            >
              {equippedItems.weapon ? (
                <span className="text-xl">{equippedItems.weapon.icon || "⚔️"}</span>
              ) : (
                <Sword className="w-5 h-5 text-gray-500" />
              )}
            </div>

            <div 
              data-testid="slot-armor"
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 backdrop-blur-sm ${equippedItems.armor ? getBgForRarity(equippedItems.armor.rarity) : 'bg-black/60'}`}
              style={{ borderColor: equippedItems.armor ? undefined : 'rgba(100,150,200,0.4)' }}
              onClick={() => equippedItems.armor && setSelectedItem(equippedItems.armor)}
            >
              {equippedItems.armor ? (
                <span className="text-xl">{equippedItems.armor.icon || "🛡️"}</span>
              ) : (
                <Shield className="w-5 h-5 text-gray-500" />
              )}
            </div>

            <div 
              data-testid="slot-accessory"
              className={`absolute left-2 bottom-12 w-11 h-11 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 backdrop-blur-sm ${equippedItems.accessory ? getBgForRarity(equippedItems.accessory.rarity) : 'bg-black/60'}`}
              style={{ borderColor: equippedItems.accessory ? undefined : 'rgba(100,150,200,0.4)' }}
              onClick={() => equippedItems.accessory && setSelectedItem(equippedItems.accessory)}
            >
              {equippedItems.accessory ? (
                <span className="text-xl">{equippedItems.accessory.icon || "💍"}</span>
              ) : (
                <Gem className="w-5 h-5 text-gray-500" />
              )}
            </div>

            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
              <div className="text-xs font-bold" style={{ color: jobAvatar.color }}>
                {jobAvatar.name}
              </div>
              <div className="px-2 py-0.5 bg-black/50 rounded text-xs font-mono text-primary">
                Lv.{player.level}
              </div>
            </div>
          </div>

          <div className="flex-1 system-panel rounded-lg flex flex-col overflow-hidden">
            <div className="flex gap-1 p-2 border-b border-primary/20 overflow-x-auto">
              {ITEM_TABS.map((tab) => {
                const Icon = tab.icon;
                const count = tab.id === 'all' ? items.length : items.filter(i => i.type.toLowerCase() === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    data-testid={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-primary/20 text-primary border border-primary/50' 
                        : 'bg-black/30 text-muted-foreground border border-transparent hover:border-primary/30'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                    <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-4 gap-1.5">
                {filteredItems.map((item) => {
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
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-colors border-2 ${colorClass} ${getBgForRarity(item.rarity)} ${isEquipped ? 'ring-2 ring-primary ring-offset-1 ring-offset-black' : ''}`}
                    >
                      {item.icon ? (
                        <span className="text-2xl">{item.icon}</span>
                      ) : (
                        <Icon className={`w-6 h-6 ${colorClass.split(' ')[0]}`} />
                      )}
                      {isEquipped && (
                        <span className="absolute top-0.5 right-0.5 text-[7px] font-mono text-primary bg-primary/30 px-0.5 rounded">E</span>
                      )}
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold opacity-80" style={{
                        color: item.rarity === 'S' ? '#facc15' : item.rarity === 'A' ? '#f87171' : item.rarity === 'B' ? '#a78bfa' : item.rarity === 'C' ? '#60a5fa' : item.rarity === 'D' ? '#4ade80' : '#9ca3af'
                      }}>{item.rarity}</span>
                    </motion.button>
                  );
                })}
              </div>
              
              {filteredItems.length === 0 && (
                <div className="flex items-center justify-center h-20 text-muted-foreground text-xs">
                  No items
                </div>
              )}
            </div>

            {Object.keys(totalStats).length > 0 && (
              <div className="p-2 border-t border-primary/20">
                <div className="text-[9px] text-primary/60 mb-1 tracking-wider">GEAR BONUSES</div>
                <div className="flex gap-3">
                  {Object.entries(totalStats).map(([stat, value]) => (
                    <div key={stat} className="text-xs">
                      <span className="text-green-400 font-mono font-bold">+{value}</span>
                      <span className="text-muted-foreground ml-1 capitalize">{stat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-20 left-2 right-2 system-panel p-3 rounded-lg border-2 border-primary/30 z-50"
              style={{ background: 'rgba(0,0,0,0.95)' }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3 flex-1">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${getBgForRarity(selectedItem.rarity)} border-2 ${getColorForRarity(selectedItem.rarity)}`}>
                    {selectedItem.icon ? (
                      <span className="text-2xl">{selectedItem.icon}</span>
                    ) : (
                      React.createElement(getIconForType(selectedItem.type), { className: `w-7 h-7 ${getColorForRarity(selectedItem.rarity).split(' ')[0]}` })
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-sm truncate ${getColorForRarity(selectedItem.rarity).split(' ')[0]}`}>{selectedItem.name}</h3>
                    <p className="text-[10px] text-muted-foreground capitalize">{selectedItem.type} • Rank {selectedItem.rarity}</p>
                    {selectedItem.stats && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {Object.entries(selectedItem.stats).map(([stat, value]) => (
                          <span key={stat} className="text-[10px] bg-green-500/20 px-1.5 py-0.5 rounded">
                            <span className="capitalize">{stat}:</span>
                            <span className="text-green-400 ml-0.5 font-bold">+{value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1.5 shrink-0">
                  {selectedItem.type !== "consumable" && (
                    <Button
                      data-testid="button-equip"
                      size="sm"
                      onClick={() => handleEquip(selectedItem)}
                      className={`text-xs h-8 ${equipment[selectedItem.type as keyof Equipment] === selectedItem.id ? 'bg-red-600 hover:bg-red-500' : 'bg-primary hover:bg-primary/80'}`}
                    >
                      {equipment[selectedItem.type as keyof Equipment] === selectedItem.id ? 'Unequip' : 'Equip'}
                    </Button>
                  )}
                  <Button
                    data-testid="button-close-details"
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
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

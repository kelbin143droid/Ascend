import React, { useState, useMemo, useEffect } from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Shield, Gem, FlaskConical, Package, X, Check, Star, ChevronRight } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem, Equipment } from "@shared/schema";

import warriorHero from "@/assets/images/warrior-hero.png";

const JOB_AVATARS: Record<string, { color: string; name: string; image?: string }> = {
  NONE: { color: "#888888", name: "Ascendant" },
  WARRIOR: { color: "#f59e0b", name: "Warrior", image: warriorHero },
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

const getRarityColor = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case 'S': return '#facc15';
    case 'A': return '#f87171';
    case 'B': return '#a78bfa';
    case 'C': return '#60a5fa';
    case 'D': return '#4ade80';
    default: return '#9ca3af';
  }
};

const getRarityBg = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case 'S': return 'rgba(250,204,21,0.15)';
    case 'A': return 'rgba(248,113,113,0.15)';
    case 'B': return 'rgba(167,139,250,0.15)';
    case 'C': return 'rgba(96,165,250,0.15)';
    case 'D': return 'rgba(74,222,128,0.15)';
    default: return 'rgba(156,163,175,0.15)';
  }
};

const ITEM_TABS = [
  { id: 'all', label: 'All' },
  { id: 'weapon', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'accessory', label: 'Acc' },
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
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <h1 className="text-lg font-bold text-white tracking-wide">INVENTORY</h1>
          </div>
          <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400 font-mono">
            💰 {player.gold.toLocaleString()}
          </div>
        </div>

        <div className="flex-1 flex gap-2 p-2 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          <div 
            className="w-[48%] rounded-xl overflow-hidden relative"
            style={{ 
              background: 'linear-gradient(160deg, #5a6a7a 0%, #3a4a5a 40%, #2a3a4a 100%)',
              border: '3px solid #4a6a8a',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3), 0 0 20px rgba(74,106,138,0.3)'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {jobAvatar.image ? (
                <img 
                  src={jobAvatar.image} 
                  alt={jobAvatar.name}
                  className="h-full w-full object-contain"
                  style={{ 
                    filter: 'drop-shadow(0 0 20px rgba(100,200,255,0.4))'
                  }}
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
          </div>

          <div 
            className="flex-1 rounded-xl overflow-hidden flex flex-col"
            style={{ 
              background: 'linear-gradient(180deg, #1e2a3a 0%, #0f1a2a 100%)',
              border: '2px solid #2a3a4a'
            }}
          >
            <div className="flex items-center justify-between p-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">EQUIPMENT</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-gray-700 rounded">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-1 hover:bg-gray-700 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex gap-1 px-2 pt-2">
              {ITEM_TABS.map((tab) => {
                const count = tab.id === 'all' ? items.length : items.filter(i => i.type.toLowerCase() === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    data-testid={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      activeTab === tab.id 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                        : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-4 gap-1.5">
                {filteredItems.map((item) => {
                  const Icon = getIconForType(item.type);
                  const isEquipped = equipment[item.type as keyof Equipment] === item.id;
                  const rarityColor = getRarityColor(item.rarity);
                  
                  return (
                    <motion.button
                      key={item.id}
                      data-testid={`item-${item.id}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedItem(item)}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-all"
                      style={{
                        background: getRarityBg(item.rarity),
                        border: `2px solid ${rarityColor}60`,
                        boxShadow: isEquipped ? `0 0 12px ${rarityColor}60, inset 0 0 20px ${rarityColor}20` : 'none'
                      }}
                    >
                      {item.icon ? (
                        <span className="text-xl">{item.icon}</span>
                      ) : (
                        <Icon className="w-5 h-5" style={{ color: rarityColor }} />
                      )}
                      {isEquipped && (
                        <span 
                          className="absolute top-0.5 right-0.5 text-[7px] font-bold px-1 rounded"
                          style={{ background: rarityColor, color: '#000' }}
                        >E</span>
                      )}
                      <span 
                        className="absolute bottom-0.5 right-0.5 text-[8px] font-bold"
                        style={{ color: rarityColor }}
                      >{item.rarity}</span>
                    </motion.button>
                  );
                })}
              </div>
              
              {filteredItems.length === 0 && (
                <div className="flex items-center justify-center h-20 text-gray-500 text-xs">
                  No items in this category
                </div>
              )}
            </div>

            {Object.keys(totalStats).length > 0 && (
              <div className="p-2 border-t border-gray-700 bg-gray-900/50">
                <div className="text-[9px] text-cyan-400/60 mb-1 tracking-wider uppercase">Gear Bonuses</div>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(totalStats).map(([stat, value]) => (
                    <div key={stat} className="text-xs">
                      <span className="text-green-400 font-mono font-bold">+{value}</span>
                      <span className="text-gray-400 ml-1 capitalize">{stat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-2 border-t border-gray-700 bg-gray-900/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Package className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Inventory Cart</div>
                  <div className="text-[10px] text-gray-400">
                    {items.length} items • 💰 {player.gold.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-16 left-2 right-2 p-3 rounded-xl z-50"
              style={{ 
                background: 'linear-gradient(180deg, #1a2a3a 0%, #0a1a2a 100%)',
                border: `2px solid ${getRarityColor(selectedItem.rarity)}60`,
                boxShadow: `0 0 20px ${getRarityColor(selectedItem.rarity)}30`
              }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3 flex-1">
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: getRarityBg(selectedItem.rarity),
                      border: `2px solid ${getRarityColor(selectedItem.rarity)}`
                    }}
                  >
                    {selectedItem.icon ? (
                      <span className="text-2xl">{selectedItem.icon}</span>
                    ) : (
                      React.createElement(getIconForType(selectedItem.type), { 
                        className: 'w-7 h-7',
                        style: { color: getRarityColor(selectedItem.rarity) }
                      })
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 
                      className="font-bold text-sm truncate"
                      style={{ color: getRarityColor(selectedItem.rarity) }}
                    >{selectedItem.name}</h3>
                    <p className="text-[10px] text-gray-400 capitalize">{selectedItem.type} • TIER {selectedItem.rarity}</p>
                    {selectedItem.stats && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {Object.entries(selectedItem.stats).map(([stat, value]) => (
                          <span 
                            key={stat} 
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(34,197,94,0.2)' }}
                          >
                            <span className="capitalize text-gray-300">{stat}:</span>
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
                      className={`text-xs h-8 ${equipment[selectedItem.type as keyof Equipment] === selectedItem.id ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                    >
                      {equipment[selectedItem.type as keyof Equipment] === selectedItem.id ? 'Unequip' : 'Equip'}
                    </Button>
                  )}
                  <Button
                    data-testid="button-close-details"
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 border-gray-600"
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

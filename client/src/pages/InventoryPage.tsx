import React, { useState, useMemo, useEffect } from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Shield, Gem, FlaskConical, Package, X, User, Palette } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem, Equipment, AvatarCustomization } from "@shared/schema";

import warriorHero from "@/assets/images/warrior-hero.png";

const JOB_AVATARS: Record<string, { color: string; name: string; image?: string }> = {
  NONE: { color: "#888888", name: "Hunter" },
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

const HAIR_STYLES = [
  { id: 1, name: "Short" },
  { id: 2, name: "Spiky" },
  { id: 3, name: "Long" },
  { id: 4, name: "Ponytail" },
  { id: 5, name: "Mohawk" },
];

const COLOR_PRESETS = {
  hair: ["#1a1a1a", "#4a3728", "#8B4513", "#D4A574", "#FFD700", "#C41E3A", "#4169E1", "#9B59B6", "#2E8B57", "#FF69B4"],
  skin: ["#FFDFC4", "#F0D5BE", "#DEB887", "#D2A679", "#C68642", "#A67B5B", "#8D5524", "#6B4423", "#5C4033", "#3D2314"],
  eyes: ["#4169E1", "#2E8B57", "#8B4513", "#1a1a1a", "#9B59B6", "#C41E3A", "#FFD700", "#FF69B4", "#00CED1", "#DC143C"],
  outfit: ["#4A5568", "#2D3748", "#1A202C", "#C41E3A", "#4169E1", "#2E8B57", "#9B59B6", "#FFD700", "#FF6B35", "#00CED1"],
};

type MainTab = "equipment" | "customize";

export default function InventoryPage() {
  const { player, isLoading, updatePlayer } = useGame();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [initializingInventory, setInitializingInventory] = useState(false);
  const [activeItemTab, setActiveItemTab] = useState('all');
  const [mainTab, setMainTab] = useState<MainTab>("equipment");
  
  const defaultAvatar: AvatarCustomization = {
    hairStyle: 1,
    hairColor: "#8B4513",
    skinColor: "#DEB887",
    eyeColor: "#2E8B57",
    outfitColor: "#4A5568",
  };
  
  const [avatarSettings, setAvatarSettings] = useState<AvatarCustomization>(
    player?.avatarCustomization || defaultAvatar
  );

  useEffect(() => {
    if (player?.avatarCustomization) {
      setAvatarSettings(player.avatarCustomization);
    }
  }, [player?.avatarCustomization]);
  
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
    if (activeItemTab === 'all') return items;
    return items.filter(item => item.type.toLowerCase() === activeItemTab);
  }, [items, activeItemTab]);

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

  const handleAvatarChange = (key: keyof AvatarCustomization, value: string | number) => {
    const newSettings = { ...avatarSettings, [key]: value };
    setAvatarSettings(newSettings);
    updatePlayer({ avatarCustomization: newSettings });
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
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                data-testid="tab-equipment"
                onClick={() => setMainTab("equipment")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mainTab === "equipment"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                    : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Equipment
              </button>
              <button
                data-testid="tab-customize"
                onClick={() => setMainTab("customize")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mainTab === "customize"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-lg shadow-purple-500/20"
                    : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Customize
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">💰 {player.gold.toLocaleString()}</span>
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
                    filter: `drop-shadow(0 0 20px ${avatarSettings.outfitColor}60) hue-rotate(${getHueRotation(avatarSettings.outfitColor)}deg)`
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
            
            {mainTab === "equipment" && (
              <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 justify-center">
                {(["weapon", "armor", "accessory"] as const).map((slot) => {
                  const equipped = equippedItems[slot];
                  return (
                    <div
                      key={slot}
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: equipped ? getRarityBg(equipped.rarity) : 'rgba(0,0,0,0.4)',
                        border: equipped ? `2px solid ${getRarityColor(equipped.rarity)}` : '2px dashed rgba(255,255,255,0.2)'
                      }}
                    >
                      {equipped ? (
                        equipped.icon ? (
                          <span className="text-lg">{equipped.icon}</span>
                        ) : (
                          React.createElement(getIconForType(slot), {
                            className: "w-4 h-4",
                            style: { color: getRarityColor(equipped.rarity) }
                          })
                        )
                      ) : (
                        React.createElement(getIconForType(slot), {
                          className: "w-4 h-4 text-gray-500/50"
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div 
            className="flex-1 rounded-xl overflow-hidden flex flex-col"
            style={{ 
              background: 'linear-gradient(180deg, #1e2a3a 0%, #0f1a2a 100%)',
              border: '2px solid #2a3a4a'
            }}
          >
            {mainTab === "equipment" ? (
              <>
                <div className="flex items-center justify-between p-2 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">INVENTORY</span>
                  </div>
                  <span className="text-xs text-gray-400">{items.length} items</span>
                </div>

                <div className="flex gap-1 px-2 pt-2">
                  {ITEM_TABS.map((tab) => {
                    const count = tab.id === 'all' ? items.length : items.filter(i => i.type.toLowerCase() === tab.id).length;
                    return (
                      <button
                        key={tab.id}
                        data-testid={`item-tab-${tab.id}`}
                        onClick={() => setActiveItemTab(tab.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                          activeItemTab === tab.id 
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
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-2 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-white">AVATAR CUSTOMIZATION</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  <div>
                    <label className="text-[10px] text-purple-400/80 uppercase tracking-wider font-bold mb-2 block">Hair Style</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {HAIR_STYLES.map((style) => (
                        <button
                          key={style.id}
                          data-testid={`hair-style-${style.id}`}
                          onClick={() => handleAvatarChange('hairStyle', style.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            avatarSettings.hairStyle === style.id
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/60'
                              : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          {style.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-purple-400/80 uppercase tracking-wider font-bold mb-2 block">Hair Color</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {COLOR_PRESETS.hair.map((color) => (
                        <button
                          key={color}
                          data-testid={`hair-color-${color.replace('#', '')}`}
                          onClick={() => handleAvatarChange('hairColor', color)}
                          className={`w-8 h-8 rounded-full transition-all ${
                            avatarSettings.hairColor === color
                              ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ 
                            background: color,
                            border: '2px solid rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-purple-400/80 uppercase tracking-wider font-bold mb-2 block">Skin Tone</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {COLOR_PRESETS.skin.map((color) => (
                        <button
                          key={color}
                          data-testid={`skin-color-${color.replace('#', '')}`}
                          onClick={() => handleAvatarChange('skinColor', color)}
                          className={`w-8 h-8 rounded-full transition-all ${
                            avatarSettings.skinColor === color
                              ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ 
                            background: color,
                            border: '2px solid rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-purple-400/80 uppercase tracking-wider font-bold mb-2 block">Eye Color</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {COLOR_PRESETS.eyes.map((color) => (
                        <button
                          key={color}
                          data-testid={`eye-color-${color.replace('#', '')}`}
                          onClick={() => handleAvatarChange('eyeColor', color)}
                          className={`w-8 h-8 rounded-full transition-all ${
                            avatarSettings.eyeColor === color
                              ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ 
                            background: color,
                            border: '2px solid rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-purple-400/80 uppercase tracking-wider font-bold mb-2 block">Outfit Color</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {COLOR_PRESETS.outfit.map((color) => (
                        <button
                          key={color}
                          data-testid={`outfit-color-${color.replace('#', '')}`}
                          onClick={() => handleAvatarChange('outfitColor', color)}
                          className={`w-8 h-8 rounded-full transition-all ${
                            avatarSettings.outfitColor === color
                              ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ 
                            background: color,
                            border: '2px solid rgba(255,255,255,0.2)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-2 border-t border-gray-700 bg-gray-900/30">
                  <div className="text-[10px] text-gray-400 text-center">
                    Changes save automatically
                  </div>
                </div>
              </>
            )}
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
                    <p className="text-[10px] text-gray-400 capitalize">{selectedItem.type} • Rank {selectedItem.rarity}</p>
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

function getHueRotation(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return Math.round(h * 360);
}

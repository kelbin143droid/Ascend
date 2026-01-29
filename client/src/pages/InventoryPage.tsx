import React, { useState, useMemo, useEffect } from "react";
import { SystemLayout } from "@/components/game/SystemLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Shield, Gem, FlaskConical, Package, X, Check } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem, Equipment } from "@shared/schema";

const JOB_AVATARS: Record<string, { color: string; name: string }> = {
  NONE: { color: "#888888", name: "Hunter" },
  WARRIOR: { color: "#dc2626", name: "Warrior" },
  MAGE: { color: "#8b5cf6", name: "Mage" },
  SUPPORT: { color: "#22c55e", name: "Healer" },
  ASSASSIN: { color: "#1f2937", name: "Assassin" },
  RANGER: { color: "#16a34a", name: "Ranger" },
  TANK: { color: "#3b82f6", name: "Tank" },
};

const CharacterSilhouette = ({ job, color }: { job: string; color: string }) => {
  const getSilhouette = () => {
    switch (job.toUpperCase()) {
      case 'WARRIOR':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="warriorBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a3728" />
                <stop offset="100%" stopColor="#2d1f15" />
              </linearGradient>
              <linearGradient id="warriorArmor" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b8b8b" />
                <stop offset="50%" stopColor="#5a5a5a" />
                <stop offset="100%" stopColor="#3d3d3d" />
              </linearGradient>
              <linearGradient id="warriorSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e8c4a0" />
                <stop offset="100%" stopColor="#c9a882" />
              </linearGradient>
              <linearGradient id="swordBlade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c0c0c0" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#a0a0a0" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="20" rx="12" ry="14" fill="url(#warriorSkin)" />
            <ellipse cx="46" cy="18" rx="2" ry="2" fill="#3d2314" />
            <ellipse cx="54" cy="18" rx="2" ry="2" fill="#3d2314" />
            <path d="M47,23 Q50,26 53,23" stroke="#3d2314" strokeWidth="1" fill="none" />
            <rect x="38" y="10" width="24" height="8" rx="2" fill="#5a4a3a" />
            <polygon points="50,6 44,14 56,14" fill="#5a4a3a" />
            <path d="M32,34 L68,34 L72,82 L28,82 Z" fill="url(#warriorArmor)" />
            <rect x="40" y="36" width="20" height="8" rx="1" fill="#666" />
            <rect x="38" y="48" width="24" height="3" fill="#777" />
            <rect x="38" y="55" width="24" height="3" fill="#777" />
            <rect x="38" y="62" width="24" height="3" fill="#777" />
            <ellipse cx="50" cy="42" rx="6" ry="6" fill={color} opacity="0.8" />
            <path d="M28,36 L32,34 L30,70 L22,68 Z" fill="url(#warriorArmor)" />
            <ellipse cx="25" cy="40" rx="6" ry="5" fill="#666" />
            <path d="M68,36 L72,34 L78,68 L70,70 Z" fill="url(#warriorArmor)" />
            <ellipse cx="75" cy="40" rx="6" ry="5" fill="#666" />
            <ellipse cx="20" cy="72" rx="5" ry="6" fill="url(#warriorSkin)" />
            <ellipse cx="80" cy="72" rx="5" ry="6" fill="url(#warriorSkin)" />
            <rect x="34" y="80" width="13" height="38" rx="3" fill="url(#warriorBody)" />
            <rect x="53" y="80" width="13" height="38" rx="3" fill="url(#warriorBody)" />
            <rect x="32" y="114" width="17" height="8" rx="2" fill="#3d3d3d" />
            <rect x="51" y="114" width="17" height="8" rx="2" fill="#3d3d3d" />
            <rect x="6" y="30" width="5" height="50" rx="1" fill="url(#swordBlade)" />
            <polygon points="8.5,25 4,32 13,32" fill="url(#swordBlade)" />
            <rect x="4" y="78" width="9" height="8" rx="2" fill="#8b6914" />
            <rect x="6" y="84" width="5" height="12" rx="1" fill="#5a4a3a" />
            <ellipse cx="88" cy="55" rx="10" ry="14" fill="#666" stroke="#888" strokeWidth="2" />
            <ellipse cx="88" cy="55" rx="6" ry="10" fill="#555" />
            <circle cx="88" cy="55" r="3" fill={color} />
          </svg>
        );
      case 'MAGE':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="mageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="18" rx="12" ry="14" fill="url(#mageGrad)" />
            <polygon points="50,0 38,22 62,22" fill={color} />
            <path d="M30,32 Q50,25 70,32 L75,90 Q50,100 25,90 Z" fill="url(#mageGrad)" />
            <rect x="40" y="88" width="8" height="35" rx="2" fill="url(#mageGrad)" />
            <rect x="52" y="88" width="8" height="35" rx="2" fill="url(#mageGrad)" />
            <rect x="75" y="30" width="5" height="60" rx="2" fill={color} />
            <circle cx="77" cy="25" r="8" fill={color} opacity="0.6" />
            <circle cx="77" cy="25" r="4" fill="white" opacity="0.8" />
          </svg>
        );
      case 'ASSASSIN':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="assassinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00ffff" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="16" rx="11" ry="13" fill="url(#assassinGrad)" />
            <rect x="40" y="8" width="20" height="8" rx="2" fill={color} />
            <path d="M35,28 L65,28 L68,75 L32,75 Z" fill="url(#assassinGrad)" />
            <rect x="22" y="32" width="12" height="30" rx="3" fill="url(#assassinGrad)" transform="rotate(-10, 28, 47)" />
            <rect x="66" y="32" width="12" height="30" rx="3" fill="url(#assassinGrad)" transform="rotate(10, 72, 47)" />
            <rect x="38" y="73" width="9" height="42" rx="2" fill="url(#assassinGrad)" />
            <rect x="53" y="73" width="9" height="42" rx="2" fill="url(#assassinGrad)" />
            <rect x="10" y="50" width="4" height="30" rx="1" fill="#00ffff" />
            <polygon points="12,48 8,40 16,40" fill="#00ffff" />
            <rect x="86" y="50" width="4" height="30" rx="1" fill="#00ffff" />
            <polygon points="88,48 84,40 92,40" fill="#00ffff" />
          </svg>
        );
      case 'RANGER':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="rangerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="17" rx="11" ry="13" fill="url(#rangerGrad)" />
            <path d="M50,5 Q55,0 60,8 L55,12 Z" fill={color} />
            <path d="M33,30 L67,30 L70,78 L30,78 Z" fill="url(#rangerGrad)" />
            <rect x="20" y="35" width="12" height="32" rx="3" fill="url(#rangerGrad)" transform="rotate(-8, 26, 51)" />
            <rect x="68" y="35" width="12" height="32" rx="3" fill="url(#rangerGrad)" transform="rotate(8, 74, 51)" />
            <rect x="37" y="76" width="10" height="40" rx="2" fill="url(#rangerGrad)" />
            <rect x="53" y="76" width="10" height="40" rx="2" fill="url(#rangerGrad)" />
            <path d="M85,20 Q95,50 85,80 L88,50 Z" fill={color} stroke={color} strokeWidth="2" />
            <line x1="85" y1="50" x2="70" y2="50" stroke={color} strokeWidth="2" />
            <polygon points="68,50 72,47 72,53" fill={color} />
          </svg>
        );
      case 'TANK':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="tankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="18" rx="13" ry="15" fill="url(#tankGrad)" />
            <rect x="37" y="5" width="26" height="18" rx="3" fill={color} opacity="0.8" />
            <path d="M25,32 L75,32 L78,82 L22,82 Z" fill="url(#tankGrad)" />
            <rect x="10" y="35" width="18" height="38" rx="4" fill="url(#tankGrad)" />
            <rect x="72" y="35" width="18" height="38" rx="4" fill="url(#tankGrad)" />
            <rect x="32" y="80" width="14" height="38" rx="3" fill="url(#tankGrad)" />
            <rect x="54" y="80" width="14" height="38" rx="3" fill="url(#tankGrad)" />
            <ellipse cx="15" cy="55" rx="12" ry="18" fill={color} opacity="0.7" />
            <ellipse cx="15" cy="55" rx="8" ry="12" fill="url(#tankGrad)" />
          </svg>
        );
      case 'SUPPORT':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="supportGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="17" rx="12" ry="14" fill="url(#supportGrad)" />
            <circle cx="50" cy="8" r="4" fill={color} opacity="0.6" />
            <path d="M30,30 Q50,25 70,30 L73,85 Q50,95 27,85 Z" fill="url(#supportGrad)" />
            <rect x="38" y="83" width="9" height="38" rx="2" fill="url(#supportGrad)" />
            <rect x="53" y="83" width="9" height="38" rx="2" fill="url(#supportGrad)" />
            <rect x="78" y="25" width="4" height="50" rx="2" fill={color} />
            <rect x="72" y="30" width="16" height="4" rx="1" fill={color} />
            <circle cx="25" cy="45" r="6" fill={color} opacity="0.5" />
            <circle cx="20" cy="60" r="4" fill={color} opacity="0.4" />
            <circle cx="28" cy="70" r="3" fill={color} opacity="0.3" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <ellipse cx="50" cy="18" rx="13" ry="15" fill="url(#defaultGrad)" />
            <rect x="35" y="32" width="30" height="45" rx="4" fill="url(#defaultGrad)" />
            <rect x="22" y="35" width="13" height="32" rx="3" fill="url(#defaultGrad)" />
            <rect x="65" y="35" width="13" height="32" rx="3" fill="url(#defaultGrad)" />
            <rect x="38" y="75" width="10" height="40" rx="3" fill="url(#defaultGrad)" />
            <rect x="52" y="75" width="10" height="40" rx="3" fill="url(#defaultGrad)" />
          </svg>
        );
    }
  };
  
  return getSilhouette();
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
            
            <div className="relative mx-auto w-32 h-44 mb-4">
              <div 
                className="absolute inset-0 rounded-lg border-2 overflow-hidden"
                style={{ 
                  borderColor: jobAvatar.color,
                  background: `linear-gradient(180deg, ${jobAvatar.color}15 0%, transparent 50%, ${jobAvatar.color}10 100%)`,
                  boxShadow: `0 0 25px ${jobAvatar.color}50, inset 0 0 30px ${jobAvatar.color}20`
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center p-2 pb-6">
                  <CharacterSilhouette job={jobKey} color={jobAvatar.color} />
                </div>
                <div className="absolute bottom-1 left-0 right-0 text-center">
                  <div className="text-xs font-bold tracking-wider" style={{ color: jobAvatar.color, textShadow: `0 0 10px ${jobAvatar.color}` }}>{jobAvatar.name}</div>
                </div>
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

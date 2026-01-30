import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import { FURNITURE_CATALOG, FLOOR_STYLES, WALL_STYLES, RARITY_COLORS, getFurnitureById, FurnitureDef } from "@/lib/furnitureCatalog";
import { HousingRoom, FurnitureItem } from "@shared/schema";
import { Home, Package, Paintbrush, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

type PlacementMode = "view" | "place" | "delete";
type CatalogCategory = "all" | FurnitureDef["category"];

const CATEGORIES: { id: CatalogCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "seating", label: "Seating" },
  { id: "table", label: "Tables" },
  { id: "storage", label: "Storage" },
  { id: "decor", label: "Decor" },
  { id: "lighting", label: "Lights" },
  { id: "bed", label: "Beds" },
  { id: "plant", label: "Plants" },
];

export default function HousingPage() {
  const { player, updatePlayer, isLoading } = useGame();
  const [mode, setMode] = useState<PlacementMode>("view");
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureDef | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState<CatalogCategory>("all");
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  if (isLoading || !player) {
    return (
      <SystemLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-primary/60 animate-pulse">Loading...</div>
        </div>
      </SystemLayout>
    );
  }

  const housing = player.housing || {
    rooms: [{
      id: "main",
      name: "Main Room",
      width: 8,
      height: 6,
      floorStyle: "wood",
      wallStyle: "stone",
      furniture: []
    }],
    activeRoomId: "main"
  };

  const activeRoom = housing.rooms.find(r => r.id === housing.activeRoomId) || housing.rooms[0];
  const currentFloor = FLOOR_STYLES.find(f => f.id === activeRoom.floorStyle) || FLOOR_STYLES[0];
  const currentWall = WALL_STYLES.find(w => w.id === activeRoom.wallStyle) || WALL_STYLES[0];

  const updateRoom = (updates: Partial<HousingRoom>) => {
    const newRooms = housing.rooms.map(r => 
      r.id === activeRoom.id ? { ...r, ...updates } : r
    );
    updatePlayer({ housing: { ...housing, rooms: newRooms } });
  };

  const isCellOccupied = (x: number, y: number, excludeId?: string): FurnitureItem | undefined => {
    return activeRoom.furniture.find(f => {
      if (excludeId && f.id === excludeId) return false;
      const def = getFurnitureById(f.itemId);
      if (!def) return false;
      return x >= f.x && x < f.x + def.width && y >= f.y && y < f.y + def.height;
    });
  };

  const canPlace = (x: number, y: number, furniture: FurnitureDef): boolean => {
    if (x + furniture.width > activeRoom.width || y + furniture.height > activeRoom.height) {
      return false;
    }
    for (let dx = 0; dx < furniture.width; dx++) {
      for (let dy = 0; dy < furniture.height; dy++) {
        if (isCellOccupied(x + dx, y + dy)) return false;
      }
    }
    return true;
  };

  const handleCellClick = (x: number, y: number) => {
    if (mode === "place" && selectedFurniture) {
      if (canPlace(x, y, selectedFurniture)) {
        if (player.gold < selectedFurniture.cost) return;
        
        const newFurniture: FurnitureItem = {
          id: `${selectedFurniture.id}_${Date.now()}`,
          itemId: selectedFurniture.id,
          x,
          y,
          rotation: 0,
        };
        updateRoom({ furniture: [...activeRoom.furniture, newFurniture] });
        updatePlayer({ gold: player.gold - selectedFurniture.cost });
        setSelectedFurniture(null);
        setMode("view");
      }
    } else if (mode === "delete") {
      const occupant = isCellOccupied(x, y);
      if (occupant) {
        const def = getFurnitureById(occupant.itemId);
        const refund = def ? Math.floor(def.cost * 0.5) : 0;
        updateRoom({ furniture: activeRoom.furniture.filter(f => f.id !== occupant.id) });
        updatePlayer({ gold: player.gold + refund });
      }
    }
  };

  const filteredCatalog = catalogCategory === "all" 
    ? FURNITURE_CATALOG 
    : FURNITURE_CATALOG.filter(f => f.category === catalogCategory);

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < activeRoom.height; y++) {
      for (let x = 0; x < activeRoom.width; x++) {
        const occupant = isCellOccupied(x, y);
        const def = occupant ? getFurnitureById(occupant.itemId) : null;
        const isOrigin = occupant && occupant.x === x && occupant.y === y;
        
        let canPlaceHere = false;
        if (mode === "place" && selectedFurniture && hoveredCell?.x === x && hoveredCell?.y === y) {
          canPlaceHere = canPlace(x, y, selectedFurniture);
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            data-testid={`cell-${x}-${y}`}
            className={`
              border border-white/5 relative transition-all cursor-pointer
              ${mode === "delete" && occupant ? "hover:border-red-500/50 hover:bg-red-500/10" : ""}
              ${mode === "place" && !occupant ? "hover:border-primary/30" : ""}
            `}
            style={{ 
              backgroundColor: currentFloor.color + "40",
              aspectRatio: "1",
            }}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => setHoveredCell({ x, y })}
            onMouseLeave={() => setHoveredCell(null)}
          >
            {isOrigin && def && (
              <div 
                className="absolute inset-0 flex items-center justify-center text-2xl z-10 pointer-events-none"
                style={{
                  width: `${def.width * 100}%`,
                  height: `${def.height * 100}%`,
                  backgroundColor: def.color + "30",
                  border: `1px solid ${def.color}60`,
                  borderRadius: "4px",
                }}
              >
                {def.emoji}
              </div>
            )}
            {mode === "place" && selectedFurniture && hoveredCell?.x === x && hoveredCell?.y === y && (
              <div 
                className={`absolute inset-0 flex items-center justify-center text-2xl z-20 pointer-events-none opacity-60
                  ${canPlaceHere ? "bg-green-500/20 border-green-500/50" : "bg-red-500/20 border-red-500/50"}
                `}
                style={{
                  width: `${selectedFurniture.width * 100}%`,
                  height: `${selectedFurniture.height * 100}%`,
                  border: "2px dashed",
                  borderRadius: "4px",
                }}
              >
                {selectedFurniture.emoji}
              </div>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <SystemLayout>
      <div className="flex flex-col h-full p-2 gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="text-primary" size={18} />
            <span className="text-sm font-display text-primary/80">{activeRoom.name}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-yellow-400">💰</span>
            <span className="font-mono text-yellow-400/80">{player.gold}</span>
          </div>
        </div>

        <div 
          className="system-panel flex-1 p-2 rounded-lg overflow-hidden"
          style={{ borderColor: currentWall.color + "40" }}
        >
          <div 
            className="grid gap-0.5 h-full"
            style={{ 
              gridTemplateColumns: `repeat(${activeRoom.width}, 1fr)`,
              gridTemplateRows: `repeat(${activeRoom.height}, 1fr)`,
            }}
          >
            {renderGrid()}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            data-testid="button-catalog"
            variant={catalogOpen ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setCatalogOpen(true)}
          >
            <Package size={14} className="mr-1" />
            Furniture
          </Button>
          <Button
            data-testid="button-delete-mode"
            variant={mode === "delete" ? "destructive" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setMode(mode === "delete" ? "view" : "delete")}
          >
            <Trash2 size={14} />
          </Button>
          <Button
            data-testid="button-style"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setStyleOpen(true)}
          >
            <Paintbrush size={14} />
          </Button>
        </div>

        {mode === "place" && selectedFurniture && (
          <div className="system-panel p-2 rounded flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedFurniture.emoji}</span>
              <span className="text-white/80">{selectedFurniture.name}</span>
              <span className="text-yellow-400/60">-{selectedFurniture.cost}g</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400"
              onClick={() => { setSelectedFurniture(null); setMode("view"); }}
            >
              <X size={14} />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="bg-black/95 border-primary/20 max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-primary/80 font-display text-sm flex items-center gap-2">
              <Package size={16} />
              FURNITURE CATALOG
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-1 flex-wrap pb-2 border-b border-white/5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                data-testid={`button-category-${cat.id}`}
                onClick={() => setCatalogCategory(cat.id)}
                className={`px-2 py-1 text-[10px] rounded transition-all ${
                  catalogCategory === cat.id 
                    ? "bg-primary/20 text-primary border border-primary/40" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 py-2">
            {filteredCatalog.map(item => (
              <button
                key={item.id}
                data-testid={`button-furniture-${item.id}`}
                onClick={() => {
                  if (player.gold >= item.cost) {
                    setSelectedFurniture(item);
                    setMode("place");
                    setCatalogOpen(false);
                  }
                }}
                disabled={player.gold < item.cost}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left
                  ${player.gold >= item.cost 
                    ? "hover:bg-white/5 cursor-pointer" 
                    : "opacity-40 cursor-not-allowed"
                  }
                `}
                style={{ backgroundColor: item.color + "10" }}
              >
                <div 
                  className="w-10 h-10 rounded flex items-center justify-center text-xl"
                  style={{ 
                    backgroundColor: item.color + "30",
                    border: `1px solid ${RARITY_COLORS[item.rarity]}40`
                  }}
                >
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white/80">{item.name}</span>
                    <span 
                      className="text-[8px] uppercase px-1 rounded"
                      style={{ 
                        color: RARITY_COLORS[item.rarity],
                        backgroundColor: RARITY_COLORS[item.rarity] + "20"
                      }}
                    >
                      {item.rarity}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/60">
                    {item.width}x{item.height} tiles
                  </div>
                </div>
                <div className="text-xs text-yellow-400/80 font-mono">
                  {item.cost}g
                </div>
              </button>
            ))}
          </div>

          <Button 
            variant="outline"
            className="w-full mt-2"
            onClick={() => setCatalogOpen(false)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={styleOpen} onOpenChange={setStyleOpen}>
        <DialogContent className="bg-black/95 border-primary/20 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-primary/80 font-display text-sm flex items-center gap-2">
              <Paintbrush size={16} />
              ROOM STYLE
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <div className="text-[10px] text-muted-foreground/60 uppercase mb-2">Floor Style</div>
              <div className="flex gap-2 flex-wrap">
                {FLOOR_STYLES.map(style => (
                  <button
                    key={style.id}
                    data-testid={`button-floor-${style.id}`}
                    onClick={() => updateRoom({ floorStyle: style.id })}
                    className={`w-10 h-10 rounded transition-all ${
                      activeRoom.floorStyle === style.id 
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-black" 
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: style.color }}
                    title={style.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground/60 uppercase mb-2">Wall Style</div>
              <div className="flex gap-2 flex-wrap">
                {WALL_STYLES.map(style => (
                  <button
                    key={style.id}
                    data-testid={`button-wall-${style.id}`}
                    onClick={() => updateRoom({ wallStyle: style.id })}
                    className={`w-10 h-10 rounded transition-all ${
                      activeRoom.wallStyle === style.id 
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-black" 
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: style.color }}
                    title={style.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <Button 
            variant="outline"
            className="w-full"
            onClick={() => setStyleOpen(false)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </SystemLayout>
  );
}

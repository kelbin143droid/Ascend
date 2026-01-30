import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Text, Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

interface SurvivalStats {
  health: number;
  hunger: number;
  stamina: number;
}

interface ResourceNode {
  id: string;
  type: "tree" | "rock";
  position: [number, number, number];
  health: number;
}

interface EnemyData {
  id: string;
  position: [number, number, number];
  health: number;
}

interface InventoryState {
  wood: number;
  stone: number;
  food: number;
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#3b6a2f" />
    </mesh>
  );
}

function Tree({ position, health, onHarvest }: { position: [number, number, number]; health: number; onHarvest: () => void }) {
  const opacity = health / 100;
  
  return (
    <group position={position} onClick={onHarvest}>
      <Cylinder args={[0.3, 0.4, 2, 8]} position={[0, 1, 0]} castShadow>
        <meshStandardMaterial color="#5d4037" transparent opacity={opacity} />
      </Cylinder>
      <Sphere args={[1.2, 8, 8]} position={[0, 2.5, 0]} castShadow>
        <meshStandardMaterial color="#2e7d32" transparent opacity={opacity} />
      </Sphere>
    </group>
  );
}

function Rock({ position, health, onHarvest }: { position: [number, number, number]; health: number; onHarvest: () => void }) {
  const opacity = health / 100;
  
  return (
    <group position={position} onClick={onHarvest}>
      <Box args={[1.5, 1, 1.2]} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#757575" transparent opacity={opacity} />
      </Box>
      <Box args={[0.8, 0.6, 0.7]} position={[0.5, 0.3, 0.3]} castShadow>
        <meshStandardMaterial color="#616161" transparent opacity={opacity} />
      </Box>
    </group>
  );
}

function Enemy({ position, health, playerPos }: { position: [number, number, number]; health: number; playerPos: THREE.Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (ref.current && health > 0) {
      const dir = new THREE.Vector3(playerPos.x - ref.current.position.x, 0, playerPos.z - ref.current.position.z);
      if (dir.length() > 3) {
        dir.normalize();
        ref.current.position.x += dir.x * delta * 1.5;
        ref.current.position.z += dir.z * delta * 1.5;
      }
    }
  });
  
  if (health <= 0) return null;
  
  return (
    <group ref={ref} position={position}>
      <Cylinder args={[0.4, 0.5, 1.8, 8]} position={[0, 0.9, 0]} castShadow>
        <meshStandardMaterial color="#8b0000" />
      </Cylinder>
      <Sphere args={[0.35, 8, 8]} position={[0, 2, 0]} castShadow>
        <meshStandardMaterial color="#a52a2a" />
      </Sphere>
      <pointLight position={[0, 1.5, 0]} color="#ff0000" intensity={0.5} distance={5} />
    </group>
  );
}

function Campfire({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Cylinder args={[0.6, 0.8, 0.3, 12]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#5d4037" />
      </Cylinder>
      <pointLight position={[0, 0.5, 0]} color="#ff6600" intensity={2} distance={8} />
      <Sphere args={[0.2, 8, 8]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
      </Sphere>
    </group>
  );
}

interface PlayerProps {
  controlRef: React.MutableRefObject<{ x: number; y: number }>;
  onPositionChange: (pos: THREE.Vector3) => void;
  stats: SurvivalStats;
  setStats: React.Dispatch<React.SetStateAction<SurvivalStats>>;
}

function Player({ controlRef, onPositionChange, stats, setStats }: PlayerProps) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  useFrame((_, delta) => {
    if (!ref.current) return;
    
    const move = controlRef.current;
    const speed = 6;
    
    if (Math.abs(move.x) > 0.1 || Math.abs(move.y) > 0.1) {
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();
      
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), camDir).normalize();
      
      ref.current.position.x += right.x * move.x * speed * delta;
      ref.current.position.z += right.z * move.x * speed * delta;
      ref.current.position.x -= camDir.x * move.y * speed * delta;
      ref.current.position.z -= camDir.z * move.y * speed * delta;
      
      const targetYaw = Math.atan2(-move.x, move.y);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetYaw + camera.rotation.y, 10 * delta);
      
      setStats(s => ({ ...s, stamina: Math.max(0, s.stamina - delta * 3) }));
    } else {
      setStats(s => ({ ...s, stamina: Math.min(100, s.stamina + delta * 8) }));
    }
    
    const desiredCamPos = ref.current.position.clone().add(new THREE.Vector3(0, 8, 12));
    camera.position.lerp(desiredCamPos, 5 * delta);
    camera.lookAt(ref.current.position.clone().add(new THREE.Vector3(0, 1, 0)));
    
    onPositionChange(ref.current.position.clone());
  });
  
  return (
    <group ref={ref} position={[0, 0, 0]}>
      <Cylinder args={[0.3, 0.4, 1.6, 8]} position={[0, 0.8, 0]} castShadow>
        <meshStandardMaterial color="#00bcd4" />
      </Cylinder>
      <Sphere args={[0.3, 12, 12]} position={[0, 1.8, 0]} castShadow>
        <meshStandardMaterial color="#ffccbc" />
      </Sphere>
    </group>
  );
}

function GameScene({ 
  controlRef, 
  resources, 
  enemies,
  campfires,
  onHarvestResource,
  stats,
  setStats,
  isNight
}: {
  controlRef: React.MutableRefObject<{ x: number; y: number }>;
  resources: ResourceNode[];
  enemies: EnemyData[];
  campfires: [number, number, number][];
  onHarvestResource: (id: string) => void;
  stats: SurvivalStats;
  setStats: React.Dispatch<React.SetStateAction<SurvivalStats>>;
  isNight: boolean;
}) {
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3());
  
  return (
    <>
      <ambientLight intensity={isNight ? 0.15 : 0.4} color={isNight ? "#4466aa" : "#ffffff"} />
      <directionalLight 
        position={isNight ? [5, 20, 5] : [20, 30, 10]} 
        intensity={isNight ? 0.3 : 1} 
        color={isNight ? "#8899cc" : "#fff8e1"}
        castShadow 
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <hemisphereLight args={[isNight ? "#1a2a4a" : "#87ceeb", isNight ? "#0a1020" : "#3b6a2f", isNight ? 0.2 : 0.5]} />
      <fog attach="fog" args={[isNight ? "#0a0f2a" : "#87ceeb", isNight ? 30 : 50, isNight ? 100 : 150]} />
      
      <Ground />
      
      <Player 
        controlRef={controlRef} 
        onPositionChange={setPlayerPos}
        stats={stats}
        setStats={setStats}
      />
      
      {resources.map(r => r.type === "tree" ? (
        <Tree 
          key={r.id} 
          position={r.position} 
          health={r.health}
          onHarvest={() => onHarvestResource(r.id)}
        />
      ) : (
        <Rock 
          key={r.id} 
          position={r.position} 
          health={r.health}
          onHarvest={() => onHarvestResource(r.id)}
        />
      ))}
      
      {enemies.map(e => (
        <Enemy key={e.id} position={e.position} health={e.health} playerPos={playerPos} />
      ))}
      
      {campfires.map((pos, i) => (
        <Campfire key={i} position={pos} />
      ))}
    </>
  );
}

function Joystick({ 
  id, 
  position, 
  onMove 
}: { 
  id: string; 
  position: "left" | "right"; 
  onMove: (x: number, y: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [activeTouch, setActiveTouch] = useState<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setActiveTouch(e.changedTouches[0].identifier);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (activeTouch === null || !containerRef.current || !stickRef.current) return;
    
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouch) {
        const touch = e.touches[i];
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        
        const maxDist = rect.width / 3;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }
        
        stickRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        onMove(dx / maxDist, dy / maxDist);
        break;
      }
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setActiveTouch(null);
    if (stickRef.current) {
      stickRef.current.style.transform = "translate(-50%, -50%)";
    }
    onMove(0, 0);
  };
  
  return (
    <div
      ref={containerRef}
      data-testid={`joystick-${id}`}
      className={`absolute w-32 h-32 rounded-full bg-white/10 touch-none ${
        position === "left" ? "left-4 bottom-20" : "right-4 bottom-20"
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={stickRef}
        className="absolute w-14 h-14 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 border-2 border-white/40"
      />
    </div>
  );
}

export default function SurvivalPage() {
  const moveRef = useRef({ x: 0, y: 0 });
  const [stats, setStats] = useState<SurvivalStats>({ health: 100, hunger: 100, stamina: 100 });
  const [inventory, setInventory] = useState<InventoryState>({ wood: 0, stone: 0, food: 0 });
  const [resources, setResources] = useState<ResourceNode[]>([]);
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const [campfires, setCampfires] = useState<[number, number, number][]>([]);
  const [day, setDay] = useState(1);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const initialResources: ResourceNode[] = [];
    for (let i = 0; i < 30; i++) {
      initialResources.push({
        id: `resource_${i}`,
        type: Math.random() > 0.5 ? "tree" : "rock",
        position: [(Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100],
        health: 100
      });
    }
    setResources(initialResources);

    const initialEnemies: EnemyData[] = [];
    for (let i = 0; i < 3; i++) {
      initialEnemies.push({
        id: `enemy_${i}`,
        position: [(Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60],
        health: 100
      });
    }
    setEnemies(initialEnemies);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(s => ({
        ...s,
        hunger: Math.max(0, s.hunger - 0.5),
        health: s.hunger <= 0 ? Math.max(0, s.health - 1) : s.health
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dayNightCycle = setInterval(() => {
      setIsNight(n => !n);
      if (!isNight) {
        setDay(d => d + 1);
      }
    }, 60000);
    return () => clearInterval(dayNightCycle);
  }, [isNight]);

  const handleHarvestResource = useCallback((id: string) => {
    setResources(prev => prev.map(r => {
      if (r.id === id && r.health > 0) {
        const newHealth = r.health - 25;
        if (newHealth <= 0) {
          setInventory(inv => ({
            ...inv,
            [r.type === "tree" ? "wood" : "stone"]: inv[r.type === "tree" ? "wood" : "stone"] + 3
          }));
        }
        return { ...r, health: Math.max(0, newHealth) };
      }
      return r;
    }));
  }, []);

  const handleCraftCampfire = () => {
    if (inventory.wood >= 5) {
      setInventory(inv => ({ ...inv, wood: inv.wood - 5 }));
      setCampfires(prev => [...prev, [0, 0, -3]]);
      setStats(s => ({ ...s, hunger: Math.min(100, s.hunger + 20), health: Math.min(100, s.health + 10) }));
    }
  };

  const handleMoveLeft = (x: number, y: number) => {
    moveRef.current = { x, y };
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden touch-none">
      <Canvas shadows camera={{ position: [0, 10, 15], fov: 60 }}>
        <Suspense fallback={null}>
          <color attach="background" args={[isNight ? "#0a0f2a" : "#87ceeb"]} />
          <GameScene
            controlRef={moveRef}
            resources={resources}
            enemies={enemies}
            campfires={campfires}
            onHarvestResource={handleHarvestResource}
            stats={stats}
            setStats={setStats}
            isNight={isNight}
          />
        </Suspense>
      </Canvas>

      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        <div className="bg-black/50 rounded-lg p-3 inline-block">
          <div className="text-cyan-400 font-mono text-sm mb-2">Day {day} {isNight ? "🌙" : "☀️"}</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-red-400">HP</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${stats.health}%` }} />
              </div>
              <span className="text-white/60 font-mono">{Math.round(stats.health)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-400">🍖</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${stats.hunger}%` }} />
              </div>
              <span className="text-white/60 font-mono">{Math.round(stats.hunger)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">⚡</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${stats.stamina}%` }} />
              </div>
              <span className="text-white/60 font-mono">{Math.round(stats.stamina)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-3">
        <div className="text-xs text-white/80 font-mono space-y-1">
          <div>🪵 Wood: {inventory.wood}</div>
          <div>🪨 Stone: {inventory.stone}</div>
          <div>🍖 Food: {inventory.food}</div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <button
          data-testid="button-craft-campfire"
          onClick={handleCraftCampfire}
          disabled={inventory.wood < 5}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            inventory.wood >= 5 
              ? "bg-orange-600 text-white hover:bg-orange-500" 
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          🔥 Craft Fire (5 Wood)
        </button>
      </div>

      <Joystick id="left" position="left" onMove={handleMoveLeft} />

      <a
        href="/"
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded text-cyan-400 text-xs hover:bg-black/80"
      >
        ← Back to Game
      </a>
    </div>
  );
}

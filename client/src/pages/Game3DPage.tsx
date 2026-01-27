import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stars, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Sword, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import groundTexture from '@assets/generated_images/texture_for_digital_floor_grid_in_3d_space.png';

function Ground() {
  const texture = useTexture(groundTexture);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial 
        map={texture} 
        roughness={0.1} 
        metalness={0.8}
        emissive={new THREE.Color("#001133")}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function WarriorCharacter({ isAttacking, isUsingSkill, joystick }: { isAttacking: boolean, isUsingSkill: boolean, joystick: { x: number, y: number } }) {
  const groupRef = useRef<THREE.Group>(null);
  const swordArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const skillAuraRef = useRef<THREE.Mesh>(null);
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const attackProgress = useRef(0);
  const skillProgress = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = true;
      if (key === 's' || key === 'arrowdown') keys.current.s = true;
      if (key === 'a' || key === 'arrowleft') keys.current.a = true;
      if (key === 'd' || key === 'arrowright') keys.current.d = true;
      if (key === 'shift') keys.current.shift = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = false;
      if (key === 's' || key === 'arrowdown') keys.current.s = false;
      if (key === 'a' || key === 'arrowleft') keys.current.a = false;
      if (key === 'd' || key === 'arrowright') keys.current.d = false;
      if (key === 'shift') keys.current.shift = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const { w, a, s, d, shift } = keys.current;
    const baseSpeed = 0.15;
    const speed = shift ? baseSpeed * 2.5 : baseSpeed;
    
    let moveX = 0;
    let moveZ = 0;

    if (w) moveZ -= 1;
    if (s) moveZ += 1;
    if (a) moveX -= 1;
    if (d) moveX += 1;

    moveX += joystick.x;
    moveZ -= joystick.y;

    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    const isMoving = length > 0.1;
    
    if (isMoving) {
      const normX = moveX / length;
      const normZ = moveZ / length;
      const finalSpeed = speed * Math.min(1, length);
      
      groupRef.current.position.x += normX * finalSpeed;
      groupRef.current.position.z += normZ * finalSpeed;

      const angle = Math.atan2(normX, normZ);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.2);
    }

    // Camera Follow
    const camOffset = new THREE.Vector3(0, 5, 8);
    state.camera.position.lerp(
      new THREE.Vector3(
        groupRef.current.position.x + camOffset.x,
        groupRef.current.position.y + camOffset.y,
        groupRef.current.position.z + camOffset.z
      ),
      0.1
    );
    state.camera.lookAt(groupRef.current.position);

    // Walking animation for legs
    if (leftLegRef.current && rightLegRef.current) {
      if (isMoving && !isAttacking) {
        const walkCycle = Math.sin(state.clock.elapsedTime * 10) * 0.5;
        leftLegRef.current.rotation.x = walkCycle;
        rightLegRef.current.rotation.x = -walkCycle;
      } else {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.2);
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.2);
      }
    }

    // Sword swing animation
    if (swordArmRef.current) {
      if (isAttacking) {
        attackProgress.current = Math.min(attackProgress.current + delta * 8, 1);
        const swingAngle = Math.sin(attackProgress.current * Math.PI) * 2;
        swordArmRef.current.rotation.x = -swingAngle;
        swordArmRef.current.rotation.z = Math.sin(attackProgress.current * Math.PI) * 0.3;
      } else {
        attackProgress.current = 0;
        swordArmRef.current.rotation.x = THREE.MathUtils.lerp(swordArmRef.current.rotation.x, 0, 0.2);
        swordArmRef.current.rotation.z = THREE.MathUtils.lerp(swordArmRef.current.rotation.z, 0, 0.2);
      }
    }

    // Skill aura effect
    if (skillAuraRef.current) {
      if (isUsingSkill) {
        skillProgress.current = Math.min(skillProgress.current + delta * 3, 1);
        const scale = skillProgress.current * 3;
        skillAuraRef.current.scale.set(scale, scale, scale);
        (skillAuraRef.current.material as THREE.MeshStandardMaterial).opacity = 1 - skillProgress.current * 0.7;
      } else {
        skillProgress.current = 0;
        skillAuraRef.current.scale.set(0, 0, 0);
      }
    }

    // Idle bounce
    if (!isMoving && !isAttacking) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 2]}>
      {/* Skill Aura */}
      <mesh ref={skillAuraRef} position={[0, 0.5, 0]} scale={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} transparent opacity={0.5} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.35]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Chest Plate */}
      <mesh position={[0, 0.75, 0.1]} castShadow>
        <boxGeometry args={[0.55, 0.6, 0.15]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Belt */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.65, 0.15, 0.38]} />
        <meshStandardMaterial color="#8b4513" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.35, 0.4, 0.35]} />
        <meshStandardMaterial color="#e8d5c4" roughness={0.6} />
      </mesh>
      
      {/* Helmet */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
        <meshStandardMaterial color="#555566" roughness={0.3} metalness={0.9} />
      </mesh>
      
      {/* Helmet Visor */}
      <mesh position={[0, 1.35, 0.18]}>
        <boxGeometry args={[0.25, 0.1, 0.05]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>

      {/* Left Arm (Shield Arm) */}
      <group position={[-0.45, 0.7, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.5, 0.2]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Shield */}
        <mesh position={[-0.15, -0.1, 0.15]} castShadow>
          <boxGeometry args={[0.1, 0.5, 0.4]} />
          <meshStandardMaterial color="#555577" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[-0.2, -0.1, 0.15]}>
          <boxGeometry args={[0.02, 0.3, 0.25]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Right Arm (Sword Arm) */}
      <group ref={swordArmRef} position={[0.45, 0.7, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.5, 0.2]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.6} />
        </mesh>
        
        {/* Sword */}
        <group position={[0.1, -0.4, 0.3]} rotation={[0.3, 0, 0]}>
          {/* Handle */}
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
            <meshStandardMaterial color="#4a3020" roughness={0.8} />
          </mesh>
          {/* Guard */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.25, 0.05, 0.08]} />
            <meshStandardMaterial color="#666688" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Blade */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.08, 0.9, 0.03]} />
            <meshStandardMaterial color="#aaaacc" metalness={1} roughness={0.1} />
          </mesh>
          {/* Blade Edge Glow */}
          <mesh position={[0.05, 0.7, 0]}>
            <boxGeometry args={[0.02, 0.9, 0.04]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} />
          </mesh>
        </group>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.15, 0, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.22, 0.5, 0.22]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.4, 0.05]} castShadow>
          <boxGeometry args={[0.24, 0.2, 0.35]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.5} metalness={0.7} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.15, 0, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.22, 0.5, 0.22]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.4, 0.05]} castShadow>
          <boxGeometry args={[0.24, 0.2, 0.35]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.5} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function Enemy({ hp, maxHp, isHit }: { hp: number, maxHp: number, isHit: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + 2) * 0.2;
      meshRef.current.rotation.y += 0.01;
      
      if (isHit) {
        (meshRef.current.material as THREE.MeshStandardMaterial).color.setHex(0xff0000);
      } else {
        (meshRef.current.material as THREE.MeshStandardMaterial).color.lerp(new THREE.Color("#220033"), 0.1);
      }
    }
  });

  return (
    <group position={[0, 0, -3]}>
      <Float speed={0} rotationIntensity={0} floatIntensity={0}>
        <group position={[0, 2.5, 0]}>
          <mesh>
            <planeGeometry args={[2, 0.2]} />
            <meshBasicMaterial color="#330000" />
          </mesh>
          <mesh position={[-(1 - hp/maxHp), 0, 0.01]} scale={[hp/maxHp, 1, 1]}>
            <planeGeometry args={[2, 0.15]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        </group>
      </Float>

      <mesh ref={meshRef} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#220033" roughness={0.8} />
      </mesh>
      
      <Stars radius={2} depth={1} count={200} factor={2} saturation={0} fade speed={3} />
    </group>
  );
}

export default function Game3DPage() {
  const { player, isLoading, modifyHp, modifyMp, gainExp } = useGame();
  
  const [enemyHp, setEnemyHp] = useState(100);
  const maxEnemyHp = 100;
  const [isAttacking, setIsAttacking] = useState(false);
  const [isUsingSkill, setIsUsingSkill] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>(["Encounter started!"]);
  const [showHUD, setShowHUD] = useState(true);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });

  const unlockedSkill = player?.skills?.find(s => s.unlocked);

  const handleJoystickMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) / (rect.width / 2);
    const dy = (e.clientY - centerY) / (rect.height / 2);
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      setJoystick({ x: dx / dist, y: -dy / dist });
    } else {
      setJoystick({ x: dx, y: -dy });
    }
  };

  const handleJoystickEnd = () => {
    setJoystick({ x: 0, y: 0 });
  };

  const handleAttack = () => {
    if (isAttacking || isUsingSkill) return;
    setIsAttacking(true);
    
    setTimeout(() => {
      setIsHit(true);
      const baseDmg = player?.stats?.strength ? player.stats.strength * 2 : 20;
      const dmg = Math.floor(Math.random() * 10) + baseDmg;
      const newHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newHp);
      setCombatLog(prev => [`Sword Strike: ${dmg} DMG!`, ...prev].slice(0, 4));
      
      if (newHp === 0) {
        setCombatLog(prev => ["Enemy Defeated! +50 EXP", ...prev]);
        gainExp(50);
        setTimeout(() => setEnemyHp(100), 2000);
      }

      setTimeout(() => {
        setIsHit(false);
        setIsAttacking(false);
      }, 300);
    }, 200);
  };

  const handleSkill = () => {
    if (!player || !unlockedSkill || isAttacking || isUsingSkill) return;
    if (player.mp < unlockedSkill.mpCost) {
      setCombatLog(prev => [`Not enough MP for ${unlockedSkill.name}!`, ...prev].slice(0, 4));
      return;
    }
    
    setIsUsingSkill(true);
    modifyMp(-unlockedSkill.mpCost);
    
    setTimeout(() => {
      setIsHit(true);
      const baseDmg = player?.stats?.strength ? player.stats.strength * 3 : 30;
      const dmg = Math.floor(Math.random() * 20) + baseDmg + 15;
      const newHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newHp);
      setCombatLog(prev => [`${unlockedSkill.name}: ${dmg} DMG!`, ...prev].slice(0, 4));
      
      if (newHp === 0) {
        setCombatLog(prev => ["Enemy Defeated! +50 EXP", ...prev]);
        gainExp(50);
        setTimeout(() => setEnemyHp(100), 2000);
      }

      setTimeout(() => {
        setIsHit(false);
        setIsUsingSkill(false);
      }, 500);
    }, 400);
  };

  if (isLoading || !player) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-primary animate-pulse font-display text-xl tracking-widest">LOADING SYSTEM...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black relative font-display overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={50} />
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={1} castShadow color="#00ffff" />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ff00ff" />
          
          <WarriorCharacter isAttacking={isAttacking} isUsingSkill={isUsingSkill} joystick={joystick} />
          {enemyHp > 0 && <Enemy hp={enemyHp} maxHp={maxEnemyHp} isHit={isHit} />}
          
          <Ground />
          <Environment preset="city" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
        <div className="absolute top-4 left-4 pointer-events-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowHUD(!showHUD)}
            className="bg-black/40 border-primary/30 text-[10px] tracking-widest text-primary hover:bg-primary/20"
          >
            {showHUD ? "HIDE INTERFACE" : "SHOW INTERFACE"}
          </Button>
        </div>

        {showHUD && (
          <div className="absolute top-4 right-4 bg-black/60 p-2 rounded text-[10px] text-primary/70 font-mono text-right">
            WASD / JOYSTICK TO MOVE<br/>SHIFT TO DASH
          </div>
        )}

        {showHUD && (
          <div className="flex justify-between items-start mt-10">
            <div className="bg-black/60 backdrop-blur-md p-4 rounded-sm border border-primary/30 w-64">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-primary font-bold text-lg">{player.name || "HUNTER"}</h2>
                <span className="text-xs text-muted-foreground">Lv. {player.level}</span>
              </div>
              <div className="space-y-1 mb-2">
                <div className="flex justify-between text-[10px] text-red-400 font-bold">
                  <span>HP</span>
                  <span>{player.hp}/{player.maxHp}</span>
                </div>
                <div className="h-1.5 w-full bg-red-900/30 rounded-full overflow-hidden">
                  <div style={{ width: `${(player.hp/player.maxHp)*100}%` }} className="h-full bg-red-500" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-blue-400 font-bold">
                  <span>MP</span>
                  <span>{player.mp}/{player.maxMp}</span>
                </div>
                <div className="h-1.5 w-full bg-blue-900/30 rounded-full overflow-hidden">
                  <div style={{ width: `${(player.mp/player.maxMp)*100}%` }} className="h-full bg-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="w-32 h-32 rounded-full border-2 border-primary/30 bg-black/80 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(0,255,255,0.4)_0%,transparent_70%)]" />
              <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
              <span className="absolute bottom-2 text-[8px] text-primary/60">RADAR ACTIVE</span>
            </div>
          </div>
        )}

        {showHUD && (
          <div className="absolute top-1/2 left-4 -translate-y-1/2 w-64 space-y-2">
            {combatLog.map((log, i) => (
              <div key={i} className="text-sm font-mono text-primary/80 bg-black/40 p-1 px-2 rounded animate-in slide-in-from-left fade-in">
                {`> ${log}`}
              </div>
            ))}
          </div>
        )}

        <div className={cn("flex items-end justify-between w-full", !showHUD && "absolute bottom-6 left-6 right-6")}>
          <div 
            className="pointer-events-auto w-32 h-32 rounded-full bg-primary/5 border-2 border-primary/20 relative touch-none"
            onPointerMove={handleJoystickMove}
            onPointerUp={handleJoystickEnd}
            onPointerLeave={handleJoystickEnd}
          >
            <div 
              className="absolute w-12 h-12 bg-primary/40 rounded-full border border-primary/60 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-transform duration-75"
              style={{ 
                left: `calc(50% + ${joystick.x * 40}px)`, 
                top: `calc(50% - ${joystick.y * 40}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>

          <div className="pointer-events-auto flex gap-4 pb-2">
            <Button 
              onClick={handleAttack}
              disabled={isAttacking || isUsingSkill}
              className="w-24 h-24 rounded-full border-2 border-primary/50 bg-black/60 hover:bg-primary/20 flex flex-col items-center justify-center gap-2 group transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Sword size={32} className={cn("text-primary", isAttacking && "animate-spin")} />
              <span className="text-[10px] font-bold tracking-widest text-primary">ATTACK</span>
            </Button>
            
            <Button 
              onClick={handleSkill}
              disabled={isAttacking || isUsingSkill || !unlockedSkill || (player.mp < (unlockedSkill?.mpCost || 0))}
              className="w-20 h-20 rounded-full border-2 border-purple-500/50 bg-black/60 hover:bg-purple-500/20 flex flex-col items-center justify-center gap-1 group transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Zap size={24} className={cn("text-purple-400", isUsingSkill && "animate-pulse")} />
              <span className="text-[8px] font-bold tracking-widest text-purple-400 text-center leading-tight">
                {unlockedSkill?.name?.split(' ')[0] || "SKILL"}
              </span>
              {unlockedSkill && (
                <span className="text-[8px] text-purple-400/60">{unlockedSkill.mpCost} MP</span>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] opacity-20" />
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}

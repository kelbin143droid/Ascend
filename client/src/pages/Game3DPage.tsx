import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, Float, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Sword, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import groundTexture from '@assets/generated_images/texture_for_digital_floor_grid_in_3d_space.png';

// --- 3D Components ---

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

function PlayerCharacter({ isAttacking, joystick }: { isAttacking: boolean, joystick: { x: number, y: number } }) {
  const meshRef = useRef<THREE.Group>(null);
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const trailRef = useRef<THREE.Mesh[]>([]);

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
  
  useFrame((state) => {
    if (meshRef.current) {
      const { w, a, s, d, shift } = keys.current;
      const baseSpeed = 0.15;
      const speed = shift ? baseSpeed * 2.5 : baseSpeed;
      
      let moveX = 0;
      let moveZ = 0;

      // Keyboard movement
      if (w) moveZ -= 1;
      if (s) moveZ += 1;
      if (a) moveX -= 1;
      if (d) moveX += 1;

      // Joystick movement (additive)
      moveX += joystick.x;
      moveZ -= joystick.y;

      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (length > 0) {
        const normX = moveX / length;
        const normZ = moveZ / length;
        const finalSpeed = speed * Math.min(1, length);
        
        meshRef.current.position.x += normX * finalSpeed;
        meshRef.current.position.z += normZ * finalSpeed;

        // Rotation
        const angle = Math.atan2(normX, normZ);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, angle, 0.2);
      }

      // Camera Follow
      const camOffset = new THREE.Vector3(0, 5, 8);
      state.camera.position.lerp(
          new THREE.Vector3(
              meshRef.current.position.x + camOffset.x,
              meshRef.current.position.y + camOffset.y,
              meshRef.current.position.z + camOffset.z
          ),
          0.1
      );
      state.camera.lookAt(meshRef.current.position);

      // Dash Trail Effect
      if ((shift || length > 1) && (moveX !== 0 || moveZ !== 0)) {
          meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1.5, 0.2);
      } else {
          meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1, 0.2);
      }

      // Idle animation
      if (!isAttacking) {
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      } else {
         const attackTime = (Date.now() % 500) / 500;
         meshRef.current.position.z += Math.sin(attackTime * Math.PI) * 0.1;
      }
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 2]}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </mesh>
      
      {/* Glowing Eyes */}
      <mesh position={[0.1, 1.45, 0.2]}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.1, 1.45, 0.2]}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>

      {/* Weapon - Dagger */}
      <group position={[0.6, 0.5, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
         <mesh castShadow>
            <boxGeometry args={[0.1, 0.8, 0.05]} />
            <meshStandardMaterial color="#333" metalness={1} roughness={0.2} />
         </mesh>
         {/* Glow Blade Edge */}
         <mesh position={[0.05, 0, 0]}>
             <boxGeometry args={[0.02, 0.8, 0.06]} />
             <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} />
         </mesh>
      </group>
    </group>
  );
}

function Enemy({ hp, maxHp, isHit }: { hp: number, maxHp: number, isHit: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
        // Floating idle
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
       {/* Health Bar */}
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

       {/* Monster Body */}
       <mesh ref={meshRef} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#220033" roughness={0.8} />
       </mesh>
       
       {/* Shadow Aura Particles */}
       <Stars radius={2} depth={1} count={200} factor={2} saturation={0} fade speed={3} />
    </group>
  );
}

// --- Main Page Component ---

export default function Game3DPage() {
  const { player, modifyHp, gainExp } = useGame();
  
  const [enemyHp, setEnemyHp] = useState(100);
  const maxEnemyHp = 100;
  const [isAttacking, setIsAttacking] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>(["Encounter started!"]);
  const [showHUD, setShowHUD] = useState(true);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });

  const handleJoystickMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) / (rect.width / 2);
    const dy = (e.clientY - centerY) / (rect.height / 2);
    
    // Clamp to 1
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
     if (isAttacking) return;
     setIsAttacking(true);
     
     // Animation timing
     setTimeout(() => {
        setIsHit(true);
        const dmg = Math.floor(Math.random() * 20) + 10;
        const newHp = Math.max(0, enemyHp - dmg);
        setEnemyHp(newHp);
        setCombatLog(prev => [`Dealt ${dmg} DMG!`, ...prev].slice(0, 4));
        
        if (newHp === 0) {
            setCombatLog(prev => ["Enemy Defeated! +50 EXP", ...prev]);
            gainExp(50);
            setTimeout(() => setEnemyHp(100), 2000); // Respawn
        }

        setTimeout(() => {
            setIsHit(false);
            setIsAttacking(false);
        }, 300);
     }, 200);
  };

  return (
    <div className="w-full h-screen bg-black relative font-display overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={50} />
          <ambientLight intensity={0.2} />
          <pointLight position={[5, 5, 5]} intensity={1} castShadow color="#00ffff" />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ff00ff" />
          
          <PlayerCharacter isAttacking={isAttacking} joystick={joystick} />
          {enemyHp > 0 && <Enemy hp={enemyHp} maxHp={maxEnemyHp} isHit={isHit} />}
          
          <Ground />
          <Environment preset="city" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </div>

      {/* HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
        
        {/* Toggle HUD Button */}
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

        {/* Controls Hint */}
        {showHUD && (
            <div className="absolute top-4 right-4 bg-black/60 p-2 rounded text-[10px] text-primary/70 font-mono text-right">
                WASD / JOYSTICK TO MOVE<br/>SHIFT TO DASH
            </div>
        )}

        {/* Top Bar */}
        {showHUD && (
            <div className="flex justify-between items-start mt-10">
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-sm border border-primary/30 w-64">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-primary font-bold text-lg">{player.name}</h2>
                        <span className="text-xs text-muted-foreground">Lv. {player.level}</span>
                    </div>
                    {/* HP Bar */}
                    <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-[10px] text-red-400 font-bold">
                            <span>HP</span>
                            <span>{player.hp}/{player.maxHp}</span>
                        </div>
                        <div className="h-1.5 w-full bg-red-900/30 rounded-full overflow-hidden">
                            <div style={{ width: `${(player.hp/player.maxHp)*100}%` }} className="h-full bg-red-500" />
                        </div>
                    </div>
                    {/* MP Bar */}
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
                
                {/* Minimap Placeholder */}
                <div className="w-32 h-32 rounded-full border-2 border-primary/30 bg-black/80 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(0,255,255,0.4)_0%,transparent_70%)]" />
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                    <span className="absolute bottom-2 text-[8px] text-primary/60">RADAR ACTIVE</span>
                </div>
            </div>
        )}

        {/* Combat Log */}
        {showHUD && (
            <div className="absolute top-1/2 left-4 -translate-y-1/2 w-64 space-y-2">
                {combatLog.map((log, i) => (
                    <div key={i} className="text-sm font-mono text-primary/80 bg-black/40 p-1 px-2 rounded animate-in slide-in-from-left fade-in">
                        {`> ${log}`}
                    </div>
                ))}
            </div>
        )}

        {/* Bottom HUD */}
        <div className="flex items-end justify-between w-full">
            {/* Virtual Joystick */}
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

            {/* Action Bar */}
            <div className="pointer-events-auto flex gap-4 pb-2">
                <Button 
                    onClick={handleAttack}
                    className="w-24 h-24 rounded-full border-2 border-primary/50 bg-black/60 hover:bg-primary/20 flex flex-col items-center justify-center gap-2 group transition-all hover:scale-105 active:scale-95"
                >
                    <Sword size={32} className="text-primary group-hover:animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-primary">ATTACK</span>
                </Button>
                
                <Button 
                    className="w-20 h-20 rounded-full border-2 border-purple-500/50 bg-black/60 hover:bg-purple-500/20 flex flex-col items-center justify-center gap-2 group transition-all hover:scale-105 active:scale-95"
                >
                    <Zap size={24} className="text-purple-400 group-hover:animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-purple-400">SKILL</span>
                </Button>
            </div>
        </div>
      </div>
      
      {/* Scanlines Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] opacity-20" />
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}

import React, { useRef, useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Float, useGLTF, Html } from '@react-three/drei';
import { Suspense } from 'react';
import { EffectComposer, Bloom, SSAO, ToneMapping, Vignette, BrightnessContrast, HueSaturation, SMAA } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, EdgeDetectionMode } from 'postprocessing';
import * as THREE from 'three';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Sword, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const ATTACK_RANGE = 3;
const MONSTER_ATTACK_RANGE = 2;
const MONSTER_SPEED = 0.03;
const MONSTER_MAX_HP = 300;

const PLAYER_MODEL_PATH = '/assets/models/player.glb';
const ENEMY_MODEL_PATH = '/assets/models/enemy.glb';

function MissingModelWarning({ modelName }: { modelName: string }) {
  return (
    <Html center distanceFactor={8}>
      <div className="bg-red-900/90 border-2 border-red-500 px-4 py-2 rounded-lg text-center whitespace-nowrap">
        <p className="text-red-300 text-sm font-bold">Missing model:</p>
        <p className="text-white text-xs">{modelName}</p>
      </div>
    </Html>
  );
}

function FallbackPlaceholder({ color, scale = 1 }: { color: string, scale?: number }) {
  return (
    <mesh castShadow receiveShadow scale={scale}>
      <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} wireframe />
    </mesh>
  );
}

class ModelErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode, fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Model loading error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function PlayerModelFallback() {
  return (
    <group>
      <FallbackPlaceholder color="#00ffff" />
      <MissingModelWarning modelName="player.glb" />
    </group>
  );
}

function EnemyModelFallback() {
  return (
    <group>
      <FallbackPlaceholder color="#8b0000" scale={1.5} />
      <MissingModelWarning modelName="enemy.glb" />
    </group>
  );
}

function LoadedPlayerModel({ isMoving, isSprinting }: { isMoving: boolean, isSprinting: boolean }) {
  const { scene, animations } = useGLTF(PLAYER_MODEL_PATH);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material && !(mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const oldMat = mesh.material as THREE.MeshBasicMaterial;
          mesh.material = new THREE.MeshStandardMaterial({
            color: oldMat.color || new THREE.Color("#5a5a6a"),
            roughness: 0.5,
            metalness: 0.3,
          });
        }
      }
    });

    if (animations.length > 0) {
      console.log('Player model animations:', animations.map(a => a.name));
      
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;

      const clip = animations[0];
      const action = mixer.clipAction(clip);
      action.play();
      actionRef.current = action;
      console.log('Playing animation:', clip.name);
    } else {
      console.log('No animations found in player model');
    }

    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [scene, animations]);

  useEffect(() => {
    if (!actionRef.current) return;
    
    if (isSprinting) {
      actionRef.current.paused = false;
      actionRef.current.timeScale = 1.0;
    } else {
      actionRef.current.paused = true;
    }
  }, [isMoving, isSprinting]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={scene} scale={1} />;
}

function LoadedEnemyModel() {
  const { scene } = useGLTF(ENEMY_MODEL_PATH);
  
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material && !(mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const oldMat = mesh.material as THREE.MeshBasicMaterial;
          mesh.material = new THREE.MeshStandardMaterial({
            color: oldMat.color || new THREE.Color("#3a1a4a"),
            roughness: 0.6,
            metalness: 0.15,
          });
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={1.5} />;
}

function PlayerModel({ isMoving = false, isSprinting = false }: { isMoving?: boolean, isSprinting?: boolean }) {
  return (
    <ModelErrorBoundary fallback={<PlayerModelFallback />}>
      <Suspense fallback={<FallbackPlaceholder color="#00ffff" />}>
        <LoadedPlayerModel isMoving={isMoving} isSprinting={isSprinting} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function EnemyModel() {
  return (
    <ModelErrorBoundary fallback={<EnemyModelFallback />}>
      <Suspense fallback={<FallbackPlaceholder color="#8b0000" scale={1.5} />}>
        <LoadedEnemyModel />
      </Suspense>
    </ModelErrorBoundary>
  );
}

class WebGLErrorBoundary extends Component<{ children: ReactNode, onRetry: () => void }, { hasError: boolean }> {
  constructor(props: { children: ReactNode, onRetry: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-primary">
          <p className="text-xl mb-4 font-display">3D Graphics Error</p>
          <p className="text-sm text-muted-foreground mb-4">WebGL context could not be created</p>
          <Button 
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry();
            }}
            className="bg-primary/20 border border-primary"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Seeded random helper for stable procedural generation
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function GrassClump({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#4a8a3a"),
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  }), []);

  return (
    <group position={position} scale={scale}>
      {[0, 0.4, 0.8, 1.2, 1.6].map((rot, i) => (
        <mesh key={i} rotation={[0.15, rot * Math.PI, 0]} material={grassMat}>
          <planeGeometry args={[0.15, 0.4]} />
        </mesh>
      ))}
    </group>
  );
}

function ScatteredLeaf({ position, rotation }: { position: [number, number, number], rotation: number }) {
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#5a7a40"),
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  }), []);

  return (
    <mesh position={position} rotation={[-Math.PI / 2 + 0.1, rotation, 0]} material={leafMat}>
      <circleGeometry args={[0.08, 6]} />
    </mesh>
  );
}

function JungleTerrain() {
  const groundMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#4a7a3a"),
      roughness: 0.88,
      metalness: 0.0,
    });
  }, []);

  const dirtMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#6b5a45"),
      roughness: 0.92,
      metalness: 0.0,
    });
  }, []);

  const rockMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#6a6a6a"),
      roughness: 0.8,
      metalness: 0.05,
    });
  }, []);

  // Precompute stable positions for dirt patches
  const dirtPatches = useMemo(() => {
    return [...Array(12)].map((_, i) => ({
      rotation: seededRandom(i * 7) * Math.PI,
      x: (seededRandom(i * 13) - 0.5) * 35,
      z: (seededRandom(i * 17) - 0.5) * 35,
      radius: 0.8 + seededRandom(i * 23) * 1.5,
    }));
  }, []);

  // Precompute stable positions for rocks
  const rocks = useMemo(() => {
    return [...Array(18)].map((_, i) => ({
      x: (seededRandom(i * 31 + 100) - 0.5) * 45,
      z: (seededRandom(i * 37 + 100) - 0.5) * 45,
      size: 0.15 + seededRandom(i * 41 + 100) * 0.25,
      rotY: seededRandom(i * 43 + 100) * Math.PI * 2,
    }));
  }, []);

  // Grass clumps
  const grassClumps = useMemo(() => {
    return [...Array(40)].map((_, i) => ({
      x: (seededRandom(i * 53 + 200) - 0.5) * 50,
      z: (seededRandom(i * 59 + 200) - 0.5) * 50,
      scale: 0.7 + seededRandom(i * 61 + 200) * 0.6,
    }));
  }, []);

  // Scattered leaves
  const leaves = useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      x: (seededRandom(i * 67 + 300) - 0.5) * 40,
      z: (seededRandom(i * 71 + 300) - 0.5) * 40,
      rotation: seededRandom(i * 73 + 300) * Math.PI * 2,
    }));
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow material={groundMaterial}>
        <planeGeometry args={[120, 120, 24, 24]} />
      </mesh>
      
      {/* Dirt/mud patches */}
      {dirtPatches.map((patch, i) => (
        <mesh 
          key={`dirt-${i}`}
          rotation={[-Math.PI / 2, patch.rotation, 0]} 
          position={[patch.x, -1.99, patch.z]} 
          receiveShadow
          material={dirtMaterial}
        >
          <circleGeometry args={[patch.radius, 10]} />
        </mesh>
      ))}
      
      {/* Rocks */}
      {rocks.map((rock, i) => (
        <mesh 
          key={`rock-${i}`}
          position={[rock.x, -1.85, rock.z]}
          rotation={[0, rock.rotY, 0]}
          castShadow
          receiveShadow
          material={rockMaterial}
        >
          <dodecahedronGeometry args={[rock.size, 1]} />
        </mesh>
      ))}
      
      {/* Grass clumps */}
      {grassClumps.map((grass, i) => (
        <GrassClump 
          key={`grass-${i}`}
          position={[grass.x, -1.8, grass.z]}
          scale={grass.scale}
        />
      ))}
      
      {/* Scattered leaves */}
      {leaves.map((leaf, i) => (
        <ScatteredLeaf
          key={`leaf-${i}`}
          position={[leaf.x, -1.97, leaf.z]}
          rotation={leaf.rotation}
        />
      ))}
    </group>
  );
}

function SmoothTree({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const trunkColor = useMemo(() => new THREE.Color("#4a3020"), []);
  const foliageColors = useMemo(() => [
    new THREE.Color("#1a5518"),
    new THREE.Color("#226622"),
    new THREE.Color("#2a7a2a"),
  ], []);

  return (
    <group position={position} scale={scale}>
      {/* Trunk - smooth cylinder with higher segments */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.4, 5, 16]} />
        <meshStandardMaterial color={trunkColor} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Smooth foliage spheres instead of cones */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <sphereGeometry args={[2.2, 16, 12]} />
        <meshStandardMaterial color={foliageColors[0]} roughness={0.75} metalness={0.0} />
      </mesh>
      <mesh position={[0.5, 5.2, 0.3]} castShadow>
        <sphereGeometry args={[1.5, 14, 10]} />
        <meshStandardMaterial color={foliageColors[1]} roughness={0.75} metalness={0.0} />
      </mesh>
      <mesh position={[-0.3, 5.8, -0.2]} castShadow>
        <sphereGeometry args={[1.2, 12, 8]} />
        <meshStandardMaterial color={foliageColors[2]} roughness={0.75} metalness={0.0} />
      </mesh>
    </group>
  );
}

function JungleEnvironment() {
  const treeData = useMemo(() => [
    { pos: [-8, 0, -10] as [number, number, number], scale: 1.1 },
    { pos: [8, 0, -12] as [number, number, number], scale: 0.9 },
    { pos: [-12, 0, -5] as [number, number, number], scale: 1.2 },
    { pos: [12, 0, -8] as [number, number, number], scale: 1.0 },
    { pos: [-10, 0, 5] as [number, number, number], scale: 0.85 },
    { pos: [10, 0, 8] as [number, number, number], scale: 1.15 },
    { pos: [-15, 0, -15] as [number, number, number], scale: 1.3 },
    { pos: [15, 0, -15] as [number, number, number], scale: 0.95 },
    { pos: [-6, 0, 12] as [number, number, number], scale: 1.05 },
    { pos: [6, 0, 15] as [number, number, number], scale: 1.1 },
    { pos: [-18, 0, 0] as [number, number, number], scale: 1.25 },
    { pos: [18, 0, 2] as [number, number, number], scale: 0.9 },
  ], []);

  return (
    <>
      {treeData.map((tree, i) => (
        <SmoothTree key={i} position={tree.pos} scale={tree.scale} />
      ))}
    </>
  );
}

function PostProcessing() {
  return (
    <EffectComposer multisampling={8} enableNormalPass>
      {/* SMAA for sharp anti-aliasing without blurring UI elements */}
      <SMAA edgeDetectionMode={EdgeDetectionMode.COLOR} />
      
      {/* Subtle SSAO for depth and grounding */}
      <SSAO 
        samples={16}
        radius={0.06}
        intensity={8}
        luminanceInfluence={0.7}
        color={new THREE.Color("#1a1a18")}
        worldDistanceThreshold={30}
        worldDistanceFalloff={5}
      />
      
      {/* Low bloom for glow effects only */}
      <Bloom 
        intensity={0.15}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.7}
        mipmapBlur
      />
      
      {/* Color grading - warm jungle tones */}
      <BrightnessContrast brightness={0.02} contrast={0.08} />
      <HueSaturation hue={0.02} saturation={0.05} />
      
      {/* ACES filmic tone mapping for proper exposure */}
      <ToneMapping 
        mode={ToneMappingMode.ACES_FILMIC}
        resolution={512}
        whitePoint={5.0}
        middleGrey={0.6}
        minLuminance={0.01}
        maxLuminance={16.0}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />
      
      {/* Subtle vignette for cinematic framing */}
      <Vignette offset={0.4} darkness={0.25} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

function WarriorCharacter({ isAttacking, isUsingSkill, joystick, playerPosRef }: { isAttacking: boolean, isUsingSkill: boolean, joystick: { x: number, y: number }, playerPosRef: React.MutableRefObject<THREE.Vector3> }) {
  const groupRef = useRef<THREE.Group>(null);
  const skillAuraRef = useRef<THREE.Mesh>(null);
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const skillProgress = useRef(0);
  const [isMoving, setIsMoving] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);

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
    const moving = length > 0.1;
    setIsMoving(moving);
    setIsSprinting(shift && moving);
    
    if (moving) {
      const normX = moveX / length;
      const normZ = moveZ / length;
      const finalSpeed = speed * Math.min(1, length);
      
      groupRef.current.position.x += normX * finalSpeed;
      groupRef.current.position.z += normZ * finalSpeed;

      const angle = Math.atan2(normX, normZ);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.2);
    }

    playerPosRef.current.copy(groupRef.current.position);

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

    if (!moving && !isAttacking) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 2]}>
      {/* Skill Aura Effect */}
      <mesh ref={skillAuraRef} position={[0, 0.5, 0]} scale={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} transparent opacity={0.5} />
      </mesh>

      {/* GLB Model - replaces primitive geometry */}
      <Suspense fallback={<FallbackPlaceholder color="#00ffff" />}>
        <PlayerModel isMoving={isMoving} isSprinting={isSprinting} />
      </Suspense>
    </group>
  );
}

function Monster({ hp, maxHp, isHit, isMonsterAttacking, playerPosRef, monsterPosRef }: { hp: number, maxHp: number, isHit: boolean, isMonsterAttacking: boolean, playerPosRef: React.MutableRefObject<THREE.Vector3>, monsterPosRef: React.MutableRefObject<THREE.Vector3> }) {
  const rootRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!rootRef.current || !groupRef.current) return;
    
    // Enemy chasing disabled for now
    // const direction = new THREE.Vector3().subVectors(playerPosRef.current, rootRef.current.position);
    // const distance = direction.length();
    // if (distance > MONSTER_ATTACK_RANGE) {
    //   direction.normalize();
    //   rootRef.current.position.x += direction.x * MONSTER_SPEED;
    //   rootRef.current.position.z += direction.z * MONSTER_SPEED;
    //   const angle = Math.atan2(direction.x, direction.z);
    //   rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, angle, 0.1);
    // }
    
    monsterPosRef.current.copy(rootRef.current.position);
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
  });

  return (
    <group ref={rootRef} position={[0, 0, -5]}>
      <Float speed={0} rotationIntensity={0} floatIntensity={0}>
        <group position={[0, 3.2, 0]}>
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

      {/* GLB Model - replaces primitive geometry */}
      <group ref={groupRef}>
        <Suspense fallback={<FallbackPlaceholder color="#8b0000" scale={1.5} />}>
          <EnemyModel />
        </Suspense>
      </group>
    </group>
  );
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

export default function Game3DPage() {
  const { player, isLoading, modifyHp, modifyMp, gainExp } = useGame();
  
  const [enemyHp, setEnemyHp] = useState(MONSTER_MAX_HP);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isUsingSkill, setIsUsingSkill] = useState(false);
  const [isHit, setIsHit] = useState(false);
  const [isMonsterAttacking, setIsMonsterAttacking] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>(["A monster appears!"]);
  const [showHUD, setShowHUD] = useState(true);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const [canvasKey, setCanvasKey] = useState(0);
  const [webglError, setWebglError] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 2));
  const monsterPosRef = useRef(new THREE.Vector3(0, 0, -5));
  const lastMonsterAttackRef = useRef(0);

  useEffect(() => {
    if (!checkWebGLSupport()) {
      setWebglError(true);
    }
  }, [canvasKey]);

  // Check for player death
  useEffect(() => {
    if (player && player.hp <= 0) {
      setGameOver(true);
    }
  }, [player?.hp]);

  const unlockedSkill = player?.skills?.find(s => s.unlocked);

  const isInRange = () => {
    const distance = playerPosRef.current.distanceTo(monsterPosRef.current);
    return distance <= ATTACK_RANGE;
  };

  // Monster attack logic
  useEffect(() => {
    if (!player || enemyHp <= 0) return;
    
    const attackInterval = setInterval(() => {
      const distance = playerPosRef.current.distanceTo(monsterPosRef.current);
      const now = Date.now();
      
      if (distance <= MONSTER_ATTACK_RANGE && now - lastMonsterAttackRef.current > 2000) {
        lastMonsterAttackRef.current = now;
        setIsMonsterAttacking(true);
        
        setTimeout(() => {
          const dmg = Math.floor(Math.random() * 10) + 8;
          modifyHp(-dmg);
          setCombatLog(prev => [`Monster claws you: ${dmg} DMG!`, ...prev].slice(0, 4));
          
          setTimeout(() => {
            setIsMonsterAttacking(false);
          }, 300);
        }, 300);
      }
    }, 500);
    
    return () => clearInterval(attackInterval);
  }, [player, enemyHp, modifyHp]);

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
      if (!isInRange()) {
        setCombatLog(prev => ["Too far! Get closer to attack.", ...prev].slice(0, 4));
        setIsAttacking(false);
        return;
      }
      
      setIsHit(true);
      const baseDmg = player?.stats?.strength ? player.stats.strength * 2 : 20;
      const dmg = Math.floor(Math.random() * 10) + baseDmg;
      const newHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newHp);
      setCombatLog(prev => [`Sword Strike: ${dmg} DMG!`, ...prev].slice(0, 4));
      
      if (newHp === 0) {
        setCombatLog(prev => ["Monster Defeated! +50 EXP", ...prev]);
        gainExp(50);
        setTimeout(() => setEnemyHp(MONSTER_MAX_HP), 2000);
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
      if (!isInRange()) {
        setCombatLog(prev => ["Too far! Get closer to use skill.", ...prev].slice(0, 4));
        setIsUsingSkill(false);
        return;
      }
      
      setIsHit(true);
      const baseDmg = player?.stats?.strength ? player.stats.strength * 3 : 30;
      const dmg = Math.floor(Math.random() * 20) + baseDmg + 15;
      const newHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newHp);
      setCombatLog(prev => [`${unlockedSkill.name}: ${dmg} DMG!`, ...prev].slice(0, 4));
      
      if (newHp === 0) {
        setCombatLog(prev => ["Monster Defeated! +50 EXP", ...prev]);
        gainExp(50);
        setTimeout(() => setEnemyHp(MONSTER_MAX_HP), 2000);
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

  if (webglError) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center font-display">
        <p className="text-2xl text-primary mb-4">3D GRAPHICS UNAVAILABLE</p>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
          WebGL context could not be created. This may be due to browser limitations or GPU resources.
        </p>
        <Button 
          onClick={() => {
            setWebglError(false);
            setCanvasKey(k => k + 1);
          }}
          className="bg-primary/20 border border-primary text-primary hover:bg-primary/30"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
        <a href="/" className="mt-4 text-sm text-primary/60 hover:text-primary underline">
          Return to Status Page
        </a>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center font-display relative overflow-hidden">
        <div className="absolute inset-0 bg-red-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,rgba(0,0,0,0.9)_100%)]" />
        
        <div className="relative z-10 text-center">
          <p className="text-6xl font-bold text-red-500 mb-2 animate-pulse drop-shadow-[0_0_30px_rgba(255,0,0,0.8)]">
            RUN FAILED!
          </p>
          <p className="text-xl text-red-400/80 mb-8">You have been defeated...</p>
          
          <Button 
            onClick={() => {
              setGameOver(false);
              setEnemyHp(MONSTER_MAX_HP);
              modifyHp(player?.maxHp || 100);
              playerPosRef.current.set(0, 0, 2);
              monsterPosRef.current.set(0, 0, -5);
              setCombatLog(["A monster appears!"]);
              setCanvasKey(k => k + 1);
            }}
            className="bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/30 px-8 py-3 text-lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" /> TRY AGAIN
          </Button>
          
          <a href="/" className="block mt-6 text-sm text-red-400/60 hover:text-red-400 underline">
            Return to Status Page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black relative font-display overflow-hidden">
      <div className="absolute inset-0 z-0">
        <WebGLErrorBoundary onRetry={() => { setWebglError(false); setCanvasKey(k => k + 1); }}>
          <Canvas 
              key={canvasKey} 
              shadows="soft"
              gl={{ 
                antialias: true, 
                powerPreference: 'high-performance', 
                failIfMajorPerformanceCaveat: false,
                stencil: false,
                depth: true,
                alpha: false,
              }}
              dpr={[1, 2]}
            >
            <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={50} />
            <fog attach="fog" args={["#a8c8a8", 30, 90]} />
            
            {/* Ambient sky light - soft fill from above */}
            <ambientLight intensity={0.4} color="#d0e0d8" />
            
            {/* Main directional sun with soft shadows */}
            <directionalLight 
              position={[15, 30, 10]} 
              intensity={2.0} 
              color="#fff8e8"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={100}
              shadow-camera-left={-30}
              shadow-camera-right={30}
              shadow-camera-top={30}
              shadow-camera-bottom={-30}
              shadow-bias={-0.0002}
              shadow-normalBias={0.02}
              shadow-radius={4}
            />
            
            {/* Fill light - cool blue from opposite side */}
            <directionalLight position={[-10, 15, -10]} intensity={0.6} color="#b8d0f0" />
            
            {/* Rim/back light for character readability - subtle warm cyan */}
            <directionalLight position={[0, 10, -18]} intensity={0.7} color="#b0e8e0" />
            
            {/* Secondary rim from side for depth */}
            <pointLight position={[-8, 5, 5]} intensity={0.35} color="#e8f0e8" distance={25} decay={2} />
            
            {/* Hemisphere light for natural sky/ground bounce */}
            <hemisphereLight args={["#c8e0f0", "#5a7a4a", 0.5]} />
            
            <WarriorCharacter isAttacking={isAttacking} isUsingSkill={isUsingSkill} joystick={joystick} playerPosRef={playerPosRef} />
            {enemyHp > 0 && <Monster hp={enemyHp} maxHp={MONSTER_MAX_HP} isHit={isHit} isMonsterAttacking={isMonsterAttacking} playerPosRef={playerPosRef} monsterPosRef={monsterPosRef} />}
            
            <JungleTerrain />
            <JungleEnvironment />
            
            <PostProcessing />
          </Canvas>
        </WebGLErrorBoundary>
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

import React, { useRef, useState, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Float } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Sword, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const ATTACK_RANGE = 3;
const MONSTER_ATTACK_RANGE = 2;
const MONSTER_SPEED = 0.03;
const MONSTER_MAX_HP = 300;

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

function JungleTerrain() {
  const groundMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#3a6b2a"),
      roughness: 0.92,
      metalness: 0.02,
      flatShading: false,
    });
  }, []);

  const detailMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#2d5520"),
      roughness: 0.95,
      metalness: 0.0,
    });
  }, []);

  const rockMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#5a5a5a"),
      roughness: 0.9,
      metalness: 0.1,
    });
  }, []);

  // Precompute stable random positions for moss patches
  const mossPatches = useMemo(() => {
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    return [...Array(20)].map((_, i) => ({
      rotation: seededRandom(i * 7) * Math.PI,
      x: (seededRandom(i * 13) - 0.5) * 40,
      z: (seededRandom(i * 17) - 0.5) * 40,
      radius: 1 + seededRandom(i * 23) * 2,
    }));
  }, []);

  // Precompute stable random positions for rocks
  const rocks = useMemo(() => {
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    return [...Array(15)].map((_, i) => ({
      x: (seededRandom(i * 31 + 100) - 0.5) * 50,
      z: (seededRandom(i * 37 + 100) - 0.5) * 50,
      size: 0.2 + seededRandom(i * 41 + 100) * 0.3,
    }));
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow material={groundMaterial}>
        <planeGeometry args={[120, 120, 32, 32]} />
      </mesh>
      {/* Moss patches for texture variation */}
      {mossPatches.map((patch, i) => (
        <mesh 
          key={i}
          rotation={[-Math.PI / 2, patch.rotation, 0]} 
          position={[patch.x, -1.98, patch.z]} 
          receiveShadow
          material={detailMaterial}
        >
          <circleGeometry args={[patch.radius, 12]} />
        </mesh>
      ))}
      {/* Small rocks for detail */}
      {rocks.map((rock, i) => (
        <mesh 
          key={`rock-${i}`}
          position={[rock.x, -1.7, rock.z]}
          castShadow
          receiveShadow
          material={rockMaterial}
        >
          <dodecahedronGeometry args={[rock.size, 0]} />
        </mesh>
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
    <EffectComposer multisampling={4}>
      <SSAO 
        samples={16}
        radius={0.1}
        intensity={15}
        luminanceInfluence={0.5}
        color={new THREE.Color("#000000")}
      />
      <Bloom 
        intensity={0.3}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.5}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.4} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

function WarriorCharacter({ isAttacking, isUsingSkill, joystick, playerPosRef }: { isAttacking: boolean, isUsingSkill: boolean, joystick: { x: number, y: number }, playerPosRef: React.MutableRefObject<THREE.Vector3> }) {
  const groupRef = useRef<THREE.Group>(null);
  const swordArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const skillAuraRef = useRef<THREE.Mesh>(null);
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const attackProgress = useRef(0);
  const skillProgress = useRef(0);

  const armorMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: new THREE.Color("#2a2a3a"), roughness: 0.35, metalness: 0.7 
  }), []);
  const plateMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: new THREE.Color("#4a4a5a"), roughness: 0.2, metalness: 0.85 
  }), []);
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: new THREE.Color("#e8d5c4"), roughness: 0.55, metalness: 0.0 
  }), []);
  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: new THREE.Color("#00ffff"), emissive: new THREE.Color("#00ffff"), emissiveIntensity: 2.5 
  }), []);

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

    if (!isMoving && !isAttacking) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 2]}>
      <mesh ref={skillAuraRef} position={[0, 0.5, 0]} scale={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} transparent opacity={0.5} />
      </mesh>

      {/* Torso - capsule shape */}
      <mesh position={[0, 0.7, 0]} castShadow material={armorMat}>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
      </mesh>
      
      {/* Chest Plate - rounded */}
      <mesh position={[0, 0.75, 0.12]} castShadow material={plateMat}>
        <sphereGeometry args={[0.28, 16, 12]} />
      </mesh>
      
      {/* Belt */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <torusGeometry args={[0.28, 0.06, 8, 24]} />
        <meshStandardMaterial color="#8b4513" roughness={0.65} metalness={0.25} />
      </mesh>

      {/* Head - sphere */}
      <mesh position={[0, 1.32, 0]} castShadow material={skinMat}>
        <sphereGeometry args={[0.2, 16, 12]} />
      </mesh>
      
      {/* Helmet - smooth dome */}
      <mesh position={[0, 1.38, 0]} castShadow material={plateMat}>
        <sphereGeometry args={[0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      
      {/* Helmet Visor */}
      <mesh position={[0, 1.3, 0.18]} material={glowMat}>
        <capsuleGeometry args={[0.03, 0.12, 4, 8]} />
      </mesh>

      {/* Left Arm - capsules */}
      <group position={[-0.4, 0.75, 0]}>
        {/* Upper arm */}
        <mesh castShadow material={armorMat}>
          <capsuleGeometry args={[0.08, 0.2, 6, 12]} />
        </mesh>
        {/* Lower arm */}
        <mesh position={[0, -0.25, 0]} castShadow material={armorMat}>
          <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        </mesh>
        {/* Shield - rounded */}
        <mesh position={[-0.12, -0.15, 0.1]} castShadow rotation={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.25, 0.22, 0.05, 16]} />
          <meshStandardMaterial color="#555577" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[-0.14, -0.15, 0.1]} material={glowMat}>
          <torusGeometry args={[0.15, 0.02, 8, 16]} />
        </mesh>
      </group>

      {/* Right Arm - Sword Arm */}
      <group ref={swordArmRef} position={[0.4, 0.75, 0]}>
        <mesh castShadow material={armorMat}>
          <capsuleGeometry args={[0.08, 0.2, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.25, 0]} castShadow material={armorMat}>
          <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        </mesh>
        
        {/* Sword */}
        <group position={[0.08, -0.45, 0.2]} rotation={[0.3, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.04, 0.28, 12]} />
            <meshStandardMaterial color="#4a3020" roughness={0.75} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <capsuleGeometry args={[0.02, 0.16, 4, 12]} />
            <meshStandardMaterial color="#666688" metalness={0.9} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.65, 0]} castShadow>
            <capsuleGeometry args={[0.025, 0.75, 4, 12]} />
            <meshStandardMaterial color="#c0c0d0" metalness={0.95} roughness={0.08} />
          </mesh>
          <mesh position={[0.04, 0.65, 0]} material={glowMat}>
            <capsuleGeometry args={[0.008, 0.7, 4, 8]} />
          </mesh>
        </group>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.12, 0.1, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow material={armorMat}>
          <capsuleGeometry args={[0.09, 0.25, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.42, 0.03]} castShadow>
          <sphereGeometry args={[0.11, 12, 8]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.4} metalness={0.75} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.12, 0.1, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow material={armorMat}>
          <capsuleGeometry args={[0.09, 0.25, 6, 12]} />
        </mesh>
        <mesh position={[0, -0.42, 0.03]} castShadow>
          <sphereGeometry args={[0.11, 12, 8]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.4} metalness={0.75} />
        </mesh>
      </group>
    </group>
  );
}

function Monster({ hp, maxHp, isHit, isMonsterAttacking, playerPosRef, monsterPosRef }: { hp: number, maxHp: number, isHit: boolean, isMonsterAttacking: boolean, playerPosRef: React.MutableRefObject<THREE.Vector3>, monsterPosRef: React.MutableRefObject<THREE.Vector3> }) {
  const rootRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const attackProgress = useRef(0);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#2a0a3a"), roughness: 0.65, metalness: 0.15
  }), []);
  const hitMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#3d1a4a"), roughness: 0.6, metalness: 0.1
  }), []);
  const hornMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#1a0a2a"), roughness: 0.35, metalness: 0.4
  }), []);
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ff0000"), emissive: new THREE.Color("#ff0000"), emissiveIntensity: 3
  }), []);
  
  useFrame((state, delta) => {
    if (!rootRef.current || !groupRef.current) return;
    
    const direction = new THREE.Vector3().subVectors(playerPosRef.current, rootRef.current.position);
    const distance = direction.length();
    
    if (distance > MONSTER_ATTACK_RANGE) {
      direction.normalize();
      rootRef.current.position.x += direction.x * MONSTER_SPEED;
      rootRef.current.position.z += direction.z * MONSTER_SPEED;
      
      const angle = Math.atan2(direction.x, direction.z);
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, angle, 0.1);
    }
    
    monsterPosRef.current.copy(rootRef.current.position);
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    
    if (leftArmRef.current && rightArmRef.current) {
      if (isMonsterAttacking) {
        attackProgress.current = Math.min(attackProgress.current + delta * 6, 1);
        const swing = Math.sin(attackProgress.current * Math.PI) * 1.5;
        leftArmRef.current.rotation.x = -swing;
        rightArmRef.current.rotation.x = -swing;
      } else {
        attackProgress.current = 0;
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, Math.sin(state.clock.elapsedTime * 2) * 0.3, 0.2);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, Math.sin(state.clock.elapsedTime * 2 + Math.PI) * 0.3, 0.2);
      }
    }

    // Update colors on hit
    if (isHit) {
      bodyMat.color.setHex(0xff3333);
      hitMat.color.setHex(0xff0000);
    } else {
      bodyMat.color.setHex(0x2a0a3a);
      hitMat.color.setHex(0x3d1a4a);
    }
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

      <group ref={groupRef}>
        {/* Torso - smooth capsule */}
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow material={bodyMat}>
          <capsuleGeometry args={[0.5, 0.8, 12, 24]} />
        </mesh>
        
        {/* Shoulder masses */}
        <mesh position={[-0.55, 1.5, 0]} castShadow material={bodyMat}>
          <sphereGeometry args={[0.3, 12, 10]} />
        </mesh>
        <mesh position={[0.55, 1.5, 0]} castShadow material={bodyMat}>
          <sphereGeometry args={[0.3, 12, 10]} />
        </mesh>
        
        {/* Chest spikes - smoother cones */}
        <mesh position={[0.25, 1.4, 0.4]} rotation={[0.4, 0, 0.1]} castShadow material={hornMat}>
          <coneGeometry args={[0.08, 0.35, 12]} />
        </mesh>
        <mesh position={[-0.25, 1.4, 0.4]} rotation={[0.4, 0, -0.1]} castShadow material={hornMat}>
          <coneGeometry args={[0.08, 0.35, 12]} />
        </mesh>

        {/* Head - smooth sphere */}
        <mesh position={[0, 2, 0]} castShadow receiveShadow material={hitMat}>
          <sphereGeometry args={[0.38, 16, 12]} />
        </mesh>
        
        {/* Horns - smooth cones */}
        <mesh position={[0.28, 2.35, -0.05]} rotation={[-0.2, 0.3, 0.5]} castShadow material={hornMat}>
          <coneGeometry args={[0.06, 0.5, 12]} />
        </mesh>
        <mesh position={[-0.28, 2.35, -0.05]} rotation={[-0.2, -0.3, -0.5]} castShadow material={hornMat}>
          <coneGeometry args={[0.06, 0.5, 12]} />
        </mesh>
        
        {/* Glowing Eyes */}
        <mesh position={[0.14, 2.05, 0.3]} material={eyeMat}>
          <sphereGeometry args={[0.08, 12, 8]} />
        </mesh>
        <mesh position={[-0.14, 2.05, 0.3]} material={eyeMat}>
          <sphereGeometry args={[0.08, 12, 8]} />
        </mesh>
        
        {/* Mouth - rounded */}
        <mesh position={[0, 1.85, 0.32]}>
          <capsuleGeometry args={[0.04, 0.25, 6, 12]} />
          <meshStandardMaterial color="#0a0010" roughness={0.85} />
        </mesh>

        {/* Left Arm - capsule */}
        <group ref={leftArmRef} position={[-0.75, 1.35, 0]}>
          <mesh castShadow material={bodyMat}>
            <capsuleGeometry args={[0.15, 0.5, 8, 14]} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0, -0.45, 0.05]} castShadow material={bodyMat}>
            <capsuleGeometry args={[0.12, 0.4, 8, 14]} />
          </mesh>
          {/* Claws - smooth cones */}
          <mesh position={[0, -0.75, 0.1]} rotation={[0.4, 0, 0]} castShadow material={hornMat}>
            <coneGeometry args={[0.05, 0.25, 10]} />
          </mesh>
          <mesh position={[0.1, -0.72, 0.08]} rotation={[0.4, 0, 0.2]} castShadow material={hornMat}>
            <coneGeometry args={[0.04, 0.2, 10]} />
          </mesh>
          <mesh position={[-0.1, -0.72, 0.08]} rotation={[0.4, 0, -0.2]} castShadow material={hornMat}>
            <coneGeometry args={[0.04, 0.2, 10]} />
          </mesh>
        </group>

        {/* Right Arm - capsule */}
        <group ref={rightArmRef} position={[0.75, 1.35, 0]}>
          <mesh castShadow material={bodyMat}>
            <capsuleGeometry args={[0.15, 0.5, 8, 14]} />
          </mesh>
          <mesh position={[0, -0.45, 0.05]} castShadow material={bodyMat}>
            <capsuleGeometry args={[0.12, 0.4, 8, 14]} />
          </mesh>
          <mesh position={[0, -0.75, 0.1]} rotation={[0.4, 0, 0]} castShadow material={hornMat}>
            <coneGeometry args={[0.05, 0.25, 10]} />
          </mesh>
          <mesh position={[0.1, -0.72, 0.08]} rotation={[0.4, 0, 0.2]} castShadow material={hornMat}>
            <coneGeometry args={[0.04, 0.2, 10]} />
          </mesh>
          <mesh position={[-0.1, -0.72, 0.08]} rotation={[0.4, 0, -0.2]} castShadow material={hornMat}>
            <coneGeometry args={[0.04, 0.2, 10]} />
          </mesh>
        </group>

        {/* Legs - capsules */}
        <mesh position={[-0.25, 0.15, 0]} castShadow material={bodyMat}>
          <capsuleGeometry args={[0.14, 0.4, 8, 12]} />
        </mesh>
        <mesh position={[0.25, 0.15, 0]} castShadow material={bodyMat}>
          <capsuleGeometry args={[0.14, 0.4, 8, 12]} />
        </mesh>
        
        {/* Feet - spheres */}
        <mesh position={[-0.25, -0.15, 0.05]} castShadow material={bodyMat}>
          <sphereGeometry args={[0.14, 10, 8]} />
        </mesh>
        <mesh position={[0.25, -0.15, 0.05]} castShadow material={bodyMat}>
          <sphereGeometry args={[0.14, 10, 8]} />
        </mesh>
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
          <Canvas key={canvasKey} shadows gl={{ antialias: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}>
            <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={50} />
            <fog attach="fog" args={["#8fb88f", 20, 70]} />
            
            {/* Ambient fill light */}
            <ambientLight intensity={0.4} color="#9db99d" />
            
            {/* Main directional sunlight with soft shadows */}
            <directionalLight 
              position={[15, 30, 15]} 
              intensity={2.2} 
              color="#fff8e0"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={80}
              shadow-camera-left={-30}
              shadow-camera-right={30}
              shadow-camera-top={30}
              shadow-camera-bottom={-30}
              shadow-bias={-0.0005}
            />
            
            {/* Fill light from opposite side */}
            <directionalLight position={[-10, 15, -10]} intensity={0.6} color="#b8d4ff" />
            
            {/* Hemisphere light for natural sky/ground bounce */}
            <hemisphereLight args={["#87ceeb", "#3a6b2a", 0.8]} />
            
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

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    BABYLON: any;
  }
}

interface GameState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  wave: number;
  enemiesRemaining: number;
  isLoaded: boolean;
}

export default function SurvivalPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const moveRef = useRef({ x: 0, y: 0 });
  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    wave: 1,
    enemiesRemaining: 0,
    isLoaded: false
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.babylonjs.com/babylon.js";
    script.async = true;
    script.onload = () => {
      const loaderScript = document.createElement("script");
      loaderScript.src = "https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js";
      loaderScript.async = true;
      loaderScript.onload = () => initGame();
      document.body.appendChild(loaderScript);
    };
    document.body.appendChild(script);

    return () => {
      if (gameRef.current) {
        gameRef.current.dispose();
      }
    };
  }, []);

  const initGame = () => {
    if (!canvasRef.current || !window.BABYLON) return;

    const BABYLON = window.BABYLON;
    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    engine.setHardwareScalingLevel(1 / dpr);

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.05, 0.08, 0.15, 1);
    scene.ambientColor = new BABYLON.Color3(0.2, 0.25, 0.35);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.015;
    scene.fogColor = new BABYLON.Color3(0.05, 0.08, 0.15);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 15, BABYLON.Vector3.Zero(), scene);
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 25;
    camera.lowerBetaLimit = 0.3;
    camera.upperBetaLimit = Math.PI / 2.2;

    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;
    hemi.groundColor = new BABYLON.Color3(0.1, 0.15, 0.25);

    const dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;
    dir.position = new BABYLON.Vector3(20, 40, 20);

    const shadowGen = new BABYLON.ShadowGenerator(512, dir);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;

    const dungeonSize = 50;
    const rooms: { x: number; z: number; w: number; h: number }[] = [];
    
    for (let i = 0; i < 8; i++) {
      const w = 8 + Math.floor(Math.random() * 8);
      const h = 8 + Math.floor(Math.random() * 8);
      const x = Math.floor(Math.random() * (dungeonSize - w - 4)) + 2 - dungeonSize / 2;
      const z = Math.floor(Math.random() * (dungeonSize - h - 4)) + 2 - dungeonSize / 2;
      rooms.push({ x, z, w, h });
    }

    const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
    floorMat.diffuseColor = new BABYLON.Color3(0.15, 0.12, 0.1);
    floorMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.25, 0.22, 0.2);
    wallMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    rooms.forEach((room, idx) => {
      const floor = BABYLON.MeshBuilder.CreateBox(`floor_${idx}`, { width: room.w, height: 0.2, depth: room.h }, scene);
      floor.position = new BABYLON.Vector3(room.x + room.w / 2, -0.1, room.z + room.h / 2);
      floor.material = floorMat;
      floor.receiveShadows = true;

      const wallHeight = 3;
      const wallThickness = 0.5;

      const northWall = BABYLON.MeshBuilder.CreateBox(`wall_n_${idx}`, { width: room.w, height: wallHeight, depth: wallThickness }, scene);
      northWall.position = new BABYLON.Vector3(room.x + room.w / 2, wallHeight / 2, room.z + room.h);
      northWall.material = wallMat;

      const southWall = BABYLON.MeshBuilder.CreateBox(`wall_s_${idx}`, { width: room.w, height: wallHeight, depth: wallThickness }, scene);
      southWall.position = new BABYLON.Vector3(room.x + room.w / 2, wallHeight / 2, room.z);
      southWall.material = wallMat;

      const eastWall = BABYLON.MeshBuilder.CreateBox(`wall_e_${idx}`, { width: wallThickness, height: wallHeight, depth: room.h }, scene);
      eastWall.position = new BABYLON.Vector3(room.x + room.w, wallHeight / 2, room.z + room.h / 2);
      eastWall.material = wallMat;

      const westWall = BABYLON.MeshBuilder.CreateBox(`wall_w_${idx}`, { width: wallThickness, height: wallHeight, depth: room.h }, scene);
      westWall.position = new BABYLON.Vector3(room.x, wallHeight / 2, room.z + room.h / 2);
      westWall.material = wallMat;

      if (idx > 0) {
        const prevRoom = rooms[idx - 1];
        const corridorFloor = BABYLON.MeshBuilder.CreateBox(`corridor_${idx}`, { width: 3, height: 0.2, depth: 20 }, scene);
        corridorFloor.position = new BABYLON.Vector3(
          (room.x + room.w / 2 + prevRoom.x + prevRoom.w / 2) / 2,
          -0.1,
          (room.z + room.h / 2 + prevRoom.z + prevRoom.h / 2) / 2
        );
        corridorFloor.material = floorMat;
        corridorFloor.receiveShadows = true;
        corridorFloor.lookAt(new BABYLON.Vector3(room.x + room.w / 2, 0, room.z + room.h / 2));
      }
    });

    const torchMat = new BABYLON.StandardMaterial("torchMat", scene);
    torchMat.emissiveColor = new BABYLON.Color3(1, 0.6, 0.2);

    rooms.forEach((room, idx) => {
      if (idx % 2 === 0) {
        const torch = BABYLON.MeshBuilder.CreateCylinder(`torch_${idx}`, { height: 0.8, diameter: 0.15 }, scene);
        torch.position = new BABYLON.Vector3(room.x + 1, 1.5, room.z + 1);
        torch.material = torchMat;

        const torchLight = new BABYLON.PointLight(`torchLight_${idx}`, torch.position.add(new BABYLON.Vector3(0, 0.5, 0)), scene);
        torchLight.intensity = 0.5;
        torchLight.diffuse = new BABYLON.Color3(1, 0.6, 0.3);
        torchLight.range = 12;
      }
    });

    const playerMat = new BABYLON.StandardMaterial("playerMat", scene);
    playerMat.diffuseColor = new BABYLON.Color3(0, 0.8, 0.9);
    playerMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

    const playerBody = BABYLON.MeshBuilder.CreateCylinder("playerBody", { height: 1.6, diameter: 0.8 }, scene);
    playerBody.position = new BABYLON.Vector3(rooms[0].x + rooms[0].w / 2, 0.8, rooms[0].z + rooms[0].h / 2);
    playerBody.material = playerMat;
    shadowGen.addShadowCaster(playerBody);

    const playerHead = BABYLON.MeshBuilder.CreateSphere("playerHead", { diameter: 0.5 }, scene);
    playerHead.parent = playerBody;
    playerHead.position.y = 1;
    playerHead.material = playerMat;

    const enemies: any[] = [];
    const enemyMat = new BABYLON.StandardMaterial("enemyMat", scene);
    enemyMat.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);

    let currentWave = 1;
    let waveDelay = 0;
    let playerHealth = 100;
    let playerStamina = 100;
    let attackCooldown = 0;
    let isSprinting = false;

    const spawnWave = (waveNum: number) => {
      const count = 3 + waveNum * 2;
      const roomIdx = Math.floor(Math.random() * rooms.length);
      const room = rooms[roomIdx];

      for (let i = 0; i < count; i++) {
        const enemy = BABYLON.MeshBuilder.CreateBox(`enemy_${Date.now()}_${i}`, { size: 1 }, scene);
        enemy.position = new BABYLON.Vector3(
          room.x + 2 + Math.random() * (room.w - 4),
          0.5,
          room.z + 2 + Math.random() * (room.h - 4)
        );
        enemy.material = enemyMat;
        shadowGen.addShadowCaster(enemy);
        enemies.push({
          mesh: enemy,
          health: 20 + waveNum * 5,
          speed: 2 + waveNum * 0.2,
          damage: 5 + waveNum,
          attackCooldown: 0
        });
      }

      setGameState(s => ({ ...s, wave: waveNum, enemiesRemaining: count }));
    };

    spawnWave(1);

    const inputMap: Record<string, boolean> = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt: any) => {
      inputMap[evt.sourceEvent.key.toLowerCase()] = true;
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt: any) => {
      inputMap[evt.sourceEvent.key.toLowerCase()] = false;
    }));

    const pickups: any[] = [];
    const pickupMat = new BABYLON.StandardMaterial("pickupMat", scene);
    pickupMat.diffuseColor = new BABYLON.Color3(0.2, 1, 0.3);
    pickupMat.emissiveColor = new BABYLON.Color3(0.1, 0.5, 0.15);

    engine.runRenderLoop(() => {
      const dt = engine.getDeltaTime() / 1000;

      let moveX = 0, moveZ = 0;
      if (inputMap["w"] || inputMap["arrowup"]) moveZ -= 1;
      if (inputMap["s"] || inputMap["arrowdown"]) moveZ += 1;
      if (inputMap["a"] || inputMap["arrowleft"]) moveX -= 1;
      if (inputMap["d"] || inputMap["arrowright"]) moveX += 1;

      moveX += moveRef.current.x;
      moveZ += moveRef.current.y;

      isSprinting = inputMap["shift"] && playerStamina > 0;
      const speed = isSprinting ? 8 : 5;

      if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= len;
        moveZ /= len;

        playerBody.position.x += moveX * speed * dt;
        playerBody.position.z += moveZ * speed * dt;

        const targetAngle = Math.atan2(moveX, moveZ);
        playerBody.rotation.y = BABYLON.Scalar.LerpAngle(playerBody.rotation.y, targetAngle, 10 * dt);

        if (isSprinting) {
          playerStamina = Math.max(0, playerStamina - dt * 20);
        }
      }

      if (!isSprinting) {
        playerStamina = Math.min(100, playerStamina + dt * 15);
      }

      camera.target = playerBody.position.clone();

      attackCooldown = Math.max(0, attackCooldown - dt);

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.mesh) continue;

        const dir = playerBody.position.subtract(e.mesh.position);
        dir.y = 0;
        const dist = dir.length();

        if (dist > 2) {
          dir.normalize();
          e.mesh.position.addInPlace(dir.scaleInPlace(e.speed * dt));
        } else if (e.attackCooldown <= 0) {
          playerHealth = Math.max(0, playerHealth - e.damage);
          e.attackCooldown = 1.5;
        }

        e.attackCooldown = Math.max(0, e.attackCooldown - dt);

        if (e.health <= 0) {
          if (Math.random() < 0.3) {
            const pickup = BABYLON.MeshBuilder.CreateSphere(`pickup_${Date.now()}`, { diameter: 0.4 }, scene);
            pickup.position = e.mesh.position.clone();
            pickup.position.y = 0.3;
            pickup.material = pickupMat;
            pickups.push({ mesh: pickup, type: "health", value: 15 });
          }
          e.mesh.dispose();
          enemies.splice(i, 1);
        }
      }

      for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (playerBody.position.subtract(p.mesh.position).length() < 1.5) {
          if (p.type === "health") {
            playerHealth = Math.min(100, playerHealth + p.value);
          }
          p.mesh.dispose();
          pickups.splice(i, 1);
        }
      }

      if (enemies.length === 0) {
        waveDelay += dt;
        if (waveDelay > 3) {
          currentWave++;
          spawnWave(currentWave);
          waveDelay = 0;
        }
      }

      setGameState({
        health: playerHealth,
        maxHealth: 100,
        stamina: playerStamina,
        maxStamina: 100,
        wave: currentWave,
        enemiesRemaining: enemies.length,
        isLoaded: true
      });

      scene.render();
    });

    const handleAttack = () => {
      if (attackCooldown > 0) return;
      attackCooldown = 0.5;

      for (const e of enemies) {
        const dist = playerBody.position.subtract(e.mesh.position).length();
        if (dist < 2.5) {
          e.health -= 25;
          const knockback = e.mesh.position.subtract(playerBody.position).normalize().scale(1.5);
          e.mesh.position.addInPlace(knockback);
        }
      }
    };

    (window as any).gameAttack = handleAttack;

    window.addEventListener("resize", () => engine.resize());

    gameRef.current = {
      dispose: () => {
        engine.stopRenderLoop();
        scene.dispose();
        engine.dispose();
      }
    };

    setGameState(s => ({ ...s, isLoaded: true }));
  };

  const handleJoystickMove = (x: number, y: number) => {
    moveRef.current = { x, y };
  };

  const handleAttack = () => {
    if ((window as any).gameAttack) {
      (window as any).gameAttack();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden touch-none">
      <canvas ref={canvasRef} className="w-full h-full touch-none" />

      {!gameState.isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-cyan-400 font-mono animate-pulse">Loading Babylon.js...</div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none">
        <div className="bg-black/60 backdrop-blur rounded-lg p-3 inline-block">
          <div className="text-cyan-400 font-display text-sm mb-2">WAVE {gameState.wave}</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-red-400 w-8">HP</span>
              <div className="w-28 h-3 bg-gray-800 rounded-full overflow-hidden border border-red-900/50">
                <div 
                  className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all" 
                  style={{ width: `${(gameState.health / gameState.maxHealth) * 100}%` }} 
                />
              </div>
              <span className="text-white/60 font-mono w-10">{Math.round(gameState.health)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 w-8">STA</span>
              <div className="w-28 h-3 bg-gray-800 rounded-full overflow-hidden border border-green-900/50">
                <div 
                  className="h-full bg-gradient-to-r from-green-700 to-green-500 transition-all" 
                  style={{ width: `${(gameState.stamina / gameState.maxStamina) * 100}%` }} 
                />
              </div>
              <span className="text-white/60 font-mono w-10">{Math.round(gameState.stamina)}</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-orange-400">
            Enemies: {gameState.enemiesRemaining}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          data-testid="button-attack"
          onTouchStart={handleAttack}
          onClick={handleAttack}
          className="w-16 h-16 rounded-full bg-red-600/80 border-2 border-red-400 text-white font-bold text-xl active:scale-95 active:bg-red-500 transition-all shadow-lg"
          style={{ boxShadow: "0 0 20px rgba(255,0,0,0.3)" }}
        >
          ⚔️
        </button>
      </div>

      <Joystick onMove={handleJoystickMove} />

      <a
        href="/"
        data-testid="link-back"
        className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1.5 rounded text-cyan-400 text-xs hover:bg-black/80 border border-cyan-500/30"
      >
        ← Back
      </a>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/40 pointer-events-none">
        WASD/Joystick to move • SHIFT to sprint • Tap ⚔️ to attack
      </div>
    </div>
  );
}

function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
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
      data-testid="joystick-move"
      className="absolute left-4 bottom-20 w-32 h-32 rounded-full bg-white/10 touch-none border border-white/20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={stickRef}
        className="absolute w-14 h-14 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 border-2 border-cyan-400/50"
      />
    </div>
  );
}

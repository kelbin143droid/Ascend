#!/usr/bin/env bash
set -euo pipefail

echo "Creating project files..."

# Directories
mkdir -p src assets/models draco

# index.html
cat > index.html <<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover" />
  <title>Three.js Mobile RPG Survival - Starter</title>
  <style>
    html,body { height:100%; margin:0; background:#000; overflow:hidden; -webkit-tap-highlight-color: transparent; }
    #canvas { display:block; width:100%; height:100%; touch-action:none; }
    #ui { position: absolute; left:0; right:0; top:0; bottom:0; pointer-events:none; font-family: sans-serif; color:#fff; }
    .hud { position: absolute; left:12px; top:12px; pointer-events:none; background:rgba(0,0,0,0.2); padding:8px; border-radius:6px; }
    .bottom-left { left:12px; bottom:12px; top:auto; }
    .bottom-right { right:12px; bottom:12px; top:auto; }
    #joy-left, #joy-right { position:absolute; width:140px; height:140px; border-radius:50%; background:rgba(255,255,255,0.06); pointer-events:auto; touch-action:none; }
    #joy-left { left:18px; bottom:18px; }
    #joy-right { right:18px; bottom:18px; }
    .stick { position:absolute; width:56px; height:56px; left:50%; top:50%; transform:translate(-50%,-50%); border-radius:50%; background:rgba(255,255,255,0.2); }
    button.small { pointer-events:auto; margin-left:6px; }
    .overlay-center { position:absolute; left:50%; top:10px; transform:translateX(-50%); pointer-events:none; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>

  <div id="ui">
    <div class="hud overlay-center" id="title">Mobile RPG Survival — Starter</div>
    <div class="hud" id="stats">HP: <span id="hp">100</span> | Hunger: <span id="hunger">100</span> | Stamina: <span id="sta">100</span></div>
    <div class="hud bottom-left" id="actions">
      <button id="actionBtn" class="small" style="pointer-events:auto">Interact</button>
      <button id="craftBtn" class="small" style="pointer-events:auto">Craft Fire</button>
    </div>
    <div class="hud bottom-right" id="minimap">Day: <span id="day">1</span></div>

    <!-- Touch joysticks -->
    <div id="joy-left"><div class="stick" id="stick-left"></div></div>
    <div id="joy-right"><div class="stick" id="stick-right"></div></div>
  </div>

  <script type="module" src="./src/main.js"></script>
</body>
</html>
HTML

# src/main.js
cat > src/main.js <<'JS'
import Game from './game.js';

const canvas = document.getElementById('canvas');
const game = new Game(canvas);

(async function init() {
  await game.init(); // loads models and sets up scene
  game.start();
})();

// Wire UI buttons (simple)
document.getElementById('actionBtn').addEventListener('click', () => game.player.tryInteract());
document.getElementById('craftBtn').addEventListener('click', () => game.player.craft('campfire'));
window.addEventListener('resize', () => game.onResize());
JS

# src/game.js
cat > src/game.js <<'JS'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/loaders/DRACOLoader.js';
import Player from './player.js';
import Enemy from './enemy.js';
import ResourceNode from './resourcenode.js';
import UI from './ui.js';

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x87ceeb); // daytime sky
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);

    this.loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/'); // host decoder at /draco/ if you use DRACO
    this.loader.setDRACOLoader(dracoLoader);

    this.entities = [];
    this.resourceNodes = [];
    this.player = new Player(this);
    this.ui = new UI(this);

    this.day = 1;
    this.lastSpawn = 0;
  }

  async init() {
    this.onResize();
    // Performance: clamp DPR for mobile
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(dpr);

    // Simple ground
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3b6a2f });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Lighting optimized for mobile
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff8e1, 0.7);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024); // keep shadow map small for mobile
    dir.shadow.camera.left = -50; dir.shadow.camera.right = 50;
    dir.shadow.camera.top = 50; dir.shadow.camera.bottom = -50;
    this.scene.add(dir);

    // Fog & ambient
    this.scene.fog = new THREE.Fog(0x87ceeb, 80, 300);

    // Camera starting position
    this.camera.position.set(0, 6, 12);
    this.camera.lookAt(0, 1.5, 0);

    // Load placeholder models (drop-in your optimized glb into /assets/models)
    await this.loadModels();

    // Spawn some resource nodes
    this.spawnResources();

    // Spawn a few enemies
    this.spawnEnemies(2);

    this.player.attachCamera(this.camera);
    await this.player.init();

    this.ui.initDOM(); // update HUD initially
  }

  async loadModels() {
    const paths = {
      player: './assets/models/player.glb',
      enemy: './assets/models/enemy.glb',
      tree: './assets/models/tree.glb',
      rock: './assets/models/rock.glb',
      campfire: './assets/models/campfire.glb'
    };

    this.models = {};
    const promises = Object.entries(paths).map(async ([k, p]) => {
      try {
        const gltf = await this.loader.loadAsync(p);
        this.models[k] = gltf.scene;
      } catch (err) {
        console.warn(\`Model \${k} failed to load from \${p}. Using placeholder box.\`, err);
        const placeholder = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({color:0xff00ff}));
        this.models[k] = placeholder;
      }
    });
    await Promise.all(promises);
  }

  spawnResources() {
    for (let i = 0; i < 30; i++) {
      const t = new ResourceNode(this, {
        type: Math.random() > 0.5 ? 'tree' : 'rock',
        position: new THREE.Vector3((Math.random()-0.5)*200, 0, (Math.random()-0.5)*200)
      });
      this.resourceNodes.push(t);
      this.scene.add(t.object);
    }
  }

  spawnEnemies(count=1) {
    for (let i=0;i<count;i++){
      const pos = new THREE.Vector3((Math.random()-0.5)*80,0,(Math.random()-0.5)*80);
      const enemy = new Enemy(this, pos);
      this.entities.push(enemy);
      this.scene.add(enemy.object);
    }
  }

  start() {
    this.renderer.setAnimationLoop(() => this.update());
  }

  update() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    const dayProgress = (t / 60) % 1; // 60 seconds per day for demo
    if (dayProgress < 0.6) {
      this.renderer.setClearColor(0x87ceeb);
      this.day = Math.floor(t/60)+1;
    } else {
      this.renderer.setClearColor(0x0a0f2a);
    }

    this.player.update(dt);
    for (const e of this.entities) e.update(dt);
    for (const r of this.resourceNodes) r.update(dt);

    if (t - this.lastSpawn > 25 + Math.random()*30) {
      this.spawnEnemies(1);
      this.lastSpawn = t;
    }

    this.entities = this.entities.filter(e => !e.removed);

    this.ui.updateHUD();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }
}
JS

# src/player.js
cat > src/player.js <<'JS'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import Controls from './controls.js';

export default class Player {
  constructor(game) {
    this.game = game;
    this.object = new THREE.Object3D();
    this.object.position.set(0, 0, 0);
    this.speed = 6; // units/sec
    this.health = 100;
    this.hunger = 100;
    this.stamina = 100;
    this.camera = null;
    this.controls = new Controls(this.game.canvas, this);
    this.inventory = { wood:0, stone:0 };
    this.nearby = null;
  }

  attachCamera(cam) {
    this.camera = cam;
    // Camera follows the player; simple third-person offset
    this.camera.position.set(0, 6, 12);
  }

  async init() {
    const model = this.game.models?.player?.clone();
    if (model) {
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }});
      model.scale.setScalar(1.4);
      this.object.add(model);
    }
    this.game.scene.add(this.object);
  }

  update(dt) {
    const move = this.controls.getMovementVector();
    if (move.lengthSq() > 0.0001) {
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      camDir.y = 0; camDir.normalize();
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), camDir).normalize();
      const forward = camDir;
      const worldMove = new THREE.Vector3();
      worldMove.addScaledVector(forward, -move.y);
      worldMove.addScaledVector(right, move.x);
      worldMove.normalize();
      this.object.position.addScaledVector(worldMove, this.speed * dt);
      const targetYaw = Math.atan2(worldMove.x, worldMove.z);
      this.object.rotation.y = THREE.MathUtils.lerp(this.object.rotation.y, targetYaw, 10 * dt);
      this.stamina = Math.max(0, this.stamina - dt*2);
    } else {
      this.stamina = Math.min(100, this.stamina + dt*6);
    }

    const desiredCamPos = new THREE.Vector3().copy(this.object.position).add(new THREE.Vector3(0, 6, 12).applyAxisAngle(new THREE.Vector3(0,1,0), this.object.rotation.y));
    this.camera.position.lerp(desiredCamPos, 10*dt);
    this.camera.lookAt(this.object.position.clone().add(new THREE.Vector3(0,2,0)));

    this.hunger = Math.max(0, this.hunger - dt*0.8);
    if (this.hunger <= 0) {
      this.health = Math.max(0, this.health - dt*5);
    }

    this.nearby = null;
    for (const rn of this.game.resourceNodes) {
      if (rn.object.position.distanceTo(this.object.position) < 3) {
        this.nearby = rn;
        break;
      }
    }
  }

  tryInteract() {
    if (this.nearby) {
      const gained = this.nearby.harvest();
      if (gained) {
        if (this.nearby.type === 'tree') this.inventory.wood += gained;
        if (this.nearby.type === 'rock') this.inventory.stone += gained;
      }
    }
  }

  craft(item) {
    if (item === 'campfire' && this.inventory.wood >= 3) {
      this.inventory.wood -= 3;
      const camp = (this.game.models?.campfire?.clone() || null);
      let campObj;
      if (camp) {
        campObj = camp;
      } else {
        campObj = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.2,8), new THREE.MeshStandardMaterial({color:0xffa500}));
      }
      campObj.position.copy(this.object.position).add(new THREE.Vector3(0,0.1, -2));
      this.game.scene.add(campObj);
      this.hunger = Math.min(100, this.hunger + 30);
      this.health = Math.min(100, this.health + 10);
    } else {
      // not enough resources
    }
  }
}
JS

# src/controls.js
cat > src/controls.js <<'JS'
export default class Controls {
  constructor(canvas, player) {
    this.canvas = canvas;
    this.player = player;
    this.move = { x:0, y:0 };
    this.lookDelta = { x:0, y:0 };
    this._initTouchUI();
    this._initPointer();
  }

  _initTouchUI() {
    this.joyLeft = document.getElementById('joy-left');
    this.stickLeft = document.getElementById('stick-left');
    this.joyRight = document.getElementById('joy-right');
    this.stickRight = document.getElementById('stick-right');

    this.leftId = null;
    this.rightId = null;

    this.joyLeft.addEventListener('touchstart', e => { e.preventDefault(); this.leftId = e.changedTouches[0].identifier; }, {passive:false});
    this.joyLeft.addEventListener('touchmove', e => { e.preventDefault(); this._onLeftMove(e); }, {passive:false});
    this.joyLeft.addEventListener('touchend', e => { e.preventDefault(); this.leftId = null; this.stickLeft.style.transform = 'translate(-50%,-50%)'; this.move.x = 0; this.move.y = 0; }, {passive:false});

    this.joyRight.addEventListener('touchstart', e => { e.preventDefault(); this.rightId = e.changedTouches[0].identifier; }, {passive:false});
    this.joyRight.addEventListener('touchmove', e => { e.preventDefault(); this._onRightMove(e); }, {passive:false});
    this.joyRight.addEventListener('touchend', e => { e.preventDefault(); this.rightId = null; this.stickRight.style.transform = 'translate(-50%,-50%)'; this.lookDelta.x = 0; this.lookDelta.y = 0; }, {passive:false});
  }

  _onLeftMove(e) {
    const t = Array.from(e.changedTouches).find(t => t.identifier === this.leftId) || e.changedTouches[0];
    if (!t) return;
    const rect = this.joyLeft.getBoundingClientRect();
    const x = (t.clientX - (rect.left + rect.width/2)) / (rect.width/2);
    const y = (t.clientY - (rect.top + rect.height/2)) / (rect.height/2);
    const nx = Math.max(-1, Math.min(1, x));
    const ny = Math.max(-1, Math.min(1, y));
    this.move.x = nx;
    this.move.y = ny;
    this.stickLeft.style.transform = \`translate(\${nx*36}px, \${ny*36}px)\`;
  }

  _onRightMove(e) {
    const t = Array.from(e.changedTouches).find(t => t.identifier === this.rightId) || e.changedTouches[0];
    if (!t) return;
    const rect = this.joyRight.getBoundingClientRect();
    const x = (t.clientX - (rect.left + rect.width/2)) / (rect.width/2);
    const y = (t.clientY - (rect.top + rect.height/2)) / (rect.height/2);
    this.lookDelta.x = x;
    this.lookDelta.y = y;
    this.stickRight.style.transform = \`translate(\${x*36}px, \${y*36}px)\`;
    if (this.player && this.player.object) {
      this.player.object.rotation.y -= this.lookDelta.x * 0.02;
    }
  }

  _initPointer() {
    window.addEventListener('keydown', e => {
      if (e.key === 'w') this.move.y = -1;
      if (e.key === 's') this.move.y = 1;
      if (e.key === 'a') this.move.x = -1;
      if (e.key === 'd') this.move.x = 1;
    });
    window.addEventListener('keyup', e => {
      if (['w','s'].includes(e.key)) this.move.y = 0;
      if (['a','d'].includes(e.key)) this.move.x = 0;
    });
    let dragging = false, prevX=0;
    this.canvas.addEventListener('pointerdown', e => { dragging = true; prevX = e.clientX; });
    this.canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = (e.clientX - prevX) / window.innerWidth;
      prevX = e.clientX;
      if (this.player && this.player.object) this.player.object.rotation.y -= dx * 4.0;
    });
    this.canvas.addEventListener('pointerup', e => { dragging = false; });
  }

  getMovementVector() {
    return { x: this.move.x, y: this.move.y, lengthSq: () => (this.move.x*this.move.x + this.move.y*this.move.y) };
  }
}
JS

# src/resourcenode.js
cat > src/resourcenode.js <<'JS'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

export default class ResourceNode {
  constructor(game, {type='tree', position=new THREE.Vector3()}) {
    this.game = game;
    this.type = type;
    this.object = (game.models?.[type]?.clone() || this._placeholder());
    this.object.position.copy(position);
    this.object.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }});
    this.maxHarvests = type === 'tree' ? 2 : 1;
    this.harvestsLeft = this.maxHarvests;
  }

  _placeholder() {
    if (this.type === 'tree') return new THREE.Mesh(new THREE.ConeGeometry(0.8,2,6), new THREE.MeshStandardMaterial({color:0x2b8a3e}));
    return new THREE.Mesh(new THREE.DodecahedronGeometry(0.7), new THREE.MeshStandardMaterial({color:0x888888}));
  }

  harvest() {
    if (this.harvestsLeft <= 0) return 0;
    this.harvestsLeft--;
    if (this.harvestsLeft === 0) {
      this.object.visible = false;
      setTimeout(() => {
        this.harvestsLeft = this.maxHarvests;
        this.object.visible = true;
      }, 60_000);
    }
    return this.type === 'tree' ? 1 : 1;
  }

  update(dt) {
    const camPos = this.game.camera.position;
    if (this.object.position.distanceToSquared(camPos) > 300*300) return;
  }
}
JS

# src/enemy.js
cat > src/enemy.js <<'JS'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

export default class Enemy {
  constructor(game, position) {
    this.game = game;
    this.object = (game.models?.enemy?.clone() || this._placeholder());
    this.object.position.copy(position);
    this.object.traverse(c => { if (c.isMesh) { c.castShadow = true; }});
    this.speed = 2.2;
    this.health = 30;
    this.removed = false;
  }

  _placeholder() {
    return new THREE.Mesh(new THREE.SphereGeometry(0.6,8,6), new THREE.MeshStandardMaterial({color:0xff4444}));
  }

  update(dt) {
    if (this.removed) return;
    const playerPos = this.game.player.object.position;
    const dir = playerPos.clone().sub(this.object.position);
    const dist = dir.length();
    if (dist > 0.1) {
      dir.normalize();
      this.object.position.addScaledVector(dir, this.speed * dt);
      this.object.lookAt(playerPos.clone().setY(this.object.position.y));
    }
    if (dist < 2.0) {
      this.game.player.health = Math.max(0, this.game.player.health - dt*6);
    }
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.removed = true;
    this.object.visible = false;
    this.game.player.inventory.wood += 1;
    setTimeout(() => { if (this.object.parent) this.object.parent.remove(this.object); }, 2000);
  }
}
JS

# src/ui.js
cat > src/ui.js <<'JS'
export default class UI {
  constructor(game) {
    this.game = game;
    this.hpEl = document.getElementById('hp');
    this.hungerEl = document.getElementById('hunger');
    this.staEl = document.getElementById('sta');
    this.dayEl = document.getElementById('day');
  }

  initDOM() {
    this.updateHUD();
  }

  updateHUD() {
    const p = this.game.player;
    if (!p) return;
    this.hpEl.textContent = Math.floor(p.health);
    this.hungerEl.textContent = Math.floor(p.hunger);
    this.staEl.textContent = Math.floor(p.stamina);
    this.dayEl.textContent = this.game.day;
  }
}
JS

# server.js
cat > server.js <<'NODE'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
NODE

# package.json
cat > package.json <<'PKG'
{
  "name": "threejs-mobile-rpg-starter",
  "version": "1.0.0",
  "description": "Mobile-first Three.js RPG survival starter (served via simple Express server).",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=14"
  }
}
PKG

# .replit
cat > .replit <<'REPL'
run = "npm start"
REPL

# assets/README.md (markdown)
cat > assets/README.md <<'MARKDOWN'
````markdown name=assets/README.md
Place optimized mobile models here (recommended formats: .glb, with DRACO compression and KTX2 textures for mobile).

Expected filenames (used by the starter code):
- player.glb       (low-poly player model)
- enemy.glb        (low-poly enemy)
- tree.glb         (low poly tree; include LOD if possible)
- rock.glb         (low poly rock)
- campfire.glb     (small campfire model)

Tips for mobile:
- Use GLB with Draco compression and KTX2 (Basis Universal) textures.
- Keep triangle counts low (< 5k per model if possible).
- Bake lighting into albedo or use lightmaps for static objects (reduces runtime lights).
- Reduce material count; prefer single-material meshes.
- Reuse geometries and use instancing for many identical props.
- Host DRACO decoder in /draco/ (or remove DRACO loader and models must be uncompressed).
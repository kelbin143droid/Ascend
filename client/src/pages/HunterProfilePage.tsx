import { useState, useEffect, Suspense, useMemo } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGame } from "@/context/GameContext";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { StatIntroModal } from "@/components/game/StatIntroModal";

// ── Types ────────────────────────────────────────────────────────────────
interface WalletEntry { type: "gem" | "coin" | "diamond"; value: number }
interface ClassEntry  { name: string; lv: number; color: string; desc: string }
interface StatEntry   { key: string; val: number; pending: number; color: string; icon: string }
interface EquipEntry  { type: string; filled?: boolean; plus?: number; unlockLv?: number }
interface SkillEntry  { name?: string; lv?: number; icon?: string; color?: string; locked?: boolean; unlockLv?: number }
interface PlayerData  {
  name: string; rank: string; role: string; level: number;
  xp: number; xpMax: number; combatPower: number; characterImage: string | null;
  wallet: WalletEntry[]; chosenClass: number | null; classes: ClassEntry[];
  availablePoints: number; cpPerPoint: number;
  stats: StatEntry[]; equipment: EquipEntry[]; skills: SkillEntry[];
  streakMultiplier?: number;
}

// ── SVG path data (verbatim from original design) ────────────────────────
const ICONS: Record<string, string> = {
  fist:   '<path d="M7 11V7a2 2 0 014 0M11 11V6a2 2 0 014 0v5M15 11V8a2 2 0 014 0v6a6 6 0 01-6 6h-2a6 6 0 01-5-3l-2-3a1.5 1.5 0 012.5-1.5L7 13"/>',
  wing:   '<path d="M2 12c6-1 8-4 10-8 2 4 4 7 10 8-6 1-8 4-10 8-2-4-4-7-10-8z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  eye:    '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  spark:  '<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/>',
  crown:  '<path d="M3 8l4 4 5-7 5 7 4-4v9H3z"/>',
};
const EQICON: Record<string, string> = {
  weapon: '<path d="M14.5 4l5.5 5.5L9 20.5 3.5 15z" stroke="#9fc4e6" fill="none" strokeWidth="1.5"/>',
  helmet: '<path d="M6 14a6 6 0 0112 0v4H6zM9 18v2M15 18v2" stroke="#9fc4e6" fill="none" strokeWidth="1.5"/>',
  chest:  '<path d="M5 7l4-2 3 2 3-2 4 2-1 12H6z" stroke="#9fc4e6" fill="none" strokeWidth="1.5"/>',
  gloves: '<path d="M8 7v6M16 7v6a5 5 0 01-8 0M8 13l-2 2v3h12v-3l-2-2" stroke="#9fc4e6" fill="none" strokeWidth="1.5"/>',
  boots:  '<path d="M8 4v9l-3 3v3h10v-3a4 4 0 00-4-4V4z" stroke="#9fc4e6" fill="none" strokeWidth="1.5"/>',
};
const EMBLEM = '<path d="M12 2l3 5 5 1-3.5 4 1 5L12 19l-5.5 3 1-5L4 8l5-1z"/>';
const CLASS_DISPLAY_NAMES = ["Warrior", "Mage", "Assassin", "Archer"];
const CLASS_MODEL_PATHS = [
  "/assets/models/warrior.glb",
  "/assets/models/mage.glb",
  "/assets/models/rogue.glb",
  "/assets/models/rogue_hooded.glb",
];
const STAT_TOOLTIP_TEXT: Record<string, string> = {
  STR: "Damage and stamina.",
  AGI: "Attack speed and movement speed.",
  SEN: "Mana regeneration and cooldown reduction.",
  INT: "Crit chance and dodge chance.",
  VIT: "Defense and HP regeneration.",
  DIS: "Dungeon energy and reward chance.",
};
const SELECTED_GAME_CLASS_KEY = "ascend_selected_game_class";

function classDisplayName(index: number, fallback: string) {
  return CLASS_DISPLAY_NAMES[index] ?? fallback;
}

function classModelSrc(index: number) {
  return CLASS_MODEL_PATHS[index] ?? CLASS_MODEL_PATHS[0];
}

// ── Deterministic streak lines so the animation doesn't jump ────────────
const STREAKS = Array.from({ length: 14 }, (_, i) => ({
  left:     `${(i * 7.3 + 2) % 100}%`,
  duration: `${3 + (i * 0.37) % 4}s`,
  delay:    `-${(i * 0.71) % 5}s`,
}));

// ── CSS (scoped under .hp-root — verbatim design preserved) ─────────────
const CSS = `
.hp-root {
  --bg-0:#04060d; --bg-1:#070c18;
  --panel:rgba(12,22,42,0.55); --panel-edge:rgba(76,170,255,0.28);
  --cyan:#4cc2ff; --cyan-soft:#7dd3fc; --cyan-glow:rgba(76,194,255,0.55);
  --ink:#e8f4ff; --ink-dim:#7d93b3;
  --gold:#f5c542; --gem:#4cc2ff; --diamond:#c77dff;
  --str:#ff5158; --agi:#3ee07f; --vit:#4ca3ff;
  --sen:#b46cff; --int:#2ee6e0; --dis:#f5b942;
}
.hp-root * { margin:0; padding:0; box-sizing:border-box; }
.hp-root {
  background: radial-gradient(120% 80% at 50% -10%, #0c1b38 0%, var(--bg-0) 55%), var(--bg-0);
  min-height:100vh; display:flex; align-items:flex-start; justify-content:center;
  font-family:'Rajdhani',sans-serif; padding:0 0 32px;
}
.hp-root .phone {
  width:100%; max-width:470px;
  background:
    linear-gradient(180deg, rgba(2,7,16,.1) 0%, rgba(2,7,16,.26) 42%, rgba(2,6,14,.82) 100%),
    url("/hunter-profile-bg.jpg") center top / cover no-repeat,
    #04070f;
  border:1px solid rgba(76,170,255,0.12);
  border-top:none; position:relative; overflow:hidden;
  box-shadow:0 40px 120px rgba(0,0,0,0.7),0 0 60px rgba(76,194,255,0.08);
}
.hp-root .phone::after {
  content:""; position:absolute; inset:0;
  background:
    radial-gradient(circle at 50% 30%, rgba(76,194,255,.12), transparent 34%),
    linear-gradient(90deg, rgba(1,4,10,.72), transparent 24%, transparent 76%, rgba(1,4,10,.72));
  pointer-events:none; z-index:0;
}
.hp-root .phone::before {
  content:""; position:absolute; inset:0;
  background-image:repeating-linear-gradient(90deg,transparent 0 38px,rgba(76,194,255,0.035) 38px 39px);
  pointer-events:none; z-index:0;
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent);
  mask-image:linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent);
}
.hp-root .streaks { position:absolute; inset:0; overflow:hidden; z-index:0; pointer-events:none; }
.hp-root .streaks span {
  position:absolute; top:-40%; width:1px; height:40%;
  background:linear-gradient(180deg,transparent,var(--cyan),transparent);
  opacity:0.25; animation:hp-fall linear infinite;
}
@keyframes hp-fall { to { transform:translateY(360%); } }
.hp-root .screen { position:relative; z-index:1; padding:14px 16px 0; }
.hp-root .back-btn {
  width:36px; height:36px; flex:none; display:grid; place-items:center;
  background:rgba(4,6,13,0.52); border:1px solid rgba(76,170,255,0.24); border-radius:10px;
  color:var(--cyan-soft); font-family:'Chakra Petch',sans-serif;
  font-weight:700; font-size:18px;
  cursor:pointer;
}
.hp-root .back-btn:hover { color:var(--ink); }

/* topbar */
.hp-root .topbar { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.hp-root .logo { font-family:'Chakra Petch'; font-weight:700; line-height:0.9; }
.hp-root .logo b { display:block; font-size:23px; letter-spacing:1px; color:var(--ink); text-shadow:0 0 18px var(--cyan-glow); }
.hp-root .logo small { display:block; font-size:11px; letter-spacing:6px; color:var(--cyan); }
.hp-root .wallet { display:flex; gap:6px; align-items:center; }
.hp-root .coinpill {
  display:flex; align-items:center; gap:5px;
  background:rgba(10,18,34,0.8); border:1px solid rgba(76,170,255,0.22);
  border-radius:20px; padding:5px 10px;
  font-weight:700; font-size:13px; color:var(--ink);
}
.hp-root .coinpill svg { width:15px; height:15px; }
.hp-root .addbtn {
  width:30px; height:30px; border-radius:50%;
  border:1px solid rgba(76,170,255,0.3);
  background:rgba(10,18,34,0.8); color:var(--cyan);
  font-size:18px; cursor:pointer; line-height:1;
}

/* identity */
.hp-root .identity { display:flex; align-items:center; gap:14px; margin-top:18px; }
.hp-root .rankbadge { width:60px; height:68px; flex:none; position:relative; display:grid; place-items:center; }
.hp-root .rankbadge .hex {
  position:absolute; inset:0;
  clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);
  background:linear-gradient(160deg,#5a6678,#2a3242);
  box-shadow:inset 0 0 0 2px rgba(255,255,255,0.18);
}
.hp-root .rankbadge .hex.inner { inset:4px; background:linear-gradient(160deg,#1a2030,#0c1018); }
.hp-root .rankbadge b { position:relative; font-family:'Chakra Petch'; font-size:26px; font-weight:700; color:#cdd6e3; }
.hp-root .who { flex:1; }
.hp-root .who h1 { font-family:'Chakra Petch'; font-size:26px; font-weight:700; color:var(--ink); line-height:1; }
.hp-root .who .rank { color:var(--cyan); font-weight:700; letter-spacing:2px; font-size:13px; margin-top:3px; }
.hp-root .who .role { color:var(--ink-dim); font-size:13px; letter-spacing:1px; display:flex; align-items:center; gap:5px; margin-top:2px; }
.hp-root .lvhex { width:64px; height:70px; flex:none; position:relative; display:grid; place-items:center; }
.hp-root .lvhex::before {
  content:""; position:absolute; inset:0;
  clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);
  background:linear-gradient(160deg,rgba(76,194,255,0.25),rgba(12,22,42,0.9));
  box-shadow:inset 0 0 0 1.5px var(--cyan-glow),0 0 22px rgba(76,194,255,0.25);
}
.hp-root .lvhex small { position:relative; color:var(--cyan-soft); font-size:10px; letter-spacing:1px; }
.hp-root .lvhex b { position:relative; font-family:'Chakra Petch'; font-size:22px; color:var(--ink); }

/* xp */
.hp-root .xp { margin-top:14px; }
.hp-root .xptrack { height:9px; border-radius:6px; background:rgba(255,255,255,0.06); border:1px solid rgba(76,170,255,0.18); overflow:hidden; }
.hp-root .xpfill {
  height:100%; width:0;
  background:linear-gradient(90deg,#2a86ff,var(--cyan),var(--cyan-soft));
  box-shadow:0 0 12px var(--cyan-glow); border-radius:6px;
  transition:width 1.4s cubic-bezier(.2,.8,.2,1);
}
.hp-root .xplabel { text-align:right; color:var(--ink-dim); font-size:12px; font-weight:600; margin-top:5px; }

/* main grid */
.hp-root .main { margin-top:10px; }
.hp-root .coltitle { color:var(--ink-dim); font-size:12px; letter-spacing:3px; font-weight:700; margin-bottom:8px; }

/* class cards */
.hp-root .classcard {
  width:100%; display:block; color:inherit; font:inherit; appearance:none;
  background:var(--panel); border:1px solid rgba(76,170,255,0.12);
  border-radius:12px; padding:10px 4px; text-align:center; margin-bottom:8px;
  cursor:pointer; transition:.2s; position:relative;
}
.hp-root .classcard:hover { border-color:rgba(76,170,255,0.4); transform:translateY(-1px); }
.hp-root .classcard.active {
  border-color:var(--cyan);
  background:linear-gradient(180deg,rgba(76,194,255,0.16),rgba(12,22,42,0.4));
  box-shadow:0 0 18px rgba(76,194,255,0.25),inset 0 0 14px rgba(76,194,255,0.12);
}
.hp-root .classcard.preview:not(.active) {
  border-color:rgba(76,194,255,0.55);
  background:rgba(76,194,255,0.10);
}
.hp-root .classcard .emblem { width:34px; height:34px; margin:0 auto 4px; }
.hp-root .classcard .cname { font-family:'Chakra Petch'; font-size:12px; font-weight:700; color:var(--ink); letter-spacing:1px; }
.hp-root .classcard .clv { font-size:11px; color:var(--ink-dim); }
.hp-root .classnote { color:var(--ink-dim); font-size:11px; text-align:center; line-height:1.3; margin-top:2px; }
.hp-root .otherstoggle {
  width:100%; margin:2px 0 6px; background:rgba(8,14,26,0.6);
  border:1px dashed rgba(76,170,255,0.3); border-radius:10px; color:var(--ink-dim);
  font-family:'Chakra Petch'; font-weight:700; font-size:10px; letter-spacing:1px;
  padding:8px 4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:.2s;
}
.hp-root .otherstoggle:hover { border-color:var(--cyan); color:var(--cyan-soft); }
.hp-root .otherstoggle .chev { transition:transform .25s; display:inline-block; font-size:13px; }
.hp-root .otherstoggle.open .chev { transform:rotate(90deg); }

/* class picker overlay */
.hp-root .classpick {
  position:fixed; top:0; bottom:0; left:50%; right:auto; transform:translateX(-50%);
  width:min(100%,470px); z-index:50; display:flex; align-items:stretch; justify-content:center;
  padding:max(10px, calc(env(safe-area-inset-top, 0px) + 8px)) 14px max(14px, calc(env(safe-area-inset-bottom, 0px) + 12px));
  background:
    radial-gradient(circle at 50% 18%, rgba(76,194,255,.24), transparent 30%),
    linear-gradient(180deg, rgba(8,28,52,.92), rgba(3,7,16,.96) 52%, rgba(4,7,15,.98));
  backdrop-filter:blur(4px);
  overflow:hidden;
}
.hp-root .classpick-inner {
  width:100%; height:100%; max-width:430px; min-height:0;
  display:grid; grid-template-rows:auto minmax(0, 1fr) auto auto;
  gap:8px; animation:hp-rise .4s cubic-bezier(.2,.8,.2,1);
}
@keyframes hp-rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
.hp-root .pickhud {
  position:relative; display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:10px; align-items:center;
  padding:8px 10px; border:1px solid rgba(164,219,255,.42); border-radius:11px;
  background:linear-gradient(180deg, rgba(96,188,255,.24), rgba(16,48,88,.42));
  box-shadow:0 0 24px rgba(76,194,255,.22), inset 0 0 18px rgba(255,255,255,.06);
}
.hp-root .pickhud:before,
.hp-root .pickhud:after {
  content:""; position:absolute; top:50%; width:18px; height:1px; background:rgba(245,197,66,.75);
}
.hp-root .pickhud:before { left:8px; transform:translate(-100%,-50%); }
.hp-root .pickhud:after { right:8px; transform:translate(100%,-50%); }
.hp-root .pickrank {
  width:38px; height:38px; display:grid; place-items:center; border-radius:10px;
  color:#bdeaff; font-family:'Orbitron'; font-weight:900; font-size:18px;
  border:1px solid rgba(137,214,255,.55); background:rgba(9,29,55,.82);
  box-shadow:inset 0 0 14px rgba(76,194,255,.18);
}
.hp-root .pickhud-main { min-width:0; }
.hp-root .pickhunter {
  font-family:'Chakra Petch'; font-weight:800; color:var(--ink); font-size:17px; letter-spacing:1px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.hp-root .pickrole {
  margin-top:2px; font-family:'Chakra Petch'; color:#b6d7ed; font-size:11px; letter-spacing:1px;
  text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.hp-root .pickhud-xp { display:flex; flex-direction:column; align-items:flex-end; gap:5px; min-width:100px; }
.hp-root .pickhud-level { color:#f5c542; font-family:'Chakra Petch'; font-weight:800; font-size:12px; letter-spacing:1px; }
.hp-root .pickhud-track {
  width:88px; height:8px; border:1px solid rgba(255,255,255,.25); border-radius:999px; overflow:hidden;
  background:rgba(2,7,15,.72);
}
.hp-root .pickhud-fill {
  height:100%; border-radius:999px; background:linear-gradient(90deg,#279dff,#73d9ff,#f5c542);
  box-shadow:0 0 12px rgba(76,194,255,.55);
}
.hp-root .pickhud-label { font-size:10px; color:#c7d8e6; font-family:'Chakra Petch'; font-weight:700; letter-spacing:.5px; }
.hp-root .profilehud {
  position:relative; display:grid; grid-template-columns:auto auto minmax(0,1fr) auto; gap:9px; align-items:center;
  padding:9px 10px; border:1px solid rgba(164,219,255,.38); border-radius:12px;
  background:linear-gradient(180deg, rgba(96,188,255,.2), rgba(16,48,88,.36));
  box-shadow:0 0 22px rgba(76,194,255,.2), inset 0 0 18px rgba(255,255,255,.05);
}
.hp-root .profilehud .pickrank { width:38px; height:38px; font-size:17px; }
.hp-root .profilehud .pickhunter { font-size:17px; }
.hp-root .profilehud .pickrole { font-size:10px; }
.hp-root .profilehud .pickhud-xp { min-width:92px; }
.hp-root .profilehud .pickhud-track { width:88px; }
.hp-root .profilehud .pickhud-label { font-size:9px; }
.hp-root .pickpreview {
  position:relative; width:100%; min-height:0; height:100%;
  display:flex; align-items:center; justify-content:center; overflow:hidden;
}
.hp-root .pickaura {
  position:absolute; bottom:11%; left:50%; transform:translateX(-50%);
  width:min(62%, 245px); aspect-ratio:1; border-radius:50%; filter:blur(24px); opacity:.42; transition:background .3s;
}
.hp-root .pickpreview .platform { width:min(58%, 215px); bottom:6%; }
.hp-root .pickmodel { position:absolute; inset:-2% 0 3%; z-index:2; pointer-events:none; }
.hp-root .pickrow { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
.hp-root .pickopt {
  min-height:48px; background:linear-gradient(180deg, rgba(20,32,55,.86), rgba(8,13,27,.92));
  border:1px solid rgba(76,170,255,0.18); border-radius:9px; padding:9px 10px; cursor:pointer; transition:.2s;
  display:flex; align-items:center; justify-content:center; gap:9px; position:relative; overflow:hidden;
  box-shadow:inset 0 0 12px rgba(255,255,255,.03);
}
.hp-root .pickopt:before {
  content:""; position:absolute; inset:0; opacity:0; transition:.2s;
  background:linear-gradient(90deg, rgba(76,194,255,.22), transparent 62%);
}
.hp-root .pickopt svg { width:22px; height:22px; flex:0 0 auto; position:relative; z-index:1; }
.hp-root .pickopt span {
  font-family:'Chakra Petch'; font-weight:800; font-size:13px; letter-spacing:1.4px; color:var(--ink-dim);
  position:relative; z-index:1; text-transform:uppercase;
}
.hp-root .pickopt:hover { border-color:rgba(76,170,255,0.45); }
.hp-root .pickopt.sel { border-color:var(--cyan); box-shadow:0 0 16px rgba(76,194,255,0.25), inset 0 0 18px rgba(76,194,255,0.12); }
.hp-root .pickopt.sel:before { opacity:1; }
.hp-root .pickopt.sel span { color:var(--ink); }
.hp-root .pickconfirm {
  width:100%; border-radius:12px; padding:12px; cursor:pointer; transition:.2s;
  background:linear-gradient(180deg,rgba(88,196,255,0.42),rgba(18,66,126,0.82));
  border:1.5px solid rgba(174,228,255,.86); color:var(--ink);
  font-family:'Chakra Petch'; font-weight:800; font-size:16px; letter-spacing:2px;
  box-shadow:0 0 22px rgba(76,194,255,0.32), inset 0 0 18px rgba(255,255,255,.08);
}
.hp-root .pickconfirm:hover { box-shadow:0 0 28px var(--cyan-glow); }
.hp-root .pickconfirm.disabled { opacity:.35; pointer-events:none; box-shadow:none; }
@media (max-height: 740px) {
  .hp-root .classpick { padding:max(8px, calc(env(safe-area-inset-top, 0px) + 6px)) 14px max(10px, calc(env(safe-area-inset-bottom, 0px) + 8px)); }
  .hp-root .classpick-inner { gap:7px; }
  .hp-root .pickhud { padding:7px 9px; }
  .hp-root .pickrank { width:34px; height:34px; font-size:15px; }
  .hp-root .pickhunter { font-size:15px; }
  .hp-root .pickrole { font-size:10px; }
  .hp-root .pickhud-xp { min-width:86px; }
  .hp-root .pickhud-track { width:82px; height:8px; }
  .hp-root .pickhud-label { display:none; }
  .hp-root .pickrow { gap:7px; }
  .hp-root .pickopt { min-height:43px; padding:7px 8px; gap:7px; }
  .hp-root .pickopt svg { width:19px; height:19px; }
  .hp-root .pickopt span { font-size:11px; letter-spacing:1px; }
  .hp-root .pickconfirm { padding:10px; font-size:14px; }
  .hp-root .pickpreview .platform { width:min(52%, 190px); bottom:5%; }
  .hp-root .pickaura { width:min(56%, 215px); bottom:10%; }
}
@media (max-height: 650px) {
  .hp-root .pickhud-label { display:none; }
  .hp-root .pickhud { padding:6px 8px; }
  .hp-root .pickrow { gap:6px; }
  .hp-root .pickopt { min-height:38px; padding:6px 8px; }
  .hp-root .pickconfirm { padding:9px; font-size:13px; }
}

/* stage / character */
.hp-root .stage { position:relative; display:flex; flex-direction:column; align-items:center; min-height:0; }
.hp-root .charwrap {
  position:relative; width:100%; height:clamp(330px, 54vh, 460px);
  display:flex; align-items:flex-end; justify-content:center;
}
.hp-root .platform { position:absolute; bottom:2px; left:50%; transform:translateX(-50%); width:86%; aspect-ratio:3/1; }
.hp-root .platform .ring {
  position:absolute; inset:0; border-radius:50%;
  border:1.5px solid var(--cyan); opacity:0.5;
  box-shadow:0 0 24px var(--cyan-glow);
  animation:hp-pulse 3s ease-in-out infinite;
}
.hp-root .platform .ring:nth-child(2){ inset:14% 10%; opacity:.35; animation-delay:.6s; }
.hp-root .platform .ring:nth-child(3){ inset:28% 22%; opacity:.7;  animation-delay:1.2s; }
.hp-root .platform .core {
  position:absolute; left:50%; bottom:0; transform:translateX(-50%);
  width:40%; aspect-ratio:2/1; border-radius:50%;
  background:radial-gradient(closest-side,var(--cyan-soft),transparent);
  filter:blur(2px); opacity:.8;
}
@keyframes hp-pulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.04);opacity:.8} }
.hp-root .charimg { position:relative; height:108%; z-index:2; filter:drop-shadow(0 8px 26px rgba(76,194,255,0.4)); }
.hp-root .cp {
  margin-top:-8px; background:var(--panel); border:1px solid rgba(76,170,255,0.18);
  border-radius:11px; padding:6px 14px; text-align:center; min-width:140px;
}
.hp-root .cp .val {
  font-family:'Chakra Petch'; font-size:22px; font-weight:700; color:var(--cyan-soft);
  display:flex; align-items:center; gap:8px; justify-content:center; text-shadow:0 0 14px var(--cyan-glow);
}
.hp-root .cp .lbl { color:var(--ink-dim); font-size:11px; letter-spacing:2px; font-weight:700; }

/* stats */
.hp-root .statcard { background:var(--panel); border:1px solid rgba(76,170,255,0.12); border-radius:12px; padding:8px 10px; margin-bottom:8px; }
.hp-root .statcard { position:relative; overflow:visible; }
.hp-root .statcard .row { display:flex; align-items:center; gap:5px; }
.hp-root .statcard .row svg { width:16px; height:16px; flex:none; }
.hp-root .statcard .nm {
  font-family:'Chakra Petch'; font-weight:700; font-size:13px; letter-spacing:1px; flex:1;
  border:0; background:transparent; text-align:left; padding:0; cursor:pointer;
}
.hp-root .statcard .nm:hover { text-shadow:0 0 10px currentColor; }
.hp-root .stattip {
  position:absolute; left:8px; right:8px; bottom:calc(100% + 6px); z-index:110;
  padding:7px 9px; border-radius:9px; text-align:center;
  background:rgba(3,10,24,0.96); border:1px solid rgba(76,194,255,0.42);
  box-shadow:0 0 18px rgba(76,194,255,0.26);
  color:rgba(232,244,255,0.94); font-size:11px; font-weight:800; letter-spacing:.5px;
}
.hp-root .stathelp {
  margin-bottom:10px; padding:9px 11px; border-radius:12px;
  background:linear-gradient(135deg, rgba(76,194,255,0.12), rgba(12,22,42,0.34));
  border:1px solid rgba(76,194,255,0.24);
  color:rgba(232,244,255,0.78); font-size:12px; line-height:1.25;
}
.hp-root .stathelp b { color:var(--cyan); font-family:'Chakra Petch'; letter-spacing:1px; }
.hp-root .statcard .num { font-family:'Chakra Petch'; font-weight:700; color:var(--ink); display:flex; align-items:center; gap:3px; font-size:17px; }
.hp-root .statcard .num .base   { font-size:12px; color:var(--ink-dim); }
.hp-root .statcard .num .arrow  { font-size:11px; color:var(--ink-dim); }
.hp-root .statcard .num .staged { font-size:16px; color:var(--cyan-soft); text-shadow:0 0 8px var(--cyan-glow); }
.hp-root .plusbtn {
  width:26px; height:26px; flex:none; border-radius:7px; cursor:pointer;
  background:rgba(76,194,255,0.14); border:1px solid var(--cyan); color:var(--cyan-soft);
  font-family:'Chakra Petch'; font-size:18px; font-weight:700; line-height:1;
  display:grid; place-items:center; transition:.15s; box-shadow:0 0 10px rgba(76,194,255,0.2);
}
.hp-root .plusbtn:hover { background:var(--cyan); color:#04070f; box-shadow:0 0 16px var(--cyan-glow); }
.hp-root .plusbtn.disabled { opacity:.3; cursor:default; pointer-events:none; box-shadow:none; }
.hp-root .minusbtn {
  width:24px; height:24px; flex:none; border-radius:7px; cursor:pointer;
  background:rgba(255,255,255,0.04); border:1px solid rgba(76,170,255,0.28); color:var(--ink-dim);
  font-family:'Chakra Petch'; font-size:17px; font-weight:700; line-height:1;
  display:grid; place-items:center; transition:.15s;
}
.hp-root .minusbtn:hover { border-color:var(--cyan); color:var(--cyan-soft); }
.hp-root .minusbtn.disabled { opacity:.25; cursor:default; pointer-events:none; }
.hp-root .confirmrow { display:flex; gap:8px; margin:10px 0 8px; }
.hp-root .confirmbtn {
  flex:2; border-radius:10px; padding:11px; cursor:pointer; transition:.2s;
  background:linear-gradient(180deg,rgba(76,194,255,0.3),rgba(20,60,110,0.6));
  border:1.5px solid var(--cyan); color:var(--ink);
  font-family:'Chakra Petch'; font-weight:700; font-size:13px; letter-spacing:1px;
  box-shadow:0 0 16px rgba(76,194,255,0.25);
}
.hp-root .confirmbtn:hover { box-shadow:0 0 26px var(--cyan-glow); }
.hp-root .confirmbtn.disabled { opacity:.35; pointer-events:none; box-shadow:none; }
.hp-root .cancelbtn {
  flex:1; border-radius:10px; padding:11px; cursor:pointer; transition:.2s;
  background:transparent; border:1px solid rgba(76,170,255,0.25); color:var(--ink-dim);
  font-family:'Chakra Petch'; font-weight:700; font-size:13px; letter-spacing:1px;
}
.hp-root .cancelbtn:hover { border-color:var(--cyan); color:var(--cyan-soft); }
.hp-root .cancelbtn.disabled { opacity:.35; pointer-events:none; }
.hp-root .points {
  display:flex; align-items:center; justify-content:space-between;
  background:linear-gradient(90deg,rgba(76,194,255,0.18),rgba(12,22,42,0.3));
  border:1px solid var(--cyan); border-radius:12px; padding:8px 14px; margin-bottom:10px;
  box-shadow:0 0 16px rgba(76,194,255,0.18);
}
.hp-root .points span { font-family:'Chakra Petch'; font-weight:600; font-size:12px; letter-spacing:2px; color:var(--cyan-soft); }
.hp-root .points b { font-family:'Chakra Petch'; font-weight:700; font-size:22px; color:var(--ink); text-shadow:0 0 12px var(--cyan-glow); }
.hp-root .points.empty { border-color:rgba(76,170,255,0.15); box-shadow:none; opacity:.6; }
.hp-root .pointguide {
  position:relative; margin:0 0 12px; padding:13px 40px 13px 14px;
  border-radius:14px; border:1.5px solid rgba(245,197,66,0.72);
  background:linear-gradient(135deg, rgba(55,35,5,0.92), rgba(12,34,52,0.76));
  box-shadow:0 0 26px rgba(245,197,66,0.28), inset 0 1px 0 rgba(255,255,255,0.08);
}
.hp-root .pointguide p {
  color:#f5c542; font-family:'Chakra Petch'; font-size:13px; font-weight:900;
  letter-spacing:1.6px; text-transform:uppercase;
}
.hp-root .pointguide span {
  display:block; margin-top:5px; color:rgba(232,244,255,0.84); font-size:12px; line-height:1.3;
}
.hp-root .pointguide-close {
  position:absolute; right:10px; top:10px; width:24px; height:24px; border-radius:999px;
  border:1px solid rgba(245,197,66,0.42); background:rgba(0,0,0,0.28);
  color:rgba(245,197,66,0.82); font-size:16px; line-height:1; cursor:pointer;
}
.hp-root .worldguide {
  position:relative; margin:12px 0 0; padding:12px 40px 12px 14px;
  border-radius:14px; border:1.5px solid rgba(76,194,255,0.58);
  background:linear-gradient(135deg, rgba(6,23,43,0.94), rgba(18,52,86,0.78));
  box-shadow:0 0 24px rgba(76,194,255,0.22), inset 0 1px 0 rgba(255,255,255,0.08);
}
.hp-root .worldguide p {
  color:var(--cyan); font-family:'Chakra Petch'; font-size:12px; font-weight:900;
  letter-spacing:1.6px; text-transform:uppercase;
}
.hp-root .worldguide span {
  display:block; margin-top:5px; color:rgba(232,244,255,0.82); font-size:12px; line-height:1.3;
}
.hp-root .worldguide-close {
  position:absolute; right:10px; top:10px; width:24px; height:24px; border-radius:999px;
  border:1px solid rgba(76,194,255,0.38); background:rgba(0,0,0,0.28);
  color:rgba(125,211,252,0.86); font-size:16px; line-height:1; cursor:pointer;
}
.hp-root .profile-guide-dim {
  position:fixed; inset:0; z-index:60; pointer-events:none;
  background:
    radial-gradient(circle at 50% 70%, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.46) 26%, rgba(0,0,0,0.82) 68%, rgba(0,0,0,0.92) 100%);
}
.hp-root .profile-guide-card {
  position:relative; z-index:90; margin:10px 0 10px; padding:14px 15px;
  border-radius:16px; border:1.5px solid rgba(76,194,255,0.74);
  background:linear-gradient(135deg, rgba(5,18,34,0.98), rgba(12,43,72,0.94));
  box-shadow:0 0 30px rgba(76,194,255,0.34), inset 0 1px 0 rgba(255,255,255,0.08);
}
.hp-root .profile-guide-card.gold {
  border-color:rgba(245,197,66,0.74);
  background:linear-gradient(135deg, rgba(45,28,6,0.98), rgba(16,38,58,0.94));
  box-shadow:0 0 30px rgba(245,197,66,0.28), inset 0 1px 0 rgba(255,255,255,0.08);
}
.hp-root .profile-guide-card p {
  color:var(--cyan); font-family:'Chakra Petch'; font-size:10px; font-weight:900;
  letter-spacing:2px; text-transform:uppercase;
}
.hp-root .profile-guide-card.gold p { color:#f5c542; }
.hp-root .profile-guide-card span {
  display:block; margin-top:6px; color:rgba(232,244,255,0.92);
  font-size:15px; font-weight:700; line-height:1.25;
}
.hp-root .profile-guide-card small {
  display:block; margin-top:6px; color:rgba(232,244,255,0.62);
  font-size:12px; line-height:1.25;
}
.hp-root .profile-guide-actions { margin-top:10px; display:flex; justify-content:flex-end; }
.hp-root .profile-guide-dismiss {
  border-radius:10px; border:1px solid rgba(76,194,255,0.34);
  background:rgba(8,14,26,0.82); color:var(--cyan-soft);
  font-family:'Chakra Petch'; font-size:12px; font-weight:800; letter-spacing:1px;
  padding:8px 12px; cursor:pointer;
}
.hp-root .profile-guide-dismiss:hover { border-color:var(--cyan); box-shadow:0 0 14px rgba(76,194,255,0.18); }
.hp-root .profile-guide-focus {
  position:relative; z-index:85;
  box-shadow:0 0 32px rgba(76,194,255,0.42), 0 0 0 1px rgba(76,194,255,0.46);
}
.hp-root .profile-guide-focus-gold {
  position:relative; z-index:85;
  box-shadow:0 0 32px rgba(245,197,66,0.34), 0 0 0 1px rgba(245,197,66,0.54);
}
.hp-root .tabtoggle.profile-guide-focus {
  border-color:var(--cyan); color:#dff6ff; background:rgba(7,30,52,0.98);
  transform:scale(1.1);
}
.hp-root .enter.profile-guide-focus {
  z-index:85;
  transform:translateZ(0);
  box-shadow:0 0 42px rgba(76,194,255,0.62), inset 0 0 24px rgba(76,194,255,0.25);
}
.hp-root .detailbtn, .hp-root .vieweq {
  width:100%; background:var(--panel); border:1px solid rgba(76,170,255,0.2);
  border-radius:10px; padding:8px; color:var(--cyan-soft); font-family:'Chakra Petch';
  font-weight:600; font-size:12px; letter-spacing:1px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:8px; transition:.2s;
}
.hp-root .detailbtn:hover, .hp-root .vieweq:hover { border-color:var(--cyan); background:rgba(76,194,255,0.08); }

/* equipment */
.hp-root .equip { margin-top:18px; background:var(--panel); border:1px solid rgba(76,170,255,0.12); border-radius:14px; padding:10px; }
.hp-root .equip.collapsed { padding-bottom:8px; }
.hp-root .equip .slots { display:flex; gap:7px; margin:8px 0 9px; }
.hp-root .slot {
  flex:1; aspect-ratio:1; border-radius:10px; position:relative;
  background:rgba(8,14,26,0.8); border:1px solid rgba(76,170,255,0.14);
  display:grid; place-items:center; cursor:pointer; transition:.2s;
}
.hp-root .slot:hover { border-color:rgba(76,170,255,0.45); }
.hp-root .slot.filled { border-color:rgba(76,194,255,0.5); box-shadow:inset 0 0 10px rgba(76,194,255,0.12); }
.hp-root .slot .gem { position:absolute; top:4px; left:50%; width:7px; height:7px; background:var(--cyan); border-radius:1px; transform:translateX(-50%) rotate(45deg); }
.hp-root .slot .plus { position:absolute; bottom:3px; right:5px; font-size:10px; color:var(--cyan); font-weight:700; }
.hp-root .slot svg { width:60%; height:60%; opacity:.85; }
.hp-root .slot.locked { opacity:.55; }
.hp-root .slot.locked .lock { color:var(--ink-dim); font-size:11px; font-weight:700; }

/* enter world */
.hp-root .enter {
  margin:12px 0 14px; width:100%; cursor:pointer; position:relative;
  background:linear-gradient(180deg,rgba(76,194,255,0.22),rgba(20,60,110,0.5));
  border:1.5px solid var(--cyan);
  clip-path:polygon(4% 0,96% 0,100% 50%,96% 100%,4% 100%,0 50%);
  padding:14px; text-align:center;
  box-shadow:0 0 30px rgba(76,194,255,0.35),inset 0 0 22px rgba(76,194,255,0.18);
  animation:hp-breathe 2.6s ease-in-out infinite;
}
@keyframes hp-breathe {
  0%,100%{box-shadow:0 0 24px rgba(76,194,255,0.3),inset 0 0 22px rgba(76,194,255,0.16)}
  50%{box-shadow:0 0 44px rgba(76,194,255,0.55),inset 0 0 28px rgba(76,194,255,0.25)}
}
.hp-root .enter b { display:block; font-family:'Chakra Petch'; font-weight:700; font-size:26px; letter-spacing:3px; color:var(--ink); text-shadow:0 0 18px var(--cyan-glow); }
.hp-root .enter small { color:var(--cyan-soft); letter-spacing:4px; font-size:10px; font-weight:600; }

/* tabs */
.hp-root .tabs { display:flex; gap:6px; margin-bottom:8px; border-bottom:1px solid rgba(76,170,255,0.12); align-items:flex-start; }
.hp-root .tab {
  flex:1; background:transparent; border:none; border-bottom:2px solid transparent;
  color:var(--ink-dim); font-family:'Chakra Petch'; font-weight:700; font-size:12px;
  letter-spacing:2.5px; padding:3px 0 7px; cursor:pointer; transition:.2s;
}
.hp-root .tab.on { color:var(--cyan); border-bottom-color:var(--cyan); text-shadow:0 0 10px var(--cyan-glow); }
.hp-root .tab:hover { color:var(--cyan-soft); }
.hp-root .tabtoggle {
  width:34px; height:28px; flex:none; border-radius:9px; cursor:pointer;
  border:1px solid rgba(76,170,255,0.22); background:rgba(8,14,26,0.72);
  color:var(--cyan-soft); font-family:'Chakra Petch'; font-size:13px; font-weight:900;
  line-height:1; transition:.2s;
}
.hp-root .tabtoggle:hover { border-color:var(--cyan); box-shadow:0 0 14px rgba(76,194,255,0.18); }
.hp-root .tabhint {
  padding:4px 0 2px; text-align:center; color:rgba(125,147,179,0.72);
  font-family:'Chakra Petch'; font-size:10px; letter-spacing:1.6px; text-transform:uppercase;
}
.hp-root #pane-stats .statgrid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
.hp-root #pane-stats .statgrid .statcard { margin-bottom:0; }

/* skills */
.hp-root .skilllist { display:flex; flex-direction:column; gap:8px; margin-bottom:12px; }
.hp-root .skillrow {
  display:flex; align-items:center; gap:10px; background:rgba(8,14,26,0.7);
  border:1px solid rgba(76,170,255,0.14); border-radius:10px; padding:8px 10px;
  transition:.2s; cursor:pointer;
}
.hp-root .skillrow:hover { border-color:rgba(76,170,255,0.4); transform:translateX(2px); }
.hp-root .skillrow.locked { opacity:.5; }
.hp-root .skillrow .sicon {
  width:32px; height:32px; border-radius:8px; flex:none; display:grid; place-items:center;
  background:rgba(76,194,255,0.08); border:1px solid rgba(76,170,255,0.18);
}
.hp-root .skillrow .sicon svg { width:18px; height:18px; }
.hp-root .skillrow .sname { flex:1; font-family:'Chakra Petch'; font-weight:600; font-size:13px; color:var(--ink); }
.hp-root .skillrow .slv {
  font-size:11px; font-weight:700; color:var(--cyan-soft);
  background:rgba(76,194,255,0.12); border:1px solid rgba(76,170,255,0.2);
  border-radius:20px; padding:2px 9px;
}
@media (max-height: 740px) {
  .hp-root .screen { padding:10px 14px 0; }
  .hp-root .profilehud { gap:7px; padding:8px; }
  .hp-root .profilehud .pickrank { width:34px; height:34px; font-size:15px; }
  .hp-root .profilehud .pickhunter { font-size:15px; }
  .hp-root .profilehud .pickhud-xp { min-width:80px; }
  .hp-root .profilehud .pickhud-track { width:78px; height:8px; }
  .hp-root .profilehud .pickhud-label { display:none; }
  .hp-root .back-btn { width:34px; height:34px; }
  .hp-root .main { margin-top:6px; }
  .hp-root .charwrap { height:clamp(290px, 48vh, 390px); }
  .hp-root .cp { padding:6px 14px; }
  .hp-root .cp .val { font-size:20px; }
  .hp-root .equip { margin-top:10px; padding:10px; }
  .hp-root .equip .slots { margin:8px 0 10px; gap:7px; }
  .hp-root .tab { font-size:12px; letter-spacing:2px; padding:3px 0 7px; }
  .hp-root .enter { margin:12px 0; padding:14px; }
  .hp-root .enter b { font-size:25px; }
  .hp-root .enter small { font-size:10px; letter-spacing:4px; }
}
@media (max-height: 650px) {
  .hp-root .charwrap { height:250px; }
  .hp-root .cp .lbl { display:none; }
  .hp-root .equip .slots { margin-bottom:8px; }
  .hp-root .vieweq { padding:8px; }
  .hp-root .enter { padding:12px; }
  .hp-root .enter b { font-size:22px; }
}
`;

// ── WebGL context explicit disposal on unmount ─────────────────────────────
function GLDisposer() {
  const { gl } = useThree();
  useEffect(() => {
    return () => {
      gl.dispose();
      const ctx = gl.getContext() as WebGLRenderingContext | null;
      if (ctx) {
        const ext = ctx.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      }
    };
  }, [gl]);
  return null;
}

// ── 3-D Class Viewer ──────────────────────────────────────────────────────
function ClassModel({ src, scale }: { src: string; scale: number }) {
  const { scene } = useGLTF(src);
  const model = useMemo(() => cloneSkeleton(scene), [scene]);
  return <primitive object={model} position={[0, -1.05, 0]} scale={scale} />;
}

function ClassViewer({ src, compact = false }: { src: string; compact?: boolean }) {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0, zIndex: 2 }}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      dpr={1}
      camera={{ position: [0, compact ? 0.9 : 1.0, compact ? 3.0 : 2.85], fov: compact ? 38 : 38 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 4, 3]}  intensity={1.5} color="#7dd3fc" />
      <directionalLight position={[-2, 2, -2]} intensity={0.5} color="#c084fc" />
      <pointLight position={[0, -1, 2]} intensity={0.3} color="#4cc2ff" />
      <GLDisposer />
      <Suspense fallback={null}>
        <ClassModel src={src} scale={compact ? 0.54 : 0.72} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(Math.PI * 2) / 3}
        autoRotate
        autoRotateSpeed={1.8}
      />
    </Canvas>
  );
}

CLASS_MODEL_PATHS.forEach((src) => useGLTF.preload(src));

// ── Component ─────────────────────────────────────────────────────────────
export default function HunterProfilePage() {
  const { player } = useGame();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [data,            setData]            = useState<PlayerData | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState<"inventory" | "skills" | "stats">("stats");
  const [showPicker,      setShowPicker]      = useState(false);
  const [showStatIntro,   setShowStatIntro]   = useState(false);
  const [profileGuideStep, setProfileGuideStep] = useState<0 | 1 | 2 | 3>(0);
  const [detailsCollapsed, setDetailsCollapsed] = useState(true);
  const [selectedStatKey, setSelectedStatKey] = useState<string | null>(null);
  const [pickedClass,     setPickedClass]     = useState<number | null>(null);
  const [chosenClass,     setChosenClass]     = useState<number | null>(null);
  const [localStats,      setLocalStats]      = useState<StatEntry[]>([]);
  const [availPts,        setAvailPts]        = useState(0);
  const [cp,              setCp]              = useState(0);
  const [allocError,      setAllocError]      = useState<string | null>(null);
  const [allocating,      setAllocating]      = useState(false);

  useEffect(() => {
    if (!player?.id) return;
    fetch(`/api/player/${player.id}/hunter-profile`)
      .then(r => r.json())
      .then((d: PlayerData) => {
        setData(d);
        setLocalStats(d.stats.map(s => ({ ...s })));
        setAvailPts(d.availablePoints);
        setCp(d.combatPower);
        setChosenClass(d.chosenClass);
        setShowPicker(d.chosenClass === null);
        setPickedClass(d.chosenClass === null ? 0 : null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [player?.id]);

  // ── Stat allocation (local-only; server wiring is a future step) ────────
  const totalPending = () => localStats.reduce((a, s) => a + s.pending, 0);

  function dispatchStatsToGame(stats: StatEntry[]) {
    const detail: Record<string, number> = { STR: 0, AGI: 0, VIT: 0, SEN: 0, INT: 0, DIS: 0 };
    for (const s of stats) {
      if (s.key in detail) detail[s.key] = s.val + s.pending;
    }
    window.dispatchEvent(new CustomEvent("ascend:stats-updated", { detail }));
  }

  function adjust(i: number, delta: number) {
    const s = [...localStats];
    if (delta > 0) {
      if (totalPending() >= availPts) return;
      s[i] = { ...s[i], pending: s[i].pending + 1 };
    } else {
      if (s[i].pending <= 0) return;
      s[i] = { ...s[i], pending: s[i].pending - 1 };
    }
    setLocalStats(s);
    dispatchStatsToGame(s);
  }

  function clearPending() {
    const cleared = localStats.map(s => ({ ...s, pending: 0 }));
    setLocalStats(cleared);
    dispatchStatsToGame(cleared);
  }

  async function commitPoints() {
    if (!data || !player?.id) return;
    const spent = totalPending();
    if (spent <= 0 || allocating) return;

    const KEY_MAP: Record<string, string> = { STR: "str", AGI: "agi", VIT: "vit", SEN: "sen", INT: "int", DIS: "dis" };
    const deltas: Record<string, number> = { str: 0, agi: 0, vit: 0, sen: 0, int: 0, dis: 0 };
    for (const s of localStats) {
      if (s.pending > 0) deltas[KEY_MAP[s.key] ?? s.key.toLowerCase()] = s.pending;
    }

    setAllocating(true);
    setAllocError(null);
    try {
      const resp = await fetch(`/api/player/${player.id}/allocate-stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deltas }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setAllocError(json.error ?? "Allocation failed");
        return;
      }
      const newStatPoints: number = json.statPoints ?? 0;
      setAvailPts(newStatPoints);
      // Replace stat values from authoritative server response
      const SERVER_KEY: Record<string, string> = {
        STR: "strength", AGI: "agility", VIT: "vitality",
        SEN: "sense",   INT: "intelligence", DIS: "discipline",
      };
      const serverStats = json.stats as Record<string, number>;
      const updatedStats = localStats.map(s => {
        const sk = SERVER_KEY[s.key];
        return { ...s, val: sk ? (serverStats[sk] ?? s.val) : s.val, pending: 0 };
      });
      setLocalStats(updatedStats);
      dispatchStatsToGame(updatedStats);
      setCp(c => c + spent * (data.cpPerPoint ?? 12));
      if (profileGuideStep === 2) setProfileGuideStep(3);
    } catch {
      setAllocError("Network error — please try again");
    } finally {
      setAllocating(false);
    }
  }

  // ── Class picker ─────────────────────────────────────────────────────────
  async function confirmClass() {
    if (pickedClass === null || !data || !player?.id) return;
    const optimisticJob = data.classes[pickedClass]?.name ?? "WARRIOR";
    // Optimistically update UI immediately
    setChosenClass(pickedClass);
    try {
      localStorage.setItem(SELECTED_GAME_CLASS_KEY, String(pickedClass));
    } catch {
      /* noop */
    }
    setShowPicker(false);
    setActiveTab("stats");
    setDetailsCollapsed(true);
    setProfileGuideStep(0);
    setShowStatIntro(true);
    queryClient.setQueryData(["/api/player", player.id], (current: any) =>
      current ? { ...current, job: optimisticJob } : current
    );
    // Persist to server — idempotent, so safe to call even if already set
    try {
      const resp = await fetch(`/api/player/${player.id}/choose-class`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ classIndex: pickedClass }),
      });
      const saved = await resp.json();
      if (resp.ok && saved?.job) {
        queryClient.setQueryData(["/api/player", player.id], (current: any) =>
          current ? { ...current, job: saved.job } : current
        );
      }
      queryClient.invalidateQueries({ queryKey: ["/api/player", player.id] });
    } catch {
      // UI already updated; failure is silent — next load will re-sync from server
    }
  }

  function toggleDetails() {
    setActiveTab("stats");
    setDetailsCollapsed((v) => {
      const next = !v;
      if (profileGuideStep === 1 && !next) {
        setProfileGuideStep(2);
        window.setTimeout(() => {
          document.getElementById("pane-stats")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 80);
      }
      return next;
    });
  }

  function beginProfileGuide() {
    setShowStatIntro(false);
    setActiveTab("stats");
    setDetailsCollapsed(true);
    setProfileGuideStep(1);
  }

  if (loading || !data) {
    return (
      <div className="hp-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{CSS}</style>
        <div style={{ color: "var(--cyan-soft)", fontFamily: "'Chakra Petch',sans-serif", fontSize: 16, letterSpacing: 2 }}>
          LOADING HUNTER DATA...
        </div>
      </div>
    );
  }

  const pending   = totalPending();
  const remaining = availPts - pending;

  const pickedData = pickedClass !== null ? data.classes[pickedClass] : null;
  const pickedName = pickedClass !== null && pickedData ? classDisplayName(pickedClass, pickedData.name) : "";
  const pickerXpPercent = data.xpMax > 0 ? Math.min(100, Math.max(0, (data.xp / data.xpMax) * 100)) : 0;
  const activeClassIndex = chosenClass ?? 0;
  const activeClassData = data.classes[activeClassIndex];
  const activeClassName = activeClassData ? classDisplayName(activeClassIndex, activeClassData.name) : data.role;
  const activeClassSrc = classModelSrc(activeClassIndex);
  const showProfileGuide = profileGuideStep > 0 && !showPicker && !showStatIntro;
  const profileGuideCopy =
    profileGuideStep === 1
      ? {
          tone: "blue",
          label: "System Tutorial · Stats",
          title: "Tap the arrow to expand your Stats tab.",
          body: "Your tabs start closed so the profile stays clean.",
        }
      : profileGuideStep === 2
      ? {
          tone: "gold",
          label: "System Tutorial · Points",
          title: "Use + to allocate your level-up points.",
          body: "Confirm changes to lock in your build before entering gates.",
        }
      : profileGuideStep === 3
      ? {
          tone: "blue",
          label: "System Tutorial · Gates",
          title: "Enter World opens gates, battles, and rewards.",
          body: "You can explore it when you feel ready.",
        }
      : null;

  return (
    <div className="hp-root" data-testid="hunter-profile-page">
      <style>{CSS}</style>
      <StatIntroModal
        open={showStatIntro}
        onClose={beginProfileGuide}
        onPrimary={beginProfileGuide}
        primaryColor="#4cc2ff"
        primaryLabel="Continue"
      />

      <div className="phone">
        {/* Energy streaks */}
        <div className="streaks">
          {STREAKS.map((s, i) => (
            <span key={i} style={{ left: s.left, animationDuration: s.duration, animationDelay: s.delay }} />
          ))}
        </div>

        <div className="screen">
          {showProfileGuide && <div className="profile-guide-dim" data-testid="hunter-profile-guide-dim" />}
          <div className="profilehud" aria-label="Hunter profile">
            <button
              className="back-btn"
              onClick={() => window.history.back()}
              data-testid="button-hunter-profile-back"
              aria-label="Go back"
            >←</button>
            <div className="pickrank">{data.rank}</div>
            <div className="pickhud-main">
              <div className="pickhunter">{data.name}</div>
              <div className="pickrole">{data.rank} Rank - {activeClassName}</div>
            </div>
            <div className="pickhud-xp">
              <div className="pickhud-level">Lv {data.level}</div>
              <div className="pickhud-track">
                <div className="pickhud-fill" style={{ width: `${pickerXpPercent}%` }} />
              </div>
              <div className="pickhud-label">{data.xp.toLocaleString()} / {data.xpMax.toLocaleString()} XP</div>
            </div>
          </div>

          {/* Character stage */}
          <div className="main">
            <div className="stage">
              <div className="charwrap">
                <div className="platform">
                  <div className="ring" /><div className="ring" /><div className="ring" />
                  <div className="core" />
                </div>
                {data.characterImage ? (
                  <img src={data.characterImage} className="charimg" alt="character" />
                ) : (
                  <ClassViewer src={activeClassSrc} />
                )}
              </div>
              <div className="cp">
                <div className="val">
                  <svg viewBox="0 0 24 24" width="18" fill="none" stroke="#7dd3fc" strokeWidth="2">
                    <path d="M14.5 4l5.5 5.5L9 20.5 3.5 15z" /><path d="M16 2l6 6" />
                  </svg>
                  <span>{cp.toLocaleString()}</span>
                </div>
                <div className="lbl">COMBAT POWER</div>
              </div>
            </div>
          </div>

          {profileGuideCopy && (
            <div
              className={`profile-guide-card${profileGuideCopy.tone === "gold" ? " gold" : ""}`}
              data-testid={`hunter-profile-guide-step-${profileGuideStep}`}
            >
              <p>{profileGuideCopy.label}</p>
              <span>{profileGuideCopy.title}</span>
              <small>{profileGuideCopy.body}</small>
              {profileGuideStep === 3 && (
                <div className="profile-guide-actions">
                  <button
                    type="button"
                    className="profile-guide-dismiss"
                    onClick={() => setProfileGuideStep(0)}
                    data-testid="button-dismiss-enter-world-guide"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Equipment / Skills / Stats */}
          <div className={`equip${detailsCollapsed ? " collapsed" : ""}${profileGuideStep === 1 ? " profile-guide-focus" : ""}${profileGuideStep === 2 ? " profile-guide-focus-gold" : ""}`}>
            <div className="tabs">
              {(["inventory", "skills", "stats"] as const).map(t => (
                <button key={t} className={`tab${activeTab === t ? " on" : ""}`}
                  onClick={() => setActiveTab(t)}>
                  {t.toUpperCase()}
                </button>
              ))}
              <button
                type="button"
                className={`tabtoggle${profileGuideStep === 1 ? " profile-guide-focus" : ""}`}
                onClick={toggleDetails}
                aria-label={detailsCollapsed ? "Show profile details" : "Hide profile details"}
                data-testid="button-toggle-profile-details"
              >
                {detailsCollapsed ? "v" : "^"}
              </button>
            </div>
            {detailsCollapsed && (
              <div className="tabhint" data-testid="text-profile-details-collapsed">
                Details hidden
              </div>
            )}

            {/* ── Inventory ── */}
            {!detailsCollapsed && activeTab === "inventory" && (
              <div>
                <div className="slots">
                  {data.equipment.map((e, i) => {
                    if (e.type === "locked") {
                      return (
                        <div key={i} className="slot locked">
                          <span className="lock">🔒<br />Lv.{e.unlockLv}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className={`slot${e.filled ? " filled" : ""}`}>
                        {e.filled && <span className="gem" />}
                        <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: EQICON[e.type] || "" }} />
                        {e.plus && <span className="plus">+{e.plus}</span>}
                      </div>
                    );
                  })}
                </div>
                <button className="vieweq">VIEW ALL ITEMS ›</button>
              </div>
            )}

            {/* ── Skills ── */}
            {!detailsCollapsed && activeTab === "skills" && (
              <div>
                <div className="skilllist">
                  {data.skills.map((s, i) => s.locked ? (
                    <div key={i} className="skillrow locked">
                      <div className="sicon">🔒</div>
                      <span className="sname">Locked</span>
                      <span className="slv">Lv.{s.unlockLv}</span>
                    </div>
                  ) : (
                    <div key={i} className="skillrow">
                      <div className="sicon">
                        <svg viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2"
                          dangerouslySetInnerHTML={{ __html: ICONS[s.icon || "fist"] }} />
                      </div>
                      <span className="sname">{s.name}</span>
                      <span className="slv">Lv.{s.lv}</span>
                    </div>
                  ))}
                </div>
                <button className="vieweq">VIEW ALL SKILLS ›</button>
              </div>
            )}

            {/* ── Stats ── */}
            {!detailsCollapsed && activeTab === "stats" && (
              <div id="pane-stats">
                <div className={`points${remaining <= 0 ? " empty" : ""}`}>
                  <span>AVAILABLE POINTS</span>
                  <b>{remaining}</b>
                </div>
                <div className="stathelp" data-testid="stat-initials-help">
                  <b>Tip:</b> Tap a stat label like STR or AGI to see what it powers.
                </div>
                {(data.streakMultiplier ?? 0) > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "rgba(245,185,66,0.1)", border: "1px solid rgba(245,185,66,0.35)",
                    borderRadius: "10px", padding: "7px 12px", marginBottom: "8px",
                    fontSize: "12px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700,
                    letterSpacing: "1px", color: "var(--dis)",
                  }}>
                    <span style={{ fontSize: "16px" }}>🔥</span>
                    <span>STREAK BONUS: +{Math.round((data.streakMultiplier ?? 0) * 100)}% XP &amp; PROGRESS</span>
                  </div>
                )}
                <div className="statgrid">
                  {localStats.map((s, i) => (
                    <div key={s.key} className="statcard">
                      {selectedStatKey === s.key && (
                        <div className="stattip" data-testid={`stat-tip-${s.key}`}>
                          {STAT_TOOLTIP_TEXT[s.key] ?? "This stat powers your hero."}
                        </div>
                      )}
                      <div className="row">
                        <svg viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2"
                          dangerouslySetInnerHTML={{ __html: ICONS[s.icon] }} />
                        <button
                          type="button"
                          className="nm"
                          style={{ color: s.color }}
                          onClick={() => setSelectedStatKey((current) => current === s.key ? null : s.key)}
                          data-testid={`button-stat-tip-${s.key}`}
                        >
                          {s.key}
                        </button>
                        <span className="num">
                          {s.pending > 0
                            ? <><span className="base">{s.val}</span><span className="arrow">→</span><span className="staged">{s.val + s.pending}</span></>
                            : s.val}
                        </span>
                        <button className={`minusbtn${s.pending <= 0 ? " disabled" : ""}`} onClick={() => adjust(i, -1)}>−</button>
                        <button className={`plusbtn${remaining <= 0 ? " disabled" : ""}`}
                          onClick={() => adjust(i, 1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="confirmrow">
                  <button className={`cancelbtn${pending <= 0 || allocating ? " disabled" : ""}`} onClick={clearPending} data-testid="button-cancel-alloc">CANCEL</button>
                  <button className={`confirmbtn${pending <= 0 || allocating ? " disabled" : ""}`} onClick={commitPoints} data-testid="button-confirm-alloc">
                    {allocating ? "SAVING..." : "CONFIRM CHANGES"}
                  </button>
                </div>
                {allocError && (
                  <div data-testid="text-alloc-error" style={{
                    color: "#ff5158", fontSize: "12px", fontFamily: "'Chakra Petch',sans-serif",
                    fontWeight: 700, letterSpacing: "1px", textAlign: "center",
                    marginTop: "6px", padding: "6px 10px",
                    background: "rgba(255,81,88,0.1)", border: "1px solid rgba(255,81,88,0.3)",
                    borderRadius: "8px",
                  }}>
                    ⚠ {allocError}
                  </div>
                )}
                <button className="detailbtn">STAT DETAILS ›</button>
              </div>
            )}
          </div>

          {/* Enter World */}
          <div
            className={`enter${profileGuideStep === 3 ? " profile-guide-focus" : ""}`}
            onClick={() => {
              setProfileGuideStep(0);
              navigate("/world-map");
            }}
            data-testid="button-enter-world"
          >
            <b>ENTER WORLD</b>
            <small>BEGIN YOUR ADVENTURE</small>
          </div>
        </div>

        {/* Class picker overlay */}
        {showPicker && (
          <div className="classpick">
            <div className="classpick-inner">
              <div className="pickhud" aria-label="Hunter level">
                <div className="pickrank">{data.rank}</div>
                <div className="pickhud-main">
                  <div className="pickhunter">{data.name}</div>
                  <div className="pickrole">{data.rank} Rank - {pickedName || data.role}</div>
                </div>
                <div className="pickhud-xp">
                  <div className="pickhud-level">Lv {data.level}</div>
                  <div className="pickhud-track">
                    <div className="pickhud-fill" style={{ width: `${pickerXpPercent}%` }} />
                  </div>
                  <div className="pickhud-label">{data.xp.toLocaleString()} / {data.xpMax.toLocaleString()} XP</div>
                </div>
              </div>
              <div className="pickpreview">
                {pickedData && (
                  <div className="pickaura" style={{
                    background: `radial-gradient(closest-side, ${pickedData.color}, transparent)`,
                  }} />
                )}
                <div className="platform">
                  <div className="ring" /><div className="ring" /><div className="ring" />
                  <div className="core" />
                </div>
                {pickedData && (
                  <div className="pickmodel">
                    <ClassViewer src={classModelSrc(pickedClass ?? 0)} compact />
                  </div>
                )}
              </div>
              <div className="pickrow">
                {data.classes.map((c, i) => (
                  <button key={c.name} className={`pickopt${pickedClass === i ? " sel" : ""}`}
                    onClick={() => setPickedClass(i)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="1.6"
                      dangerouslySetInnerHTML={{ __html: EMBLEM }} />
                    <span>{classDisplayName(i, c.name)}</span>
                  </button>
                ))}
              </div>
              <button
                className={`pickconfirm${pickedClass === null ? " disabled" : ""}`}
                onClick={confirmClass}>
                {pickedName ? `BECOME ${pickedName.toUpperCase()}` : "BECOME CLASS"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

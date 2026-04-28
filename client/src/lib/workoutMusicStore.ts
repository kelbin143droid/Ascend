/**
 * workoutMusicStore.ts
 *
 * Singleton that owns the YouTube IFrame Player instance and exposes a clean
 * imperative API to the rest of the app.  React components should use the
 * `useWorkoutMusic` hook defined at the bottom of this file.
 */

import { useSyncExternalStore } from "react";

export type MusicMode = "auto" | "user";
export type WorkoutCategory = "strength" | "agility" | "meditation" | "vitality";

// ── Playlist IDs ──────────────────────────────────────────────────────────
// Replace these placeholder strings with real YouTube playlist IDs.
// To find a playlist ID open the playlist on YouTube and copy the
// "list=..." parameter from the URL.
export const PLAYLIST_IDS: Partial<Record<WorkoutCategory, string>> = {
  strength: "PLFsQleAWXsj_4yDeebiIADdH5FMayBiOs", // high-energy workout
  agility: "PLx65qkgCWNJIs3RMxMM0qMfVrItL0Vmfm",  // calm stretch / flow
};

// ── Internal state ─────────────────────────────────────────────────────────
interface MusicState {
  mode: MusicMode;
  currentCategory: WorkoutCategory | null;
  isPlaying: boolean;
  volume: number;           // 0-100
  playerReady: boolean;
  player: YTPlayer | null;
}

// Minimal typing for the parts of the YT.Player API we use.
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  setVolume(v: number): void;
  loadPlaylist(opts: { list: string; listType: string; index: number; startSeconds: number }): void;
  setShuffle(shuffle: boolean): void;
  getPlayerState(): number;
  destroy(): void;
}

// Listeners so React hooks can re-render on state change.
type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach((fn) => fn()); }

const STORAGE_KEY_MODE = "ascend_music_mode";

const state: MusicState = {
  mode: (localStorage.getItem(STORAGE_KEY_MODE) as MusicMode) ?? "auto",
  currentCategory: null,
  isPlaying: false,
  volume: 70,
  playerReady: false,
  player: null,
};

// ── YouTube IFrame API bootstrap ───────────────────────────────────────────
declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        opts: object
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiLoading = false;

function loadYTApi(): Promise<void> {
  if (typeof window.YT !== "undefined" && window.YT.Player) return Promise.resolve();
  return new Promise((resolve) => {
    if (apiLoading) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
      return;
    }
    apiLoading = true;
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

// ── Player lifecycle ───────────────────────────────────────────────────────
let playerContainerEl: HTMLDivElement | null = null;

function ensureContainer(): HTMLElement {
  if (playerContainerEl && document.body.contains(playerContainerEl)) {
    return playerContainerEl;
  }
  playerContainerEl = document.createElement("div");
  playerContainerEl.id = "yt-player-container";
  playerContainerEl.style.cssText =
    "position:fixed;bottom:-1px;right:-1px;width:1px;height:1px;pointer-events:none;opacity:0;z-index:-1;";
  document.body.appendChild(playerContainerEl);

  const inner = document.createElement("div");
  inner.id = "yt-player";
  playerContainerEl.appendChild(inner);
  return playerContainerEl;
}

export async function initYouTubePlayer(): Promise<void> {
  await loadYTApi();
  ensureContainer();

  if (state.player) return; // already created

  state.player = new window.YT.Player("yt-player", {
    height: "1",
    width: "1",
    playerVars: {
      autoplay: 1,
      controls: 0,
      enablejsapi: 1,
      origin: window.location.origin,
      playsinline: 1,
    },
    events: {
      onReady: () => {
        state.playerReady = true;
        state.player!.setVolume(state.volume);
        emit();
      },
      onStateChange: (event: { data: number }) => {
        const YTState = window.YT.PlayerState;
        if (event.data === YTState.PLAYING) {
          state.isPlaying = true;
        } else if (
          event.data === YTState.PAUSED ||
          event.data === YTState.ENDED
        ) {
          state.isPlaying = false;
        }
        emit();
      },
      onError: () => {
        state.isPlaying = false;
        emit();
      },
    },
  });
}

// ── Public API ─────────────────────────────────────────────────────────────
export function loadPlaylist(category: WorkoutCategory): void {
  const playlistId = PLAYLIST_IDS[category];
  if (!playlistId || !state.player || !state.playerReady) return;
  state.currentCategory = category;
  state.player.loadPlaylist({
    list: playlistId,
    listType: "playlist",
    index: Math.floor(Math.random() * 10), // start at a random track
    startSeconds: 0,
  });
  try { state.player.setShuffle(true); } catch {}
  state.isPlaying = true;
  emit();
}

export function playMusic(): void {
  if (!state.player || !state.playerReady) return;
  state.player.playVideo();
  state.isPlaying = true;
  emit();
}

export function pauseMusic(): void {
  if (!state.player || !state.playerReady) return;
  state.player.pauseVideo();
  state.isPlaying = false;
  emit();
}

export function stopMusic(): void {
  if (!state.player || !state.playerReady) return;
  state.player.pauseVideo();
  state.isPlaying = false;
  state.currentCategory = null;
  emit();
}

export function setVolume(value: number): void {
  state.volume = Math.max(0, Math.min(100, value));
  state.player?.setVolume(state.volume);
  emit();
}

export function setMusicMode(mode: MusicMode): void {
  state.mode = mode;
  localStorage.setItem(STORAGE_KEY_MODE, mode);
  if (mode !== "auto") pauseMusic();
  emit();
}

export function getSnapshot(): MusicState {
  return { ...state };
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── React hook ─────────────────────────────────────────────────────────────
export function useWorkoutMusic() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);
  return snap;
}

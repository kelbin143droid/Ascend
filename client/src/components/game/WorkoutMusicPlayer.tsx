import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, SkipForward, Volume2, ChevronUp, ChevronDown, Youtube, X, Check } from "lucide-react";
import {
  initYouTubePlayer,
  loadPlaylist,
  playMusic,
  pauseMusic,
  stopMusic,
  setVolume,
  setMusicMode,
  setCustomPlaylist,
  clearCustomPlaylist,
  loadCustomPlaylist,
  useWorkoutMusic,
  type WorkoutCategory,
} from "@/lib/workoutMusicStore";

interface WorkoutMusicPlayerProps {
  category: WorkoutCategory;
  workoutPaused?: boolean;
  workoutDone?: boolean;
  accentColor: string;
}

const CATEGORY_LABELS: Partial<Record<WorkoutCategory, { title: string; vibe: string }>> = {
  strength: { title: "Power Mix", vibe: "High-energy beats to push harder" },
  agility: { title: "Flow State", vibe: "Calm rhythm for deep stretches" },
};

function MusicBars({ color }: { color: string }) {
  return (
    <span className="flex items-end gap-[2px] h-4" aria-hidden>
      {[0.6, 1, 0.4, 0.8, 0.5].map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scaleY: [h, 1, h * 0.6, 1, h] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export function WorkoutMusicPlayer({
  category,
  workoutPaused = false,
  workoutDone = false,
  accentColor,
}: WorkoutMusicPlayerProps) {
  const music = useWorkoutMusic();
  const [expanded, setExpanded] = useState(false);
  const [volumeLocal, setVolumeLocal] = useState(music.volume);
  const [initDone, setInitDone] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState(false);
  const prevPaused = useRef(workoutPaused);
  const prevDone = useRef(workoutDone);

  useEffect(() => {
    if (category !== "strength" && category !== "agility") return;
    initYouTubePlayer().then(() => setInitDone(true));
  }, [category]);

  useEffect(() => {
    if (!initDone || !music.playerReady || music.mode !== "auto") return;
    if (music.currentCategory !== category) {
      loadPlaylist(category);
    }
  }, [initDone, music.playerReady, music.mode, category, music.currentCategory]);

  useEffect(() => {
    if (!initDone || !music.playerReady || music.mode !== "user") return;
    if (music.customPlaylistId && !music.isPlaying) {
      loadCustomPlaylist();
    }
  }, [initDone, music.playerReady, music.mode, music.customPlaylistId]);

  useEffect(() => {
    if (music.mode !== "auto") return;
    if (workoutPaused !== prevPaused.current) {
      prevPaused.current = workoutPaused;
      if (workoutPaused) pauseMusic();
      else if (music.currentCategory === category) playMusic();
    }
  }, [workoutPaused, music.mode, music.currentCategory, category]);

  useEffect(() => {
    if (workoutDone && !prevDone.current) {
      prevDone.current = true;
      stopMusic();
    }
  }, [workoutDone]);

  if (category !== "strength" && category !== "agility") return null;

  const info = CATEGORY_LABELS[category];

  const handleVolumeChange = (v: number) => {
    setVolumeLocal(v);
    setVolume(v);
  };

  const handleSkip = () => {
    if (music.player) {
      try { (music.player as any).nextVideo?.(); } catch {}
    }
  };

  const handleLoadPlaylist = () => {
    setUrlError(false);
    const id = setCustomPlaylist(urlInput);
    if (!id) {
      setUrlError(true);
      return;
    }
    setUrlInput("");
  };

  const isUserPlaying = music.mode === "user" && music.isPlaying;
  const headerSubtitle =
    music.mode === "auto"
      ? music.isPlaying
        ? info?.vibe ?? "Playing…"
        : workoutPaused
        ? "Paused with workout"
        : "Ready to play"
      : music.customPlaylistId
      ? music.isPlaying
        ? "Your YouTube playlist"
        : "Your playlist — tap play"
      : "Paste a YouTube playlist URL";

  return (
    <div
      className="shrink-0 mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5))`,
        border: `1px solid ${accentColor}25`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ── Collapsed header ─────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5"
        data-testid="button-music-toggle-panel"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}35` }}
        >
          {(music.isPlaying && (music.mode === "auto" || isUserPlaying)) ? (
            <MusicBars color={accentColor} />
          ) : (
            <Music size={14} style={{ color: accentColor }} />
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <p className="text-[11px] font-bold truncate" style={{ color: "#e2e8f0" }}>
            {music.mode === "user" ? "My Music" : (info?.title ?? "Workout Music")}
            {music.isPlaying && (
              <span
                className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
              >
                Live
              </span>
            )}
          </p>
          <p className="text-[10px] truncate" style={{ color: "#64748b" }}>{headerSubtitle}</p>
        </div>

        {/* Quick play/pause in collapsed state */}
        {(music.mode === "auto" || (music.mode === "user" && music.customPlaylistId)) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              music.isPlaying ? pauseMusic() : playMusic();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
            style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
            data-testid="button-music-play-pause"
          >
            {music.isPlaying ? (
              <Pause size={13} style={{ color: accentColor }} />
            ) : (
              <Play size={13} style={{ color: accentColor }} />
            )}
          </button>
        )}

        <span style={{ color: "#475569" }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {/* ── Expanded panel ───────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-4 pb-4 space-y-3"
              style={{ borderTop: `1px solid ${accentColor}15` }}
            >
              {/* Mode toggle */}
              <div
                className="flex rounded-xl p-1 gap-1 mt-3"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                data-testid="music-mode-toggle"
              >
                {(["auto", "user"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMusicMode(m)}
                    className="flex-1 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all"
                    style={{
                      backgroundColor: music.mode === m ? `${accentColor}25` : "transparent",
                      color: music.mode === m ? accentColor : "#64748b",
                      border: `1px solid ${music.mode === m ? accentColor + "50" : "transparent"}`,
                    }}
                    data-testid={`button-music-mode-${m}`}
                  >
                    {m === "auto" ? "Auto Workout" : "My Music"}
                  </button>
                ))}
              </div>

              {/* Auto Workout mode */}
              {music.mode === "auto" && (
                <div className="space-y-3">
                  <p className="text-[10px] text-center" style={{ color: "#475569" }}>
                    Workout music plays automatically — {info?.vibe}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => (music.isPlaying ? pauseMusic() : playMusic())}
                      className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
                        border: `1px solid ${accentColor}60`,
                        boxShadow: music.isPlaying ? `0 0 16px ${accentColor}50` : "none",
                      }}
                      data-testid="button-music-play-pause-expanded"
                    >
                      {music.isPlaying ? (
                        <Pause size={18} style={{ color: accentColor }} />
                      ) : (
                        <Play size={18} style={{ color: accentColor }} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      data-testid="button-music-skip"
                    >
                      <SkipForward size={15} style={{ color: "#94a3b8" }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Volume2 size={13} style={{ color: "#475569" }} />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={volumeLocal}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full cursor-pointer appearance-none"
                      style={
                        {
                          background: `linear-gradient(to right, ${accentColor} ${volumeLocal}%, rgba(255,255,255,0.1) ${volumeLocal}%)`,
                          accentColor,
                        } as React.CSSProperties
                      }
                      data-testid="slider-music-volume"
                    />
                    <span className="text-[10px] w-7 text-right tabular-nums" style={{ color: "#475569" }}>
                      {volumeLocal}
                    </span>
                  </div>
                </div>
              )}

              {/* My Music mode — YouTube playlist */}
              {music.mode === "user" && (
                <div className="space-y-3">
                  {music.customPlaylistId ? (
                    <>
                      <div
                        className="rounded-xl p-3 flex items-center gap-2"
                        style={{ backgroundColor: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.2)" }}
                      >
                        <Youtube size={14} style={{ color: "#ff4444", flexShrink: 0 }} />
                        <p className="text-[10px] flex-1 truncate" style={{ color: "#e2e8f0" }}>
                          {music.customPlaylistId}
                        </p>
                        <button
                          type="button"
                          onClick={clearCustomPlaylist}
                          className="shrink-0 p-1 rounded-md transition-colors"
                          style={{ color: "#64748b" }}
                          data-testid="button-clear-playlist"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => (music.isPlaying ? pauseMusic() : playMusic())}
                          className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
                          style={{
                            background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
                            border: `1px solid ${accentColor}60`,
                            boxShadow: music.isPlaying ? `0 0 16px ${accentColor}50` : "none",
                          }}
                          data-testid="button-music-play-pause-user"
                        >
                          {music.isPlaying ? (
                            <Pause size={18} style={{ color: accentColor }} />
                          ) : (
                            <Play size={18} style={{ color: accentColor }} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleSkip}
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <SkipForward size={15} style={{ color: "#94a3b8" }} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      className="rounded-xl p-3 flex items-center gap-2"
                      style={{ backgroundColor: "rgba(255,0,0,0.05)", border: "1px dashed rgba(255,0,0,0.2)" }}
                    >
                      <Youtube size={14} style={{ color: "#ff4444", flexShrink: 0 }} />
                      <p className="text-[10px]" style={{ color: "#64748b" }}>
                        Paste a YouTube playlist URL below
                      </p>
                    </div>
                  )}

                  {/* URL input */}
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="youtube.com/playlist?list=..."
                        value={urlInput}
                        onChange={(e) => { setUrlInput(e.target.value); setUrlError(false); }}
                        className="flex-1 text-[11px] rounded-lg px-3 py-2 outline-none"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          border: `1px solid ${urlError ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                          color: "#e2e8f0",
                        }}
                        data-testid="input-yt-playlist-url"
                      />
                      <button
                        type="button"
                        onClick={handleLoadPlaylist}
                        disabled={!urlInput.trim()}
                        className="px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40"
                        style={{
                          backgroundColor: `${accentColor}25`,
                          color: accentColor,
                          border: `1px solid ${accentColor}50`,
                        }}
                        data-testid="button-load-playlist"
                      >
                        <Check size={13} />
                        Load
                      </button>
                    </div>
                    {urlError && (
                      <p className="text-[10px]" style={{ color: "#ef4444" }}>
                        Couldn't find a playlist ID. Paste the full URL or just the playlist ID.
                      </p>
                    )}
                    <p className="text-[10px]" style={{ color: "#475569" }}>
                      Open a YouTube playlist → copy the URL from the address bar
                    </p>
                  </div>

                  {/* Volume */}
                  {music.customPlaylistId && (
                    <div className="flex items-center gap-2.5">
                      <Volume2 size={13} style={{ color: "#475569" }} />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={volumeLocal}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="flex-1 h-1.5 rounded-full cursor-pointer appearance-none"
                        style={
                          {
                            background: `linear-gradient(to right, ${accentColor} ${volumeLocal}%, rgba(255,255,255,0.1) ${volumeLocal}%)`,
                            accentColor,
                          } as React.CSSProperties
                        }
                      />
                      <span className="text-[10px] w-7 text-right tabular-nums" style={{ color: "#475569" }}>
                        {volumeLocal}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

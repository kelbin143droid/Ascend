import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, SkipForward, Volume2, ChevronUp, ChevronDown } from "lucide-react";
import {
  initYouTubePlayer,
  loadPlaylist,
  playMusic,
  pauseMusic,
  stopMusic,
  setVolume,
  setMusicMode,
  useWorkoutMusic,
  type WorkoutCategory,
} from "@/lib/workoutMusicStore";

interface WorkoutMusicPlayerProps {
  category: WorkoutCategory;
  /** Mirror the workout's own paused state so music auto-pauses. */
  workoutPaused?: boolean;
  /** When true the workout has ended — music stops. */
  workoutDone?: boolean;
  accentColor: string;
}

const CATEGORY_LABELS: Partial<Record<WorkoutCategory, { title: string; vibe: string }>> = {
  strength: { title: "Power Mix", vibe: "High-energy beats to push harder" },
  agility: { title: "Flow State", vibe: "Calm rhythm for deep stretches" },
};

// Animated music-bar icon for "now playing"
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
  const prevPaused = useRef(workoutPaused);
  const prevDone = useRef(workoutDone);

  // Initialise YouTube player once on mount
  useEffect(() => {
    if (category !== "strength" && category !== "agility") return;
    initYouTubePlayer().then(() => setInitDone(true));
  }, [category]);

  // Auto-load playlist when player is ready and mode is "auto"
  useEffect(() => {
    if (!initDone || !music.playerReady || music.mode !== "auto") return;
    if (music.currentCategory !== category) {
      loadPlaylist(category);
    }
  }, [initDone, music.playerReady, music.mode, category, music.currentCategory]);

  // Mirror workout pause/resume → music
  useEffect(() => {
    if (music.mode !== "auto") return;
    if (workoutPaused !== prevPaused.current) {
      prevPaused.current = workoutPaused;
      if (workoutPaused) pauseMusic();
      else if (music.currentCategory === category) playMusic();
    }
  }, [workoutPaused, music.mode, music.currentCategory, category]);

  // Stop music when workout completes
  useEffect(() => {
    if (workoutDone && !prevDone.current) {
      prevDone.current = true;
      stopMusic();
    }
  }, [workoutDone]);

  const info = CATEGORY_LABELS[category];

  // Only show for supported categories
  if (category !== "strength" && category !== "agility") return null;

  const handleVolumeChange = (v: number) => {
    setVolumeLocal(v);
    setVolume(v);
  };

  const handleSkip = () => {
    // Pause then play restarts at next track in the playlist
    if (music.player) {
      try {
        (music.player as any).nextVideo?.();
      } catch {}
    }
  };

  return (
    <div
      className="shrink-0 mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5))`,
        border: `1px solid ${accentColor}25`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ── Collapsed header row ─────────────────────────── */}
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
          {music.isPlaying && music.mode === "auto" ? (
            <MusicBars color={accentColor} />
          ) : (
            <Music size={14} style={{ color: accentColor }} />
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <p className="text-[11px] font-bold truncate" style={{ color: "#e2e8f0" }}>
            {info?.title ?? "Workout Music"}
            {music.mode === "auto" && music.isPlaying && (
              <span
                className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
              >
                Live
              </span>
            )}
          </p>
          <p className="text-[10px] truncate" style={{ color: "#64748b" }}>
            {music.mode === "auto"
              ? music.isPlaying
                ? info?.vibe ?? "Playing…"
                : workoutPaused
                ? "Paused with workout"
                : "Ready to play"
              : "My Music (coming soon)"}
          </p>
        </div>

        {/* Quick play/pause pill for auto mode — visible in collapsed state */}
        {music.mode === "auto" && (
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
              {/* ── Mode toggle ──────────────────────────── */}
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

              {/* ── Auto Workout mode ────────────────────── */}
              {music.mode === "auto" && (
                <div className="space-y-3">
                  <p className="text-[10px] text-center" style={{ color: "#475569" }}>
                    Workout music plays automatically — {info?.vibe}
                  </p>

                  {/* Controls row */}
                  <div className="flex items-center justify-center gap-3">
                    {/* Play / Pause */}
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

                    {/* Skip */}
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

                  {/* Volume */}
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

              {/* ── My Music mode ─────────────────────────── */}
              {music.mode === "user" && (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                    style={{
                      backgroundColor: "#1db954",
                      color: "#fff",
                    }}
                    data-testid="button-connect-spotify"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.496 17.27c-.214.336-.67.44-1.008.222-2.761-1.688-6.239-2.069-10.333-1.133-.394.09-.788-.155-.879-.549-.09-.394.155-.788.549-.879 4.475-1.022 8.313-.582 11.41 1.31.337.208.44.67.222 1.008l.039.021zm1.467-3.267c-.268.42-.84.551-1.26.283-3.158-1.942-7.97-2.505-11.705-1.37-.48.143-.985-.127-1.131-.607-.143-.48.127-.985.607-1.131 4.267-1.297 9.566-.669 13.205 1.565.42.268.551.84.284 1.26zm.127-3.399c-3.789-2.25-10.043-2.458-13.664-1.36-.577.175-1.187-.152-1.362-.73-.175-.578.152-1.188.73-1.363 4.154-1.262 11.062-1.018 15.426 1.574.52.309.694.98.384 1.5-.309.519-.981.693-1.5.384l-.014-.005z"/>
                    </svg>
                    Connect Spotify (Coming Soon)
                  </button>
                  <p className="text-[10px] text-center" style={{ color: "#475569" }}>
                    Spotify integration is on the roadmap. Use Auto Workout in the meantime.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

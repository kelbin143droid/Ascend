import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, Wind, X } from "lucide-react";
import { CalmBreathingEngine } from "./CalmBreathingEngine";

const INHALE_URL = "/audio/inhale.mp3";
const HOLD_URL = "/audio/hold.mp3";
const EXHALE_URL = "/audio/exhale.mp3";

export function CalmBreathingSessionScreen({
  targetSeconds = 28,
  title = "30-Second Reset",
  accentColor = "#3b82f6",
  backgroundColor = "#020810",
  zIndexClass = "z-40",
  onComplete,
  onCancel,
}: {
  targetSeconds?: number;
  title?: string;
  accentColor?: string;
  backgroundColor?: string;
  zIndexClass?: string;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [state, setState] = useState<"countdown" | "active">("countdown");
  const [countdown, setCountdown] = useState(5);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const unlock = new Audio(INHALE_URL);
    unlock.volume = 0;
    unlock.play()
      .then(() => {
        unlock.pause();
        unlock.src = "";
      })
      .catch(() => {
        unlock.src = "";
      });
  }, []);

  useEffect(() => {
    try {
      const ctx = new AudioContext();
      ctx.resume().catch(() => {});
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      [INHALE_URL, HOLD_URL, EXHALE_URL].forEach((url) => {
        const audio = new Audio(url);
        audio.volume = 0;
        audio.play().then(() => audio.pause()).catch(() => {});
      });
      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 1000);
    } catch {}
  }, []);

  useEffect(() => {
    if (state !== "countdown") return;

    const timer = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          clearInterval(timer);
          setState("active");
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (state !== "active") return;

    const timer = setInterval(() => {
      if (pausedRef.current) return;
      setElapsed((value) => Math.min(value + 1, targetSeconds));
    }, 1000);

    return () => clearInterval(timer);
  }, [state, targetSeconds]);

  const progress = targetSeconds > 0 ? Math.min(elapsed / targetSeconds, 1) : 0;

  return (
    <div
      data-testid="calm-breathing-session-screen"
      className={`fixed inset-0 ${zIndexClass} flex flex-col`}
      style={{ backgroundColor }}
    >
      {state === "active" && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <video
            src="/videos/calm-breathing.mp4"
            className="h-full w-full object-cover"
            autoPlay
            playsInline
            muted
            loop
            preload="auto"
            style={{ opacity: 0.18 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.40) 50%, rgba(0,0,0,0.65) 100%)",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes gsFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Wind size={16} style={{ color: `${accentColor}99` }} />
          <span className="text-xs font-display tracking-wide" style={{ color: "rgba(255,255,255,0.6)" }}>
            {title}
          </span>
        </div>
        <button
          data-testid="button-close-session"
          onClick={onCancel}
          className="rounded-lg p-2 transition-all active:scale-95"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative z-10 px-4">
        <div className="h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <div
            data-testid="session-progress-bar"
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: `${accentColor}60`,
              transitionDuration: "1s",
              transitionTimingFunction: "linear",
            }}
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center" style={{ animation: "gsFadeIn 0.5s ease-out" }}>
        {state === "countdown" ? (
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
              Get comfortable. Starting in...
            </p>
            <p
              data-testid="countdown-number"
              className="text-6xl font-display font-light"
              style={{
                color: `${accentColor}bb`,
                animation: "gsFadeIn 0.3s ease-out",
              }}
              key={countdown}
            >
              {countdown}
            </p>
          </div>
        ) : (
          <CalmBreathingEngine
            accentColor={accentColor}
            targetSeconds={targetSeconds}
            onDone={onComplete}
            paused={paused}
          />
        )}
      </div>

      {state === "active" && (
        <div className="relative z-10 flex flex-col items-center gap-3 px-4 pb-8">
          <div className="flex w-full max-w-[260px] gap-3">
            <button
              data-testid="button-pause-session"
              onClick={() => setPaused((value) => !value)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition-all active:scale-[0.96]"
              style={{
                backgroundColor: paused ? `${accentColor}30` : "rgba(255,255,255,0.18)",
                border: paused ? `1px solid ${accentColor}80` : "1px solid rgba(255,255,255,0.35)",
                color: paused ? accentColor : "rgba(255,255,255,0.90)",
              }}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              data-testid="button-skip-session"
              onClick={() => {
                setPaused(false);
                onComplete();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition-all active:scale-[0.96]"
              style={{
                backgroundColor: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.28)",
                color: "rgba(255,255,255,0.78)",
              }}
            >
              <SkipForward size={14} />
              Skip
            </button>
          </div>

          <p className="text-[10px] tracking-wide" style={{ color: "rgba(255,255,255,0.50)" }}>
            {paused ? "Session paused" : `${Math.max(1, Math.ceil((targetSeconds - elapsed) / 60))} min remaining`}
          </p>
        </div>
      )}
    </div>
  );
}

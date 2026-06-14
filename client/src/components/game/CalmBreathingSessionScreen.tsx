import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, Wind, X } from "lucide-react";
import { CalmBreathingEngine } from "./CalmBreathingEngine";

const INHALE_URL = "/audio/inhale.mp3";
const HOLD_URL = "/audio/hold.mp3";
const EXHALE_URL = "/audio/exhale.mp3";

function formatSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function CalmBreathingSessionScreen({
  targetSeconds = 30,
  guidanceSeconds = 28,
  title = "30-Second Reset",
  accentColor = "#3b82f6",
  backgroundColor = "#020810",
  zIndexClass = "z-40",
  showSkip = true,
  onComplete,
  onCancel,
}: {
  targetSeconds?: number;
  guidanceSeconds?: number;
  title?: string;
  accentColor?: string;
  backgroundColor?: string;
  zIndexClass?: string;
  showSkip?: boolean;
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
  const remainingSeconds = Math.max(0, targetSeconds - elapsed);

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
            className="h-full w-full scale-110 object-cover blur-[5px]"
            autoPlay
            playsInline
            muted
            loop
            preload="auto"
            style={{ opacity: 0.11 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(2,8,16,0.82) 0%, rgba(2,8,16,0.70) 46%, rgba(2,8,16,0.90) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 42%, ${accentColor}20 0%, rgba(2,8,16,0.10) 28%, rgba(2,8,16,0.78) 72%)`,
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
        {state === "active" && (
          <div className="mt-4 flex justify-center">
            <span
              data-testid="session-countdown-timer"
              className="rounded-full px-3 py-1 text-xs font-medium tabular-nums tracking-wide"
              style={{
                backgroundColor: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.68)",
              }}
            >
              {formatSeconds(remainingSeconds)}
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6" style={{ animation: "gsFadeIn 0.5s ease-out" }}>
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
            targetSeconds={guidanceSeconds}
            silentCompletionSeconds={Math.max(0, targetSeconds - guidanceSeconds)}
            onDone={onComplete}
            paused={paused}
          />
        )}
      </div>

      {state === "active" && (
        <div className="relative z-10 flex flex-col items-center gap-3 px-4 pb-8">
          <div className={`flex w-full gap-2.5 ${showSkip ? "max-w-[220px]" : "max-w-[132px]"}`}>
            <button
              data-testid="button-pause-session"
              onClick={() => setPaused((value) => !value)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-medium transition-all active:scale-[0.96]"
              style={{
                backgroundColor: paused ? `${accentColor}20` : "rgba(255,255,255,0.08)",
                border: paused ? `1px solid ${accentColor}55` : "1px solid rgba(255,255,255,0.14)",
                color: paused ? `${accentColor}dd` : "rgba(255,255,255,0.62)",
              }}
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
              {paused ? "Resume" : "Pause"}
            </button>
            {showSkip && (
              <button
                data-testid="button-skip-session"
                onClick={() => {
                  setPaused(false);
                  onComplete();
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-medium transition-all active:scale-[0.96]"
                style={{
                  backgroundColor: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                <SkipForward size={13} />
                Skip
              </button>
            )}
          </div>

          <p className="min-h-4 text-[10px] tracking-wide" style={{ color: "rgba(255,255,255,0.38)" }}>
            {paused ? "Session paused" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

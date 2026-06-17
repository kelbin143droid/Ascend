import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, Wind, X } from "lucide-react";
import { CalmBreathingEngine } from "./CalmBreathingEngine";

const INHALE_URL = "/audio/inhale.mp3";
const HOLD_URL = "/audio/hold.mp3";
const EXHALE_URL = "/audio/exhale.mp3";

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

  return (
    <div
      data-testid="calm-breathing-session-screen"
      className={`fixed inset-0 ${zIndexClass} flex flex-col overflow-hidden`}
      style={{ backgroundColor, ["--calm-accent" as string]: accentColor }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <video
          src="/videos/calm-breathing.mp4"
          className="h-full w-full scale-110 object-cover blur-[2px]"
          autoPlay
          playsInline
          muted
          loop
          preload="auto"
          style={{ opacity: state === "active" ? 0.32 : 0.18 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(2,8,16,0.58) 0%, rgba(2,8,16,0.34) 42%, rgba(2,8,16,0.88) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 39%, ${accentColor}24 0%, rgba(2,8,16,0.04) 30%, rgba(2,8,16,0.76) 78%)`,
          }}
        />
        <div className="calm-aurora calm-aurora-a" />
        <div className="calm-aurora calm-aurora-b" />
      </div>

      <style>{`
        @keyframes gsFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes calmDrift {
          0%, 100% { transform: translate3d(-8%, 0, 0) rotate(0deg); opacity: .28; }
          50% { transform: translate3d(8%, -3%, 0) rotate(8deg); opacity: .5; }
        }
        @keyframes calmFlow {
          0% { transform: translateX(-12%); opacity: .55; }
          50% { opacity: 1; }
          100% { transform: translateX(112%); opacity: .25; }
        }
        @keyframes calmOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes calmOrbitReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes calmPulse {
          0%, 100% { transform: scale(.96); opacity: .62; }
          50% { transform: scale(1.05); opacity: .94; }
        }
        @keyframes calmSpark {
          0% { transform: translateY(12px) scale(.55); opacity: 0; }
          25% { opacity: .95; }
          100% { transform: translateY(-78px) scale(1); opacity: 0; }
        }
        @keyframes calmButtonGlow {
          0%, 100% { box-shadow: 0 0 18px rgba(76,194,255,.22), inset 0 0 18px rgba(255,255,255,.05); }
          50% { box-shadow: 0 0 34px rgba(76,194,255,.36), inset 0 0 24px rgba(255,255,255,.1); }
        }
        .calm-aurora {
          position:absolute; width:92%; height:30%; left:4%; border-radius:999px;
          filter:blur(24px); background:linear-gradient(90deg, transparent, color-mix(in srgb, var(--calm-accent) 72%, transparent), transparent);
          animation:calmDrift 8s ease-in-out infinite;
        }
        .calm-aurora-a { top:18%; transform:rotate(-12deg); }
        .calm-aurora-b { bottom:16%; animation-delay:-4s; opacity:.28; transform:rotate(11deg); }
        .calm-progress-track {
          position:relative; height:7px; width:100%; overflow:hidden; border-radius:999px;
          background:rgba(105,184,220,.12); border:1px solid rgba(164,232,255,.12);
          box-shadow:inset 0 0 18px rgba(0,0,0,.55);
        }
        .calm-progress-track:after {
          content:""; position:absolute; top:0; bottom:0; width:34%; left:-38%;
          background:linear-gradient(90deg, transparent, rgba(210,250,255,.8), transparent);
          animation:calmFlow 3.2s ease-in-out infinite;
        }
        .calm-control {
          position:relative; overflow:hidden; min-height:50px;
          border-radius:18px; font-family:'Chakra Petch', monospace; font-weight:800; letter-spacing:.6px;
          animation:calmButtonGlow 4s ease-in-out infinite;
        }
        .calm-control:before {
          content:""; position:absolute; inset:1px; border-radius:17px;
          background:linear-gradient(160deg, rgba(255,255,255,.24), transparent 34%, rgba(255,255,255,.04) 76%, rgba(255,255,255,.16));
          pointer-events:none; opacity:.72;
        }
        .calm-control > * { position:relative; z-index:1; }
        .calm-engine { width:100%; display:flex; flex-direction:column; align-items:center; gap:24px; }
        .calm-orb-stage {
          position:relative; width:min(76vw, 330px); height:min(76vw, 330px);
          display:flex; align-items:center; justify-content:center;
          filter:drop-shadow(0 0 26px rgba(76,194,255,.32));
        }
        .calm-swirl {
          position:absolute; inset:4%; border-radius:50%;
          background:conic-gradient(from 30deg, transparent 0 8%, rgba(115,220,255,.8) 12%, transparent 20%, rgba(240,202,106,.8) 33%, transparent 42%, rgba(77,180,255,.7) 56%, transparent 68%, rgba(126,240,255,.78) 82%, transparent 94%);
          -webkit-mask:radial-gradient(circle, transparent 51%, #000 54%, #000 61%, transparent 64%);
          mask:radial-gradient(circle, transparent 51%, #000 54%, #000 61%, transparent 64%);
          animation:calmOrbit 8.5s linear infinite;
          opacity:.8;
        }
        .calm-swirl.s2 {
          inset:12%; animation:calmOrbitReverse 6.8s linear infinite; opacity:.66;
          filter:blur(.4px); transform-origin:center;
        }
        .calm-swirl.s3 {
          inset:20%; animation-duration:5.2s; opacity:.72;
          background:conic-gradient(from 120deg, transparent, rgba(255,214,126,.82), transparent 26%, rgba(90,210,255,.8), transparent 58%, rgba(163,231,255,.72), transparent);
        }
        .calm-core {
          position:absolute; width:45%; height:45%; border-radius:50%;
          background:radial-gradient(circle at 46% 42%, rgba(255,255,255,.22), color-mix(in srgb, var(--calm-accent) 74%, transparent) 26%, rgba(2,10,22,.3) 72%);
          box-shadow:0 0 56px color-mix(in srgb, var(--calm-accent) 48%, transparent), inset 0 0 26px rgba(255,255,255,.12);
          animation:calmPulse 4s ease-in-out infinite;
        }
        .calm-core:after {
          content:""; position:absolute; inset:-32%; border-radius:50%;
          background:conic-gradient(from 0deg, transparent, rgba(119,230,255,.34), transparent, rgba(255,215,128,.24), transparent);
          animation:calmOrbit 7.6s linear infinite;
        }
        .calm-spark {
          position:absolute; width:5px; height:5px; border-radius:999px;
          background:rgba(160,244,255,.95); box-shadow:0 0 12px rgba(126,232,255,.95);
          animation:calmSpark 3.4s ease-out infinite;
        }
        .calm-dust {
          position:absolute; left:50%; top:50%; width:4px; height:4px; border-radius:999px;
          background:rgba(255,216,130,.95); box-shadow:0 0 10px rgba(255,216,130,.8);
        }
        .calm-phase-label {
          color:var(--calm-accent); text-shadow:0 0 18px color-mix(in srgb, var(--calm-accent) 80%, transparent);
        }
      `}</style>

      <div className="relative z-10 flex items-center justify-between px-5 pb-3 pt-5">
        <div className="flex items-center gap-2">
          <Wind size={18} style={{ color: `${accentColor}cc`, filter: `drop-shadow(0 0 8px ${accentColor}88)` }} />
          <span className="text-sm font-display tracking-wide" style={{ color: "rgba(215,248,255,0.78)", textShadow: `0 0 12px ${accentColor}66` }}>
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

      <div className="relative z-10 px-5">
        <div className="calm-progress-track">
          <div
            data-testid="session-progress-bar"
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}88, rgba(196,248,255,.96))`,
              boxShadow: `0 0 18px ${accentColor}88`,
              transitionDuration: "1s",
              transitionTimingFunction: "linear",
            }}
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6" style={{ animation: "gsFadeIn 0.5s ease-out" }}>
        {state === "countdown" ? (
          <div className="flex flex-col items-center gap-6 rounded-[28px] border border-cyan-200/15 bg-slate-950/40 px-10 py-9 shadow-[0_0_50px_rgba(76,194,255,0.18)] backdrop-blur-md">
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
        <div className="relative z-10 flex flex-col items-center gap-3 px-5 pb-8">
          <div className={`flex w-full gap-4 ${showSkip ? "max-w-[340px]" : "max-w-[160px]"}`}>
            <button
              data-testid="button-pause-session"
              onClick={() => setPaused((value) => !value)}
              className="calm-control flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm transition-all active:scale-[0.96]"
              style={{
                background: paused
                  ? `linear-gradient(180deg, ${accentColor}28, rgba(8,22,38,.86))`
                  : "linear-gradient(180deg, rgba(190,238,255,.16), rgba(8,15,28,.92))",
                border: paused ? `1px solid ${accentColor}88` : "1px solid rgba(164,232,255,0.28)",
                color: paused ? `${accentColor}` : "rgba(210,246,255,0.78)",
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
                className="calm-control flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm transition-all active:scale-[0.96]"
                style={{
                  background: "linear-gradient(180deg, rgba(77,180,255,.24), rgba(21,44,104,.9))",
                  border: "1px solid rgba(155,238,255,0.32)",
                  color: "rgba(204,255,216,0.82)",
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

import { useEffect, useRef, useState } from "react";

const INHALE_URL = "/audio/inhale.mp3";
const HOLD_URL = "/audio/hold.mp3";
const EXHALE_URL = "/audio/exhale.mp3";

type BreathPhase = "Inhale" | "Hold" | "Exhale";
type DisplayPhase = BreathPhase | "Quiet";

const VOICE_DURATIONS: Record<BreathPhase, number> = {
  Inhale: 4000,
  Hold: 4000,
  Exhale: 6000,
};

const VOICE_NEXT: Record<BreathPhase, BreathPhase> = {
  Inhale: "Hold",
  Hold: "Exhale",
  Exhale: "Inhale",
};

const CALM_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const SPARKS = [
  { left: "48%", top: "22%", delay: "0s", size: 5 },
  { left: "34%", top: "29%", delay: "-.9s", size: 4 },
  { left: "64%", top: "30%", delay: "-1.6s", size: 5 },
  { left: "28%", top: "48%", delay: "-2.2s", size: 3 },
  { left: "72%", top: "48%", delay: "-.4s", size: 4 },
  { left: "40%", top: "66%", delay: "-2.9s", size: 3 },
  { left: "60%", top: "68%", delay: "-1.2s", size: 4 },
  { left: "52%", top: "78%", delay: "-2.5s", size: 3 },
];
const DUST = Array.from({ length: 28 }, (_, index) => ({
  angle: index * 13.4,
  radius: 48 + (index % 5) * 7,
  size: 2 + (index % 3),
  opacity: 0.45 + (index % 4) * 0.12,
}));

function createPadOscillator(ctx: AudioContext, freq: number, detuneCents: number, gainValue: number, destination: AudioNode) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.detune.setValueAtTime(detuneCents, ctx.currentTime);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  osc.connect(gain).connect(destination);
  osc.start();
  return osc;
}

function useBreathingAudio(active: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    if (!active) return;

    try {
      const ctx = new AudioContext();
      ctx.resume().catch(() => {});
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3);

      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = "lowpass";
      lpFilter.frequency.setValueAtTime(600, ctx.currentTime);
      lpFilter.Q.setValueAtTime(0.7, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
      lfo.connect(lfoGain).connect(masterGain.gain);
      lfo.start();
      lfoRef.current = lfo;

      lpFilter.connect(masterGain).connect(ctx.destination);

      const oscs: OscillatorNode[] = [];
      oscs.push(createPadOscillator(ctx, 130.81, -4, 0.35, lpFilter));
      oscs.push(createPadOscillator(ctx, 130.81, 4, 0.35, lpFilter));
      oscs.push(createPadOscillator(ctx, 196.0, -3, 0.2, lpFilter));
      oscs.push(createPadOscillator(ctx, 196.0, 3, 0.2, lpFilter));
      oscs.push(createPadOscillator(ctx, 261.63, -5, 0.12, lpFilter));
      oscs.push(createPadOscillator(ctx, 261.63, 5, 0.12, lpFilter));
      oscs.push(createPadOscillator(ctx, 329.63, 0, 0.06, lpFilter));
      oscillatorsRef.current = oscs;
    } catch {}

    return () => {
      try {
        oscillatorsRef.current.forEach((oscillator) => {
          try {
            oscillator.stop();
          } catch {}
        });
        if (lfoRef.current) {
          try {
            lfoRef.current.stop();
          } catch {}
        }
        audioCtxRef.current?.close();
      } catch {}
      oscillatorsRef.current = [];
      lfoRef.current = null;
      audioCtxRef.current = null;
    };
  }, [active]);
}

function useCalmMusic(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;

    let closed = false;

    const playNote = (ctx: AudioContext, dest: GainNode) => {
      if (closed) return;
      const freq = CALM_NOTES[Math.floor(Math.random() * CALM_NOTES.length)];
      const f = Math.random() > 0.7 ? freq * 2 : freq;

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 1.2);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 3.5);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.5);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 6);
    };

    const schedule = (ctx: AudioContext, dest: GainNode) => {
      if (closed) return;
      playNote(ctx, dest);
      const delay = 2800 + Math.random() * 3200;
      timerRef.current = setTimeout(() => schedule(ctx, dest), delay);
    };

    try {
      const ctx = new AudioContext();
      ctx.resume().catch(() => {});
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(1, ctx.currentTime + 6);
      master.connect(ctx.destination);

      timerRef.current = setTimeout(() => schedule(ctx, master), 4000);
    } catch {}

    return () => {
      closed = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      try {
        ctxRef.current?.close();
      } catch {}
      ctxRef.current = null;
    };
  }, [active]);
}

export function CalmBreathingEngine({
  accentColor,
  targetSeconds,
  onDone,
  paused = false,
  silentCompletionSeconds = 0,
}: {
  accentColor: string;
  targetSeconds: number;
  onDone: () => void;
  paused?: boolean;
  silentCompletionSeconds?: number;
}) {
  const [phase, setPhase] = useState<DisplayPhase>("Inhale");
  const onDoneRef = useRef(onDone);
  const pausedRef = useRef(paused);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useBreathingAudio(!paused);
  useCalmMusic(!paused);

  useEffect(() => {
    let alive = true;
    const audioMap: Record<BreathPhase, string> = {
      Inhale: INHALE_URL,
      Hold: HOLD_URL,
      Exhale: EXHALE_URL,
    };
    let activeAudio: HTMLAudioElement | null = null;

    const speakPhase = (p: BreathPhase) => {
      if (pausedRef.current) return;
      try {
        if (activeAudio) {
          activeAudio.pause();
          activeAudio.currentTime = 0;
        }
        const audio = new Audio(audioMap[p]);
        audio.volume = 1.0;
        activeAudio = audio;
        audio.play().catch(() => {});
      } catch {}
    };

    let curPhase: BreathPhase = "Inhale";
    let phaseElapsedMs = 0;
    let sessionElapsedMs = 0;
    let silentElapsedMs = 0;
    let inSilentCompletion = false;
    let lastTick = performance.now();
    setPhase("Inhale");
    speakPhase("Inhale");

    const tickId = setInterval(() => {
      if (!alive) return;
      const now = performance.now();

      if (pausedRef.current) {
        lastTick = now;
        return;
      }

      const delta = now - lastTick;
      lastTick = now;

      if (inSilentCompletion) {
        silentElapsedMs += delta;
        if (silentElapsedMs >= silentCompletionSeconds * 1000) {
          alive = false;
          clearInterval(tickId);
          onDoneRef.current();
        }
        return;
      }

      phaseElapsedMs += delta;
      sessionElapsedMs += delta;

      if (phaseElapsedMs >= VOICE_DURATIONS[curPhase]) {
        const elapsedSec = sessionElapsedMs / 1000;
        if (curPhase === "Exhale" && elapsedSec >= targetSeconds) {
          if (activeAudio) {
            activeAudio.pause();
            activeAudio = null;
          }
          if (silentCompletionSeconds > 0) {
            inSilentCompletion = true;
            silentElapsedMs = 0;
            setPhase("Quiet");
          } else {
            alive = false;
            clearInterval(tickId);
            onDoneRef.current();
          }
          return;
        }
        curPhase = VOICE_NEXT[curPhase];
        phaseElapsedMs = 0;
        setPhase(curPhase);
        speakPhase(curPhase);
      }
    }, 100);

    return () => {
      alive = false;
      clearInterval(tickId);
      if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
      }
    };
  }, [targetSeconds, silentCompletionSeconds]);

  const scale = phase === "Inhale" ? 1.08 : phase === "Hold" ? 1.08 : 0.72;
  const transitionDuration =
    phase === "Inhale" ? `${VOICE_DURATIONS.Inhale / 1000}s`
    : phase === "Hold" ? "0.2s"
    : `${VOICE_DURATIONS.Exhale / 1000}s`;
  const phaseHint =
    phase === "Inhale" ? `${VOICE_DURATIONS.Inhale / 1000}s`
    : phase === "Hold" ? `${VOICE_DURATIONS.Hold / 1000}s`
    : phase === "Exhale" ? `${VOICE_DURATIONS.Exhale / 1000}s`
    : "";

  return (
    <div className="calm-engine">
      <div
        className="calm-orb-stage"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration} ease-in-out`,
        }}
      >
        <div className="calm-swirl s1" />
        <div className="calm-swirl s2" />
        <div className="calm-swirl s3" />
        <div
          className="absolute inset-[9%] rounded-full"
          style={{
            border: `1px solid ${accentColor}33`,
            boxShadow: `0 0 36px ${accentColor}24, inset 0 0 42px ${accentColor}18`,
          }}
        />
        <div
          className="absolute inset-[17%] rounded-full"
          style={{
            border: `1px solid ${accentColor}22`,
            boxShadow: `inset 0 0 30px ${accentColor}12`,
          }}
        />
        {DUST.map((dot, index) => (
          <span
            key={index}
            className="calm-dust"
            style={{
              width: dot.size,
              height: dot.size,
              opacity: dot.opacity,
              transform: `rotate(${dot.angle}deg) translate(${dot.radius}px)`,
            }}
          />
        ))}
        {SPARKS.map((spark, index) => (
          <span
            key={index}
            className="calm-spark"
            style={{
              left: spark.left,
              top: spark.top,
              width: spark.size,
              height: spark.size,
              animationDelay: spark.delay,
            }}
          />
        ))}
        <div
          className="calm-core"
          style={{
            border: `1.5px solid ${accentColor}bb`,
            boxShadow: phase === "Hold"
              ? `0 0 88px ${accentColor}66, 0 0 28px ${accentColor}42, inset 0 0 34px rgba(255,255,255,0.12)`
              : `0 0 60px ${accentColor}52, 0 0 18px ${accentColor}30, inset 0 0 30px rgba(255,255,255,0.08)`,
          }}
        />
      </div>
      <div className="flex min-h-[54px] flex-col items-center gap-1">
        <p
          data-testid="breathing-phase-label"
          className="calm-phase-label text-4xl font-display font-medium tracking-wide"
        >
          {phase === "Quiet" ? "" : phase}
        </p>
        {phaseHint && (
          <p
            className="rounded-full border px-3 py-1 text-base font-display tabular-nums"
            style={{
              color: `${accentColor}ee`,
              borderColor: `${accentColor}38`,
              backgroundColor: `${accentColor}12`,
              boxShadow: `0 0 18px ${accentColor}22`,
            }}
          >
            {phaseHint}
          </p>
        )}
      </div>
    </div>
  );
}

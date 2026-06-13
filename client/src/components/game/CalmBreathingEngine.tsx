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

  const scale = phase === "Inhale" ? 1.08 : phase === "Hold" ? 1.08 : 0.68;
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
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-[230px] w-[230px] items-center justify-center sm:h-[260px] sm:w-[260px]">
        <div
          className="absolute h-[168px] w-[168px] rounded-full sm:h-[190px] sm:w-[190px]"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${transitionDuration} ease-in-out, box-shadow 0.6s ease`,
            background: `radial-gradient(circle at 50% 44%, rgba(255,255,255,0.13) 0%, ${accentColor}66 24%, ${accentColor}22 62%, transparent 100%)`,
            border: `1.5px solid ${accentColor}aa`,
            boxShadow: phase === "Hold"
              ? `0 0 72px ${accentColor}55, 0 0 22px ${accentColor}36, inset 0 0 34px rgba(255,255,255,0.08)`
              : `0 0 52px ${accentColor}44, 0 0 14px ${accentColor}28, inset 0 0 30px rgba(255,255,255,0.06)`,
          }}
        />
        <div
          className="absolute h-[214px] w-[214px] rounded-full sm:h-[242px] sm:w-[242px]"
          style={{
            border: `1px solid ${accentColor}30`,
            boxShadow: `inset 0 0 46px ${accentColor}12`,
          }}
        />
        <div
          className="absolute h-[190px] w-[190px] rounded-full sm:h-[216px] sm:w-[216px]"
          style={{
            border: `1px solid ${accentColor}18`,
          }}
        />
      </div>
      <div className="flex min-h-[54px] flex-col items-center gap-1">
        <p
          data-testid="breathing-phase-label"
          className="text-2xl font-display font-medium tracking-wide"
          style={{ color: `${accentColor}ff` }}
        >
          {phase === "Quiet" ? "" : phase}
        </p>
        {phaseHint && (
          <p className="text-sm tabular-nums" style={{ color: `${accentColor}cc` }}>
            {phaseHint}
          </p>
        )}
      </div>
    </div>
  );
}

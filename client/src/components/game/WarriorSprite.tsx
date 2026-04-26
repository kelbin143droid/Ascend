import { useState, useEffect, useRef } from "react";
const warriorSheet = "";

export type WarriorAnimation = "idle" | "attack" | "walk" | "die";

interface AnimConfig {
  row: number;
  frames: number;
  frameRate: number;
  loop: boolean;
}

const ANIMATIONS: Record<WarriorAnimation, AnimConfig> = {
  idle:   { row: 0, frames: 6, frameRate: 8,  loop: true },
  attack: { row: 1, frames: 6, frameRate: 10, loop: false },
  walk:   { row: 2, frames: 6, frameRate: 8,  loop: true },
  die:    { row: 3, frames: 4, frameRate: 6,  loop: false },
};

const FRAME_WIDTH = 84;
const FRAME_HEIGHT = 124;

interface WarriorSpriteProps {
  animation: WarriorAnimation;
  scale?: number;
  onAnimationEnd?: () => void;
  className?: string;
}

export function WarriorSprite({
  animation,
  scale = 1.5,
  onAnimationEnd,
  className = "",
}: WarriorSpriteProps) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEndRef = useRef(onAnimationEnd);
  onEndRef.current = onAnimationEnd;

  const config = ANIMATIONS[animation];
  const displayWidth = FRAME_WIDTH * scale;
  const displayHeight = FRAME_HEIGHT * scale;

  useEffect(() => {
    setFrame(0);

    if (intervalRef.current) clearInterval(intervalRef.current);

    const ms = 1000 / config.frameRate;
    let currentFrame = 0;

    intervalRef.current = setInterval(() => {
      currentFrame += 1;

      if (currentFrame >= config.frames) {
        if (config.loop) {
          currentFrame = 0;
        } else {
          currentFrame = config.frames - 1;
          if (intervalRef.current) clearInterval(intervalRef.current);
          onEndRef.current?.();
        }
      }

      setFrame(currentFrame);
    }, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [animation, config.frameRate, config.frames, config.loop]);

  const bgX = -(frame * FRAME_WIDTH) * scale;
  const bgY = -(config.row * FRAME_HEIGHT) * scale;

  return (
    <div
      className={`inline-block ${className}`}
      style={{
        width: displayWidth,
        height: displayHeight,
        backgroundImage: `url(${warriorSheet})`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundSize: `${504 * scale}px ${496 * scale}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
      data-testid={`warrior-sprite-${animation}`}
    />
  );
}

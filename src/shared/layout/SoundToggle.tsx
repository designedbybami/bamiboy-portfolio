"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { motion } from "motion/react";

const TARGET_VOLUME = 0.05;
const FADE_IN_DURATION = 800;
const FADE_OUT_DURATION = 2500;
const WIGGLE_DURATION = 4.4;
// Four matching cubic segments form two broad, rounded lobes. Keeping the command
// structure identical lets Motion continuously interpolate from either wave phase
// into the flat resting line without a snap.
const FLAT_PATH =
  "M3 12 C5 12 5 12 8 12 C11 12 11 12 12 12 C13 12 13 12 16 12 C19 12 19 12 21 12";
const WAVE_UP =
  "M3 12 C5 12 5 4 8 4 C11 4 11 12 12 12 C13 12 13 20 16 20 C19 20 19 12 21 12";
const WAVE_DOWN =
  "M3 12 C5 12 5 20 8 20 C11 20 11 12 12 12 C13 12 13 4 16 4 C19 4 19 12 21 12";
const FILL_BASE_DIAMETER = 16;
const FILL_SCALE_MARGIN = 1.15;

type FillOrigin = { x: number; y: number; scale: number };

const DEFAULT_FILL_ORIGIN: FillOrigin = { x: 24, y: 24, scale: 1 };

function computeFillOrigin(rect: DOMRect, clientX: number, clientY: number): FillOrigin {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const corners: Array<[number, number]> = [
    [0, 0],
    [rect.width, 0],
    [0, rect.height],
    [rect.width, rect.height],
  ];
  const maxCornerDistance = Math.max(...corners.map(([cx, cy]) => Math.hypot(cx - x, cy - y)));

  return {
    x,
    y,
    scale: (maxCornerDistance / (FILL_BASE_DIAMETER / 2)) * FILL_SCALE_MARGIN,
  };
}

export function SoundToggle() {
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [fillOrigin, setFillOrigin] = useState<FillOrigin>(DEFAULT_FILL_ORIGIN);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeFrameRef = useRef<number>(null);
  const pausingRef = useRef(false);

  const cancelFade = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (target: number, duration: number, onComplete?: () => void) => {
      const audio = audioRef.current;
      if (!audio) return;

      cancelFade();
      const initialVolume = audio.volume;
      const startedAt = performance.now();

      const step = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const easedProgress = 0.5 - Math.cos(Math.PI * progress) / 2;
        audio.volume = initialVolume + (target - initialVolume) * easedProgress;

        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(step);
          return;
        }

        fadeFrameRef.current = null;
        onComplete?.();
      };

      fadeFrameRef.current = requestAnimationFrame(step);
    },
    [cancelFade],
  );

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused && !pausingRef.current) {
      pausingRef.current = true;
      setPlaying(false);
      fadeTo(0, FADE_OUT_DURATION, () => {
        audio.pause();
        pausingRef.current = false;
      });
      return;
    }

    cancelFade();
    pausingRef.current = false;

    if (!audio.paused) {
      setPlaying(true);
      fadeTo(TARGET_VOLUME, FADE_IN_DURATION);
      return;
    }

    audio.volume = 0;

    try {
      await audio.play();
      fadeTo(TARGET_VOLUME, FADE_IN_DURATION);
    } catch {
      setPlaying(false);
      audio.volume = 0;
    }
  };

  const handleEnter = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFillOrigin(computeFillOrigin(rect, event.clientX, event.clientY));
    setHovered(true);
  };

  const handleLeave = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFillOrigin(computeFillOrigin(rect, event.clientX, event.clientY));
    setHovered(false);
  };

  const handleFocus = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setFillOrigin(computeFillOrigin(rect, rect.left + rect.width / 2, rect.bottom));
    }
    setHovered(true);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;

    const handlePlay = () => setPlaying(true);
    const handleStop = () => setPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handleStop);
    audio.addEventListener("ended", handleStop);
    audio.addEventListener("error", handleStop);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handleStop);
      audio.removeEventListener("ended", handleStop);
      audio.removeEventListener("error", handleStop);
      cancelFade();
    };
  }, [cancelFade]);

  return (
    <motion.button
      ref={buttonRef}
      layout
      type="button"
      onClick={toggle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleFocus}
      onBlur={() => setHovered(false)}
      whileTap={{ scale: 0.9 }}
      aria-pressed={playing}
      aria-label={playing ? "Pause background music" : "Play background music"}
      className={`relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink/5 transition-colors duration-300 sm:size-12 ${
        hovered ? "text-white" : "text-ink/70"
      }`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full bg-primary transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
        style={{
          left: fillOrigin.x,
          top: fillOrigin.y,
          width: FILL_BASE_DIAMETER,
          height: FILL_BASE_DIAMETER,
          transform: `translate(-50%, -50%) scale(${hovered ? fillOrigin.scale : 0})`,
        }}
      />
      <audio ref={audioRef} src="/audio/nav-loop.mp3" loop preload="metadata" />
      <svg className="relative z-10" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <motion.path
          d={FLAT_PATH}
          animate={{ d: playing ? [WAVE_UP, WAVE_DOWN] : FLAT_PATH }}
          transition={
            playing
              ? {
                  duration: WIGGLE_DURATION,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }
              : { duration: FADE_OUT_DURATION / 1000, ease: "easeInOut" }
          }
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </svg>
    </motion.button>
  );
}

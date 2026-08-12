"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

const TARGET_VOLUME = 0.05;
const FADE_DURATION = 500;
const FLAT_PATH = "M4 12 Q8 12 12 12 T20 12";
const WAVE_UP = "M4 12 Q8 6.5 12 12 T20 12";
const WAVE_DOWN = "M4 12 Q8 17.5 12 12 T20 12";

export function SoundToggle() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeFrameRef = useRef<number>(null);

  const cancelFade = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (target: number, onComplete?: () => void) => {
      const audio = audioRef.current;
      if (!audio) return;

      cancelFade();
      const initialVolume = audio.volume;
      const startedAt = performance.now();

      const step = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / FADE_DURATION);
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

    if (!audio.paused) {
      setPlaying(false);
      fadeTo(0, () => audio.pause());
      return;
    }

    cancelFade();
    audio.volume = 0;

    try {
      await audio.play();
      fadeTo(TARGET_VOLUME);
    } catch {
      setPlaying(false);
      audio.volume = 0;
    }
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
      layout
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      aria-pressed={playing}
      aria-label={playing ? "Pause background music" : "Play background music"}
      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-ink/5 text-ink/70 transition-colors duration-300 hover:bg-primary hover:text-white sm:size-12"
    >
      <audio ref={audioRef} src="/audio/nav-loop.mp3" loop preload="metadata" />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <motion.path
          d={FLAT_PATH}
          animate={{ d: playing ? [WAVE_UP, WAVE_DOWN] : FLAT_PATH }}
          transition={
            playing
              ? {
                  duration: 0.85,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }
              : { duration: FADE_DURATION / 1000, ease: "easeInOut" }
          }
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </svg>
    </motion.button>
  );
}

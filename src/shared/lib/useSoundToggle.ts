"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TARGET_VOLUME = 0.05;
const FADE_IN_DURATION = 800;
const FADE_OUT_DURATION = 2500;

// Single source of truth for the nav audio: call this once (in SiteNav) and pass the
// result down as props to both the desktop icon and the mobile menu row, rather than
// calling it in each, which would create two independent <audio> elements out of sync
// with each other.
export function useSoundToggle() {
  const [playing, setPlaying] = useState(false);
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

  const toggle = useCallback(async () => {
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
  }, [cancelFade, fadeTo]);

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

  return { playing, toggle, audioRef, fadeOutDuration: FADE_OUT_DURATION };
}

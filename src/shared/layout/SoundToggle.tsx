"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

const AUDIO_VOLUME = 0.14;

export function SoundToggle() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext>(null);
  const analyserRef = useRef<AnalyserNode>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode>(null);
  const gainRef = useRef<GainNode>(null);
  const animationFrameRef = useRef<number>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer>>(null);
  const prefersReducedMotion = useReducedMotion();
  const signalLevel = useMotionValue(0);
  const smoothedLevel = useSpring(signalLevel, { stiffness: 240, damping: 24, mass: 0.35 });
  const path = useTransform(
    smoothedLevel,
    (level) => `M4 12 Q8 ${12 - level * 6.5} 12 12 T20 12`,
  );

  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    signalLevel.set(0);
  }, [signalLevel]);

  const startVisualization = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (prefersReducedMotion) {
      signalLevel.set(0.35);
      return;
    }

    const analyser = analyserRef.current;
    const audio = audioRef.current;
    if (!analyser || !audio) return;

    const frequencyData =
      frequencyDataRef.current ?? new Uint8Array(analyser.frequencyBinCount);
    frequencyDataRef.current = frequencyData;

    const sample = () => {
      if (audio.paused) {
        stopVisualization();
        return;
      }

      analyser.getByteFrequencyData(frequencyData);
      const finalBin = Math.min(48, frequencyData.length);
      let total = 0;

      for (let index = 2; index < finalBin; index += 1) {
        total += frequencyData[index];
      }

      const average = total / Math.max(1, finalBin - 2);
      signalLevel.set(Math.min(1, Math.max(0.08, (average - 24) / 112)));
      animationFrameRef.current = requestAnimationFrame(sample);
    };

    sample();
  }, [prefersReducedMotion, signalLevel, stopVisualization]);

  const ensureAudioGraph = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;

    const audio = audioRef.current;
    if (!audio) return null;

    try {
      const context = new AudioContext();
      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      const gain = context.createGain();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      gain.gain.value = AUDIO_VOLUME;

      source.connect(analyser);
      analyser.connect(gain);
      gain.connect(context.destination);

      audioContextRef.current = context;
      sourceRef.current = source;
      analyserRef.current = analyser;
      gainRef.current = gain;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      return context;
    } catch {
      audio.volume = AUDIO_VOLUME;
      return null;
    }
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      return;
    }

    const context = ensureAudioGraph();

    try {
      if (context?.state === "suspended") {
        await context.resume();
      }
      await audio.play();
    } catch {
      setPlaying(false);
      stopVisualization();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setPlaying(true);
      startVisualization();
    };
    const handleStop = () => {
      setPlaying(false);
      stopVisualization();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handleStop);
    audio.addEventListener("ended", handleStop);
    audio.addEventListener("error", handleStop);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handleStop);
      audio.removeEventListener("ended", handleStop);
      audio.removeEventListener("error", handleStop);
      stopVisualization();
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      gainRef.current?.disconnect();
      void audioContextRef.current?.close();
    };
  }, [startVisualization, stopVisualization]);

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
          d={path}
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </svg>
    </motion.button>
  );
}

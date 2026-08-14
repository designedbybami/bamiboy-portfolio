"use client";

import { useState, useRef, type MouseEvent } from "react";
import { motion } from "motion/react";
import { WAVE_DOWN_PATH, WAVE_FLAT_PATH, WAVE_UP_PATH, WAVE_WIGGLE_DURATION } from "@/shared/lib/wave-path";

const FILL_BASE_DIAMETER = 16;
const FILL_SCALE_MARGIN = 1.15;
const FADE_OUT_DURATION = 2500; // matches useSoundToggle's own fade-out, for the path's return-to-flat timing

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

type SoundToggleProps = {
  playing: boolean;
  onToggle: () => void;
};

// Desktop-only icon; on mobile this moves into the nav's full-screen menu as a tappable row instead (see SiteNav).
// Fixed neutral-gray identity, not the nav's mix-blend-difference auto-invert, a deliberate choice to read as one consistent color regardless of section.
export function SoundToggle({ playing, onToggle }: SoundToggleProps) {
  const [hovered, setHovered] = useState(false);
  const [fillOrigin, setFillOrigin] = useState<FillOrigin>(DEFAULT_FILL_ORIGIN);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <motion.button
      ref={buttonRef}
      layout
      type="button"
      onClick={onToggle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleFocus}
      onBlur={() => setHovered(false)}
      whileTap={{ scale: 0.9 }}
      aria-pressed={playing}
      aria-label={playing ? "Pause background music" : "Play background music"}
      className={`relative hidden size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 transition-colors duration-300 sm:flex sm:size-12 ${
        hovered ? "text-white" : "text-neutral-500"
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
      <svg className="relative z-10" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <motion.path
          d={WAVE_FLAT_PATH}
          animate={{ d: playing ? [WAVE_UP_PATH, WAVE_DOWN_PATH] : WAVE_FLAT_PATH }}
          transition={
            playing
              ? { duration: WAVE_WIGGLE_DURATION, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
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

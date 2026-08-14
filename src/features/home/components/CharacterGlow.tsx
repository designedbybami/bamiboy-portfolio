"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useAnimationFrame } from "motion/react";

type CharacterGlowProps = {
  containerRef: RefObject<HTMLElement | null>; // pointer hit area is the whole Hero, though travel stays tethered near the character
  characterRef: RefObject<HTMLElement | null>; // measured (not guessed) to size/center the glow to the character
  characterReady: boolean; // wait for the entrance flip to settle before measuring, or the rect is mid-transform
};

// Single light source scoped to the character, not the site-wide ambient glow that was rejected (see STANDARDS.md).
// Coarse-pointer (touch) values are bumped: there's no hover to trail the cursor, so the glow has to read at rest, at a glance.
export const CHARACTER_GLOW_CONFIG = {
  warmCore: { rgb: "255,247,235", opacity: 0.42, opacityCoarse: 0.6, sizePercent: 22, sizePercentCoarse: 30, blurPx: 45 },
  blueWash: { rgb: "30,94,255", opacity: 0.5, opacityCoarse: 0.68, blurPx: 16, blurPxCoarse: 22 }, // small blur on purpose, a big one leaks past the div's own edges
  blueReachFactor: 0.92, // fraction of the character's height, less than 1 so it sits inset from head and feet
  blueReachFactorCoarse: 1.08,
  blueWidthToHeightRatio: 0.6, // keeps the wash an upright oval, not a wide circle
  fallbackXPercent: 50, // rest position before the character's been measured
  fallbackYPercent: 72,
  fallbackHeightPercent: 46,
  warmRangePercent: 12, // max tether offset the warm core's target can sit from rest
  smoothing: 0.06, // low on purpose, makes the warm core visibly trail the cursor instead of snapping
} as const;

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type MeasuredRect = { topPercent: number; heightPercent: number; centerXPercent: number };

// The character's box relative to the hit area, as percentages, re-measured on resize.
function useCharacterRect(characterRef: RefObject<HTMLElement | null>, containerRef: RefObject<HTMLElement | null>, ready: boolean) {
  const [rect, setRect] = useState<MeasuredRect | null>(null);

  useEffect(() => {
    if (!ready) return;
    const target = characterRef.current;
    const container = containerRef.current;
    if (!target || !container) return;

    const measure = () => {
      const t = target.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      if (c.width === 0 || c.height === 0) return;
      setRect({
        topPercent: ((t.top - c.top) / c.height) * 100,
        heightPercent: (t.height / c.height) * 100,
        centerXPercent: ((t.left + t.width / 2 - c.left) / c.width) * 100,
      });
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(target);
    window.addEventListener("resize", measure);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [characterRef, containerRef, ready]);

  return rect;
}

// Full-bleed layer behind Hero's content, no z-index needed since content above already carries z-10.
export function CharacterGlow({ containerRef, characterRef, characterReady }: CharacterGlowProps) {
  const warmRef = useRef<HTMLDivElement>(null);
  const characterRect = useCharacterRect(characterRef, containerRef, characterReady);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  const restXPercent = characterRect?.centerXPercent ?? CHARACTER_GLOW_CONFIG.fallbackXPercent;
  const restYPercent = characterRect ? characterRect.topPercent + characterRect.heightPercent / 2 : CHARACTER_GLOW_CONFIG.fallbackYPercent;
  const blueReachFactor = isCoarsePointer ? CHARACTER_GLOW_CONFIG.blueReachFactorCoarse : CHARACTER_GLOW_CONFIG.blueReachFactor;
  const blueHeightPercent = characterRect ? characterRect.heightPercent * blueReachFactor : CHARACTER_GLOW_CONFIG.fallbackHeightPercent;
  const blueWidthPercent = blueHeightPercent * CHARACTER_GLOW_CONFIG.blueWidthToHeightRatio;

  const pointer = useRef<{ x: number; y: number }>({ x: restXPercent, y: restYPercent });
  const current = useRef<{ x: number; y: number }>({ x: restXPercent, y: restYPercent });
  const flags = useRef({ finePointer: false, reducedMotion: false, hovering: false });

  useEffect(() => {
    const fineQuery = window.matchMedia("(pointer: fine)");
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      flags.current.finePointer = fineQuery.matches;
      flags.current.reducedMotion = reducedQuery.matches;
      setIsCoarsePointer(coarseQuery.matches);
    };
    update();
    fineQuery.addEventListener("change", update);
    coarseQuery.addEventListener("change", update);
    reducedQuery.addEventListener("change", update);
    return () => {
      fineQuery.removeEventListener("change", update);
      coarseQuery.removeEventListener("change", update);
      reducedQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const hitArea = containerRef.current;
    if (!hitArea) return;

    function handleMove(event: PointerEvent) {
      if (!flags.current.finePointer || flags.current.reducedMotion) return;
      const rect = hitArea!.getBoundingClientRect();
      pointer.current = {
        x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
        y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
      };
      flags.current.hovering = true;
    }

    function handleLeave() {
      flags.current.hovering = false;
    }

    hitArea.addEventListener("pointermove", handleMove);
    hitArea.addEventListener("pointerleave", handleLeave);
    return () => {
      hitArea.removeEventListener("pointermove", handleMove);
      hitArea.removeEventListener("pointerleave", handleLeave);
    };
  }, [containerRef]);

  useAnimationFrame(() => {
    const { finePointer, reducedMotion, hovering } = flags.current;
    const { warmRangePercent } = CHARACTER_GLOW_CONFIG;

    const dest =
      hovering && finePointer && !reducedMotion
        ? {
            x: restXPercent + clamp(pointer.current.x - restXPercent, -warmRangePercent, warmRangePercent),
            y: restYPercent + clamp(pointer.current.y - restYPercent, -warmRangePercent, warmRangePercent),
          }
        : { x: restXPercent, y: restYPercent };

    current.current.x = lerp(current.current.x, dest.x, CHARACTER_GLOW_CONFIG.smoothing);
    current.current.y = lerp(current.current.y, dest.y, CHARACTER_GLOW_CONFIG.smoothing);

    if (warmRef.current) {
      warmRef.current.style.left = `${current.current.x}%`;
      warmRef.current.style.top = `${current.current.y}%`;
    }
  });

  const { warmCore, blueWash } = CHARACTER_GLOW_CONFIG;
  const warmOpacity = isCoarsePointer ? warmCore.opacityCoarse : warmCore.opacity;
  const warmSizePercent = isCoarsePointer ? warmCore.sizePercentCoarse : warmCore.sizePercent;
  const blueOpacity = isCoarsePointer ? blueWash.opacityCoarse : blueWash.opacity;
  const blueBlurPx = isCoarsePointer ? blueWash.blurPxCoarse : blueWash.blurPx;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${restXPercent}%`,
          top: `${restYPercent}%`,
          width: `${blueWidthPercent}%`,
          height: `${blueHeightPercent}%`,
          background: `radial-gradient(closest-side, rgba(${blueWash.rgb},${blueOpacity}), rgba(${blueWash.rgb},0))`,
          filter: `blur(${blueBlurPx}px)`,
        }}
      />
      <div
        ref={warmRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
        style={{
          left: `${restXPercent}%`,
          top: `${restYPercent}%`,
          width: `${warmSizePercent}%`,
          aspectRatio: "1 / 1",
          background: `radial-gradient(closest-side, rgba(${warmCore.rgb},${warmOpacity}), rgba(${warmCore.rgb},0))`,
          filter: `blur(${warmCore.blurPx}px)`,
        }}
      />
    </div>
  );
}

"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import { usePageTransition, TransitionPhase } from "@/context/transition-context";

// ─── Path ─────────────────────────────────────────────────────────────────────
// A serpentine designed for 1440×1024 with strokeWidth 420.
// It makes 3 organic horizontal passes so that, as pathLength goes 0→1,
// the stroke progressively covers the entire viewport top-to-bottom.
//
// Pass 1 center ≈ y 150  → covers y  -60 to  360
// Pass 2 center ≈ y 530  → covers y  320 to  740  (overlaps pass 1)
// Pass 3 center ≈ y 870  → covers y  660 to 1080  (overlaps pass 2, beyond 1024)
//
// Horizontal: path extends to x -200 / 1700, giving ±210px of bleed past edges.

const STROKE_PATH =
  "M -200,150 C 300,-80 900,420 1700,150 C 1950,150 1950,530 1700,530 C 900,280 250,700 -200,530 C -450,530 -450,870 -200,870 C 300,650 950,1100 1700,870";

const EASING: [number, number, number, number] = [0.76, 0, 0.24, 1];
const DURATION = 0.85;

// ─── Variants ─────────────────────────────────────────────────────────────────
//
//  idle      → invisible (pathLength 0, opacity 0, instant)
//  entering  → draws 0→1, covering screen top-to-bottom
//  covering  → holds fully drawn while route fires
//  revealing → erases 1→0, uncovering the new page bottom-to-top

const pathVariants: Variants = {
  idle: {
    pathLength: 0,
    opacity: 0,
    transition: { duration: 0 },
  },
  entering: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: DURATION, ease: EASING },
      opacity: { duration: 0 }, // snap visible instantly before drawing starts
    },
  },
  covering: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0 },
  },
  revealing: {
    pathLength: 0,
    opacity: 1,
    transition: {
      pathLength: { duration: DURATION, ease: EASING },
    },
  },
};

// Reduced-motion: plain crossfade, no drawing
const fadeVariants: Variants = {
  idle:     { opacity: 0, transition: { duration: 0 } },
  entering: { opacity: 1, transition: { duration: 0.3 } },
  covering: { opacity: 1, transition: { duration: 0 } },
  revealing:{ opacity: 0, transition: { duration: 0.3 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PageTransition() {
  const { phase } = usePageTransition();
  const prefersReducedMotion = useReducedMotion();
  const isActive = phase !== "idle";

  return (
    // Triple visibility guard so nothing leaks through:
    //   1. visibility:hidden  — hides the whole layer at the DOM level when idle
    //   2. opacity: 0         — in the path variant
    //   3. pathLength: 0      — no stroke drawn
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        pointerEvents: isActive ? "all" : "none",
        visibility: isActive ? "visible" : "hidden",
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 1024"
        preserveAspectRatio="xMidYMid slice"
      >
        <motion.path
          d={STROKE_PATH}
          fill="none"
          stroke="#0A192F"
          strokeWidth="500"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={prefersReducedMotion ? fadeVariants : pathVariants}
          initial="idle"
          animate={phase}
        />
      </svg>
    </div>
  );
}

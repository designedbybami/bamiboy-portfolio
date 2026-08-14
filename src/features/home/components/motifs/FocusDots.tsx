"use client";

import { motion } from "motion/react";

type FocusDotsProps = {
  rgb: string;
};

const COLS = 10;
const ROWS = 6;

// For Practice: a field of dots (equal access to the same information), with one small area lit at
// a time as a moving spotlight sweeps through — application, not access, is what lights anything up.
export function FocusDots({ rgb }: FocusDotsProps) {
  const dots = Array.from({ length: COLS * ROWS }, (_, i) => i);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="grid h-full w-full place-items-center opacity-25"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
      >
        {dots.map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `rgb(${rgb})` }} />
        ))}
      </div>

      <motion.div
        className="absolute grid h-full w-full place-items-center"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          maskImage: "radial-gradient(120px 120px at var(--fx) var(--fy), black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(120px 120px at var(--fx) var(--fy), black, transparent 70%)",
        }}
        animate={{
          "--fx": ["15%", "85%", "50%", "15%"],
          "--fy": ["20%", "70%", "30%", "20%"],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        {dots.map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `rgb(${rgb})` }} />
        ))}
      </motion.div>
    </div>
  );
}

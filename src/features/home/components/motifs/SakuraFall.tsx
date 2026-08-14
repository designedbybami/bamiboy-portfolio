"use client";

import { motion } from "motion/react";

type SakuraFallProps = {
  rgb: string;
};

// Hand-authored, not Math.random(): random petal positions would render differently on the server
// than on the client and trip a hydration mismatch. A fixed, staggered set still reads as natural.
const PETALS = [
  { left: "8%", delay: 0, duration: 9, size: 14, drift: 40, spin: 200 },
  { left: "18%", delay: 1.6, duration: 11, size: 10, drift: -30, spin: -160 },
  { left: "29%", delay: 3.2, duration: 8, size: 16, drift: 25, spin: 240 },
  { left: "41%", delay: 0.8, duration: 10, size: 11, drift: -45, spin: -220 },
  { left: "53%", delay: 4.4, duration: 9.5, size: 13, drift: 35, spin: 180 },
  { left: "64%", delay: 2.2, duration: 12, size: 9, drift: -25, spin: -200 },
  { left: "74%", delay: 5.6, duration: 8.5, size: 15, drift: 30, spin: 260 },
  { left: "84%", delay: 1.2, duration: 10.5, size: 12, drift: -35, spin: -180 },
  { left: "93%", delay: 3.8, duration: 9, size: 10, drift: 20, spin: 220 },
  { left: "50%", delay: 6.4, duration: 11.5, size: 14, drift: -20, spin: -240 },
];

// Falling sakura petals for Ichigo Ichie: each petal loops fall + sideways drift + spin on its own
// clock, so the field never reads as a single repeating cycle even though every petal is deterministic.
export function SakuraFall({ rgb }: SakuraFallProps) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {PETALS.map((petal, i) => (
        <motion.span
          key={i}
          className="absolute top-[-8%] rounded-[60%_10%]"
          style={{ left: petal.left, width: petal.size, height: petal.size * 0.7, backgroundColor: `rgb(${rgb})` }}
          animate={{
            y: ["0vh", "115vh"],
            x: [0, petal.drift, 0],
            rotate: [0, petal.spin],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{ duration: petal.duration, delay: petal.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

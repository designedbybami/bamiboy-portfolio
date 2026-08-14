"use client";

import { motion } from "motion/react";

type SpeedLinesProps = {
  rgb: string;
};

const LINE_COUNT = 16;

// For Resolve: manga-style impact lines radiating from center and pulsing outward, matching the
// shonen register of the Koro Sensei line this principle is built on.
export function SpeedLines({ rgb }: SpeedLinesProps) {
  const lines = Array.from({ length: LINE_COUNT }, (_, i) => (360 / LINE_COUNT) * i);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-0 w-0">
        {lines.map((angle, i) => (
          <motion.span
            key={angle}
            className="absolute left-0 top-0 h-px origin-left"
            style={{ width: "60vmax", backgroundColor: `rgb(${rgb})`, transform: `rotate(${angle}deg)` }}
            animate={{ opacity: [0, 0.5, 0], scaleX: [0.4, 1, 0.4] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: (i % 4) * 0.4 }}
          />
        ))}
      </div>
    </div>
  );
}

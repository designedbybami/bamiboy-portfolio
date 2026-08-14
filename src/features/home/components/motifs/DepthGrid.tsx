"use client";

import { motion } from "motion/react";

type DepthGridProps = {
  rgb: string;
};

// For Perception: three dot layers moving at different speeds, the parallax itself is the point —
// depth read from relative motion, not from anything actually receding in space, same trick AR/VR displays lean on.
const LAYERS = [
  { size: "36px 36px", speed: 26, opacity: 0.15, dot: 2 },
  { size: "56px 56px", speed: 18, opacity: 0.25, dot: 3 },
  { size: "84px 84px", speed: 11, opacity: 0.35, dot: 4 },
];

export function DepthGrid({ rgb }: DepthGridProps) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {LAYERS.map((layer, i) => (
        <motion.div
          key={i}
          className="absolute inset-[-10%]"
          style={{
            backgroundImage: `radial-gradient(rgba(${rgb},1) ${layer.dot}px, transparent ${layer.dot}px)`,
            backgroundSize: layer.size,
            opacity: layer.opacity,
          }}
          animate={{ x: [0, -80, 0] }}
          transition={{ duration: layer.speed, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

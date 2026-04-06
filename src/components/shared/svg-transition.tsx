"use client";

import { motion } from "framer-motion";

export default function SvgTransition({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  // This is the "skeleton" line. It loops like a snake across the screen.
  const snakePath = "M -20,50 Q 50,-50 120,50 Q 50,150 -20,50";

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none flex items-center justify-center">
      <svg 
        className="w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <motion.path 
          d={snakePath}
          fill="transparent"
          stroke="#2F80ED" // Your Electric Royal Blue
          strokeWidth="24" // The magic! This makes the line so thick it covers the screen.
          strokeLinecap="round"
          strokeLinejoin="round"
          // Here is the Osmo trick: we animate the line drawing itself from 0 to 100%
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.76, 0, 0.24, 1] // That buttery smooth Osmo acceleration
          }}
        />
      </svg>
    </div>
  );
}
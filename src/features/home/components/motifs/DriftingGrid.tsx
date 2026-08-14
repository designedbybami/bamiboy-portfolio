"use client";

import { motion } from "motion/react";

type DriftingGridProps = {
  rgb: string;
};

// For Clarity: a slow diagonal drafting-grid drift, echoing the site's own hairline-grid structural
// motif (FrameGuides/DraftLine) since this principle is literally about design discipline.
export function DriftingGrid({ rgb }: DriftingGridProps) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
      <motion.div
        className="absolute inset-[-20%]"
        style={{
          backgroundImage: `linear-gradient(rgba(${rgb},0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},0.35) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "56px 56px"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

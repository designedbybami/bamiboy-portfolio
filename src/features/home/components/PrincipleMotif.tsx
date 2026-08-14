"use client";

import { AnimatePresence, motion } from "motion/react";
import { SakuraFall } from "./motifs/SakuraFall";
import { DriftingGrid } from "./motifs/DriftingGrid";
import { SpeedLines } from "./motifs/SpeedLines";
import { FocusDots } from "./motifs/FocusDots";
import { DepthGrid } from "./motifs/DepthGrid";

const EASE = [0.65, 0, 0.35, 1] as const; // the site's one shared easing curve, see STANDARDS.md

const MOTIF_BY_ID: Record<string, (rgb: string) => React.ReactNode> = {
  "ichigo-ichie": (rgb) => <SakuraFall rgb={rgb} />,
  clarity: (rgb) => <DriftingGrid rgb={rgb} />,
  "anime-line": (rgb) => <SpeedLines rgb={rgb} />,
  "applied-knowledge": (rgb) => <FocusDots rgb={rgb} />,
  perception: (rgb) => <DepthGrid rgb={rgb} />,
};

type PrincipleMotifProps = {
  id: string;
  rgb: string;
};

// Swaps in the active principle's ambient layer. AnimatePresence + key=id, not a single persistent
// element: each motif is a structurally different tree (petal count vs. dot grid vs. radiating
// lines), so crossfading a mount/unmount pair reads cleanly where trying to morph one into another wouldn't.
export function PrincipleMotif({ id, rgb }: PrincipleMotifProps) {
  const render = MOTIF_BY_ID[id];

  return (
    <AnimatePresence mode="wait">
      {render && (
        <motion.div
          key={id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="absolute inset-0"
        >
          {render(rgb)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { motion } from "motion/react";

type MenuToggleIconProps = {
  open: boolean;
  className?: string;
};

// Four small squares morph into an X via plain numeric rect animation (x/y/width/height/
// rotate/rx), not an icon crossfade (two unrelated SVGs fading in/out) and not a path-`d`
// morph between shapes with mismatched point structure (which Motion can't interpolate
// cleanly, only continuous numeric attributes are guaranteed smooth). Custom-built rather
// than sourced from Solar: no off-the-shelf icon pair shares this exact geometry.
// Top-right/bottom-left stay solid throughout; top-left/bottom-right are the secondary
// (50% opacity) pair, matching the site's duotone convention.
const BOX_SIZE = 7;
const BOX_RADIUS = 1.5;
const BAR_HEIGHT = 2;
const BAR_RADIUS = 1;
const TRANSITION = { duration: 0.4, ease: [0.65, 0, 0.35, 1] } as const;

// bar{X,Y} is each square's own half of the X: pre-computed so the pair meeting at the
// viewBox center (12,12) forms one continuous diagonal stroke, not two separate marks.
const SQUARES = [
  { key: "tl", boxX: 3, boxY: 3, barX: 6, barY: 8.5, rotate: 45, solid: false },
  { key: "tr", boxX: 14, boxY: 3, barX: 11, barY: 8.5, rotate: -45, solid: true },
  { key: "bl", boxX: 3, boxY: 14, barX: 6, barY: 13.5, rotate: -45, solid: true },
  { key: "br", boxX: 14, boxY: 14, barX: 11, barY: 13.5, rotate: 45, solid: false },
] as const;

export function MenuToggleIcon({ open, className }: MenuToggleIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {SQUARES.map((square) => (
        <motion.rect
          key={square.key}
          fill="currentColor"
          opacity={square.solid ? 1 : 0.5}
          style={{ originX: 0.5, originY: 0.5 }}
          animate={{
            x: open ? square.barX : square.boxX,
            y: open ? square.barY : square.boxY,
            width: BOX_SIZE,
            height: open ? BAR_HEIGHT : BOX_SIZE,
            rx: open ? BAR_RADIUS : BOX_RADIUS,
            rotate: open ? square.rotate : 0,
          }}
          transition={TRANSITION}
        />
      ))}
    </svg>
  );
}

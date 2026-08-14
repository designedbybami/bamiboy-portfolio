"use client";

import { useScrolled } from "@/shared/lib/useScrolled";

const SCROLL_OFFSET = 100; // roughly when the character's legs reach the bottom edge
const LAYER_COUNT = 8;
const MAX_BLUR_PX = 24;

// backdrop-filter can't interpolate its own blur radius across a gradient, so a single
// blurred layer under an opacity mask just reads as one flat haze. Real progressive blur
// stacks N layers, each blurred more than the last and masked to a band shifted toward the
// edge, each rendered on top of (and so blurring) the ones below within the overlap.
function layerStyle(index: number): React.CSSProperties {
  const progress = index / (LAYER_COUNT - 1);
  const blurPx = progress ** 2 * MAX_BLUR_PX;
  const stops = [index, index + 1, index + 2, index + 3].map((n) => (n * 100) / LAYER_COUNT);
  const mask = `linear-gradient(to bottom, transparent ${stops[0]}%, black ${stops[1]}%, black ${stops[2]}%, transparent ${stops[3]}%)`;

  return {
    zIndex: index + 1,
    backdropFilter: `blur(${blurPx}px)`,
    WebkitBackdropFilter: `blur(${blurPx}px)`,
    maskImage: mask,
    WebkitMaskImage: mask,
  };
}

export function BottomBlur() {
  const scrolled = useScrolled(SCROLL_OFFSET);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-16 transition-opacity duration-500 ease-out motion-reduce:transition-none"
      style={{ opacity: scrolled ? 1 : 0 }}
    >
      {Array.from({ length: LAYER_COUNT }, (_, index) => (
        <div key={index} className="absolute inset-0" style={layerStyle(index)} />
      ))}
    </div>
  );
}

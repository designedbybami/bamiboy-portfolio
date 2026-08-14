import type { CSSProperties } from "react";
import { FRAME_BLEND_COLOR } from "./frame-constants";

type FrameTickProps = {
  style?: CSSProperties;
  zIndex?: number; // set directly here, never on an ancestor (see STANDARDS.md gotcha #8)
};

// Crop-mark "+" at a frame/line intersection, blend-mode difference so it adapts to any background.
export function FrameTick({ style, zIndex }: FrameTickProps) {
  const shared: CSSProperties = { backgroundColor: FRAME_BLEND_COLOR, zIndex, ...style };

  return (
    <>
      <span className="mix-blend-difference pointer-events-none absolute h-px w-2 -translate-x-1/2 -translate-y-1/2" style={shared} />
      <span className="mix-blend-difference pointer-events-none absolute h-2 w-px -translate-x-1/2 -translate-y-1/2" style={shared} />
    </>
  );
}

import type { ReactNode } from "react";
import { FRAME_BLEND_COLOR } from "./frame-constants";

type TickFrameProps = {
  children: ReactNode;
  armLength?: number; // corner bracket arm length, in px
  padding?: number; // between children and the brackets, in px
  className?: string;
};

const CORNERS = [
  { top: true, left: true },
  { top: true, left: false },
  { top: false, left: true },
  { top: false, left: false },
];

// Corner-bracket frame for wrapping arbitrary inline content, same technique as FrameGuides/FrameTick but not tied to the grid's coordinate system.
export function TickFrame({ children, armLength = 8, padding = 10, className }: TickFrameProps) {
  return (
    <div className={`relative inline-block ${className ?? ""}`} style={{ padding }}>
      {CORNERS.map(({ top, left }) => (
        <span
          key={`${top}-${left}-h`}
          aria-hidden
          className="mix-blend-difference pointer-events-none absolute h-px"
          style={{
            width: armLength,
            backgroundColor: FRAME_BLEND_COLOR,
            [top ? "top" : "bottom"]: 0,
            [left ? "left" : "right"]: 0,
          }}
        />
      ))}
      {CORNERS.map(({ top, left }) => (
        <span
          key={`${top}-${left}-v`}
          aria-hidden
          className="mix-blend-difference pointer-events-none absolute w-px"
          style={{
            height: armLength,
            backgroundColor: FRAME_BLEND_COLOR,
            [top ? "top" : "bottom"]: 0,
            [left ? "left" : "right"]: 0,
          }}
        />
      ))}
      {children}
    </div>
  );
}

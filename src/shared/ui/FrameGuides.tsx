import { FrameTick } from "./FrameTick";
import { FRAME_BLEND_COLOR } from "./frame-constants";

type Side = "top" | "right" | "bottom" | "left";

type FrameGuidesProps = {
  inset?: number;
  position?: "absolute" | "fixed"; // fixed = viewport-pinned, absolute = grows with the nearest positioned ancestor
  sides?: Side[]; // omit "bottom" to let a section's own DraftLine be the boundary instead
  zIndex?: number; // set directly here, never on the outer wrapper (see STANDARDS.md gotcha #8)
  className?: string;
};

const ALL_SIDES: Side[] = ["top", "right", "bottom", "left"];

const TICKS: { top: "0%" | "50%" | "100%"; left: "0%" | "50%" | "100%" }[] = [
  { top: "0%", left: "0%" },
  { top: "0%", left: "50%" },
  { top: "0%", left: "100%" },
  { top: "50%", left: "0%" },
  { top: "50%", left: "100%" },
  { top: "100%", left: "0%" },
  { top: "100%", left: "50%" },
  { top: "100%", left: "100%" },
];

// Drops a tick if a side it sits on isn't drawn.
function tickSides(tick: { top: string; left: string }): Side[] {
  const sides: Side[] = [];
  if (tick.top === "0%") sides.push("top");
  if (tick.top === "100%") sides.push("bottom");
  if (tick.left === "0%") sides.push("left");
  if (tick.left === "100%") sides.push("right");
  return sides;
}

// Figma-canvas style frame: hairline border with crop-mark ticks, blend-mode difference so it adapts to any background.
export function FrameGuides({ inset = 20, position = "absolute", sides = ALL_SIDES, zIndex, className }: FrameGuidesProps) {
  const visibleTicks = TICKS.filter((tick) => tickSides(tick).every((side) => sides.includes(side)));

  return (
    <div
      aria-hidden
      className={`pointer-events-none ${position} ${className ?? ""}`}
      style={{ inset }}
    >
      <div
        className="mix-blend-difference absolute inset-0"
        style={{
          borderTopWidth: sides.includes("top") ? 1 : 0,
          borderRightWidth: sides.includes("right") ? 1 : 0,
          borderBottomWidth: sides.includes("bottom") ? 1 : 0,
          borderLeftWidth: sides.includes("left") ? 1 : 0,
          borderStyle: "solid",
          borderColor: FRAME_BLEND_COLOR,
          zIndex,
        }}
      />
      {visibleTicks.map((tick, i) => (
        <FrameTick key={i} style={{ top: tick.top, left: tick.left }} zIndex={zIndex} />
      ))}
    </div>
  );
}

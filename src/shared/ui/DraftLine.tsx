import { FrameTick } from "./FrameTick";
import { FRAME_BLEND_COLOR, SITE_FRAME_INSET } from "./frame-constants";

type DraftLineProps = {
  className?: string;
  pattern?: "hatch" | "plain"; // hatch is the diagonal-stripe divider, plain is a bare hairline
  zIndex?: number; // set directly here, never on the outer wrapper (see FrameTick)
};

const CORNERS: { top: "0%" | "100%"; left: "0%" | "100%" }[] = [
  { top: "0%", left: "0%" },
  { top: "0%", left: "100%" },
  { top: "100%", left: "0%" },
  { top: "100%", left: "100%" },
];

// A section's own bottom line, with a tick at each corner so it reads as connected to SiteFrame's grid.
export function DraftLine({ className, pattern = "hatch", zIndex }: DraftLineProps) {
  return (
    <div
      aria-hidden
      className={`relative h-6 ${className ?? ""}`}
      // Assumes the containing section has no horizontal padding of its own.
      style={{ marginLeft: SITE_FRAME_INSET, marginRight: SITE_FRAME_INSET }}
    >
      <div
        className="mix-blend-difference absolute inset-0 border-y"
        style={{
          borderColor: FRAME_BLEND_COLOR,
          backgroundImage:
            pattern === "hatch"
              ? `repeating-linear-gradient(45deg, ${FRAME_BLEND_COLOR} 0px, ${FRAME_BLEND_COLOR} 1px, transparent 1px, transparent 8px)`
              : undefined,
          zIndex,
        }}
      />
      {CORNERS.map((corner, i) => (
        <FrameTick key={i} style={{ top: corner.top, left: corner.left }} zIndex={zIndex} />
      ))}
    </div>
  );
}

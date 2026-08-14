import { FrameTick } from "./FrameTick";
import { SITE_FRAME_INSET } from "./frame-constants";

// Center ticks scoped to the nearest positioned ancestor's own height, not SiteFrame's page-relative
// one (which drifts to whatever the whole page's midpoint happens to be and reads as a stray mark).
export function SectionCenterTicks() {
  return (
    <div aria-hidden className="pointer-events-none absolute" style={{ inset: SITE_FRAME_INSET }}>
      <FrameTick style={{ top: "50%", left: "0%" }} zIndex={10} />
      <FrameTick style={{ top: "50%", left: "100%" }} zIndex={10} />
    </div>
  );
}

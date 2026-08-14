import { FrameGuides } from "@/shared/ui/FrameGuides";
import { SITE_FRAME_INSET } from "@/shared/ui/frame-constants";

// Site's persistent top/left/right lines, independent of the nav. No bottom line, each section supplies its own via DraftLine.
export function SiteFrame() {
  return <FrameGuides position="absolute" inset={SITE_FRAME_INSET} sides={["top", "left", "right"]} zIndex={40} />;
}

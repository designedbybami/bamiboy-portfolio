"use client";

import { ShaderBackground } from "@/shared/ui/ShaderBackground";
import { siteConfig } from "@/shared/lib/site-config";
import { useTextMaskImage } from "@/shared/lib/useTextMaskImage";
import { footerWordmarkPreset } from "../shader-presets";

const MASK_WIDTH = 1200;
const MASK_HEIGHT = 260;
const MASK_FONT_SIZE = 168;

// The glass/metal shader is genuinely masked to the wordmark's exact glyph shapes, not just
// blended under it. The mask is a canvas-rendered PNG of the real `--font-display` typeface (see
// useTextMaskImage), applied via `mask-image` — the same raster-mask technique DraggableSticker's
// shimmer already uses, just generated at runtime instead of shipped as a file. An inline SVG
// <pattern>/<foreignObject> approach was tried first (canvas embedded directly in an SVG mask
// source) and verified, via an isolated test file with no React/shader involved, to render
// nothing in a real browser — a known-fragile spec corner, not a one-off bug — so it was dropped
// for this reliable, plain-CSS-mask alternative.
export function FooterWordmark() {
  const maskUrl = useTextMaskImage({
    text: siteConfig.logoText,
    widthPx: MASK_WIDTH,
    heightPx: MASK_HEIGHT,
    fontSizePx: MASK_FONT_SIZE,
  });

  return (
    <div className="relative mx-auto w-full max-w-6xl" style={{ aspectRatio: `${MASK_WIDTH} / ${MASK_HEIGHT}` }}>
      <span className="sr-only">{siteConfig.logoText}</span>
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: maskUrl ? 1 : 0,
          maskImage: maskUrl ? `url(${maskUrl})` : undefined,
          WebkitMaskImage: maskUrl ? `url(${maskUrl})` : undefined,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      >
        <ShaderBackground
          components={footerWordmarkPreset}
          className="absolute inset-0 h-full w-full"
          fallbackClassName="bg-gradient-to-br from-white/40 via-white/15 to-transparent"
        />
      </div>
    </div>
  );
}

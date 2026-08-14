"use client";

import { useEffect, useState } from "react";

type TextMaskOptions = {
  text: string;
  fontWeight?: number;
  widthPx: number;
  heightPx: number;
  fontSizePx: number;
};

// Renders text to an offscreen canvas using the page's own loaded webfont, then returns it as a
// PNG data URL — a real raster silhouette usable as `mask-image`, the same technique
// DraggableSticker's shimmer already relies on for masking with an image asset. Tried first: an
// inline SVG <pattern>/<foreignObject> holding the live canvas, masked via <text fill="url(#…)">.
// Verified directly against a real browser with an isolated test file (foreignObject inside an
// SVG pattern, no React or shader involved at all) — it renders nothing. That's a known-fragile
// corner of the SVG spec across engines, not a one-off bug, so it was dropped for this: a plain
// raster mask has none of that fragility, and `document.fonts.ready` guarantees the real
// `--font-display` typeface (not a fallback) is what actually gets traced.
export function useTextMaskImage({ text, fontWeight = 700, widthPx, heightPx, fontSizePx }: TextMaskOptions) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      if (document.fonts?.ready) await document.fonts.ready;
      if (cancelled) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      canvas.width = widthPx * dpr;
      canvas.height = heightPx * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      // Resolve the font through a real DOM element carrying the site's own `.font-display`
      // class, not by reading `--font-display` as a raw string and splicing it into `ctx.font`.
      // next/font's CSS variable holds an internally generated token; getComputedStyle().fontFamily
      // on an element that actually has the class applied returns the fully-resolved font stack
      // canvas can parse, the same resolution path every other on-page use of the typeface goes
      // through — reading the custom property directly and hoping it round-trips through the
      // `font` shorthand silently fell back to a system sans-serif instead of Clash Display.
      const probe = document.createElement("span");
      probe.className = "font-display";
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      document.body.appendChild(probe);
      const displayFont = getComputedStyle(probe).fontFamily || "sans-serif";
      probe.remove();

      const upperText = text.toUpperCase();
      const padding = widthPx * 0.04;

      // Measure first and shrink to fit: a fixed fontSizePx clipped the last couple of
      // characters off "DesignedbyBami" at 14 glyphs bold — canvas text isn't wrapped or
      // auto-shrunk like CSS text, it just draws (and clips) past the canvas edge.
      ctx.font = `${fontWeight} ${fontSizePx}px ${displayFont}`;
      const measuredWidth = ctx.measureText(upperText).width;
      const availableWidth = widthPx - padding * 2;
      const effectiveFontSize = measuredWidth > availableWidth ? fontSizePx * (availableWidth / measuredWidth) : fontSizePx;

      ctx.font = `${fontWeight} ${effectiveFontSize}px ${displayFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(upperText, widthPx / 2, heightPx / 2);

      if (!cancelled) setDataUrl(canvas.toDataURL("image/png"));
    }

    void draw();
    return () => {
      cancelled = true;
    };
  }, [text, fontWeight, widthPx, heightPx, fontSizePx]);

  return dataUrl;
}

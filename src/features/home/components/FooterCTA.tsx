"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { trackEvent } from "@/shared/lib/analytics";
import { DirectionalHoverText, type HoverEdge } from "@/shared/ui/DirectionalHoverText";
import { footerCopy } from "../copy";

// Same directional-roll + one-color-sweep language as DirectionalLinkRow, but centered and at
// display scale for the footer's single big CTA, so it doesn't inherit that component's fixed
// justify-between/trailing-arrow row shape (see STANDARDS.md #3 on never letting two classes for
// the same property compete).
//
// Rendered as two explicit stacked lines (`footerCopy.ctaLines`), not one string left to wrap
// naturally: a single wrapped block only reliably underlines its own line box in every browser
// when each line is its own element, and it guarantees the two-line layout the design calls for
// regardless of viewport width instead of collapsing to one line on anything wide enough.
// `leading-none` on each line keeps the hover/click hit-box hugging the glyphs' own ink rather
// than the font's half-leading whitespace — at this size that whitespace was wide enough to sit
// "outside the letters," blocking the ChromaFlow background's own cursor-tracking underneath
// wherever it overlapped.
//
// The underline itself is a manually-positioned bar (`DirectionalLinkRow`'s technique), not native
// `text-decoration`: slot-text (which DirectionalHoverText uses) splits each line into one
// overflow-hidden container per character for the roll animation, and that per-character clipping
// box cut off the native underline entirely, it rendered on hover-color-change but never actually
// painted a visible line. A real element below the text has nothing to be clipped by.
export function FooterCTA() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const [edge, setEdge] = useState<HoverEdge>("bottom");

  const readEdge = (clientY: number, rect: DOMRect): HoverEdge => (clientY < rect.top + rect.height / 2 ? "top" : "bottom");

  const handleEnter = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setEdge(readEdge(event.clientY, rect));
    setHovered(true);
  };

  const handleLeave = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setEdge(readEdge(event.clientY, rect));
    setHovered(false);
  };

  const resolvedTextClassName = `block w-fit text-center font-display font-bold uppercase leading-none transition-colors duration-300 motion-reduce:transition-none ${
    hovered ? "text-primary" : "text-white"
  }`;

  return (
    <Link
      ref={ref}
      href={footerCopy.ctaHref}
      aria-label={footerCopy.ctaLabel}
      onClick={() => trackEvent({ event: "contact_click", cta_location: "footer_cta" })}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}
      className="group relative inline-flex w-fit max-w-full flex-col items-center gap-1"
    >
      {footerCopy.ctaLines.map((line) => (
        <span key={line} className="relative inline-block">
          <DirectionalHoverText hovered={hovered} edge={edge} className={resolvedTextClassName}>
            {line}
          </DirectionalHoverText>
          <span
            aria-hidden
            className={`absolute inset-x-0 -bottom-2 h-1 origin-left bg-primary transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${
              hovered ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </span>
      ))}
    </Link>
  );
}

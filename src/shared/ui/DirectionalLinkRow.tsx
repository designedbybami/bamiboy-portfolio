"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { Icon } from "@iconify/react";
import { DirectionalHoverText, type HoverEdge } from "./DirectionalHoverText";

type DirectionalLinkRowProps = {
  href: string;
  children: string;
  onClick?: () => void;
  /** Typography only, no color — e.g. "font-display text-4xl font-bold". */
  typographyClassName?: string;
  /** Rest-state text color, e.g. "text-paper". Split from typography (not folded into
   * one string) for the same reason as Button's textClassName/hoverText: resolved to
   * exactly one color class at a time, never two competing ones (see STANDARDS.md). */
  textColorClassName?: string;
  className?: string;
};

/**
 * A link row: label on the left, an arrow pinned to the far end via `justify-between`.
 *
 * The label recolors in place (one real render, one color class swapped for another) —
 * NOT a colored duplicate stacked on top of the base text. That was the first version of
 * this component, and it produced a visible white "ghost" outline around the hover color:
 * slot-text (which DirectionalHoverText uses) rebuilds the label into one `<span>` per
 * character, and that per-character layout renders at very slightly different metrics
 * than a plain, un-spanned text run of the identical string — so a duplicate never
 * pixel-aligns with the original. Recoloring the actual rendered characters (color
 * inherits from the ref'd span down through slot-text's own children) has nothing to
 * misalign, because there's only ever one set of glyphs.
 *
 * The "sweep" motion still reads directionally through two things that DON'T depend on
 * duplicating the text: the underline (a real left-to-right `scale-x` reveal, the site's
 * established sweep technique) and the arrow (fades/reveals in the same accent color).
 *
 * The arrow is invisible at rest, revealed only on hover or press (`active:`), and only
 * ever appears in the one accent color (text-primary) — never a separate rest-state
 * color, so there's nothing to transition color-wise, only opacity. Straight-right icon
 * (`arrow-right-line-duotone`) used directly rather than rotating a diagonal one: same
 * rotation-math ambiguity Button.tsx already hit and solved by swapping icons instead.
 */
export function DirectionalLinkRow({
  href,
  children,
  onClick,
  typographyClassName = "",
  textColorClassName = "",
  className = "",
}: DirectionalLinkRowProps) {
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

  const resolvedTextClassName = `${typographyClassName} transition-colors duration-300 motion-reduce:transition-none ${
    hovered ? "text-primary" : textColorClassName
  }`;

  return (
    <Link
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`flex items-center justify-between gap-4 ${className}`}
    >
      <span className="relative inline-block">
        <DirectionalHoverText hovered={hovered} edge={edge} className={resolvedTextClassName}>
          {children}
        </DirectionalHoverText>
        <span
          aria-hidden
          className={`absolute inset-x-0 -bottom-1 h-[3px] origin-left bg-primary transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${
            hovered ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </span>
      <Icon
        icon="solar:arrow-right-line-duotone"
        aria-hidden
        className={`size-6 shrink-0 transition-opacity duration-300 active:opacity-100 active:text-primary motion-reduce:transition-none ${
          hovered ? "opacity-100 text-primary" : "opacity-0"
        }`}
      />
    </Link>
  );
}

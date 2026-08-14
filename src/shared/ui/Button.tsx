"use client";

import { useRef, useState, type MouseEvent, type RefObject } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { Icon } from "@iconify/react";
import { DirectionalHoverText, type HoverEdge } from "./DirectionalHoverText";

type ButtonProps = {
  children: string;
  icon?: string; // rest-state icon, verified diagonal path against Solar's duotone set
  hoverIcon?: string; // hover-state icon, verified straight path against Solar's duotone set
  className: string; // rest-state chrome only, no hover: variants (hover is handled explicitly below)
  textClassName: string; // kept separate from className so two conflicting text-* classes never coexist (see STANDARDS.md)
  hoverBg: string; // color that sweeps in from the entered edge to cover the whole button
  hoverText?: string; // defaults to textClassName if omitted
  layout?: boolean; // forwarded to Motion so this can join a parent's layout FLIP (e.g. the nav's scroll morph)
  layoutTransition?: Transition;
  wave?: boolean; // swaps the icon slot for a waving 👋 emoji, no wave gesture exists in Solar's set
} & ({ href: string; onClick?: undefined } | { href?: undefined; onClick: () => void });

const DEFAULT_ICON = "solar:arrow-right-up-line-duotone";
const DEFAULT_HOVER_ICON = "solar:arrow-right-line-duotone";

// Settles back to 0deg rather than looping, replays each time `hovered` flips true.
const WAVE_KEYFRAMES = [0, 18, -10, 18, -6, 10, 0];
const WAVE_TRANSITION = { duration: 0.9, ease: "easeInOut" } as const;

const ICON_TRANSITION = { duration: 0.45, ease: [0.65, 0, 0.35, 1] } as const; // shared by both crossfade layers so they can't drift out of sync

const FILL_BASE_DIAMETER = 16; // resting diameter of the fill dot, in px, before it scales up
const FILL_SCALE_MARGIN = 1.15; // safety margin over the exact corner-covering scale

type FillOrigin = { x: number; y: number; scale: number };

const DEFAULT_FILL_ORIGIN: FillOrigin = { x: 0, y: 0, scale: 1 };

// Computed from the button's actual size each call, not a guessed constant, so it holds for any button size.
function computeFillOrigin(rect: DOMRect, clientX: number, clientY: number): FillOrigin {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const corners: Array<[number, number]> = [
    [0, 0],
    [rect.width, 0],
    [0, rect.height],
    [rect.width, rect.height],
  ];
  const maxCornerDistance = Math.max(...corners.map(([cx, cy]) => Math.hypot(cx - x, cy - y)));
  const scale = (maxCornerDistance / (FILL_BASE_DIAMETER / 2)) * FILL_SCALE_MARGIN;
  return { x, y, scale };
}

// Shared button primitive; one hover state here drives the text roll, color fill, and icon swap together.
export function Button({
  children,
  icon = DEFAULT_ICON,
  hoverIcon = DEFAULT_HOVER_ICON,
  className,
  textClassName,
  hoverBg,
  hoverText,
  layout,
  layoutTransition,
  wave,
  href,
  onClick,
}: ButtonProps) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [edge, setEdge] = useState<HoverEdge>("bottom");
  const [fillOrigin, setFillOrigin] = useState<FillOrigin>(DEFAULT_FILL_ORIGIN);

  const readEdge = (clientY: number, rect: DOMRect): HoverEdge => {
    return clientY < rect.top + rect.height / 2 ? "top" : "bottom";
  };

  const handleEnter = (event: MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setEdge(readEdge(event.clientY, rect));
    setFillOrigin(computeFillOrigin(rect, event.clientX, event.clientY));
    setHovered(true);
  };

  const handleLeave = (event: MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setEdge(readEdge(event.clientY, rect));
    setFillOrigin(computeFillOrigin(rect, event.clientX, event.clientY)); // re-anchor to the exit point, not the entry point
    setHovered(false);
  };

  const handleFocus = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setEdge("bottom");
      setFillOrigin(computeFillOrigin(rect, rect.left + rect.width / 2, rect.top + rect.height));
    }
    setHovered(true);
  };

  const handleBlur = () => setHovered(false);

  const resolvedTextClassName = hovered ? (hoverText ?? textClassName) : textClassName;

  const content = (
    <span className={`relative z-10 inline-flex items-center gap-1.5 uppercase tracking-wide transition-colors duration-300 motion-reduce:transition-none ${resolvedTextClassName}`}>
      <DirectionalHoverText hovered={hovered} edge={edge}>
        {children}
      </DirectionalHoverText>
      {wave ? (
        <motion.span
          aria-hidden
          className="relative inline-flex size-4 shrink-0 origin-[70%_70%] items-center justify-center text-base leading-none"
          animate={prefersReducedMotion ? {} : { rotate: hovered ? WAVE_KEYFRAMES : 0 }}
          transition={hovered && !prefersReducedMotion ? WAVE_TRANSITION : { duration: 0.2, ease: "easeOut" }}
        >
          👋
        </motion.span>
      ) : (
        <span className="relative inline-flex size-4 shrink-0">
          <motion.span
            className="absolute inset-0 inline-flex"
            animate={
              prefersReducedMotion
                ? { opacity: hovered ? 0 : 1 }
                : {
                    opacity: hovered ? 0 : 1,
                    x: hovered ? 6 : 0,
                    y: hovered ? -6 : 0,
                    scale: hovered ? 0.8 : 1,
                    filter: hovered ? "blur(2px)" : "blur(0px)",
                  }
            }
            transition={ICON_TRANSITION}
          >
            <Icon icon={icon} aria-hidden className="size-4" />
          </motion.span>
          <motion.span
            className="absolute inset-0 inline-flex"
            animate={
              prefersReducedMotion
                ? { opacity: hovered ? 1 : 0 }
                : {
                    opacity: hovered ? 1 : 0,
                    x: hovered ? 0 : -6,
                    scale: hovered ? 1 : 0.8,
                    filter: hovered ? "blur(0px)" : "blur(2px)",
                  }
            }
            transition={ICON_TRANSITION}
          >
            <Icon icon={hoverIcon} aria-hidden className="size-4" />
          </motion.span>
        </span>
      )}
    </span>
  );

  const fill = (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${hoverBg} transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none`}
      style={{
        left: fillOrigin.x,
        top: fillOrigin.y,
        width: FILL_BASE_DIAMETER,
        height: FILL_BASE_DIAMETER,
        transform: `translate(-50%, -50%) scale(${hovered ? fillOrigin.scale : 0})`,
      }}
    />
  );

  const interactionProps = {
    layout,
    transition: layoutTransition,
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    className: `relative inline-flex items-center overflow-hidden ${className}`,
  };

  if (href) {
    return (
      <motion.a ref={ref as RefObject<HTMLAnchorElement>} href={href} {...interactionProps}>
        {fill}
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button ref={ref as RefObject<HTMLButtonElement>} type="button" onClick={onClick} {...interactionProps}>
      {fill}
      {content}
    </motion.button>
  );
}

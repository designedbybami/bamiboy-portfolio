"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { animate, motion, useDragControls, useMotionValue, useReducedMotion, type Variants } from "motion/react";
import { FRAME_BLEND_COLOR } from "@/shared/ui/frame-constants";

export type StickerRegistration = {
  ref: RefObject<HTMLDivElement | null>;
  isDragging: () => boolean;
  impulse: (dx: number, dy: number) => void;
};

type Corner = "nw" | "ne" | "sw" | "se";

type DraggableStickerProps = {
  id: string;
  src: string;
  alt: string;
  size?: number;
  restRotation?: number; // resting tilt this settles back to after a drag, degrees; also its initial tilt
  className?: string;
  style?: CSSProperties; // placement, merged with the internal x/y/rotate motion values, not replacing them
  dragConstraintsRef?: RefObject<HTMLElement | null>;
  variants?: Variants; // entrance stagger from an ancestor; deliberately excludes rotate/x/y since those are already live motion values elsewhere
  onRegister?: (id: string, entry: StickerRegistration) => () => void; // registers with StickerField's collision system, called once on mount
};

const PADDING = 9;
const MIN_SIZE = 22;
const MAX_SIZE = 96;
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

const VELOCITY_TO_TILT = 0.02; // tuned so a quick flick reaches close to MAX_TILT without needing an unrealistically fast drag
const MAX_TILT = 20;
const SETTLE_TRANSITION = { type: "spring", stiffness: 300, damping: 20 } as const;

const DRAG_TRANSITION = { power: 0.35, timeConstant: 200, bounceStiffness: 420, bounceDamping: 24 } as const; // gives a throw real weight instead of stopping dead on release

const IMPULSE_SPRING = { type: "spring", stiffness: 260, damping: 20 } as const; // absorbs a collision impulse into a bounce, not a teleport

const SHIMMER_TRANSITION = { duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 1.4 } as const; // real gap between passes so two sweeps never overlap

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cornerPositionClass(corner: Corner) {
  const top = corner[0] === "n" ? "-top-1.5" : "-bottom-1.5";
  const left = corner[1] === "w" ? "-left-1.5" : "-right-1.5";
  return `${top} ${left}`;
}

function cornerCursor(corner: Corner) {
  return corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize";
}

// One of the floating tool-logo stickers around the character, built on Motion's own drag rather than a dedicated drag library. Three interaction states (hover/drag/resize) show deliberately different chrome; see STANDARDS.md for the full rationale.
export function DraggableSticker({
  id,
  src,
  alt,
  size: initialSize = 40,
  restRotation = 0,
  className,
  style,
  dragConstraintsRef,
  variants,
  onRegister,
}: DraggableStickerProps) {
  const shouldReduceMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const rotate = useMotionValue(restRotation);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tooltipX = useMotionValue(0);
  const tooltipY = useMotionValue(0);

  const [size, setSize] = useState(initialSize);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<Corner | null>(null);
  const [mounted, setMounted] = useState(false);
  const isDraggingRef = useRef(false);
  const resizingRef = useRef<Corner | null>(null); // source of truth for handleResizeMove; pointermove can outrun the setResizing() re-render, so state alone would drop early events
  const resizeStart = useRef({ x: 0, y: 0, size: initialSize, motionX: 0, motionY: 0 });

  const showBorder = hovered && !dragging && resizing === null;
  const showHandles = (hovered || resizing !== null) && !dragging;
  const showTooltip = hovered && !dragging && resizing === null;
  const showShimmer = hovered || dragging || resizing !== null;
  const showRestCorners = !hovered && !dragging && resizing === null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- document.body (the portal target below) doesn't exist during SSR
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!onRegister) return;
    return onRegister(id, {
      ref: wrapperRef,
      isDragging: () => isDraggingRef.current,
      impulse: (dx, dy) => {
        if (shouldReduceMotion) return;
        animate(x, x.get() + dx, IMPULSE_SPRING);
        animate(y, y.get() + dy, IMPULSE_SPRING);
      },
    });
  }, [id, onRegister, x, y, shouldReduceMotion]);

  const handlePointerMove = (event: ReactPointerEvent) => {
    tooltipX.set(event.clientX);
    tooltipY.set(event.clientY);
  };

  const startResize = (corner: Corner) => (event: ReactPointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    resizeStart.current = { x: event.clientX, y: event.clientY, size, motionX: x.get(), motionY: y.get() };
    resizingRef.current = corner;
    setResizing(corner);
    (event.target as Element).setPointerCapture(event.pointerId);
  };

  // Opposite-corner anchoring (Figma-style): nudges x/y by the size delta so the corner not being dragged stays put, or the icon visibly drifts as it grows.
  const handleResizeMove = (event: ReactPointerEvent) => {
    const corner = resizingRef.current;
    if (!corner) return;
    const dirX = corner[1] === "e" ? 1 : -1;
    const dirY = corner[0] === "s" ? 1 : -1;
    const dx = event.clientX - resizeStart.current.x;
    const dy = event.clientY - resizeStart.current.y;
    const delta = (dx * dirX + dy * dirY) / 2;
    const newSize = clamp(resizeStart.current.size + delta, MIN_SIZE, MAX_SIZE);
    const actualDelta = newSize - resizeStart.current.size;
    setSize(newSize);

    const compensateX = corner[1] === "w" ? -actualDelta : 0;
    const compensateY = corner[0] === "n" ? -actualDelta : 0;
    x.set(resizeStart.current.motionX + compensateX);
    y.set(resizeStart.current.motionY + compensateY);
  };

  const endResize = (event: ReactPointerEvent) => {
    if (!resizingRef.current) return;
    resizingRef.current = null;
    (event.target as Element).releasePointerCapture(event.pointerId);
    setResizing(null);
  };

  return (
    <motion.div
      ref={wrapperRef}
      drag
      dragListener={false}
      dragControls={dragControls}
      variants={variants}
      dragConstraints={dragConstraintsRef}
      dragElastic={0.2}
      dragMomentum={!shouldReduceMotion}
      dragTransition={shouldReduceMotion ? undefined : DRAG_TRANSITION}
      whileDrag={shouldReduceMotion ? undefined : { scale: 1.08 }}
      style={{ ...style, x, y, rotate }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onPointerMove={handlePointerMove}
      onDragStart={() => {
        isDraggingRef.current = true;
        setDragging(true);
      }}
      onDrag={(_, info) => {
        if (shouldReduceMotion) return;
        rotate.set(restRotation + clamp(info.velocity.x * VELOCITY_TO_TILT, -MAX_TILT, MAX_TILT));
      }}
      onDragEnd={() => {
        isDraggingRef.current = false;
        setDragging(false);
        if (!shouldReduceMotion) animate(rotate, restRotation, SETTLE_TRANSITION);
      }}
      className={`absolute z-20 cursor-grab touch-none active:cursor-grabbing ${className ?? ""}`}
    >
      {/* `drag` is started manually (`dragControls.start`) only from this box, never
          automatically from a bare pointerdown on the wrapper (`dragListener={false}`
          above) — the earlier automatic-listener version raced with the resize handles'
          own pointerdown handlers unpredictably (skipping/glitching resize, the body
          sometimes dragging instead of resizing, state getting stuck). Handles are
          children of this same box but sit on top (z-30) and call stopPropagation, so a
          pointerdown that actually lands on a handle never reaches this handler. */}
      <div
        onPointerDown={(event) => dragControls.start(event)}
        className="relative"
        style={{ padding: PADDING, width: size + PADDING * 2, height: size + PADDING * 2 }}
      >
        {/* Rest state: same tick-corner language as TickFrame, inlined since it crossfades against the hover/drag states below. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: showRestCorners ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {CORNERS.map((corner) => (
            <span key={`${corner}-h`} className={`mix-blend-difference absolute h-px w-1.5`} style={{ backgroundColor: FRAME_BLEND_COLOR, ...(corner[0] === "n" ? { top: 0 } : { bottom: 0 }), ...(corner[1] === "w" ? { left: 0 } : { right: 0 }) }} />
          ))}
          {CORNERS.map((corner) => (
            <span key={`${corner}-v`} className={`mix-blend-difference absolute h-1.5 w-px`} style={{ backgroundColor: FRAME_BLEND_COLOR, ...(corner[0] === "n" ? { top: 0 } : { bottom: 0 }), ...(corner[1] === "w" ? { left: 0 } : { right: 0 }) }} />
          ))}
        </motion.div>

        {/* Hover-only selection border, bold primary blue (not blend-adaptive) so it reads as an obvious "you're holding this" affordance. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[2px] border border-primary"
          animate={{ opacity: showBorder ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        <div className="relative" style={{ width: size, height: size }}>
          <Image src={src} alt={alt} width={size} height={size} draggable={false} className="pointer-events-none select-none" />

          {/* Shimmer: mask-image clips the gradient sweep to the logo's own silhouette, the raster equivalent of the badge's background-clip: text sweep. */}
          {!shouldReduceMotion && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                maskImage: `url(${src})`,
                WebkitMaskImage: `url(${src})`,
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
                backgroundImage: "linear-gradient(110deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 65%)",
                backgroundSize: "250% 250%",
                backgroundRepeat: "no-repeat",
              }}
              animate={showShimmer ? { opacity: 1, backgroundPositionX: ["-120%", "220%"] } : { opacity: 0 }}
              transition={showShimmer ? SHIMMER_TRANSITION : { duration: 0.2 }}
            />
          )}
        </div>

        {/* setPointerCapture keeps move/up routed here even once the cursor leaves the small hitbox mid-resize. */}
        {showHandles &&
          CORNERS.map((corner) => (
            <div
              key={corner}
              onPointerDown={startResize(corner)}
              onPointerMove={handleResizeMove}
              onPointerUp={endResize}
              className={`absolute z-30 size-2 rounded-[2px] border border-primary bg-white ${cornerPositionClass(corner)}`}
              style={{ cursor: cornerCursor(corner), touchAction: "none" }}
            />
          ))}
      </div>

      {mounted &&
        showTooltip &&
        createPortal(
          // Portal to document.body: this element has its own transform (drag/rotate), and a fixed-position child of a transformed ancestor positions relative to that ancestor, not the viewport.
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ left: tooltipX, top: tooltipY, translateX: "14px", translateY: "-50%" }}
            className="pointer-events-none fixed z-50 rounded-md bg-ink px-2 py-1 text-xs font-medium text-white shadow-lg"
          >
            {alt}
          </motion.div>,
          document.body,
        )}
    </motion.div>
  );
}

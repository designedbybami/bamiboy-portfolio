"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import type { AnimationOptions, DOMKeyframesDefinition } from "motion";
import { useAnimate } from "motion/react";

const MathUtils = {
  lerp: (a: number, b: number, n: number) => (1 - n) * a + n * b,
  distance: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
};

// No default position utility on the root, caller's className must set `relative` or `absolute` (avoids conflicting position classes).
type ImageTrailProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  as?: ElementType;
  /** Pixels the cursor must travel before the next item fires. */
  threshold?: number;
  /** Momentum lag for the cached cursor position, 0-1. */
  intensity?: number;
  keyframes?: DOMKeyframesDefinition;
  keyframesOptions?: AnimationOptions;
  trailElementAnimationKeyframes?: { x?: AnimationOptions; y?: AnimationOptions };
  /** How many times `children` repeats to build the recycled item pool. */
  repeatChildren?: number;
  baseZIndex?: number;
  zIndexDirection?: "new-on-top" | "old-on-top";
};

export function ImageTrail({
  className,
  as = "div",
  children,
  threshold = 100,
  intensity = 0.3,
  keyframes,
  keyframesOptions,
  repeatChildren = 3,
  trailElementAnimationKeyframes = {
    x: { duration: 1, type: "tween", ease: "easeOut" },
    y: { duration: 1, type: "tween", ease: "easeOut" },
  },
  baseZIndex = 0,
  zIndexDirection = "new-on-top",
  ...props
}: ImageTrailProps) {
  const allImages = useRef<NodeListOf<HTMLElement>>(undefined);
  const currentId = useRef(0);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const cachedMousePos = useRef({ x: 0, y: 0 });
  const [containerRef, animate] = useAnimate();
  const zIndices = useRef<number[]>([]);

  const clampedIntensity = useMemo(() => Math.max(0.0001, Math.min(1, intensity)), [intensity]);

  useEffect(() => {
    allImages.current = containerRef?.current?.querySelectorAll(".image-trail-item") as NodeListOf<HTMLElement>;
    zIndices.current = Array.from({ length: allImages.current.length }, (_, index) => index);
  }, [containerRef]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const containerRect = containerRef?.current?.getBoundingClientRect();
    const mousePos = { x: e.clientX - (containerRect?.left || 0), y: e.clientY - (containerRect?.top || 0) };

    cachedMousePos.current.x = MathUtils.lerp(cachedMousePos.current.x || mousePos.x, mousePos.x, clampedIntensity);
    cachedMousePos.current.y = MathUtils.lerp(cachedMousePos.current.y || mousePos.y, mousePos.y, clampedIntensity);

    const distance = MathUtils.distance(mousePos.x, mousePos.y, lastMousePos.current.x, lastMousePos.current.y);

    if (distance > threshold && allImages.current) {
      const N = allImages.current.length;
      const current = currentId.current;

      if (zIndexDirection === "new-on-top") {
        for (let i = 0; i < N; i++) if (i !== current) zIndices.current[i] -= 1;
        zIndices.current[current] = N - 1;
      } else {
        for (let i = 0; i < N; i++) if (i !== current) zIndices.current[i] += 1;
        zIndices.current[current] = 0;
      }

      allImages.current[current].style.display = "block";
      allImages.current.forEach((img, index) => {
        img.style.zIndex = String(zIndices.current[index] + baseZIndex);
      });

      animate(
        allImages.current[current],
        {
          x: [cachedMousePos.current.x - allImages.current[current].offsetWidth / 2, mousePos.x - allImages.current[current].offsetWidth / 2],
          y: [cachedMousePos.current.y - allImages.current[current].offsetHeight / 2, mousePos.y - allImages.current[current].offsetHeight / 2],
          ...keyframes,
        },
        { ...trailElementAnimationKeyframes.x, ...trailElementAnimationKeyframes.y, ...keyframesOptions }
      );

      currentId.current = (current + 1) % N;
      lastMousePos.current = mousePos;
    }
  };

  const ElementTag = as;

  return (
    <ElementTag className={`h-full w-full ${className ?? ""}`} onMouseMove={handleMouseMove} ref={containerRef} {...props}>
      {Array.from({ length: repeatChildren }).map((_, i) => (
        <div key={i} className="contents">
          {children}
        </div>
      ))}
    </ElementTag>
  );
}

type ImageTrailItemProps = HTMLAttributes<HTMLDivElement> & { as?: ElementType; children: ReactNode };

export function ImageTrailItem({ className, children, as = "div", ...props }: ImageTrailItemProps) {
  const ElementTag = as;
  return (
    <ElementTag {...props} className={`image-trail-item absolute left-0 top-0 hidden will-change-transform ${className ?? ""}`}>
      {children}
    </ElementTag>
  );
}

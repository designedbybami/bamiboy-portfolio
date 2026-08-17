"use client";

import { useEffect, type RefObject } from "react";
import { useMotionValue, useSpring } from "motion/react";

// Detection distance from the element's edge, in px, before the pull kicks in.
const DEFAULT_RADIUS = 80;
// Max shift toward the cursor at zero distance, in px.
const DEFAULT_PULL = 14;

type MagneticPullOptions = {
  radius?: number;
  pull?: number;
  disabled?: boolean;
};

// Springs a ref'd element a few px toward the cursor whenever it's within `radius` of the
// element's edge, snapping back to rest once the cursor leaves range. Distance is measured from
// the box edge, not the center, so a wide/tall tile doesn't fire the pull the instant the cursor
// crosses the page regardless of how far it is from the visible edge.
export function useMagneticPull(ref: RefObject<HTMLElement | null>, options: MagneticPullOptions = {}) {
  const { radius = DEFAULT_RADIUS, pull = DEFAULT_PULL, disabled = false } = options;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 20, mass: 0.4 });

  useEffect(() => {
    if (disabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onPointerMove(event: PointerEvent) {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      // Once the cursor is inside, the pull must be fully off (not maxed out): dx/dy would both
      // read 0 at the boundary and inside alike, so "inside" needs its own explicit check.
      if (inside) {
        x.set(0);
        y.set(0);
        return;
      }
      const dx = Math.max(rect.left - event.clientX, event.clientX - rect.right, 0);
      const dy = Math.max(rect.top - event.clientY, event.clientY - rect.bottom, 0);
      const edgeDistance = Math.hypot(dx, dy);

      if (edgeDistance >= radius) {
        x.set(0);
        y.set(0);
        return;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
      const strength = 1 - edgeDistance / radius;
      x.set(Math.cos(angle) * pull * strength);
      y.set(Math.sin(angle) * pull * strength);
    }

    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [ref, radius, pull, disabled, x, y]);

  return { x: springX, y: springY };
}

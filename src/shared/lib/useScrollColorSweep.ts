"use client";

import { useEffect, useRef, useState } from "react";

type Edge = "top" | "bottom"; // which edge of the section, crossing the matching viewport edge, fires the sweep

// Flips a section's background once it crosses a viewport edge, and stays flipped. Not a
// scroll-scrubbed transform: a plain `getBoundingClientRect` check on scroll, so the flip is a single
// eased transition rather than something scrubbing back and forth with scroll position. Not an
// IntersectionObserver zero-height rootMargin line either: layout rounding made `isIntersecting` miss
// by a fraction of a pixel right at the trigger point.
export function useScrollColorSweep<T extends HTMLElement>(edge: Edge = "top") {
  const ref = useRef<T>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (triggered) return;

    function check() {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const hit = edge === "top" ? rect.top <= 1 : rect.bottom <= window.innerHeight + 1;
      if (hit) setTriggered(true);
    }

    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [triggered, edge]);

  return { ref, triggered };
}

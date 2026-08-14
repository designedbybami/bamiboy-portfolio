"use client";

import "slot-text/style.css";
import { useEffect, useRef } from "react";
import { slotText, type SlotTextController } from "slot-text";
import { TEXT_ROLL_OPTIONS } from "@/shared/lib/text-roll";

export type HoverEdge = "top" | "bottom";

type DirectionalHoverTextProps = {
  children: string;
  hovered: boolean;
  edge: HoverEdge;
  className?: string;
};

// Text-roll driven by cursor direction, via the slot-text library (owns its own DOM, avoids the SSR double-text bug a hand-rolled version had). See STANDARDS.md for the interrupt-on-fast-hover trade-off.
export function DirectionalHoverText({ children, hovered, edge, className = "" }: DirectionalHoverTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<SlotTextController | null>(null);
  const previousHoveredRef = useRef(hovered);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    controllerRef.current = slotText(element, children, { rollBy: "character" });
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
    // Intentionally mount-only: `set()` below drives all subsequent text updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (previousHoveredRef.current === hovered) return;
    previousHoveredRef.current = hovered;
    controllerRef.current?.set(children, {
      ...TEXT_ROLL_OPTIONS,
      direction: edge === "top" ? "down" : "up", // entered from top rolls down, entered from bottom rolls up
      skipUnchanged: false,
    });
  }, [hovered, edge, children]);

  return (
    <>
      {/* aria-hidden: slot-text splits this into per-character spans, which would otherwise read to screen readers as individually-spaced letters. */}
      <span ref={ref} aria-hidden="true" className={className}>
        {children}
      </span>
      <span className="sr-only">{children}</span>
    </>
  );
}

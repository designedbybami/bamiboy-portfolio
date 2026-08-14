"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useMotionValue, type Variants } from "motion/react";

type SpeechBubbleProps = {
  characterRef: RefObject<HTMLElement | null>;
  lines: readonly string[];
  nameTag: { name: string; role: string };
};

const EASE = [0.65, 0, 0.35, 1] as const;

const BUBBLE_CONTAINER: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

const BUBBLE_LINE: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
};

// Desktop: portal-follows the cursor with a talk-bubble, only while hovering the character itself (not the whole Hero).
// Mobile viewport (< sm, same breakpoint StickerField hides most stickers at): no hover to trigger from, so a fixed
// name-tag card sits on the character instead (mink reference's "Jan Balman / Art director" card). Split on viewport
// width, not `(pointer: coarse)`, because a fair number of real phones don't reliably flag as coarse-only.
export function SpeechBubble({ characterRef, lines, nameTag }: SpeechBubbleProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [hovered, setHovered] = useState(false);
  const bubbleX = useMotionValue(0);
  const bubbleY = useMotionValue(0);
  const hoveredRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- document.body (the portal target below) doesn't exist during SSR
    setMounted(true);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobileViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isMobileViewport) return;
    const target = characterRef.current;
    if (!target) return;

    function handleMove(event: PointerEvent) {
      bubbleX.set(event.clientX);
      bubbleY.set(event.clientY);
    }
    function handleEnter(event: PointerEvent) {
      handleMove(event);
      hoveredRef.current = true;
      setHovered(true);
    }
    function handleLeave() {
      hoveredRef.current = false;
      setHovered(false);
    }

    target.addEventListener("pointerenter", handleEnter);
    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerleave", handleLeave);
    return () => {
      target.removeEventListener("pointerenter", handleEnter);
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerleave", handleLeave);
    };
  }, [characterRef, isMobileViewport, bubbleX, bubbleY]);

  if (!mounted) return null;

  if (isMobileViewport) {
    return (
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[54%] z-30 -translate-x-1/2 -translate-y-1/2">
        <NameTag name={nameTag.name} role={nameTag.role} />
      </div>
    );
  }

  return createPortal(
    <AnimatePresence>
      {hovered && (
        <motion.div
          aria-hidden
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={BUBBLE_CONTAINER}
          style={{ left: bubbleX, top: bubbleY, translateX: "18px", translateY: "-115%" }}
          className="pointer-events-none fixed z-50"
        >
          <Bubble lines={lines} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Bubble({ lines }: { lines: readonly string[] }) {
  return (
    <div className="relative whitespace-nowrap rounded-2xl bg-paper px-4 py-2.5 text-sm font-medium leading-snug text-ink shadow-xl">
      {lines.map((line, index) => (
        <motion.p key={index} variants={BUBBLE_LINE}>
          {line}
        </motion.p>
      ))}
      <span aria-hidden className="absolute -bottom-1.5 left-6 size-3 rotate-45 rounded-[2px] bg-paper" />
    </div>
  );
}

function NameTag({ name, role }: { name: string; role: string }) {
  return (
    <div className="whitespace-nowrap rounded-xl border border-white/10 bg-neutral-800/80 px-3.5 py-2.5 shadow-lg shadow-ink/20 backdrop-blur-md">
      <p className="text-sm font-semibold text-paper">{name}</p>
      <p className="text-xs text-neutral-400">{role}</p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { motion, useAnimationFrame, useReducedMotion, type Variants } from "motion/react";
import { DraggableSticker, type StickerRegistration } from "./DraggableSticker";

type StickerDef = { src: string; alt: string; restRotation: number; alwaysVisible?: boolean };

// Positions are randomized client-side after mount, not here, so SSR/first-paint HTML stays deterministic (see STANDARDS.md gotcha #1).
// alwaysVisible: below sm only these three render (see MOBILE_HIDDEN_CLASSNAME), 8 draggable objects is too much clutter on a small screen.
const STICKER_DEFS: StickerDef[] = [
  { src: "/images/stickers/figma.svg", alt: "Figma", restRotation: -8, alwaysVisible: true },
  { src: "/images/stickers/framer.svg", alt: "Framer", restRotation: 6, alwaysVisible: true },
  { src: "/images/stickers/codex.svg", alt: "Codex", restRotation: 4 },
  { src: "/images/stickers/gemini.svg", alt: "Gemini", restRotation: -5 },
  { src: "/images/stickers/rive.svg", alt: "Rive", restRotation: 10 },
  { src: "/images/stickers/unicorn-studio.svg", alt: "Unicorn Studio", restRotation: -12 },
  { src: "/images/stickers/claude.svg", alt: "Claude", restRotation: 5, alwaysVisible: true },
  { src: "/images/stickers/paper.svg", alt: "Paper", restRotation: -6 },
];

const MOBILE_HIDDEN_CLASSNAME = "hidden sm:block";

type StickerLayout = StickerDef & { style: CSSProperties };

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// One vertical band per sticker so a shuffled run still reads as spread out rather than clumping by
// chance, but which sticker lands in which band, and which side it's on, is itself shuffled, not
// tied to definition order, an earlier version assigned bands/sides by array index directly and it
// read as a visibly sorted grid (band 0 always leftmost-top, band 1 always right, etc) rather than
// scattered. Offset range widened too, for the same reason.
function randomizeStickerLayout(): StickerLayout[] {
  const count = STICKER_DEFS.length;
  const bandHeight = 68 / count;
  const bandOrder = shuffle(Array.from({ length: count }, (_, i) => i));
  const sides = shuffle([...Array(Math.ceil(count / 2)).fill("left"), ...Array(Math.floor(count / 2)).fill("right")]) as (
    | "left"
    | "right"
  )[];

  return STICKER_DEFS.map((def, i) => {
    const side = sides[i];
    const bandStart = 10 + bandOrder[i] * bandHeight;
    const top = bandStart + Math.random() * bandHeight * 0.85;
    const offset = 2 + Math.random() * 22;
    return { ...def, style: { top: `${top}%`, [side]: `${offset}%` } as CSSProperties };
  });
}

const STICKER_GROUP: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const STICKER_POP: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 18 } },
};

const COLLISION_RADIUS_FACTOR = 0.55; // fraction of combined width, not the full bounding box, since the visible art doesn't fill its own hitbox
const COLLISION_EXTRA_PUSH = 14; // extra push beyond separating the overlap, so a hit reads as a nudge

type StickerFieldProps = {
  dragBoundsRef: RefObject<HTMLElement | null>;
};

// Owns randomized entrance layout plus a shared collision loop (circle-overlap test + spring nudge, not a physics engine) across all registered stickers.
export function StickerField({ dragBoundsRef }: StickerFieldProps) {
  const shouldReduceMotion = useReducedMotion();
  const [stickers, setStickers] = useState<StickerLayout[] | null>(null);
  const registry = useRef(new Map<string, StickerRegistration>());
  const resolvedPairs = useRef(new Set<string>());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Math.random() can't run during SSR without a client mismatch (gotcha #1)
    setStickers(randomizeStickerLayout());
  }, []);

  const register = useCallback((id: string, entry: StickerRegistration) => {
    registry.current.set(id, entry);
    return () => {
      registry.current.delete(id);
    };
  }, []);

  useAnimationFrame(() => {
    if (shouldReduceMotion) return;
    const entries = Array.from(registry.current.entries());

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [idA, a] = entries[i];
        const [idB, b] = entries[j];
        const rectA = a.ref.current?.getBoundingClientRect();
        const rectB = b.ref.current?.getBoundingClientRect();
        if (!rectA || !rectB) continue;

        const ax = rectA.left + rectA.width / 2;
        const ay = rectA.top + rectA.height / 2;
        const bx = rectB.left + rectB.width / 2;
        const by = rectB.top + rectB.height / 2;
        const dx = bx - ax;
        const dy = by - ay;
        const distance = Math.hypot(dx, dy) || 1;
        const minDistance = ((rectA.width + rectB.width) / 2) * COLLISION_RADIUS_FACTOR;
        const pairKey = idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;

        if (distance < minDistance) {
          if (!resolvedPairs.current.has(pairKey)) {
            resolvedPairs.current.add(pairKey);
            const normalX = dx / distance;
            const normalY = dy / distance;
            const overlap = minDistance - distance + COLLISION_EXTRA_PUSH;

            if (!b.isDragging()) b.impulse(normalX * overlap, normalY * overlap);
            if (!a.isDragging()) a.impulse(-normalX * overlap * 0.6, -normalY * overlap * 0.6);
          }
        } else {
          resolvedPairs.current.delete(pairKey);
        }
      }
    }
  });

  return (
    <motion.div variants={STICKER_GROUP}>
      {stickers?.map((sticker) => (
        <DraggableSticker
          key={sticker.src}
          id={sticker.src}
          src={sticker.src}
          alt={sticker.alt}
          restRotation={sticker.restRotation}
          dragConstraintsRef={dragBoundsRef}
          style={sticker.style}
          variants={STICKER_POP}
          onRegister={register}
          className={sticker.alwaysVisible ? undefined : MOBILE_HIDDEN_CLASSNAME}
        />
      ))}
    </motion.div>
  );
}

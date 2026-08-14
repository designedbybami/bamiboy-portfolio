"use client";

import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import { PLAYGROUND_HOBBY_CHIPS, type PlaygroundChip } from "../footer-playground-data";
import { footerSocials } from "../copy";

// "sm:flex", not StickerField's identical-in-spirit "sm:block": these chips are flex containers
// themselves (icon + label + arrow laid out in a row), so "sm:block" was winning over the earlier
// "flex" utility at the sm+ breakpoint (same-specificity utilities, later one in Tailwind's
// generated stylesheet wins regardless of class order in the JSX) and silently turning the chip
// into a block box. Its two children (the icon+label group is itself `flex`, i.e.
// block-outside/flex-inside) then stacked as separate block-level lines instead of sitting in one
// row, arrow included, which is exactly the "not showing well" (icon+label on one line, arrow
// dropped to its own line below) bug this caused.
const MOBILE_HIDDEN_CLASSNAME = "hidden sm:flex";
const WALL_THICKNESS = 80; // thick enough that fast-moving bodies can't tunnel through in one step
const SOCIAL_SIZE_SCALE = 1.25;
const SOCIAL_GAP = 16;
const CLICK_DRAG_THRESHOLD = 6; // px of pointer movement below which a pointerup counts as a tap
const MAX_THROW_SPEED = 45; // clamps a fast flick to something the walls can still absorb cleanly

function buildSocialChips(): PlaygroundChip[] {
  return footerSocials.map((social) => ({
    id: `social-${social.label}`,
    label: social.label,
    image: social.icon,
    color: social.brandColor,
    href: social.href,
    width: Math.round((110 + social.label.length * 9) * SOCIAL_SIZE_SCALE), // wider than before: label + a dedicated arrow-click target
    height: Math.round(44 * SOCIAL_SIZE_SCALE),
  }));
}

type FooterPlaygroundProps = {
  className?: string;
};

type DragState = {
  chipId: string;
  offsetX: number; // pointer position minus body position at grab time, so the body doesn't jump to be centered under the cursor
  offsetY: number;
  lastX: number;
  lastY: number;
  lastT: number;
  velocityX: number;
  velocityY: number;
  startClientX: number;
  startClientY: number;
  isArrowPress: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// A real matter-js world (gravity, restitution, collisions), not the manual collision loop
// StickerField uses. This is the *whole* footer's play area — a ceiling, floor, and both walls
// box the entire footer body, not just a strip below the CTA, so a hard throw travels the full
// height and visibly passes behind/around the CTA and meta text sitting on top of it, the same
// "content floats over a full-bleed physics layer" structure Hero's StickerField already uses.
//
// Dragging is driven by native Pointer Capture on each chip (`setPointerCapture`), the same
// mechanism StickerField/DraggableSticker already use — not matter-js's own Mouse/MouseConstraint.
// That first version bound Mouse to the whole container, which needed `pointer-events: none` on
// empty space so the ChromaFlow background underneath could still see the cursor; but once the
// pointer left a chip's own shrinking/moving hit-area mid-drag, the hit-test would resolve to
// ChromaFlow's canvas instead (a sibling, not a descendant, of this container), so the container's
// mousemove/mouseup listeners silently stopped firing — the drag would freeze, and a mouseup that
// landed outside a chip never told matter-js the drag had ended, so the next unrelated pointer
// movement would "resume" it. Pointer capture sidesteps all of that: once a chip captures a
// pointer id on pointerdown, it keeps receiving that pointer's move/up events directly regardless
// of what's visually underneath, so the container can stay `pointer-events-none` (ChromaFlow keeps
// working) with no risk to drag continuity.
export function FooterPlayground({ className = "" }: FooterPlaygroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLDivElement>());
  const bodiesRef = useRef(new Map<string, ReturnType<typeof import("matter-js").Bodies.rectangle>>());
  const matterRef = useRef<typeof import("matter-js") | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const arrowPressedRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [physicsLoaded, setPhysicsLoaded] = useState(false);
  const socialChips = useMemo(() => buildSocialChips(), []);
  // Every chip is `absolute left-0 top-0` in physics mode, so until matter-js has actually loaded
  // and positioned them, they'd all render piled at the container's corner — a visible stack, not
  // the flash a `syncTransforms()`-before-first-tick call alone can prevent (that only closes the
  // gap between "bodies exist" and "first render," not the real one between "page loads" and
  // "the dynamic import resolves"). Treated the same as reduced-motion until then: a plain
  // flowing row, then it "becomes" physics once ready.
  const showStaticLayout = shouldReduceMotion || !physicsLoaded;
  const chips = useMemo(() => [...PLAYGROUND_HOBBY_CHIPS, ...socialChips], [socialChips]);

  const syncTransforms = useCallback(() => {
    bodiesRef.current.forEach((body, id) => {
      const el = chipRefs.current.get(id);
      const chip = chips.find((c) => c.id === id);
      if (!el || !chip) return;
      const x = body.position.x - chip.width / 2;
      const y = body.position.y - chip.height / 2;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
  }, [chips]);

  // Runs once physics has actually loaded and chips have re-rendered into `absolute` mode with
  // fresh refs attached — the initial placement, so there's no frame where they're
  // absolute-positioned but still sitting at the container's default (0,0) corner.
  useEffect(() => {
    if (physicsLoaded) syncTransforms();
  }, [physicsLoaded, syncTransforms]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors StickerField's own client-only-randomization gotcha (see STANDARDS.md #1): matter-js needs real layout dimensions, unavailable during SSR
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || shouldReduceMotion) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    // Lazy import: matter-js is a real physics engine, no reason to pay for it before this
    // section is about to render, and never at all under reduced-motion.
    import("matter-js").then((Matter) => {
      if (cancelled || !container) return;
      matterRef.current = Matter;
      const { width, height } = container.getBoundingClientRect();

      const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.6 } });
      const runner = Matter.Runner.create();
      const bodies = bodiesRef.current;

      // Spawn well below the meta row/eyebrow text band (see gotcha on ChromaFlow blocking, below)
      // so bodies clear that zone fast and settle low, rather than jamming mid-fall right where
      // eight similarly-sized rigid bodies funneling into one narrow column tend to pile up.
      PLAYGROUND_HOBBY_CHIPS.forEach((chip, i) => {
        const startX = width * (0.15 + 0.7 * Math.random());
        const startY = height * 0.62 - i * 24;
        const body = Matter.Bodies.rectangle(startX, startY, chip.width, chip.height, {
          chamfer: { radius: chip.height / 2 },
          restitution: 0.25,
          friction: 0.5,
          frictionAir: 0.03,
        });
        Matter.Body.setInertia(body, Infinity); // locked rotation — labels stay upright and legible, never tumble
        bodies.set(chip.id, body);
      });

      // Socials spawn already laid out as a centered horizontal row (cumulative real widths + a
      // fixed gap, not an even fractional split that ignores how wide each label actually is).
      const totalSocialWidth = socialChips.reduce((sum, c) => sum + c.width, 0) + SOCIAL_GAP * (socialChips.length - 1);
      let cursorX = width / 2 - totalSocialWidth / 2;
      socialChips.forEach((chip, i) => {
        const startX = cursorX + chip.width / 2;
        cursorX += chip.width + SOCIAL_GAP;
        const startY = height * 0.5 - i * 16;
        const body = Matter.Bodies.rectangle(startX, startY, chip.width, chip.height, {
          chamfer: { radius: chip.height / 2 },
          restitution: 0.12,
          friction: 0.7,
          frictionAir: 0.04,
        });
        Matter.Body.setInertia(body, Infinity); // locked rotation — a wide pill would otherwise topple end over end on any collision
        bodies.set(chip.id, body);
      });

      const ground = Matter.Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2, width * 2, WALL_THICKNESS, { isStatic: true });
      const ceiling = Matter.Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width * 2, WALL_THICKNESS, { isStatic: true });
      const leftWall = Matter.Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 2, { isStatic: true });
      const rightWall = Matter.Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 2, { isStatic: true });

      Matter.World.add(engine.world, [ground, ceiling, leftWall, rightWall, ...bodies.values()]);

      Matter.Events.on(engine, "afterUpdate", syncTransforms);
      Matter.Runner.run(runner, engine);

      // Switches chips from the static flex layout to `absolute` physics mode. The sync effect
      // below (keyed on `physicsLoaded`) runs immediately after, once refs are re-attached in
      // that mode, so there's no frame where they're absolute-positioned but not yet placed.
      setPhysicsLoaded(true);

      cleanup = () => {
        Matter.Runner.stop(runner);
        Matter.World.clear(engine.world, false);
        Matter.Engine.clear(engine);
        bodies.clear();
        matterRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [ready, shouldReduceMotion, chips, socialChips, syncTransforms]);

  // The arrow's own onPointerDown (below) only sets `arrowPressedRef` — it deliberately doesn't
  // call setPointerCapture itself. Pointer capture redirects ALL subsequent move/up events to
  // whichever element captured them; if the small arrow span captured it, the outer chip's own
  // move/up handlers (where the actual drag logic lives) would never fire again. Since pointerdown
  // bubbles from the arrow up to the outer chip before this runs, reading the ref here gets the
  // right answer while letting the chip itself hold the capture.
  const handlePointerDown = (chip: PlaygroundChip) => (event: ReactPointerEvent<HTMLElement>) => {
    const Matter = matterRef.current;
    const body = bodiesRef.current.get(chip.id);
    const container = containerRef.current;
    if (!Matter || !body || !container) return;

    const isArrowPress = arrowPressedRef.current;
    arrowPressedRef.current = false;

    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = container.getBoundingClientRect();
    dragRef.current = {
      chipId: chip.id,
      offsetX: event.clientX - rect.left - body.position.x,
      offsetY: event.clientY - rect.top - body.position.y,
      lastX: event.clientX,
      lastY: event.clientY,
      lastT: performance.now(),
      velocityX: 0,
      velocityY: 0,
      startClientX: event.clientX,
      startClientY: event.clientY,
      isArrowPress,
    };
  };

  const handlePointerMove = (chip: PlaygroundChip) => (event: ReactPointerEvent<HTMLElement>) => {
    const Matter = matterRef.current;
    const drag = dragRef.current;
    const body = bodiesRef.current.get(chip.id);
    const container = containerRef.current;
    if (!Matter || !drag || drag.chipId !== chip.id || !body || !container) return;

    const rect = container.getBoundingClientRect();
    const now = performance.now();
    const dt = Math.max(now - drag.lastT, 1);
    const nextX = event.clientX - rect.left - drag.offsetX;
    const nextY = event.clientY - rect.top - drag.offsetY;

    drag.velocityX = ((event.clientX - drag.lastX) / dt) * 16; // approximate px/physics-tick
    drag.velocityY = ((event.clientY - drag.lastY) / dt) * 16;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastT = now;

    Matter.Body.setPosition(body, { x: nextX, y: nextY });
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
  };

  const handlePointerUp = (chip: PlaygroundChip) => (event: ReactPointerEvent<HTMLElement>) => {
    const Matter = matterRef.current;
    const drag = dragRef.current;
    const body = bodiesRef.current.get(chip.id);
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag || drag.chipId !== chip.id) return;
    dragRef.current = null;

    if (Matter && body) {
      Matter.Body.setVelocity(body, {
        x: clamp(drag.velocityX, -MAX_THROW_SPEED, MAX_THROW_SPEED),
        y: clamp(drag.velocityY, -MAX_THROW_SPEED, MAX_THROW_SPEED),
      });
    }

    const moved = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
    if (drag.isArrowPress && moved < CLICK_DRAG_THRESHOLD && chip.href) {
      window.open(chip.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      ref={containerRef}
      className={
        showStaticLayout
          ? `flex flex-wrap items-center justify-center gap-3 px-6 py-8 ${className}`
          // `pointer-events-none` on the container, `pointer-events-auto` re-enabled per chip
          // below: the ChromaFlow background this sits on top of tracks the cursor directly over
          // its own canvas, so a full-area hit-testable overlay would block it everywhere the
          // same way oversized text hit-boxes did elsewhere in the footer. Safe to do now that
          // dragging no longer depends on this container being a hit-test target (see the pointer
          // capture note above).
          : `pointer-events-none select-none ${className}`
      }
    >
      {chips.map((chip) => (
        // Always a plain div, never an `<a>`: an outer anchor would make the *whole* pill a native
        // link (clicking anywhere navigates), which is exactly what "only the arrow should carry
        // the link" rules out. Navigation instead runs entirely through the arrow's own tap/keyboard
        // handling below, gated by CLICK_DRAG_THRESHOLD so a real drag never also opens a tab.
        <div
          key={chip.id}
          ref={(el: HTMLDivElement | null) => {
            if (el) chipRefs.current.set(chip.id, el);
            else chipRefs.current.delete(chip.id);
          }}
          onPointerDown={handlePointerDown(chip)}
          onPointerMove={handlePointerMove(chip)}
          onPointerUp={handlePointerUp(chip)}
          onPointerCancel={handlePointerUp(chip)}
          style={{
            ...(showStaticLayout ? undefined : { width: chip.width, height: chip.height, willChange: "transform" }),
            ...(chip.image ? { backgroundColor: chip.color } : { borderColor: chip.color }),
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          className={`pointer-events-auto select-none ${showStaticLayout ? "relative inline-flex" : "absolute left-0 top-0 flex touch-none cursor-grab active:cursor-grabbing"} items-center ${chip.href ? "justify-between" : "justify-center"} gap-2 rounded-full px-4 text-sm font-medium text-white ${
            chip.image ? "" : "border-2 bg-white/10 backdrop-blur-sm"
          } ${chip.alwaysVisible ? "" : MOBILE_HIDDEN_CLASSNAME}`}
        >
          {/* Icon + label grouped as one unit on the left, so `justify-between` on the pill only ever splits this group from the arrow, never the icon from its own label. */}
          <span className="flex items-center gap-2">
            {chip.image ? (
              <span
                aria-hidden
                className="block size-5 shrink-0 bg-white"
                style={{
                  maskImage: `url(${chip.image})`,
                  WebkitMaskImage: `url(${chip.image})`,
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                }}
              />
            ) : (
              <Icon icon={chip.icon!} aria-hidden className="size-5 shrink-0" style={{ color: chip.color }} />
            )}
            <span className="select-none">{chip.label}</span>
          </span>
          {chip.href ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Open ${chip.label}`}
              onPointerDown={() => {
                arrowPressedRef.current = true;
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                window.open(chip.href, "_blank", "noopener,noreferrer");
              }}
              className="ml-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/20"
            >
              <Icon icon="solar:arrow-right-up-line-duotone" aria-hidden className="size-4" />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

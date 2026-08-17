"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

type ScatterTextProps = {
  text: string;
  hovered: boolean;
  className?: string;
};

type MatterModule = typeof import("matter-js");
type MatterBody = ReturnType<MatterModule["Bodies"]["circle"]>;
type MatterEngine = ReturnType<MatterModule["Engine"]["create"]>;
type MatterRunner = ReturnType<MatterModule["Runner"]["create"]>;
type MatterConstraint = ReturnType<MatterModule["Constraint"]["create"]>;

const CURSOR_RADIUS_PX = 14;
const CURSOR_MASS = 40; // much heavier than a letter, so it authoritatively shoves rather than getting stopped by them
const CURSOR_VELOCITY_SMOOTHING = 0.4; // EMA weight per mousemove sample, same technique as FooterPlayground's throw velocity
const CURSOR_MAX_SPEED = 60; // clamps a fast mouse swipe to something that still reads as a shove, not a teleporting body punching letters into orbit
const LETTER_RESTITUTION = 0.5;
const LETTER_FRICTION = 0.01;
const LETTER_FRICTION_AIR = 0.03;
const ANCHOR_STIFFNESS = 0.01; // just enough to keep the pack stable, a cursor shove easily overpowers it
const ANCHOR_DAMPING = 0.25;
const BOUNDS_MARGIN_PX = 70; // how far past the wordmark's own box letters are still allowed to drift before being bounced back in
const PARK_DISTANCE_PX = 9999; // where the cursor body goes when it should stop influencing anything
const GROWTH_DURATION_MS = 400; // spawn small (no overlap) and grow to full size, or resolving 14 overlaps at once explodes
const RETURN_TRANSITION = { type: "spring", stiffness: 70, damping: 13 } as const; // spring physics over fixed-duration eases per bami-build-standards, slow enough to actually see the settle

type LetterRig = { baseX: number; baseY: number; width: number; height: number; spawnRadius: number; targetRadius: number };
type LetterTransform = { x: number; y: number; rotate: number };

const IDENTITY_TRANSFORM: LetterTransform = { x: 0, y: 0, rotate: 0 };

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

// targetRadius covers the full glyph footprint so scattered letters don't visually overlap; spawnRadius is
// shrunk to the real rest-kerning gap so bodies never start already overlapping (see GROWTH_DURATION_MS above).
function measureLetters(container: HTMLElement, letterEls: Array<HTMLElement | null>): LetterRig[] {
  const containerRect = container.getBoundingClientRect();
  const rects = letterEls.map((el) => el?.getBoundingClientRect() ?? null);
  const centersX = rects.map((rect) => (rect ? rect.left - containerRect.left + rect.width / 2 : null));

  return rects.map((rect, i) => {
    if (!rect) return { baseX: 0, baseY: 0, width: 0, height: 0, spawnRadius: 4, targetRadius: 4 };
    const baseX = centersX[i]!;
    const baseY = rect.top - containerRect.top + rect.height / 2;
    const gapLeft = centersX[i - 1] != null ? baseX - centersX[i - 1]! : Infinity;
    const gapRight = centersX[i + 1] != null ? centersX[i + 1]! - baseX : Infinity;
    const spawnRadius = Math.max(4, Math.min(rect.width, rect.height, gapLeft, gapRight) / 2 - 1);
    const targetRadius = Math.max(6, (Math.max(rect.width, rect.height) / 2) * 0.9);
    return { baseX, baseY, width: rect.width, height: rect.height, spawnRadius, targetRadius };
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Hybrid: matter-js drives the free-floating scatter/collision while hovered, Motion springs the return on leave.
export function ScatterText({ text, hovered, className = "" }: ScatterTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const chars = [...text];

  const containerRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [mode, setMode] = useState<"static" | "physics" | "returning">("static");
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [letterRigs, setLetterRigs] = useState<LetterRig[]>([]);
  const [returnFrom, setReturnFrom] = useState<LetterTransform[]>([]);

  const hoveredRef = useRef(hovered);
  const matterRef = useRef<MatterModule | null>(null);
  const engineRef = useRef<MatterEngine | null>(null);
  const runnerRef = useRef<MatterRunner | null>(null);
  const bodiesRef = useRef<MatterBody[]>([]);
  const constraintsRef = useRef<MatterConstraint[]>([]);
  const cursorBodyRef = useRef<MatterBody | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const smoothedVelocityRef = useRef({ x: 0, y: 0 });
  const lastTransformsRef = useRef<LetterTransform[]>([]);
  const spinningUpRef = useRef(false);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const stopPhysics = () => {
      const Matter = matterRef.current;
      if (Matter && runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (Matter && engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }
      engineRef.current = null;
      runnerRef.current = null;
      bodiesRef.current = [];
      constraintsRef.current = [];
      cursorBodyRef.current = null;
    };

    const spinUpPhysics = async () => {
      const container = containerRef.current;
      if (!container || engineRef.current || spinningUpRef.current) return; // already running, or another spin-up is already in flight
      spinningUpRef.current = true;

      if (!matterRef.current) matterRef.current = await import("matter-js");
      if (!hoveredRef.current) {
        spinningUpRef.current = false;
        return; // left again while the import was in flight
      }
      const Matter = matterRef.current;

      // Reads real DOM position, so re-entering mid-return resumes from exactly where it visually is.
      const rigs = measureLetters(container, letterRefs.current);
      const containerRect = container.getBoundingClientRect();

      const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 }, enableSleeping: true });
      const runner = Matter.Runner.create();

      const bodies = rigs.map((rig) =>
        Matter.Bodies.circle(rig.baseX, rig.baseY, rig.spawnRadius, {
          restitution: LETTER_RESTITUTION,
          friction: LETTER_FRICTION,
          frictionAir: LETTER_FRICTION_AIR,
        }),
      );
      // Small random kick per letter, or the growth-driven separation (all letters start collinear) resolves as a straight horizontal line.
      bodies.forEach((body) => {
        Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.5) * 4 });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);
      });
      const currentRadii = rigs.map((rig) => rig.spawnRadius);
      const growthStart = performance.now();
      // Weak stabilizer, not the "return home" mechanic (that's Motion's job on leave): without it, 14 circles
      // resolving their own spawn overlap (real kerning is tighter than their real-footprint radius) cascades
      // into a runaway bounce. A cursor shove still easily overpowers this.
      const constraints = rigs.map((rig, i) =>
        Matter.Constraint.create({ bodyA: bodies[i], pointB: { x: rig.baseX, y: rig.baseY }, length: 0, stiffness: ANCHOR_STIFFNESS, damping: ANCHOR_DAMPING }),
      );
      // Dynamic, not static: a static body only depenetrates, it can't impart real momentum from the mouse's own velocity.
      const cursorBody = Matter.Bodies.circle(-PARK_DISTANCE_PX, -PARK_DISTANCE_PX, CURSOR_RADIUS_PX, { mass: CURSOR_MASS });
      Matter.Body.setInertia(cursorBody, Infinity);
      lastPointerRef.current = null;
      smoothedVelocityRef.current = { x: 0, y: 0 };

      Matter.World.add(engine.world, [...bodies, ...constraints, cursorBody]);

      const minX = -BOUNDS_MARGIN_PX;
      const maxX = containerRect.width + BOUNDS_MARGIN_PX;
      const minY = -BOUNDS_MARGIN_PX;
      const maxY = containerRect.height + BOUNDS_MARGIN_PX;

      lastTransformsRef.current = rigs.map(() => ({ ...IDENTITY_TRANSFORM }));

      Matter.Events.on(engine, "afterUpdate", () => {
        const growthT = Math.min((performance.now() - growthStart) / GROWTH_DURATION_MS, 1);

        bodies.forEach((body, i) => {
          const rig = rigs[i];

          if (growthT < 1) {
            const nextRadius = rig.spawnRadius + (rig.targetRadius - rig.spawnRadius) * easeOutCubic(growthT);
            const scaleFactor = nextRadius / currentRadii[i];
            if (Math.abs(scaleFactor - 1) > 0.001) Matter.Body.scale(body, scaleFactor, scaleFactor);
            currentRadii[i] = nextRadius;
          }

          const { x, y } = body.position;
          const clampedX = clamp(x, minX, maxX);
          const clampedY = clamp(y, minY, maxY);
          if (clampedX !== x || clampedY !== y) {
            Matter.Body.setPosition(body, { x: clampedX, y: clampedY });
            Matter.Body.setVelocity(body, { x: clampedX !== x ? 0 : body.velocity.x, y: clampedY !== y ? 0 : body.velocity.y });
          }

          const el = letterRefs.current[i];
          const dx = clampedX - rig.baseX;
          const dy = clampedY - rig.baseY;
          const rotateDeg = (body.angle * 180) / Math.PI;
          lastTransformsRef.current[i] = { x: dx, y: dy, rotate: rotateDeg };
          if (el) el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotateDeg}deg)`;
        });
      });

      Matter.Runner.run(runner, engine);

      engineRef.current = engine;
      runnerRef.current = runner;
      bodiesRef.current = bodies;
      constraintsRef.current = constraints;
      cursorBodyRef.current = cursorBody;
      setContainerSize({ width: containerRect.width, height: containerRect.height });
      setLetterRigs(rigs);
      setMode("physics");
      spinningUpRef.current = false;
    };

    if (hovered) {
      void spinUpPhysics();
      return;
    }

    // Leaving: hand off the last physics transform to Motion's spring, not an instant cut.
    if (mode === "physics") {
      setReturnFrom(lastTransformsRef.current.map((t) => ({ ...t })));
      stopPhysics();
      setMode("returning");
    }
  }, [hovered, shouldReduceMotion, mode]);

  // Unmount safety net, independent of the hover-driven effect above.
  useEffect(() => {
    return () => {
      const Matter = matterRef.current;
      if (Matter && runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (Matter && engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, []);

  const handleReturnComplete = () => {
    setMode("static");
    setContainerSize(null);
    setLetterRigs([]);
  };

  const handlePointerMove = (event: ReactMouseEvent<HTMLSpanElement>) => {
    const Matter = matterRef.current;
    const cursorBody = cursorBodyRef.current;
    const container = containerRef.current;
    if (!Matter || !cursorBody || !container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();
    const last = lastPointerRef.current;

    if (last) {
      const dt = Math.max(now - last.t, 1);
      const instantX = ((x - last.x) / dt) * 16; // approximate px/physics-tick, same conversion FooterPlayground uses for its own throw velocity
      const instantY = ((y - last.y) / dt) * 16;
      const smoothed = smoothedVelocityRef.current;
      smoothed.x += (instantX - smoothed.x) * CURSOR_VELOCITY_SMOOTHING;
      smoothed.y += (instantY - smoothed.y) * CURSOR_VELOCITY_SMOOTHING;
      const speed = Math.hypot(smoothed.x, smoothed.y);
      const scale = speed > CURSOR_MAX_SPEED ? CURSOR_MAX_SPEED / speed : 1;
      Matter.Body.setVelocity(cursorBody, { x: smoothed.x * scale, y: smoothed.y * scale });
    }
    lastPointerRef.current = { x, y, t: now };

    Matter.Body.setPosition(cursorBody, { x, y }); // still teleported every event, or fast sweeps tunnel past letters
  };

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const positioned = mode !== "static";

  return (
    <span className="relative inline-flex">
      <span className="sr-only">{text}</span>
      <span
        ref={containerRef}
        onMouseMove={mode === "physics" ? handlePointerMove : undefined}
        aria-hidden
        className="relative inline-flex"
        style={positioned && containerSize ? { width: containerSize.width, height: containerSize.height } : undefined}
      >
        {chars.map((char, i) => {
          const rig = positioned ? letterRigs[i] : undefined;
          const boxStyle = rig
            ? { left: rig.baseX - rig.width / 2, top: rig.baseY - rig.height / 2, width: rig.width, height: rig.height, whiteSpace: "pre" as const }
            : { whiteSpace: "pre" as const };
          const boxClassName = `${positioned ? "absolute" : "relative"} inline-block ${className}`;

          if (mode === "returning") {
            const from = returnFrom[i] ?? IDENTITY_TRANSFORM;
            return (
              <motion.span
                key={i}
                ref={(el) => {
                  letterRefs.current[i] = el;
                }}
                className={boxClassName}
                style={boxStyle}
                initial={{ x: from.x, y: from.y, rotate: from.rotate }}
                animate={{ x: 0, y: 0, rotate: 0 }}
                transition={RETURN_TRANSITION}
                onAnimationComplete={i === 0 ? handleReturnComplete : undefined}
              >
                {char}
              </motion.span>
            );
          }

          return (
            <span
              key={i}
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
              className={boxClassName}
              style={boxStyle}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}

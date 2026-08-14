"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useAnimationFrame } from "motion/react";
import { CHARACTER_CONFIG as CONFIG, CHARACTER_LAYERS } from "./interactive-character.config";

type InteractiveCharacterProps = {
  containerRef?: RefObject<HTMLElement | null>; // pointer-tracking hitbox, defaults to the character itself
  className?: string;
};

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type LidPhase = "open" | "closing" | "closed" | "opening";

const TOTAL_LAYERS = CHARACTER_LAYERS.length;

// 2D character rig per docs/character description.md: HEAD_ROOT moves as one unit toward the pointer, prism floats independently.
export function InteractiveCharacter({ containerRef, className }: InteractiveCharacterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const headRootRef = useRef<HTMLDivElement>(null);
  const leftLidRef = useRef<HTMLImageElement>(null);
  const rightLidRef = useRef<HTMLImageElement>(null);
  const prismRef = useRef<HTMLDivElement>(null);

  const pointerTarget = useRef({ x: 0, y: 0 });
  const lastPointerMoveAt = useRef(0);
  const headCurrent = useRef({ x: 0, y: 0 });
  const prismCurrent = useRef({ x: 0, y: 0 });
  const flags = useRef({ finePointer: false, reducedMotion: false });

  // All 8 layers must load before anything shows, or the rig paints broken (e.g. glasses before the face beneath them).
  const [loadedCount, setLoadedCount] = useState(0);
  const isReady = loadedCount >= TOTAL_LAYERS;
  const handleLayerSettled = () => setLoadedCount((count) => count + 1);

  useEffect(() => {
    const fineQuery = window.matchMedia("(pointer: fine)");
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      flags.current.finePointer = fineQuery.matches;
      flags.current.reducedMotion = reducedQuery.matches;
    };
    update();
    fineQuery.addEventListener("change", update);
    reducedQuery.addEventListener("change", update);
    return () => {
      fineQuery.removeEventListener("change", update);
      reducedQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const hitArea = containerRef?.current ?? wrapperRef.current;
    if (!hitArea) return;

    function handleMove(event: PointerEvent) {
      if (!flags.current.finePointer || flags.current.reducedMotion) return;
      const rect = hitArea!.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      pointerTarget.current = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      lastPointerMoveAt.current = performance.now();
    }

    function handleLeave() {
      pointerTarget.current = { x: 0, y: 0 };
    }

    hitArea.addEventListener("pointermove", handleMove);
    hitArea.addEventListener("pointerleave", handleLeave);
    return () => {
      hitArea.removeEventListener("pointermove", handleMove);
      hitArea.removeEventListener("pointerleave", handleLeave);
    };
  }, [containerRef]);

  // Head and prism share one rAF loop so each writes its transform once per frame instead of racing separate loops.
  useAnimationFrame((elapsed) => {
    const { finePointer, reducedMotion } = flags.current;
    const idleFor = performance.now() - lastPointerMoveAt.current;
    const isIdle = idleFor > 2500;

    let targetHeadX = 0;
    let targetHeadY = 0;
    let targetMagnetX = 0;
    let targetMagnetY = 0;

    if (!reducedMotion && finePointer) {
      if (isIdle) {
        const wave = Math.sin((elapsed / 1000 / CONFIG.IDLE_DURATION_S) * Math.PI * 2);
        targetHeadY = wave * CONFIG.IDLE_Y;
      } else {
        const { x, y } = pointerTarget.current;
        targetHeadX = x * (x < 0 ? CONFIG.HEAD_X_LEFT : CONFIG.HEAD_X_RIGHT);
        targetHeadY = y * CONFIG.HEAD_Y;
        targetMagnetX = -x * CONFIG.PRISM_MAGNET_X; // drifts opposite the pointer
        targetMagnetY = -y * CONFIG.PRISM_MAGNET_Y;
      }
    }

    const head = headCurrent.current;
    head.x = lerp(head.x, targetHeadX, CONFIG.HEAD_SMOOTHING);
    head.y = lerp(head.y, targetHeadY, CONFIG.HEAD_SMOOTHING);
    if (headRootRef.current) {
      headRootRef.current.style.transform = `translate(${head.x}px, ${head.y}px)`;
    }

    const prism = prismCurrent.current;
    prism.x = lerp(prism.x, targetMagnetX, CONFIG.PRISM_SMOOTHING);
    prism.y = lerp(prism.y, targetMagnetY, CONFIG.PRISM_SMOOTHING);

    let idleBobY = 0;
    if (!reducedMotion) {
      const wave = Math.sin((elapsed / 1000 / CONFIG.PRISM_DURATION_S) * Math.PI * 2);
      idleBobY = wave < 0 ? wave * CONFIG.PRISM_UP_PX : wave * CONFIG.PRISM_DOWN_PX;
    }
    if (prismRef.current) {
      prismRef.current.style.transform = `translate(${prism.x}px, ${prism.y + idleBobY}px)`;
    }
  });

  useEffect(() => {
    let timeoutId: number;

    const setLids = (phase: LidPhase) => {
      const scale = phase === "open" ? 0 : 1;
      const duration = phase === "closing" ? CONFIG.BLINK_CLOSE_MS : phase === "opening" ? CONFIG.BLINK_OPEN_MS : 0;
      for (const lid of [leftLidRef.current, rightLidRef.current]) {
        if (!lid) continue;
        lid.style.transitionDuration = `${duration}ms`;
        lid.style.transform = `scaleY(${scale})`;
      }
    };

    const scheduleBlink = () => {
      const delay = CONFIG.BLINK_MIN_MS + Math.random() * (CONFIG.BLINK_MAX_MS - CONFIG.BLINK_MIN_MS);
      timeoutId = window.setTimeout(runBlink, delay);
    };

    const runBlink = () => {
      setLids("closing");
      timeoutId = window.setTimeout(() => {
        setLids("closed");
        timeoutId = window.setTimeout(() => {
          setLids("opening");
          timeoutId = window.setTimeout(() => {
            setLids("open");
            if (Math.random() < CONFIG.DOUBLE_BLINK_CHANCE) {
              timeoutId = window.setTimeout(runBlink, 120);
            } else {
              scheduleBlink();
            }
          }, CONFIG.BLINK_OPEN_MS);
        }, CONFIG.BLINK_HOLD_MS);
      }, CONFIG.BLINK_CLOSE_MS);
    };

    scheduleBlink();
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full select-none transition-opacity duration-300 ${isReady ? "opacity-100" : "opacity-0"} ${className ?? ""}`}
      style={{ aspectRatio: CONFIG.ASPECT_RATIO }}
    >
      <Image
        src="/character/body-base-bottom.png"
        alt=""
        fill
        priority
        draggable={false}
        onLoad={handleLayerSettled}
        onError={handleLayerSettled}
        className="pointer-events-none object-contain"
      />

      <div ref={headRootRef} className="absolute inset-0 will-change-transform">
        <Image
          src="/character/head-base.png"
          alt=""
          fill
          priority
          draggable={false}
          onLoad={handleLayerSettled}
          onError={handleLayerSettled}
          className="pointer-events-none object-contain"
        />
        <Image
          src="/character/eyes-open.png"
          alt=""
          fill
          priority
          draggable={false}
          onLoad={handleLayerSettled}
          onError={handleLayerSettled}
          className="pointer-events-none object-contain"
        />
        <Image
          ref={leftLidRef}
          src="/character/left-blink-lid.png"
          alt=""
          fill
          priority
          draggable={false}
          onLoad={handleLayerSettled}
          onError={handleLayerSettled}
          style={{ transformOrigin: "50% 11.7%" }} // pivots at the lid artwork's own top edge, not the canvas top
          className="pointer-events-none scale-y-0 object-contain transition-transform ease-in-out"
        />
        <Image
          ref={rightLidRef}
          src="/character/right-blink-lid.png"
          alt=""
          fill
          priority
          draggable={false}
          onLoad={handleLayerSettled}
          onError={handleLayerSettled}
          style={{ transformOrigin: "50% 9.4%" }}
          className="pointer-events-none scale-y-0 object-contain transition-transform ease-in-out"
        />
        <Image
          src="/character/glasses-front.png"
          alt=""
          fill
          priority
          draggable={false}
          onLoad={handleLayerSettled}
          onError={handleLayerSettled}
          className="pointer-events-none object-contain"
        />
      </div>

      <Image
        src="/character/body-base-top.png"
        alt=""
        fill
        priority
        draggable={false}
        onLoad={handleLayerSettled}
        onError={handleLayerSettled}
        className="pointer-events-none object-contain"
      />

      <div ref={prismRef} className="absolute inset-0 will-change-transform">
        <Image
          src="/character/prism.png"
          alt=""
          fill
          priority
          draggable={false}
          onLoad={handleLayerSettled}
          onError={handleLayerSettled}
          className="pointer-events-none object-contain"
        />
      </div>
    </div>
  );
}

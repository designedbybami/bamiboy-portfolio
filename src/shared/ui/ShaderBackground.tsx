"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ComponentConfig, ShaderInstance } from "shaders/js";
import { deviceCanAffordShader } from "@/shared/lib/shader-device-gate";

export type ShaderBackgroundHandle = {
  update: (componentId: string, props: Record<string, unknown>) => void;
  pause: () => void;
  resume: () => void;
};

type ShaderBackgroundProps = {
  components: ComponentConfig[];
  /** IntersectionObserver rootMargin: how early to start loading, to avoid a visible fallback-to-shader pop. */
  preloadMargin?: string;
  /** Must include a position value (absolute/relative/fixed) — this component doesn't set its own, see below. */
  className?: string;
  /** Static CSS background shown under the canvas: covers the gated-device, pre-ready, reduced-motion-first-frame, and load-failure states for free. */
  fallbackClassName?: string;
  onReadyChange?: (ready: boolean) => void;
};

const DEFAULT_PRELOAD_MARGIN = "300px 0px";

// Wiring around the `shaders` (shaders.com) package, ported from the Angular reference in
// fardelins-landing-page (see bami-shaders skill): device/connection gate before the dynamic
// import, lazy create + pause/resume off IntersectionObserver, manual ResizeObserver (the
// library's own auto-resize misses big aspect-ratio jumps at breakpoints), opacity fade-in on
// ready (never a flash of unstyled canvas), and full teardown on unmount.
export const ShaderBackground = forwardRef<ShaderBackgroundHandle, ShaderBackgroundProps>(function ShaderBackground(
  { components, preloadMargin = DEFAULT_PRELOAD_MARGIN, className = "", fallbackClassName = "", onReadyChange },
  forwardedRef,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shaderRef = useRef<ShaderInstance | null>(null);
  const nearViewportRef = useRef(false);
  const creatingRef = useRef(false);
  const destroyedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useImperativeHandle(forwardedRef, () => ({
    update: (componentId, props) => shaderRef.current?.update(componentId, props),
    pause: () => shaderRef.current?.pause(),
    resume: () => shaderRef.current?.resume(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;

    destroyedRef.current = false;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canAfford = deviceCanAffordShader();

    async function recreateShader() {
      if (!canAfford || !canvas) return;
      creatingRef.current = true;
      shaderRef.current?.destroy();
      shaderRef.current = null;
      setReady(false);
      onReadyChange?.(false);

      // Lazy import: `shaders` pulls in Three.js's WebGPU renderer, keep it out of the initial bundle.
      const { createShader } = await import("shaders/js");
      if (destroyedRef.current) {
        creatingRef.current = false;
        return;
      }

      shaderRef.current = await createShader(
        canvas,
        { components },
        {
          disableTelemetry: true,
          observeElement: false,
          onReady: () => {
            setReady(true);
            onReadyChange?.(true);
          },
          onError: (reason) => {
            if (process.env.NODE_ENV !== "production") console.error("[ShaderBackground] createShader error:", reason);
          },
        },
      );
      creatingRef.current = false;

      if (prefersReducedMotion || !nearViewportRef.current) {
        shaderRef.current.pause();
      }
    }

    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        nearViewportRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (!shaderRef.current && !creatingRef.current) {
            void recreateShader();
          } else if (!prefersReducedMotion) {
            shaderRef.current?.resume();
          }
        } else {
          shaderRef.current?.pause();
        }
      },
      { rootMargin: preloadMargin },
    );
    loadObserver.observe(canvas);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => shaderRef.current?.resize())
        : null;
    resizeObserver?.observe(canvas);

    return () => {
      destroyedRef.current = true;
      resizeObserver?.disconnect();
      loadObserver.disconnect();
      shaderRef.current?.destroy();
      shaderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `components` (the preset tree) is intentionally not a dep: swap presets via ref.update(), not remount
  }, []);

  return (
    // No position class of its own (relative/absolute/fixed) — every call site's `className`
    // supplies one, so this never ends up with two competing `position` classes on one element.
    <div className={`overflow-hidden ${className}`}>
      <div aria-hidden className={`absolute inset-0 h-full w-full ${fallbackClassName}`} />
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 motion-reduce:transition-none ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
});

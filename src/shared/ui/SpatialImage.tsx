"use client";

import { useEffect, useRef, useState } from "react";
import { deviceCanAffordShader } from "@/shared/lib/shader-device-gate";

type SpatialImageProps = {
  src: string;
  depthSrc: string;
  /** Mounts the WebGL layer on true, tears it fully down on false. */
  active: boolean;
  /** Viewport coordinates at hover-enter; sets the ripple's true origin. */
  entryPoint?: { x: number; y: number } | null;
  className?: string;
  /** Max UV displacement at full depth extremes, in UV units (0-1 space). */
  strength?: number;
};

const DEFAULT_STRENGTH = 0.09;
const POINTER_EASE = 0.12;
// Ring travels from the entry point to its diagonal opposite over this many seconds.
const RIPPLE_TRAVEL = 0.85;
const RIPPLE_DECAY = 1.8;
const RIPPLE_RING_SPEED = 9.0;
const RIPPLE_FREQUENCY = 34.0;
const RIPPLE_SPATIAL_DECAY = 2.6;
const RIPPLE_AMPLITUDE = 0.055;
const WAVE_AMPLITUDE = 0.0022;
const ABERRATION_STRENGTH = 0.0014;
// Slight zoom so parallax displacement never hits the clamped edge of the source image.
const ZOOM = 1.035;
// Ripple plays alone first, spatial fades in only once it's mostly done (one at a time, not both at once).
const SPATIAL_GATE_START = RIPPLE_TRAVEL;
const SPATIAL_GATE_END = RIPPLE_TRAVEL + 0.25;

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// No colorSpace conversion on uColor: writes straight to canvas, raw sRGB bytes in and out.
const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uColor;
  uniform sampler2D uDepth;
  uniform vec2 uPointer;
  uniform vec2 uCoverScale;
  uniform float uStrength;
  uniform float uTime;
  uniform vec2 uRippleOrigin;
  uniform float uRippleTime;
  uniform float uAberration;
  varying vec2 vUv;

  void main() {
    vec2 coverUv = (vUv - 0.5) * uCoverScale + 0.5;
    coverUv = (coverUv - 0.5) / ZOOM_PLACEHOLDER + 0.5;

    float spatialGate = smoothstep(SPATIAL_GATE_START_PLACEHOLDER, SPATIAL_GATE_END_PLACEHOLDER, uRippleTime);

    float depth = texture2D(uDepth, coverUv).r;
    vec2 depthOffset = uPointer * (depth - 0.5) * uStrength * spatialGate;

    float edgeFactor = smoothstep(0.08, 0.42, length(uPointer));
    vec2 wave = vec2(
      sin(coverUv.y * 9.0 + uTime * 1.6),
      sin(coverUv.x * 9.0 + uTime * 1.3)
    ) * WAVE_AMPLITUDE_PLACEHOLDER * (0.25 + edgeFactor * 2.2) * spatialGate;

    vec2 rippleTarget = vec2(1.0) - uRippleOrigin;
    float travelT = clamp(uRippleTime / RIPPLE_TRAVEL_PLACEHOLDER, 0.0, 1.0);
    vec2 rippleCenter = mix(uRippleOrigin, rippleTarget, travelT);

    float rippleDist = distance(coverUv, rippleCenter);
    float ring = sin(rippleDist * RIPPLE_FREQUENCY_PLACEHOLDER - uRippleTime * RIPPLE_RING_SPEED_PLACEHOLDER);
    float spatialFalloff = exp(-rippleDist * RIPPLE_SPATIAL_DECAY_PLACEHOLDER);
    float envelope = exp(-uRippleTime * RIPPLE_DECAY_PLACEHOLDER);
    float ripple = ring * spatialFalloff * envelope * RIPPLE_AMPLITUDE_PLACEHOLDER;
    vec2 rippleDir = normalize(coverUv - rippleCenter + 0.0001);
    vec2 rippleOffset = rippleDir * ripple;

    vec2 sampleUv = coverUv - depthOffset - wave - rippleOffset;

    float aberration = uAberration * (0.5 + length(uPointer) * 1.5) * spatialGate;
    vec2 aberrationDir = length(uPointer) > 0.001 ? normalize(uPointer) : vec2(1.0, 0.0);
    float r = texture2D(uColor, sampleUv + aberrationDir * aberration).r;
    float g = texture2D(uColor, sampleUv).g;
    float b = texture2D(uColor, sampleUv - aberrationDir * aberration).b;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`
  .replace("ZOOM_PLACEHOLDER", ZOOM.toFixed(4))
  .replace("SPATIAL_GATE_START_PLACEHOLDER", SPATIAL_GATE_START.toFixed(3))
  .replace("SPATIAL_GATE_END_PLACEHOLDER", SPATIAL_GATE_END.toFixed(3))
  .replace("WAVE_AMPLITUDE_PLACEHOLDER", WAVE_AMPLITUDE.toFixed(6))
  .replace(/RIPPLE_TRAVEL_PLACEHOLDER/g, RIPPLE_TRAVEL.toFixed(3))
  .replace("RIPPLE_DECAY_PLACEHOLDER", RIPPLE_DECAY.toFixed(3))
  .replace("RIPPLE_RING_SPEED_PLACEHOLDER", RIPPLE_RING_SPEED.toFixed(3))
  .replace("RIPPLE_FREQUENCY_PLACEHOLDER", RIPPLE_FREQUENCY.toFixed(3))
  .replace("RIPPLE_SPATIAL_DECAY_PLACEHOLDER", RIPPLE_SPATIAL_DECAY.toFixed(3))
  .replace(/RIPPLE_AMPLITUDE_PLACEHOLDER/g, RIPPLE_AMPLITUDE.toFixed(6));

function coverScale(texWidth: number, texHeight: number, boxWidth: number, boxHeight: number) {
  const texAspect = texWidth / texHeight;
  const boxAspect = boxWidth / boxHeight;
  return texAspect > boxAspect ? { x: boxAspect / texAspect, y: 1 } : { x: 1, y: texAspect / boxAspect };
}

// Overlays a WebGL depth-parallax canvas on the caller's own <Image>; mounts the GL context only while `active`.
export function SpatialImage({
  src,
  depthSrc,
  active,
  entryPoint,
  className = "",
  strength = DEFAULT_STRENGTH,
}: SpatialImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- matchMedia/deviceMemory can't run during SSR without a client mismatch
    setEnabled(!window.matchMedia("(prefers-reduced-motion: reduce)").matches && deviceCanAffordShader());
  }, []);

  useEffect(() => {
    if (!active || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting on hover-out, not a render-triggered loop
      setReady(false);
      return;
    }
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let disposed = false;
    let raf = 0;
    let teardown: (() => void) | undefined;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const rippleOrigin = { x: 0.5, y: 0.5 };
    let rippleOriginSet = false;
    let rippleStart = performance.now();
    const clockStart = performance.now();

    // Origin comes from the synchronous hover-enter event, not a later pointermove (see WorkTile).
    if (entryPoint) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const u = (entryPoint.x - rect.left) / rect.width;
        const v = (entryPoint.y - rect.top) / rect.height;
        rippleOrigin.x = u;
        rippleOrigin.y = v;
        rippleOriginSet = true;
        rippleStart = performance.now();
        pointer.targetX = u - 0.5;
        pointer.targetY = -(v - 0.5);
      }
    }

    void (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
      camera.position.z = 1;

      const loader = new THREE.TextureLoader();
      const [colorTex, depthTex] = await Promise.all([loader.loadAsync(src), loader.loadAsync(depthSrc)]);
      if (disposed) {
        colorTex.dispose();
        depthTex.dispose();
        renderer.dispose();
        return;
      }

      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: colorTex },
          uDepth: { value: depthTex },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uCoverScale: { value: new THREE.Vector2(1, 1) },
          uStrength: { value: strength },
          uTime: { value: 0 },
          uRippleOrigin: { value: new THREE.Vector2(rippleOrigin.x, rippleOrigin.y) },
          uRippleTime: { value: rippleOriginSet ? 0 : 999 },
          uAberration: { value: ABERRATION_STRENGTH },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      });
      scene.add(new THREE.Mesh(geometry, material));

      const texWidth = colorTex.image.width as number;
      const texHeight = colorTex.image.height as number;

      function resize() {
        const rect = container!.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        renderer.setSize(rect.width, rect.height, false);
        const scale = coverScale(texWidth, texHeight, rect.width, rect.height);
        (material.uniforms.uCoverScale.value as InstanceType<typeof THREE.Vector2>).set(scale.x, scale.y);
      }
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container!);

      // Window, not container: the overlay is pointer-events-none so clicks reach the Link underneath.
      function onPointerMove(event: PointerEvent) {
        const rect = container!.getBoundingClientRect();
        const u = (event.clientX - rect.left) / rect.width;
        const v = (event.clientY - rect.top) / rect.height;
        pointer.targetX = u - 0.5;
        pointer.targetY = -(v - 0.5);
        if (!rippleOriginSet) {
          rippleOrigin.x = u;
          rippleOrigin.y = v;
          rippleOriginSet = true;
          rippleStart = performance.now();
          (material.uniforms.uRippleOrigin.value as InstanceType<typeof THREE.Vector2>).set(u, v);
        }
      }
      window.addEventListener("pointermove", onPointerMove);

      function tick() {
        pointer.x += (pointer.targetX - pointer.x) * POINTER_EASE;
        pointer.y += (pointer.targetY - pointer.y) * POINTER_EASE;
        (material.uniforms.uPointer.value as InstanceType<typeof THREE.Vector2>).set(pointer.x, pointer.y);
        material.uniforms.uTime.value = (performance.now() - clockStart) / 1000;
        material.uniforms.uRippleTime.value = rippleOriginSet ? (performance.now() - rippleStart) / 1000 : 999;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      }
      tick();
      if (!disposed) setReady(true);

      teardown = () => {
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        geometry.dispose();
        material.dispose();
        colorTex.dispose();
        depthTex.dispose();
        renderer.dispose();
      };
      if (disposed) teardown();
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      teardown?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- src/depthSrc/strength/entryPoint are stable per hover; re-running on `active` is the whole point
  }, [active, enabled]);

  if (!enabled) return null;

  return (
    <div ref={containerRef} className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`h-full w-full transition-opacity duration-200 ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

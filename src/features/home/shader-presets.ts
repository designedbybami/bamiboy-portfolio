import type { ComponentConfig } from "shaders/js";

// One dominant brand color (ink, the footer's own base) carrying most of the ChromaFlow node,
// with primary blue as the single accent that reveals itself as the cursor moves, so the effect
// reads as "on-brand" rather than a random rainbow.
export const footerBackgroundPreset: ComponentConfig[] = [
  {
    type: "ChromaFlow",
    props: {
      baseColor: "#0a0908",
      upColor: "#1e5eff",
      downColor: "#0a0908",
      leftColor: "#0a0908",
      rightColor: "#5a87ff",
      intensity: 0.5,
      radius: 4,
      momentum: 40,
    },
  },
];

// The playground's "floor": a flowing ink-to-blue gradient with Liquify layered on top so it
// responds to cursor drag like fabric, per the brief's "flowing gradient... add liquify too."
export const footerPanelPreset: ComponentConfig[] = [
  {
    type: "Liquify",
    props: { intensity: 6, stiffness: 4, damping: 4, radius: 0.8, edges: "mirror" },
    children: [
      {
        type: "FlowingGradient",
        props: {
          colorA: "#0a0908",
          colorB: "#1e5eff",
          colorC: "#5a87ff",
          colorD: "#c7d9ff",
          colorSpace: "oklch",
          speed: 0.4,
          distortion: 0.6,
          seed: 12,
        },
      },
    ],
  },
];

// A studio-lit chrome/glass material. Rendered at its own small canvas sized to the wordmark's
// bounding box, then CSS-masked to the text glyphs (see FooterWordmark) rather than driven
// through Glass's own `shapeSdfUrl` — that path needs an SVG exported through shaders.com's
// design editor into a hosted SDF .bin file, an external account-based step outside this repo.
// `scale: 3, cutout: false` makes Glass's own internal shape irrelevant (it fills well past the
// canvas edges), so the text shaping is entirely the CSS mask's job.
export const footerWordmarkPreset: ComponentConfig[] = [
  {
    type: "Glass",
    props: {
      scale: 3,
      cutout: false,
      refraction: 0.8,
      thickness: 0.35,
      aberration: 0.35,
      innerZoom: 1.2,
      lightAngle: 300,
      highlight: 0.4,
      highlightColor: "#ffffff",
      highlightSoftness: 0.4,
      fresnel: 0.25,
      fresnelColor: "#5a87ff",
      tintColor: "#0a0908",
      tintIntensity: 0.15,
      tintPreserveLuminosity: true,
    },
    children: [
      {
        type: "StudioBackground",
        props: {
          color: "#d8dbec",
          keyColor: "#ffffff",
          keyIntensity: 60,
          fillColor: "#5a87ff",
          fillIntensity: 20,
          backColor: "#1e5eff",
          backIntensity: 25,
          brightness: 30,
          ambientIntensity: 60,
          ambientSpeed: 3,
        },
      },
    ],
  },
];

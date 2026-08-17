"use client";

import { useRef, useState } from "react";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";
import { trackEvent } from "@/shared/lib/analytics";
import { siteConfig } from "@/shared/lib/site-config";
import { Button } from "@/shared/ui/Button";
import { SITE_FRAME_INSET } from "@/shared/ui/frame-constants";
import { TickFrame } from "@/shared/ui/TickFrame";
import { CharacterGlow } from "./components/CharacterGlow";
import { InteractiveCharacter } from "./components/InteractiveCharacter";
import { SpeechBubble } from "./components/SpeechBubble";
import { StickerField } from "./components/StickerField";
import { heroCopy } from "./copy";

const EASE = [0.65, 0, 0.35, 1] as const; // the site's one shared easing curve, see STANDARDS.md

// Stages text, character, then stickers in sequence via Motion's variant propagation, not hand-timed delays.
const HERO_CONTAINER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.25, delayChildren: 0.1 } },
};

const TEXT_GROUP: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
};

const HEADLINE_CONTAINER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const HEADLINE_WORD: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
};

// Quarter-flip + scale-up so the character reads as "revealed," not "resized"; underdamped spring is intentional (see STANDARDS.md).
const CHARACTER_ENTRANCE: Variants = {
  hidden: { opacity: 0, scale: 0.4, rotateY: 100 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { type: "spring", stiffness: 45, damping: 9, mass: 1 },
  },
};

const SHIMMER_TRANSITION = { duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 1.2 } as const;

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const dragBoundsRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const headlineWords = heroCopy.headline.split(" ");

  const [characterReady, setCharacterReady] = useState(!!shouldReduceMotion);

  // Not pinned: tracks the hero's own natural scroll-out (top at viewport top -> bottom at viewport top).
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  const textScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.7]);
  const textZ = useTransform(scrollYProgress, [0, 0.8], [0, -420]);
  const textRotateX = useTransform(scrollYProgress, [0, 0.8], [0, 6]);

  const stickerScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const stickerZ = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const stickerRotateX = useTransform(scrollYProgress, [0, 1], [0, 3]);

  // Scale lives on an inner wrapper (not the entrance element) so it doesn't fight CHARACTER_ENTRANCE's own scale spring.
  const characterScale = useTransform(scrollYProgress, [0.3, 1], [1, 0.75]);
  const characterZ = useTransform(scrollYProgress, [0.3, 1], [0, -30]);
  const characterRotateX = useTransform(scrollYProgress, [0.3, 1], [0, 0.75]);

  // Wide band (80pts), not a thin sweeping edge, so more of the hero reads as fading at once.
  const wipeStart = useTransform(scrollYProgress, [0, 1], [-80, 100]);
  const wipeEnd = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const maskImage = useMotionTemplate`linear-gradient(to bottom, transparent 0%, transparent ${wipeStart}%, black ${wipeEnd}%, black 100%)`;

  return (
    <motion.section
      ref={heroRef}
      initial={shouldReduceMotion ? "visible" : "hidden"}
      animate="visible"
      variants={HERO_CONTAINER}
      style={shouldReduceMotion ? undefined : { perspective: 1200, maskImage, WebkitMaskImage: maskImage }}
      className="relative flex min-h-screen flex-col overflow-hidden bg-ink"
    >
      <CharacterGlow containerRef={heroRef} characterRef={characterRef} characterReady={characterReady} />

      {/* Matches SiteFrame's inset exactly, so stickers bounce off the same boundary the visible frame renders from. */}
      <div ref={dragBoundsRef} aria-hidden className="pointer-events-none absolute" style={{ inset: SITE_FRAME_INSET }} />

      <motion.div
        variants={TEXT_GROUP}
        style={shouldReduceMotion ? undefined : { scale: textScale, z: textZ, rotateX: textRotateX }}
        className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 pt-40 text-center sm:pt-48"
      >
        <motion.div variants={FADE_UP}>
          <TickFrame>
            <motion.span
              className="inline-block bg-clip-text text-xs font-medium uppercase tracking-[0.14em] text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, rgba(255,255,255,0.55) 40%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.55) 60%)",
                backgroundSize: "220% 100%",
              }}
              animate={shouldReduceMotion ? undefined : { backgroundPositionX: ["120%", "-120%"] }}
              transition={shouldReduceMotion ? undefined : SHIMMER_TRANSITION}
            >
              {heroCopy.badge}
            </motion.span>
          </TickFrame>
        </motion.div>

        <motion.h1
          variants={HEADLINE_CONTAINER}
          className="mt-6 max-w-2xl font-display text-5xl font-bold capitalize leading-[1.08] tracking-normal text-paper sm:text-6xl md:text-7xl"
        >
          {headlineWords.map((word, index) => (
            <span key={index}>
              <motion.span variants={HEADLINE_WORD} className="inline-block">
                {word}
              </motion.span>
              {index < headlineWords.length - 1 ? " " : ""}
            </span>
          ))}
        </motion.h1>

        <motion.div variants={FADE_UP} className="mt-8" onClick={() => trackEvent({ event: "contact_click", cta_location: "hero_cta" })}>
          <Button
            href={`mailto:${siteConfig.email}`}
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium transition-colors"
            textClassName="text-white"
            hoverBg="bg-primary-soft"
            wave
          >
            {heroCopy.ctaLabel}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        ref={characterRef}
        variants={CHARACTER_ENTRANCE}
        onAnimationComplete={() => setCharacterReady(true)}
        style={{ transformPerspective: 1000 }}
        className="relative z-10 mx-auto mt-8 w-full max-w-xs px-6 sm:max-w-sm md:max-w-md"
      >
        <motion.div
          style={shouldReduceMotion ? undefined : { scale: characterScale, z: characterZ, rotateX: characterRotateX }}
        >
          <InteractiveCharacter containerRef={heroRef} />
          <SpeechBubble characterRef={characterRef} lines={heroCopy.speechBubble} nameTag={heroCopy.nameTag} />
        </motion.div>
      </motion.div>

      <motion.div
        style={shouldReduceMotion ? undefined : { scale: stickerScale, z: stickerZ, rotateX: stickerRotateX }}
        className="absolute inset-0 z-20"
      >
        <StickerField dragBoundsRef={dragBoundsRef} />
      </motion.div>
    </motion.section>
  );
}

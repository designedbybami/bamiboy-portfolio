"use client";

import { useEffect, useRef } from "react";
import { clamp, motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { DraftLine } from "@/shared/ui/DraftLine";
import { SectionCenterTicks } from "@/shared/ui/SectionCenterTicks";
import { AreasOfWorkTrail } from "@/features/about/components/AreasOfWorkTrail";
import { aboutTeaserCopy } from "./copy";

const DWELL_VH = 40; // extra scroll room held once pinned, before the sweep is allowed to fire
const SWEEP_TRIGGER_PROGRESS = 0.55; // fraction of the dwell scrolled through first, the "delay"
const SWEEP_MAX_RADIUS = 150; // percent; large enough to fully cover the viewport regardless of aspect ratio

const REVEAL_START_DELAY_MS = 500; // real time, counted from when the text is actually visible, not from scroll-in
const REVEAL_SCROLL_PX = 420; // scroll distance, from the delay's end, over which the word reveal is scrubbed
const WORD_WINDOW = 0.12; // fraction of the reveal each word itself takes, staggered starts across the rest

function wordRange(index: number, total: number): [number, number] {
  const span = 1 - WORD_WINDOW;
  const start = (span * index) / Math.max(total - 1, 1);
  return [start, start + WORD_WINDOW];
}

function Word({ word, index, total, progress }: { word: string; index: number; total: number; progress: MotionValue<number> }) {
  const [start, end] = wordRange(index, total);
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [16, 0]);
  const blur = useTransform(progress, [start, end], [6, 0]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  return (
    <motion.span style={{ opacity, y, filter }} className="inline-block">
      {word}
    </motion.span>
  );
}

function StaticAboutTeaser() {
  return (
    <section className="relative flex min-h-screen flex-col bg-paper">
      <DraftLine />
      <SectionCenterTicks />
      <div className="relative flex flex-1 items-center justify-center">
        <AreasOfWorkTrail />
        <p className="relative z-20 mx-auto max-w-5xl px-6 text-center font-display text-5xl font-bold leading-[1.2] tracking-normal text-ink sm:text-6xl md:text-7xl">
          {aboutTeaserCopy.headline}
        </p>
      </div>
    </section>
  );
}

// White reveal is a circular clip-path (Button's cursor-fill mechanic), not a color crossfade; text stays mix-blend-difference so it auto-inverts as the circle passes under it.
export function AboutTeaser() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const words = aboutTeaserCopy.headline.split(" ");

  // Global scrollY, not an element-relative rect, so it keeps updating through the sticky dwell too.
  const { scrollY } = useScroll();
  const textInView = useInView(textRef, { once: true, amount: 0.2 });

  // +Infinity = ungated (progress always clamps to 0). Explicit array form, not the auto-tracking
  // single-callback one: that only subscribes to values touched on its first run, so the early-return
  // branch here would permanently starve it of scrollY updates once the gate opens.
  const gateScrollY = useMotionValue(Infinity);

  useEffect(() => {
    if (!textInView || shouldReduceMotion) return;
    const timeout = window.setTimeout(() => gateScrollY.set(scrollY.get()), REVEAL_START_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [textInView, shouldReduceMotion, scrollY, gateScrollY]);

  const wordProgress = useTransform([scrollY, gateScrollY], ([currentY, startY]: number[]) =>
    clamp(0, 1, (currentY - startY) / REVEAL_SCROLL_PX)
  );

  // Dwell only: container top at viewport top (0) -> container bottom at viewport bottom (1).
  const { scrollYProgress: pinProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  // Scroll-linked, not a fire-once trigger, so scrolling back up shrinks the circle back down.
  const sweepRadius = useTransform(pinProgress, [SWEEP_TRIGGER_PROGRESS, 1], [0, SWEEP_MAX_RADIUS]);
  const clipPath = useMotionTemplate`circle(${sweepRadius}% at 50% 100%)`;

  if (shouldReduceMotion) return <StaticAboutTeaser />;

  return (
    <section ref={containerRef} className="relative bg-ink" style={{ height: `calc(100vh + ${DWELL_VH}vh)` }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        <DraftLine />
        <SectionCenterTicks />

        <div className="relative flex flex-1 items-center justify-center">
          <AreasOfWorkTrail />

          <p
            ref={textRef}
            className="relative z-20 mix-blend-difference mx-auto max-w-5xl px-6 text-center font-display text-5xl font-bold leading-[1.2] tracking-normal text-paper sm:text-6xl md:text-7xl"
          >
            {words.map((word, index) => (
              <span key={index}>
                <Word word={word} index={index} total={words.length} progress={wordProgress} />
                {index < words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        </div>

        <motion.div aria-hidden className="absolute inset-0 z-10 bg-paper" style={{ clipPath }} />
      </div>
    </section>
  );
}

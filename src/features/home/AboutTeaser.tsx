"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { DraftLine } from "@/shared/ui/DraftLine";
import { SectionCenterTicks } from "@/shared/ui/SectionCenterTicks";
import { useScrollColorSweep } from "@/shared/lib/useScrollColorSweep";
import { AreasOfWorkTrail } from "@/features/about/components/AreasOfWorkTrail";
import { aboutTeaserCopy } from "./copy";

const EASE = [0.65, 0, 0.35, 1] as const; // the site's one shared easing curve, see STANDARDS.md

const INK = "#0a0908";
const PAPER = "#ffffff";

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

// Full-viewport, starts bg-ink like Hero (seamless dark continuation), flips to bg-paper once this
// section's top edge touches the viewport top (see useScrollColorSweep). Text stays flat white with
// mix-blend-mode: difference (same trick SiteNav/TickFrame use), which auto-inverts to black the
// instant the backdrop flips, no second color transform needed for the text.
export function AboutTeaser() {
  const shouldReduceMotion = useReducedMotion();
  const { ref: sectionRef, triggered: touchedTop } = useScrollColorSweep<HTMLElement>("top");

  return (
    <motion.section
      ref={sectionRef}
      initial={false}
      animate={{ backgroundColor: touchedTop ? PAPER : INK }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative flex min-h-screen flex-col"
    >
      <DraftLine />
      <SectionCenterTicks />

      <div className="relative flex flex-1 flex-col items-center justify-center">
        <AreasOfWorkTrail />

        <motion.p
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={REVEAL}
          className="relative z-20 mix-blend-difference mx-auto max-w-3xl px-6 text-center font-display text-3xl font-bold leading-[1.2] tracking-normal text-paper sm:text-4xl md:text-5xl"
        >
          {aboutTeaserCopy.headline}
        </motion.p>
      </div>
    </motion.section>
  );
}

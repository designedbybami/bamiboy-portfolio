"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { DraftLine } from "@/shared/ui/DraftLine";
import { DirectionalLinkRow } from "@/shared/ui/DirectionalLinkRow";
import { routes } from "@/shared/lib/site-config";
import { works } from "@/features/works/works-data";
import { featuredWorkCopy } from "./copy";
import { WorkTile } from "./components/WorkTile";

const EASE = [0.65, 0, 0.35, 1] as const; // the site's one shared easing curve, see STANDARDS.md

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

const GRID: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// Reference: inspo/lusion-featured-work-screenrecording.mp4, minus its many-item scroll list
// and rounded cards, this site's editorial register keeps square-cornered image tiles.
export function FeaturedWork() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="featured-work" className="relative flex flex-col bg-paper pt-24 sm:pt-32">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 sm:flex-row sm:items-end sm:justify-between lg:px-12">
        <motion.div
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={REVEAL}
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/50">{featuredWorkCopy.eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl font-bold leading-[1.08] tracking-normal text-ink sm:text-5xl">
            {featuredWorkCopy.headline}
          </h2>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={REVEAL}
          className="flex max-w-sm flex-col items-start gap-4 sm:items-end sm:text-right"
        >
          <p className="text-sm text-ink/70 sm:text-base">{featuredWorkCopy.description}</p>
          <DirectionalLinkRow
            href={routes.works}
            typographyClassName="text-sm font-medium uppercase tracking-wide"
            textColorClassName="text-ink"
          >
            {featuredWorkCopy.viewAllLabel}
          </DirectionalLinkRow>
        </motion.div>
      </div>

      <motion.div
        initial={shouldReduceMotion ? "visible" : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={GRID}
        className="mx-auto mt-16 grid w-full max-w-6xl grid-cols-1 gap-x-10 gap-y-16 px-6 sm:mt-20 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-20 lg:px-12"
      >
        {works.map((work) => (
          <WorkTile key={work.slug} work={work} />
        ))}
      </motion.div>

      <div className="mt-24 sm:mt-32">
        <DraftLine />
      </div>
    </section>
  );
}

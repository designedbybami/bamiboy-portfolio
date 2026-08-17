"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { DraftLine } from "@/shared/ui/DraftLine";
import { Button } from "@/shared/ui/Button";
import { ROUNDED_CLASSNAME, SECTION_PADDING_CLASSNAME } from "@/shared/ui/frame-constants";
import { routes } from "@/shared/lib/site-config";
import { works } from "@/features/works/works-data";
import { featuredWorkCopy } from "./copy";
import { WorkTile } from "./components/WorkTile";

const EASE = [0.65, 0, 0.35, 1] as const; // the site's one shared easing curve, see STANDARDS.md

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

// Header layout only (not register) references inspo/wearecheck-work-hero.png, see STANDARDS.md.
export function FeaturedWork() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="featured-work" className="relative flex flex-col bg-paper">
      <DraftLine />

      <div className={`mt-24 flex w-full flex-col gap-10 sm:mt-32 sm:flex-row sm:items-end sm:justify-between ${SECTION_PADDING_CLASSNAME}`}>
        <motion.h2
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={REVEAL}
          className="font-display text-6xl font-bold leading-[0.95] tracking-normal text-ink sm:text-7xl lg:text-8xl"
        >
          {featuredWorkCopy.headlineLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </motion.h2>

        <motion.div
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={REVEAL}
          className="flex max-w-xs flex-col gap-6"
        >
          <p className="text-sm text-ink/70 sm:text-base">{featuredWorkCopy.description}</p>
          <Button
            href={routes.works}
            className={`w-fit bg-ink px-6 py-3 text-sm font-medium uppercase tracking-wide ${ROUNDED_CLASSNAME}`}
            textClassName="text-paper"
            hoverBg="bg-primary"
          >
            {featuredWorkCopy.viewAllLabel}
          </Button>
        </motion.div>
      </div>

      <div
        className={`mt-16 grid w-full grid-cols-1 gap-x-10 gap-y-16 sm:mt-20 sm:grid-cols-2 lg:gap-x-16 lg:gap-y-20 ${SECTION_PADDING_CLASSNAME}`}
      >
        {works.map((work) => (
          <WorkTile key={work.slug} work={work} />
        ))}
      </div>

      <div className="mt-24 sm:mt-32">
        <DraftLine />
      </div>
    </section>
  );
}

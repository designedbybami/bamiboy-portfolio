"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { DraftLine } from "@/shared/ui/DraftLine";
import { SectionCenterTicks } from "@/shared/ui/SectionCenterTicks";
import { SECTION_PADDING_CLASSNAME } from "@/shared/ui/frame-constants";
import { PrincipleRow } from "./components/PrincipleRow";
import { principlesCopy } from "./copy";

const EASE = [0.65, 0, 0.35, 1] as const; // the site's one shared easing curve, see STANDARDS.md

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

// Reference: inspo/wearecheck-about-strategy-section.png, one full-bleed tinted block per principle,
// each carrying its own always-on ambient motif (see PrincipleRow/PrincipleMotif), not a single
// pinned 100vh viewport cycling through all five. A pinned-scroll version was tried first and
// dropped, it read as heavier/gimmickier than this content needed, see STANDARDS.md.
export function Principles() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative flex flex-col bg-paper">
      <SectionCenterTicks />

      <div className={`relative z-10 mx-auto w-full max-w-6xl pb-10 pt-16 sm:pb-12 sm:pt-24 ${SECTION_PADDING_CLASSNAME}`}>
        <motion.div
          initial={shouldReduceMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={REVEAL}
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/50">{principlesCopy.eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl font-bold leading-[1.08] tracking-normal text-ink sm:text-5xl">
            {principlesCopy.headline}
          </h2>
        </motion.div>
      </div>

      <div className="relative z-10">
        {principlesCopy.items.map((item, index) => (
          <PrincipleRow key={item.id} item={item} index={index} />
        ))}
      </div>

      <DraftLine className="mt-4" />
    </section>
  );
}

"use client";

import { useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { Icon } from "@iconify/react";
import { DirectionalHoverText, type HoverEdge } from "@/shared/ui/DirectionalHoverText";
import { routes } from "@/shared/lib/site-config";
import type { Work } from "@/features/works/works-data";

const EASE = [0.65, 0, 0.35, 1] as const; // the site's one shared easing curve, see STANDARDS.md

export const WORK_TILE_REVEAL: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

// Whole tile is one link, one hover state owned by the outer element (see STANDARDS.md motion
// philosophy): drives the image scale, the leading arrow, and the title color together.
export function WorkTile({ work }: { work: Work }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const [edge, setEdge] = useState<HoverEdge>("bottom");

  const readEdge = (clientY: number, rect: DOMRect): HoverEdge => (clientY < rect.top + rect.height / 2 ? "top" : "bottom");

  const handleEnter = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setEdge(readEdge(event.clientY, rect));
    setHovered(true);
  };

  const handleLeave = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setEdge(readEdge(event.clientY, rect));
    setHovered(false);
  };

  const resolvedTitleClassName = `font-display text-3xl font-bold leading-tight transition-colors duration-300 motion-reduce:transition-none sm:text-4xl ${
    hovered ? "text-primary" : "text-ink"
  }`;

  return (
    <motion.div variants={WORK_TILE_REVEAL}>
      <Link
        ref={ref}
        href={routes.workDetail(work.slug)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="group block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-ink/5">
          <motion.div
            className="absolute inset-0"
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Image
              src={work.image}
              alt={work.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        </div>

        <div className="mt-6 flex items-baseline gap-1">
          <span aria-hidden className="inline-flex w-8 shrink-0 justify-center sm:w-10">
            <motion.span
              className="inline-flex"
              animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <Icon icon="solar:arrow-right-line-duotone" className="size-6 text-primary sm:size-7" />
            </motion.span>
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/50">
              {work.tags.join(" • ")}
            </p>
            <DirectionalHoverText hovered={hovered} edge={edge} className={resolvedTitleClassName}>
              {work.title}
            </DirectionalHoverText>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

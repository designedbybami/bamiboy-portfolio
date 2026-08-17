"use client";

import { useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Icon } from "@iconify/react";
import { DirectionalHoverText, type HoverEdge } from "@/shared/ui/DirectionalHoverText";
import { SpatialImage } from "@/shared/ui/SpatialImage";
import { ROUNDED_CLASSNAME } from "@/shared/ui/frame-constants";
import { routes } from "@/shared/lib/site-config";
import { useMagneticPull } from "@/shared/lib/useMagneticPull";
import type { Work } from "@/features/works/works-data";

const EASE = [0.65, 0, 0.35, 1] as const; // the site's one shared easing curve, see STANDARDS.md

// y pushed way up (was 24) so the "scroll in from bottom" motion actually reads, not just a fade/blur appear.
// Deliberately "linear" here, not the shared EASE: the slow-then-fast ease-in-out read wrong for this slide-up specifically.
export const WORK_TILE_REVEAL: Variants = {
  hidden: { opacity: 0, y: 96, filter: "blur(4px)" },
  // delay holds it at hidden after the early trigger, so scroll has time to catch up and the slide-up is actually visible, not already finished off-screen.
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, delay: 0.5, ease: "linear" } },
};

// Whole tile is one link, one hover state owned by the outer element (see STANDARDS.md motion
// philosophy): drives the image scale and the leading icon/arrow reveal together.
export function WorkTile({ work }: { work: Work }) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [edge, setEdge] = useState<HoverEdge>("bottom");
  const [entryPoint, setEntryPoint] = useState<{ x: number; y: number } | null>(null);
  const magnetic = useMagneticPull(imageRef, { disabled: !!shouldReduceMotion });

  const readEdge = (clientY: number, rect: DOMRect): HoverEdge => (clientY < rect.top + rect.height / 2 ? "top" : "bottom");

  const handleEnter = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setEdge(readEdge(event.clientY, rect));
    // Captured synchronously, not via a later pointermove — SpatialImage's WebGL setup is async.
    setEntryPoint({ x: event.clientX, y: event.clientY });
    setHovered(true);
  };

  const handleLeave = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setEdge(readEdge(event.clientY, rect));
    setHovered(false);
  };

  // Always ink, never text-primary on hover: once the arrow slot holds each project's own brand-colored icon mark, a blue title next to it would clash.
  const resolvedTitleClassName = "font-display text-3xl font-bold leading-tight text-ink sm:text-4xl";

  return (
    <motion.div
      initial={shouldReduceMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0, margin: "0px 0px 400px 0px" }}
      variants={WORK_TILE_REVEAL}
    >
      <Link
        ref={ref}
        href={routes.workDetail(work.slug)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="group block"
      >
        <motion.div
          ref={imageRef}
          style={{ x: magnetic.x, y: magnetic.y }}
          className={`relative aspect-[4/3] overflow-hidden bg-ink/5 ${ROUNDED_CLASSNAME}`}
        >
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
            {work.depthImage && (
              <SpatialImage src={work.image} depthSrc={work.depthImage} active={hovered} entryPoint={entryPoint} />
            )}
          </motion.div>
        </motion.div>

        {/* Category/tag placement (top-left of title, or a chip on the image) still undecided, left out for now. */}
        <div className="mt-6">
          <div className="flex items-center">
            <motion.span
              aria-hidden
              className="inline-flex shrink-0 items-center justify-start overflow-hidden"
              animate={{ width: hovered ? 56 : 0, opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <motion.span className="inline-flex" animate={{ x: hovered ? 0 : -8 }} transition={{ duration: 0.3, ease: EASE }}>
                {work.icon ? (
                  <Image src={work.icon} alt="" width={28} height={28} className="size-6 sm:size-7" />
                ) : (
                  <Icon icon="solar:arrow-right-line-duotone" className="size-6 text-primary sm:size-7" />
                )}
              </motion.span>
            </motion.span>
            <DirectionalHoverText hovered={hovered} edge={edge} className={resolvedTitleClassName}>
              {work.title}
            </DirectionalHoverText>
          </div>
          <p className="mt-2 text-sm text-ink/70 sm:text-base">{work.summary}</p>
        </div>
      </Link>
    </motion.div>
  );
}

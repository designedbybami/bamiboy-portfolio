"use client";

import { motion, useReducedMotion } from "motion/react";
import { TickFrame } from "@/shared/ui/TickFrame";
import { PrincipleMotif } from "./PrincipleMotif";
import type { principlesCopy } from "../copy";

type PrincipleItem = (typeof principlesCopy)["items"][number];

type PrincipleRowProps = {
  item: PrincipleItem;
  index: number;
};

const EASE = [0.65, 0, 0.35, 1] as const; // the site's one shared easing curve, see STANDARDS.md

// Subtitle is plain prose for most items, or a segment list when a word needs its own bold/italic
// inline (e.g. quoting "Kairos" itself, in Greek, mid-sentence) rather than one markdown parse pass.
function Subtitle({ subtitle }: { subtitle: PrincipleItem["subtitle"] }) {
  if (typeof subtitle === "string") return <>{subtitle}</>;

  return (
    <>
      {subtitle.map((segment, i) => {
        if ("bold" in segment && segment.bold) return <strong key={i} className="font-semibold text-ink">{segment.text}</strong>;
        if ("italic" in segment && segment.italic) return <em key={i}>{segment.text}</em>;
        return <span key={i}>{segment.text}</span>;
      })}
    </>
  );
}

// One color-block per principle: reference inspo/wearecheck-about-strategy-section.png for the
// structure (own tinted panel, a tag, a big headline, a doodle accent). Each block runs its own
// ambient motif continuously (see PrincipleMotif), not gated behind hover, hover only deepens the
// tint a little as a small interactive touch. Tag reuses TickFrame, the same corner-bracket badge as
// Hero's "Open to roles" badge, colored per principle instead of the shimmering white, so the two
// read as one family. Content order is tooltip (tag) -> title (headline) -> subtitle, with the two
// borrowed lines (Koro Sensei, Layi Wasabi) carrying their own attribution line instead of being
// folded into the subtitle prose.
export function PrincipleRow({ item, index }: PrincipleRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const rgb = item.accent;

  return (
    <motion.div
      initial={{ backgroundColor: `rgba(${rgb},0.05)` }}
      whileHover={{ backgroundColor: `rgba(${rgb},0.14)` }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative overflow-hidden px-6 py-16 sm:px-12 sm:py-24"
    >
      <span className="absolute left-6 top-6 text-xs text-ink/30 sm:left-12 sm:top-8">{String(index + 1).padStart(2, "0")}</span>

      {!shouldReduceMotion && <PrincipleMotif id={item.id} rgb={rgb} />}

      {/* Doodle accent: placeholder geometry, not final art. */}
      <div aria-hidden className="pointer-events-none absolute right-6 top-10 hidden sm:right-12 sm:block md:top-16">
        <svg width="88" height="72" viewBox="0 0 88 72" fill="none">
          <circle cx="12" cy="12" r="7" stroke={`rgb(${rgb})`} strokeWidth="2" />
          <path d="M60 8 L70 18 M70 8 L60 18" stroke={`rgb(${rgb})`} strokeWidth="2" strokeLinecap="round" />
          <circle cx="78" cy="50" r="5" fill={`rgb(${rgb})`} fillOpacity="0.5" />
          <path d="M8 44 Q 40 30 76 30" stroke={`rgb(${rgb})`} strokeWidth="1.5" strokeDasharray="1 6" strokeLinecap="round" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-start gap-6">
        <TickFrame>
          <span className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: `rgb(${rgb})` }}>
            {item.tag}
          </span>
        </TickFrame>

        {item.kanji ? (
          <div className="flex items-baseline gap-4">
            <span className="font-display text-6xl font-bold leading-none text-ink sm:text-7xl md:text-8xl">{item.kanji}</span>
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink/50 sm:text-sm">{item.headline}</span>
          </div>
        ) : (
          <h3 className="max-w-2xl font-display text-4xl font-bold leading-[1.08] tracking-normal text-ink sm:text-5xl md:text-6xl">
            {item.headline}
          </h3>
        )}

        {item.subtitle && (
          <p className="max-w-md text-sm leading-relaxed text-ink/70 sm:text-base">
            <Subtitle subtitle={item.subtitle} />
          </p>
        )}

        {item.attribution && <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink/40">{item.attribution}</p>}
      </div>
    </motion.div>
  );
}

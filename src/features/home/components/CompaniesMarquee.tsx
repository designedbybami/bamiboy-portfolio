import { DraftLine } from "@/shared/ui/DraftLine";
import { SITE_FRAME_INSET } from "@/shared/ui/frame-constants";
import { companiesCopy } from "../copy";

const EDGE_FADE = "linear-gradient(to right, transparent 0%, black 30%, black 70%, transparent 100%)";

// Doubled track for a seamless loop: `marquee` (globals.css) shifts exactly -50%, one full set width.
const track = [...companiesCopy.names, ...companiesCopy.names];

export function CompaniesMarquee() {
  return (
    <section className="relative flex flex-col bg-paper pt-6 sm:pt-8">
      <p className="mx-auto mb-4 text-center text-xs font-medium uppercase tracking-[0.14em] text-ink/50">
        {companiesCopy.eyebrow}
      </p>

      <div
        className="overflow-hidden"
        style={{ marginLeft: SITE_FRAME_INSET, marginRight: SITE_FRAME_INSET, maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
      >
        <div className="flex w-max animate-[marquee_28s_linear_infinite] items-center gap-16 will-change-transform motion-reduce:animate-none">
          {track.map((name, index) => (
            <span key={`${name}-${index}`} className="shrink-0 font-display text-3xl font-bold text-ink/25 sm:text-4xl">
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <DraftLine />
      </div>
    </section>
  );
}

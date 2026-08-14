import { BackToTop } from "@/features/home/components/BackToTop";
import { FooterCTA } from "@/features/home/components/FooterCTA";
import { FooterMeta, FooterTimezone } from "@/features/home/components/FooterMeta";
import { FooterPlayground } from "@/features/home/components/FooterPlayground";
import { FooterWordmark } from "@/features/home/components/FooterWordmark";
import { ShaderBackground } from "@/shared/ui/ShaderBackground";
import { footerBackgroundPreset, footerPanelPreset } from "@/features/home/shader-presets";
import { footerCopy } from "@/features/home/copy";

// Root-layout-level, so it's site-wide (every route), not homepage-only — it's the natural
// closing bookend to Hero's dark opening. Structure, top to bottom:
//   Made with love / Timezone            <- top-left, above the physics layer
//                Title/CTA
//   [physics environment, the WHOLE body above, edge to edge — not a confined strip]
//   [shader, full 100vw width, rounded top corners, DesignedbyBami masked inside, copyright on it]
// The physics layer and the meta/CTA text share one stacking context, the same
// "content floats over a full-bleed play area" shape Hero's StickerField already uses: a hard
// throw travels the whole body and visibly passes behind the CTA rather than being walled off in
// its own strip.
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-ink">
      <ShaderBackground components={footerBackgroundPreset} className="absolute inset-0 h-full w-full" fallbackClassName="bg-ink" />

      {/* pointer-events-none all the way down this whole block, re-enabled only on the one thing
          that's actually interactive (the CTA link): a child opting out of hit-testing doesn't
          stop its own ANCESTORS from still catching the hit — an ancestor geometrically covers
          the same area regardless of what its children do, so setting this on only the text
          itself (or even just its direct row) still left this outermost wrapper as the thing
          silently blocking ChromaFlow underneath everywhere nothing else explicitly opted back
          in. Every ancestor in the chain needs it, not just the leaf. */}
      <div className="pointer-events-none relative flex min-h-[600px] w-full flex-col justify-center px-6 pb-32 pt-10 sm:min-h-[720px] sm:pb-40 sm:px-10">
        <FooterPlayground className="absolute inset-0" />

        <div className="relative z-10 flex justify-between">
          <FooterMeta />
          <FooterTimezone />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
          <p className="text-center text-sm uppercase tracking-wide text-white/50 sm:text-base">{footerCopy.eyebrow}</p>
          <div className="pointer-events-auto overflow-hidden px-4">
            <FooterCTA />
          </div>
        </div>
      </div>

      <div className="relative h-56 w-full overflow-hidden rounded-t-[2.5rem] sm:h-72">
        <ShaderBackground
          components={footerPanelPreset}
          className="absolute inset-0 h-full w-full"
          fallbackClassName="bg-gradient-to-br from-ink via-primary to-primary-soft"
        />
        <div className="relative flex h-full items-center justify-center px-6">
          <FooterWordmark />
        </div>
        <span className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-xs text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] sm:bottom-10">
          {footerCopy.copyright}
        </span>
      </div>

      <BackToTop />
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { trackEvent } from "@/shared/lib/analytics";
import { routes, siteConfig } from "@/shared/lib/site-config";
import { useScrolled } from "@/shared/lib/useScrolled";
import { useSoundToggle } from "@/shared/lib/useSoundToggle";
import { WAVE_DOWN_PATH, WAVE_FLAT_PATH, WAVE_UP_PATH, WAVE_WIGGLE_DURATION } from "@/shared/lib/wave-path";
import { Button } from "@/shared/ui/Button";
import { DirectionalHoverText, type HoverEdge } from "@/shared/ui/DirectionalHoverText";
import { DirectionalLinkRow } from "@/shared/ui/DirectionalLinkRow";
import { MenuToggleIcon } from "@/shared/ui/MenuToggleIcon";
import { ScatterText } from "@/shared/ui/ScatterText";
import { NAV_CONTAINER_CLASSNAME, NAV_MAX_WIDTH_CLASSNAME, NAV_SCROLL_OFFSET } from "./nav-layout";
import { SoundToggle } from "./SoundToggle";

const links = [
  { href: routes.works, label: "Works" },
  { href: routes.about, label: "About" },
  { href: routes.playground, label: "Playground" },
];

// Get in touch has no special button chrome here, just another line in the same list.
const mobileLinks = [...links, { href: `mailto:${siteConfig.email}`, label: "Get in touch" }];

// Same directional text-roll as Button/DirectionalHoverText, one hover state owned here (the Link) driving which edge the roll enters from.
function NavLink({ href, label, className }: { href: string; label: string; className: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const [edge, setEdge] = useState<HoverEdge>("bottom");

  const handleEnter = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setEdge(event.clientY < rect.top + rect.height / 2 ? "top" : "bottom");
    setHovered(true);
  };

  return (
    <Link ref={ref} href={href} onMouseEnter={handleEnter} onMouseLeave={() => setHovered(false)}>
      <DirectionalHoverText hovered={hovered} edge={edge} className={className}>
        {label}
      </DirectionalHoverText>
    </Link>
  );
}

const LAYOUT_TRANSITION = { type: "spring", stiffness: 300, damping: 30 } as const; // shared by every layout-driven element so the bar morphs as one motion

const EXIT_LAYOUT_DELAY = 0.32; // holds the bar's resize until the fill has mostly retreated, or it balloons wide before the fill catches up (see STANDARDS.md)

function barTransition(scrolled: boolean) {
  return { ...LAYOUT_TRANSITION, delay: scrolled ? 0 : EXIT_LAYOUT_DELAY };
}

const SCROLLED_PUSH_DOWN = 14; // clears the fixed FrameGuides hairline instead of crowding it

// Grows from the toggle's approximate position (top-right, where it sits) to cover the
// whole screen, same clip-path-circle technique as Button's cursor-anchored fill. Not the
// nav pill's own abandoned circle sweep (see STANDARDS.md), that failure was specific to
// a small, repeatedly-toggled inline pill fighting Motion's `layout` projection; this is
// a one-directional full-screen takeover with no `layout` prop anywhere in its tree, a
// different failure surface. Percentage anchor rather than a JS-measured pixel point:
// simpler, and close enough to the button's real position to read as coming from it.
const MOBILE_OVERLAY_ORIGIN = "100% 0%";
const MOBILE_OVERLAY_TRANSITION = { duration: 0.6, ease: [0.65, 0, 0.35, 1] } as const;

const TRAIL_TRAVEL_SECONDS = 16;
const TRAIL_PAUSE_SECONDS = 3;
const TRAIL_CYCLE_SECONDS = TRAIL_TRAVEL_SECONDS + TRAIL_PAUSE_SECONDS;
const TRAIL_FADE_IN_SECONDS = 1;
const TRAIL_FADE_OUT_SECONDS = 1.6;
// Each successive lap starts further along the perimeter than the last, not the same
// spot every time, so it reads as continuously progressing rather than a fixed respawn
// point. `offset-distance` on a closed path (this pill is one) wraps modulo the path's
// total length per the CSS Motion Path spec, so "133%" is simply "33% with one extra lap
// of raw distance already travelled", not a distinct, separately-computed segment. Once
// this whole multi-lap sequence completes, Motion's own `repeat: Infinity` restarts it
// from the top (back to true 0%), so it's not a never-repeating scheme, just one long
// enough that "always the same spot" isn't what a viewer actually perceives.
const TRAIL_LAP_START_OFFSETS = [0, 33, 66];

/**
 * Builds the multi-lap `offsetDistance`/`opacity` keyframe + `times` arrays described
 * above, computed rather than hand-typed: each lap gets a travel segment (fade in, hold,
 * fade out, matching TRAIL_FADE_IN/OUT_SECONDS within TRAIL_TRAVEL_SECONDS) followed by a
 * pause segment where position holds flat (an explicit repeated keyframe, otherwise
 * Motion would interpolate movement straight through the "pause" up to the next lap's
 * start) while opacity stays at 0 (already established by the previous fade-out).
 */
function buildTrailKeyframes(startOffsets: number[]) {
  const totalSeconds = startOffsets.length * TRAIL_CYCLE_SECONDS;
  const offsetDistance: string[] = [];
  const offsetTimes: number[] = [];
  const opacity: number[] = [];
  const opacityTimes: number[] = [];

  startOffsets.forEach((start, i) => {
    const cycleStart = i * TRAIL_CYCLE_SECONDS;
    const travelEnd = cycleStart + TRAIL_TRAVEL_SECONDS;
    // Just short of the actual pause end, on purpose: the *next* segment's own start
    // keyframe lands exactly at pauseEnd (= its own cycleStart), and Motion requires
    // strictly increasing `times`, two keyframes can't share one instant. The snap from
    // this held value to the next lap's start happens in that tiny gap, invisible since
    // opacity is 0 throughout it.
    const holdEnd = cycleStart + TRAIL_CYCLE_SECONDS - 0.05;

    offsetDistance.push(`${start}%`, `${start + 100}%`, `${start + 100}%`);
    offsetTimes.push(cycleStart / totalSeconds, travelEnd / totalSeconds, holdEnd / totalSeconds);

    opacity.push(0, 1, 1, 0);
    opacityTimes.push(
      cycleStart / totalSeconds,
      (cycleStart + TRAIL_FADE_IN_SECONDS) / totalSeconds,
      (travelEnd - TRAIL_FADE_OUT_SECONDS) / totalSeconds,
      travelEnd / totalSeconds,
    );
  });

  return { offsetDistance, offsetTimes, opacity, opacityTimes, totalSeconds };
}

const TRAIL_KEYFRAMES = buildTrailKeyframes(TRAIL_LAP_START_OFFSETS);

// Rest-state text/border uses `mix-blend-difference` per element (not inherited from a parent) since sections can set their own background now; see STANDARDS.md.
export function SiteNav() {
  const scrolled = useScrolled(NAV_SCROLL_OFFSET);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundRowHovered, setSoundRowHovered] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const { playing: soundPlaying, toggle: toggleSound, audioRef: soundAudioRef, fadeOutDuration: soundFadeOutDuration } = useSoundToggle();

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: scrolled ? SCROLLED_PUSH_DOWN : 0, opacity: 1 }}
        transition={{ y: LAYOUT_TRANSITION, opacity: { duration: 0.6, ease: "easeOut" } }}
        className="fixed inset-x-0 top-6 z-50"
      >
        <motion.div
          layout
          transition={barTransition(scrolled)}
          className={`mx-auto flex items-center justify-center gap-3 ${NAV_CONTAINER_CLASSNAME}`}
        >
          <motion.nav
            layout
            transition={barTransition(scrolled)}
            className={`relative flex w-full items-center justify-between transition-colors duration-300 ${
              scrolled ? "max-w-3xl gap-6 rounded-full py-2.5 pl-5 pr-2.5 text-paper" : `${NAV_MAX_WIDTH_CLASSNAME} gap-10 rounded-none px-1 py-4`
            }`}
          >
            {/* Dark pill: left-to-right sweep on entrance, mirrored on exit. Always rounded-full, never square (see STANDARDS.md). */}
            <motion.div
              layout
              aria-hidden
              initial={false}
              animate={{ opacity: scrolled ? 1 : 0 }}
              transition={{ layout: barTransition(scrolled), opacity: { duration: 0.5, ease: [0.65, 0, 0.35, 1] } }}
              className="absolute inset-0 -z-10 overflow-hidden rounded-full border border-white/10 shadow-lg shadow-ink/20 backdrop-blur-md"
            >
              <span
                aria-hidden
                className={`absolute inset-0 origin-left bg-ink/90 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${
                  scrolled ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </motion.div>

            {/* Traveling light trail, scrolled state only: a short streak with a built-in
                gradient tail (transparent to white, along its own length) travels the
                pill's actual perimeter, slowly, with a pause between laps, via
                `offset-path: border-box` (follows the element's own border-radius
                directly, arc-length-based so it moves at a constant pace regardless of
                straight vs. curved regions) plus `offset-rotate: auto` (keeps the streak
                tangent to the path through the corners instead of snapping orientation).
                `offset-anchor: 50% 50%` (not a manually margin-shifted point, an earlier
                version's mistake) keeps the element's own visual center as the pivot.
                That narrowed the bug but didn't fully close it: sampling
                `getBoundingClientRect()` across the full 0 to 100% range (not just
                spot-checking a few frames) still showed the streak's box extending a few
                px outside the pill specifically while transiting the two curved caps,
                this browser's handling of the corner segment's own percentage
                parameterization, not something fixable by tuning anchor/margin further.
                The `overflow-hidden` wrapper below is the actual fix: clip the streak to
                the pill's exact silhouette so residual imprecision at the caps is never
                visible, regardless of its root cause. Earlier shapes (a rotating
                conic-gradient, then a plain dot) are documented in STANDARDS.md: the
                conic-gradient had a real structural flaw (angle-based brightness reads as
                invisible on a wide, mostly-straight pill), the dot just wasn't the
                requested shape. */}
            <motion.div
              aria-hidden
              className="absolute inset-0 -z-10 overflow-hidden rounded-full motion-reduce:hidden"
              initial={false}
              animate={{ opacity: scrolled ? 1 : 0 }}
              transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
            >
              {/* Opacity is keyed to the SAME lap cycle as offsetDistance (fade in over
                  the first ~6% of the loop, hold, fade out over the last ~10%, landing at
                  0 right as it reaches 100%), not left at a constant 1. Without this, the
                  streak sat visibly frozen at its start position for the entire
                  `repeatDelay` pause between laps, since Motion's loop repeat snaps the
                  position back instantly but there was nothing making it disappear first.
                  This way it genuinely exits before each pause and a fresh one fades in to
                  start the next lap, rather than a static shape just sitting there. */}
              <motion.div
                className="absolute left-0 top-0 rounded-full"
                style={{
                  width: 40,
                  height: 1.5,
                  background: "linear-gradient(to right, transparent, rgba(255,255,255,0.8) 70%, #ffffff 100%)",
                  offsetPath: "border-box",
                  offsetRotate: "auto",
                  offsetAnchor: "50% 50%",
                }}
                animate={{ offsetDistance: TRAIL_KEYFRAMES.offsetDistance, opacity: TRAIL_KEYFRAMES.opacity }}
                transition={{
                  offsetDistance: { duration: TRAIL_KEYFRAMES.totalSeconds, times: TRAIL_KEYFRAMES.offsetTimes, repeat: Infinity, ease: "linear" },
                  opacity: { duration: TRAIL_KEYFRAMES.totalSeconds, times: TRAIL_KEYFRAMES.opacityTimes, repeat: Infinity, ease: "linear" },
                }}
              />
            </motion.div>

            <Link
              href={routes.home}
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              className="relative"
            >
              <ScatterText
                text={siteConfig.logoText}
                hovered={logoHovered}
                className={`font-display text-lg font-semibold tracking-wide ${scrolled ? "text-paper" : "text-white mix-blend-difference"}`}
              />
            </Link>

            <motion.ul
              layout
              transition={barTransition(scrolled)}
              className={`hidden items-center text-sm font-medium sm:flex ${scrolled ? "gap-7" : "gap-10"}`}
            >
              {links.map((link) => (
                <li key={link.href}>
                  <NavLink
                    href={link.href}
                    label={link.label}
                    className={`transition-colors duration-500 ${
                      scrolled ? "text-paper/80 hover:text-paper" : "text-white/70 mix-blend-difference hover:text-white"
                    }`}
                  />
                </li>
              ))}
            </motion.ul>

            {/* Get in touch stays sm+ only: on mobile it swaps for the boxes toggle below,
                which opens a full-screen menu carrying both the nav links (Works/About/
                Playground, otherwise unreachable below `sm`) and this same CTA as text. */}
            <div className="hidden sm:block" onClick={() => trackEvent({ event: "contact_click", cta_location: "site_nav" })}>
              <Button
                layout
                layoutTransition={barTransition(scrolled)}
                href={`mailto:${siteConfig.email}`}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-500 ${
                  scrolled ? "border-transparent bg-primary" : "border-white/40 mix-blend-difference bg-transparent hover:border-white"
                }`}
                textClassName={scrolled ? "text-white" : "text-white mix-blend-difference"}
                hoverBg={scrolled ? "bg-primary-soft" : "bg-white"}
                hoverText={scrolled ? undefined : "text-ink"}
              >
                Get in touch
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className={`relative inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 sm:hidden ${
                scrolled ? "text-paper hover:bg-white/10" : "text-white mix-blend-difference"
              }`}
            >
              <MenuToggleIcon open={mobileMenuOpen} className="size-5" />
            </button>
          </motion.nav>

          <SoundToggle playing={soundPlaying} onToggle={toggleSound} />
        </motion.div>
      </motion.header>

      {/* Single shared audio element: desktop icon and mobile row both drive the same useSoundToggle state, called once here. */}
      <audio ref={soundAudioRef} src="/audio/nav-loop.mp3" loop preload="metadata" />

      {/* Sibling of motion.header, not nested: header's own animated y gives it a transform, which would become the containing block for this overlay's fixed inset-0 if nested inside it. */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-nav-overlay"
            initial={{ clipPath: `circle(0% at ${MOBILE_OVERLAY_ORIGIN})` }}
            animate={{ clipPath: `circle(150% at ${MOBILE_OVERLAY_ORIGIN})` }}
            exit={{ clipPath: `circle(0% at ${MOBILE_OVERLAY_ORIGIN})` }}
            transition={MOBILE_OVERLAY_TRANSITION}
            className="fixed inset-0 z-40 flex flex-col justify-center gap-12 bg-ink px-8 py-24 sm:hidden"
          >
            <nav className="flex flex-col gap-9">
              {mobileLinks.map((link) => (
                <DirectionalLinkRow
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    if (link.label === "Get in touch") trackEvent({ event: "contact_click", cta_location: "site_nav_mobile" });
                    closeMenu();
                  }}
                  typographyClassName="font-display text-4xl font-bold"
                  textColorClassName="text-paper"
                >
                  {link.label}
                </DirectionalLinkRow>
              ))}
            </nav>

            <button
              type="button"
              onClick={toggleSound}
              onMouseEnter={() => setSoundRowHovered(true)}
              onMouseLeave={() => setSoundRowHovered(false)}
              onFocus={() => setSoundRowHovered(true)}
              onBlur={() => setSoundRowHovered(false)}
              className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/10 px-4 py-4 text-left"
            >
              {/* Whole-container sweep, same left-to-right scale-x technique as the nav
                  pill's own fill — not just the text, the row's entire background. Text/
                  icon switch to white against it rather than also going blue, blue-on-blue
                  would be illegible. */}
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 origin-left bg-primary transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none group-active:scale-x-100 ${
                  soundRowHovered ? "scale-x-100" : "scale-x-0"
                }`}
              />
              <span
                className={`relative z-10 text-lg font-medium transition-colors duration-300 motion-reduce:transition-none ${
                  soundRowHovered ? "text-white" : "text-paper/80"
                }`}
              >
                {soundPlaying ? "Sounds On" : "Sounds Off"}
              </span>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className={`relative z-10 shrink-0 transition-colors duration-300 motion-reduce:transition-none group-active:text-white ${
                  soundRowHovered ? "text-white" : "text-paper/80"
                }`}
              >
                <motion.path
                  d={WAVE_FLAT_PATH}
                  animate={{ d: soundPlaying ? [WAVE_UP_PATH, WAVE_DOWN_PATH] : WAVE_FLAT_PATH }}
                  transition={
                    soundPlaying
                      ? { duration: WAVE_WIGGLE_DURATION, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
                      : { duration: soundFadeOutDuration / 1000, ease: "easeInOut" }
                  }
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

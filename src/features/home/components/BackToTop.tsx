"use client";

import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const SHOW_AFTER_PX = 600; // roughly one viewport of scroll before the FAB earns its screen space
const TARGET_SECTION_ID = "featured-work";

// A real floating action button: fixed to the viewport, appears once there's meaningfully far to
// scroll, available from anywhere on the page. Lands on the Featured Work section, not the very
// top of the page (past Hero) — this is a "see more" nudge, not a literal top-of-page reset.
// `#featured-work` only exists on the homepage; other routes fall back to navigating there.
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    const target = document.getElementById(TARGET_SECTION_ID);
    if (target) {
      target.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
    } else {
      router.push(`/#${TARGET_SECTION_ID}`);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label="Back to Featured Work"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8, y: visible ? 0 : 12 }}
      transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      className="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-colors duration-300 hover:bg-primary-soft motion-reduce:transition-none sm:bottom-8 sm:right-8"
    >
      <Icon icon="solar:arrow-up-line-duotone" aria-hidden className="size-6" />
    </motion.button>
  );
}

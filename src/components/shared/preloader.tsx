"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";

// ─── Timing ───────────────────────────────────────────────────────────────────
// Signature  : delay 0.2s · duration 1.4s → visible at ~1.6s
// Squiggly   : starts at 1.3s (slight overlap) · duration 1.0s → done at ~2.3s
// Exit       : curtain slides up at 2.5s · duration 0.8s → onComplete at ~3.3s
const T_SQUIGGLY_START = 1300;
const T_EXIT           = 2500;

const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [isExiting,    setIsExiting]    = useState(false);
  const [drawSquiggly, setDrawSquiggly] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDrawSquiggly(true), T_SQUIGGLY_START);
    const t2 = setTimeout(() => setIsExiting(true),    T_EXIT);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-portfolio-bg"
      animate={{ y: isExiting ? "-100%" : "0%" }}
      transition={{ duration: 0.8, ease: EASE }}
      onAnimationComplete={() => { if (isExiting) onComplete(); }}
    >
      {/*
        Outer wrapper fixes the layout width so self-end on the squiggly
        aligns its right edge with the signature's right edge (≈ where "i" in Bami sits).
      */}
      <div className="flex flex-col w-[280px] md:w-[380px]">

        {/* ── Signature: sweeps left → right ── */}
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
        >
          <Image
            src="/images/system/signature-loader.svg"
            alt="Designed by Bami"
            width={547}
            height={99}
            priority
            className="w-full h-auto"
          />
        </motion.div>

        {/*
          ── Squiggly line: draws top → bottom ──
          Positioned self-end so its right edge aligns with the signature's right edge.
          scaleX(-1) mirrors the SVG horizontally — the path's start point (x≈11, near the
          SVG left) becomes x≈192, near the right edge, connecting to the "i" of Bami.
          A small negative margin-top pulls it up to close the gap between the two SVGs.
        */}
        <motion.div
          className="self-end overflow-hidden"
          style={{ marginTop: "-6px", marginRight: "2px" }}
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: drawSquiggly ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
          transition={{ duration: 1.0, ease: EASE }}
        >
          <Image
            src="/images/system/squiggly-line-loader.svg"
            alt=""
            aria-hidden="true"
            width={203}
            height={789}
            priority
            className="w-[52px] md:w-[68px] h-auto"
            style={{ transform: "scaleX(-1)" }}
          />
        </motion.div>

      </div>
    </motion.div>
  );
}

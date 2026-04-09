"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { SIG_PATHS } from "./signature-paths";

const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];

type SegmentKind = "fill" | "stroke";

type SignatureSegment = {
  ids: readonly string[];
  kind: SegmentKind;
  delay: number;
  duration: number;
};

const SIGNATURE_SEGMENTS: readonly SignatureSegment[] = [
  { ids: ["D"], kind: "fill", delay: 0.12, duration: 0.74 },
  { ids: ["E"], kind: "fill", delay: 0.56, duration: 0.24 },
  { ids: ["S"], kind: "fill", delay: 0.66, duration: 0.24 },
  { ids: ["G"], kind: "fill", delay: 0.78, duration: 0.26 },
  { ids: ["I"], kind: "stroke", delay: 0.94, duration: 0.26 },
  { ids: ["N"], kind: "fill", delay: 1.04, duration: 0.24 },
  { ids: ["E_2"], kind: "fill", delay: 1.16, duration: 0.24 },
  { ids: ["B"], kind: "fill", delay: 1.28, duration: 0.22 },
  { ids: ["D_2"], kind: "fill", delay: 1.4, duration: 0.22 },
  { ids: ["Y"], kind: "fill", delay: 1.5, duration: 0.22 },
  { ids: ["B_1", "B_2"], kind: "fill", delay: 1.62, duration: 0.34 },
  { ids: ["a"], kind: "fill", delay: 1.84, duration: 0.26 },
  { ids: ["m"], kind: "fill", delay: 1.98, duration: 0.3 },
  { ids: ["i"], kind: "stroke", delay: 2.16, duration: 0.32 },
] as const;

const SQUIGGLY_DURATION = 1.05;
const EXIT_DURATION = 0.9;

const SQUIGGLY_D =
  "M11.001 34.7262C10.9509 35.0182 11.0158 35.3193 11.1844 35.5638C11.3529 35.8083 11.6108 35.9762 11.902 36.0305C12.1931 36.0849 12.4943 36.0214 12.7397 35.8541C12.9851 35.6869 13.1542 35.4294 13.2128 35.139C13.2128 35.139 13.2128 35.139 13.2128 35.139C15.4011 21.887 24.161 10.7206 36.3507 5.44125C42.2595 2.3721 49.0502 2.77763 52.9499 7.9062C56.9515 12.7901 58.9525 19.4461 60.4554 25.9926C64.4617 44.9799 64.47 64.818 64.8025 84.5003C67.0341 131.346 -9.64779 139.702 1.01803 196.954C18.7162 245.336 86.5288 220.945 95.187 261.729C95.187 261.729 95.187 261.729 95.187 261.729C103.233 299.928 32.81 307.23 42.4033 356.262C55.4129 390.637 107.322 374.503 108.663 407.817C107.346 427.908 95.7138 456.206 72.3037 451.952C72.3036 451.952 72.3036 451.952 72.3036 451.952C57.2496 449.539 47.968 434.799 46.2136 420.26C44.3676 412.2 50.7925 405.622 58.6298 404.605C66.359 403.184 74.5297 404.201 82.3035 406.015C97.6736 409.886 113.365 416.974 122.974 429.174C143.404 458.02 123.436 507.396 89.2558 510.68C67.1351 513.165 49.4565 496.434 39.4226 476.988C25.1447 453.624 62.6265 443.134 86.1894 441.624C112.016 439.804 139.837 442.45 161.717 453.75C183.156 464.315 190.742 487.664 185.61 511.211C176.674 553.567 150.369 592.371 126.413 630.736C120.65 640.054 110.498 646.497 99.6931 653.84C89.1702 660.409 75.9685 673.776 77.335 689.493C77.3364 695.001 79.5898 701.693 84.2023 705.791C88.7204 709.944 94.0115 711.74 98.8631 712.922C108.657 715.14 117.964 715.158 127.094 715.456C143.984 716.199 167.809 715.155 168.058 731.995C168.129 733.629 168.097 735.182 167.946 736.735C164.867 763.214 128.354 767.005 109.353 786.597C109.141 786.801 109.012 787.079 108.999 787.374C108.985 787.669 109.088 787.957 109.285 788.175C109.481 788.393 109.757 788.524 110.052 788.541C110.347 788.558 110.636 788.458 110.861 788.268C110.861 788.268 110.861 788.268 110.861 788.268C129.907 769.863 167.011 771.24 174.732 737.59C175.014 735.69 175.146 733.813 175.155 731.87C175.28 726.739 173.399 720.707 169.276 716.798C165.231 712.84 160.218 710.88 155.505 709.547C145.984 706.997 136.649 706.582 127.545 705.919C110.511 704.758 87.3283 703.566 88.8788 689.373C87.5871 666.526 121.36 663.035 137.801 638.129C162.568 599.941 190.074 561.618 200.362 513.923C207.128 487.976 195.262 452.641 168.497 441.115C141.614 428.024 112.92 426.616 84.9994 429.193C71.0142 430.828 56.9382 433.613 43.7632 440.835C37.3563 444.506 30.6265 449.71 27.4889 458.031C24.2817 466.439 26.9341 475.486 30.7913 481.878C41.7886 502.152 64.3524 522.205 89.958 518.185C131.372 511.428 148.99 458.201 126.24 426.691C115.076 413.405 98.9475 406.892 82.9642 403.114C74.8838 401.405 66.4538 400.454 58.1233 402.104C54.0396 402.968 49.7337 404.654 46.8279 408.116C43.8589 411.572 43.2763 416.431 44.0003 420.605C45.8972 435.543 55.9175 451.391 71.9102 453.913C71.9102 453.913 71.9102 453.913 71.9102 453.913C97.6041 458.261 109.559 428.726 111.551 408.048C112.708 400.191 108.236 391.651 101.489 387.611C94.9132 383.28 87.6308 380.969 80.6268 378.46C66.9444 373.698 51.4165 368.058 47.8105 354.604C37.9593 314.69 108.232 310.275 103.027 260.136C103.027 260.136 103.027 260.136 103.027 260.136C87.1681 209.424 19.5021 235.115 8.19582 194.911C-4.27027 149.033 71.1107 137.273 70.4114 84.3649C69.6992 64.6666 69.328 44.6552 64.717 24.9894C62.952 18.169 60.8322 11.1697 55.8867 5.36032C51.064 -1.04817 40.995 -1.2938 34.8632 2.42398C22.1571 8.21182 12.7439 21.0184 11.001 34.7262Z";

function toMs(seconds: number) {
  return Math.round(seconds * 1000);
}

function renderFillSegment(segment: SignatureSegment) {
  return (
    <g key={segment.ids.join("-")}>
      {segment.ids.map((id) => (
        <g key={id}>
          <motion.path
            d={SIG_PATHS[id].d}
            fill="none"
            stroke="black"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: 0 }}
            transition={{
              pathLength: {
                duration: segment.duration,
                ease: EASE,
                delay: segment.delay,
              },
              opacity: {
                duration: 0.14,
                ease: EASE,
                delay: segment.delay + segment.duration * 0.7,
              },
            }}
          />
          <motion.path
            id={id}
            d={SIG_PATHS[id].d}
            fill="black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: segment.duration * 0.32,
              ease: EASE,
              delay: segment.delay + segment.duration * 0.54,
            }}
          />
        </g>
      ))}
    </g>
  );
}

function renderStrokeSegment(segment: SignatureSegment) {
  const id = segment.ids[0];
  const path = SIG_PATHS[id];
  const strokeLinecap =
    (path.strokeLinecap as "round" | "inherit" | "butt" | "square" | undefined) ?? "round";

  return (
    <motion.path
      key={id}
      id={id}
      d={path.d}
      fill="none"
      stroke={path.stroke ?? "black"}
      strokeWidth={path.strokeWidth ?? "6"}
      strokeLinecap={strokeLinecap}
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: {
          duration: segment.duration,
          ease: EASE,
          delay: segment.delay,
        },
        opacity: {
          duration: 0.01,
          delay: segment.delay,
        },
      }}
    />
  );
}

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const prefersReducedMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const [drawSquiggly, setDrawSquiggly] = useState(false);
  const responsiveStyle = {
    "--preloader-width": "min(88vw, 620px)",
    "--preloader-tail-width": "clamp(48px, 11vw, 82px)",
  } as CSSProperties;

  const timeline = useMemo(() => {
    const lastSegment = SIGNATURE_SEGMENTS[SIGNATURE_SEGMENTS.length - 1];
    const signatureEnd = lastSegment.delay + lastSegment.duration;
    const squigglyStart = signatureEnd - 0.02;
    const exitStart = squigglyStart + SQUIGGLY_DURATION * 0.72;

    return {
      squigglyStartMs: toMs(prefersReducedMotion ? 0.25 : squigglyStart),
      exitStartMs: toMs(prefersReducedMotion ? 0.45 : exitStart),
      segmentMultiplier: prefersReducedMotion ? 0 : 1,
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const squigglyTimer = setTimeout(() => setDrawSquiggly(true), timeline.squigglyStartMs);
    const exitTimer = setTimeout(() => setIsExiting(true), timeline.exitStartMs);

    return () => {
      clearTimeout(squigglyTimer);
      clearTimeout(exitTimer);
    };
  }, [timeline.exitStartMs, timeline.squigglyStartMs]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-portfolio-bg px-5 sm:px-8"
      initial={false}
      animate={{
        y: isExiting ? "-100%" : "0%",
        opacity: 1,
      }}
      transition={{
        duration: prefersReducedMotion ? 0.35 : EXIT_DURATION,
        ease: EASE,
      }}
      onAnimationComplete={() => {
        if (isExiting) onComplete();
      }}
    >
      <motion.div
        className="flex flex-col w-[var(--preloader-width)] max-w-[var(--preloader-width)]"
        style={responsiveStyle}
        initial={false}
        animate={{
          scale: isExiting ? 0.92 : 1,
          x: isExiting ? 18 : 0,
          y: isExiting ? -110 : 0,
          opacity: isExiting ? 0.98 : 1,
        }}
        transition={{
          duration: prefersReducedMotion ? 0.2 : 0.72,
          ease: EASE,
        }}
      >
        <div className="relative w-full">
          <svg
            viewBox="0 0 547 99"
            width="100%"
            height="auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Designed by Bami"
            role="img"
          >
            {SIGNATURE_SEGMENTS.map((segment) => {
              const effectiveSegment = {
                ...segment,
                delay: segment.delay * timeline.segmentMultiplier,
                duration: prefersReducedMotion ? 0.01 : segment.duration,
              };

              return effectiveSegment.kind === "stroke"
                ? renderStrokeSegment(effectiveSegment)
                : renderFillSegment(effectiveSegment);
            })}
          </svg>
        </div>

        <motion.div
          className="self-end overflow-hidden w-[var(--preloader-tail-width)]"
          style={{
            width: "var(--preloader-tail-width)",
            marginTop: "clamp(-6px, -1vw, -3px)",
            marginRight: "clamp(2px, 0.5vw, 4px)",
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: drawSquiggly ? 1 : 0,
            y: drawSquiggly && !prefersReducedMotion ? [0, 8, -18, -48] : 0,
          }}
          transition={{
            opacity: {
              duration: 0.01,
            },
            y: {
              duration: prefersReducedMotion ? 0.01 : SQUIGGLY_DURATION,
              ease: EASE,
            },
          }}
          >
          <svg
            viewBox="0 0 203 789"
            width="100%"
            height="auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ transform: "scaleX(-1)", display: "block" }}
          >
            <motion.path
              id="line"
              d={SQUIGGLY_D}
              fill="none"
              stroke="black"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: drawSquiggly ? 1 : 0 }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : SQUIGGLY_DURATION,
                ease: EASE,
              }}
            />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

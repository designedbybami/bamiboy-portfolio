"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import DraggableItem from "@/components/shared/draggable-item";
import { SKIP_HOME_PRELOADER_KEY } from "@/components/shared/preloader-keys";
import TransitionLink from "@/components/shared/transition-link";
import Preloader from "@/components/shared/preloader";

export default function Home() {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreloader, setShowPreloader] = useState(false);

  useEffect(() => {
    const shouldSkip = window.sessionStorage.getItem(SKIP_HOME_PRELOADER_KEY) === "true";

    if (shouldSkip) {
      window.sessionStorage.removeItem(SKIP_HOME_PRELOADER_KEY);
    }

    setShowPreloader(!shouldSkip);
    setIsLoading(!shouldSkip);
  }, []);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
    setIsLoading(false);
  };

  const stack = [
    { name: "Figma",          src: "/images/stickers/figma.svg",          position: "top-[8%]    left-[1%]   md:top-[15%] md:left-[20%]"   },
    { name: "Framer",         src: "/images/stickers/framer.svg",         position: "top-[55%]   left-[0%]   md:top-[65%] md:left-[15%]"   },
    { name: "Claude",         src: "/images/stickers/claude.svg",         position: "top-[12%]   right-[1%]  md:top-[20%] md:right-[20%]"  },
    { name: "Gemini",         src: "/images/stickers/gemini.svg",         position: "top-[48%]   right-[0%]  md:top-[55%] md:right-[15%]"  },
    { name: "Rive",           src: "/images/stickers/rive.svg",           position: "bottom-[8%] left-[6%]   md:bottom-[15%] md:left-[30%]" },
    { name: "Codex",          src: "/images/stickers/codex.svg",          position: "bottom-[8%] right-[6%]  md:bottom-[20%] md:right-[30%]" },
    { name: "Paper",          src: "/images/stickers/paper.svg",          position: "top-[30%]   left-[0%]   md:top-[40%] md:left-[8%]"   },
    { name: "Unicorn Studio", src: "/images/stickers/unicorn-studio.svg", position: "top-[34%]   right-[0%]  md:top-[40%] md:right-[8%]"  },
  ];

  return (
    <main
      ref={arenaRef}
      className="min-h-screen bg-portfolio-bg text-portfolio-text flex flex-col items-center justify-center px-4 py-8 sm:p-8 overflow-hidden relative"
    >
      {/* Preloader Overlay */}
      {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#0A192F_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

      {/* Draggable Stickers */}
      {stack.map((item, index) => (
        <DraggableItem
          key={index}
          src={item.src}
          alt={item.name}
          className={item.position}
          containerRef={arenaRef}
        />
      ))}

      {/* Hero Section — slots into view once the preloader exits */}
      <motion.div
        className="z-10 flex flex-col items-center pointer-events-none"
        initial={{ y: 50, rotateX: 8, opacity: 0 }}
        animate={isLoading ? { y: 50, rotateX: 8, opacity: 0 } : { y: 0, rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        style={{ transformPerspective: 1200 }}
      >
        <motion.div
          className="mb-8 sm:mb-10 md:mb-12 pointer-events-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={isLoading ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
        >
          <Image
            src="/images/system/nav-logo-static.svg"
            alt="Bami Logo"
            width={200}
            height={60}
            className="w-40 sm:w-48 md:w-56 h-auto object-contain"
            style={{ filter: "brightness(0)" }}
          />
        </motion.div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center tracking-tight pointer-events-auto max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          Crafting intuitive, fun, and delightful experiences.
        </h1>

        <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg max-w-sm sm:max-w-lg text-center font-sans pointer-events-auto">
          Hey, I am Bami. I design products that feel as good as they look. Full case studies are currently in the oven 🍳, but feel free to play around with my stack or learn more about the chef below 👨🏾‍🍳✨.
        </p>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 w-full sm:w-auto pointer-events-auto">
          <button className="px-5 py-2.5 sm:px-6 sm:py-3 font-sans rounded-full border-2 border-portfolio-text/20 text-portfolio-text/50 cursor-not-allowed text-sm sm:text-base">
            My Works (Coming Soon)
          </button>
          {/*
            TransitionLink intercepts the click, draws the SVG transition,
            fires router.push("/about") mid-cover, then erases to reveal.
          */}
          <TransitionLink
            href="/about"
            className="px-5 py-2.5 sm:px-6 sm:py-3 font-sans rounded-full bg-portfolio-text text-portfolio-bg hover:bg-portfolio-accent hover:scale-105 active:scale-95 transition-all text-sm sm:text-base"
          >
            About Me
          </TransitionLink>
        </div>
      </motion.div>
    </main>
  );
}

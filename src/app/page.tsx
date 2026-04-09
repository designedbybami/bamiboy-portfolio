"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import DraggableItem from "@/components/shared/draggable-item";
import TransitionLink from "@/components/shared/transition-link";
import Preloader from "@/components/shared/preloader";

export default function Home() {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const stack = [
    { name: "Figma", src: "/images/stickers/figma.svg", position: "top-[10%] left-[10%] md:top-[15%] md:left-[20%]" },
    { name: "Framer", src: "/images/stickers/framer.svg", position: "top-[60%] left-[5%] md:top-[65%] md:left-[15%]" },
    { name: "Claude", src: "/images/stickers/claude.svg", position: "top-[15%] right-[10%] md:top-[20%] md:right-[20%]" },
    { name: "Gemini", src: "/images/stickers/gemini.svg", position: "top-[50%] right-[5%] md:top-[55%] md:right-[15%]" },
    { name: "Rive", src: "/images/stickers/rive.svg", position: "bottom-[10%] left-[20%] md:bottom-[15%] md:left-[30%]" },
    { name: "Codex", src: "/images/stickers/codex.svg", position: "bottom-[15%] right-[20%] md:bottom-[20%] md:right-[30%]" },
    { name: "Paper", src: "/images/stickers/paper.svg", position: "top-[30%] left-[2%] md:top-[40%] md:left-[8%]" },
    { name: "Unicorn Studio", src: "/images/stickers/unicorn-studio.svg", position: "top-[35%] right-[2%] md:top-[40%] md:right-[8%]" },
  ];

  return (
    <main
      ref={arenaRef}
      className="min-h-screen bg-portfolio-bg text-portfolio-text flex flex-col items-center justify-center p-8 overflow-hidden relative"
    >
      {/* Preloader Overlay */}
      <Preloader onComplete={() => setIsLoading(false)} />

      {/* Navigation Logo */}
      <div className="absolute top-8 left-8 z-50 pointer-events-auto">
        <Image
          src="/images/system/nav-logo-static.svg"
          alt="Bami Logo"
          width={48}
          height={48}
          className="object-contain"
        />
      </div>

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
        <h1 className="font-display text-4xl md:text-6xl font-bold text-center tracking-tight pointer-events-auto">
          Crafting intuitive, fun, <br /> and delightful experiences.
        </h1>

        <p className="mt-6 text-lg max-w-lg text-center font-sans pointer-events-auto">
          Hey, I am Bami. I design products that feel as good as they look. Full case studies are currently in the oven 🍳, but feel free to play around with my stack or learn more about the chef below 👨🏾‍🍳✨.
        </p>

        {/* Call-to-Action Buttons */}
        <div className="flex gap-4 mt-8 pointer-events-auto">
          <button className="px-6 py-3 font-sans rounded-full border-2 border-portfolio-text/20 text-portfolio-text/50 cursor-not-allowed">
            My Works (Coming Soon)
          </button>
          {/*
            TransitionLink intercepts the click, draws the SVG transition,
            fires router.push("/about") mid-cover, then erases to reveal.
          */}
          <TransitionLink
            href="/about"
            className="px-6 py-3 font-sans rounded-full bg-portfolio-text text-portfolio-bg hover:bg-portfolio-accent hover:scale-105 active:scale-95 transition-all"
          >
            About Me
          </TransitionLink>
        </div>
      </motion.div>
    </main>
  );
}

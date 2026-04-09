"use client";

import TransitionLink from "@/components/shared/transition-link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-portfolio-bg text-portfolio-text flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
          About Me
        </h1>
        <p className="text-lg max-w-lg font-sans opacity-70">
          This is where your about page content will live.
        </p>
        {/* Back button — also uses the transition */}
        <TransitionLink
          href="/"
          className="mt-4 px-6 py-3 font-sans rounded-full bg-portfolio-text text-portfolio-bg hover:scale-105 active:scale-95 transition-all"
        >
          Back Home
        </TransitionLink>
      </div>
    </main>
  );
}

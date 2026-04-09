"use client";

import { SKIP_HOME_PRELOADER_KEY } from "@/components/shared/preloader-keys";
import TransitionLink from "@/components/shared/transition-link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-portfolio-bg text-portfolio-text flex flex-col items-center justify-center px-4 py-8 sm:p-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          About Me
        </h1>
        <p className="text-sm sm:text-base md:text-lg max-w-sm sm:max-w-lg font-sans opacity-70">
          This is where your about page content will live.
        </p>
        {/* Back button — also uses the transition */}
        <TransitionLink
          href="/"
          onClick={() => window.sessionStorage.setItem(SKIP_HOME_PRELOADER_KEY, "true")}
          className="mt-4 px-5 py-2.5 sm:px-6 sm:py-3 font-sans rounded-full bg-portfolio-text text-portfolio-bg hover:scale-105 active:scale-95 transition-all text-sm sm:text-base"
        >
          Back Home
        </TransitionLink>
      </div>
    </main>
  );
}

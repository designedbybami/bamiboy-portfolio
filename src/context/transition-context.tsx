"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransitionPhase = "idle" | "entering" | "covering" | "revealing";

interface TransitionContextValue {
  phase: TransitionPhase;
  /** Call this instead of router.push — it drives the full transition sequence */
  navigate: (href: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TransitionContext = createContext<TransitionContextValue>({
  phase: "idle",
  navigate: () => {},
});

// ─── Timing (ms) ─────────────────────────────────────────────────────────────
//
//  0ms    → click → phase: "entering"   (path draws 0→1, covering screen)
//  850ms  → phase: "covering"           (fully drawn → router.push fires)
//  1100ms → phase: "revealing"          (new page mounted → path erases 1→0)
//  1950ms → phase: "idle"               (erase complete, transition done)
//
//  Keep T_COVER in sync with DRAW_DURATION in page-transition.tsx (850ms).

const T_COVER = 850;
const T_REVEAL = 1100;
const T_DONE = 1950;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const router = useRouter();
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Scroll-lock the page during any active phase
  useEffect(() => {
    document.body.style.overflow = phase !== "idle" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [phase]);

  const navigate = useCallback(
    (href: string) => {
      // Double-click guard
      if (busy.current) return;
      busy.current = true;

      // Clear any lingering timers from a previous transition
      timers.current.forEach(clearTimeout);
      timers.current = [];

      setPhase("entering");

      const t1 = setTimeout(() => {
        setPhase("covering");
        router.push(href);
      }, T_COVER);

      const t2 = setTimeout(() => {
        setPhase("revealing");
      }, T_REVEAL);

      const t3 = setTimeout(() => {
        setPhase("idle");
        busy.current = false;
      }, T_DONE);

      timers.current = [t1, t2, t3];
    },
    [router]
  );

  return (
    <TransitionContext.Provider value={{ phase, navigate }}>
      {children}
    </TransitionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const usePageTransition = () => useContext(TransitionContext);

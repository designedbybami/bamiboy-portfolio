"use client";

import type { ReactNode } from "react";

// Pass-through for now — route transition logic (View Transitions / Motion) hooks in here.
export function TransitionProvider({ children }: { children: ReactNode }) {
  return children;
}

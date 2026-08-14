"use client";

import { useEffect, useState } from "react";

const FOOTER_TIMEZONE = "Africa/Lagos"; // Nigeria (content hub's Location), GMT+1, no DST

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: FOOTER_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
});

// Client-only: server-rendered time would immediately mismatch the visitor's own clock tick,
// same SSR/first-paint-determinism reasoning as StickerField's randomized layout (STANDARDS.md #1).
export function useLiveTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(timeFormatter.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

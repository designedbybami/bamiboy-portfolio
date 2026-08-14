"use client";

import { useLiveTime } from "@/shared/lib/useLiveTime";
import { footerCopy } from "../copy";

type FooterMetaProps = {
  className?: string;
};

// Top-left: made-with-love only now. Timezone/live-time moved to its own top-right
// `FooterTimezone` component. No socials here either — the playground's clickable,
// brand-colored, labeled chips replace that row.
export function FooterMeta({ className = "" }: FooterMetaProps) {
  return <span className={`text-xs text-white/40 ${className}`}>{footerCopy.madeWith}</span>;
}

// Top-right counterpart to FooterMeta.
export function FooterTimezone({ className = "" }: FooterMetaProps) {
  const time = useLiveTime();

  return (
    <div className={`flex items-center gap-2 text-xs text-white/60 ${className}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-primary" />
      <span>
        {footerCopy.location} · {footerCopy.timezoneLabel}
      </span>
      {time ? <span className="tabular-nums text-white/40">{time}</span> : null}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/shared/lib/analytics";

type TrackWorkViewProps = {
  slug: string;
  projectName: string;
  projectType: string;
  presentationType: "case_study" | "showcase";
};

// Renders nothing, fires work_view once per distinct slug. WorkDetailView itself stays a server component.
export function TrackWorkView({ slug, projectName, projectType, presentationType }: TrackWorkViewProps) {
  const lastTrackedSlug = useRef<string | null>(null);

  useEffect(() => {
    // Guards against React Strict Mode's mount/cleanup/mount dev double-invoke firing this twice for the same slug.
    if (lastTrackedSlug.current === slug) return;
    lastTrackedSlug.current = slug;

    trackEvent({ event: "work_view", project_name: projectName, project_type: projectType, presentation_type: presentationType });
  }, [slug, projectName, projectType, presentationType]);

  return null;
}

"use client";

import { useEffect } from "react";
import { trackEvent } from "@/shared/lib/analytics";

type TrackCaseStudyViewProps = {
  projectName: string;
  projectType: string;
};

// Renders nothing, fires case_study_view once per mount. Split out since WorkDetailView itself stays a server component.
export function TrackCaseStudyView({ projectName, projectType }: TrackCaseStudyViewProps) {
  useEffect(() => {
    trackEvent({ event: "case_study_view", project_name: projectName, project_type: projectType });
  }, [projectName, projectType]);

  return null;
}

type AnalyticsEvent =
  | { event: "work_view"; project_name: string; project_type: string; presentation_type: "case_study" | "showcase" }
  | { event: "linkedin_click"; cta_location: string }
  | { event: "contact_click"; cta_location: string }
  | { event: "social_click"; social_platform: string; cta_location: "footer" };

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

// Pushes to GTM's dataLayer, no-ops server-side/before GTM has initialized it. Event taxonomy: docs/analytics-measurement-spec.md.
export function trackEvent(payload: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}

// Placeholder data, replace with real case study content.
export type PresentationType = "case_study" | "showcase";

export type Work = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  image: string;
  /** Grayscale depth map for the WorkTile spatial-hover shader; falls back to a plain image when absent. Regenerate via scripts/generate-depth-map.mjs whenever `image` changes. */
  depthImage?: string;
  /** Project's own brand icon mark, shown in place of the generic hover arrow once set; falls back to the arrow when absent. */
  icon?: string;
  /** GA4 dimension via work_view, keep values consistent across the dataset. */
  projectType: string;
  /** GA4 dimension via work_view, exact "case_study" | "showcase" only, see docs/analytics-measurement-spec.md. */
  presentationType: PresentationType;
};

export const works: Work[] = [
  {
    slug: "khaime",
    title: "Khaime",
    summary: "AI-powered commerce platform.",
    tags: ["AI Commerce", "Product Design", "Design Systems"],
    image: "/images/works/item-1.jpg",
    depthImage: "/images/works/depth/item-1.png",
    projectType: "AI Commerce",
    presentationType: "case_study",
  },
  {
    slug: "fardelins",
    title: "Fardelins",
    summary: "B2B logistics management platform.",
    tags: ["B2B Logistics", "Founding Design", "Product Design"],
    image: "/images/works/item-2.jpg",
    depthImage: "/images/works/depth/item-2.png",
    projectType: "B2B Logistics",
    presentationType: "case_study",
  },
  {
    slug: "kikai",
    title: "Kikai",
    summary: "AI-powered opportunity workspace.",
    tags: ["AI Career Tools", "Concept", "Brand"],
    image: "/images/works/item-3.jpg",
    depthImage: "/images/works/depth/item-3.png",
    projectType: "AI Career Tools",
    presentationType: "case_study",
  },
  {
    slug: "leadsprofile",
    title: "LeadsProfile",
    summary: "Lead distribution and management platform.",
    tags: ["B2B", "Lead Management", "Product Design"],
    image: "/images/works/item-4.jpg",
    depthImage: "/images/works/depth/item-4.png",
    projectType: "B2B",
    // docs/bami-content-hub.md lists LeadsProfile under "showcase-level detail, full case-study depth wasn't gathered", not the planned Khaime/Kikai/Fardelins case studies.
    presentationType: "showcase",
  },
];

export function getWorkBySlug(slug: string): Work | undefined {
  return works.find((work) => work.slug === slug);
}

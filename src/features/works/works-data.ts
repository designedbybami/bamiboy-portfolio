// Placeholder data, replace with real case study content.
export type Work = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  image: string;
};

export const works: Work[] = [
  {
    slug: "khaime",
    title: "Khaime",
    summary: "AI-powered commerce platform.",
    tags: ["AI Commerce", "Product Design", "Design Systems"],
    image: "/images/works/item-1.jpg",
  },
  {
    slug: "fardelins",
    title: "Fardelins",
    summary: "B2B logistics management platform.",
    tags: ["B2B Logistics", "Founding Design", "Product Design"],
    image: "/images/works/item-2.jpg",
  },
  {
    slug: "kikai",
    title: "Kikai",
    summary: "AI-powered opportunity workspace.",
    tags: ["AI Career Tools", "Concept", "Brand"],
    image: "/images/works/item-3.jpg",
  },
  {
    slug: "leadsprofile",
    title: "LeadsProfile",
    summary: "Lead distribution and management platform.",
    tags: ["B2B", "Lead Management", "Product Design"],
    image: "/images/works/item-4.jpg",
  },
];

export function getWorkBySlug(slug: string): Work | undefined {
  return works.find((work) => work.slug === slug);
}

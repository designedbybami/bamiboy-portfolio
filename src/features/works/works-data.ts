// Placeholder data — replace with real case study content.
export type Work = {
  slug: string;
  title: string;
  summary: string;
};

export const works: Work[] = [
  { slug: "khaime", title: "Khaime", summary: "AI-powered commerce platform." },
  { slug: "fardelins", title: "Fardelins", summary: "B2B logistics management platform." },
  { slug: "kikai", title: "Kikai", summary: "AI-powered opportunity workspace." },
];

export function getWorkBySlug(slug: string): Work | undefined {
  return works.find((work) => work.slug === slug);
}

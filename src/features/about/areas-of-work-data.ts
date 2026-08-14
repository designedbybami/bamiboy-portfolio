// Labels grounded in docs/bami-content-hub.md, one project behind each. Only 4 placeholder
// images exist so they cycle, swap for real case-study frames once picked.
export type AreaOfWork = {
  label: string;
  image: string;
};

const PLACEHOLDER_IMAGES = ["/images/works/item-1.jpg", "/images/works/item-2.jpg", "/images/works/item-3.jpg", "/images/works/item-4.jpg"];

const LABELS = [
  "E-commerce", // Khaime
  "B2B", // Fardelins, LeadsProfile
  "AI Products", // Khaime's KAI assistant, Kikai
  "SaaS", // Khaime, Fardelins, LeadsProfile, ClipQC
  "Logistics", // Fardelins courier/dispatch
  "Fintech", // YourCreditpal
  "Healthtech", // Matacare, MyTherapist.ng
  "Career Tech", // Kikai
  "Lead Management", // LeadsProfile
  "Creator Economy", // Earngage
];

export const areasOfWork: AreaOfWork[] = LABELS.map((label, index) => ({
  label,
  image: PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length],
}));

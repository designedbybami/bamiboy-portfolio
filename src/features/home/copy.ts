import { siteConfig } from "@/shared/lib/site-config";

// Hero copy, drafted against docs/bami-content-hub.md. Swap freely, nothing else depends on exact wording.
export const heroCopy = {
  badge: "Open to roles & freelancing",
  headline: "I make designs to be felt, not just seen.",
  ctaLabel: "Say hello",
  speechBubble: ["Hey friend 🤗,", `I am ${siteConfig.name} M.`],
  nameTag: { name: `${siteConfig.name} M.`, role: "Senior Product Designer" },
} as const;

// Drawn from the content hub's "throughline" paragraph, not invented.
export const aboutTeaserCopy = {
  headline: "I design products end-to-end and obsess over motion and interaction, I want you to feel what you use, not just look at it.",
} as const;

// Companies from the content hub's Career Timeline, real employers only (not client projects).
export const companiesCopy = {
  eyebrow: "Companies I've worked with",
  names: ["Khaime AI", "Fardelins", "Chuuse", "Matacare", "CodeGarage Africa"],
} as const;

export const featuredWorkCopy = {
  eyebrow: "Selected work",
  headline: "Featured Work",
  description: "A few products I've shaped end to end, from early decisions down to the small interaction details.",
  viewAllLabel: "View all work",
} as const;

// Straight from the content hub's "he's open to new roles and to freelancing" line and identity
// section (Location: Nigeria). ctaLabel/ctaHref echo Hero's own "Say hello" mailto CTA.
export const footerCopy = {
  eyebrow: "Open to new roles, freelance work, and good conversations.",
  ctaLabel: "Let's work together",
  ctaLines: ["Let's work", "together"] as const, // rendered as two explicit lines, not left to wrap naturally
  ctaHref: `mailto:${siteConfig.email}`,
  location: "Nigeria",
  timezoneLabel: "GMT+1",
  madeWith: "Made with ❤️ in Next.js, Motion, and a lot of coffee.",
  copyright: `© ${new Date().getFullYear()} ${siteConfig.name}`,
} as const;

// Brand colors, used for the playground's clickable social chips (each in its own real brand
// color, not the site's monochrome icon treatment). Handle/URL varies per platform (not every
// platform uses @bamiboy_), each confirmed directly rather than assumed from the others.
export const footerSocials = [
  { label: "LinkedIn", href: "https://linkedin.com/in/akinadeboluwatife", icon: "/images/socials/linkedin.svg", brandColor: "#0A66C2" },
  { label: "Twitter", href: "https://x.com/bamiboy_", icon: "/images/socials/x.svg", brandColor: "#000000" },
  { label: "TikTok", href: "https://www.tiktok.com/@bami.boy", icon: "/images/socials/tiktok.svg", brandColor: "#000000" },
  { label: "YouTube", href: "https://www.youtube.com/@DesignedbyBami", icon: "/images/socials/youtube.svg", brandColor: "#FF0000" },
  { label: "Instagram", href: "https://instagram.com/bamiboy_", icon: "/images/socials/instagram.svg", brandColor: "#E1306C" },
  { label: "GitHub", href: "https://github.com/designedbybami", icon: "/images/socials/github.svg", brandColor: "#181717" },
] as const;

// `accent` is an "r,g,b" triplet (not a hex/Tailwind token) so it can be dropped straight into an
// rgba() string for the block tint, tag, and motif without a conversion step. Structure per item is
// tooltip (tag) -> title (headline) -> subtitle, with `attribution` for the two that are someone
// else's words, not Bami's own. `subtitle` is either plain prose or a list of segments when a word
// needs its own bold/italic treatment inline (e.g. quoting "Kairos" itself, in Greek, mid-sentence).
export const principlesCopy = {
  eyebrow: "What I hold onto",
  headline: "Principles",
  items: [
    {
      id: "ichigo-ichie",
      kanji: "一期一会",
      tag: "The Moment",
      accent: "232,122,143",
      headline: "Ichigo Ichie",
      subtitle: [
        { text: "One encounter, one chance. The idea that this exact moment will never happen again, the same belief behind " },
        { text: "Kairos", bold: true },
        { text: " (" },
        { text: "καιρός", italic: true },
        { text: "), the Greek word for when timing and readiness meet. I carry it into Kikai: recognizing the right opportunity and acting at the right moment." },
      ],
      attribution: null,
    },
    {
      id: "clarity",
      kanji: null,
      tag: "Design",
      accent: "30,94,255",
      headline: "Clarity over cleverness",
      subtitle: "A product that needs an explanation has already lost the user. I'd rather cut a feature than caption it.",
      attribution: null,
    },
    {
      id: "anime-line",
      kanji: null,
      tag: "Resolve",
      accent: "209,69,61",
      headline: "“Those who can't learn from the past are bound to repeat it.”",
      subtitle:
        "A teacher who never stopped teaching, even facing his own ending. I keep a running list of decisions that didn't work, so I'm not solving the same problem twice.",
      attribution: "Koro Sensei, Assassination Classroom",
    },
    {
      id: "applied-knowledge",
      kanji: null,
      tag: "Practice",
      accent: "199,144,32",
      headline: "Info lẹ́yàn fi ń fò",
      subtitle: [
        { text: "Information can take you places, but knowing alone isn't enough. What matters is what you do with what you know: " },
        { text: "the proof of knowledge is demonstration", bold: true },
        { text: "." },
      ],
      attribution: "Layi Wasabi",
    },
    {
      id: "perception",
      kanji: null,
      tag: "Motion",
      accent: "108,80,224",
      headline: "We don't just see, we perceive",
      subtitle:
        "How something moves is how the brain decides if it's real. That's the whole premise behind AR and VR, and it's why I sweat over easing curves the same way I sweat over layout.",
      attribution: null,
    },
  ],
} as const;

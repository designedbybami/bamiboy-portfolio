export const siteConfig = {
  name: "Boluwatife Akinade",
  shortName: "Bami",
  title: "Bami — Product Designer",
  description: "Portfolio of Boluwatife Akinade (Bami) — product designer crafting digital experiences with motion and interaction.",
  url: "https://bamiboy.com",
} as const;

export const routes = {
  home: "/",
  about: "/about",
  works: "/works",
  workDetail: (slug: string) => `/works/${slug}`,
  playground: "/playground",
} as const;

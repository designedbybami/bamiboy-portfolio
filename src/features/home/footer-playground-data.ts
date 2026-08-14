export type PlaygroundChip = {
  id: string;
  label: string;
  icon?: string; // Solar icon for hobby chips
  image?: string; // brand-mark art for social chips
  color: string; // chip's own accent (hobbies: a personal color per hobby; socials: their real brand color)
  href?: string; // socials only — chip becomes a real clickable link, not just a physics toy
  width: number;
  height: number;
  alwaysVisible?: boolean; // shown on mobile too; see StickerField's identical convention
};

// From the content hub's Hobbies & Personal section, real ones only (not old bios' mechanical
// keyboards/photography/content-creation, which are explicitly *not* his). Colors here are just
// personal-accent picks, not drawn from any source. Social chips share `footerSocials`'
// data/brand colors and are real links (open on click, not just drag toys) — swapped in for the
// earlier Figma/Claude tool-logo stickers.
export const PLAYGROUND_HOBBY_CHIPS: PlaygroundChip[] = [
  { id: "anime", label: "Anime", icon: "solar:clapperboard-play-line-duotone", color: "#E1306C", width: 128, height: 44, alwaysVisible: true },
  { id: "swimming", label: "Swimming", icon: "solar:swimming-line-duotone", color: "#1E9BFF", width: 148, height: 44, alwaysVisible: true },
  { id: "reading", label: "Reading", icon: "solar:book-2-line-duotone", color: "#F2A900", width: 140, height: 44, alwaysVisible: true },
];

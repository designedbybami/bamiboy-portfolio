// Shared inset so SiteFrame's rails and DraftLine's per-section lines align to the same grid.
export const SITE_FRAME_INSET = 20;

// Shared edge padding for full-bleed sections, not narrow max-w reading columns like Hero/AboutTeaser.
export const SECTION_PADDING_CLASSNAME = "px-6 sm:px-24";

// Standard corner radius for rounded UI (buttons, image tiles), not the sharp-cornered frame/tick grid.
export const ROUNDED_CLASSNAME = "rounded-2xl";

// Blend-mode-difference source color, near-black so it resolves to a light gray line on a white page.
export const FRAME_BLEND_COLOR = "rgb(37,37,37)";

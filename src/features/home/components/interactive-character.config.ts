// Tuning values for InteractiveCharacter, in px/deg. Rig sourced from docs/character description.md, all layers share one 1024x1536 canvas.
export const CHARACTER_CONFIG = {
  ASPECT_RATIO: 1024 / 1536,

  HEAD_X_LEFT: 1.5, // asymmetric: right read fine, left read too far
  HEAD_X_RIGHT: 3,
  HEAD_Y: 5,
  HEAD_SMOOTHING: 0.08,

  BLINK_MIN_MS: 2500,
  BLINK_MAX_MS: 6000,
  BLINK_CLOSE_MS: 100,
  BLINK_HOLD_MS: 20,
  BLINK_OPEN_MS: 100,
  DOUBLE_BLINK_CHANCE: 0.15,

  IDLE_Y: 1.5,
  IDLE_DURATION_S: 4,

  PRISM_UP_PX: 8, // asymmetric bob, rises further than it falls
  PRISM_DOWN_PX: 3,
  PRISM_DURATION_S: 3,
  PRISM_MAGNET_X: 16, // drifts away from the pointer, opposite direction
  PRISM_MAGNET_Y: 10,
  PRISM_SMOOTHING: 0.06,
} as const;

// Back-to-front DOM order, reverse of the rig doc's "Z-order, top -> bottom" list.
export const CHARACTER_LAYERS = [
  "body-base-bottom",
  "head-base",
  "eyes-open",
  "left-blink-lid",
  "right-blink-lid",
  "glasses-front",
  "body-base-top",
  "prism",
] as const;

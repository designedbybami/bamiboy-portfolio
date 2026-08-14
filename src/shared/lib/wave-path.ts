// Shared between SoundToggle's icon and the mobile menu's "Sounds On/Off" row so both
// draw the exact same wiggle. Four matching cubic segments in every state (identical
// command structure) so Motion can interpolate continuously between them without a snap.
export const WAVE_FLAT_PATH = "M3 12 C5 12 5 12 8 12 C11 12 11 12 12 12 C13 12 13 12 16 12 C19 12 19 12 21 12";
export const WAVE_UP_PATH = "M3 12 C5 12 5 4 8 4 C11 4 11 12 12 12 C13 12 13 20 16 20 C19 20 19 12 21 12";
export const WAVE_DOWN_PATH = "M3 12 C5 12 5 20 8 20 C11 20 11 12 12 12 C13 12 13 4 16 4 C19 4 19 12 21 12";
export const WAVE_WIGGLE_DURATION = 4.4;

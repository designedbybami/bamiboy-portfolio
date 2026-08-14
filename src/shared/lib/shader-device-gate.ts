// Bandwidth/CPU decision, not a "does it run smoothly" one: a device can render the shader fine
// and still not be able to afford downloading ~360KB of WebGPU/Three.js for a decorative effect.
export function deviceCanAffordShader(): boolean {
  if (typeof navigator === "undefined") return true;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  if (nav.connection?.saveData) return false;
  const effectiveType = nav.connection?.effectiveType;
  if (effectiveType === "2g" || effectiveType === "slow-2g") return false;

  // deviceMemory is GiB; under 4 is low-end and struggles with WebGPU.
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;

  return true;
}

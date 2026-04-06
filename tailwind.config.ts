import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        portfolio: {
          bg: "#F4F0E6",      // Warm Off-White Sandbox background
          text: "#0A192F",    // Deep Navy
          accent: "#2F80ED",  // Electric Royal Blue (for SVG wipe)
          dossier: "#E6C28A", // Manila Folder base
        }
      },
    },
  },
  plugins: [],
};
export default config;

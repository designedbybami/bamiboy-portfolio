import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-satoshi)', 'sans-serif'], // Sets Satoshi as the default body font
        display: ['var(--font-clash)', 'sans-serif'], // Creates a custom class for headers
      },
      colors: {
        portfolio: {
          bg: "#F4F0E6",      
          text: "#0A192F",    
          accent: "#2F80ED",  
          dossier: "#E6C28A", 
        }
      },
    },
  },
  plugins: [],
};
export default config;
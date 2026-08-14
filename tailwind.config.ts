import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0908',
        paper: '#ffffff',
        primary: {
          DEFAULT: '#1e5eff',
          soft: '#5a87ff',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        hand: ['var(--font-hand)', 'cursive'],
      },
    },
  },
  plugins: [],
}
export default config

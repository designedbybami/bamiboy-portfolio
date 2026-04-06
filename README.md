# Bamiboy Portfolio | Interactive Sandbox Edition 👨🏾‍🍳✨

A high-end, two-page interactive "coming soon" portfolio acting as a playable sandbox. Designed to immediately demonstrate high-level interaction, motion design, and product thinking before full case studies are published.

## 🌟 Core Features

* **The Sandbox (Home):** A physics-enabled, interactive playground where users can drag, toss, and collide "die-cut" stickers of my core tech stack.
* **The Transition:** A custom, full-screen SVG wipe masking animation that smoothly bridges the two pages.
* **The Dossier (About):** A highly tactile, skeuomorphic 3D digital folder. Features chronological tabs, page-flip audio feedback, and Framer Motion layout shifts.

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS
* **Animation Engine:** Framer Motion
* **Audio Handling:** `use-sound`
* **Typography:** Custom `.woff2` local hosting (Clash Display & Satoshi)
* **Assets:** Fully optimized SVGs for infinite scaling and zero-lag physics processing.

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
# Note: Includes framer-motion and use-sound
```

Then, run the development server:
```bash
npm run dev
```

Open http://localhost:3000 with your browser to see the live sandbox.

## 📂 Architecture Note
This V1 project utilizes a lightweight lib/data.ts structure to handle the dynamic content mapping for the Dossier tabs. V2 will integrate a Headless CMS (like Sanity.io or MDX) to manage full-length case study generation.

---
*Designed & Engineered by Bami.*
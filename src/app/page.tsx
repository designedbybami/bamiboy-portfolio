export default function Home() {
  return (
    <main className="min-h-screen bg-portfolio-bg text-portfolio-text flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <h1 className="text-4xl md:text-6xl font-bold z-10 text-center">
        Crafting intuitive, fun, <br /> and delightful experiences.
      </h1>
      <p className="mt-6 text-lg max-w-lg text-center z-10">
        Hey, I'm Bami. I design products that feel as good as they look. Full case studies are currently in the oven 🍳, but feel free to play around with my stack or learn more about the chef below 👨🏾‍🍳✨.
      </p>
      
      {/* Buttons placeholder */}
      <div className="flex gap-4 mt-8 z-10">
        <button className="px-6 py-3 rounded-full border-2 border-portfolio-text/20 text-portfolio-text/50 cursor-not-allowed">
          My Works (Coming Soon)
        </button>
        <button className="px-6 py-3 rounded-full bg-portfolio-text text-portfolio-bg hover:bg-portfolio-accent transition-colors">
          About Me
        </button>
      </div>
    </main>
  );
}

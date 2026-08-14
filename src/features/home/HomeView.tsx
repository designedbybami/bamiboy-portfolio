import { AboutTeaser } from "./AboutTeaser";
import { CompaniesMarquee } from "./components/CompaniesMarquee";
import { FeaturedWork } from "./FeaturedWork";
import { Hero } from "./Hero";
import { Principles } from "./Principles";

export function HomeView() {
  return (
    <>
      <Hero />
      <AboutTeaser />
      <FeaturedWork />
      <CompaniesMarquee />
      <Principles />
    </>
  );
}
